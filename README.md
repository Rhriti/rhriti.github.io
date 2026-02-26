# rhriti.github.io

Personal site. Blog and projects are built from Markdown.

## Workflow

1. **Blog:** Add or edit `.md` files in `blogs/`. Run `node build.js` to refresh `blogs/manifest.json` (list of posts, newest first).
2. **Projects:** Add or edit `.md` files in `projects/` with YAML front matter, then run `node build.js` to regenerate `projects/projects.json`.

### Project front matter

```yaml
---
title: Project Name
link: https://...
embed: https://www.youtube.com/embed/...   # optional
image: images/photo.png                   # optional
order: 1                                  # optional, for display order
---

Markdown body here.
```

## Build

```bash
node build.js
```

Then commit and push; GitHub Pages serves the site.
