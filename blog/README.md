# Crewlo Journal

The personal Crewlo blog is written in English and attributed to Hafid Idrissi.
Its homepage and three opening articles use the site's local typography, voxel
art and colors. Sources are in `src/crewlo/`; the layouts are
`src/_includes/crewlo-base.njk` and `crewlo-post.njk`.

The inherited `src/posts/` articles remain separate, with their original authors
and credits. They are retained at their existing URLs, not presented as Hafid's
work or included in Crewlo's journal cards and sitemap. The legacy layouts and
site data remain for that archive. New Crewlo pages use their own layout with
local assets and no inherited analytics code.

## Build

Use Node.js 22.22 or newer, then run from this directory:

```sh
npm ci
npm run build
```

Commit the source, generated `../docs/blog/` files and `../docs/sitemap.xml`
together. CI checks that a fresh build reproduces the committed output.

## Add an article

Create a Markdown file in `src/crewlo/` with `title`, `description`, `slug`,
`date`, `categoryLabel`, `order`, `figurine`, `nextTitle` and `nextSlug` in its
front matter. Its slug must match the filename. Existing shared defaults give
it the Crewlo post layout, author and collection. Set an explicit publication
date for each new article; the opening set uses September 27, 2026.

Use relative links so the site works beneath GitHub Pages' `/Crewlo/` path.
Link to verification notes for tested behavior, and label illustrated media.
Keep personal experiences and product claims grounded in actual evidence.
