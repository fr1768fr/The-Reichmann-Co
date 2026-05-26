// Render linkedin-banner.svg to linkedin-banner.png at 1128 x 191 px.
// Run with: node scripts/generate-linkedin-banner.js
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const svgPath = path.join(projectRoot, 'linkedin-banner.svg');
const pngPath = path.join(projectRoot, 'linkedin-banner.png');

const svg = fs.readFileSync(svgPath, 'utf8');

const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1128 },
    font: {
        loadSystemFonts: true,
        defaultFontFamily: 'Segoe UI'
    },
    background: '#000000'
});

const pngData = resvg.render().asPng();
fs.writeFileSync(pngPath, pngData);

console.log(`Generated ${pngPath} (${pngData.length} bytes, 1128x191)`);
