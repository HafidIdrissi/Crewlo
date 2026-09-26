# Crewlo demo kit

## Focused landing walkthrough — 26 September 2026

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

This is a template, not an account recommendation. `coffeeUrl` is currently `null`. The site omits the link until a valid HTTPS Buy Me a Coffee profile URL is supplied; the app keeps its unconfigured action disabled. Rebuild the app after changing its bundled config. Change the README's “coming soon” entry to the confirmed URL and uncomment the confirmed username in `.github/FUNDING.yml` at the same time. No payment credentials belong in these files.

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

### Version française

> Et si tes agents IA partageaient un petit studio voxel ?
>
> Je construis Crewlo : un espace local pour leur donner une mission et voir qui fait quoi.
>
> Voici 18 secondes de démo de l'interface, avec des données simulées. Le projet est encore jeune et ouvert aux contributions.
>
> Testeurs Windows/macOS/Linux, devs React/Electron, profils accessibilité : vos retours sont les bienvenus. Une étoile GitHub aide aussi à faire découvrir le projet.
>
> https://github.com/HafidIdrissi/crewlo
>
> #OpenSource #AIAgents #BuildInPublic

Share once in relevant communities that allow project showcases. Ask for specific feedback, answer issues, and show actual improvements in follow-ups. No fake stars, automated outreach, inflated claims, or guaranteed “trending” results.

## Credits

Interface footage and original Crewlo voxel art: project source, MIT. Crewlo is an independent visual fork of Munder Difflin; upstream copyright and asset attribution remain in [ASSETS.md](../ASSETS.md) and the repository licenses. This demo does not use third-party music, stock footage, or generated imagery.
