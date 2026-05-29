// Site-wide config shared across layouts and components.

export const SITE = {
  name: 'The Reichmann Co.',
  legalName: 'The Reichmann Co. (Pty) Ltd',
  shortTagline: 'Software, apps & SaaS. Built to ship.',
  url: 'https://thereichmannco.co.za',
  email: 'info@thereichmannco.co.za',
  registration: '2026/389746/07',
  founded: '2026',
  country: 'South Africa',
  countryCode: 'ZA',
  ogImage: '/og-image.png',
  linkedin: 'https://www.linkedin.com/company/the-reichmann-co/',
} as const;

export const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/products', label: 'Products' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
] as const;
