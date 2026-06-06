# Founding tester onboarding kit

Everything needed to take someone from "I am interested" to an active, briefed Lumarix
founding tester. It pairs with the recruitment funnel already on the site: the
[Founding Testers wall](/founding-testers), the Beta Tester badge
(`public/brand/lumarix-beta-tester-badge.png`), and the early-access section on the
Lumarix product page.

Keep the founding circle small on purpose. Quality of feedback beats headcount.

The copy below is ready to paste into a LinkedIn DM, WhatsApp, or email. Replace the
`[bracketed]` placeholders. No em-dashes (house style); keep it that way if you edit.

---

## 1. The reply (when someone asks to join)

> Hi [Name], thank you for putting your hand up. The founding circle is small on purpose,
> and I would be glad to have your eyes on Lumarix.
>
> Here is how it works. You get free founding access to the full app (no card, nothing to
> pay), twelve months free once we launch, the official The Reichmann Co. Beta Tester badge
> for your profile, and your name on our Founding Testers wall. In return I am asking for
> honest feedback from real use, the kind only someone who lives in accounting software
> every day can give.
>
> Two quick things so I can set you up:
> 1. Drop me your WhatsApp number and I will add you to the founding circle group. That is
>    where we share builds and you flag anything you run into.
> 2. If you are happy to be credited on the wall, send me your name as you would like it
>    shown, your role, your business or practice, your city, and a LinkedIn link if you want
>    it attached. All optional.
>
> Once I have those I will send you the installer, your activation key, and a one-page brief
> on what to look at. Welcome aboard.

---

## 2. Onboarding checklist (what you do once they say yes)

> Internal, operator-only. This section is for you, not the tester. Do not send it.

1. **Provision a free founding licence.** Full access, generous seats, yearly so it does not
   lapse during the program. See `LICENSING.md` for the admin API. For a founding tester:

   ```bash
   curl -X POST https://thereichmannco.co.za/api/license/admin \
     -H "Authorization: Bearer $LICENSE_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"company":"[Their business] (Pty) Ltd","plan":"yearly","seats":5,"modules":["inventory","payroll"],"graceDays":60}'
   # -> returns accountKey: "LMX-XXXX-XXXX-XXXX"  (this is what you send them)
   ```

   The admin bearer token is in `license-admin-token.txt` (gitignored on your disk).

2. **Send the installer.** Until the public download page goes live (`DOWNLOAD_AVAILABLE` in
   `src/lib/downloads/releases.ts`, see `DOWNLOADS.md`), send `Lumarix-win-Setup.exe` directly,
   for example as a file in the founding circle WhatsApp group. After go-live, just point them
   at `thereichmannco.co.za/downloads/lumarix`.

3. **Send their activation key and the brief.** Paste the `LMX-...` key and the one-page brief
   from section 3 below.

4. **Add them to the founding circle WhatsApp group.**

5. **Add them to the wall** (only if they agreed to be credited). Append an entry to
   `src/data/foundingTesters.ts` and push to `main`. The site auto-deploys, and their name
   appears on `/founding-testers`:

   ```ts
   { name: 'Jane Doe', role: 'Bookkeeper', company: 'Doe & Co', location: 'Cape Town', url: 'https://www.linkedin.com/in/...' },
   ```

---

## 3. The one-page tester brief (send this to each new tester)

> ### Lumarix founding tester brief
>
> Welcome to the founding circle. You are one of a small group shaping Lumarix before it
> launches. This page covers what it is, what to look at, and how to tell us what you find.
>
> **What Lumarix is**
> A desktop accounting and ERP app for South African businesses. It runs on Windows, your
> data stays in one file on your own machine, and it is built for the way SA businesses
> actually keep books (VAT 201, EMP201 and EMP501, IRP5, provisional tax, and the rest).
> Think of it as a modern take on what you would use Pastel or Sage for.
>
> **Getting started**
> 1. Run the installer we sent you (Lumarix Setup). It installs in a few clicks and adds
>    Lumarix to your Start menu. We will let you know in the founding circle WhatsApp group
>    whenever a new build is ready.
> 2. Open Lumarix, create a company (or restore one), and add your first user.
> 3. Go to Administration, then License, paste the activation key we sent you, and click
>    Activate. That unlocks your full founding access.
> 4. You are in. Have a look around.
>
> **What to test**
> Use it the way you would use your real accounting software. The most useful thing you can do
> is run a normal piece of your own work through it and tell us where it felt wrong, slow, or
> confusing. A few areas worth a look:
> - Setting up a company, the chart of accounts, customers, suppliers, and stock items.
> - Capturing invoices, bills, payments, and receipts, and seeing them land in the ledgers.
> - The SA tax screens (VAT 201, EMP201, provisional tax) against numbers you already know.
> - The reports you rely on (trial balance, income statement, balance sheet, aged receivables
>   and payables).
> - Anything you do every day. If Lumarix cannot do it, or does it the long way around, that
>   is exactly what we want to hear.
>
> Please test on sample or copied data, not your only copy of real books. This is pre-release
> software and things can still change. You can back up a company at any time from the File menu.
>
> **How to report**
> Flag anything in the founding circle WhatsApp group. The more specific, the better:
> - What you were doing (the screen and the steps).
> - What you expected to happen.
> - What actually happened (a screenshot helps a lot).
>
> Small annoyances count as much as big bugs. If a label reads wrong or a flow feels clumsy,
> tell us. That feedback is the whole point.
>
> **What you get**
> - Free founding access to the full app now, and twelve months free after launch.
> - The official The Reichmann Co. Beta Tester badge for your profile.
> - Your name on our Founding Testers wall at thereichmannco.co.za/founding-testers.
> - A direct line to the people building Lumarix, with your feedback shaping what we build next.
> - If you would like one, a LinkedIn recommendation from us, or your business featured in a
>   Lumarix case study.
>
> Thank you for helping build the accounting software South African business deserves.

---

## 4. When a tester's feedback ships (a nice touch)

> Hi [Name], the [thing they flagged] is fixed in the latest build, going out in the group now.
> Thank you for catching it. This is exactly why the founding circle exists.

A short note like this, sent when their feedback lands in a build, is the single best way to
keep founding testers engaged. People stay involved when they can see their fingerprints on
the product.
