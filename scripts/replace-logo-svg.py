"""Replace the inline R-monogram SVG with an <img> tag across all HTML files.

The site previously used an inline SVG mark in nav + footer of every page;
switching to a raster logo means each page needs an <img> tag instead.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Pattern matches the <svg class="logo-mark"> block regardless of indentation.
# The block is unique enough (logo-mark class + specific text content) that
# this regex won't false-match.
PATTERN = re.compile(
    r'<svg class="logo-mark"[^>]*>.*?</svg>',
    re.DOTALL,
)

REPLACEMENT = '<img class="logo-mark" src="/favicon-192.png" alt="The Reichmann Co.">'

def process(path: Path) -> int:
    text = path.read_text(encoding="utf-8")
    new_text, n = PATTERN.subn(REPLACEMENT, text)
    if n:
        path.write_text(new_text, encoding="utf-8")
    return n

def main():
    total_files = 0
    total_replacements = 0
    for html in ROOT.rglob("*.html"):
        # Skip the preview helper
        if html.name.startswith("_"):
            continue
        n = process(html)
        if n:
            rel = html.relative_to(ROOT)
            print(f"{rel}: {n} replacement(s)")
            total_files += 1
            total_replacements += n
    print(f"\nTotal: {total_replacements} replacements in {total_files} file(s)")

if __name__ == "__main__":
    main()
