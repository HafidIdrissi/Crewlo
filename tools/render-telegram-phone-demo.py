"""Render a shareable phone mockup from a verified Telegram exchange.

Requires Pillow and FFmpeg. This creates media, not a screen recording.
python tools/render-telegram-phone-demo.py --studio-source <private-screenshot.png>
Subsequent renders can omit --studio-source and reuse the sanitized studio crop.
"""
import argparse
import json
import math
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs' / 'crewlo' / 'demo'
W, H, FPS, SECONDS = 1080, 720, 10, 12
BG, INK, MUTED = '#f5f1e6', '#20392f', '#607266'
TRANSCRIPT = json.loads((OUT / 'telegram-phone-transcript.json').read_text(encoding='utf-8'))


def font(size, bold=False):
    candidates = [Path('C:/Windows/Fonts') / ('segoeuib.ttf' if bold else 'segoeui.ttf'),
                  Path('/usr/share/fonts/truetype/dejavu') / ('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf')]
    return ImageFont.truetype(str(next(p for p in candidates if p.exists())), size)


def wrap(text, f, width, draw):
    lines, line = [], ''
    for word in text.split():
        candidate = (line + ' ' + word).strip()
        if draw.textlength(candidate, font=f) > width and line:
            lines.append(line)
            line = word
        else:
            line = candidate
    return lines + ([line] if line else [])


def paragraph(draw, xy, text, size, fill, width, bold=False, gap=5):
    f = font(size, bold)
    x, y = xy
    for line in wrap(text, f, width, draw):
        draw.text((x, y), line, font=f, fill=fill)
        y += size + gap
    return y


def bubble(draw, y, text, outgoing=False, title=None):
    x, width = (733, 273) if outgoing else (711, 280)
    lines = wrap(text, font(18), width - 28, draw)
    height = 26 + len(lines) * 23 + (26 if title else 0)
    draw.rounded_rectangle((x, y, x + width, y + height), radius=16,
                           fill='#7863ca' if outgoing else '#263b4b')
    if title:
        draw.text((x + 14, y + 10), title, font=font(17, True), fill='#9de4ca')
    paragraph(draw, (x + 14, y + 11 + (26 if title else 0)), text, 18,
              '#ffffff', width - 28, gap=5)
    return y + height + 14


def frame(index, studio):
    t = index / FPS
    stage = 0 if t < 1.4 else 1 if t < 3.4 else 2 if t < 6.3 else 3
    im = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(im)
    # A quiet block grid echoes the voxel studio without imitating an app screen.
    for gx in range(0, W, 40):
        for gy in range(0, H, 40):
            d.rectangle((gx, gy, gx + 1, gy + 1), fill='#dedfd2')
    d.rounded_rectangle((48, 36, 272, 67), radius=9, fill='#e2e9dc')
    d.text((62, 41), 'CREWLO  /  TELEGRAM', font=font(15, True), fill=INK)
    d.text((48, 86), 'Your AI crew.', font=font(51, True), fill=INK)
    d.text((48, 145), 'One message away.', font=font(47, True), fill=INK)
    paragraph(d, (51, 218), 'Message your desktop agents from your phone. Get their replies in Telegram.', 23, MUTED, 565, gap=7)
    # The studio image is an earlier real desktop capture, not synchronized footage.
    d.rounded_rectangle((47, 326, 635, 575), radius=19, fill='#d5dbca')
    crop = studio.resize((570, 210), Image.Resampling.LANCZOS)
    im.paste(crop, (56, 335))
    d.rectangle((56, 545, 626, 566), fill='#e7eadd')
    d.text((66, 546), 'CREWLO DESKTOP  ·  EARLIER LIVE CAPTURE', font=font(12, True), fill=MUTED)
    labels = ['Choose your agent.', '01  Send a message.', '02  Routed to Remy.', '03  A real agent replies.']
    d.ellipse((52, 597, 64, 609), fill='#57a888' if stage == 3 else '#b16a45')
    d.text((77, 586), labels[stage], font=font(25, True), fill=INK)
    d.text((50, 627), 'Keep Crewlo open on your computer.', font=font(17), fill=MUTED)
    # Phone shell.
    d.rounded_rectangle((689, 27, 1039, 686), radius=47, fill='#d1d5ce')
    d.rounded_rectangle((680, 19, 1030, 678), radius=45, fill='#14252c')
    d.rounded_rectangle((690, 29, 1020, 668), radius=37, fill='#101e2b')
    d.rounded_rectangle((799, 37, 913, 58), radius=11, fill='#081118')
    d.text((714, 44), '10:16', font=font(13, True), fill='#ffffff')
    d.rounded_rectangle((972, 46, 994, 57), radius=2, outline='#ffffff', width=1)
    d.rectangle((975, 49, 989, 54), fill='#ffffff')
    d.ellipse((711, 81, 751, 121), fill='#2b9fd6')
    d.polygon([(720, 101), (744, 90), (738, 113), (730, 105)], fill='#ffffff')
    d.text((762, 79), '@Crewlo_bot', font=font(21, True), fill='#ffffff')
    d.text((764, 105), 'Telegram  ·  Remy selected', font=font(14), fill='#a2b8c7')
    d.line((702, 135, 1008, 135), fill='#2b3a45', width=1)
    d.rounded_rectangle((785, 153, 925, 178), radius=12, fill='#233340')
    d.text((800, 156), 'REAL EXCHANGE', font=font(12, True), fill='#d2e6e0')
    y = 199
    if stage >= 1:
        y = bubble(d, y, TRANSCRIPT['request'], outgoing=True)
    if stage >= 2:
        y = bubble(d, y, TRANSCRIPT['acknowledgement'].removeprefix('Crewlo · '), title='Crewlo')
    if stage >= 3:
        y = bubble(d, y, TRANSCRIPT['reply'].removeprefix('Remy · '), title='Remy')
    if stage == 0:
        d.text((733, 239), 'Your crew is a chat away.', font=font(19), fill='#a6bdca')
    d.rounded_rectangle((704, 601, 958, 643), radius=21, fill='#263846')
    d.text((720, 611), 'Message', font=font(17), fill='#a6b7c2')
    d.ellipse((968, 603, 1006, 641), fill='#7863ca')
    d.polygon([(979, 621), (997, 613), (991, 632), (987, 625)], fill='white')
    d.rounded_rectangle((811, 655, 901, 659), radius=2, fill='#bcc8cb')
    # Persistent disclosure travels with the GIF when embedded elsewhere.
    d.text((49, 684), 'Real Telegram exchange  ·  Recreated phone UI  ·  Time condensed', font=font(15), fill=MUTED)
    return im


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--studio-source', type=Path)
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    crop_path = OUT / 'telegram-phone-studio.png'
    if args.studio_source:
        with Image.open(args.studio_source) as source:
            # Only the voxel studio: no terminal, settings, owner IDs or chats.
            source.crop((31, 225, 962, 557)).save(crop_path)
    studio = Image.open(crop_path).convert('RGB')
    ffmpeg = shutil.which('ffmpeg')
    if not ffmpeg:
        raise SystemExit('FFmpeg is required')
    with tempfile.TemporaryDirectory(prefix='crewlo-phone-render-') as tmp:
        tmp = Path(tmp)
        for i in range(FPS * SECONDS):
            frame(i, studio).save(tmp / f'{i:04}.png')
        frame(100, studio).save(OUT / 'telegram-phone-poster.png')
        inputs = ['-framerate', str(FPS), '-i', str(tmp / '%04d.png')]
        subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', *inputs,
                        '-c:v', 'libx264', '-crf', '21', '-pix_fmt', 'yuv420p',
                        '-movflags', '+faststart', str(OUT / 'telegram-phone-demo.mp4')], check=True)
        subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', *inputs,
                        '-filter_complex', '[0:v]split[a][b];[a]palettegen=max_colors=192[p];[b][p]paletteuse=dither=bayer:bayer_scale=3',
                        '-loop', '0', str(OUT / 'telegram-phone-demo.gif')], check=True)
    print('Generated verified-exchange phone GIF, MP4 and poster in', OUT)


if __name__ == '__main__':
    main()
