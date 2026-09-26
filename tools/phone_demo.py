"""Draw readable phone demos from text, with a separate full-width studio cover."""

from functools import lru_cache
from pathlib import Path
import shutil
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 960, 1440
BODY_SIZE, LINE_HEIGHT = 52, 66
BG, INK, MUTED = "#f5f1e6", "#20392f", "#4b6054"


@lru_cache(maxsize=None)
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


def lines(draw, text, face, width):
    result, current = [], ""
    for word in text.split():
        candidate = f"{current} {word}".strip()
        if current and draw.textlength(candidate, font=face) > width:
            result.append(current)
            current = word
        else:
            current = candidate
    return result + ([current] if current else [])


def text_block(draw, text, x, y, size, width, fill=INK, bold=False, leading=None):
    face = font(size, bold)
    for line in lines(draw, text, face, width):
        draw.text((x, y), line, font=face, fill=fill)
        y += leading or size + 14
    return y


def base(channel, disclosure):
    image = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(image)
    draw.text((32, 22), f"CREWLO / {channel.upper()}", font=font(34, True), fill=INK)
    for index, line in enumerate(disclosure):
        draw.text((32, 1324 + index * 46), line, font=font(32), fill=MUTED)
    return image, draw


def cover(studio, channel, disclosure, title, description):
    image, draw = base(channel, disclosure)
    text_block(draw, title, 40, 220, 76, 880, bold=True, leading=94)
    # Preserve the real capture's aspect ratio and never enlarge source pixels.
    photo = studio.copy()
    photo.thumbnail((932, 420), Image.Resampling.LANCZOS)
    image.paste(photo, ((WIDTH - photo.width) // 2, 510))
    draw.text((40, 856), "EARLIER CREWLO STUDIO CAPTURE", font=font(32, True), fill=MUTED)
    text_block(draw, description, 40, 964, 46, 872)
    return image


def bubble(draw, y, message, color):
    text, title, outgoing = message
    x, width = (116, 772) if outgoing else (64, 796)
    wrapped = lines(draw, text, font(BODY_SIZE), width - 52)
    title_height = 50 if title else 0
    height = 44 + len(wrapped) * LINE_HEIGHT + title_height
    if y + height > 1130:
        raise ValueError(f"{title or 'Message'} overflows the phone screen: {text}")
    draw.rounded_rectangle((x, y, x + width, y + height), radius=26,
                           fill=color if outgoing else "#ffffff")
    if title:
        draw.text((x + 26, y + 16), title, font=font(38, True), fill="#245446")
    for index, line in enumerate(wrapped):
        draw.text((x + 26, y + 20 + title_height + index * LINE_HEIGHT),
                  line, font=font(BODY_SIZE), fill="#142c27")
    return y + height + 22


def phone(channel, disclosure, messages, selected):
    image, draw = base(channel, disclosure)
    telegram = channel == "Telegram"
    accent = "#1689bb" if telegram else "#187c56"
    outgoing = "#d9eaff" if telegram else "#d9fdd3"
    screen = "#edf3f9" if telegram else "#f0eee5"
    draw.rounded_rectangle((20, 90, 940, 1294), radius=48, fill="#18372e")
    draw.rounded_rectangle((32, 102, 928, 1282), radius=38, fill=screen)
    draw.text((64, 118), "10:16", font=font(30, True), fill=INK)
    draw.rounded_rectangle((412, 120, 548, 144), radius=12, fill="#18372e")
    draw.rounded_rectangle((832, 124, 880, 146), radius=4, outline=INK, width=3)
    draw.rectangle((838, 130, 870, 140), fill=INK)
    draw.ellipse((64, 182, 148, 266), fill=accent)
    if telegram:
        draw.polygon([(80, 222), (134, 201), (120, 247), (106, 229)], fill="white")
    else:
        draw.rounded_rectangle((83, 204, 129, 237), radius=12, outline="white", width=4)
        draw.polygon([(89, 235), (84, 247), (105, 236)], fill="white")
    draw.text((172, 174), "@Crewlo_bot" if telegram else "Crewlo", font=font(48, True), fill=INK)
    draw.text((174, 234), selected, font=font(34), fill=MUTED)
    draw.line((54, 296, 906, 296), fill="#c3d0c9", width=2)
    y = 326
    for message in messages:
        y = bubble(draw, y, message, outgoing)
    draw.rounded_rectangle((60, 1172, 792, 1252), radius=36, fill="#ffffff")
    draw.text((88, 1186), "Message", font=font(38), fill="#52685d")
    draw.ellipse((816, 1174, 892, 1250), fill=accent)
    draw.polygon([(833, 1210), (876, 1194), (863, 1232), (852, 1218)], fill="white")
    return image


def export_demo(out, name, poster_name, frames, durations):
    """Keep one sharp frame per message; hold it long enough to read."""
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise SystemExit("FFmpeg is required")
    if len(frames) != len(durations):
        raise ValueError("Every scene needs a reading duration")
    out.mkdir(parents=True, exist_ok=True)
    frames[-1].save(out / poster_name)
    # Each scene gets all 256 GIF colors. No patterned dithering on text or photos.
    indexed = [frame.quantize(colors=256, method=Image.Quantize.MEDIANCUT,
                              dither=Image.Dither.NONE) for frame in frames]
    indexed[0].save(out / f"{name}.gif", save_all=True, append_images=indexed[1:],
                    duration=durations, loop=0, disposal=1, optimize=True)
    with tempfile.TemporaryDirectory(prefix="crewlo-readable-phone-") as folder:
        temp = Path(folder)
        entries = []
        for index, (frame, duration) in enumerate(zip(frames, durations)):
            frame.save(temp / f"scene-{index}.png")
            entries.extend([f"file 'scene-{index}.png'", f"duration {duration / 1000}"])
        entries.append(f"file 'scene-{len(frames) - 1}.png'")
        manifest = temp / "frames.txt"
        manifest.write_text("\n".join(entries) + "\n", encoding="utf-8")
        subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
                        "-f", "concat", "-safe", "0", "-i", str(manifest),
                        "-t", str(sum(durations) / 1000), "-vf", "fps=10", "-fps_mode", "cfr",
                        "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
                        "-movflags", "+faststart", str(out / f"{name}.mp4")], check=True)
    print(f"Generated {name}: {WIDTH}x{HEIGHT}, {sum(durations) / 1000:g}s")
