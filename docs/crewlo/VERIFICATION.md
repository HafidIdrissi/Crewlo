# Crewlo verification — 2026-09-20

For the subsequent interface refinement, current screenshots and latest test results, see [REFINEMENT.md](REFINEMENT.md). The notes below record the initial redesign pass.

Work stayed on `feat/crewlo-visual-identity`. The initial worktree was clean. No AGENTS.md was found in the repository or its ancestor directories. No changes were pushed, published, or deployed.

## Baseline

- Reviewed README, DESIGN, architecture, scene/cast rendering, event hooks, store, task handling, design tokens, and asset licenses.
- Ran the original Electron application in an isolated profile and captured `before.png` (original onboarding). No configured provider was available in that profile, so there is no original live-agent floor screenshot.
- Dependencies were initially absent. `npm ci` populated them but its native rebuild returned MSB8040 because the Visual Studio Spectre-mitigated libraries are missing. Node 20.19.4 also emitted an engine warning for posthog-node, which requires Node 20.20+ or 22.22+.
- After dependency population, original type checks and production build passed. The installed ConPTY path also proved usable in the later terminal check despite the failed full rebuild.
- Original `npm run test:focused` could not expand its glob on Node 20 / Windows. Expanding filenames explicitly ran 834 tests: **808 passed, 18 failed, 8 skipped**. Crewlo supplies a portable filename-expanding runner.

## Final checks

| Check | Outcome |
| --- | --- |
| `npm run typecheck` | Passed, main and renderer |
| `npm run build` | Passed; existing large-chunk/mixed-import warnings remain |
| `npm run test:focused` | 836 tests: **811 passed, 17 failed, 8 skipped** |
| Focused state, identity, settings-save, native quit checks | 15 passed |
| Local Electron interaction harness | Passed; no page errors |
| `git diff --check` | Passed |

The 17 final failures are all in the baseline failure set. The original release-notes configuration assertion now passes after removing the upstream publish target. An intermediate run also hit an intermittent Windows process-exit timing failure in `quit-sweep.electron.test.cjs`; it passed independently and in the final suite. The settings source-contract test was updated because automatic updates are intentionally no longer an editable Crewlo setting.

Remaining baseline failure groups:

- `agent-token-cap.test.cjs`: POSIX versus Windows path expectation.
- `arabic-terminal.test.cjs`: existing terminal-rebuild source assertion.
- `cli-install-ladder.test.cjs`: two existing installer-output assertions.
- `codex-remote.test.cjs`: Unix socket-path expectation on Windows.
- `hire-import.test.cjs`: existing Command Center token-cap source assertion.
- Two existing telemetry source assertions: composer submit counting and steer counting.
- Four transcript path-resolution expectations.
- Five `worktree-deps.test.cjs` Windows path, symlink, and dirty-worktree expectations.

Exact baseline/final failing test names are recorded in [test-failures.md](test-failures.md).

## Interface checks

`tools/crewlo-capture.cjs` launches Electron using `tools/crewlo-capture-entry.cjs`, which gives it a new temporary user-data directory. All populated agent/task screenshots are explicitly labeled fixtures. Fixture dispatch and task patch IPC are intercepted inside that isolated process; no model, provider, external message, or task is executed.

Verified:

- Empty workspace has no synthetic agents or activity.
- Pixi figurine pointer hit-testing selects the corresponding existing side panel.
- Keyboard agent selection, including in a 760px window.
- Task navigation selects the coordinator before requesting its task tab.
- Existing human-input view opens; responding patches the task through the existing IPC contract.
- Completed ledger entries open their task details and actual `result` text.
- Mission submission routes through `hiveSend`; failure leaves the draft intact.
- Settings opens with Crewlo identity, upstream attribution, and an explicitly disabled updater.
- Upstream update check and download IPC reject requests with Crewlo’s no-feed message.
- Desktop, stacked 760px layout, conversation access, reduced motion, and a 14-agent roster.
- A **real local `cmd.exe` PTY** opens in the existing xterm panel and displays `CREWLO_TERMINAL_OK`; the test kills only that shell afterward.
- Screenshots were inspected; the scene was enlarged, a floating memory control was removed from the mission area, and narrow-window conversation navigation was added.

## Screenshots

- [Before: original onboarding](before.png), [Crewlo onboarding](after-onboarding.png)
- [Desktop studio](after-desktop.png), [empty studio](after-empty.png)
- [Attention states and human input](after-attention.png), [task result](after-result.png)
- [Settings](after-settings.png)
- [Small studio](after-small.png), [small conversation](after-small-conversation.png)
- [Expanded roster](after-many.png), [real local terminal](after-terminal.png)

## Reproduce

Run the app with `npm run dev`. The capture harness expects its renderer at `http://localhost:5173/` and the built main/preload files in `out/`. Playwright is optional developer tooling, not a runtime dependency:

```sh
npm install --no-save --package-lock=false --ignore-scripts playwright
node tools/crewlo-capture.cjs
```

Alternatively set `CREWLO_PLAYWRIGHT` to an already installed Playwright module path. This session used a temporary npm-exec installation. Desktop icon assets can be regenerated with:

```sh
npx electron tools/generate-crewlo-icons.cjs
```

## Limits

- Provider authentication, paid/model execution, and live provider permission prompts were not exercised. Their existing code paths remain in place; the task-input flow was tested with isolated fixtures.
- Native dependency installation still requires the missing Windows C++ Spectre libraries for a fully successful clean reinstall. No global toolchain changes were made.
- The large roster fits the whole scene, so figurine labels get smaller; the independently sized scrollable roster and conversation panel remain readable.
- New studio copy is English. Existing translated application controls remain supported.
- Packaged installers, signing, macOS/Linux runtime behavior, and distribution were not tested. Crewlo packaging icons are generated, and upstream publishing/update configuration is disabled.
