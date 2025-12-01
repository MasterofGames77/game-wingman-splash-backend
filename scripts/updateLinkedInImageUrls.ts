/**
 * Script to update linkedinPosts.ts with ImageKit URLs
 * This reads the mappings from linkedin-image-urls.json and updates the routes file
 * 
 * Usage: npx ts-node scripts/updateLinkedInImageUrls.ts
 */

import fs from 'fs';
import path from 'path';

const MAPPINGS_FILE = path.join(process.cwd(), 'scripts', 'linkedin-image-urls.json');
const LINKEDIN_POSTS_FILE = path.join(process.cwd(), 'routes', 'linkedinPosts.ts');

interface ImageUrlMapping {
  filename: string;
  imageKitUrl: string;
  localPath: string;
}

function updateLinkedInPostsFile() {
  console.log('Updating linkedinPosts.ts with ImageKit URLs...\n');

  // Check if mappings file exists
  if (!fs.existsSync(MAPPINGS_FILE)) {
    console.error(`❌ Mappings file not found: ${MAPPINGS_FILE}`);
    console.error('Please run uploadLinkedInImages.ts first to generate the mappings.');
    process.exit(1);
  }

  // Read mappings
  const mappingsContent = fs.readFileSync(MAPPINGS_FILE, 'utf-8');
  const mappings: ImageUrlMapping[] = JSON.parse(mappingsContent);

  if (mappings.length === 0) {
    console.error('❌ No mappings found in file');
    process.exit(1);
  }

  // Create a map for quick lookup: localPath -> imageKitUrl
  const urlMap = new Map<string, string>();
  mappings.forEach(mapping => {
    urlMap.set(mapping.localPath, mapping.imageKitUrl);
  });

  // Read linkedinPosts.ts
  if (!fs.existsSync(LINKEDIN_POSTS_FILE)) {
    console.error(`❌ File not found: ${LINKEDIN_POSTS_FILE}`);
    process.exit(1);
  }

  let fileContent = fs.readFileSync(LINKEDIN_POSTS_FILE, 'utf-8');
  let updateCount = 0;

  // Replace all local paths with ImageKit URLs
  urlMap.forEach((imageKitUrl, localPath) => {
    // Match: imageUrl: '/linkedin-posts/filename.png',
    const regex = new RegExp(`(imageUrl:\\s*)['"]${localPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
    const matches = fileContent.match(regex);
    
    if (matches) {
      fileContent = fileContent.replace(regex, `$1'${imageKitUrl}'`);
      updateCount += matches.length;
      console.log(`✅ Updated: ${localPath} -> ${imageKitUrl}`);
    }
  });

  if (updateCount === 0) {
    console.log('⚠️  No imageUrl fields found to update. They may already be using ImageKit URLs.');
  } else {
    // Write updated file
    fs.writeFileSync(LINKEDIN_POSTS_FILE, fileContent, 'utf-8');
    console.log(`\n✅ Updated ${updateCount} imageUrl fields in linkedinPosts.ts`);
  }

  console.log('\n📝 Done! The linkedinPosts.ts file has been updated with ImageKit URLs.');
}

// Run the script
updateLinkedInPostsFile();

