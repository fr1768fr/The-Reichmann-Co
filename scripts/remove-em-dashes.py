"""Replace em-dashes (—) across the site with appropriate punctuation.

Em-dashes are a classic AI-generated copy tell. Each instance gets a
contextual replacement (period, comma, colon) instead of a blanket
swap, since some are sentence breaks and others are parentheticals or
definition separators.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Each tuple is (search, replace). Search strings are long enough to be
# unique within their file; same string may occur in multiple files,
# which is fine — the replacement applies wherever it matches.
REPLACEMENTS = [
    # Meta descriptions / titles: use a clean break (period or colon)
    ('About The Reichmann Co. — a South Africa', 'About The Reichmann Co. A South Africa'),
    ('Insights from The Reichmann Co. — notes', 'Insights from The Reichmann Co. Notes'),
    ('Services from The Reichmann Co. — web applications', 'Services from The Reichmann Co. Web applications'),
    ('Reichmann Co. Lumarix — Enterprise Resource Planning reimagined', 'Reichmann Co. Lumarix. Enterprise Resource Planning reimagined'),
    ('The Reichmann Co. — Software, Apps &amp; SaaS', 'The Reichmann Co. Software, Apps &amp; SaaS'),
    ('The Reichmann Co. — Software, Apps & SaaS', 'The Reichmann Co. Software, Apps & SaaS'),
    ('content="Lumarix — Enterprise Resource Planning reimagined', 'content="Lumarix. Enterprise Resource Planning reimagined'),
    ('built by The Reichmann Co. — currently in development', 'built by The Reichmann Co. Currently in development'),
    ('Modern web app development — fast, accessible, responsive.', 'Modern web app development. Fast, accessible, responsive.'),
    ('Native iOS and Android applications — polished, performant, built to scale.', 'Native iOS and Android applications. Polished, performant, built to scale.'),

    # Body copy — split sentences (em-dash followed by what reads as a new clause)
    ('we work with teams worldwide —\n                            primary hours', 'we work with teams worldwide. Primary hours'),
    ('Tell us about your project — we', "Tell us about your project. We"),
    ('Check back soon — or subscribe', 'Check back soon, or subscribe'),
    ('Async — we', 'Async. We'),
    ('software for ourselves —\n                    products designed', 'software for ourselves. Products designed'),
    ('Vercel, Fly.io, or Cloudflare — chosen based on', 'Vercel, Fly.io, or Cloudflare. Chosen based on'),
    ('faster to launch — we', 'faster to launch. We'),
    ('current frameworks —\n                    responsive, accessible, and fast on every device.', 'current frameworks. Responsive, accessible, and fast on every device.'),
    ('current frameworks — responsive, accessible, and fast on every device.', 'current frameworks. Responsive, accessible, and fast on every device.'),
    ('pleasure to use —\n                    on desktop, tablet, and phone.', 'pleasure to use, on desktop, tablet, and phone.'),
    ('that work —\n                        mobile, desktop', 'that work. Mobile, desktop'),
    ('that work — mobile, desktop', 'that work. Mobile, desktop'),
    ('End-to-end SaaS development — from blank canvas to paying customers.', 'End-to-end SaaS development. From blank canvas to paying customers.'),
    ('End-to-end SaaS development. We design, build, and ship\n                            subscription products — from blank canvas to paying customers.', 'End-to-end SaaS development. We design, build, and ship\n                            subscription products, from blank canvas to paying customers.'),
    ('subscription\n                    products — from blank canvas to paying customers.', 'subscription\n                    products, from blank canvas to paying customers.'),

    # Parenthetical em-dashes mid-sentence → commas
    ('business processes — from financial management', 'business processes, from financial management'),
    ('customer engagement — into a single', 'customer engagement, into a single'),
    ('makes a product better — not as a sticker', 'makes a product better, not as a sticker'),
    ('Native iOS and Android applications — from MVP to App Store launch and beyond', 'Native iOS and Android applications, from MVP to App Store launch and beyond'),
    ('Native iOS and Android applications —\n                    polished, performant, and built\n                    to scale from MVP to App Store launch and beyond.', 'Native iOS and Android applications, polished, performant, and built\n                    to scale from MVP to App Store launch and beyond.'),
    ('Lumarix</a> — our own', 'Lumarix</a>, our own'),
    ('ERP for accountants — is built', 'ERP for accountants, is built'),
    ('for Windows, macOS, and Linux —\n                    for when the browser doesn\'t cut it.', "for Windows, macOS, and Linux, for when the browser doesn't cut it."),

    # Privacy policy provider list: colon reads cleanest for "name — description" definition pattern
    ('Inc.</strong> (United States) — website hosting', 'Inc.</strong> (United States): website hosting'),
    ('Inc.</strong> (United States) — processing of contact', 'Inc.</strong> (United States): processing of contact'),
    ('Inc.</strong> (United States) — delivery of transactional', 'Inc.</strong> (United States): delivery of transactional'),
    ('Domains.co.za</strong> (South Africa) — domain registration', 'Domains.co.za</strong> (South Africa): domain registration'),
]

def main():
    files = sorted(Path(ROOT).rglob('*.html'))
    total_files = 0
    total_replacements = 0
    for html in files:
        if html.name.startswith('_'):
            continue
        text = html.read_text(encoding='utf-8')
        original = text
        file_replacements = 0
        for search, replace in REPLACEMENTS:
            if search in text:
                count = text.count(search)
                text = text.replace(search, replace)
                file_replacements += count
        if text != original:
            html.write_text(text, encoding='utf-8')
            print(f'  {html.relative_to(ROOT)}: {file_replacements} replacements')
            total_files += 1
            total_replacements += file_replacements

    print(f'\nTotal: {total_replacements} em-dashes removed across {total_files} files')

    # Report remaining em-dashes
    remaining = 0
    for html in files:
        if html.name.startswith('_'):
            continue
        text = html.read_text(encoding='utf-8')
        n = text.count('—')
        if n:
            print(f'  STILL HAS: {html.relative_to(ROOT)} ({n} em-dashes left)')
            remaining += n
    print(f'\nRemaining em-dashes: {remaining}')

if __name__ == '__main__':
    main()
