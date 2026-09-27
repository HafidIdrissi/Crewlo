# Crewlo 0.4.6 — Windows preview 2

**Public Windows preview, not a stable release.** [Download the Windows x64 installer](https://github.com/HafidIdrissi/crewlo/releases/download/v0.4.6-preview.2/Crewlo-0.4.6-win-x64-preview-setup.exe) (129 MB) and [SHA-256 checksum](https://github.com/HafidIdrissi/crewlo/releases/download/v0.4.6-preview.2/Crewlo-0.4.6-win-x64-preview-setup.exe.sha256).

Run the setup file, then launch Crewlo and connect your own agent CLI. French/English, per-user setup. The installer is unsigned; Windows may show an unknown-publisher warning. No automatic updates are enabled.

Built from commit f8585344f5976721f5bd71dd84cee0fc7e1b08f3. SHA-256: `a300825c31b83471394b7607f9ebc46dd78e6b59607cac995b79e80b171aedbe`.

## What's new

- **Preview 2 dependency fixes.** Removed unused localtunnel, updated Hono and pinned the patched TOML parser for tunnelmole. Production npm audit reports zero vulnerabilities at build time.
- **Installation checks.** Silent Windows installation and first launch passed on a fresh Server 2022 runner. Both Mac DMGs passed mounting, copying and onboarding/settings checks on matching macOS 15 runners. [Scope and remaining manual checks](docs/crewlo/COMMUNITY-READINESS.fr.md).

- **A living voxel studio demo.** Choose a mission, select an agent and follow request, activity and reply. The website uses an illustrated fifteen-second sequence with pause and reduced-motion controls.
- **A shorter discovery path.** Studio, documented result, twelve provider presets, tabbed Telegram/WhatsApp previews, installation and FAQ.
- **Windows preview packaging.** French/English per-user NSIS setup, Crewlo shortcuts, packaged SQLite and PTY checks, and settings persistence across restarts.
- **Worktree protection.** Windows cleanup detaches shared dependency junctions and refuses unknown links before deletion.
- **Cross-platform corrections.** Windows paths and CRLF are covered by tests; macOS universal DMGs are recognized by the download selector.

## Evidence and limits

The 27 September full-suite run passed 961 tests, failed none and skipped eight (969 total), including signing-command and universal-DMG regressions. The website passed checks at 320, 390, 768, 1024 and 1440 pixels.

A real Codex response was verified through packaged Crewlo IPC and PTY using a temporary file. This does not establish full hive routing or all-provider compatibility. The illustrated website is not a recording of that test.

The Windows installer is unsigned and locally tested. A clean Windows PC and uninstall remain unverified. Separate [macOS preview notes](docs/crewlo/MACOS-RELEASE.md) cover the Apple Silicon and Intel DMGs and their packaged SQLite/PTY checks. Personal-Mac installation and permissions testing, Apple certification/notarization, Linux runtime validation and further live messaging checks remain open.

Telegram has a documented basic message round trip. WhatsApp is experimental with simulated transport tests, not verified live delivery.

## Build and verification

Use [source setup](README.md#build-from-source) and [desktop packaging](README.md#desktop-packaging).

- [Windows installation](docs/crewlo/WINDOWS-INSTALLER.fr.md)
- [Windows validation](docs/crewlo/WINDOWS-VALIDATION.fr.md)
- [macOS validation](docs/crewlo/MACOS-VALIDATION.fr.md)
- [Demo capture notes](docs/crewlo/demo/README.md)

## Attribution

Crewlo builds on Munder Difflin. The MIT notices remain intact. The [historical upstream release note](docs/archive/UPSTREAM-RELEASE-0.4.6.md) is preserved separately and is not a Crewlo download recommendation.
