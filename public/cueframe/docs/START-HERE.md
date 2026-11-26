# Cueframe prototype — start here

**Version:** 0.1 prototype<br>
**For:** short-form video creators using phone or desktop editors<br>
**Status:** sample for review and device testing; not a commercial release

Cueframe is an experimental creator toolkit with a static overlay pack, a separate motion editor, two sample MP4 loops, and an offline storyboard planner. Choose an aspect ratio and visual style, then preview a cue in the gallery. The v0.1 PNGs intentionally avoid baked-in language. Reuse terms and public licensing are not finalized; this prototype is for review and testing, not a public-use license.

## Included

- `assets/png/vertical/` — portrait 9:16 PNGs, 1080×1920 pixels.
- `assets/png/wide/` — landscape 16:9 PNGs, 1920×1080 pixels.
- `assets/svg/` — optional editable vector source. The PNG files are the easiest format to use in an editor.
- `index.html` — the Cueframe hub linking the static asset gallery, Motion Studio, sample videos, and planner.
- `preview.html` — the responsive PNG/SVG gallery with search, style/ratio filters, and download links.
- `samples/index.html` — two browser-playable green-key MP4 demos; no footage or audio is included.
- `planner.html` — an offline, responsive storyboard builder with downloadable time-coded plans.
- `motion-studio.html` and `motion-studio.bundle.js` — the separate offline-first layered motion editor. Build the bundle first when working from source.
- `catalog.json` — file names, dimensions, and intended uses.
- `docs/` — phone, desktop, motion, and prototype guidance, including the unapproved license draft.

## Try the motion editor

Run `npm --prefix products/cueframe/tools run build:motion` from the repository root, then serve the `products/cueframe/` folder with any local static web server and open `motion-studio.html`. Start from a rhythm card, select a layer, adjust the inspector, drag it on the canvas, and drag its timeline bar (or end handle) to change its start beat or length. Layer timing snaps by quarter-beats. Tap the track background to scrub and use Play to preview the loop.

Save a `.cueframe` project to continue later. PNG exports a still at the playhead. GIF exports a loop with binary transparency or a green-key background. SVG is animated with browser/vector-oriented SMIL and may not be accepted by video editors. Video is recorded by the current browser as a green-key MP4 or WebM when available; file format and import support vary. Exports do not contain guide audio or your local preview footage. Nothing is uploaded by the editor.

For phone editing, use a modern browser and start with Medium GIF. Keep the tab open until rendering completes. The editor and CSS layout have an automated DOM smoke test, but there has not yet been a real phone, CapCut Mobile, or desktop-editor export/import test. Do not rely on any format until it is tested in the intended app and device.

## Try the offline planner

Open `planner.html` in a browser and choose a format, target length, visual style, and frame shape. Select **Load a filled example** to see one of four completed sample plans (a school-bag check, a timer-based reading demo, a paper-vs-phone-note comparison, or a desk reset story). Edit the narration and shot notes, then download the plan as text or use the print dialog. The planner makes no network requests; it does not generate a finished video or verify facts for you.

## Pick an aspect ratio

Use the portrait files for a vertical 9:16 project. Use the wide files for a horizontal 16:9 project. The dimensions are exact canvas sizes; the asset artwork is placed within a transparent canvas so you can position and time it like a normal image layer.

## Pick a visual style

- **Clear** — calm cool accents for tutorials, explainers, lessons, and demos.
- **Pulse** — energetic accents for gaming, tech, reaction, and fast-cut edits.
- **Warm** — warm accents for lifestyle, food, travel, and personal stories.

These are starting points, not rigid rules. Try each one over a short copy of your footage and keep whichever is easiest to read.

## Before using

This is a prototype. Check the attached draft license and test the files in your own editor and device before relying on them. The guide buttons can move between app releases. PNGs should be composited as ordinary image layers; no blend mode or plugin is required. Exact rendering and project performance depend on the editor and device.

The product name is a working title and has not had a trademark search. The files are original vector artwork for this prototype; do not describe the product as affiliated with CapCut or any other editor.
