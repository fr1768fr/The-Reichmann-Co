# Reichmann Holdings — Website TODO

Outstanding work and improvements for **thereichmannco.co.za**.
Last updated: 25 May 2026

---

## 🔴 High Priority — do soon

### Trust signals & credibility
- [ ] Add an "About Franco" subsection (name, role, brief bio) under the About section
- [ ] Add founder photo (optional but builds trust)
- [ ] Add LinkedIn profile link in the footer and About section
- [ ] Consider adding a "Founding cohort" / "What we build first with early clients" angle instead of implying an established track record

### Approach section: make it specific
- [ ] Current values (Engineering Craft / Speed to Market / Every Platform / Honest Partnership) are generic — any tech firm could write them
- [ ] Replace with specifics: tech stack choices, process steps, what makes Reichmann actually different
- [ ] Possible angles: SA roots + international reach, fixed-price vs hourly, framework specialisations, open-source contributions

### Analytics
- [ ] Enable **Vercel Analytics** (one toggle in Vercel project settings, cookieless free tier)
- [ ] If using a different analytics provider, update Privacy Policy §10 with the opt-out mechanism

### Legal follow-ups (POPIA)
- [ ] **Formally appoint Information Officer** (likely you as CEO) and **register them** with the SA Information Regulator at https://inforegulator.org.za (free online form, legally required)
- [ ] Update `privacy.html` §13 to name the appointed Information Officer (currently says "Chief Executive Officer" generically)
- [ ] Have a South African data-protection attorney review the current Privacy Policy before relying on it

---

## 🟡 Medium Priority — next sprint

### Sharing & SEO polish
- [ ] Design and add an **Open Graph image** (1200×630 PNG) so link previews on WhatsApp / LinkedIn / X look polished
- [ ] Create `sitemap.xml` listing all public URLs
- [ ] Create `robots.txt` allowing crawlers
- [ ] Add **JSON-LD `Organization` schema** to `index.html` for better search results

### Custom 404 page
- [ ] Create `404.html` matching site aesthetic so bad URLs don't show the Vercel default

### Footer enhancements
- [ ] Add direct email link (`mailto:info@thereichmannco.co.za`)
- [ ] Add LinkedIn / X / GitHub links (once accounts exist)

### Lumarix card polish
- [ ] The three-paragraph description is heavy reading. Consider:
  - Summary + "Read more" expand
  - Tabbed sections (Overview / Modules / Vision)
- [ ] Add screenshots / mockups once available
- [ ] Update "Launch: Coming Soon" with a real target window when known (e.g., "Q4 2026")

---

## 🟢 Low Priority — polish

### Mobile & accessibility
- [ ] Real-device testing on iPhone + Android (not just browser devtools)
- [ ] Lighthouse accessibility audit — fix any critical issues
- [ ] WebAIM WAVE scan for colour contrast and ARIA issues
- [ ] Verify keyboard navigation works through the whole site (Tab through everything)

### Performance
- [ ] Run Lighthouse performance audit
- [ ] Consider self-hosting Google Fonts (saves a DNS lookup + improves privacy)
- [ ] Confirm SVG favicon caches correctly across browsers

### DNS hygiene
- [ ] Remove `include:_spf.tld-mx.com` from the root SPF record at domains.co.za (leftover from the parking setup, no longer needed)

### Email setup polish
- [ ] Set up Gmail "Send mail as" for `info@thereichmannco.co.za` so replies can be sent from Gmail's UI directly
- [ ] Verify both contact-form submissions (Formspree) and beta signups (Resend) land cleanly in `info@`

---

## 🔵 Future expansions

### When Lumarix launches
- [ ] **Major Privacy Policy expansion**: Lumarix will process client/employee data on behalf of accounting firms = Data Processor relationship under POPIA. Adds obligations:
  - Data Processing Agreements (DPAs) with clients
  - 72-hour breach notification timelines
  - Sub-processor list management
  - Cross-border transfer specifics for SaaS users
- [ ] Create separate **Terms of Service** for the SaaS product
- [ ] Add **Cookie Policy** if analytics/marketing tracking is added
- [ ] Create a dedicated **Lumarix product page** (separate from the holding company site)
- [ ] Add case studies / testimonials once early beta users go live

### Additional products
- [ ] When new products are added to the "Current Products In Development" section, switch the products grid from single-column to multi-column. CSS already supports this — just change `grid-template-columns` and `max-width` on `.products-grid` in `styles.css`

### Business documents
- [ ] When you start producing invoices, quotes, employment contracts, etc. — these also need the company reg number + full name per Companies Act §32

---

## ⚡ Quick wins (one-sitting tasks)

These are all low-effort, high-impact. Could knock them out in 1–2 hours:

1. Enable Vercel Analytics
2. Add LinkedIn link to footer
3. Create OG image (use Canva / Figma)
4. Add `sitemap.xml` and `robots.txt`
5. Clean up SPF record (remove tld-mx leftover)
6. Add custom 404 page

---

## 📁 Reference — current state

| Component | Setup |
|---|---|
| Site | https://thereichmannco.co.za |
| Custom domain | thereichmannco.co.za (DNS at domains.co.za, hosting on Vercel) |
| Mailbox | info@thereichmannco.co.za (domains.co.za Email Only 10) |
| Transactional sender | beta@thereichmannco.co.za (Resend, domain verified) |
| Contact form | Formspree endpoint `xojbnyog` |
| Beta signup | Vercel serverless function `/api/beta-signup` → Resend API |
| Company reg | 2026/389746/07 |
| Privacy Policy | /privacy.html |

---

## ✅ Recently completed (for memory)

- Site design + atomic logo
- Light/dark mode toggle with View Transitions circle reveal
- Pulsing glow on nav + footer logos
- Custom domain wired up (A record + www CNAME → Vercel)
- domains.co.za Email Only 10 set up + MX records corrected
- Formspree integrated for contact form
- Resend integrated for beta signup welcome + admin notification emails
- Resend domain verification for `thereichmannco.co.za`
- Beta signup form added to Lumarix card
- API key rotated cleanly
- POPIA-compliant Privacy Policy published
- CIPC reg number `2026/389746/07` added to all public-facing materials
