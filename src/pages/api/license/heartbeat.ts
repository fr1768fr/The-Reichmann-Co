// Trial heartbeat: an unlicensed (trial) Lumarix install reports in so it is visible in the
// licensing console alongside licensed companies. There is no account key and no token issued —
// this records usage telemetry only, keyed by the install's stable installationId. Best-effort:
// the app ignores the response, so this must never be the reason the app misbehaves.
import type { APIRoute } from 'astro';
import { getStore } from '../../../lib/license/store';

export const prerender = false;

// The Lumarix app posts these with camelCase keys (System.Net.Http.Json uses Web defaults).
interface HeartbeatBody {
  installationId?: unknown;
  companyName?: unknown;
  registrationNumber?: unknown;
  activeUsers?: unknown;
  appVersion?: unknown;
  machineId?: unknown;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  let body: HeartbeatBody = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const installationId = typeof body.installationId === 'string' ? body.installationId.trim() : '';
  if (!installationId) return json({ error: 'An installation id is required.' }, 400);

  try {
    const seenIso = new Date().toISOString();
    await getStore().recordUsage({
      accountKey: '', // a trial has no licence yet
      installationId,
      machineId: typeof body.machineId === 'string' && body.machineId.trim() ? body.machineId.trim() : null,
      company: typeof body.companyName === 'string' && body.companyName.trim() ? body.companyName.trim() : '(unnamed company)',
      registrationNumber: typeof body.registrationNumber === 'string' && body.registrationNumber.trim() ? body.registrationNumber.trim() : null,
      activeUsers: Number.isInteger(Number(body.activeUsers)) ? Number(body.activeUsers) : null,
      appVersion: typeof body.appVersion === 'string' && body.appVersion.trim() ? body.appVersion.trim() : null,
      firstSeen: seenIso,
      lastSeen: seenIso,
    });
  } catch (err) {
    console.error('Trial heartbeat record failed (non-fatal):', err);
    return json({ ok: false }, 200);
  }

  return json({ ok: true });
};
