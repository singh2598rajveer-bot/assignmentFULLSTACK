const Jimp = require('jimp');
const jsQR = require('jsqr');
const path = require('path');

/**
 * Decodes a QR code from an image file.
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<string>} - The decoded QR string
 */
async function decodeQR(imagePath) {
  // Read the image using Jimp
  const image = await Jimp.read(imagePath);

  const { data, width, height } = image.bitmap;

  // CRITICAL FIX: Convert Node Buffer explicitly to Uint8ClampedArray for jsQR
  const clampedData = new Uint8ClampedArray(data);

  // Scan the image matrix for a QR code
  const result = jsQR(clampedData, width, height);

  if (result === null) {
    throw new Error('No QR code found. Try cropping closer to the QR code or improving lighting.');
  }

  return result.data;
}

// Standalone test guard
if (require.main === module) {
  const testImagePath = process.argv[2] || path.join(__dirname, 'test_qr.png');

  console.log(`Testing decodeQR on: ${testImagePath}`);

  decodeQR(testImagePath)
    .then((data) => {
      console.log('\n========================================');
      console.log('✅ QR Decoded successfully!');
      console.log('========================================\n');
      console.log(data);
      console.log('\n========================================');
    })
    .catch((err) => {
      console.error('\n❌ Error decoding QR:', err.message);
    });
}

module.exports = { decodeQR };