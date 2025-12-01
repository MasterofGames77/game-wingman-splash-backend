/**
 * Script to upload LinkedIn post images to ImageKit
 * Run this script once to migrate all LinkedIn post images to ImageKit
 * 
 * Usage: npx ts-node scripts/uploadLinkedInImages.ts
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { getImageStorage } from '../utils/imageStorage';

// Load environment variables from .env file
dotenv.config();

const LINKEDIN_POSTS_DIR = path.join(process.cwd(), 'public', 'linkedin-posts');
const OUTPUT_FILE = path.join(process.cwd(), 'scripts', 'linkedin-image-urls.json');

interface ImageUrlMapping {
  filename: string;
  imageKitUrl: string;
  localPath: string;
}

async function uploadLinkedInImages() {
  console.log('Starting LinkedIn images upload to ImageKit...\n');

  // Check if ImageKit is configured
  if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
    console.error('❌ ImageKit credentials not configured!');
    console.error('Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT environment variables.');
    process.exit(1);
  }

  // Check if directory exists
  if (!fs.existsSync(LINKEDIN_POSTS_DIR)) {
    console.error(`❌ Directory not found: ${LINKEDIN_POSTS_DIR}`);
    process.exit(1);
  }

  // Get all image files
  const files = fs.readdirSync(LINKEDIN_POSTS_DIR).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
  });

  if (files.length === 0) {
    console.error('❌ No image files found in linkedin-posts directory');
    process.exit(1);
  }

  console.log(`Found ${files.length} image files to upload\n`);

  const storage = getImageStorage();
  const mappings: ImageUrlMapping[] = [];
  let successCount = 0;
  let errorCount = 0;

  // Upload each image
  for (const filename of files) {
    const filePath = path.join(LINKEDIN_POSTS_DIR, filename);
    
    try {
      console.log(`Uploading: ${filename}...`);
      
      const uploadResult = await storage.uploadImage(
        filePath,
        filename,
        'linkedin-posts' // Folder in ImageKit
      );

      mappings.push({
        filename,
        imageKitUrl: uploadResult.url,
        localPath: `/linkedin-posts/${filename}`
      });

      console.log(`✅ Uploaded: ${uploadResult.url}\n`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error uploading ${filename}:`, error instanceof Error ? error.message : error);
      errorCount++;
    }
  }

  // Save mappings to JSON file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mappings, null, 2));
  console.log(`\n📝 Mappings saved to: ${OUTPUT_FILE}`);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Upload Summary:');
  console.log(`✅ Successfully uploaded: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log('='.repeat(50));

  if (successCount > 0) {
    console.log('\n📋 Next steps:');
    console.log('1. Review the mappings in scripts/linkedin-image-urls.json');
    console.log('2. Run the update script to update linkedinPosts.ts with ImageKit URLs');
    console.log('   (or manually update the imageUrl fields)');
  }

  if (errorCount > 0) {
    process.exit(1);
  }
}

// Run the script
uploadLinkedInImages().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

