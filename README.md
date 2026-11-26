# Cueframe Creator Library — website prototype

The repository's current static-site source is `public/`. Its homepage is a review build for Cueframe, a creator visual library that connects a transparent PNG/SVG gallery, experimental Motion Studio, two sample video loops, and an offline storyboard planner. Cueframe is still a prototype: public reuse terms and licensing are not finalized, and this is not an approved commercial launch.

## Current site

- `public/index.html` — Cueframe library hub.
- `public/preview.html` — searchable gallery of 16 cue designs, three styles, and portrait/wide ratios (96 PNGs and 96 SVGs).
- `public/motion-studio.html` — browser-based layered motion editor; the bundle is `public/motion-studio.bundle.js`.
- `public/planner.html` — local storyboard planner.
- `public/samples/index.html` — two green-key MP4 examples. They have no audio; photos and sound effects are not included.
- `public/downloads/` — static v0.1 review ZIP, separate from Motion Studio and not an open-license pack.
- `products/cueframe/` — editable product source, tooling, research, and prototype documentation.
- `public/tutor/` — preserved legacy Tutor Setup pages, no longer the homepage and marked as an archive.

The Cueframe artwork is procedural vector geometry created for this prototype. Do not claim that its files are openly licensed or universally reusable. `products/cueframe/docs/LICENSE-DRAFT.txt` is a draft, not an approved license. Real-phone use and import/playback in a target editor remain unverified.

## Preview and validate locally

From the repository root:

```sh
python3 -m http.server 8000 --bind 0.0.0.0 --directory public
npm ci --prefix products/cueframe/tools
npm --prefix products/cueframe/tools run build:motion
npm --prefix products/cueframe/tools run test:motion
python3 products/cueframe/tools/validate_bundle.py
```

Open the server root for the Cueframe hub. The static pages use relative links and have been checked at widths from 320 to 1440 pixels. Automated tests and headless-browser checks do not establish real-phone or target-editor compatibility.

## Hosting status

`netlify.toml` still names `public/` as its publish directory. The GitHub Pages API returned 404 during this task, so a live GitHub Pages configuration or deployment has **not** been confirmed. Changes on this branch do not by themselves establish that a public site has been published. Confirm the intended hosting setup and domain before announcing a live URL.

## Archived Tutor Setup pilot

The former Tutor Setup site has been moved, with its relative asset layout, under `public/tutor/`. Its pages retain the original service offer, Netlify form markup, FamApp QR, and fictional-data demo; they are not linked from the Cueframe navigation. The pages are marked `noindex` and have an archive notice. The archive is preserved for reference, not a Cueframe checkout or sales path. Do not reuse its QR for Cueframe.

The original Tutor Setup notes describe an unvalidated ₹999 one-time pilot, no guaranteed results, manually checked UPI payments, and a Netlify form that needs deployment/dashboard setup for submissions and notifications. They also caution against using GitHub Pages for that commercial service page. Keep that legacy flow separate from the Cueframe prototype and verify current host terms before deploying it.

The `offer/` directory contains the original Tutor Setup research and planning files; it has not been replaced by the Cueframe website.
