// Lightweight abuse protection for the UNAUTHENTICATED licensing endpoints (heartbeat / activate /
// refresh): a per-IP rate limit and a request-body size cap. These endpoints are open by design (a
// trial install has no credential), so they need a floor of protection that never breaks a real
// request — both helpers fail OPEN on any internal error.
import { getStore } from './store';

/** Best-effort client IP from the proxy headers Vercel sets in front of the function. */
export function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/** Largest request body accepted by the public licensing endpoints — generous for the app's JSON. */
export const MAX_BODY_BYTES = 8 * 1024;

/**
 * Read and JSON-parse a request body with a hard size cap, so an attacker cannot push a large
 * payload through an unauthenticated endpoint. Returns the parsed value, or null when the body is
 * over the cap or not valid JSON (the caller turns null into a 400).
 */
export async function readJsonCapped<T = unknown>(request: Request, maxBytes = MAX_BODY_BYTES): Promise<T | null> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  let text: string;
  try {
    text = await request.text();
  } catch {
    return null;
  }
  if (Buffer.byteLength(text, 'utf8') > maxBytes) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Fixed-window per-IP rate limit for one endpoint. Returns true when the request is allowed. Fails
 * open (allowed) if the limiter itself errors, so a glitch never blocks a paying customer. The
 * limits are deliberately generous: they stop trivial floods and cap cost, not a determined botnet
 * (that needs edge/WAF protection, which is out of scope here).
 */
export function allowRequest(request: Request, endpoint: string, limit = 120, windowSec = 60): Promise<boolean> {
  return getStore().hitRateLimit(`${endpoint}:${clientIp(request)}`, limit, windowSec);
}
