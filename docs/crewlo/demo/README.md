# Crewlo demo kit

## Animated GitHub README

The README uses `readme-studio.gif`, `readme-telegram.gif` and
`readme-whatsapp.gif` so the animations can play inline on GitHub. GitHub does
not expose video autoplay controls in README Markdown; a visitor's reduced-motion
or animation preference can also pause GIFs. Each preview links to its MP4 and
has a separate PNG still image. The studio GIF includes the mission, activity
and reply captions that are HTML overlays on the website.

The phone previews render the actual website components: the dark Telegram UI
and light WhatsApp UI, with original local wallpapers, realistic phone frames,
message arrival and a short working indicator. Telegram quotes the documented
basic exchange, with recreated UI and condensed timing. WhatsApp is an
illustrative, experimental flow, not evidence of delivery. No accounts or APIs
are contacted by the renderer.

Regenerate with `node tools/render-readme-media.cjs` using Node 22.22 or newer,
Playwright, Chromium and FFmpeg. If they are not available on the default paths,
set `CREWLO_PLAYWRIGHT` to the Playwright module path, `CREWLO_CHROMIUM` to the
browser executable and `CREWLO_FFMPEG` to the FFmpeg executable. The renderer
starts a local Vite server on port 5191 and exports twelve-second loops at 8 fps.
The studio is 960×600; the phones are 640×900. PNG posters hold the visible reply.
The older `telegram-phone-demo` and `whatsapp-phone-preview` assets remain
available for the existing capture notes and site fallback.

## Living studio — 27 September 2026

The first screen now uses a roughly 40/60 desktop split: the short promise and
two actions sit beside the large animated studio. Mission, activity and reply
cards appear beside Remy's desk rather than in a separate text panel. Remy is a
keyboard-accessible button that opens the illustrated response. The main action
opens the full interactive studio; the second opens the installation guide.
On mobile the story card sits below the scene to preserve readable text.

Visitors can choose **Explore the project**, **Find the tests** or **Explain
messaging**, then send the illustrated mission to **Remy** or **Jules**. A small
card travels towards that desk during the first three seconds; the desk then
lights up, activity appears, and the response unfolds. Selecting a sample stops
the ambient loop. An explicitly sent mission plays once and holds its result,
with replay and agent/mission selection available in the same scene. Pausing
also freezes the travelling card. Reduced motion shows the selected response
without animating the delivery. These are local scripted responses, not live calls.

The separate **See the verified Telegram exchange** link leads to the dated
request and actual reply directly below the interactive studio, before the preset
chooser. This compact evidence section links to the transcript and verification
scope. No continuous real mission recording is
available yet; the existing recreated phone video must not be presented as one.

The page proceeds from the hero and interactive studio to real evidence, preset
choices, messaging, installation and FAQ. Telegram is the default messaging tab;
WhatsApp has a separate experimental tab. Switching tabs stops the hidden loop.
Arrow keys, Home and End select tabs, and existing channel deep links reveal the
correct panel. Without JavaScript both channels remain readable. Essential status
labels stay visible; detailed channel, data and cost notes use **Details & limits**
disclosures. The three standalone benefit cards are omitted from this shorter path.

The landing now presents these local, illustrated experiences:

- **Mission → agent → result (15 seconds):** request at 0–3s, Remy working at
  3–6s, `Reading README.md` at 6–10s, then a three-point response at 10–15s.
  The response describes real source entry points, but was written for this
  presentation; it is **not an executed agent response**. Activity wording follows
  `src/shared/toolActivity.ts`. The MP4 renders twelve original agents with actual
  typing, coffee and gaming poses, plus a gentle camera approach. The presentation
  uses a neutral ivory background and a two-layer contact shadow beneath the floor;
  these rendering changes are isolated to the capture fixture. Accessible HTML
  supplies the readable steps.
- **Meet your crew:** Remy, Ellis, Sam and Nina can be selected by their character, the
  selection cards, or the next-agent button. The compact profile sits beside the
  scene on desktop and immediately below it on mobile, with name, activity and
  last reply grouped before the selection cards. All profiles and replies
  are illustrative. Selecting a character does not start an agent.
- **Telegram ↔ studio (9 seconds):** send at 0–3s, queue at 3–6s, named reply
  at 6–9s. Text quotes `telegram-phone-transcript.json`; the screens and timing
  are reconstructed, not synchronized footage. WhatsApp remains separately
  marked experimental.
- **WhatsApp ↔ studio (9 seconds):** a separate illustrative request, queue and
  headline reply. Its light iOS-style phone follows the supplied visual reference:
  green outgoing bubbles, white incoming bubbles, call icons and a light composer.
  The local `whatsapp-wallpaper.svg` uses original line art. The user's reference
  image and personal conversation are not published. The experimental label and
  lack of live validation remain visible above and below the demonstration.

Playback starts automatically when a sequence enters the viewport, and loops until paused. The reply holds for
five seconds in the main loop, three in Telegram. Manual step controls pause
playback. Leaving the viewport or hiding the browser tab suspends playback;
returning resumes it unless the visitor explicitly paused or selected a step.
Reduced-motion visitors get static, selectable steps, with no autoplay.
A progress line makes playback visible immediately; Telegram also animates a
small message marker between the phone and studio.
Without JavaScript, all story steps are readable. No external APIs are called.
The three benefit cards remain static in this first batch.

The populated workspace shows **12 scripted agents: 6 working, 5 taking breaks,
and 1 ready**. Break destinations are the coffee machine, arcade, foosball table,
terrace bench and lounge sofa. The capture-only fixture seeds these destinations;
the production app's execution state and break scheduler are unchanged. The full
width workspace plays the video automatically while visible, with its own pause
button and a static poster under reduced motion. Breaks illustrate idle time,
not pausing a running task. Remy and Ellis remain at their original desk indexes.

The preset chooser follows the interactive studio. Four original Crewlo figurines
share one shelf: Claude Code, Codex, Gemini CLI and OpenCode. Selecting one shows
its CLI command and a link to the shared local configuration guide. Commands match
`src/shared/agentProvider.ts` (the custom-command option is separate).
A native "See all 12 presets" disclosure reveals the other eight choices.
The shelf retains four columns on mobile; the additional choices use two columns.
Without JavaScript, the disclosure still works and each figurine links to setup.
The artwork comes from `drawVoxelPerson`, with the studio's palettes and geometry.
Character/provider pairings are illustrative, not live sessions or claims of
provider-wide validation.
Rebuild its local SVG artwork with `node tools/build-provider-gallery.cjs`.

The overview shows the full room at 1920 × 900, with names supplied by HTML.
`studio-overview.webp` is the lossless poster; `mission-studio.mp4` is a silent,
15-second H.264 animation (about 605 KB), not a live mission capture. The capture
tool renders 450 deterministic frames from the actual voxel renderer before
encoding, rather than animating a still image.
The Telegram presentation uses HTML/CSS rather than a GIF so its text adapts to
small screens. Its dark Telegram styling follows the supplied visual reference:
violet outgoing messages, charcoal incoming messages, timestamps, chat header and
composer, inside a black phone frame with status bar and camera. The wallpaper
is original local SVG line art (`telegram-wallpaper.svg`). The conversation still
quotes the documented Crewlo exchange; the supplied screenshot is not published.
Detailed evidence is now on `project-status.html#demo-evidence`.

Rebuild the new assets from the repository root with FFmpeg and Playwright
available (the `CREWLO_PLAYWRIGHT`, `CREWLO_CHROMIUM` and `CREWLO_FFMPEG`
environment overrides described below are supported):

```sh
node tools/build-living-media.cjs
node tools/crewlo-site-check.cjs
```

The capture tool uses an isolated local renderer server on port 5184. Stop any
existing framing server before rebuilding. Site checks write screenshots to
`out/site-check/`, not to the versioned asset folder.

## Previous landing walkthrough — 26 September 2026 (superseded)

The landing now leads with a full-width studio close-up and three readable steps:
write a mission, follow an agent, read a reply. Captions and playback controls sit
outside the visuals. Playback is opt-in, stops after the three steps, can pause,
and stops when hidden or when a reader focuses a panel. Reduced-motion visitors
can select the steps manually. Progress indicates the presentation step, never
agent execution or task completion.

The composer and response are responsive HTML illustrations quoting the verified
Telegram greeting; the request was sent through Telegram, not that composer.
The studio is the actual voxel renderer with independent scripted agents. This
is not continuous footage of a real mission. The original 18-second control tour
remains available in a disclosure on the page, with optional captions.

| New asset | Native size | Lossless WebP size |
| --- | --- | --- |
| [Team close-up](studio-team-hd.png) / [WebP](studio-team-hd.webp) | 1920 × 900 | 107,214 bytes |
| [Remy close-up](studio-follow-hd.png) / [WebP](studio-follow-hd.webp) | 1280 × 960 | 92,236 bytes |
| [Mobile framing](studio-mobile-hd.png) / [WebP](studio-mobile-hd.webp) | 720 × 520 | 46,490 bytes |

These are direct canvas exports, not upscaled legacy screenshots. WebP companions
were verified pixel-identical. Rebuild instructions are in
`tools/studio-framing/README.md` in the repository. The site uses a dedicated
mobile source instead of shrinking the desktop studio image.

Still needed: a continuous real mission recording, from request to a checked
result, with any permission request captured if it occurs. These presentation
changes do not provide an installer or additional messaging validation.

The original recordings below show Crewlo's local Electron interface with **scripted demo data**. Their visible disclosure must remain when shared. A separate [English Telegram phone GIF](telegram-phone-demo.md) presents a verified real Telegram exchange in a recreated phone layout. The [WhatsApp phone preview](whatsapp-phone-preview.md) is fully illustrative because a live WhatsApp round trip has not yet been verified.

## Real Telegram exchange: verified on 23 September 2026

The [20-second phone GIF](telegram-phone-demo.gif) uses the actual English request, queue acknowledgement and Remy reply observed in Telegram Web. The phone UI is recreated and waiting time is condensed, as disclosed in the animation. Its studio crop comes from an earlier verified marker exchange that was also matched in Crewlo Conversation. This is not a continuous recording or a physical-phone test. [MP4](telegram-phone-demo.mp4) · [Poster](telegram-phone-poster.png) · [Transcript, scope and embedding instructions](telegram-phone-demo.md).

The older media below remain scripted interface captures. Do not rename or recaption them as live runs.

## WhatsApp phone concept: no live delivery claim

The [22-second WhatsApp GIF](whatsapp-phone-preview.gif), [MP4](whatsapp-phone-preview.mp4) and [poster](whatsapp-phone-poster.png) show an English, scripted example of how messaging a Crewlo agent could look. The animated phone layout is recreated. The voxel studio crop is from an earlier Crewlo capture, not a synchronized WhatsApp event. "Illustrative flow · Not yet live-tested" remains visible in every frame. See the [sharing and rebuild notes](whatsapp-phone-preview.md). Do not describe this preview as a real phone test or a verified agent response.

Use the [French quickstart and live-recording checklist](../QUICKSTART.fr.md#préparer-une-vraie-démo-publique) and the [local messaging guide](../../messaging-setup.html). Prepare/pair off camera, record only a safe test workspace, preserve truthful waiting/delivery states, disclose any time cuts, and review every frame before sharing. No live recording or publication is performed automatically.

## Ready to share

| File | Content |
| --- | --- |
| [crewlo-demo.mp4](crewlo-demo.mp4) | 18-second silent demo, 1280 × 800: studio activity, mission delivery Resume, Telegram QR/confirmation/agent selection |
| [studio-activity.gif](studio-activity.gif) | 10-second loop, 960 × 600; agent labels, wide input, delivery state |
| [telegram-pairing.gif](telegram-pairing.gif) | 8-second loop, 960 × 600; scripted Telegram setup |
| [studio-poster.png](studio-poster.png), [telegram-poster.png](telegram-poster.png) | Static alternatives captured from the same sequence |
| [crewlo-demo.vtt](crewlo-demo.vtt) | English captions/transcript; the website includes these as a video track |

The landing page uses posters and explicit Play/Pause buttons, not autoplay. Visitors with reduced motion are not forced to watch animation. The README embeds the GIFs with nearby static alternatives because GitHub's image rendering does not give this project playback controls.

### What the video shows

- 0–4 s: Remy and Ellis have labels generated from injected execution-hook fixtures. The characters and studio are the actual renderer, not a video mockup.
- 4–7 s: The real Resume control changes the mocked delivery state. The composer shows one status line.
- 7–10 s: A second simulated tool event updates Remy's activity.
- 10–13 s: The real Telegram setup panel displays a demo QR. It points to example.com and cannot pair a real account.
- 13–15 s: A simulated owner requests pairing; the desktop asks for confirmation.
- 15–18 s: Confirm the demo owner and select Remy. No message round trip is depicted.

## Recreate the assets locally

Install project dependencies with `npm ci`, build once with `npm run build`, and have FFmpeg on PATH. The capture script also needs Playwright; point `CREWLO_PLAYWRIGHT` to an existing installation if it is not available as `playwright`. `CREWLO_FFMPEG` optionally selects an FFmpeg executable. The site checker needs Playwright's Chromium installed, or `CREWLO_CHROMIUM` pointing to an existing Chromium executable.

```powershell
$env:CREWLO_PLAYWRIGHT = 'C:\path\to\node_modules\playwright'
node tools/crewlo-promo-capture.cjs
node tools/crewlo-site-check.cjs
```

Run from the repository root. A hidden Electron window uses a temporary isolated profile and Vite on port 5178. Capture frames are temporary; only the listed media are generated into this directory. The script preserves all user configurations and never starts an agent CLI or sends a message. The event labels pass through the real activity formatter. Requires a graphical desktop session (verified here on Windows), not a headless production server.

## Preview the website

```sh
npx vite docs --host 127.0.0.1 --port 5182
```

Open the shown localhost address. No publishing is performed. If the maintainer later chooses GitHub Pages, select the intended branch's `/docs` folder in repository Settings → Pages. Existing legacy upstream pages remain in `docs/` for history; the new landing does not link to their downloads, analytics, or payments. Check `docs/CNAME` and any custom-domain settings before publishing; do not carry an upstream domain onto this fork.

### Activate Buy Me a Coffee

Edit `docs/crewlo-links.json` only after the maintainer confirms the beneficiary:

```json
{
  "repositoryUrl": "https://github.com/HafidIdrissi/crewlo",
  "coffeeUrl": "https://buymeacoffee.com/YOUR_CONFIRMED_HANDLE"
}
```

The example above is a template. The current `coffeeUrl` is `https://buymeacoffee.com/hafididrissi`, supplied by Hafid Idrissi. The website, app and Windows setup share this profile. The site's button becomes a link after loading the validated config; this also works on nested blog pages. If the destination is removed or invalid, the button stays disabled. Rebuild the app and installer after changing the bundled config. `build/prepare-support.cjs` runs before Windows packaging and generates the installer destination from the same JSON file. Update the README button link and the confirmed username in `.github/FUNDING.yml` at the same time. No payment credentials belong in these files. Windows setup only opens the profile after an explicit click on its final page; supporting Crewlo is optional.

## Launch copy — edit and post yourself

### Short English post

> What if your AI agents shared a tiny voxel studio?
>
> I'm building Crewlo: a local workspace to give your crew a mission and see who is doing what.
>
> Here's an 18-second scripted interface demo. Early project, open source, and lots of room to improve.
>
> Try it, report a rough edge, or help with accessibility and cross-platform testing. If it interests you, a GitHub star is welcome.
>
> https://github.com/HafidIdrissi/crewlo
>
> #OpenSource #AIAgents #BuildInPublic

Share once in relevant communities that allow project showcases. Ask for specific feedback, answer issues, and show actual improvements in follow-ups. No fake stars, automated outreach, inflated claims, or guaranteed “trending” results.

## Credits

Interface footage and original Crewlo voxel art: project source, MIT. Crewlo is an independent visual fork of Munder Difflin; upstream copyright and asset attribution remain in [ASSETS.md](../ASSETS.md) and the repository licenses. This demo does not use third-party music, stock footage, or generated imagery.
