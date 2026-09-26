"""Render an explicitly illustrative WhatsApp phone preview for Crewlo.

Not yet live-tested: this is a drawn storyboard, not proof of delivery.
Requires Pillow and FFmpeg. Reuses the sanitized studio crop; no account
access, agent, or webhook is used.
"""

from pathlib import Path

from PIL import Image

from phone_demo import cover, export_demo, phone

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "crewlo" / "demo"
DISCLOSURE = ("Illustrative flow · Not yet live-tested", "Recreated phone UI")


def main():
    studio_path = OUT / "telegram-phone-studio.png"
    if not studio_path.exists():
        raise SystemExit("Sanitized studio crop is missing; render the Telegram phone demo first")
    with Image.open(studio_path) as source:
        studio = source.convert("RGB")
    messages = [
        ("/agents", None, True),
        ("Remy and Ellis are available.", "Crewlo", False),
        ("Hey Remy, draft a homepage headline.", None, True),
        ("Make your next idea feel alive, block by block.", "Remy", False),
    ]
    frames = [cover(studio, "WhatsApp", DISCLOSURE, "Your crew. In your pocket.",
                    "A preview of messaging your desktop agents through WhatsApp.")]
    frames.extend(phone("WhatsApp", DISCLOSURE, messages[:count], "WhatsApp · Concept preview")
                  for count in range(1, len(messages) + 1))
    export_demo(OUT, "whatsapp-phone-preview", "whatsapp-phone-poster.png", frames,
                [3000, 2500, 3500, 5000, 8000])


if __name__ == "__main__":
    main()
