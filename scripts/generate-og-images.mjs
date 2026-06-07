// Render per-page Open Graph / social cards to public/og/<slug>.png at 1200 x 630.
// Run with: npm run og
//
// The card layout matches public/og-image.svg (the generic company card): dark
// gradient, hairline border, the eagle mark on the left, a blue eyebrow, a big
// title, a divider, a tagline, a sub-line and the page URL in mono. The SVG is
// built in-memory from the CARDS data below (this file is the single source of
// truth), and the logo is inlined as a base64 data URI so resvg embeds it
// reliably without resolving a relative href.
//
// To add a card: append an entry to CARDS, run `npm run og`, then pass
// ogImage={`${SITE.url}/og/<slug>.png`} on that page's <BaseLayout>.
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const outDir = path.join(publicDir, 'og');

// Inline the eagle mark so resvg embeds it (relative hrefs aren't resolved).
const logoBase64 = fs.readFileSync(path.join(publicDir, 'favicon-512.png')).toString('base64');
const logoHref = `data:image/png;base64,${logoBase64}`;

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CARDS = [
  {
    slug: 'lumarix',
    eyebrow: 'THE REICHMANN CO.',
    title: 'Lumarix',
    tagline: 'Enterprise Resource Planning, reimagined.',
    sub: 'Windows-native ERP for South African business.',
    url: 'thereichmannco.co.za/products/lumarix',
  },
  {
    slug: 'veritis',
    eyebrow: 'THE REICHMANN CO.',
    title: 'Veritis',
    tagline: 'Truth, for accountants.',
    sub: 'An AI built for South African accountants.',
    url: 'thereichmannco.co.za/products/veritis',
  },
  {
    slug: 'about',
    eyebrow: 'THE REICHMANN CO.',
    title: 'About',
    tagline: 'Software, built with care.',
    sub: 'A South African software company, built to ship.',
    url: 'thereichmannco.co.za/about',
  },
  {
    slug: 'services',
    eyebrow: 'THE REICHMANN CO.',
    title: 'Services',
    tagline: 'What we build.',
    sub: 'Web, SaaS, mobile, desktop, cloud, and AI.',
    url: 'thereichmannco.co.za/services',
  },
  {
    slug: 'products',
    eyebrow: 'THE REICHMANN CO.',
    title: 'Products',
    tagline: 'Built for the work we know best.',
    sub: 'Lumarix (ERP) and Veritis (AI for accountants).',
    url: 'thereichmannco.co.za/products',
  },
  {
    slug: 'contact',
    eyebrow: 'THE REICHMANN CO.',
    title: 'Contact',
    tagline: "Let's build something.",
    sub: 'An app, a web app, or a SaaS to launch?',
    url: 'thereichmannco.co.za/contact',
  },
  {
    slug: 'founding-testers',
    eyebrow: 'THE REICHMANN CO.',
    title: 'Founding Testers',
    tagline: 'Shape Lumarix before launch.',
    sub: 'Help build the ERP South African business deserves.',
    url: 'thereichmannco.co.za/founding-testers',
  },
];

const card = ({ eyebrow, title, tagline, sub, url }) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0a0a0a"/>
      <stop offset="1" stop-color="#000000"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>

  <image href="${logoHref}" x="100" y="195" width="240" height="240" preserveAspectRatio="xMidYMid meet"/>

  <g transform="translate(400, 226)">
    <line x1="0" y1="9" x2="40" y2="9" stroke="rgba(59, 130, 246, 0.85)" stroke-width="1"/>
    <text x="56" y="14"
          font-family="'Helvetica Neue', Arial, sans-serif"
          font-size="14" font-weight="500" letter-spacing="4"
          fill="rgba(59, 130, 246, 0.95)">${esc(eyebrow)}</text>
  </g>

  <text x="400" y="322"
        font-family="'Helvetica Neue', Arial, sans-serif"
        font-size="${title.length > 12 ? 58 : 84}" font-weight="700" fill="#f5f5f5" letter-spacing="-2">${esc(title)}</text>

  <line x1="400" y1="360" x2="480" y2="360" stroke="rgba(255,255,255,0.4)" stroke-width="0.75"/>

  <text x="400" y="412"
        font-family="'Helvetica Neue', Arial, sans-serif"
        font-size="32" font-weight="300" fill="rgba(245, 245, 245, 0.85)" letter-spacing="-0.5">${esc(tagline)}</text>

  <text x="400" y="452"
        font-family="'Helvetica Neue', Arial, sans-serif"
        font-size="20" font-weight="300" fill="rgba(163, 163, 163, 0.9)" letter-spacing="-0.2">${esc(sub)}</text>

  <text x="400" y="540"
        font-family="Consolas, monospace"
        font-size="16" font-weight="500" letter-spacing="2"
        fill="rgba(163, 163, 163, 0.7)">${esc(url)}</text>
</svg>`;

fs.mkdirSync(outDir, { recursive: true });

for (const c of CARDS) {
  const resvg = new Resvg(card(c), {
    fitTo: { mode: 'width', value: 1200 },
    font: { loadSystemFonts: true, defaultFontFamily: 'Arial' },
    background: '#000000',
  });
  const png = resvg.render().asPng();
  const out = path.join(outDir, `${c.slug}.png`);
  fs.writeFileSync(out, png);
  console.log(`Generated ${path.relative(projectRoot, out)} (${png.length} bytes, 1200x630)`);
}
