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

## Analytics & résumé links

[GoatCounter](https://veesh.goatcounter.com) counts pageviews — one async script
in `base.njk`, cookieless (so no consent banner), and skipped automatically on
localhost. Outbound clicks are also counted, as events named `out:<host><path>`.

Because bots don't run JS, an ATS scanner or a LinkedIn unfurl fetching a URL
doesn't show up as a visit. That's the point of doing this client-side.

**Per-application links.** Add an entry to `src/_data/applications.js`:

```js
export default [
  { slug: "acme", company: "Acme", role: "Staff Engineer" },
];
```

That builds `/r/acme/` — a `noindex` page that greets the reader by name and
meta-refreshes to the homepage (or to `to:`, if set) after two seconds. Put
`https://veesh.me/r/acme` on Acme's copy of the résumé, and a hit on that path
means that specific application got opened. A second hit days later usually
means it got forwarded.

The delay is deliberate: an instant refresh can cancel the analytics beacon
before it fires, and the beacon is the whole reason the page exists.

A slug that never made it into the data file isn't lost: GitHub Pages serves
`src/404.njk` for unmatched paths with the URL intact and JS running, so it
still logs the hit and still bounces — just without the greeting.

A path beats `?utm_source=résumé` here — PDF readers and ATS parsers drop or
mangle query strings, and paths survive copy-paste.

## Build & serve

```bash
./serve     # live-reload dev server at http://localhost:8080
./build     # one-shot build → _site/
```

`_site/` and `node_modules/` are gitignored.
