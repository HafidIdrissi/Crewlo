# Your AI crew. One message away.

A 20-second English promo showing a real Telegram exchange with Remy inside a recreated phone layout. The exact request, queue acknowledgement and named reply were observed in Telegram Web on 23 September 2026. The phone animation condenses the wait; it is not a continuous screen recording or a test performed on a physical phone. Keep the visible disclosure when sharing.

- [GIF — ready for a GitHub README](telegram-phone-demo.gif)
- [MP4 — smaller, with playback controls for a website](telegram-phone-demo.mp4)
- [Static poster](telegram-phone-poster.png)
- [Verified transcript and provenance](telegram-phone-transcript.json)

The desktop image is a cropped real Crewlo screenshot from the earlier verified test in the same session. It illustrates the studio, not synchronized execution of the displayed English greeting. The earlier marker exchange was matched in Crewlo Conversation with the Telegram badge; this English greeting's request and response were verified in Telegram Web. No token, owner identifier, personal chat list, internal prompt or terminal output is included.

## Add to the repository README

```markdown
![Message your Crewlo agents through Telegram](docs/crewlo/demo/telegram-phone-demo.gif)

Real Telegram exchange, presented in a recreated phone UI with condensed timing.
```

## Add to the site

For a page inside `docs/`, use the portrait GIF below. Preserve its natural aspect ratio and avoid a height cap: the phone needs the full available width for readable messages. The MP4 is also available for manual playback.

```html
<img src="crewlo/demo/telegram-phone-demo.gif"
  width="960" height="1440" loading="lazy"
  alt="Real Telegram exchange with Remy, presented in a recreated phone UI"
  style="display:block;width:100%;max-width:560px;height:auto">
<a href="crewlo/demo/telegram-phone-demo.gif">View full size</a>
<p>Real Telegram exchange. Recreated phone UI; time condensed.</p>
```

The animation is silent and all dialogue is visible as text. Transcript: “Hey Remy! Say hello from the Crewlo studio in one short sentence. No file changes.” Crewlo acknowledges the queue; Remy replies, “Hello from Remy in the Crewlo studio!”

## Rebuild

With Pillow and FFmpeg installed, run `python tools/render-telegram-phone-demo.py`. It uses the sanitized studio crop and the checked-in transcript. It does not contact Telegram or start an agent. The shared `tools/phone_demo.py` renderer produces a 960 × 1440 portrait animation lasting 20 seconds. A separate studio cover preserves the original capture without enlarging it; the conversation uses 52-pixel text and holds the final reply for eight seconds. The GIF uses 256 colors per scene without patterned dithering; the MP4 is encoded at 10 fps. It replaces only this demo's generated GIF, MP4 and poster.

This greeting verifies a basic real Telegram round trip. It does not demonstrate file creation, deployments, multi-agent delegation, WhatsApp delivery or unattended operation while the computer is off. Crewlo and the connected agent must remain available on the desktop.
