#!/bin/bash
# usage: gen5.sh <logname> <reference image> "<garment facts>" "<numbered image list>"
# Ivoire II imagery generated FROM REFERENCE PHOTOS OF REAL SUPPLIER ITEMS (refs/ is gitignored).
cd "$(dirname "$0")"
codex exec --skip-git-repo-check --sandbox workspace-write "The attached photo is a supplier's reference photo of a REAL steel-boned corset that a shop will actually sell. It shows the same corset twice on a dress form (front view and back view). Garment facts: $3
Use your built-in image generation tool (not a CLI fallback), passing the attached photo as the reference image, to generate the following separate images one at a time, and save them as PNG in assets/img/maison/ with exactly these names (overwrite existing files).
HARD RULE: the corset in every image must be THIS EXACT corset, faithfully reproduced from the reference: same colour, same fabric and sheen, same number and placement of vertical panel seams and bone channels, same top and bottom edge shape, same height on the body, same front busk with the same number of silver loop-and-stud fastenings, same silver eyelets and back lacing, same binding, same side hip-tie lacing if the reference has it. Do not embellish, do not add lace, bows, embroidery, straps, cups or decorative stitching that the reference does not have, do not change the colour. It is a plain, well-made ready-to-wear corset and must look like the product the customer will receive. Ignore and never reproduce the watermark text, the dress form, the skirt or the backdrop of the reference.
Look: premium ready-to-wear brand, quiet luxury (COS / Toteme campaign mood), soft natural daylight, warm neutral palette of ivory, bone, sand, caramel and soft black, calm limestone or plaster interior, real-looking adult women of varied body types and skin tones, natural relaxed poses, corset always worn as outerwear OVER clothing, modest and fully clothed, no text, no logos, no watermark.
$4
After saving all of them, list the files." -i "$2" < /dev/null > "logs/$1.log" 2>&1
echo "done $1"
