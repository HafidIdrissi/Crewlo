# Crewlo 0.4.6 — development preview

These notes describe the current source and local validation work. **Not a published release.** No public installer download or release feed is advertised.

## What's new

- **A living voxel studio demo.** Choose a mission, select an agent and follow request, activity and reply. The website uses an illustrated fifteen-second sequence with pause and reduced-motion controls.
- **A shorter discovery path.** Studio, documented result, twelve provider presets, tabbed Telegram/WhatsApp previews, installation and FAQ.
- **Windows preview packaging.** French/English per-user NSIS setup, Crewlo shortcuts, packaged SQLite and PTY checks, and settings persistence across restarts.
- **Worktree protection.** Windows cleanup detaches shared dependency junctions and refuses unknown links before deletion.
- **Cross-platform corrections.** Windows paths and CRLF are covered by tests; macOS universal DMGs are recognized by the download selector.

## Evidence and limits

The 27 September full-suite run passed 959 tests, failed none and skipped eight (967 total), including signing-command and universal-DMG regressions. The website passed checks at 320, 390, 768, 1024 and 1440 pixels.

A real Codex response was verified through packaged Crewlo IPC and PTY using a temporary file. This does not establish full hive routing or all-provider compatibility. The illustrated website is not a recording of that test.

The Windows installer is unsigned and locally tested. A clean Windows PC and uninstall remain unverified. macOS packaging has been reviewed, but no DMG has been built or executed; Linux runtime validation remains open. Signing and further live messaging checks are deferred.

Telegram has a documented basic message round trip. WhatsApp is experimental with simulated transport tests, not verified live delivery.

## Build and verification

Use [source setup](README.md#build-from-source) and [desktop packaging](README.md#desktop-packaging).

- [Windows installation](docs/crewlo/WINDOWS-INSTALLER.fr.md)
- [Windows validation](docs/crewlo/WINDOWS-VALIDATION.fr.md)
- [macOS validation](docs/crewlo/MACOS-VALIDATION.fr.md)
- [Demo capture notes](docs/crewlo/demo/README.md)

## Attribution

Crewlo builds on Munder Difflin. The MIT notices remain intact. The [historical upstream release note](docs/archive/UPSTREAM-RELEASE-0.4.6.md) is preserved separately and is not a Crewlo download recommendation.
