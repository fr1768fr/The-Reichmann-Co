"""Process source-logo.png into transparent logo + favicon variants.

Auto-detects background color (white or black) from the corner pixels,
then flood-fills from the corners so only the *connected* background
region becomes transparent (preserves any same-coloured interior, e.g.
black shield field on a black-background source).
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source-logo.png"

HARD = 20
SOFT = 70

def cutout(im: Image.Image) -> Image.Image:
    """Remove background by flood-filling from each corner.

    The corner colour is taken as the background reference; pixels that
    are both close to that colour AND connected (4-neighbour) to a
    corner are marked transparent. Pixels near the corner colour but
    enclosed by the logo (e.g. the dark shield field) keep their alpha.
    """
    im = im.convert("RGBA")
    arr = np.array(im)
    h, w = arr.shape[:2]
    rgb = arr[..., :3].astype(np.int16)

    bg = arr[0, 0, :3].astype(np.int16)
    dist = np.sqrt(((rgb - bg) ** 2).sum(axis=-1))

    # Binary mask of "near-background" pixels (will be candidates)
    near_bg = dist < SOFT

    # Label connected components of near_bg
    labels, _ = ndimage.label(near_bg)

    # Background = any component touching the four corners
    corner_labels = {
        labels[0, 0], labels[0, w - 1],
        labels[h - 1, 0], labels[h - 1, w - 1],
    }
    corner_labels.discard(0)
    bg_mask = np.isin(labels, list(corner_labels))

    # Soft alpha: in the connected BG region, fade from 0 to 255 based on distance
    alpha = np.where(
        bg_mask & (dist < HARD),
        0,
        np.where(
            bg_mask & (dist < SOFT),
            ((dist - HARD) / (SOFT - HARD) * 255).clip(0, 255),
            255,
        ),
    ).astype(np.uint8)

    arr[..., 3] = np.minimum(arr[..., 3], alpha)
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

    master = transparent.crop(transparent.getbbox())
    master.save(ROOT / "logo.png", optimize=True)
    print(f"logo.png: {master.size}")

    square = pad_to_square(transparent)
    print(f"square base: {square.size}")

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
