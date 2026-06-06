// Lumarix license refresh: an already-activated app silently re-fetches its token on launch.
// Unlike activate, this reflects a lapsed subscription (issues a cancelled-status token) so the
// app stops honouring it once the cached grace window ends.
import type { APIRoute } from 'astro';
import { handleLicenseRequest } from '../../../lib/license/issue';

export const prerender = false;

export const POST: APIRoute = ({ request }) => handleLicenseRequest(request, { allowInactive: true });
