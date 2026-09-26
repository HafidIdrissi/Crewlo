"""Render Crewlo's NSIS wizard artwork from the existing app mark.

Run `python tools/generate-installer-art.py` from the repository root.
Requires Pillow. The generated BMPs are committed; Pillow is not a build-time
dependency for contributors or users installing Crewlo.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
MARK = ROOT / "build" / "crewlo.png"
BUILD = ROOT / "build"
SCALE = 4
INK = "#20392f"
MUTED = "#607266"
CREAM = "#f5f1e6"
TERRACOTTA = "#ad6248"
GREEN = "#3c8065"


def font(size, bold=False):
    face = "segoeuib.ttf" if bold else "segoeui.ttf"
    candidates = [
        Path("C:/Windows/Fonts") / face,
        Path("/usr/share/fonts/truetype/dejavu")
        / ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"),
        Path("/System/Library/Fonts/Supplemental")
        / ("Arial Bold.ttf" if bold else "Arial.ttf"),
    ]
    for path in candidates:
        if path.exists():
            return ImageFont.truetype(str(path), size * SCALE)
    raise SystemExit("No supported font found; install Segoe UI, DejaVu Sans or Arial")


def box(draw, xy, fill, radius=0, outline=None, width=1):
    coords = tuple(round(value * SCALE) for value in xy)
    if radius:
        draw.rounded_rectangle(coords, radius=radius * SCALE, fill=fill,
                               outline=outline, width=width * SCALE)
    else:
        draw.rectangle(coords, fill=fill, outline=outline, width=width * SCALE)


def centered(draw, text, y, size, fill, bold=False, width=164):
    face = font(size, bold)
    text_width = draw.textlength(text, font=face)
    draw.text(((width * SCALE - text_width) / 2, y * SCALE), text,
              font=face, fill=fill)


def scaled_logo(mark, side):
    return mark.resize((side * SCALE, side * SCALE), Image.Resampling.LANCZOS)


def cube(draw, x, y, size, top, left, right):
    s = SCALE
    half = size / 2
    draw.polygon([(int((x + half) * s), int(y * s)),
                  (int((x + size) * s), int((y + size / 4) * s)),
                  (int((x + half) * s), int((y + size / 2) * s)),
                  (int(x * s), int((y + size / 4) * s))], fill=top)
    draw.polygon([(int(x * s), int((y + size / 4) * s)),
                  (int((x + half) * s), int((y + size / 2) * s)),
                  (int((x + half) * s), int((y + size) * s)),
                  (int(x * s), int((y + size * 3 / 4) * s))], fill=left)
    draw.polygon([(int((x + half) * s), int((y + size / 2) * s)),
                  (int((x + size) * s), int((y + size / 4) * s)),
                  (int((x + size) * s), int((y + size * 3 / 4) * s)),
                  (int((x + half) * s), int((y + size) * s))], fill=right)


def sidebar(mark):
    canvas = Image.new("RGB", (164 * SCALE, 314 * SCALE), CREAM)
    draw = ImageDraw.Draw(canvas)
    for x in range(0, 164, 20):
        for y in range(0, 314, 20):
            box(draw, (x, y, x + 1, y + 1), "#dedfd2")
    box(draw, (0, 0, 164, 7), GREEN)
    box(draw, (17, 26, 147, 150), "#e8e1cd", radius=19)
    canvas.paste(scaled_logo(mark, 104), (30 * SCALE, 36 * SCALE),
                 scaled_logo(mark, 104))
    centered(draw, "CREWLO", 166, 22, INK, bold=True)
    box(draw, (18, 201, 146, 229), INK, radius=5)
    centered(draw, "YOUR AI CREW", 207, 10, "#fcf1dd", bold=True)
    cube(draw, 22, 249, 32, "#eac58c", "#b87a54", TERRACOTTA)
    cube(draw, 54, 240, 43, "#b5d5b8", "#4b9270", GREEN)
    cube(draw, 100, 252, 32, "#eddca5", "#c7ae6d", "#9d8758")
    box(draw, (0, 307, 164, 314), GREEN)
    return canvas.resize((164, 314), Image.Resampling.LANCZOS)


def header(mark):
    canvas = Image.new("RGB", (150 * SCALE, 57 * SCALE), CREAM)
    draw = ImageDraw.Draw(canvas)
    box(draw, (0, 0, 150, 3), GREEN)
    logo = scaled_logo(mark, 38)
    canvas.paste(logo, (9 * SCALE, 10 * SCALE), logo)
    draw.text((54 * SCALE, 13 * SCALE), "CREWLO", font=font(15, True), fill=INK)
    draw.text((55 * SCALE, 34 * SCALE), "Your AI crew", font=font(9), fill=MUTED)
    return canvas.resize((150, 57), Image.Resampling.LANCZOS)


def main():
    with Image.open(MARK) as image:
        mark = image.convert("RGBA")
    sidebar(mark).save(BUILD / "installerSidebar.bmp", format="BMP")
    header(mark).save(BUILD / "installerHeader.bmp", format="BMP")
    print("Generated build/installerSidebar.bmp and build/installerHeader.bmp")


if __name__ == "__main__":
    main()
