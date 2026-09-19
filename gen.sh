#!/bin/bash
# usage: gen.sh <slug> "<style description>"
slug="$1"; style="$2"
mkdir -p "assets/img/$slug"
codex exec --skip-git-repo-check --sandbox workspace-write "Use your built-in image generation tool (not the CLI fallback) to generate FIVE separate images, one at a time, and save them as PNG in assets/img/$slug/ with exactly these names. All are tasteful high-fashion e-commerce/editorial photographs for a women's corset brand; models are adult women, fully and elegantly styled (corset worn as outerwear with skirt or trousers), no text, no logos, no watermarks. Shared art direction for all four: $style
1. hero.png — portrait 3:4, full editorial campaign shot, model three-quarter length wearing the signature overbust corset, lots of atmosphere.
2. p1.png — portrait 3:4, product catalog shot of a different model (different body type and skin tone) wearing an underbust corset over a shirt or dress, clean composition.
3. p2.png — portrait 3:4, product shot of a corset alone on a dress form / mannequin or laid flat, showing the full garment clearly.
4. detail.png — landscape 3:2, macro close-up of corset craftsmanship: back lacing, grommets, boning channels, stitching, fabric texture.
5. p3.png — portrait 3:4, product catalog shot of a third model wearing a different colourway/style of corset from the same collection, styled as an everyday outfit.
After saving all five, list the files." < /dev/null > "logs/$slug.log" 2>&1
echo "done $slug"
