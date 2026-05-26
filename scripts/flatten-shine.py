"""Generate shine-removed variants of source-logo.png at several intensities.

The AI-rendered source has strong specular highlights on the gold (wings,
shield border) that read as glossy/metallic. This produces flat-color
variants by clamping the HSV Value channel.

Outputs preview files for visual review; copy the preferred one over
source-logo.png and re-run process-logo.py.
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

def rgb_to_hsv_np(rgb):
    """Vectorized RGB->HSV. rgb is uint8 array shape (H,W,3). Returns float H[0,1], S[0,1], V[0,1]."""
    rgb = rgb.astype(np.float32) / 255.0
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    v = mx
    diff = mx - mn
    s = np.where(mx > 0, diff / mx, 0)
    h = np.zeros_like(r)
    mask = diff > 0
    # Vectorized hue
    rmax = (mx == r) & mask
    gmax = (mx == g) & mask & ~rmax
    bmax = (mx == b) & mask & ~rmax & ~gmax
    h[rmax] = ((g[rmax] - b[rmax]) / diff[rmax]) % 6
    h[gmax] = (b[gmax] - r[gmax]) / diff[gmax] + 2
    h[bmax] = (r[bmax] - g[bmax]) / diff[bmax] + 4
    h = h / 6.0
    return h, s, v

def hsv_to_rgb_np(h, s, v):
    h6 = (h * 6.0) % 6
    i = np.floor(h6).astype(np.int32)
    f = h6 - i
    p = v * (1 - s)
    q = v * (1 - s * f)
    t = v * (1 - s * (1 - f))
    r = np.zeros_like(v); g = np.zeros_like(v); b = np.zeros_like(v)
    for k, (rk, gk, bk) in enumerate([(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]):
        m = (i == k)
        r[m] = rk[m]; g[m] = gk[m]; b[m] = bk[m]
    return (np.stack([r, g, b], axis=-1) * 255).astype(np.uint8)

def flatten(im: Image.Image, v_max: float, s_scale: float) -> Image.Image:
    """Clamp HSV Value to v_max and scale Saturation by s_scale.
    Preserves alpha. Pure-white background (very low saturation) is left alone."""
    arr = np.array(im.convert("RGBA"))
    rgb = arr[..., :3]
    a = arr[..., 3]
    h, s, v = rgb_to_hsv_np(rgb)
    # Only flatten saturated pixels (skip the white background where s ~ 0)
    coloured = s > 0.05
    v_new = np.where(coloured, np.minimum(v, v_max), v)
    s_new = np.where(coloured, s * s_scale, s)
    rgb_out = hsv_to_rgb_np(h, s_new, v_new)
    out = np.dstack([rgb_out, a])
    return Image.fromarray(out)

def main():
    src = Image.open(ROOT / "source-logo.png")
    variants = [
        ("source-logo-flat-light.png", 0.85, 0.95),
        ("source-logo-flat-medium.png", 0.75, 0.90),
        ("source-logo-flat-strong.png", 0.65, 0.85),
    ]
    for name, v_max, s_scale in variants:
        out = flatten(src, v_max, s_scale)
        out.save(ROOT / name, optimize=True)
        print(f"{name}  (V<={v_max}, S*={s_scale})")

if __name__ == "__main__":
    main()
