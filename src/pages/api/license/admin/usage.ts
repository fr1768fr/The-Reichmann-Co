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

// Remove one usage record by its storage id (?id=), so an admin can clear out companies that are
// no longer in use. Telemetry only — this does not touch any licence/subscription.
export const DELETE: APIRoute = async ({ request, url }) => {
  if (!authorizeAdmin(request)) return json({ error: 'Unauthorized.' }, 401);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id query parameter is required.' }, 400);
  const removed = await getStore().removeUsage(id);
  return removed ? json({ ok: true }) : json({ error: 'Not found.' }, 404);
};
