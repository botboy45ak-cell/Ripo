# Cueframe Motion Studio — prototype guide

Motion Studio is a local browser editor for building short looping overlays. It is a prototype, not an app-store app or a validated commercial download. It makes no runtime network requests and does not upload project data.

## Open it

From the repository root:

```bash
npm ci --prefix products/cueframe/tools
npm --prefix products/cueframe/tools run build:motion
npm --prefix products/cueframe/tools run test:motion
```

Serve `products/cueframe/` from a local static server and open `motion-studio.html`. The HTML loads the sibling `motion-studio.bundle.js`; keep both files together. A secure static web host also works, but deployment is not configured by this prototype.

## Build a scene

1. Pick **Focus ping**, **Step reveal**, **Point + pop**, or **Orbit loop**.
2. Select a layer in the layer list. Use **Shape** or **Text** to add another layer, **Copy** to duplicate, and **Delete** to remove the selected layer.
3. Change the layer name, shape/text, motion, easing, direction, colors, position, size, stroke, rotation, opacity, and motion intensity in the inspector.
4. Drag the selected layer on the canvas to position it. On a phone, use a single-finger drag; pinch is not required.
5. Set tempo in BPM, use Tap tempo, choose a 1/2/4/8-beat loop and accent pattern, and optionally enable the click/metronome. Swing adjusts the offbeat accent position.
6. Drag a timeline bar to move it, drag the small right-side handle to change its duration, or use arrow keys when the bar has keyboard focus. It snaps in quarter-beat steps. Tap/click the empty timeline track to scrub. Play previews a loop.
7. Optionally select local audio as a timing reference or local image/video as preview footage. These local files are not saved in the project and are not sent or included in exports.
8. Save a `.cueframe` project file. Open that file later to continue editing; it is JSON and contains the scene settings and layers.

## Export choices

- **PNG still** — one transparent frame at the playhead, in the selected ratio and size.
- **Animated GIF** — a looping GIF at Medium or HD size, with either binary (on/off) transparency or green-key background. GIF edges cannot preserve smooth partial alpha. Medium is the safer first choice on a phone.
- **SVG motion** — an animated SVG using SMIL. Intended for browser/vector workflows; video editors may ignore animation or reject the file.
- **Video** — a canvas recording with a solid green background, using an MP4 or WebM recording format exposed by the browser. Loops shorter than two seconds repeat enough times to produce a more reliable clip; longer loops export once. Video export can be unavailable; MP4/WebM import support and codec behavior differ by browser, editor, operating system, and device. Use chroma key in an editor if needed.

GIF and video exports are silent. Local guide audio is never mixed into them. No CapCut or other video-editor compatibility is claimed yet; verify the file in the exact app version/device before relying on it.

## Known limits

- The editor is a single-scene loop tool, not a full multitrack video editor. It does not edit footage, render audio, or generate a finished short-form video.
- Project files save scene data only; preview media/audio must be selected again after reopening.
- Canvas export is done in the browser tab. Large HD GIFs and long loops can be slow or memory-heavy on phones; keep the tab in front until the download begins.
- The automated smoke test covers UI interactions, project normalization, SVG/PNG/GIF export paths, and responsive CSS markers with a mocked canvas. A separate manual headless Chromium pass checked PNG/SVG/GIF/MP4/project downloads, non-empty normal and short-loop MP4 output, responsive widths from 320–1440 px, and recorder-lock recovery after simulated failures. This does **not** verify pixel-level parity, codec/editor import support, or import/playback and performance on a real phone.
- Do not promise cross-device compatibility, sales, or earnings from this prototype.
