# Crewlo voxel workplace

This replaces the active clay studio with original procedural voxel artwork, using the existing Pixi.js renderer. No Minecraft assets, logos, characters, textures, or new rendering framework are used. Existing saved character IDs and user names remain unchanged. The design-system skill informed the shared palette, typography and reusable portrait/scene geometry.

## Implementation

- `voxelArt.ts`: square heads, cuboid bodies, articulated limbs, fifteen hairstyle/accessory recipes, matching canvas portraits, consistent three-face lighting, block furniture and decorations. Original recipe colors/IDs are reused from Crewlo's earlier artwork, not its clay geometry.
- `voxelWorld.ts`: connected workshop, coffee/break room, game room and terrace; cutaway walls, open timber door frames, windows and railings. Individual workstations grow with the real roster. Leisure includes coffee, sofas, dining, arcade, console, foosball, terrace seating and an ashtray corner.
- `voxelLife.ts`: pure local cosmetic state, separate from authoritative execution. Cardinal BFS respects furniture/walls/railings; destinations and moving cells are reserved. Occupied/unreachable routes wait and retry. Idle durations and destination choices are staggered. New work releases a leisure reservation immediately and routes home without delaying dispatch. Monitors activate when the working character arrives and types.
- `activityState.ts` resolves the common display state used by the scene, roster and panel from engine status and the message queue. Hook evidence only gates cosmetic leisure; it cannot override engine status with a parallel Working label.
- `voxelEvidence.ts` / `StudioFloor.tsx`: read-only hook/store adapters. Silence does not prove a completed turn. Leisure requires a confirmed Stop/PostInvocation plus idle, connected, no queued work, no hold and no approval. Child SubagentStop is not proof the parent finished. New work invalidates old completion evidence. Unknown/restarted sessions remain neutral until trustworthy events arrive.
- Approval, dependency wait, error, completion and disconnected states are distinct. Approval labels/characters select the existing agent panel. Detailed work labels use real tool/action data; otherwise they say Working. No invented chat, progress, deliverables or results.
- Smoking defaults off, is opt-in per saved agent in Scene preferences, and persists locally per workspace. Disabling it cancels smoking immediately. Reduced motion stops walking, gestures and smoke. Leisure never invokes a provider, prompt, dispatch or token-consuming operation.
- The compact mission composer stays independent of scene zoom. The panel collapses without unmounting terminals/parsers and retains its keyboard/pointer resizer. ResizeObserver reframes the scene, retaining pan/zoom. Fit (or keyboard 0) resets; arrow keys pan, +/− zoom, Shift/middle drag pans.
- Rendering is capped at 30 fps; articulated artwork updates at 10 fps, unchanged furniture/captions are cached, hidden documents stop cosmetic updates. Names remain at 12px in screen space with a light outline; detailed labels appear above the character only on hover or selection. All agents remain in the scrollable keyboard-accessible roster.

## Verification — 20 September 2026

- `npm run typecheck`: passed.
- `npm run build`: passed, with existing Vite mixed static/dynamic import and large-bundle warnings.
- `node --test test/crewlo-voxel.test.cjs`: 9/9 passed. Covers all areas/workstations reachable for rosters through 30, capacity/collision boundaries, staggered reservations, work interruption/return/typing, approval/error/disconnection/queue/restart/reduced-motion exclusions, event-derived labels, fractional rerouting, smoking opt-in/revocation and 30 simultaneous actors.
- Running Electron app inspected at 1920×1080 and 1440×900 in an isolated temporary profile. Six explicitly labeled development agents; no provider process was launched. Verified empty/populated framing, selection of the correct session, panel opening/collapse and keyboard resizing, camera keyboard pan/zoom/Fit, Add Agent's matching fifteen portraits, Settings, mission IPC, existing message queue, local leisure, immediate work interruption, distinct attention/completion states and reduced motion. No page errors.
- Full repository run: 837 reported tests, 817 passed, 12 failed, 8 skipped. Existing baseline issues remain: agent-token-cap Windows path expectation; Arabic terminal source assertion; two CLI-install ladder assertions; Codex remote Unix alias expectation; steer telemetry source assertion; four transcript path expectations. Native quit-sweep and worktree-deps fail at file level in this run, changing aggregate counts from the earlier 839-test baseline (816 passed, 15 failed, 8 skipped). These are not voxel tests; no unrelated engine fixes were attempted. See `voxel-tests.log` and earlier `REFINEMENT.md`.

## Camera and interface refinement

The French controls **Vue d’ensemble** and **Suivre l’agent** switch between a fitted workplace and a close view tracking the selected figurine. Selecting from the canvas or agent dock activates follow; the overview control and Fit reset the frame. Pan and zoom remain available in both modes.

The panel starts at 30% of the window, remains resizable, and remembers explicit resizing. Double-clicking the divider resets to 30%. The bottom dock is 76px tall and contains only portrait, name and status. Working directory, renaming, personal notes, context usage and coordinator voice controls remain available in the panel's **Détails de l’agent** disclosure.

Workshop flooring uses warm wood grain, the game room deep blue, the café terracotta and the terrace green decking with seven additional plants. Figurines are enlarged 18%. The existing path tests verify that the extra planters leave all destinations reachable.

Verification: typecheck and production build pass; all 12 status/navigation tests pass. Electron captures cover 1920×1080 and 1440×900. The capture harness checks automatic follow on selection, overview switching, correct selection from the compact dock, 30% panel sizing, details access, resizing, mission/queue handling and reduced motion.

## Captures

- Before: [earlier clay studio](refinement-before-studio.png).
- After: [1920×1080](voxel-workplace-1920.png), [1440×900](voxel-workplace-1440.png), [agent panel](voxel-panel-1440.png), [Add Agent](voxel-add-agent.png), [Settings](voxel-settings.png), [empty workspace](voxel-empty.png).
- States: [cosmetic leisure](voxel-leisure.png), [return to work](voxel-return-to-work.png), [approval/error/dependency/completion](voxel-attention.png), [reduced motion](voxel-reduced-motion.png).
- [Short canvas animation recording](voxel-animation.webm): development fixtures only, showing local leisure, a tool event interrupting leisure, and attention states. It does not represent live agent execution.

## Launch and reproduce

From `C:\Users\idris\Documents\crewlo`:

```powershell
npm run dev
```

Production preview and checks:

```powershell
npm run typecheck
node --test test/crewlo-voxel.test.cjs
npm run build
npm run preview
```

To reproduce isolated captures after building, start `npx vite --config tools/crewlo-preview.config.ts`, then run `node tools/crewlo-voxel-capture.cjs` in another terminal. Set `CREWLO_PLAYWRIGHT` to an installed Playwright module directory if it is not available locally. The harness intercepts fixture dispatch, uses a temporary profile and never seeds production agents.

## Limits

Live provider execution, credential-dependent authentication/approvals and microphone/file-picker workflows were not exercised in this pass. Existing integrations and gates were preserved. Providers without reliable end-of-turn hooks intentionally do not animate leisure. Congested destinations wait rather than teleport; large rosters expand the world and consequently reduce default scene scale. The 30-agent scheduler was tested, but GPU profiling on low-end hardware was not performed. Smoking opt-in/revocation is unit-tested; the recorded demonstration uses default non-smoking agents. New scene copy is English. Native packaging/signing, publishing and deployment were not run.

Original procedural voxel art is MIT licensed with the project. Upstream notices and separately licensed legacy asset attribution remain intact; see [asset origins](ASSETS.md).
