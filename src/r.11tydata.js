// Data for src/r.njk — one landing page per entry in src/_data/applications.js.
// Lives in a .11tydata.js rather than front matter so `permalink` can be a
// function: with no applications configured, pagination still hands the
// template one empty page, and returning false keeps it out of _site/.
export default {
  layout: "layouts/base.njk",
  // Unlinked and unindexed — these exist for the résumé, not for search.
  noindex: true,
  eleventyExcludeFromCollections: true,
  pagination: { data: "applications", size: 1, alias: "app" },
  eleventyComputed: {
    permalink: (data) => (data.app ? `/r/${data.app.slug}/` : false),
    // base.njk turns this into the <meta http-equiv="refresh">.
    redirect: (data) => (data.app ? data.app.to || "/" : false),
  },
};
