# Crewlo 0.4.6 — macOS preview 1

Public preview for Apple Silicon and Intel Macs. These are separate DMG installers; choose the chip shown in **Apple menu > About This Mac**.

- [Apple Silicon (M-series)](https://github.com/HafidIdrissi/crewlo/releases/download/v0.4.6-mac-preview.1/Crewlo-0.4.6-mac-arm64.dmg) — [SHA-256](https://github.com/HafidIdrissi/crewlo/releases/download/v0.4.6-mac-preview.1/Crewlo-0.4.6-mac-arm64.dmg.sha256)
- [Intel Mac](https://github.com/HafidIdrissi/crewlo/releases/download/v0.4.6-mac-preview.1/Crewlo-0.4.6-mac-x64.dmg) — [SHA-256](https://github.com/HafidIdrissi/crewlo/releases/download/v0.4.6-mac-preview.1/Crewlo-0.4.6-mac-x64.dmg.sha256)

Open the DMG, drag Crewlo into Applications, then launch it and connect your own authenticated agent CLI. Provider accounts and usage charges remain separate. No automatic update feed is enabled.

## Verification

Built from commit `8a0f0eb2` on matching macOS 15 Apple Silicon and Intel GitHub runners. Both packages pass application-file checks, SQLite in-memory queries and an actual PTY shell command under their packaged Electron runtime. Both disk images pass `hdiutil verify`.

[Build and verification logs](https://github.com/HafidIdrissi/Crewlo/actions/runs/36351216255)

## Preview limits

The bundles have ad-hoc signatures, **without Apple Developer ID certification or notarization**. macOS may block opening the app. Review [Apple's guidance](https://support.apple.com/en-us/102445) before deciding whether to open it.

Automated runtime checks do not establish a complete first-launch experience: the interface, permissions prompts, agent authentication, live missions and installation on a personal Mac remain unverified. Telegram's documented Windows round trip does not prove messaging on Mac; WhatsApp remains experimental.

Crewlo builds on Munder Difflin; upstream MIT notices are preserved.
