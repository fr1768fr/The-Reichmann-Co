import { getStore, type Subscription } from './store';
import { signToken, type EntitlementTokenPayload } from './token';

// The Lumarix app posts these with camelCase keys (System.Net.Http.Json uses Web defaults).
interface ActivationBody {
  accountKey?: unknown;
  companyName?: unknown;
  registrationNumber?: unknown;
  activeUsers?: unknown;
  appVersion?: unknown;
  installationId?: unknown;
}

const env = (key: string): string | undefined =>
  (import.meta.env as Record<string, string | undefined>)?.[key] ?? process.env[key];

/**
 * Read the vendor private key, accepting a raw PEM, a PEM with escaped \n (common when pasted
 * into an env UI), or a base64-encoded PEM (the easiest single-line form for env vars).
 */
function loadPrivateKeyPem(): string | null {
  const raw = env('LICENSE_PRIVATE_KEY');
  if (!raw) return null;
  if (raw.includes('BEGIN')) return raw.replace(/\\n/g, '\n');
  try {
    return Buffer.from(raw, 'base64').toString('utf8');
  } catch {
    return raw;
  }
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const DAY_MS = 24 * 60 * 60 * 1000;

function tokenFor(sub: Subscription): EntitlementTokenPayload {
  const now = new Date();
  return {
    Company: sub.company,
    Plan: sub.plan,
    Seats: sub.seats,
    Modules: sub.modules,
    Status: sub.status,
    IssuedAt: now.toISOString(),
    ValidUntil: new Date(now.getTime() + sub.graceDays * DAY_MS).toISOString(),
    ExpiresAt: sub.expiresAt ?? null,
  };
}

/**
 * Shared handler for both activation and refresh: look the account key up, then return a signed
 * entitlement token reflecting the subscription. Activation rejects a cancelled subscription with
 * a clear error; refresh issues a (cancelled-status) token anyway so an already-activated app
 * learns of the lapse and stops honouring it once the cached token's grace window ends.
 */
export async function handleLicenseRequest(request: Request, opts: { allowInactive: boolean }): Promise<Response> {
  let body: ActivationBody = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const accountKey = typeof body.accountKey === 'string' ? body.accountKey.trim() : '';
  if (!accountKey) return json({ error: 'An account key is required.' }, 400);

  const privateKeyPem = loadPrivateKeyPem();
  if (!privateKeyPem) {
    console.error('LICENSE_PRIVATE_KEY is not set');
    return json({ error: 'Licensing is not configured on the server.' }, 500);
  }

  let sub: Subscription | null;
  try {
    sub = await getStore().get(accountKey);
  } catch (err) {
    console.error('Subscription lookup failed:', err);
    return json({ error: 'The licensing store is unavailable. Please try again later.' }, 502);
  }

  if (!sub) return json({ error: 'That account key was not recognised.' }, 404);
  if (!opts.allowInactive && sub.status === 'cancelled') {
    return json({ error: 'This subscription is no longer active. Contact The Reichmann Co.' }, 403);
  }
  // On a fresh activation, refuse an already-expired term (refresh still issues a token carrying
  // the past ExpiresAt, so a running app learns it has lapsed and self-expires via the gate).
  if (!opts.allowInactive && sub.expiresAt && new Date(sub.expiresAt).getTime() < Date.now()) {
    return json({ error: 'This licence has expired. Contact The Reichmann Co. to renew.' }, 403);
  }

  // Best-effort usage telemetry: record who is using this licence and how many active users, so
  // over-seat use is visible in the console. Wrapped so it can NEVER break activation/refresh.
  try {
    const seenIso = new Date().toISOString();
    await getStore().recordUsage({
      accountKey: sub.accountKey,
      installationId: typeof body.installationId === 'string' && body.installationId.trim() ? body.installationId.trim() : null,
      company: typeof body.companyName === 'string' && body.companyName.trim() ? body.companyName.trim() : sub.company,
      registrationNumber: typeof body.registrationNumber === 'string' && body.registrationNumber.trim() ? body.registrationNumber.trim() : null,
      activeUsers: Number.isInteger(Number(body.activeUsers)) ? Number(body.activeUsers) : null,
      appVersion: typeof body.appVersion === 'string' && body.appVersion.trim() ? body.appVersion.trim() : null,
      firstSeen: seenIso,
      lastSeen: seenIso,
    });
  } catch (err) {
    console.error('Usage telemetry record failed (non-fatal):', err);
  }

  try {
    return json({ token: signToken(tokenFor(sub), privateKeyPem) });
  } catch (err) {
    console.error('Token signing failed:', err);
    return json({ error: 'Could not issue a licence token.' }, 500);
  }
}
