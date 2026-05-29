// Render public/linkedin-banner.svg to public/linkedin-banner.png at 1128 x 191 px.
// Run with: npm run banner
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const svgPath = path.join(projectRoot, 'public', 'linkedin-banner.svg');
const pngPath = path.join(projectRoot, 'public', 'linkedin-banner.png');

const svg = fs.readFileSync(svgPath, 'utf8');

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1128 },
  font: {
    loadSystemFonts: true,
    defaultFontFamily: 'Segoe UI',
  },
  background: '#051026',
});

const pngData = resvg.render().asPng();
fs.writeFileSync(pngPath, pngData);

console.log(`Generated ${pngPath} (${pngData.length} bytes, 1128x191)`);
