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

const TRIAL_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export const POST: APIRoute = async ({ request }) => {
  let body: HeartbeatBody = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const installationId = typeof body.installationId === 'string' ? body.installationId.trim() : '';
  if (!installationId) return json({ error: 'An installation id is required.' }, 400);
  const machineId = typeof body.machineId === 'string' && body.machineId.trim() ? body.machineId.trim() : null;

  const seenIso = new Date().toISOString();
  try {
    await getStore().recordUsage({
      accountKey: '', // a trial has no licence yet
      installationId,
      machineId,
      company: typeof body.companyName === 'string' && body.companyName.trim() ? body.companyName.trim() : '(unnamed company)',
      registrationNumber: typeof body.registrationNumber === 'string' && body.registrationNumber.trim() ? body.registrationNumber.trim() : null,
      activeUsers: Number.isInteger(Number(body.activeUsers)) ? Number(body.activeUsers) : null,
      appVersion: typeof body.appVersion === 'string' && body.appVersion.trim() ? body.appVersion.trim() : null,
      firstSeen: seenIso,
      lastSeen: seenIso,
    });
  } catch (err) {
    console.error('Trial heartbeat record failed (non-fatal):', err);
  }

  // Anchor the trial to the device: its first-seen date plus the trial length. Returned so the app
  // caps a new company file's trial at the device's window. Best-effort; never blocks the response.
  let trial: { startedAt: string; expiresAt: string } | null = null;
  if (machineId) {
    try {
      const startedAt = await getStore().ensureMachineTrialStart(machineId, seenIso);
      const expiresAt = new Date(new Date(startedAt).getTime() + TRIAL_DAYS * DAY_MS).toISOString();
      trial = { startedAt, expiresAt };
    } catch (err) {
      console.error('Machine trial anchor failed (non-fatal):', err);
    }
  }

  return json({ ok: true, trial });
};
