// Cross-language self-test: signs a sample entitlement token with an EPHEMERAL P-256 key the
// same way src/lib/license/token.ts does, and prints { publicKey, token, payload } as JSON.
// Feed the output to the C# EntitlementTokenVerifier to prove the wire format is compatible
// (see the CrossLanguageTokenTests fixture in the Lumarix repo). Throwaway key — not production.
//   node scripts/license-selftest.mjs
import { generateKeyPairSync, sign as cryptoSign, createPrivateKey } from 'node:crypto';

const base64url = (buf) =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Mirror of signToken() in src/lib/license/token.ts — keep in sync.
function signToken(payload, privateKeyPem) {
  const json = Buffer.from(JSON.stringify(payload), 'utf8');
  const signature = cryptoSign('sha256', json, { key: createPrivateKey(privateKeyPem), dsaEncoding: 'ieee-p1363' });
  return base64url(json) + '.' + base64url(signature);
}

const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const publicB64 = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' });

const payload = {
  Company: 'Acme (Pty) Ltd',
  Plan: 'yearly',
  Seats: 3,
  Modules: ['inventory', 'payroll'],
  Status: 'active',
  IssuedAt: '2026-06-06T00:00:00.000Z',
  ValidUntil: '2099-01-01T00:00:00.000Z', // far future so the C# fixture stays Valid
};

console.log(JSON.stringify({ publicKey: publicB64, token: signToken(payload, privatePem), payload }, null, 2));
