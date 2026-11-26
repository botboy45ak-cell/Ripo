# Cueframe — Cross-Device Short-Form Visual Cue Kit

**Status: product prototype, not approved for sale or launch.**

Cueframe is the working name for an experimental creator visual library. The current prototype combines a static transparent-overlay kit, a separate motion editor, two browser-exported sample videos, and an offline storyboard planner. It is designed for creators working across different subjects and visual styles.

## Explore the prototype site

Start at [`index.html`](index.html), the library hub linking the static PNG/SVG gallery, Motion Studio, MP4 samples, and offline planner. [`samples/index.html`](samples/index.html) plays the two green-key video samples in-browser. The site is a local prototype: no open reuse license is finalized, and downloadable files are for review and testing until rights and terms are approved.

## Product hypothesis

People making tutorials, explainers, product demos, lists, vlogs, and gaming/tech clips often need quick visual structure: a way to mark a step, point to a detail, set up a comparison, or recap an idea. Cueframe tests whether a compact, well-organized overlay library can make that workflow faster without requiring an app-specific preset, plugin, or font.

## Prototype contents

- **16 cue types**: opening frame, chapter/location tag, three-step rail, focus frame, highlight marker, pointer callout, comparison pair, question and answer cards, recap stack, progress dots, rank bars, and end card.
- **Three visual styles**: Clear, Pulse, and Warm, aimed at different kinds of footage and creator aesthetics.
- **Two aspect ratios**: portrait 9:16 (1080×1920) and landscape 16:9 (1920×1080), producing 96 PNG exports in total.
- **Two file formats**: ready-to-import transparent PNGs and optional editable SVG source (96 source files).
- **Offline storyboard planner**: responsive HTML tool for tutorials/explainers, product demos, comparisons, and personal stories. It creates a time-coded plan, lets users edit narration and shot notes, links the matching cue PNGs, and exports plain text or a print-ready page.
- **Device guides**: phone, desktop, and app-agnostic workflows.
- **Offline-first web hub and preview pages**: the hub links the overlay gallery, editor, planner, and video samples; it uses no accounts, external fonts, tracking, or runtime network calls.

The artwork is procedural vector geometry created for this prototype. It contains no stock images, third-party logos, music, or included font files. Text is intentionally not baked into the overlays so users can add their own language in their editor. The preview demonstrates use with sample text; it is not baked into the files.

## Motion Studio prototype

[`motion-studio.html`](motion-studio.html) is the new, offline-first motion editor. It has four starting rhythms, ten editable vector shapes, text layers, ten motion behaviors, easing, per-layer placement and timing, a beat-synced preview, quarter-beat timeline moves/resizing, BPM/tap tempo, optional local guide audio, and portrait/landscape/square/4:5 preview canvases. Projects save and reopen as `.cueframe` JSON files; local footage/audio is only previewed and is never included in project or export files.

Exports are deliberately different: PNG is a transparent still; GIF can use binary transparency or a green-key background; SVG uses SMIL animation and is intended for browsers/vector workflows; browser video recording writes a green-key MP4 or WebM only when the browser supports it. GIF and video contain no audio. **No CapCut Mobile or desktop-editor import compatibility is claimed**; test the exact exported file on the intended app/device. Automated UI/export smoke tests use a mocked canvas; a manual headless Chromium pass has also exercised browser-generated PNG/SVG/GIF/MP4 and project downloads, short-loop recording, responsive widths, and export-lock recovery. This is browser QA only: it does not confirm pixel-level parity, codec/editor import support, or performance on the user's phone.

Build and run the interaction smoke test:

```bash
npm --prefix products/cueframe/tools run build:motion
npm --prefix products/cueframe/tools run test:motion
```

Open `motion-studio.html` from a local static server for preview. The bundle has no runtime network requests.

## What is and is not validated

- The PNGs are generated at the stated pixel dimensions with alpha transparency; the repository validator checks counts, dimensions, catalog references, and ZIP integrity.
- CapCut documents mobile overlays as an image/video layer and desktop overlays as a higher timeline layer. That makes PNG layers a reasonable cross-device format, but **we have not tested these files on the user's phone or on all editors**.
- Public examples show some buyers for video overlays, but evidence is small and not specific enough to validate Cueframe's demand. See [`research/market-check.md`](research/market-check.md).
- No price, checkout provider, seller account, guardian authorization, GST outcome, or tax treatment has been confirmed.
- The Cueframe source lives in `products/cueframe/`; a publish copy of the library pages and assets now lives in `public/`. The previous Tutor Setup pages are preserved at `public/tutor/` and are not linked from the Cueframe homepage. The library has no payment flow and is not connected to the archived tutor form or UPI QR. No public reuse license is finalized.

## Build and test

The raster export script is [`tools/generate_assets.py`](tools/generate_assets.py). It writes original SVGs and uses the local `@resvg/resvg-js` renderer to export PNGs. From the repository root:

```bash
npm ci --prefix products/cueframe/tools
python3 products/cueframe/tools/generate_assets.py
python3 products/cueframe/tools/validate_bundle.py
```

Then open [`index.html`](index.html) locally to browse the tool hub, or go directly to [`preview.html`](preview.html), [`motion-studio.html`](motion-studio.html), [`samples/index.html`](samples/index.html), or [`planner.html`](planner.html). `downloads/cueframe-visual-kit-v0.1-prototype.zip` is a prototype bundle for review and device testing, not a live sales download.

## Before any commercial release

1. Review the concept and artwork; do not publish without deciding the product direction.
2. Test at least one portrait PNG on the user's phone in CapCut Mobile and one wide PNG in a desktop editor. Check positioning, transparency, export quality, and whether the download/unzip flow is workable.
3. Fix any issues, then re-run the package and file-integrity checks.
4. Check the final product name, marketplace rules, seller age/guardian and payout/KYC terms, Indian tax treatment, and all fees through current official sources. A guardian may need to own/manage any seller account; permission has not been confirmed.
5. Choose a legitimate external checkout/delivery route only after those checks. GitHub Pages is not to be used for an e-commerce site. Do not reuse the existing tutor QR.

No sales, earnings, or organic traffic are promised. This is a low-cost product experiment, not a proven business.
