const Jimp = require('jimp');
const jsQR = require('jsqr');

async function decodeQR(imagePath) {
    // 1. Read the image
    const image = await Jimp.read(imagePath);
    
    // 2. Pre-process the image for better scanning
    // Resize to a standard maximum size to prevent jsQR from crashing on massive photos
    if (image.bitmap.width > 1000) {
        image.resize(1000, Jimp.AUTO);
    }
    
    // Convert to greyscale and maximize contrast to make the black/white blocks obvious
    image.greyscale().contrast(0.5);

    // 3. Extract the clean pixel data
    const imageData = {
        data: new Uint8ClampedArray(image.bitmap.data),
        width: image.bitmap.width,
        height: image.bitmap.height
    };

    // 4. Run jsQR on the cleaned data
    // We add an inversion option because sometimes screenshots invert background transparency
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert", 
    });
    
    if (!result) {
        throw new Error('No readable QR code found in this image. Ensure it is well-lit and high contrast.');
    }
    
    return result.data;
}

module.exports = { decodeQR };