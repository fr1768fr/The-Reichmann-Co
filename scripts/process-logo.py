"""Process source-logo.png into transparent logo + favicon variants.

Removes white background with a soft threshold so anti-aliased edges
don't leave a halo, then pads to square and resizes for each favicon
target. Run with: python scripts/process-logo.py
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source-logo.png"

# Background removal thresholds (Euclidean distance from pure white, 0-441 range)
HARD = 20   # below this -> fully transparent
SOFT = 70   # above this -> fully opaque; in-between -> gradient

def cutout(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    arr = np.array(im)
    r, g, b = arr[:, :, 0].astype(np.int16), arr[:, :, 1].astype(np.int16), arr[:, :, 2].astype(np.int16)
    dist = np.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2)
    alpha = np.where(
        dist < HARD,
        0,
        np.where(
            dist < SOFT,
            ((dist - HARD) / (SOFT - HARD) * 255).astype(np.int16),
            255,
        ),
    ).astype(np.uint8)
    # Preserve original alpha if source already had transparency
    arr[:, :, 3] = np.minimum(arr[:, :, 3], alpha)
    return Image.fromarray(arr)

def pad_to_square(im: Image.Image, padding_pct: float = 0.10) -> Image.Image:
    """Crop to content, then pad to a square with `padding_pct` margin on all sides.

    A small margin prevents wing tips / shield corners from being clipped by
    renderers that mask favicons (iOS rounded corners, link-preview cards).
    """
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    w, h = im.size
    content_side = max(w, h)
    side = int(content_side * (1 + 2 * padding_pct))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - w) // 2, (side - h) // 2), im)
    return canvas

def main():
    src = Image.open(SRC)
    transparent = cutout(src)

    # Save full-resolution transparent master (cropped to content)
    master = transparent.crop(transparent.getbbox())
    master.save(ROOT / "logo.png", optimize=True)
    print(f"logo.png: {master.size}")

    # Square version for favicons
    square = pad_to_square(transparent)
    print(f"square base: {square.size}")

    # Favicon variants
    sizes = [
        ("favicon-32.png", 32),
        ("favicon-48.png", 48),
        ("favicon-96.png", 96),
        ("apple-touch-icon.png", 180),
        ("favicon-192.png", 192),
        ("favicon-512.png", 512),
    ]
    for name, size in sizes:
        resized = square.resize((size, size), Image.LANCZOS)
        resized.save(ROOT / name, optimize=True)
        print(f"{name}: {size}x{size}")

if __name__ == "__main__":
    main()
