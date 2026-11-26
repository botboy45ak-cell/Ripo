# Phone workflow: add a transparent PNG overlay

These are general steps for a phone video editor. Button names may differ by app version, language, region, or device. This prototype has **not yet been smoke-tested on the user's phone**.

## CapCut Mobile (current documented route)

1. Extract the ZIP on your phone. On many phones, the built-in Files app can open a ZIP; if not, transfer the extracted PNG folder from a computer or use a file app you already trust. Do not install a paid tool just for this prototype.
2. Save or locate the right `vertical` PNG (1080×1920) for a 9:16 project. Choose one style folder: `clear`, `pulse`, or `warm`.
3. Open your video project and move the playhead to the point where the cue should appear.
4. Add the PNG as an image overlay. CapCut's documented mobile workflow is **Overlay → Add overlay**, then select an image from the device. If your version shows different labels, follow the equivalent image-layer option in your editor.
5. The PNG has a transparent background, so the footage should show through around the artwork. Resize/reposition it in the preview and trim the image layer to the time you want.
6. Add your own text as a separate text layer; the artwork contains no fixed language. Keep the text away from phone UI controls and check it on a small screen.
7. Play the full section, export a very short test, and inspect the saved file before using the overlay throughout a longer edit.

## Phone tips

- Start with one overlay in a short copy of the project. If the image appears as a solid rectangle, stop and check that the selected file is the PNG and not an SVG preview or a JPEG conversion.
- Keep the subject and any essential text clear. A cue is meant to guide attention, not cover the footage.
- The portrait set is intended for 9:16. Do not stretch it into a wide video; switch to the `wide` set instead.
- If the editor's file picker cannot see the PNGs, copy them to a photo/gallery folder using your phone's normal Files app.

## Motion Studio (separate prototype workflow)

`motion-studio.html` can create a custom short loop in a mobile browser. The current smoke test is automated with a mocked canvas; it is not a real-phone or CapCut import test. Start with a Medium GIF, or a browser-recorded green-screen MP4/WebM if available. GIF transparency is one-bit and may not be handled as an overlay by your editor. Video format support varies. Save a short test in the exact editor/device first; if the file is rejected, the static PNG workflow above remains a separate option. Do not assume an animated format is CapCut Mobile-compatible until you have tested it.

## Source basis

CapCut's guide, published 21 October 2026, documents mobile video overlays through the mobile app and describes adjusting position and blending. This product uses transparent PNGs, so a blend mode is not required. Exact UI steps may change.
