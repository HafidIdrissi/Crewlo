# Crewlo design system

Crewlo is a living voxel workplace: warm block-built architecture, pale wood, square-headed articulated figures, and readable working tools. The voxel implementation supersedes the clay presentation described in the historical sections below. See [current architecture and verification](docs/crewlo/VOXEL.md). This document supersedes the upstream pixel-office design direction for Crewlo’s active presentation.

## Materials and tokens

Canonical compatibility tokens remain in `src/renderer/src/design/tokens.css` and `tokens.ts`. Crewlo layout and component rules live in `crewlo.css`. Existing `cth` names are retained so the engine’s consumers and stored preferences keep working.

| Material | Value |
| --- | --- |
| Cream | #F7F3EB |
| Paper | #FFFCF6 |
| Ink | #303B34 |
| Secondary ink | #50594F |
| Terracotta control | #A65D43 |
| Sage | #809779 |
| Blue | #7897AA |
| Wood | #EACFAA |

Inter serves controls and text. JetBrains Mono remains the terminal face. The compact voxel studio headline uses Inter. Controls, inputs, and labels do not scale with scene zoom. Existing dark-mode tokens remain supported.

## Original figurines

`scene/studio/clayArt.ts` defines the shared 120 × 160 unit sculpt. Heads have a 29-unit radius, bodies are 55 × 48 units, and limbs have rounded ends. Gradients model upper-left light; contact shadows anchor the feet.

Three base recipes: Rowan (curls, terracotta overshirt, pocket pencil), Sage (bun, sage clothing, linen scarf), Ellis (swept hair, blue top, round glasses). Further recipes vary clothing and accessories consistently. Scene figures and card portraits derive from the same drawing function. No franchise characters or downloaded character images are used.

The refinement expands the original sculpt to fifteen distinct hair/accessory combinations: bob/apron, cap/headphones, puffs/collar, short hair/beard, long hair/freckles, silver bob/glasses, topknot/vest, braids/earrings, beanie/scarf, shaved head/headphones, silver sweep/beard, and waves/apron. These are procedural MIT artwork, not recolored duplicate portraits.

## Shared interface patterns

The design-system refinement uses `--crewlo-text` (14px), `--crewlo-label` (13px secondary copy), cream surfaces, ink foregrounds, 9px controls, and soft 14–16px panels. Buttons share 32/38/44px sizes, visible keyboard focus, disabled states, and rounded status badges. Terminals default to 14px for new profiles; saved terminal sizing is respected.

`StudioPanelNav` provides Conversation / Tasks / Terminal. The native secondary selector exposes all existing tools; Thread replies preserves the original threaded reply workflow. Conversation reads structured hive messages, not a parsed terminal transcript. The original queue composer appears once in Conversation or Terminal; its engine delivery logic is unchanged. Session controls remain available in an explicit disclosure.

Add Agent retains Identity / Workspace / Engine / Briefing. Character choices expose `aria-pressed`, steps expose `aria-current`, and the modal traps and restores keyboard focus. Import options live in a native Advanced disclosure; validation switches to the invalid section. The sticky Create agent footer remains reachable in the scrolling dialog.

`studioFrame.ts` frames artwork bounds rather than transparent texture padding. ResizeObserver recalculates framing without resetting user zoom/pan; Fit resets both. Shift-drag or middle-button drag pans the scene. Captions compensate for normal scene scale, with a cap on dense rosters to prevent overlap; full names remain in the independently sized roster. Overflow seating uses four seats per row.

Legacy character IDs remain stable for saved rosters and imported hires. Their display names and artwork change; user-assigned agent names remain intact. A newly created coordinator defaults to Rowan.

## Studio and interaction

`studioArt.ts` draws an original three-quarter room: shared worktables, sketch board, development monitors, central meeting table, shelving, lamps, and plants. These are visual zones, not an orchestration model.

Pixi.js displays the procedural textures and hit targets. Agent selection calls the existing store selection action. The existing side panel remains the owner of terminals, messages, controls, settings, and approvals. A keyboard roster parallels every figurine; a persistent scrollable roster represents all agents.

Mission entry calls the existing human-to-coordinator hive request. Only a successful response clears the draft. Task-result links come from the task ledger. Empty workspaces never seed agents or run synthetic activity.

## State semantics

- Working/thinking: focused face and subtle hand movement.
- Waiting: neutral pose; never raised as a human request solely because another agent is pending.
- Blocked/input needed or circuit breaker: raised hand, exclamation, explicit label.
- Finished: check mark only on the engine’s success status. Available completed task records link to the existing task detail.
- Idle, held, disconnected, compacting, or unknown: descriptive neutral states, no fabricated speech or progress.

Reduced-motion preferences stop all figurine movement and CSS animation. Extra agents expand shared benches. Narrow windows stack panels and bring a selected conversation into view.
