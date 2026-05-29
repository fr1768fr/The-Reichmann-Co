import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://thereichmannco.co.za',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'file',
  },
});
