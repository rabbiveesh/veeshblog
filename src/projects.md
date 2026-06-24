---
layout: layouts/base.njk
title: Projects
description: Open-source systems and language tooling by Veesh Goldman.
---

# Projects

I built a thing.

## perl-lsp

A Perl language server written in Rust (`tower-lsp` + `tree-sitter`):
annotation-free type inference, cross-file resolution, and a plugin system.
Working from a real parse lets it do things that are genuinely hard otherwise —
like context-aware completions that offer *only* array variables when you're in
an array context. `cargo install perl-lsp`, or on
[crates.io](https://crates.io/crates/perl-lsp).

[github.com/tree-sitter-perl/perl-lsp](https://github.com/tree-sitter-perl/perl-lsp)

## endoxa

A belief based memory system for AI agents. Models beliefs as a graph, with edges that can
defeat, support or contradict each other (both monotonically and not). Currently
dogfooding, and enjoying it!

[On github](https://github.com/rabbiveesh/endoxa)

## tree-sitter-perl

Creator and lead maintainer of the Perl grammar used in **Zed, Neovim, Helix,
and Emacs**. I wrote the bulk of the external C scanner — Perl's grammar is
famously context-sensitive, so a hand-written scanner does the heavy lifting.

Available on npm + pypi as tree-sitter-perl, and on crates.io as ts-parser-perl (long
story).

[github.com/tree-sitter-perl/tree-sitter-perl](https://github.com/tree-sitter-perl/tree-sitter-perl)

## composr

A Rust (`rayon` + `tree-sitter`) reimplementation of Composer's slowest step,
autoload generation — parallel enough that it runs in my git hook without my
noticing it's there. A Just Good Enough replacement for frictionless dev.

`cargo install composr` or [on github](https://github.com/rabbiveesh/composr)


## DBIx::Class::SQLA2

A CPAN distribution adding window functions, CTEs, and upserts to the DBIx::Class
ecosystem. Bridges between SQLA2 and DBIx::Class (where politics could not - iykyk).
Helps makes the world's most composable query builder even more composable.
[on github](https://github.com/rabbiveesh/dbic-sqla2)

## Robot Buddy Adventure

A old school zelda-styled math RPG that I'm building with my kids (they're great at QA).
Built in Rust using Macroquad. The learning layer is a work in progress; an immutable store with reducers that dynamically levels the content to what the child is performing on, with a couple of different axes (CRA level, math level, problem solving level).

[github.com/rabbiveesh/robot-game](https://github.com/rabbiveesh/robot-game)
Shipped via WASM build to [Github pages](https://rabbiveesh.github.io/robot-game/index.html)
