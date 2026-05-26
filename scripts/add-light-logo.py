"""Insert a second <img> for the light-mode logo alongside the existing
dark <img>, in nav + footer of every HTML page.

Idempotent: skips files where the light variant already exists.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

OLD = re.compile(
    r'<img class="logo-mark" src="/favicon-192\.png" alt="The Reichmann Co\.">'
)

NEW = (
    '<img class="logo-mark logo-mark-dark" src="/favicon-192.png" alt="The Reichmann Co.">'
    '<img class="logo-mark logo-mark-light" src="/favicon-light-192.png" alt="" aria-hidden="true">'
)

def process(path: Path) -> int:
    text = path.read_text(encoding="utf-8")
    if "logo-mark-light" in text:
        return 0
    new_text, n = OLD.subn(NEW, text)
    if n:
        path.write_text(new_text, encoding="utf-8")
    return n

def main():
    total = 0
    for html in ROOT.rglob("*.html"):
        if html.name.startswith("_"):
            continue
        n = process(html)
        if n:
            print(f"{html.relative_to(ROOT)}: {n}")
            total += n
    print(f"\nTotal: {total} replacements")

if __name__ == "__main__":
    main()
