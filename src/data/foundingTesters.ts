// The Lumarix founding testers, credited publicly on /founding-testers.
//
// To add a tester, append an entry below. Only `name` is required; the rest are
// optional and render when present. Order is preserved as listed. Remove the example
// once real testers come on board.

export interface FoundingTester {
  /** Display name, e.g. "Jane Doe". */
  name: string;
  /** Their role, e.g. "Bookkeeper", "Financial Manager", "Business Owner". */
  role?: string;
  /** Their business or practice. */
  company?: string;
  /** City or town, e.g. "Cape Town". */
  location?: string;
  /** Optional link (LinkedIn profile or website) wrapped around the name. */
  url?: string;
}

export const FOUNDING_TESTERS: FoundingTester[] = [
  // { name: 'Jane Doe', role: 'Bookkeeper', company: 'Doe & Co', location: 'Cape Town', url: 'https://www.linkedin.com/in/...' },
];
