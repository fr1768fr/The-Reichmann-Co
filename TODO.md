# The Reichmann Co. — Website TODO

Outstanding work and improvements for **thereichmannco.co.za**.
Last updated: 26 May 2026

> ⚠️ Project folder is still named `reichmann-holdings/` from the original brand. Inconsequential for deployment — Vercel reads from the GitHub repo regardless of local folder name. Rename optional.

---

## 🔴 High Priority — do soon

### Off-keyboard work (biggest wins for getting found)
- [x] **Create LinkedIn Company Page** for The Reichmann Co. — live at https://www.linkedin.com/company/the-reichmann-co/. Footer link + sameAs schema added.
- [ ] **Google Business Profile** — business.google.com → add business → category "Software company" → verify (postcard takes 1-2 weeks).
- [ ] **Personal LinkedIn / social announce post** with link to thereichmannco.co.za
- [ ] **Tell ~5 accountants** about Lumarix beta — they're the target users for the only product in development

### Trust signals on site
- [ ] Add an "About Franco" subsection under the About section (name, role, brief bio)
- [ ] Add founder photo (optional but builds trust)
- [x] Add LinkedIn link in the footer once page exists

### Approach section: make it specific
- [ ] Current values ("Engineering Craft / Speed to Market / Every Platform / Honest Partnership") are generic
- [ ] Needs concrete differentiation — stack choices, process steps, what makes The Reichmann Co. actually different
- [ ] Requires strategic thinking from you, then I rewrite

### Legal / CIPC follow-ups
- [ ] **Wait for CIPC name change to process** (2-4 weeks from when COR15.2 was filed) — when approved, drop "(formerly Reichmann Holdings)" wording in privacy.html §1 and §13
- [ ] **Formally appoint Information Officer** and register at https://inforegulator.org.za (POPIA requirement)
- [ ] Update privacy.html §13 with named Information Officer once appointed
- [ ] Have a SA data-protection attorney review privacy policy

---

## 🟡 Medium Priority — next sprint

### Old domain cleanup (when you're ready)
- [ ] **Cancel Email Only 10 plan on reichmannholdings.co.za** — saves R69/mo. Old mailbox info@reichmannholdings.co.za stops working. Forwarder still routes any stragglers from old domain users to new mailbox.
- [ ] Decide whether to renew reichmannholdings.co.za domain when annual renewal comes up. Letting it expire is fine since it's removed from Vercel anyway.
- [ ] Delete old reichmannholdings.co.za property from Google Search Console once new one is fully indexed (~4 weeks)
- [ ] Reconsider re-adding old domain to Vercel as 308 redirect to new — currently old URLs return generic Vercel error. (Decided to wait it out for now.)

### Sharing & SEO polish
- [ ] Bing Webmaster Tools — same drill as Google Search Console but for Bing. 10 min, free.
- [ ] Request indexing for `/privacy.html` in Search Console (separate request)
- [ ] Lighthouse audit — perf + a11y on both light and dark themes
- [ ] WebAIM WAVE scan for colour contrast / ARIA issues

### Lumarix card polish
- [ ] Three-paragraph description is dense — consider summary + "Read more" expand
- [ ] Add real launch date once known
- [ ] Add screenshots / mockups once available

### Footer enhancements
- [ ] Direct email link `mailto:info@thereichmannco.co.za`
- [ ] LinkedIn / X / GitHub links once accounts exist

---

## 🟢 Low Priority — polish

### Mobile & accessibility
- [ ] Real-device testing on iPhone + Android
- [ ] Verify keyboard navigation works through whole site (Tab)
- [ ] Confirm SVG favicon caches correctly across browsers

### Performance
- [ ] Consider self-hosting Google Fonts (saves DNS lookup + improves privacy)

### DNS hygiene
- [ ] thereichmannco.co.za still has wildcard CNAME `*.thereichmannco.co.za → thereichmannco.co.za`. Harmless but worth knowing.
- [ ] Consider cleaning up unused CNAMEs in domains.co.za DNS (cpcalendars, cpcontacts) if you never use cPanel calendar/contacts features

### Email setup polish
- [ ] Set up Gmail "Send mail as" for info@thereichmannco.co.za so replies can be sent from Gmail's UI (uses SMTP cp68.domains.co.za, port 465, SSL)

---

## 🔵 Future expansions

### Lumarix (planned: SaaS ERP for accountants)
- [ ] Domains already secured: **lumarixapp.com** + **lumarix.co.za** (registered on Vercel 9+ days ago, ready to use)
- [ ] **Database decision: managed Postgres (Supabase / Neon)** — not self-hosted. Use local Postgres in Docker for dev, Supabase for staging/prod.
- [ ] Dedicated product page (separate from holding company site)
- [ ] **Privacy Policy expansion** for Lumarix — Data Processor relationship under POPIA (DPAs, 72hr breach notification, sub-processor list, cross-border specifics)
- [ ] Terms of Service for SaaS
- [ ] Cookie Policy if/when analytics/marketing tracking added
- [ ] Case studies / testimonials once early beta users go live

### Additional products
- [ ] When new products added to "Current Products In Development" section, switch products grid from single-column to multi-column. Edit `.products-grid` in styles.css.

### Business documents
- [ ] Invoices, quotes, employment contracts need company reg number + name (Companies Act §32). Once CIPC change approved, use the new name; meanwhile use "The Reichmann Co. Pty Ltd (formerly Reichmann Holdings)".

---

## ⚡ Quick wins (one-sitting tasks)

1. Create LinkedIn Company Page (15 min)
2. Apply for Google Business Profile (10 min, verification takes 1-2 weeks)
3. Set up Gmail "Send mail as" for info@thereichmannco.co.za (10 min)
4. Add LinkedIn link to footer once page exists (5 min code change)
5. Submit privacy.html for indexing in Search Console (2 min)
6. Bing Webmaster Tools (10 min)

---

## 📁 Reference — current state

| Component | Setup |
|---|---|
| Live site | https://thereichmannco.co.za |
| GitHub repo | https://github.com/fr1768fr/The-Reichmann-Co (private) |
| Vercel project | the-reichmann-co (under franco-s-projects8) |
| Auto-deploy | Push to `main` → auto-deploys to production |
| Custom domain | thereichmannco.co.za (DNS at domains.co.za, hosted on Vercel) |
| Mailbox | info@thereichmannco.co.za (cPanel via Web Hosting Basic, R109/mo) |
| Email forwarder | info@thereichmannco.co.za → francoreichmann69@gmail.com |
| Transactional sender | beta@thereichmannco.co.za (Resend, domain verified) |
| Contact form | Formspree endpoint `xojbnyog` |
| Beta signup | Vercel serverless function `/api/beta-signup` → Resend API |
| CIPC reg | 2026/389746/07 |
| Legal name | The Reichmann Co. (Pty) Ltd (formerly Reichmann Holdings, change in progress) |
| Privacy Policy | /privacy.html |
| 404 page | /404.html ("Lost in orbit" branded) |

### Vercel env vars (production)
| Variable | Value |
|---|---|
| RESEND_API_KEY | (set, rotated once) |
| RESEND_FROM | `Lumarix Beta <beta@thereichmannco.co.za>` |
| NOTIFICATION_EMAIL | `info@thereichmannco.co.za` |

### Visual identity
- **Logo:** serif "R" monogram + champagne divider + "CO" caption (premium watchmaker aesthetic)
- **Palette:** pure black / pure white + champagne `#c9a675` accent
- **Display font:** Playfair Display (serif) — headings
- **Body font:** Inter (sans) — body text
- **Mono:** JetBrains Mono — labels, code-like elements

### cPanel access
- URL: https://cp68.domains.co.za:2083
- Username: thereich
- **TODO: change cPanel password** (the original was shared in chat — security hygiene)

### Google Search Console
- Property: thereichmannco.co.za (Domain property, verified via TXT)
- Sitemap submitted: https://thereichmannco.co.za/sitemap.xml
- Home page indexing requested (waiting 24-72h for first index)

---

## ✅ Completed in this session (26 May 2026)

- Full rebrand: Reichmann Holdings → The Reichmann Co.
- New logo design (serif R monogram replacing atomic concept)
- Palette swap: electric blue + slate → black/white + champagne
- Typography: added Playfair Display serif for headings
- Re-generated all favicons (32, 48, 96, 180, 192, 512px) + OG image
- New domain (thereichmannco.co.za) registered + DNS configured
- Web Hosting Basic package on cPanel (R109/mo, includes email mailboxes)
- Mailbox info@thereichmannco.co.za created in cPanel
- Forwarder info@ → francoreichmann69@gmail.com active
- Resend domain re-verified for thereichmannco.co.za
- Vercel env vars updated for new domain
- All HTML/JSON-LD/sitemap/robots references migrated
- Old domain removed from Vercel
- Google Search Console: new property verified, sitemap submitted, home page indexing requested

### Later same day (multi-page split + content fixes)

- GitHub repo renamed `reichmann-holdings` → `The-Reichmann-Co` + set to private
- Vercel project renamed `reichmann-holdings` → `the-reichmann-co`
- Local git remote + `.vercel/project.json` synced to new names
- **Multi-page split:** site broken from single-page into 13 pages (`/`, `/about.html`, `/services.html` + 6 sub-pages, `/products.html`, `/products/lumarix.html`, `/contact.html`, `/blog/`)
- Hero CTAs swapped: "Start a Project" now primary, "What We Build" secondary
- Lead services narrowed to **Web Applications + SaaS Products** on homepage; other 4 (Mobile, Desktop, Cloud, AI) live on `/services.html`
- Subtle South Africa positioning in hero, About, Contact, and schema PostalAddress
- SAST hours rephrased as "Primary hours" + explicit async outside-hours reply commitment
- Schema.org expanded: per-page Service, BreadcrumbList, SoftwareApplication (Lumarix), AboutPage, ContactPage, CollectionPage, WebSite, Blog + openingHoursSpecification on Organization
- sitemap.xml expanded to all 14 URLs
- privacy.html + 404.html nav/footer migrated from anchor links to page links
- styles.css extended with new component classes (`.breadcrumb`, `.feature-list`, `.service-detail-grid`, `.services-subhead`, `.service-callout`, `.service-card-featured`, `.contact-cta`, `.text-link`, etc.)

> Note: nav + footer markup is duplicated across all ~13 HTML files. Updating nav links requires editing each page — consider a build step (11ty, Astro) or JS partials loader when this becomes painful.

---

## ⚠️ Known issues / accepted tradeoffs

1. **Old domain `reichmannholdings.co.za` returns generic Vercel error** for any path. Decision was to delete from Vercel rather than maintain 308 redirects. Old Google search results will gradually 404-out over 4-12 weeks.

2. **Old Google search results still show "Reichmann Holdings"** — Google's cache lag. Will naturally update over 1-4 weeks. No "Change of Address" tool usage (would have required keeping redirects).

3. **CIPC name change still in processing window** (2-4 weeks from filing). Until approved, legal name is technically still "Reichmann Holdings Pty Ltd" — privacy policy uses "formerly" language during this period.

4. **Email Only 10 plan on old domain still active** (R69/mo) — can be cancelled now that everything's on new domain. Optional cost saving.
