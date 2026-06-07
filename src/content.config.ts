import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Blog posts live as Markdown in src/content/blog. Add a file, fill the
// frontmatter below, and it appears on /blog and at /blog/<filename>.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    author: z.string().default('The Reichmann Co.'),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
