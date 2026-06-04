#!/usr/bin/env bash
# Refresh the vendored tree-sitter-perl grammar used for build-time Perl syntax
# highlighting: the compiled wasm + its highlight query, pulled from a GitHub
# release. Records the tag in RELEASE_TAG so we know what's vendored.
#
# Usage:
#   npm run vendor:perl-grammar            # latest release
#   bash scripts/vendor-perl-grammar.sh v1.0.4   # pin a specific tag
#
# Shared by the daily .github/workflows/refresh-grammar.yml run. Needs `gh`
# (authenticated) and `curl`.
set -euo pipefail

REPO=tree-sitter-perl/tree-sitter-perl
DEST=vendor/tree-sitter-perl

TAG="${1:-$(gh release view --repo "$REPO" --json tagName -q .tagName)}"
echo "Vendoring tree-sitter-perl $TAG -> $DEST"

mkdir -p "$DEST"
gh release download "$TAG" --repo "$REPO" -p 'tree-sitter-perl.wasm' -D "$DEST" --clobber
curl -fsSL "https://raw.githubusercontent.com/$REPO/$TAG/queries/highlights.scm" \
  -o "$DEST/highlights.scm"
printf '%s\n' "$TAG" > "$DEST/RELEASE_TAG"

echo "Vendored $TAG. Rebuild with: npx @11ty/eleventy"
