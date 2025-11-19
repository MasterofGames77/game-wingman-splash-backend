import ImageKit from 'imagekit';
import fs from 'fs';
import path from 'path';

export interface UploadResult {
  url: string;
  size: number;
  type?: string;
}

export interface ImageStorage {
  uploadImage(filePath: string, filename: string, folder?: string): Promise<UploadResult>;
}

/**
 * ImageKit Storage Implementation
 * Uploads images to ImageKit CDN
 */
export class ImageKitStorage implements ImageStorage {
  private imagekit: ImageKit;

  constructor() {
    if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
      throw new Error('ImageKit credentials not configured. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT environment variables.');
    }

    this.imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
  }

  async uploadImage(filePath: string, filename: string, folder: string = 'forum-images'): Promise<UploadResult> {
    try {
      // Read file from disk
      const file = fs.readFileSync(filePath);
      const fileSize = fs.statSync(filePath).size;

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
    } catch (error) {
      console.error('Error uploading image to ImageKit:', error);
      throw new Error(`Failed to upload image to ImageKit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Local Filesystem Storage Implementation
 * Stores images locally (for development)
 */
export class LocalStorage implements ImageStorage {
  private basePath: string;

  constructor(basePath: string = path.join(process.cwd(), 'public', 'uploads')) {
    this.basePath = basePath;
    // Ensure directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async uploadImage(filePath: string, filename: string, folder: string = 'forum-images'): Promise<UploadResult> {
    try {
      const fileSize = fs.statSync(filePath).size;
      const folderPath = path.join(this.basePath, folder);
      
      // Ensure folder exists
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const destPath = path.join(folderPath, filename);
      
      // Copy file to destination
      fs.copyFileSync(filePath, destPath);

      // Return URL path (relative to public folder)
      const url = `/uploads/${folder}/${filename}`;

      return {
        url,
        size: fileSize,
        type: path.extname(filename).slice(1), // Get extension without dot
      };
    } catch (error) {
      console.error('Error storing image locally:', error);
      throw new Error(`Failed to store image locally: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Get the appropriate image storage implementation based on environment
 * Priority: ImageKit > Cloudinary > S3 > Local filesystem
 */
export function getImageStorage(): ImageStorage {
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

