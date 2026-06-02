---
title: Notes in the margins
subtitle: Why this blog puts its footnotes where you can actually read them
date: 2026-06-02
description: A short note on sidenotes, margin notes, and why footnotes belong beside the text instead of at the bottom of the page.
---

Footnotes have a usability problem: they make you stop, jump to the bottom of
the page, read, and find your place again. Tufte's fix is the **sidenote** — the
same aside, set in the margin, right next to the sentence that earned it.[^why]

[^why]: Footnotes whose definitions appear in the margin instead of at the foot
of the page. You're reading one now.

The version I reach for most is the *margin note* — a sidenote with no reference
number at all. ^[{-} Which is the ideal home for a joke you don't want to commit
to in the body text.] It's perfect for an aside that would break the flow as a
parenthetical but doesn't deserve a numbered citation.

Both come straight from Markdown. A numbered sidenote is just a normal footnote.
An unnumbered margin note is `^[{-} ...]` inline, or a definition that starts
with `{-}`. No components, no shortcodes — I write prose and the asides land in
the margin on their own.

On a narrow screen there's no margin to put them in, so each note collapses to a
tappable marker and expands inline. Same source, no JavaScript, no second copy
to maintain.[^mobile]

[^mobile]: The whole thing is a CSS checkbox toggle — a trick borrowed straight
from Tufte CSS.
