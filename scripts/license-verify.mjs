// Verify a Lumarix entitlement token against a public key (SPKI base64) — the same check the
// C# app performs. Prints VALID/INVALID and the (non-secret) payload. Usage:
//   node scripts/license-verify.mjs <token> <publicKeyBase64>
import { verify as cryptoVerify, createPublicKey } from 'node:crypto';

const [, , token, pub] = process.argv;
if (!token || !pub) {
  console.error('usage: node scripts/license-verify.mjs <token> <publicKeyBase64>');
  process.exit(2);
}

const fromB64Url = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const [p0, p1] = token.split('.');
const jsonBuf = fromB64Url(p0);
const sig = fromB64Url(p1);
const key = createPublicKey({ key: Buffer.from(pub, 'base64'), format: 'der', type: 'spki' });
const ok = cryptoVerify('sha256', jsonBuf, { key, dsaEncoding: 'ieee-p1363' }, sig);

console.log(ok ? 'VALID' : 'INVALID');
console.log(jsonBuf.toString('utf8'));
process.exit(ok ? 0 : 1);
