# Lumarix downloads & update feed

The Reichmann site hosts the Lumarix Windows installer and its Velopack auto-update feed at:

```
https://thereichmannco.co.za/downloads/lumarix/
```

The installed app polls this URL to update itself; new users download the installer from the
landing page at `/downloads/lumarix`.

## How it works

The large binaries (the ~85MB+ `Setup.exe` and per-release `*-full.nupkg`) **cannot** live in the
Vercel deployment, because the whole deployment artifact must stay under Vercel's ~250MB limit and
the binaries grow with every release. So:

- **`public/downloads/lumarix/releases.win.json`** is the small Velopack feed index. It is a static
  file served by Vercel's CDN. It is committed to the repo and updated each release. (It currently
  holds `{"Assets":[]}`, meaning "no release published yet".)
- **`src/pages/downloads/lumarix/[file].ts`** is a serverless route (`prerender = false`) that takes
  a request for `Lumarix-win-Setup.exe`, `Lumarix-<ver>-full.nupkg`, or a delta, validates the name
  against an allowlist, and **302-redirects** to the file in off-Vercel object storage. It returns
  500 "Downloads are not configured" until the storage URL is set, and 404 for any other name.
- **`src/lib/downloads/releases.ts`** resolves the storage base URL from the
  `LUMARIX_RELEASES_BASE_URL` env var and builds the redirect target.

Velopack resolves package filenames **relative** to the feed URL, so it requests
`/downloads/lumarix/Lumarix-<ver>-full.nupkg`, which the route redirects to storage. The bytes never
pass through the function (a redirect, not a proxy), so the size/duration limits never apply.

## One-time setup (Franco)

1. **Pick object storage** for the binaries. Recommended: **Backblaze B2** (cheapest, near-zero
   egress) or **Cloudflare R2**. A *public* bucket is simplest (no signing needed). Vercel Blob also
   works if you prefer to stay in the Vercel ecosystem.
2. Create a bucket (e.g. `lumarix-releases`) and note its public base URL, e.g.
   `https://f000.backblazeb2.com/file/lumarix-releases`.
3. In the Vercel project settings, add an env var alongside the existing `LICENSE_*` vars:
   ```
   LUMARIX_RELEASES_BASE_URL = https://<your-bucket-public-base-url>
   ```
   (No trailing slash needed; the code trims one.) Without this, downloads return 500.

## Per-release runbook

1. In the **Lumarix app repo**, cut the release: `./build/pack.ps1 -Version <x.y.z> -LicensePublicKey <prod key>`
   (see that repo's `RELEASING.md`). This produces `Lumarix-win-Setup.exe`,
   `Lumarix-<x.y.z>-full.nupkg`, and a generated `releases.win.json`.
2. **Upload** `Lumarix-win-Setup.exe` and `Lumarix-<x.y.z>-full.nupkg` (and any delta) to the bucket.
3. **Copy the generated `releases.win.json`** verbatim into
   `public/downloads/lumarix/releases.win.json` here. Do not hand-edit the schema; use exactly what
   `vpk pack` produced (field names, SHA1/SHA256, and Size must match the uploaded bytes or Velopack
   rejects the update).
4. First release only: set `DOWNLOAD_AVAILABLE = true` in `src/lib/downloads/releases.ts` so the
   `/downloads/lumarix` button goes live (it shows a "coming at launch" state until then).
5. **Deploy:** commit to `main` and push. Vercel auto-deploys `main` to production. Git deploys ship
   only committed files, so the gitignored secrets never upload; they live in Vercel env vars.
6. Verify:
   ```
   curl https://thereichmannco.co.za/downloads/lumarix/releases.win.json      # the index
   curl -I https://thereichmannco.co.za/downloads/lumarix/Lumarix-win-Setup.exe   # expect 302 -> storage
   ```
   Then run the installed app's Help, Check for updates against the live feed.

## Go-live checklist (turning the download on)

The `/downloads/lumarix` landing page shows a "coming at launch" state until the binaries are hosted.
To open the download:

1. Set `LUMARIX_RELEASES_BASE_URL` in Vercel and upload the binaries + the real `releases.win.json`
   (per the runbook above).
2. Flip `DOWNLOAD_AVAILABLE` to `true` in `src/lib/downloads/releases.ts`.
3. Enable the "Download for Windows" button on `src/pages/products/lumarix.astro` (remove `disabled`,
   point it at `/downloads/lumarix`), and update the "available at launch" note.
4. Commit to `main` and push (auto-deploys to production).

## Routing note

Vercel serves the static `releases.win.json` in preference to the dynamic `[file].ts` function for
that exact path. This is confirmed live: `GET /downloads/lumarix/releases.win.json` returns the JSON,
and the function only handles binary filenames (verified returning a graceful 500 until storage is
configured). If it ever regresses, add a `vercel.json` rewrite to force the static file.
