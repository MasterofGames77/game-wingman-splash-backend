"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorage = exports.ImageKitStorage = void 0;
exports.getImageStorage = getImageStorage;
const imagekit_1 = __importDefault(require("imagekit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * ImageKit Storage Implementation
 * Uploads images to ImageKit CDN
 */
class ImageKitStorage {
    imagekit;
    constructor() {
        if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
            throw new Error('ImageKit credentials not configured. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT environment variables.');
        }
        this.imagekit = new imagekit_1.default({
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
        });
    }
    async uploadImage(filePath, filename, folder = 'forum-images') {
        try {
            // Read file from disk
            const file = fs_1.default.readFileSync(filePath);
            const fileSize = fs_1.default.statSync(filePath).size;
            // Upload to ImageKit
            const uploadResponse = await this.imagekit.upload({
                file: file,
                fileName: filename,
                folder: folder,
                useUniqueFileName: true, // ImageKit will generate unique filename
            });
            return {
                url: uploadResponse.url,
                size: fileSize,
                type: uploadResponse.fileType,
            };
        }
        catch (error) {
            console.error('Error uploading image to ImageKit:', error);
            throw new Error(`Failed to upload image to ImageKit: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.ImageKitStorage = ImageKitStorage;
/**
 * Local Filesystem Storage Implementation
 * Stores images locally (for development)
 */
class LocalStorage {
    basePath;
    constructor(basePath = path_1.default.join(process.cwd(), 'public', 'uploads')) {
        this.basePath = basePath;
        // Ensure directory exists
        if (!fs_1.default.existsSync(this.basePath)) {
            fs_1.default.mkdirSync(this.basePath, { recursive: true });
        }
    }
    async uploadImage(filePath, filename, folder = 'forum-images') {
        try {
            const fileSize = fs_1.default.statSync(filePath).size;
            const folderPath = path_1.default.join(this.basePath, folder);
            // Ensure folder exists
            if (!fs_1.default.existsSync(folderPath)) {
                fs_1.default.mkdirSync(folderPath, { recursive: true });
            }
            const destPath = path_1.default.join(folderPath, filename);
            // Copy file to destination
            fs_1.default.copyFileSync(filePath, destPath);
            // Return URL path (relative to public folder)
            const url = `/uploads/${folder}/${filename}`;
            return {
                url,
                size: fileSize,
                type: path_1.default.extname(filename).slice(1), // Get extension without dot
            };
        }
        catch (error) {
            console.error('Error storing image locally:', error);
            throw new Error(`Failed to store image locally: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.LocalStorage = LocalStorage;
/**
 * Get the appropriate image storage implementation based on environment
 * Priority: ImageKit > Cloudinary > S3 > Local filesystem
 */
function getImageStorage() {
    // Check for ImageKit (highest priority)
    if (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT) {
        return new ImageKitStorage();
    }
    // TODO: Add Cloudinary support if needed
    // if (process.env.CLOUDINARY_CLOUD_NAME) {
    //   return new CloudinaryStorage();
    // }
    // TODO: Add S3 support if needed
    // if (process.env.AWS_S3_BUCKET_NAME) {
    //   return new S3Storage();
    // }
    // Fallback to local filesystem (development)
    console.warn('No cloud storage configured. Using local filesystem storage (development only).');
    return new LocalStorage();
}
