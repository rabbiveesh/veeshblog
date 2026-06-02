# veeshblog

Homepage + blog for Veesh Goldman. Static, hand-authored Markdown, with
**footnotes rendered in the margins** (Tufte-style sidenotes).

## How it works

```
src/*.{njk,md}   ──┐
src/posts/*.md   ─┼─► eleventy ─► _site/   (static HTML)
src/_includes/   ──┘
```

- **Eleventy** (`@11ty/eleventy`) is the generator — no GUI, just Markdown + a
  thin Nunjucks layer for the shell.
- **[markdown-it-tufte](https://github.com/neillrobson/markdown-it-tufte)** turns
  Markdown footnotes into Tufte sidenotes. **[tufte-css](https://edwardtufte.github.io/tufte-css/)**
  (vendored from `node_modules` to `/css`) does the look.
- Homepage is **blog-forward**: a compact identity header + the reverse-chron post
  feed, so the writing leads but the OSS proof never sits below the fold.

## Authoring

Write a Markdown file in `src/posts/`. Front matter sets the title/date; the
`posts.json` dir-data file applies the post layout automatically.

Sidenotes, straight from Markdown — no components, no shortcodes:

```markdown
A claim that needs backing.[^src]

[^src]: A normal footnote becomes a numbered sidenote in the margin.

An aside with no number ^[{-} like this on-brand joke] reads as a margin note.
```

- **Numbered sidenote:** `[^id]` + `[^id]: text`
- **Unnumbered margin note:** `^[{-} text]` inline, or `[^id]: {-} text`
- **Figure:** a solitary image paragraph `![alt](/path.png "title")`

On narrow screens each note collapses to a tappable marker (CSS only, no JS).

## Build & serve

```bash
./serve     # live-reload dev server at http://localhost:8080
./build     # one-shot build → _site/
```

`_site/` and `node_modules/` are gitignored.
