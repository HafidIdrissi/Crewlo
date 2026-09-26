"""Render an explicitly illustrative WhatsApp phone preview for Crewlo.

This is a drawn storyboard, not a WhatsApp capture or proof of delivery.
Requires Pillow and FFmpeg. Reuses the sanitized voxel-studio crop from the
verified Telegram media kit; no account access, agent, or webhook is used.
"""

import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "crewlo" / "demo"
STUDIO = OUT / "telegram-phone-studio.png"
W, H, FPS, SECONDS = 1080, 720, 10, 10
INK, MUTED, GREEN = "#20392f", "#607266", "#23855f"


def font(size, bold=False):
    candidates = [
        Path("C:/Windows/Fonts") / ("segoeuib.ttf" if bold else "segoeui.ttf"),
        Path("/usr/share/fonts/truetype/dejavu")
        / ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"),
        Path("/System/Library/Fonts/Supplemental")
        / ("Arial Bold.ttf" if bold else "Arial.ttf"),
    ]
    for path in candidates:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    raise SystemExit("No supported font found; install Segoe UI, DejaVu Sans or Arial")


def wrapped(draw, text, face, width):
    lines, current = [], ""
    for word in text.split():
        candidate = f"{current} {word}".strip()
        if current and draw.textlength(candidate, font=face) > width:
            lines.append(current)
            current = word
        else:
            current = candidate
    return lines + ([current] if current else [])


def write_lines(draw, text, x, y, size, color, width, bold=False, gap=5):
    face = font(size, bold)
    for line in wrapped(draw, text, face, width):
        draw.text((x, y), line, font=face, fill=color)
        y += size + gap
    return y


def bubble(draw, y, text, outgoing=False, title=None):
    x, width = (751, 252) if outgoing else (710, 285)
    face = font(18)
    lines = wrapped(draw, text, face, width - 28)
    height = 20 + 23 * len(lines) + (23 if title else 0)
    draw.rounded_rectangle((x, y, x + width, y + height), radius=16,
                           fill="#176a50" if outgoing else "#263b46")
    if title:
        draw.text((x + 14, y + 8), title, font=font(16, True), fill="#a7ebc9")
    write_lines(draw, text, x + 14, y + 9 + (23 if title else 0), 18,
                "#ffffff", width - 28)
    return y + height + 9


def draw_phone(draw, stage):
    draw.rounded_rectangle((689, 27, 1039, 686), radius=47, fill="#d1d9cf")
    draw.rounded_rectangle((680, 19, 1030, 678), radius=45, fill="#14252c")
    draw.rounded_rectangle((690, 29, 1020, 668), radius=37, fill="#111f29")
    draw.rounded_rectangle((799, 37, 913, 58), radius=11, fill="#081118")
    draw.text((714, 44), "10:16", font=font(13, True), fill="#ffffff")
    draw.rounded_rectangle((972, 46, 994, 57), radius=2, outline="#ffffff", width=1)
    draw.rectangle((975, 49, 989, 54), fill="#ffffff")
    draw.ellipse((710, 80, 752, 122), fill="#23855f")
    draw.rounded_rectangle((720, 91, 743, 108), radius=8, outline="#ffffff", width=2)
    draw.polygon([(724, 106), (721, 114), (731, 108)], fill="#ffffff")
    draw.text((762, 78), "Crewlo", font=font(22, True), fill="#ffffff")
    draw.text((762, 106), "WhatsApp  ·  concept preview", font=font(13), fill="#aac4b9")
    draw.line((702, 135, 1008, 135), fill="#2b3a45", width=1)
    draw.rounded_rectangle((758, 151, 950, 180), radius=13, fill="#264335")
    draw.text((771, 157), "ILLUSTRATIVE FLOW", font=font(13, True), fill="#d4f5de")

    y = 200
    if stage >= 1:
        y = bubble(draw, y, "/agents", outgoing=True)
    if stage >= 2:
        y = bubble(draw, y, "Remy and Ellis are available.", title="Crewlo")
    if stage >= 3:
        y = bubble(draw, y, "Hey Remy, draft a homepage headline.", outgoing=True)
    if stage >= 4:
        bubble(draw, y, "Make your next idea feel alive, block by block.", title="Remy")
    if stage == 0:
        draw.text((730, 248), "Your agents are a message away.",
                  font=font(17), fill="#aac4b9")
    draw.rounded_rectangle((704, 601, 959, 643), radius=21, fill="#263846")
    draw.text((720, 611), "Message", font=font(17), fill="#a6b7c2")
    draw.ellipse((968, 603, 1006, 641), fill=GREEN)
    draw.polygon([(978, 621), (998, 612), (992, 632), (986, 624)], fill="#ffffff")
    draw.rounded_rectangle((811, 655, 901, 659), radius=2, fill="#bcc8cb")


def frame(index, studio):
    t = index / FPS
    stage = 0 if t < 1.4 else 1 if t < 3 else 2 if t < 4.8 else 3 if t < 6.8 else 4
    image = Image.new("RGB", (W, H), "#f5f1e6")
    draw = ImageDraw.Draw(image)
    for x in range(0, W, 40):
        for y in range(0, H, 40):
            draw.rectangle((x, y, x + 1, y + 1), fill="#dedfd2")
    draw.rounded_rectangle((48, 36, 280, 67), radius=9, fill="#dcebdc")
    draw.text((62, 41), "CREWLO  /  WHATSAPP", font=font(15, True), fill=INK)
    draw.text((48, 86), "Your crew.", font=font(53, True), fill=INK)
    draw.text((48, 148), "In your pocket.", font=font(49, True), fill=INK)
    write_lines(draw, "A preview of messaging your desktop agents through WhatsApp.",
                51, 222, 22, MUTED, 555, gap=6)

    draw.rounded_rectangle((47, 326, 635, 575), radius=19, fill="#d5dbca")
    image.paste(studio.resize((570, 210), Image.Resampling.LANCZOS), (56, 335))
    draw.rectangle((56, 545, 626, 566), fill="#e7eadd")
    draw.text((66, 546), "CREWLO DESKTOP  ·  EARLIER STUDIO CAPTURE",
              font=font(12, True), fill=MUTED)
    captions = [
        "A familiar chat for your crew.",
        "01  Ask which agents are ready.",
        "02  Pick your teammate.",
        "03  Send a request from your phone.",
        "04  See a named reply — preview.",
    ]
    draw.ellipse((52, 597, 64, 609), fill=GREEN)
    draw.text((77, 586), captions[stage], font=font(24, True), fill=INK)
    draw.text((50, 627), "Keep Crewlo and its webhook relay running on your PC.",
              font=font(17), fill=MUTED)
    draw_phone(draw, stage)
    draw.text((49, 684), "Illustrative WhatsApp flow  ·  Not yet live-tested  ·  Recreated phone UI",
              font=font(15), fill=MUTED)
    return image


def main():
    if not STUDIO.exists():
        raise SystemExit("Sanitized studio crop is missing; render the Telegram phone demo first")
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise SystemExit("FFmpeg is required")
    with Image.open(STUDIO) as source:
        studio = source.convert("RGB")
    with tempfile.TemporaryDirectory(prefix="crewlo-whatsapp-preview-") as folder:
        temp = Path(folder)
        for index in range(FPS * SECONDS):
            frame(index, studio).save(temp / f"{index:04}.png")
        frame(FPS * (SECONDS - 1), studio).save(OUT / "whatsapp-phone-poster.png")
        source = ["-framerate", str(FPS), "-i", str(temp / "%04d.png")]
        subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", *source,
                        "-c:v", "libx264", "-crf", "21", "-pix_fmt", "yuv420p",
                        "-movflags", "+faststart", str(OUT / "whatsapp-phone-preview.mp4")], check=True)
        subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", *source,
                        "-filter_complex",
                        "[0:v]split[a][b];[a]palettegen=max_colors=192[p];"
                        "[b][p]paletteuse=dither=bayer:bayer_scale=3",
                        "-loop", "0", str(OUT / "whatsapp-phone-preview.gif")], check=True)
    print("Generated illustrated WhatsApp GIF, MP4 and poster in", OUT)


if __name__ == "__main__":
    main()
