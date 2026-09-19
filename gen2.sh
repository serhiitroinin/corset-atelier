#!/bin/bash
# usage: gen2.sh <logname> "<numbered image list>"
cd "$(dirname "$0")"
codex exec --skip-git-repo-check --sandbox workspace-write "Use your built-in image generation tool (not the CLI fallback) to generate the following separate images, one at a time, and save them as PNG in assets/img/cathedral/ with exactly these names. All are tasteful high-fashion editorial photographs for a gothic-couture women's corset house; models are adult women of varied ethnicity and body type, fully and elegantly styled (corset worn as outerwear with blouse, gown, skirt or trousers), no text, no logos, no watermarks. Shared art direction: gothic cathedral / cloister / sacristy interiors, dramatic chiaroscuro, candlelight, and shafts of COLOURED light from stained-glass windows (ruby, sapphire, emerald, amber, violet) falling across stone; rich jewel tones rather than all-black; painterly, Dilara Findikoglu / Alexander McQueen / Pre-Raphaelite mood.
$2
After saving all of them, list the files." < /dev/null > "logs/$1.log" 2>&1
echo "done $1"
