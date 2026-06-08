import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://thereichmannco.co.za',
  output: 'static',
  adapter: vercel(),
  trailingSlash: 'ignore',
  build: {
    format: 'file',
  },
  integrations: [
    // Auto-generates sitemap-index.xml + sitemap-0.xml at build time, so the
    // sitemap can never go stale when we add pages. Excludes the 404; the
    // /api/* endpoints are server routes and are not emitted as pages anyway.
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
});
