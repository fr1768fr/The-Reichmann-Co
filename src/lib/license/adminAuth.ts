// Shared bearer-token auth for the licence admin endpoints (LICENSE_ADMIN_TOKEN).
import { timingSafeEqual } from 'node:crypto';

const env = (key: string): string | undefined =>
  (import.meta.env as Record<string, string | undefined>)?.[key] ?? process.env[key];

export const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

/** Constant-time bearer-token check against LICENSE_ADMIN_TOKEN. */
export function authorizeAdmin(request: Request): boolean {
  const expected = env('LICENSE_ADMIN_TOKEN')?.trim();
  if (!expected) return false;
  const match = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') ?? '');
  const provided = match?.[1]?.trim() ?? '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
