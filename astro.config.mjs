import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://thereichmannco.co.za',
  output: 'static',
  adapter: vercel(),
  trailingSlash: 'ignore',
  build: {
    format: 'file',
  },
});
