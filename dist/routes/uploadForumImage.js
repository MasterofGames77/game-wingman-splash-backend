"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const formidable_1 = __importDefault(require("formidable"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
const imageModeration_1 = require("../utils/imageModeration");
const imageStorage_1 = require("../utils/imageStorage");
const User_1 = __importDefault(require("../models/User"));
const router = (0, express_1.Router)();
// Helper function to safely delete files on Windows (handles EBUSY errors)
const safeUnlink = async (filePath, maxRetries = 3, delay = 100) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                return; // Success
            }
            return; // File doesn't exist, nothing to do
        }
        catch (error) {
            // On Windows, EBUSY means the file is still in use
            if (error.code === 'EBUSY' && attempt < maxRetries - 1) {
                // Wait a bit and retry
                await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
                continue;
            }
            // If it's not EBUSY or we've exhausted retries, log and ignore
            if (error.code !== 'EBUSY') {
                console.warn(`Error deleting file ${filePath}:`, error.message);
            }
            return; // Give up gracefully
        }
    }
};
// Temporary upload directory for processing (before uploading to cloud storage)
const tempUploadDir = path_1.default.join(process.cwd(), 'tmp', 'uploads');
// Ensure temp upload directory exists
if (!fs_1.default.existsSync(tempUploadDir)) {
    fs_1.default.mkdirSync(tempUploadDir, { recursive: true });
}
// Allowed image MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 7 * 1024 * 1024; // 7MB
const MAX_DIMENSION = 2048; // Max width or height in pixels
const MAX_FILES = 1; // Splash page users can only upload 1 image
// Validate file type by checking magic numbers (more secure than extension)
const validateImageFile = async (filePath, filename) => {
    try {
        const buffer = fs_1.default.readFileSync(filePath);
        // Ensure buffer is large enough to check magic numbers
        if (buffer.length < 4) {
            console.warn(`File ${filename || filePath} is too small to validate (${buffer.length} bytes)`);
            return false;
        }
        // Check magic numbers for common image formats
        // JPEG: FF D8
        const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8;
        // PNG: 89 50 4E 47 (PNG signature)
        const isPNG = buffer.length >= 8 &&
            buffer[0] === 0x89 &&
            buffer[1] === 0x50 &&
            buffer[2] === 0x4E &&
            buffer[3] === 0x47 &&
            buffer[4] === 0x0D &&
            buffer[5] === 0x0A &&
            buffer[6] === 0x1A &&
            buffer[7] === 0x0A;
        // Also check for PNG without the full signature (just the first 4 bytes)
        const isPNGShort = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
        // GIF: 47 49 46 38 (GIF8) or 47 49 46 39 (GIF9)
        const isGIF = (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) ||
            (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x39);
        // WEBP: RIFF header (52 49 46 46) at position 0, then WEBP (57 45 42 50) at position 8
        const isWEBP = buffer.length >= 12 &&
            buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && // RIFF
            buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50; // WEBP
        const isValid = isJPEG || isPNG || isPNGShort || isGIF || isWEBP;
        if (!isValid && filename) {
            // Log the first few bytes for debugging
            const hexPreview = Array.from(buffer.slice(0, 8))
                .map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase())
                .join(' ');
            console.warn(`File ${filename} failed validation. First 8 bytes: ${hexPreview}`);
        }
        return isValid;
    }
    catch (error) {
        console.error(`Error validating image file ${filename || filePath}:`, error);
        return false;
    }
};
/**
 * Shared image upload handler
 */
async function handleImageUpload(req, res) {
    try {
        // Create temp uploads directory if it doesn't exist
        if (!fs_1.default.existsSync(tempUploadDir)) {
            fs_1.default.mkdirSync(tempUploadDir, { recursive: true });
        }
        const form = (0, formidable_1.default)({
            uploadDir: tempUploadDir,
            keepExtensions: true,
            maxFileSize: MAX_FILE_SIZE,
            maxFiles: MAX_FILES, // Only 1 image for splash page
            filename: (name, ext, part) => {
                // Create a unique filename: timestamp-random-originalname
                const timestamp = Date.now();
                const random = Math.random().toString(36).substring(2, 9);
                const originalName = part.originalFilename || 'image';
                const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
                return `${timestamp}-${random}-${sanitizedName}${ext}`;
            }
        });
        const [fields, files] = await form.parse(req);
        const uploadedFiles = files.image || files.images || [];
        // Extract userId from form fields (splash page uses userId, not username)
        const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId;
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ error: 'userId is required' });
        }
        // Verify user exists
        const user = await User_1.default.findOne({ userId }).lean().exec();
        if (!user) {
            // Clean up any uploaded files before returning error
            if (uploadedFiles && uploadedFiles.length > 0) {
                for (const file of uploadedFiles) {
                    if (file) {
                        await safeUnlink(file.filepath);
                    }
                }
            }
            return res.status(404).json({ error: 'User not found' });
        }
        if (!uploadedFiles || uploadedFiles.length === 0) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }
        // Process each uploaded file (should only be 1 for splash page)
        const processedImages = [];
        for (const file of uploadedFiles) {
            if (!file)
                continue;
            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                return res.status(400).json({
                    error: `File ${file.originalFilename} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
                });
            }
            // Validate MIME type
            if (!file.mimetype || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                return res.status(400).json({
                    error: `File ${file.originalFilename} is not a valid image type. Allowed types: JPEG, PNG, GIF, WEBP`
                });
            }
            // Validate file is actually an image using magic numbers
            const isValidImage = await validateImageFile(file.filepath, file.originalFilename);
            if (!isValidImage) {
                await safeUnlink(file.filepath);
                console.error(`Image validation failed for ${file.originalFilename}:`, {
                    mimetype: file.mimetype,
                    size: file.size,
                    filepath: file.filepath
                });
                return res.status(400).json({
                    error: `File ${file.originalFilename} is not a valid image file`,
                    message: `The file "${file.originalFilename}" could not be validated as a valid image. Please ensure it's a JPEG, PNG, GIF, or WEBP file.`,
                    details: `MIME type detected: ${file.mimetype || 'unknown'}, File size: ${file.size} bytes`
                });
            }
            try {
                // Process image with sharp: resize if too large, optimize
                let image;
                try {
                    image = (0, sharp_1.default)(file.filepath);
                    const metadata = await image.metadata();
                    if (!metadata || (!metadata.width && !metadata.height)) {
                        throw new Error('Unable to read image metadata - file may be corrupted');
                    }
                }
                catch (sharpError) {
                    const filename = file.originalFilename || 'unknown';
                    console.error(`Sharp processing error for ${filename}:`, {
                        error: sharpError.message,
                        code: sharpError.code,
                        mimetype: file.mimetype,
                        stack: sharpError.stack
                    });
                    await safeUnlink(file.filepath);
                    return res.status(400).json({
                        error: `File ${filename} could not be processed`,
                        message: `The image file "${filename}" appears to be corrupted or in an unsupported format. Please try converting it to a standard PNG or JPEG format.`,
                        details: sharpError.message
                    });
                }
                // Re-initialize sharp instance for processing
                image = (0, sharp_1.default)(file.filepath);
                const metadata = await image.metadata();
                // Resize if image is too large
                if (metadata.width && metadata.height) {
                    if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
                        await image
                            .resize(MAX_DIMENSION, MAX_DIMENSION, {
                            fit: 'inside',
                            withoutEnlargement: true
                        })
                            .toFile(file.filepath + '.resized');
                        // Replace original with resized version
                        fs_1.default.renameSync(file.filepath + '.resized', file.filepath);
                    }
                }
                // Moderate image content using Google Vision API
                const moderationResult = await (0, imageModeration_1.moderateImage)(file.filepath);
                // Log moderation result only in development
                if (process.env.NODE_ENV === 'development') {
                    console.log('Image moderation result:', {
                        filename: file.originalFilename,
                        isApproved: moderationResult.isApproved,
                        isInappropriate: moderationResult.isInappropriate,
                        reasons: moderationResult.reasons,
                        confidence: moderationResult.confidence,
                        safeSearch: moderationResult.safeSearch
                    });
                }
                if (!moderationResult.isApproved) {
                    // Clean up inappropriate image
                    await safeUnlink(file.filepath);
                    // Return user-friendly message (simplified - no violation tracking for splash page)
                    return res.status(400).json({
                        error: 'Image contains inappropriate content',
                        message: `Your image contains inappropriate content and cannot be uploaded. Please choose a different image.`,
                        details: moderationResult.reasons.join(', '),
                        isContentViolation: true,
                        moderationResult: {
                            reasons: moderationResult.reasons,
                            confidence: moderationResult.confidence,
                            safeSearch: moderationResult.safeSearch
                        }
                    });
                }
                // Upload to storage (ImageKit or local filesystem)
                const storage = (0, imageStorage_1.getImageStorage)();
                const uploadResult = await storage.uploadImage(file.filepath, path_1.default.basename(file.filepath), 'forum-images');
                // Clean up temporary file after upload (only if using cloud storage)
                if (process.env.IMAGEKIT_PUBLIC_KEY ||
                    process.env.CLOUDINARY_CLOUD_NAME ||
                    process.env.AWS_S3_BUCKET_NAME) {
                    // Using cloud storage - delete temp file
                    await safeUnlink(file.filepath);
                }
                processedImages.push({
                    url: uploadResult.url,
                    name: file.originalFilename || 'image',
                    size: uploadResult.size,
                    type: uploadResult.type || file.mimetype || 'image/jpeg'
                });
            }
            catch (error) {
                const filename = file.originalFilename || 'unknown';
                console.error(`Error processing image ${filename}:`, {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined,
                    mimetype: file.mimetype,
                    size: file.size
                });
                await safeUnlink(file.filepath);
                return res.status(500).json({
                    error: `Error processing image ${filename}`,
                    message: `Failed to process the image file "${filename}". ${error instanceof Error ? error.message : 'Unknown error'}`,
                    details: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        return res.status(200).json({
            success: true,
            images: processedImages,
            count: processedImages.length
        });
    }
    catch (error) {
        console.error('Error uploading file:', error);
        // Handle formidable errors
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: `Too many files. Maximum ${MAX_FILES} image per post for splash page.`
            });
        }
        return res.status(500).json({
            error: 'Error uploading file',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
/**
 * POST /api/uploadForumImage
 * Uploads an image for forum posts
 * FormData fields:
 *   - image: image file (required)
 *   - userId: user's userId (required, instead of username for splash page)
 */
router.post('/uploadForumImage', async (req, res) => {
    await handleImageUpload(req, res);
});
/**
 * POST /api/public/forum-posts/upload-image
 * Alternative route path that matches frontend expectations
 * FormData fields:
 *   - image: image file (required)
 *   - userId: user's userId (required, instead of username for splash page)
 */
router.post('/public/forum-posts/upload-image', async (req, res) => {
    await handleImageUpload(req, res);
});
exports.default = router;
