# Crewlo website review — 26 September 2026

This revision is a local, reviewable website preview. It has not been pushed or published. Run `npm run site` from the checkout and open the localhost URL printed by Vite.

## Product presentation follow-up

The earlier redesign was published as `e68b369c`. This follow-up changes the
presentation, not the product engine:

- Full-width hero with two agents, captured directly from the actual voxel
  renderer at 1920 × 900. A separate 720 × 520 mobile framing keeps the label
  readable. A distinct 1280 × 960 agent close-up appears in the activity step.
- Three large, keyboard-operable chapters: mission, activity, reply. The composer
  and response are responsive HTML illustrations. They use the verified Telegram
  greeting, with its original channel explicitly disclosed. The renderer state
  is independently scripted; no synchronized real run is claimed.
- Optional finite playback, pause/resume, manual selection, and subtle status /
  response transitions. Controls stay above the visual; captions remain beside
  it or below on mobile. Presentation progress never represents task progress.
- Playback stops when the page or walkthrough is hidden, when a panel receives
  keyboard focus, or when reduced motion is enabled. Reduced-motion users select
  chapters manually. The original video remains in a disclosure; closing it
  pauses playback. Captions are available on demand.
- Repeated full-application screenshots replaced by three concise benefits.
  Existing guides, integration statuses, credits and installation links remain.
- No new dependency. New lossless WebP files total 245,940 bytes and were checked
  pixel-identical to the native PNG exports. Capture tooling and its limitations
  are documented in `tools/studio-framing/README.md`.

Verification for this follow-up:

- All 12 focused website/community tests pass; JS syntax and `git diff --check`
  pass. Existing tab-order expectations were updated for mission-first order.
- Chrome checked at 320, 390, 768, 1024 and 1440 CSS pixels, with no document-level
  horizontal overflow. The three chapters were individually checked at 320 px.
- Arrow/Home/End navigation, visible focus, mobile menu Escape/focus restoration,
  FAQ keyboard toggles, modal open/Escape/focus restoration and the native
  1920-pixel image were exercised. Demo anchors cleared the sticky header by
  approximately 20 px.
- The walkthrough completed all three steps and stopped; replay and pause were
  exercised. Original video playback and pause-on-collapse were observed.
- Five important new text/background pairs measured 6.29:1–11.51:1 contrast.
  Step tabs are at least 76 px high; playback control is at least 44 px high.
- Reduced-motion branches were reviewed in code; OS preference emulation was
  not exercised. The standalone browser smoke script was updated and syntax
  checked, not executed; interactive checks used the controlled browser.
- No site console error was observed; one browser-extension listener error was
  unrelated to the page.

Outstanding product/media work is unchanged: a continuous real mission capture,
a tested installer, live WhatsApp validation and broader provider/platform checks.

The sections below record the earlier information-architecture review.

## Review before implementation

Reviewed the live [Crewlo site](https://hafididrissi.github.io/Crewlo/) and [Munder Difflin site](https://munderdiffl.in/), including their browser presentation, before changing the code.

The reference makes its product category, demo and trial route visible early, then develops its story through concrete uses. Those are useful information-design principles. Its office narrative, copy, visual identity, compatibility claims, download claims and metrics were not adopted.

Crewlo's previous landing had a memorable but indirect headline, a small product view, lengthy setup content on the home page, and limited explanation of its own additions to the upstream engine. The interface tour demonstrated controls rather than a completed mission. The Telegram evidence was more specific than the general messaging claims, while the linked setup page was still in French.

## Product evidence used

| Evidence | What it establishes | What it does not establish |
| --- | --- | --- |
| [Verification](VERIFICATION.md), [refinement](REFINEMENT.md), [voxel implementation](VOXEL.md) | Local Windows interface/runtime checks, original scene artwork, mission surface and execution-event labels | Clean source rebuild, all provider authentication/approval flows, macOS/Linux runtime support |
| [Telegram transcript](demo/telegram-phone-transcript.json), [scope](demo/telegram-phone-demo.md) | Basic real request, acknowledgement and named reply observed in Telegram Web on 23 September | Completed coding task, continuous recording, physical-phone or provider-wide certification |
| [WhatsApp preview scope](demo/whatsapp-phone-preview.md) and existing messaging tests | Implemented transport with simulated API checks; illustrative media | A real WhatsApp account-to-agent round trip |
| [Engineering notes](ENGINEERING_NOTES.md), README and release configuration | Upstream engine retained; Crewlo-specific presentation and transports; no verified release feed | A tested installer simply because packaging artwork exists |

The repository's release list was empty when inspected. No provider logo or unsupported platform is promoted as validated on the new first screen. The dedicated status page distinguishes source features, experimental integrations and outstanding release/validation work without assigning release dates.

## Website changes

- Explicit headline, secondary pixel signature, an enlarged original product capture and a keyboard-accessible full-size viewer.
- Two clear hero actions: explore the demonstration or read source-install instructions.
- Request → activity → permission review if needed → result explanation. Existing footage remains labeled scripted. The missing continuous real mission capture is stated beside the demo.
- Existing keyboard tabs reused for three illustrated benefits; the response illustration quotes the checked-in Telegram transcript.
- Short home-page setup and integration summaries; complete English installation and messaging guides; a separate project-status/evidence page.
- Real Telegram evidence, Crewlo-specific additions and dated, linked changes replace unsupported marketing proof.
- Four-question FAQ, final install action, retained upstream/asset/font credits and privacy boundaries.
- No new runtime dependency. Local fonts with `font-display: swap`; only the body font preloaded. Native-size WebP hero with PNG fallback: 193,592 bytes versus 260,702 bytes (25.7% smaller), verified pixel-identical. Video uses `preload="none"`; GIFs start as still posters and require explicit playback. Hidden disclosures stop their animation.

## Verification of this revision

- `node --test test/crewlo-promo.test.cjs test/crewlo-community.test.cjs`: 12 passed. Includes local assets/anchors across the new pages, copy-target IDs, evidence text, installer-claim boundaries and credits.
- JavaScript syntax checks and `git diff --check` passed.
- Chrome inspection at 320, 390, 768, 1024 and 1440 CSS pixels. No document-level horizontal overflow. Dedicated guides checked at narrow width; availability table becomes readable stacked rows while retaining its table role.
- Mobile menu, Escape/focus restoration, anchored section offsets, arrow/Home/End tab selection, FAQ Enter/Space, full-size preview opening/closing, source command copy feedback, 18-second video playback and opt-in phone GIF playback checked through the browser UI.
- Twenty sampled important text styles passed 4.5:1 contrast; lowest measured ratio was 5.56:1. Focus outlines and 44px controls were inspected. This is a targeted review, not a full WCAG or screen-reader certification.
- `prefers-reduced-motion` CSS and media-change handling retained/reviewed. No automatic GIF/video playback on initial load. OS-level reduced-motion emulation was not exercised in this browser session.
- `tools/crewlo-site-check.cjs` updated for the new routes and viewer. Syntax checked; the standalone Playwright runner was not executed in this session. Interactive verification used the controlled browser instead.

## Product work still needed

These website edits do not implement or validate a new product capability. Remaining work includes a clean Windows installation, installer packaging/testing/signing and release process, live WhatsApp acceptance, provider/platform validation, and a continuous real mission recording. The existing full-suite baseline failures remain documented; the focused website checks are not a clean full-product-suite claim.
