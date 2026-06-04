// Build-time Perl syntax highlighting, powered by tree-sitter-perl —
// the very grammar this blog's parsing post is about. The hard cases the post
// brags about (regex-vs-division, heredocs, qw, string interpolation) are
// resolved by the same scanner, here, at build time. No client-side JS.
//
// The wasm + highlight query are vendored from the tree-sitter-perl GitHub
// release (v1.0.3) under /vendor — see eleventy.config.js for the wiring.

import { Parser, Language, Query } from "web-tree-sitter";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = (rel) => fileURLToPath(new URL(rel, import.meta.url));

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// "variable.scalar" -> 'tsp-variable tsp-variable-scalar' (top-level class for
// broad theming + the fully-qualified class for fine overrides). Single-segment
// names like "operator" collapse to just 'tsp-operator'.
const classCache = new Map();
function classFor(name) {
  let cls = classCache.get(name);
  if (cls === undefined) {
    const top = name.split(".")[0];
    const full = name.replace(/\./g, "-");
    cls = full === top ? `tsp-${top}` : `tsp-${top} tsp-${full}`;
    classCache.set(name, cls);
  }
  return cls;
}

export async function createPerlHighlighter() {
  await Parser.init();
  const Perl = await Language.load(here("../vendor/tree-sitter-perl/tree-sitter-perl.wasm"));
  const parser = new Parser();
  parser.setLanguage(Perl);

  // The query uses Neovim's `#lua-match?` for the shebang rule, which
  // web-tree-sitter can't evaluate — strip that one pattern. Every other
  // predicate (`#match?`) is applied automatically by query.captures().
  let scm = readFileSync(here("../vendor/tree-sitter-perl/highlights.scm"), "utf8");
  scm = scm.replace(/\(\(source_file[\s\S]*?#lua-match\?[\s\S]*?\)\)\s*/, "");
  const query = new Query(Perl, scm);

  // Render code -> HTML with <span class="tsp-…"> around captured ranges.
  // Captures overlap (nested interpolation) and collide (two patterns, one
  // node), so we segment on every boundary and, per segment, pick the winning
  // capture: innermost (smallest span) wins; ties break to the later pattern,
  // matching tree-sitter's own highlight precedence.
  function highlight(code) {
    const tree = parser.parse(code);
    const spans = [];
    for (const c of query.captures(tree.rootNode)) {
      const s = c.node.startIndex;
      const e = c.node.endIndex;
      if (e > s) spans.push({ s, e, p: c.patternIndex, cls: classFor(c.name) });
    }

    const points = new Set([0, code.length]);
    for (const sp of spans) {
      points.add(sp.s);
      points.add(sp.e);
    }
    const cuts = [...points].sort((a, b) => a - b);

    let out = "";
    let curCls = null;
    let buf = "";
    const flush = () => {
      if (!buf) return;
      out += curCls ? `<span class="${curCls}">${buf}</span>` : buf;
      buf = "";
    };

    for (let i = 0; i < cuts.length - 1; i++) {
      const a = cuts[i];
      const b = cuts[i + 1];
      if (a >= b) continue;
      let win = null;
      for (const sp of spans) {
        if (sp.s > a || sp.e < b) continue;
        if (
          !win ||
          sp.e - sp.s < win.e - win.s ||
          (sp.e - sp.s === win.e - win.s && sp.p > win.p)
        ) {
          win = sp;
        }
      }
      const cls = win ? win.cls : null;
      const text = escapeHtml(code.slice(a, b));
      if (cls === curCls) {
        buf += text;
      } else {
        flush();
        curCls = cls;
        buf = text;
      }
    }
    flush();
    tree.delete?.();
    return out;
  }

  return {
    // markdown-it `highlight` hook for fenced blocks. Perl-only: anything else
    // returns '' so markdown-it falls back to its default (escaped) rendering.
    fence(code, lang) {
      if (lang !== "perl") return "";
      return `<pre class="tsp-perl"><code class="language-perl">${highlight(code)}</code></pre>`;
    },
    // Highlight an inline fragment -> span HTML (no wrapping element). Tiny
    // fragments can parse to an ERROR in isolation (e.g. a bare `/`); there we
    // fall back to plain escaped text rather than paint a red squiggle.
    inline(code) {
      const tree = parser.parse(code);
      const errored = tree.rootNode.hasError;
      tree.delete?.();
      return errored ? escapeHtml(code) : highlight(code);
    },
    escape: escapeHtml,
  };
}
