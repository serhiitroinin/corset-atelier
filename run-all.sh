#!/bin/bash
cd "$(dirname "$0")"
./gen.sh ivoire "quiet-luxury minimal: ivory, cream and bone silk satin corsets, soft diffused window light, warm plaster walls, calm neutral palette, Parisian atelier feel, The Row / Khaite restraint" &
./gen.sh noir "dark gothic couture: black leather, jet silk and oxblood velvet corsets, dramatic chiaroscuro lighting, deep black background, candlelight glow, baroque shadows, Dilara Findikoglu / McQueen mood" &
./gen.sh regency "regencycore cottage romance: floral jacquard, sage green and buttercream linen stays-style corsets, golden-hour English garden and orchard, wildflowers, soft film grain, painterly, Son de Flor mood" &
./gen.sh blueprint "technical and architectural: pale grey and off-white cotton coutil corsets with visible contrast stitching and steel busk, shot on seamless light grey studio background with hard crisp light, clinical, precise, product-design photography like a Braun catalogue" &
./gen.sh ballet "balletcore: blush pink and powder satin corsets with ribbon lacing, tulle skirts, dance studio with mirrors and barre, soft hazy backlight, dreamy pastel, delicate" &
wait
./gen.sh club "Y2K night-out energy: glossy metallic chrome-silver, hot pink and electric blue vinyl/satin corset tops with low-rise trousers, direct on-camera flash, saturated color gel backgrounds, paparazzi snapshot feel, Gen-Z party editorial" &
./gen.sh bridal "bridal couture: white and pearl duchess satin and lace corset bodices with pearl beading, airy bright sunlit white salon, sheer veils and tulle, luminous high-key photography, romantic and refined" &
./gen.sh heritage "heritage workshop: Victorian-inspired corsets in burgundy brocade, tobacco-brown leather and striped ticking, shot in a traditional wood-paneled tailor workshop with brass tools, spools and paper patterns, warm tungsten light, sepia-leaning tones" &
./gen.sh gazette "bold fashion-magazine: vivid scarlet red corsets against pure white seamless studio backdrop, strong graphic poses, high contrast, sharp studio strobe, only red black and white in frame, 90s Vogue Italia energy" &
./gen.sh sole "Mediterranean daywear: corsets in cobalt blue, terracotta, lemon yellow and striped cotton worn casually with jeans and linen skirts, bright midday sun, whitewashed walls, bougainvillea, sea in the distance, joyful candid smiles, diverse plus-size-inclusive casting" &
wait
echo ALL DONE
