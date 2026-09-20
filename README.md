# Crewlo

A local AI workspace, imagined as a warm, original voxel workplace. Give your agents a mission, follow their actual activity, and open any agent’s terminal from its figurine.

Crewlo preserves the existing Electron + React + Pixi.js + xterm.js engine, provider integrations, authentication, orchestration, memory, permissions, task ledger, and persistence. The workshop, break room, game room and outdoor terrace are visual zones, not separate autonomous teams.

## Run locally

Use Node.js 22.22 or newer and npm. Provider CLIs and credentials are configured through onboarding.

```sh
npm ci
npm run dev
```

On Windows, the existing native `node-pty` dependency requires Visual Studio C++ build tools, the Windows SDK, and the matching MSVC Spectre-mitigated libraries. If installation reports MSB8040, add those libraries through Visual Studio Installer and rerun `npm ci`.

```sh
npm run typecheck
npm run test:focused
npm run build
npm run preview
```

The focused test runner expands files portably, including on Windows with Node 20. See [verification and known baseline failures](docs/crewlo/VERIFICATION.md).

## In the studio

- Start a mission from the composer. It routes through the existing coordinator and permission gates.
- Click a figurine or use the keyboard-accessible roster to select its conversation or terminal.
- Open Tasks & results, Approvals & input, Memory, or Settings from the workspace controls.
- Agents appear only from the actual roster. Confirmed idle agents may take clearly labeled cosmetic breaks, entirely locally without prompts or tokens. Smoking is opt-in per agent in Scene preferences. Unknown, queued, blocked and disconnected agents never take leisure breaks. Results link to actual completed task records.
- Additional agents expand the workplace’s individual desks. The roster scrolls without limiting the number of agents.
- In smaller windows, the conversation panel sits below the studio. Selecting an agent scrolls to it; “Back to studio” returns to the scene. Reduced motion disables figurine animation.

## Screenshots and design

[1920 desktop](docs/crewlo/voxel-workplace-1920.png) · [1440 desktop](docs/crewlo/voxel-workplace-1440.png) · [Empty workplace](docs/crewlo/voxel-empty.png) · [Animation recording](docs/crewlo/voxel-animation.webm) · [Previous clay studio](docs/crewlo/refinement-before-studio.png)

[Voxel implementation and verification](docs/crewlo/VOXEL.md). Collapse the agent panel to focus on the workplace; drag its divider to resize it. Arrow keys pan the focused scene, +/− zoom, and 0 or Fit resets the camera.

Populated screenshots are explicitly labeled visual test fixtures; they do not represent running agents or completed work.

[Design system](DESIGN.md) · [Asset origins and licenses](docs/crewlo/ASSETS.md) · [Engine architecture](docs/ARCHITECTURE.md)

## Acknowledgment and licenses

Crewlo is an independent visual fork of [Munder Difflin](https://github.com/chaitanyagiri/munder-difflin), by Chaitanya Giri and contributors. Crewlo adds original procedural studio and figurine artwork, a new visual identity, an accessible mission surface, and responsive layout while retaining the upstream agent engine. It is not an upstream release.

Source code and new Crewlo artwork are MIT-licensed. The upstream [LICENSE](LICENSE) and copyright notices are retained unchanged. Bundled legacy tilesets/maps are separately licensed: credit to [LimeZu](https://limezu.itch.io/) and [shahar061/the-office](https://github.com/shahar061/the-office); see [LICENSE-ASSETS](LICENSE-ASSETS) and [asset attribution](src/renderer/src/assets/ATTRIBUTION.md). Font licenses remain bundled unchanged.

Crewlo has no release feed. Upstream update polling, downloads, installation, and release promotion are disabled. Package identifiers, storage keys, existing configuration, and provider protocol identifiers are intentionally retained for compatibility. No publishing or deployment is part of this redesign.
