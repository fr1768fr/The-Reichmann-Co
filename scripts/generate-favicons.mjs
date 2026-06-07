// Generate favicon assets from the dark eagle (favicon-light-512.png).
// Run with: npm run favicons
//
// Fixes the root cause of the missing tab icon: the old favicon.svg referenced an
// EXTERNAL png via <image href="favicon-light-512.png">, and browsers do not load
// external images inside an SVG favicon, so it rendered blank. Here the PNG is
// inlined as a base64 data URI (self-contained), keeping the dark-mode invert so
// the dark eagle stays visible on dark browser chrome. Also emits a real
// multi-size favicon.ico (PNG-in-ICO) for Google and legacy browsers.
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(__dirname, '..', 'public');

// A favicon never renders above ~64px, so inline the small 96px asset to keep
// favicon.svg light; use the 512px asset for crisp .ico downscaling.
const svgUri = `data:image/png;base64,${fs.readFileSync(path.join(pub, 'favicon-light-96.png')).toString('base64')}`;
const icoUri = `data:image/png;base64,${fs.readFileSync(path.join(pub, 'favicon-light-512.png')).toString('base64')}`;

// 1) Self-contained SVG favicon (inlined; keeps the dark-mode invert).
const svg = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <style>
    @media (prefers-color-scheme: dark) { image { filter: invert(1); } }
  </style>
  <image href="${svgUri}" width="512" height="512"/>
</svg>
`;
fs.writeFileSync(path.join(pub, 'favicon.svg'), svg);
console.log('Wrote public/favicon.svg (self-contained)');

// 2) favicon.ico with 16/32/48 PNG frames (PNG-in-ICO).
const sizes = [16, 32, 48];
const frames = sizes.map((s) => {
  const frameSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><image href="${icoUri}" width="${s}" height="${s}" preserveAspectRatio="xMidYMid meet"/></svg>`;
  const png = new Resvg(frameSvg, { fitTo: { mode: 'width', value: s }, background: 'rgba(0,0,0,0)' }).render().asPng();
  return { size: s, png };
});

const count = frames.length;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(count, 4); // image count
let offset = 6 + count * 16;
const dir = [];
const data = [];
for (const { size, png } of frames) {
  const e = Buffer.alloc(16);
  e.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 => 256)
  e.writeUInt8(size >= 256 ? 0 : size, 1); // height
  e.writeUInt8(0, 2); // palette count
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // color planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(png.length, 8); // data size
  e.writeUInt32LE(offset, 12); // data offset
  dir.push(e);
  data.push(png);
  offset += png.length;
}
fs.writeFileSync(path.join(pub, 'favicon.ico'), Buffer.concat([header, ...dir, ...data]));
console.log(`Wrote public/favicon.ico (${sizes.join('/')} px)`);
