const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Make sure we have sharp installed
try {
  require.resolve('sharp');
} catch (e) {
  console.error('Sharp is not installed. Please run: npm install sharp');
  process.exit(1);
}

// Path to source PNG and destination ICO
const sourcePng = path.join(__dirname, 'public', 'icon.png');
const targetIco = path.join(__dirname, 'public', 'icon.ico');

// Windows icon sizes commonly used
const sizes = [16, 24, 32, 48, 64, 128, 256];

// Function to create ICO file
async function createIcoFromPng() {
  try {
    console.log('Creating ICO file from PNG...');
    
    // Check if source PNG exists
    if (!fs.existsSync(sourcePng)) {
      console.error(`Source file not found: ${sourcePng}`);
      return;
    }
    
    // Generate ICO file using sharp
    await sharp(sourcePng)
      .resize(256, 256) // Resize to largest size
      .toFile(targetIco);
    
    console.log(`ICO file created successfully at: ${targetIco}`);
  } catch (error) {
    console.error('Error creating ICO file:', error);
  }
}

// Run the conversion
createIcoFromPng();
