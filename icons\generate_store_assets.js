const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const TWITCH_PURPLE = '#9146ff';
const TWITCH_DARK = '#18181b';

async function generateStoreAssets() {
    // Load the base icon
    const svgBuffer = fs.readFileSync(path.join(__dirname, 'icon.svg'));
    
    // Generate store icon (128x128) with no alpha
    await sharp(svgBuffer)
        .resize(128, 128)
        .flatten({ background: TWITCH_DARK }) // Remove alpha
        .png()
        .toFile(path.join(__dirname, 'store_icon.png'));
    
    // Generate small promo tile (440x280)
    await sharp({
        create: {
            width: 440,
            height: 280,
            channels: 4,
            background: TWITCH_DARK
        }
    })
    .composite([
        {
            input: svgBuffer,
            top: 40,
            left: 40,
            width: 200,
            height: 200
        }
    ])
    .flatten({ background: TWITCH_DARK })
    .png()
    .toFile(path.join(__dirname, 'small_promo.png'));

    // Generate marquee promo tile (1400x560)
    await sharp({
        create: {
            width: 1400,
            height: 560,
            channels: 4,
            background: TWITCH_DARK
        }
    })
    .composite([
        {
            input: svgBuffer,
            top: 80,
            left: 100,
            width: 400,
            height: 400
        }
    ])
    .flatten({ background: TWITCH_DARK })
    .png()
    .toFile(path.join(__dirname, 'marquee_promo.png'));

    console.log('Generated store assets:');
    console.log('- store_icon.png (128x128)');
    console.log('- small_promo.png (440x280)');
    console.log('- marquee_promo.png (1400x560)');
}

generateStoreAssets().catch(console.error); 