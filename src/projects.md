---
layout: layouts/base.njk
title: Projects
description: Open-source systems and language tooling by Veesh Goldman.
---

# Projects

The most legible proof is the code. Everything here is open source.

## perl-tree-sitter-lsp

A Perl language server written in Rust (`tower-lsp` + `tree-sitter`):
annotation-free type inference, cross-file resolution, and a plugin system.
Working from a real parse lets it do things that are genuinely hard otherwise —
like context-aware completions that offer *only* array variables when you're in
an array context. `cargo install perl-lsp`, or on
[crates.io](https://crates.io/crates/perl-lsp).

[github.com/tree-sitter-perl/perl-tree-sitter-lsp](https://github.com/tree-sitter-perl/perl-tree-sitter-lsp)

## tree-sitter-perl

Creator and lead maintainer of the Perl grammar used in **Zed, Neovim, Helix,
and Emacs**. I wrote the bulk of the external C scanner — Perl's grammar is
famously context-sensitive, so a hand-written scanner does the heavy lifting.

Available on npm + pypi as tree-sitter-perl, and on crates.io as ts-parser-perl

[github.com/tree-sitter-perl/tree-sitter-perl](https://github.com/tree-sitter-perl/tree-sitter-perl)

## composr

A Rust (`rayon` + `tree-sitter`) reimplementation of Composer's slowest step,
autoload generation — parallel enough that it runs in my git hook without my
noticing it's there. A Just Good Enough replacement for frictionless dev.

## DBIx::Class::SQLA2

A CPAN distribution adding window functions, CTEs, and upserts to the DBIx::Class
ecosystem. Bridges between SQLA2 and DBIx::Class (where politics could not - iykyk).
[on github](https://github.com/rabbiveesh/dbic-sqla2)
