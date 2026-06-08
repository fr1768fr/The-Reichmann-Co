// Admin: read recorded usage telemetry — which company uses each licence and how many active
// users it has, so over-seat use is visible in the console. Bearer-auth (LICENSE_ADMIN_TOKEN).
import type { APIRoute } from 'astro';
import { getStore } from '../../../../lib/license/store';
import { authorizeAdmin, json } from '../../../../lib/license/adminAuth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!authorizeAdmin(request)) return json({ error: 'Unauthorized.' }, 401);
  return json({ usage: await getStore().listUsage() });
};
