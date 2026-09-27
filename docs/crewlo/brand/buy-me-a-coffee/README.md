# Buy Me a Coffee brand assets

The button and cup artwork come from the `bmcbrand` kit supplied by the project
maintainer. `button.svg`, `logo.svg` and `button.png` are unchanged copies.
These are third-party brand assets, separate from Crewlo's original MIT artwork.
Their presence does not imply sponsorship or endorsement of Crewlo.

The yellow button is shared by the website, README and app. Windows setup uses
`build/buy-me-a-coffee.bmp`, a resized bitmap of the supplied yellow PNG because
NSIS requires a bitmap. Regenerate it with FFmpeg:

```sh
ffmpeg -i docs/crewlo/brand/buy-me-a-coffee/button.png -vf scale=492:138:flags=lanczos -pix_fmt bgr24 -y build/buy-me-a-coffee.bmp
```

The destination is read from `docs/crewlo-links.json`. The app and website keep
the branded button disabled until a valid maintainer profile is configured.
Windows packaging regenerates `build/crewlo-support.nsh` from that same file.
No payment credentials, checkout embeds or automatic donation prompts are used.
