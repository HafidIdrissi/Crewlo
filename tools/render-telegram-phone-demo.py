"""Render a readable phone close-up from the verified Telegram exchange.

Requires Pillow and FFmpeg. This creates media, not a screen recording.
python tools/render-telegram-phone-demo.py --studio-source <private-screenshot.png>
Subsequent renders reuse the sanitized studio crop.
"""

import argparse
import json
from pathlib import Path

from PIL import Image

from phone_demo import cover, export_demo, phone

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "crewlo" / "demo"
DISCLOSURE = ("Real Telegram exchange", "Recreated phone UI · Time condensed")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--studio-source", type=Path)
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    crop_path = OUT / "telegram-phone-studio.png"
    if args.studio_source:
        with Image.open(args.studio_source) as source:
            # Only the studio: no terminal, settings, owner IDs or chats.
            source.crop((31, 225, 962, 557)).save(crop_path)
    transcript = json.loads((OUT / "telegram-phone-transcript.json").read_text(encoding="utf-8"))
    with Image.open(crop_path) as source:
        studio = source.convert("RGB")
    messages = [
        (transcript["request"], None, True),
        (transcript["acknowledgement"].removeprefix("Crewlo · "), "Crewlo", False),
        (transcript["reply"].removeprefix("Remy · "), "Remy", False),
    ]
    frames = [cover(studio, "Telegram", DISCLOSURE, "Your AI crew. One message away.",
                    "Message your agent from Telegram. Keep Crewlo open on your computer.")]
    frames.extend(phone("Telegram", DISCLOSURE, messages[:count], "Telegram · Remy selected")
                  for count in range(1, len(messages) + 1))
    export_demo(OUT, "telegram-phone-demo", "telegram-phone-poster.png", frames,
                [3000, 5000, 4000, 8000])


if __name__ == "__main__":
    main()
