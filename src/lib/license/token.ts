import { sign as cryptoSign, createPrivateKey } from 'node:crypto';

/**
 * The signed entitlement statement the Lumarix app verifies offline. Field names are
 * PascalCase to match the C# `EntitlementToken` record exactly (System.Text.Json maps
 * JSON properties to the record's constructor parameters by name).
 */
export interface EntitlementTokenPayload {
  Company: string;
  Plan: string; // "monthly" | "yearly"
  Seats: number; // base per-user seat count
  Modules: string[]; // wire codes, e.g. ["inventory","payroll"]
  Status: string; // "active" | "past_due" | "cancelled"
  IssuedAt: string; // ISO-8601 UTC
  ValidUntil: string; // ISO-8601 UTC (offline-grace horizon)
  ExpiresAt: string | null; // ISO-8601 UTC licence term end, or null for an open-ended licence
  InstallationId: string | null; // the install this licence was activated for; null = legacy/unbound
}

const base64url = (buf: Buffer): string =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/**
 * Sign an entitlement token so the Lumarix C# app verifies it with EntitlementTokenVerifier.
 *
 * Wire format: `base64url(utf8(json)) + "." + base64url(signature)`, where `signature` is an
 * ECDSA-over-SHA256 signature in IEEE-P1363 (raw r‖s) form. The P1363 encoding is REQUIRED:
 * .NET's `ECDsa.VerifyData(data, sig, SHA256)` expects fixed-field concatenation, not the DER
 * sequence Node emits by default. The app verifies the signature over the exact JSON bytes we
 * send here, so key order and whitespace are irrelevant to validity.
 *
 * @param privateKeyPem the vendor ECDSA P-256 private key (PKCS#8 PEM) — kept server-side only.
 */
export function signToken(payload: EntitlementTokenPayload, privateKeyPem: string): string {
  const json = Buffer.from(JSON.stringify(payload), 'utf8');
  const signature = cryptoSign('sha256', json, {
    key: createPrivateKey(privateKeyPem),
    dsaEncoding: 'ieee-p1363',
  });
  return base64url(json) + '.' + base64url(signature);
}
