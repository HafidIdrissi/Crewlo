# Crewlo use-case videos

## Detailed English walkthroughs

[Explore all use cases](https://hafididrissi.github.io/Crewlo/use-cases.html) · [Open the practical guide](playbooks/index.html) · [Download the English kit](playbooks/crewlo-playbooks-en.zip).

Three end-to-end scenarios: TaskBoard, ClientFlow and LaunchPage. Includes English agent creation instructions, three importable role manifests, 23 copyable prompts, acceptance steps and a filming script. These are workflows to execute; no new live MVP recording is claimed. Source guides are in `playbooks/*.en.md`; regenerate the reader, prompt files and archive with `python tools/build-crewlo-playbooks.py` (requires Python-Markdown).

## Earlier illustrated videos

Silent English videos with on-screen text. Rendering does not call a provider, send messages or change an agent session.

| Video | Format | Duration | Use |
| --- | --- | --- | --- |
| [Six use cases](crewlo-use-cases-en-16x9.mp4) | 1920 × 1080 | 40 s | X, Peerlist, Product Hunt, presentations |
| [Six use cases, vertical](crewlo-use-cases-en-9x16.mp4) | 1080 × 1920 | 40 s | Shorts, Reels, TikTok |
| [Build an MVP](crewlo-mvp-en-16x9.mp4) | 1920 × 1080 | 24 s | Focused MVP workflow presentation |

[Detailed missions, acceptance criteria and social captions](USE-CASES.en.md) · [Video gallery](index.html).

The matching `.srt` files contain scene titles and subtitles. Essential text is also embedded in the videos.

## What is shown

The animated studio comes from `docs/crewlo/demo/mission-studio.mp4`, a deterministic voxel-renderer capture with demonstration agents. Missions, steps and deliverables are composed to illustrate workflows. TaskBoard is a drawn mockup of the intended result. The videos do not show live MVP creation, test execution or a project-status Telegram exchange.

The “Illustrated demo” label remains visible. The Telegram/WhatsApp scope is stated in its scene. Keep these labels when sharing.

Crewlo is an independent fork of Munder Difflin. Original credits and licenses remain applicable. No music or external artwork is added.

## Rebuild the videos

Requirements: Python, Pillow, FFmpeg, and Segoe UI or DejaVu Sans fonts.

```powershell
python tools/render-crewlo-usecases.py
```

For one format, use `--only landscape`, `--only portrait` or `--only mvp`.
Editorial content is in `scenarios.en.json`. The script composites video graphics with existing studio footage; it does not control a browser, agent CLI or connected account.
