# Changelog

## 0.1.1 — 2026-06-07

### Fixed

- **YAML `time` field**: Values containing a comma (e.g. `10 min prep, 20 min baking`) were incorrectly split into an array, dropping the space after the comma. Only values wrapped in `[...]` are now treated as arrays.
- **Tags in `index.json`**: YAML tags in `[Mealprep]` format were written to the index with the surrounding brackets. `generate-index.mjs` now strips them correctly.
- **Nutrition display**: The `nutrition` YAML frontmatter field is now parsed and displayed in the recipe view below the metadata badges.

## 0.1.0 — 2026-06-06

Initial release.

### Features

**Recipe browsing**
- Folder-based navigation mirroring the `public/recipes/` directory structure
- Hierarchical drill-down with breadcrumb (persists when navigating into a recipe and back)
- Full-text search across recipe names, categories, and tags
- Tag cloud sorted by frequency; collapses to top 3 with expand button

**Recipe view**
- Metadata badges: time, servings, tags, and any custom `>> key: value` fields
- Collapsible ingredient section (shows count when collapsed)
- Portion scaling ×0.5 / ×1 / ×2 / ×3 / ×4 — re-parses the recipe live via WASM
- Step-by-step instructions with inline highlighting: ingredients (red), cookware (blue italic), timers (green)
- Section headings (`== Name ==`) rendered as dividers
- Recipe images: auto-detected by same-filename convention (`Recipe.jpg` next to `Recipe.cook`)

**Parser**
- Uses `@cooklang/cooklang` (official WASM parser, Rust-based)
- Supports standard `>> key: value` metadata
- Supports Obsidian-style `---` frontmatter blocks wrapping `>>` lines
- Supports YAML frontmatter (`---`) for title, tags, etc.

**Infrastructure**
- `scripts/generate-index.mjs` — scans `public/recipes/` recursively, extracts tags from `.cook` files, detects sibling images, writes `index.json`
- PWA manifest + Workbox Service Worker with `NetworkFirst` caching for recipes
- `.htaccess` template for Apache (MIME type + cache headers)
