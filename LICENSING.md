# Lumarix licensing backend

Online activation for the Lumarix desktop app. The app sends an **account key**; this service
looks up the customer's subscription and returns a **signed entitlement token** the app verifies
offline (and caches, working until the token's grace window ends).

- `POST /api/license/activate` — first activation. Rejects unknown or cancelled subscriptions.
- `POST /api/license/refresh` — silent re-check on launch. Reflects a lapsed subscription so the
  app stops honouring it once the cached token expires.
- `GET|POST|DELETE /api/license/admin` — provision/list/remove subscriptions (bearer-auth).

The app code lives in the **Lumarix** repo (`Lumarix.Core/Licensing`, `LicenseService`); this is
the server half. Token format is pinned by the cross-language test there
(`CrossLanguageTokenTests`): `base64url(json) + "." + base64url(ECDSA-SHA256, IEEE-P1363)`, JSON
fields PascalCase (`Company, Plan, Seats, Modules, Status, IssuedAt, ValidUntil`).

## One-time setup

1. **Keys** — from the repo root: `node scripts/license-keygen.mjs`. It writes the private key to
   `license-private-key.pem` (gitignored) and prints the public key (base64).
   - Set the private key as the Vercel env var **`LICENSE_PRIVATE_KEY`** (paste the PEM, or a
     base64 of it). Keep it secret; never commit it.
   - Build the **app** with the public key embedded:
     `dotnet build -c Release -p:LicensePublicKey=<base64>` (see the app's `Lumarix.App.csproj`).
2. **Store** — add an Upstash Redis integration via the Vercel dashboard (Storage → Marketplace).
   It injects `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`. Locally, with no KV env set, a
   gitignored `.license-subscriptions.json` file is used instead.
3. **Admin token** — set **`LICENSE_ADMIN_TOKEN`** to a long random string.
4. **App host** — the app defaults to `https://license.thereichmannco.co.za`; point it elsewhere
   with the `LUMARIX_LICENSE_URL` env var, or change `LicensingEndpoints.DefaultBaseUrl` in the app.

## Provisioning a subscription

```bash
curl -X POST https://thereichmannco.co.za/api/license/admin \
  -H "Authorization: Bearer $LICENSE_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"company":"Acme (Pty) Ltd","plan":"yearly","seats":5,"modules":["inventory","payroll"]}'
# -> { ok, subscription: { accountKey: "LMX-XXXX-XXXX-XXXX", ... } }  (send the accountKey to the customer)
```

Fields: `company` (required), `plan` (`monthly`|`yearly`), `seats` (int ≥ 1), `modules`
(`inventory`, `payroll`), optional `status` (`active`|`past_due`|`cancelled`, default `active`),
`graceDays` (1–365, default 21), `accountKey` (auto-generated if omitted). Re-POST the same
`accountKey` to edit. `GET ?accountKey=…` reads one, `GET` lists all, `DELETE ?accountKey=…` removes.

## Pricing model (reference)

Base: per active user (R299/mo, R2999/yr) — "basic accounting", always included. Advanced modules:
per company (R1199/mo, R11999/yr each) — currently `inventory` (Inventory & Distribution) and
`payroll`. Adding a module: add its wire code to `KNOWN_MODULES` in `admin.ts` and to the app's
`Module` enum.
