// Admin: nudge an app (or every app) to check for updates now. Bearer-auth (LICENSE_ADMIN_TOKEN).
//   POST { installationId }  -> nudge that one install (staged rollout)
//   POST { all: true }       -> nudge everyone
// The app sees the nudge on its next check-in (heartbeat/refresh) and runs its update check, which
// only prompts when the feed actually has a newer version. This does NOT itself publish a release.
import type { APIRoute } from 'astro';
import { getStore, UPDATE_ALL } from '../../../../lib/license/store';
import { authorizeAdmin, json } from '../../../../lib/license/adminAuth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!authorizeAdmin(request)) return json({ error: 'Unauthorized.' }, 401);

  let body: { installationId?: unknown; all?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const all = body.all === true;
  const installationId = typeof body.installationId === 'string' ? body.installationId.trim() : '';
  if (!all && !installationId) return json({ error: 'Provide an installationId, or all: true.' }, 400);

  const target = all ? UPDATE_ALL : installationId;
  await getStore().setUpdateNudge(target, new Date().toISOString());
  return json({ ok: true, target });
};
