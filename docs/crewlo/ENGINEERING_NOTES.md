# Crewlo engineering notes

This document records the codebase's foundations and compatibility choices. For the product, demo, setup and contribution paths, start with the [Crewlo README](../../README.md).

## Foundations and Crewlo's direction

Crewlo is an independently maintained fork of [Munder Difflin](https://github.com/chaitanyagiri/munder-difflin), by Chaitanya Giri and contributors. It is not an upstream release or a complete rewrite of the agent engine.

The codebase retains the Electron, React, Pixi.js and xterm.js foundation, including provider integrations, authentication, agent sessions, orchestration, memory, permissions, task records and persistence. See the [engine architecture](../ARCHITECTURE.md).

Crewlo adds its own procedural voxel studio and figurine artwork, visual identity, responsive mission surface, execution-event activity labels and Telegram/WhatsApp transports. The messaging integrations reuse connected sessions, message queues and delivery controls; they do not create an alternative permission system. See the [studio implementation](VOXEL.md) and [messaging setup and verification](../messageries-tests.fr.md).

## Compatibility boundaries

- Package identifiers, storage keys, saved configuration and provider protocol identifiers are intentionally retained where changing them could break existing installations or integrations. A product-name change does not justify blindly renaming these values.
- Provider presets include Claude Code, Codex, Gemini CLI and others. Coordination and remote-messaging support vary by provider; a configured CLI is not automatically a supported messaging target.
- Upstream update polling, downloads, installation and release promotion are disabled. Crewlo has no release feed. A future Crewlo installer or updater needs its own verified release process, destinations and signing decisions.
- The studio's workshop, break room, game room and terrace are visual zones, not separate autonomous teams. The real agent roster and execution events remain the source of operational state.

## Verification boundaries

Local Windows checks and focused tests are documented in the [verification notes](VERIFICATION.md). The full test suite has known baseline failures; passing a focused suite must not be presented as a clean full-suite result.

Messaging tests use simulated Telegram/Meta responses and model replies. Real account-to-agent delivery, packaged installers, signing and macOS/Linux runtime behavior require separate validation. The [live-test checklist](../messageries-tests.fr.md) explains what needs the maintainer's accounts and running agent sessions.

## Attribution and licenses

The original [MIT license and copyright notice](../../LICENSE) remain unchanged. Original Crewlo studio artwork is MIT-licensed; bundled third-party tilesets, maps and fonts retain their separate notices and licensing conditions. See [LICENSE-ASSETS](../../LICENSE-ASSETS), the [bundled asset attribution](../../src/renderer/src/assets/ATTRIBUTION.md) and [Crewlo asset origins](ASSETS.md).

The GitHub fork relationship is independent of the product's name and README. This documentation change does not detach, rename, publish or push the repository, and does not erase the origin of reused code.
