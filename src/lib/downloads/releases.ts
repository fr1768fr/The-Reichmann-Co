// Resolves where Lumarix release binaries (the Windows installer plus the Velopack auto-update
// packages) are hosted. The large binaries (~85MB+ each, growing per release) live OFF Vercel in
// object storage, because they exceed Vercel's deployment size limit. This module turns a
// requested release filename into its storage URL.
//
// The storage base URL is configured with LUMARIX_RELEASES_BASE_URL (e.g. a public Backblaze B2
// or Cloudflare R2 bucket URL, with no trailing slash). Until it is set, the download route
// reports "not configured" the same way the license API does when its signing key is missing.

const env = (key: string): string | undefined =>
  (import.meta.env as Record<string, string | undefined>)?.[key] ?? process.env[key];

/** The configured storage base URL with any trailing slash trimmed, or null when unset. */
export function releasesBaseUrl(): string | null {
  const raw = env('LUMARIX_RELEASES_BASE_URL')?.trim();
  return raw ? raw.replace(/\/+$/, '') : null;
}

// Only these filenames may be requested through the download route: the installer, the full
// update package, and delta packages. Keep this in step with what `vpk pack` emits (see
// RELEASING.md in the Lumarix repo). Everything else is rejected with a 404.
const ALLOWED: RegExp[] = [
  /^Lumarix-win-Setup\.exe$/,
  /^Lumarix-[0-9A-Za-z.\-]+-full\.nupkg$/,
  /^Lumarix-[0-9A-Za-z.\-]+-delta\.nupkg$/,
];

export function isAllowedReleaseFile(file: string): boolean {
  return ALLOWED.some((re) => re.test(file));
}

/** The storage URL for a release file, or null when the base URL is not configured. */
export function releaseUrl(file: string): string | null {
  const base = releasesBaseUrl();
  return base ? `${base}/${file}` : null;
}
