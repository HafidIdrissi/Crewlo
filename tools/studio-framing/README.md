# Studio close-up exports

This development-only fixture imports the actual `VoxelStage` renderer. It never
loads Electron's preload, starts an agent, authenticates a provider or sends a
message. Remy and Ellis are scripted presentation data; their visible states are
not evidence of a real mission. Keep that disclosure beside exported images.

From the repository root, with the existing dependencies installed:

```sh
npx vite --config tools/studio-framing/vite.config.ts
```

Open these URLs and use **Download native PNG (scripted studio data)**:

| URL path | Export | Size |
| --- | --- | --- |
| `/tools/studio-framing/` | `studio-team-hd.png` | 1920 × 900 |
| `/tools/studio-framing/?view=follow` | `studio-follow-hd.png` | 1280 × 960 |
| `/tools/studio-framing/?view=follow&size=mobile` | `studio-mobile-hd.png` | 720 × 520 |

The renderer works at a logical viewport and exports at 2× resolution. The PNG
download comes directly from its canvas, before any screenshot compression. It
does not depend on browser screenshot size. Inter is loaded from the repository.
The mobile view has its own camera framing so its status label remains readable.

Save exports in `docs/crewlo/demo/`. Lossless WebP companions can be created with
an existing image encoder; do not resize or apply lossy compression to the text.
The checked-in WebP files were verified pixel-identical to their PNG sources.

The website's mission and response close-ups are responsive HTML illustrations,
not screenshots of a live desktop run. Their request and response quote the
checked-in Telegram transcript. The activity view is independently scripted;
it is not a synchronized recording of that exchange. No completed coding task
or approval outcome is represented.
