import markdownItTufte from "markdown-it-tufte";
import markdownItAttrs from "markdown-it-attrs";
import { minify } from "terser";
import { createPerlHighlighter } from "./lib/perl-highlight.js";

// Init the tree-sitter-perl highlighter once, before Eleventy reads the config.
// (ESM top-level await — the wasm/query load is async, but the per-block
// highlight call it returns is synchronous, as markdown-it's hook requires.)
const highlightPerl = await createPerlHighlighter();

export default function (eleventyConfig) {
  // Tufte CSS markup: numbered sidenotes [^id], unnumbered margin notes
  // (^[{-} ...] inline, or [^id]: {-} ...), and figures from solitary images.
  // markdown-it-tufte needs markdown-it ^14, which Eleventy 3.x already ships.
  // `highlight` routes ```perl blocks through tree-sitter-perl; other langs
  // fall back to markdown-it's default escaping.
  eleventyConfig.amendLibrary("md", (md) => {
    md.use(markdownItTufte);
    // {.fullwidth} on a solitary image → <figure class="fullwidth"> (spans
    // into the sidenote margin, per tufte.css).
    md.use(markdownItAttrs);
    md.set({ highlight: highlightPerl.fence });

    // Inline code: markdown carries no language, so opt in per page with
    // `perl: true` in front matter — every `inline` span on that page is then
    // highlighted as Perl. Eleventy passes page data as markdown-it's `env`.
    // Escape hatch: a leading `!perl ` marks a span as raw (e.g. shell, prose).
    md.renderer.rules.code_inline = (tokens, idx, _opts, env, slf) => {
      const token = tokens[idx];
      const attrs = slf.renderAttrs(token);
      if (token.content.startsWith("!perl ")) {
        return `<code${attrs}>${highlightPerl.escape(token.content.slice(6))}</code>`;
      }
      if (env && env.perl) {
        return `<code${attrs} class="tsp-perl tsp-inline">${highlightPerl.inline(token.content)}</code>`;
      }
      return `<code${attrs}>${highlightPerl.escape(token.content)}</code>`;
    };
  });

  // Tufte CSS + its et-book fonts, vendored from node_modules → /css.
  eleventyConfig.addPassthroughCopy({
    "node_modules/tufte-css/tufte.css": "css/tufte.css",
    "node_modules/tufte-css/et-book": "css/et-book",
  });
  eleventyConfig.addPassthroughCopy("src/css");

  // Favicon set (SVG sources + generator live in /branding).
  eleventyConfig.addPassthroughCopy("src/favicon.svg");
  eleventyConfig.addPassthroughCopy("src/favicon-32.png");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");
  eleventyConfig.addPassthroughCopy("src/apple-touch-icon.png");

  // Social-share/OG banner (LinkedIn-sourced, reused for link unfurls).
  eleventyConfig.addPassthroughCopy("src/banner.png");

  // Custom-domain marker for GitHub Pages → copied to _site/CNAME on every build.
  eleventyConfig.addPassthroughCopy("src/CNAME");

  // Newest-first post collection. src/drafts/ (a symlink to a private repo,
  // present only locally) is globbed too: drafts mix in under ./serve, but a
  // production build drops them — see src/drafts/drafts.11tydata.js, which sets
  // eleventyExcludeFromCollections + permalink:false when runMode is "build".
  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByGlob("src/{posts,drafts}/**/*.md").reverse()
  );

  // Strip comments from the inline <script> blocks on the way out. The source
  // comments explain *why* the analytics hooks look the way they do — worth
  // keeping in the templates, not worth shipping to every reader. Terser parses
  // the JS properly, so a `//` inside a string or regex survives; a regex
  // stripper wouldn't. Build-only (matching the drafts rule below), so ./serve
  // still shows readable, debuggable JS in devtools.
  eleventyConfig.addTransform("strip-inline-js-comments", async function (content) {
    if (process.env.ELEVENTY_RUN_MODE !== "build") return content;
    if (!(this.page.outputPath || "").endsWith(".html")) return content;

    const blocks = [];
    // Only bodied, plain-JS scripts: `src=` blocks are empty, and a type= that
    // isn't JS (JSON-LD, an import map) isn't terser's to parse.
    content.replace(
      /<script(?![^>]*\bsrc=)(?![^>]*\btype=(?!["']?(?:text\/javascript|module)))([^>]*)>([\s\S]*?)<\/script>/gi,
      (match, attrs, body, offset) => {
        if (body.trim()) blocks.push({ attrs, body, offset, length: match.length });
        return match;
      }
    );
    if (!blocks.length) return content;

    let out = content;
    // Back to front, so earlier offsets stay valid as the string shrinks.
    for (const block of blocks.reverse()) {
      const result = await minify(block.body, { format: { comments: false } });
      const head = out.slice(0, block.offset);
      const tail = out.slice(block.offset + block.length);
      out = head + `<script${block.attrs}>${result.code}</script>` + tail;
    }
    return out;
  });

  // Human-readable date filter (no extra deps — uses the JS Date in front matter).
  eleventyConfig.addFilter("readableDate", (d) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    })
  );
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
