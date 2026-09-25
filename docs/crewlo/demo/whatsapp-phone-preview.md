# Your crew. In your pocket.

This English WhatsApp phone animation is an **illustrative preview**, not a recording of WhatsApp, an actual agent exchange, or proof of delivery. Live WhatsApp phone-to-agent testing still needs a completed Meta webhook/WABA setup and a confirmed desktop pairing.

- [10-second GIF for a README or social post](whatsapp-phone-preview.gif)
- [MP4 with playback controls for a website](whatsapp-phone-preview.mp4)
- [Static poster](whatsapp-phone-poster.png)

The `/agents` request, agent list, homepage-headline request and Remy response are scripted. The phone UI is drawn, and the voxel studio crop comes from an earlier Crewlo desktop capture; it is not synchronized with the illustrated chat. Every frame carries the disclosure "Illustrative WhatsApp flow · Not yet live-tested · Recreated phone UI". Do not crop it out or caption the media as a real WhatsApp conversation.

Suggested sharing caption:

> What if your desktop AI crew were one WhatsApp message away? This is a concept preview of Crewlo's phone workflow, not a live WhatsApp test yet. Telegram has a verified basic round trip; WhatsApp live validation is next. Try the source, test the integration, and help us improve it: https://github.com/HafidIdrissi/Crewlo

To rebuild the GIF, MP4 and poster locally, install Pillow and FFmpeg, then run `python tools/render-whatsapp-phone-preview.py` from the repository root. The script reads the sanitized studio crop in this directory and does not contact Meta, start an agent, or send any messages. The media is 1080 × 720 at 10 frames per second.
