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
~47k lines of Rust, written by hand. On
[crates.io](https://crates.io/crates/perl-tree-sitter-lsp).

[github.com/tree-sitter-perl/perl-tree-sitter-lsp](https://github.com/tree-sitter-perl/perl-tree-sitter-lsp)

## tree-sitter-perl

Creator and lead maintainer of the Perl grammar used in **Zed, Neovim, Helix,
and Emacs**. I wrote the bulk of the external C scanner — Perl's grammar is
famously context-sensitive, so a hand-written scanner does the heavy lifting.

[github.com/tree-sitter-perl/tree-sitter-perl](https://github.com/tree-sitter-perl/tree-sitter-perl)

## composr

A Rust (`rayon` + `tree-sitter`) reimplementation of the slow path of a
dependency resolver — the kind of thing that's only worth doing once you've
found the right primitive to parallelize over.

## DBIx::Class::SQLA2

A CPAN distribution adding window functions, CTEs, and upserts to the DBIx::Class
ecosystem. [metacpan.org/author/VEESH](https://metacpan.org/author/VEESH)
