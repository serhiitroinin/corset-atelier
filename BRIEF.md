# Shared brief — Vesna corset house, design directions

You are building ONE of ten competing homepage design directions for "Vesna", a women's corset brand (corset-first, will expand to general womenswear later). A client will compare all ten side by side, so yours must be unmistakably distinct, polished, and feel like a real production storefront by a top design studio — not a template. Commit hard to your direction's aesthetic: typography, layout, motion, ornament. Avoid generic AI-looking design (no purple gradients, no Inter-everything, no cookie-cutter centered hero + 3 cards).

## Deliverable
A single self-contained file: `designs/<slug>/index.html` (inline `<style>` and `<script>`, no frameworks, no build, no external JS). Google Fonts via `<link>` allowed. Must work when served from a sub-path on GitHub Pages, so use RELATIVE paths only.

## Images (generated for you; reference as JPG)
`../../assets/img/<slug>/hero.jpg` (3:4 portrait campaign), `p1.jpg`, `p3.jpg` (3:4 model product shots), `p2.jpg` (3:4 corset on dress form/flat), `detail.jpg` (3:2 macro craft close-up). Use only these five; use object-fit/object-position crops to get variety (e.g. same image cropped differently for a category tile). The PNG originals may already exist at `assets/img/<slug>/*.png` — when you finish drafting, check with `ls`; if present, Read them to view and tune overlay text contrast, crops and object-position. If not yet present, do not wait; design so text never depends on a specific image region (use scrims/solid panels).
Always set width/height or aspect-ratio to avoid layout shift, meaningful alt text, `loading="lazy"` below the fold.

## Required content (order and form are yours to design)
1. Nav: wordmark "Vesna", links (Corsets, Made to Measure, Fit Guide, Journal), cart with count that increments when "Add" is clicked.
2. Hero with a real headline and CTA in the direction's voice.
3. Product grid: 4–6 products with invented names, € prices (in the direction's price band), a spec line (e.g. "24 spiral steel bones · cotton coutil · 4\" reduction"), add-to-bag.
4. Shop by silhouette: Overbust / Underbust / Waspie / Longline (icons may be inline SVG line drawings).
5. WORKING fit finder: inputs for natural waist (cm), underbust (cm), and goal (everyday / shaping / occasion). JS returns a recommended corset size (corset size in inches = waist in inches minus 2–4 depending on goal, rounded down to even number, range 18–40), a suggested silhouette, and the expected lacing gap. Validate input. This is the key conversion feature — design it as a centrepiece, not a plain form.
6. Construction/craft section using detail.jpg: bones, busk, waist tape, layers, hand finishing.
7. Reviews (3) that include reviewer measurements + size bought.
8. Made-to-measure or equivalent CTA, newsletter signup, footer (shipping, returns/exchange promise on fit, care, contact).
9. A small unobtrusive fixed pill link "← All directions" pointing to `../../index.html`, styled to match.

## Quality bar
- Fully responsive (360px → 1600px), mobile nav works.
- One signature interaction/motif specific to your direction (specified below), plus tasteful scroll reveals (IntersectionObserver) and hover states. Respect `prefers-reduced-motion`.
- Accessible: semantic HTML, focus states, contrast ≥ 4.5:1 for body text, labels on inputs.
- Copywriting in the direction's voice, no lorem ipsum. English.
- 400–800 lines is about right. Verify the file has no syntax errors (e.g. open it mentally/lint via `node -e` for the script portion if useful). Do not create any other files. Do not run git commands.

Reply with a 3-line summary of what you built when done.
