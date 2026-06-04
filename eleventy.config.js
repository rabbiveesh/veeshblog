import markdownItTufte from "markdown-it-tufte";
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

  // Newest-first post collection.
  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByGlob("src/posts/**/*.md").reverse()
  );

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
