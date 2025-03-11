const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Define all required sizes
const sizes = [
    16,   // Icon for extension toolbar
    48,   // Icon for extension management page
    128,  // Icon for Chrome Web Store
    440,  // Small promo tile
    1400  // Marquee promo tile
];

const TWITCH_DARK = '#18181b';

async function generateIcons() {
    const svgBuffer = fs.readFileSync(path.join(__dirname, 'icon.svg'));
    
    for (const size of sizes) {
        // For square icons
        if (size <= 128) {
            await sharp(svgBuffer)
                .resize(size, size)
                .flatten({ background: TWITCH_DARK }) // Remove alpha
                .png()
                .toFile(path.join(__dirname, `icon${size}.png`));
            
            console.log(`Generated ${size}x${size} icon`);
        }
    }

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

    console.log('Generated small promo tile (440x280)');

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

    console.log('Generated marquee promo tile (1400x560)');
}

generateIcons().catch(console.error); 