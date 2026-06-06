// Lumarix license activation: the app posts an account key (+ company identity) and gets back a
// signed entitlement token. Rejects unknown or cancelled subscriptions.
import type { APIRoute } from 'astro';
import { handleLicenseRequest } from '../../../lib/license/issue';

export const prerender = false;

export const POST: APIRoute = ({ request }) => handleLicenseRequest(request, { allowInactive: false });
