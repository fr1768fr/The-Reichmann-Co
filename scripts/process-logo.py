"""Process the dark + light source logos into two favicon variants.

Dark variant (source-logo-dark.png): white silhouette on black BG.
  Output: white-on-transparent. Pixels' alpha = max RGB channel; the
  black BG drops out naturally.

Light variant (source-logo-light.png): the source mixes black logo art
  with white interior fills *inside* a shield, all on a black BG. A
  naive flood-fill from the corners would leak through small gaps in
  the circuit pattern and erase interior shapes. We dilate the bright
  pixels first so they form a sealing 'wall', then flood-fill only the
  outer connected dark region.

Backward compatibility: the default favicon-{32,48,96,180,192,512}.png
files are the dark variant, so existing <link rel="icon"> tags keep
working without changes. The light variant lives at
favicon-light-{32,48,96,192,512}.png.
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent

DARK_SRC = ROOT / "source-logo-dark.png"
LIGHT_SRC = ROOT / "source-logo-light.png"

def cutout_dark(im: Image.Image) -> Image.Image:
    """White-silhouette-on-black → white-on-transparent."""
    arr = np.array(im.convert("RGBA"))
    # Max channel is a good luminance proxy here (image is grayscale).
    lum = arr[..., :3].max(axis=-1).astype(np.uint8)
    arr[..., 3] = lum
    # Force colour to pure white where alpha > 0, so any near-grey edges
    # become smooth white-on-transparent rather than grey halos.
    mask = lum > 0
    arr[..., 0] = np.where(mask, 255, 0)
    arr[..., 1] = np.where(mask, 255, 0)
    arr[..., 2] = np.where(mask, 255, 0)
    return Image.fromarray(arr)

def cutout_light(im: Image.Image) -> Image.Image:
    """Keep both black + white logo art, drop only the outer black BG."""
    arr = np.array(im.convert("RGBA"))
    rgb = arr[..., :3]
    lum = rgb.max(axis=-1)

    is_dark = lum < 60
    is_bright = ~is_dark

    # Seal small interior gaps so flood-fill from corners can't reach
    # the shield interior through the circuit pattern.
    sealed = ndimage.binary_dilation(is_bright, iterations=10)

    candidate_bg = is_dark & ~sealed
    labels, _ = ndimage.label(candidate_bg)
    h, w = arr.shape[:2]
    corner_labels = {
        labels[0, 0], labels[0, w - 1],
        labels[h - 1, 0], labels[h - 1, w - 1],
    }
    corner_labels.discard(0)
    outer_bg = np.isin(labels, list(corner_labels))

    arr[..., 3] = np.where(outer_bg, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)

def pad_to_square(im: Image.Image, padding_pct: float = 0.10) -> Image.Image:
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    w, h = im.size
    content_side = max(w, h)
    side = int(content_side * (1 + 2 * padding_pct))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - w) // 2, (side - h) // 2), im)
    return canvas

SIZES = [
    ("favicon-32.png", "favicon-light-32.png", 32),
    ("favicon-48.png", "favicon-light-48.png", 48),
    ("favicon-96.png", "favicon-light-96.png", 96),
    ("apple-touch-icon.png", "apple-touch-icon-light.png", 180),
    ("favicon-192.png", "favicon-light-192.png", 192),
    ("favicon-512.png", "favicon-light-512.png", 512),
]

def main():
    dark = cutout_dark(Image.open(DARK_SRC))
    light = cutout_light(Image.open(LIGHT_SRC))

    dark.crop(dark.getbbox()).save(ROOT / "logo-dark.png", optimize=True)
    light.crop(light.getbbox()).save(ROOT / "logo-light.png", optimize=True)
    print(f"masters: logo-dark.png + logo-light.png")

    dark_sq = pad_to_square(dark)
    light_sq = pad_to_square(light)
    print(f"square base: {dark_sq.size} (dark), {light_sq.size} (light)")

    for dark_name, light_name, size in SIZES:
        dark_sq.resize((size, size), Image.LANCZOS).save(ROOT / dark_name, optimize=True)
        light_sq.resize((size, size), Image.LANCZOS).save(ROOT / light_name, optimize=True)
        print(f"  {size}px: {dark_name} + {light_name}")

if __name__ == "__main__":
    main()
