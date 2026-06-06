// Same-origin download endpoint for Lumarix releases.
//
// The Velopack auto-updater in the app (and the website download button) request files under
// /downloads/lumarix/<file>. This route validates the filename against a strict allowlist and
// 302-redirects to the off-Vercel object storage that actually holds the large binaries (they
// cannot live in the Vercel deployment because of its size limit). The small releases.win.json
// feed index is served statically from public/downloads/lumarix/ and never reaches this route.
//
// It must REDIRECT, never proxy the bytes: streaming an ~85MB body through a serverless function
// would blow the response-size and duration limits.
import type { APIRoute } from 'astro';
import { isAllowedReleaseFile, releaseUrl } from '../../../lib/downloads/releases';

export const prerender = false;

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const GET: APIRoute = ({ params }) => {
  const file = String(params.file ?? '');
  if (!isAllowedReleaseFile(file)) return json({ error: 'Unknown download.' }, 404);

  const url = releaseUrl(file);
  if (!url) {
    console.error('LUMARIX_RELEASES_BASE_URL is not set');
    return json({ error: 'Downloads are not configured on the server.' }, 500);
  }

  return new Response(null, { status: 302, headers: { Location: url } });
};
