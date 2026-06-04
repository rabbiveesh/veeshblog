import markdownItTufte from "markdown-it-tufte";

export default function (eleventyConfig) {
  // Tufte CSS markup: numbered sidenotes [^id], unnumbered margin notes
  // (^[{-} ...] inline, or [^id]: {-} ...), and figures from solitary images.
  // markdown-it-tufte needs markdown-it ^14, which Eleventy 3.x already ships.
  eleventyConfig.amendLibrary("md", (md) => md.use(markdownItTufte));

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
