# Crewlo refinement — 2026-09-20

Implemented on the existing `feat/crewlo-visual-identity` branch, preserving the prior uncommitted redesign. No AGENTS.md was found in the repository or checked ancestor directories. Nothing was pushed, published, or deployed. The user's running agent was not used for test messages or restarted.

## Changes

- Shared 14px controls, 13px secondary labels, cream surfaces, rounded buttons/inputs/badges and consistent focus rings. The design-system skill guided the shared patterns documented in DESIGN.md.
- Smaller studio heading, tighter responsive framing based on artwork bounds, scale-compensated captions, and Fit / zoom / Shift-drag or middle-drag pan. A ResizeObserver refits when the available panel space changes. Larger rosters get four-seat overflow benches.
- Fifteen distinct procedural character recipes: hair silhouettes, facial details, clothing shapes and accessories. Portraits and figures share the drawing source. Existing IDs and saved names remain unchanged.
- Agent name, role and real status header. Primary Conversation / Tasks / Terminal navigation; all prior tools remain in More tools or Session controls. Thread replies retains the original sender-specific reply workflow.
- Conversation uses structured hive inbox messages. It is explicitly **not** a reconstructed provider chat. Terminal remains the default and the authoritative provider transcript. One selected-agent queue composer appears on either primary view, with clear delivery semantics. Attachment, voice, hold, interruption and approval code paths remain intact.
- Add Agent retains all four setup steps. Larger five-column character grid, keyboard focus containment/restoration, required-field errors, custom-name preservation, advanced import disclosure and a sticky Create agent action.
- New agents default to Sage; the coordinator remains Rowan. Existing persisted names are not migrated. New artwork remains original MIT source; upstream licenses and attribution are retained.

## Verified

The Electron harness launches a separate temporary user-data profile and a separate renderer on port 5175. Populated screenshots are labeled test fixtures. Hive send/task patch/inbox data are intercepted only in that process. No model work is claimed.

- Actual 1440×900 and 1280×800 renderer viewports: studio, Conversation, Add Agent, and terminal screenshots inspected.
- Empty, three-agent, fourteen-agent and stacked 760px layouts; reduced-motion rendering.
- Pixi pointer selection and keyboard selection choose the expected agent.
- Structured inbox contents, all coordinator tool-menu entries, worker terminal access and Session controls disclosure.
- Queue submission uses the existing store action; Enter clears the submitted draft; a new draft persists across Conversation/Terminal switches.
- Mission send and failure-draft retention, task results, existing human-input response/patch route, settings and disabled upstream updater.
- Add Agent character selection, retained custom name, all setup sections, advanced import visibility, required-folder validation, Tab containment and Escape.
- A real local `cmd.exe` PTY displays `CREWLO_TERMINAL_OK` in xterm. Only the test PTY is killed afterward. Provider credentials are not needed for this check.

## Automated checks

- `npm run typecheck`: passed (main + renderer).
- `npm run build`: passed; existing large-bundle and mixed static/dynamic import warnings remain.
- `npm run test:focused`: 839 tests; **816 passed, 15 failed, 8 skipped**.
- Refinement baseline: 836 tests; 810 passed, 18 failed, 8 skipped, including an intermittent native quit-sweep failure. All 15 remaining failures were present in this baseline.
- Added three focused tests for camera bounds, retained zoom/pan, caption scaling and stable/distinct character recipes. Updated the existing identity source-contract test to check the new saved-name/role header rather than the removed “runs the floor” call site.
- `git diff --check`: passed.

Remaining baseline failures: agent-token-cap Windows path expectation; Arabic terminal rebuild source assertion; two CLI install ladder assertions; Codex remote Unix alias expectation; steer telemetry source assertion; four transcript path expectations; five worktree dependency path/symlink expectations. The existing import-cap and composer telemetry source assertions now pass; no engine behavior was rewritten to address them.

## Screenshots

| Surface | Before | After |
| --- | --- | --- |
| Studio | [Supplied screenshot](refinement-before-studio.png) | [1440×900](refinement-studio-1440.png), [1280×800](refinement-studio-1280.png) |
| Add Agent | [Supplied screenshot](refinement-before-add-agent.png) | [1440×900](refinement-add-agent-1440.png), [1280×800](refinement-add-agent-1280.png) |
| Conversation | — | [Structured inbox](refinement-conversation-1440.png) |
| Terminal | — | [1440×900](refinement-after-terminal.png), [1280×800](refinement-terminal-1280.png) |
| Other states | — | [Empty](refinement-after-empty.png), [14 agents](refinement-after-many.png), [760px](refinement-after-small.png), [Approvals](refinement-after-attention.png) |

## Run

From `C:\Users\idris\documents\crewlo`:

```powershell
npm run dev
```

Or run a production build locally:

```powershell
npm run build
npm run preview
```

To reproduce isolated visual verification, first build, then run the renderer in a separate terminal:

```powershell
npx vite --config tools/crewlo-preview.config.ts
```

With Playwright available (`CREWLO_PLAYWRIGHT` may point to an existing Playwright module directory):

```powershell
node tools/crewlo-refinement-capture.cjs
```

## Limits

Live provider execution/authentication, provider-specific approval prompts, microphone transcription and native file-picking were not exercised. Existing engine integrations are preserved, not reimplemented. New presentation copy is English; full localization is deferred. Very large rosters necessarily reduce scene scale; the scrollable agent cards and panels retain independent readable sizing. Existing clean-install Windows native-build prerequisites (missing Visual Studio Spectre libraries) and the Node engine warning are documented in VERIFICATION.md. No installer, signing or release workflow was run.
