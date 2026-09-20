# Crewlo asset origins

All new artwork was authored procedurally for this redesign. No image-generation output, stock images, franchise likenesses, or externally downloaded art is used in the active studio.

The earlier clay refinement added twelve original sculpt recipes to the three initial designs. All fifteen preserve the same lighting and proportions, with distinct hair, facial details, clothing shapes, and accessories. Portraits and scene characters use exactly the same recipe source. Existing saved character IDs are unchanged. These additions use the same MIT license as `clayArt.ts`.

| Asset | Source | License |
| --- | --- | --- |
| Original voxel characters, shared portraits, block furniture, architecture and decoration | `scene/studio/voxelArt.ts`, `voxelWorld.ts`, `VoxelStage.ts` | MIT, original procedural artwork; no Minecraft assets or affiliation |
| Legacy Crewlo clay figurines and portrait variations | `src/renderer/src/scene/studio/clayArt.ts` | MIT, same as project source |
| Studio architecture, furniture, plants, sketch artwork | `src/renderer/src/scene/studio/studioArt.ts` | MIT, same as project source |
| Crewlo C mark | `src/renderer/src/assets/crewlo-mark.svg` | MIT, original vector artwork |
| Desktop packaging icons | `build/crewlo.png`, `.ico`, `.icns`; generated from the C mark by `tools/generate-crewlo-icons.cjs` | MIT, same original artwork |
| Inter, JetBrains Mono, legacy Press Start 2P | Existing bundled fonts | SIL OFL 1.1; original notices retained in `assets/fonts/LICENSE.txt` |
| Legacy office maps and tilesets | Existing upstream assets, retained for compatibility/reference | Separate LimeZu Complete Version license; see `LICENSE-ASSETS` and `assets/ATTRIBUTION.md` |

The new active studio does not import the legacy office map or character rendering system. Compatibility character IDs still address persisted rosters. The original MIT copyright notice in LICENSE has not been changed. Credits for LimeZu and upstream contributors remain in Crewlo’s Settings and README.

Screenshots in this directory were captured from local Electron windows. Populated scenes use explicitly labeled test fixtures, with no provider execution or fabricated live work.
