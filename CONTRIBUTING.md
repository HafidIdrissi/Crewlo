# Contributing to Crewlo

Thanks for helping make the studio useful beyond a demo. Crewlo is an early, source-first desktop project; small, testable changes are especially valuable.

## Pick a first contribution

- [Report a bug](https://github.com/HafidIdrissi/Crewlo/issues/new/choose) with steps to reproduce and your OS. Screenshots help, but never include bot tokens, phone numbers, personal chats, prompts or raw terminal logs.
- [Suggest an idea](https://github.com/HafidIdrissi/Crewlo/discussions) before spending time on a large change.
- Improve the Windows quick start, accessibility, agent activity labels, responsive layout, or cross-platform testing. A verified, clearly scoped Telegram or WhatsApp test report is useful too; do not post credentials.
- For a security issue, use [private vulnerability reporting](https://github.com/HafidIdrissi/Crewlo/security/advisories/new), not a public issue.

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md). Crewlo builds on Munder Difflin; retain the [MIT notice](LICENSE) and [asset attribution](LICENSE-ASSETS) when changing inherited code or art.

## Run from source

You need Git, Node.js **22.22+**, npm, and a working C/C++ toolchain for Electron's native modules. Windows also needs the matching Visual Studio C++ toolset, Windows SDK and MSVC Spectre libraries. [Windows setup details](docs/crewlo/QUICKSTART.fr.md).

```sh
git clone https://github.com/HafidIdrissi/Crewlo.git
cd Crewlo
npm run doctor
npm ci
npm run dev
```

Public Windows x64 and macOS Apple Silicon/Intel previews are available through the [installation guide](https://hafididrissi.github.io/Crewlo/install.html). Windows is unsigned; macOS has no Apple Developer ID certification or notarization. Packaged SQLite and terminal checks pass on all three targets; the reports distinguish automated checks from personal-machine and live-agent tests. There is no automatic update feed. See the [Windows](docs/crewlo/WINDOWS-VALIDATION.fr.md) and [macOS](docs/crewlo/MACOS-VALIDATION.fr.md) reports. You need an installed and authenticated agent CLI to run a real session; provider subscriptions and API usage are separate. Use a small, non-sensitive test workspace first.

## Send a focused pull request

1. Open an issue or discussion for larger changes. For a small fix, a PR is fine directly.
2. Work on one behavior at a time, from `main`. Keep paths cross-platform and handle directories with spaces.
3. Add or update a test when behavior changes. Run `npm run typecheck`, relevant tests, and `npm run build`. `npm run test:focused` runs the full suite; `npm run test:crewlo` is the smaller smoke suite. The earlier Windows failures were resolved; report your actual results and skipped tests with your OS and Node version.
4. Use the PR template's **Before** and **After** sections. For UI, attach comparable screenshots or a short recording. For docs, build or nonvisual work, describe the before/after outcome in text or show test output. State your OS and exact checks.
5. Keep new UI consistent with [Crewlo's design system](DESIGN.md). Credit new artwork and fonts in [asset origins](docs/crewlo/ASSETS.md).

Please avoid unrelated formatting, generated files, credentials, payment links you do not own, or claims that a simulated demo proves live delivery. Never change the upstream copyright notice to imply Crewlo created inherited work.

## Where things live

| Path | Purpose |
| --- | --- |
| `src/main/` | Electron process, agent sessions, local queues and messaging transports |
| `src/preload/` | Typed IPC bridge |
| `src/renderer/` | React UI and voxel studio |
| `src/shared/` | Contracts shared by main and renderer |
| `docs/` | GitHub Pages site, setup guides and demo media |
| `test/` | Automated checks |

[Architecture](docs/ARCHITECTURE.md) · [Messaging test checklist](docs/messageries-tests.fr.md) · [Design system](DESIGN.md)
