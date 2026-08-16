// Per-application résumé links. Each entry builds a page at /r/<slug>/ that
// greets the reader for ~2s and then bounces to `to` (default: the homepage).
//
// Why a distinct path per application instead of ?utm_source=resume: PDF
// readers and ATS parsers mangle or drop query strings, and a path survives
// copy-paste. It also answers the question that actually matters — *which*
// application got opened, not just "someone came from a résumé". A second hit
// days later usually means the résumé got forwarded to a hiring manager.
//
// Add an entry, rebuild, put https://veesh.me/r/<slug> on that company's copy.
// Old entries are cheap to leave in place; the pages are noindex and unlinked.
// A slug that isn't listed here still logs and still bounces — src/404.njk
// catches it — it just can't greet by name.
//
//   {
//     slug: "acme",              // → https://veesh.me/r/acme
//     company: "Acme",           // shown in the greeting; omit for a bare "Hi"
//     role: "Staff Engineer",    // optional, appended to the greeting
//     to: "/projects/",          // optional redirect target (default: "/")
//   },

export default [];
