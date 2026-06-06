// Generates the production ECDSA P-256 licensing key pair.
//
//   PRIVATE key (PKCS#8 PEM) -> license-private-key.pem   (gitignored)
//       Put its contents in the Vercel env var LICENSE_PRIVATE_KEY. Keep it secret.
//   PUBLIC key (SPKI base64)  -> license-public-key.txt + printed below
//       Embed it in the Lumarix app build:  dotnet build -c Release -p:LicensePublicKey=<base64>
//
// The public half is byte-for-byte what C# ECDsa.ExportSubjectPublicKeyInfo() produces, so the
// app verifies server-signed tokens against it. Run from the website repo root:
//   node scripts/license-keygen.mjs
import { generateKeyPairSync } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }); // P-256

const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' });
const publicB64 = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');

writeFileSync('license-private-key.pem', privatePem);
writeFileSync('license-public-key.txt', publicB64 + '\n');

console.log('Licensing key pair generated.\n');
console.log('  PRIVATE -> license-private-key.pem  (gitignored — never commit)');
console.log('     Set it as the Vercel env var LICENSE_PRIVATE_KEY (paste the whole PEM).\n');
console.log('  PUBLIC (SPKI base64) -> license-public-key.txt , and here:\n');
console.log('     ' + publicB64 + '\n');
console.log('  Build the app with:');
console.log('     dotnet build -c Release -p:LicensePublicKey=' + publicB64 + '\n');
