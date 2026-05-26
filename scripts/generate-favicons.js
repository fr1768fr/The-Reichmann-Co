// Generate PNG favicons at multiple sizes from favicon.svg.
// Google Search prefers PNG favicons at 48px+ for indexing.
// Run with: node scripts/generate-favicons.js
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const svgPath = path.join(projectRoot, 'favicon.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

const outputs = [
    { size: 32, name: 'favicon-32.png' },
    { size: 48, name: 'favicon-48.png' },
    { size: 96, name: 'favicon-96.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'favicon-192.png' },
    { size: 512, name: 'favicon-512.png' }
];

for (const { size, name } of outputs) {
    const resvg = new Resvg(svg, {
        fitTo: { mode: 'width', value: size }
    });
    const pngData = resvg.render().asPng();
    const outPath = path.join(projectRoot, name);
    fs.writeFileSync(outPath, pngData);
    console.log(`Generated ${name} (${size}x${size}, ${pngData.length} bytes)`);
}
