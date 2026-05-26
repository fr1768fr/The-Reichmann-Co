"""One-time bulk replace: champagne/gold accent palette → finance blue.

Touches styles.css, og-image.svg, and api/beta-signup.js. Other files
that mention the old palette only in documentation (TODO.md) are left
for manual editing since they reference the colour by name.

Mapping rationale:
  Dark theme primary  #c9a675 → #3b82f6  (Tailwind blue-500, vibrant on black)
  Dark theme bright   #d4b88a → #60a5fa  (blue-400)
  Dark theme deep     #a88554 → #1d4ed8  (blue-700, same as light primary)
  Light theme deep    #8a6f3f → #1e3a8a  (blue-900)

  rgba triplet 201,166,117 → 59,130,246  (blue-500)
  rgba triplet 212,184,138 → 96,165,250  (blue-400)
  rgba triplet 168,133,84  → 29,78,216   (blue-700)
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

HEX_REPLACEMENTS = {
    "#c9a675": "#3b82f6",
    "#d4b88a": "#60a5fa",
    "#a88554": "#1d4ed8",
    "#8a6f3f": "#1e3a8a",
}

# rgba() — match with optional spaces between the channel values.
RGBA_REPLACEMENTS = [
    (re.compile(r"201,\s*166,\s*117"), "59, 130, 246"),
    (re.compile(r"212,\s*184,\s*138"), "96, 165, 250"),
    (re.compile(r"168,\s*133,\s*84"), "29, 78, 216"),
]

TARGETS = [
    ROOT / "styles.css",
    ROOT / "og-image.svg",
    ROOT / "api" / "beta-signup.js",
]

def process(path: Path) -> int:
    text = path.read_text(encoding="utf-8")
    orig = text
    for old, new in HEX_REPLACEMENTS.items():
        text = text.replace(old, new)
    for pat, replacement in RGBA_REPLACEMENTS:
        text = pat.sub(replacement, text)
    if text != orig:
        path.write_text(text, encoding="utf-8")
        # Count changes by diffing line counts that contain any of the new values.
        return sum(text.count(v) - orig.count(v) for v in HEX_REPLACEMENTS.values())
    return 0

def main():
    for p in TARGETS:
        if not p.exists():
            print(f"SKIP (missing): {p}")
            continue
        n = process(p)
        rel = p.relative_to(ROOT)
        print(f"{rel}: {'changed' if n != 0 else 'no changes'}")

if __name__ == "__main__":
    main()
