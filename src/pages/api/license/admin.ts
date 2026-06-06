// Admin API for provisioning Lumarix subscriptions. Bearer-token protected (LICENSE_ADMIN_TOKEN).
//   POST   { company, plan, seats, modules[], status?, graceDays?, accountKey? }  -> upsert (a new
//          account key is generated when omitted) and returns the subscription incl. its key.
//   GET    ?accountKey=KEY  -> one subscription;  GET (no query) -> list all.
//   DELETE ?accountKey=KEY  -> remove a subscription.
import type { APIRoute } from 'astro';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { getStore, type Subscription } from '../../../lib/license/store';

export const prerender = false;

const KNOWN_MODULES = ['inventory', 'payroll'];
const PLANS = ['monthly', 'yearly'];
const STATUSES = ['active', 'past_due', 'cancelled'];

const env = (key: string): string | undefined =>
  (import.meta.env as Record<string, string | undefined>)?.[key] ?? process.env[key];

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

function authorized(request: Request): boolean {
  const expected = env('LICENSE_ADMIN_TOKEN')?.trim();
  if (!expected) return false;
  const match = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') ?? '');
  const provided = match?.[1]?.trim() ?? '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** A friendly, unambiguous account key, e.g. LMX-7K3M-9QP2-RT4W. */
function newAccountKey(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L
  const bytes = randomBytes(12);
  const chars = Array.from(bytes, (n) => alphabet[n % alphabet.length]).join('');
  return `LMX-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

export const POST: APIRoute = async ({ request }) => {
  if (!authorized(request)) return json({ error: 'Unauthorized.' }, 401);

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const company = typeof body.company === 'string' ? body.company.trim() : '';
  if (!company) return json({ error: 'company is required.' }, 400);

  const plan = String(body.plan ?? '');
  if (!PLANS.includes(plan)) return json({ error: `plan must be one of: ${PLANS.join(', ')}.` }, 400);

  const seats = Number(body.seats);
  if (!Number.isInteger(seats) || seats < 1) return json({ error: 'seats must be an integer >= 1.' }, 400);

  if (!Array.isArray(body.modules) || body.modules.some((m) => typeof m !== 'string')) {
    return json({ error: 'modules must be an array of strings.' }, 400);
  }
  const modules = (body.modules as string[]).map((m) => m.trim().toLowerCase());
  const unknown = modules.filter((m) => !KNOWN_MODULES.includes(m));
  if (unknown.length) return json({ error: `unknown module(s): ${unknown.join(', ')}. Known: ${KNOWN_MODULES.join(', ')}.` }, 400);

  const status = body.status === undefined ? 'active' : String(body.status);
  if (!STATUSES.includes(status)) return json({ error: `status must be one of: ${STATUSES.join(', ')}.` }, 400);

  const graceDays = body.graceDays === undefined ? 21 : Number(body.graceDays);
  if (!Number.isInteger(graceDays) || graceDays < 1 || graceDays > 365) {
    return json({ error: 'graceDays must be an integer between 1 and 365.' }, 400);
  }

  const accountKey = typeof body.accountKey === 'string' && body.accountKey.trim() ? body.accountKey.trim() : newAccountKey();

  const store = getStore();
  const existing = await store.get(accountKey);
  const nowIso = new Date().toISOString();
  const sub: Subscription = {
    accountKey,
    company,
    plan: plan as Subscription['plan'],
    seats,
    modules,
    status: status as Subscription['status'],
    graceDays,
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
  };

  await store.upsert(sub);
  return json({ ok: true, subscription: sub }, existing ? 200 : 201);
};

export const GET: APIRoute = async ({ request, url }) => {
  if (!authorized(request)) return json({ error: 'Unauthorized.' }, 401);
  const store = getStore();
  const accountKey = url.searchParams.get('accountKey');
  if (accountKey) {
    const sub = await store.get(accountKey);
    return sub ? json(sub) : json({ error: 'Not found.' }, 404);
  }
  return json({ subscriptions: await store.list() });
};

export const DELETE: APIRoute = async ({ request, url }) => {
  if (!authorized(request)) return json({ error: 'Unauthorized.' }, 401);
  const accountKey = url.searchParams.get('accountKey');
  if (!accountKey) return json({ error: 'accountKey query parameter is required.' }, 400);
  const removed = await getStore().remove(accountKey);
  return removed ? json({ ok: true }) : json({ error: 'Not found.' }, 404);
};
