import fs from 'fs';
import path from 'path';

const sourceImgName = 'pulseos_logo_1781010274612.png';
const sourcePath = path.join(process.cwd(), 'src', 'assets', 'images', sourceImgName);
const publicDir = path.join(process.cwd(), 'public');
const iconsDir = path.join(publicDir, 'icons');

// Create directories if they do not exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

if (fs.existsSync(sourcePath)) {
  console.log(`[PWA] Source logo found at ${sourcePath}. Copying sizes...`);
  
  // Copy to each size
  sizes.forEach(size => {
    const dest = path.join(iconsDir, `icon-${size}x${size}.png`);
    fs.copyFileSync(sourcePath, dest);
    console.log(`[PWA] Copied to ${dest}`);
  });

  // Copy apple-touch-icon.png
  const appleTouchIconDest = path.join(publicDir, 'apple-touch-icon.png');
  fs.copyFileSync(sourcePath, appleTouchIconDest);
  console.log(`[PWA] Copied to ${appleTouchIconDest}`);

  // Copy favicon.ico
  const faviconDest = path.join(publicDir, 'favicon.ico');
  fs.copyFileSync(sourcePath, faviconDest);
  console.log(`[PWA] Copied to ${faviconDest}`);

  console.log('[PWA] All icons successfully prepared!');
} else {
  console.warn(`[PWA] Warning: Source image ${sourcePath} not found. Skipped copying icons.`);
}
