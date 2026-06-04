#!/usr/bin/env bash
# Regenerate all branding raster assets from the SVG sources in this dir.
# Favicon files are emitted into ../src so Eleventy passthrough copies them to
# the site root. Banner + avatar stay here (uploaded manually to LinkedIn/GitHub).
#   deps: rsvg-convert (librsvg), convert (ImageMagick), JetBrains Mono font
set -euo pipefail
cd "$(dirname "$0")"
SRC=../src

echo "favicon PNGs + apple-touch -> $SRC"
rsvg-convert -w 32  -h 32  favicon.svg -o "$SRC/favicon-32.png"
rsvg-convert -w 180 -h 180 favicon.svg -o "$SRC/apple-touch-icon.png"
rsvg-convert -w 16  -h 16  favicon.svg -o /tmp/fav16.png
rsvg-convert -w 48  -h 48  favicon.svg -o /tmp/fav48.png
convert /tmp/fav16.png "$SRC/favicon-32.png" /tmp/fav48.png "$SRC/favicon.ico"
cp favicon.svg "$SRC/favicon.svg"

echo "banner.png (1584x396) + avatar.png (512)"
rsvg-convert -w 1584 -h 396 banner.svg -o banner.png
rsvg-convert -w 512  -h 512 avatar.svg -o avatar.png

echo "done."
