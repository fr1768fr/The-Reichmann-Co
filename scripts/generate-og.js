// Convert og-image.svg to og-image.png
// Run with: node scripts/generate-og.js
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const svgPath = path.join(projectRoot, 'og-image.svg');
const pngPath = path.join(projectRoot, 'og-image.png');

const svg = fs.readFileSync(svgPath, 'utf8');

const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: {
        loadSystemFonts: true,
        defaultFontFamily: 'Segoe UI'
    },
    background: '#0a0f1c'
});

const pngData = resvg.render().asPng();
fs.writeFileSync(pngPath, pngData);

console.log(`Generated ${pngPath} (${pngData.length} bytes)`);
