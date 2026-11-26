# Desktop workflow: add a transparent PNG overlay

These steps apply to common timeline editors. The exact controls vary between applications; no plugin, preset, font, or blend mode should be needed for the PNG files.

1. Unzip the download and choose a `wide` PNG (1920×1080) for a 16:9 project, or a `vertical` PNG (1080×1920) for a 9:16 project.
2. Import your base footage and the chosen PNG into the project.
3. Put the PNG on a video/image track above the base footage. Extend or trim it to the intended duration.
4. If needed, adjust scale and position in the viewer. Use the PNG at its original ratio; do not stretch a portrait asset to fill a wide frame.
5. Add any wording in a separate text layer so you can edit it and localize it.
6. Preview at normal size, export a short test, and inspect the exported file for transparency, readability, and safe placement.

## Common issues

- **A dark or white box appears around the artwork:** verify that the source PNG is transparent and that the editor did not convert it to JPEG.
- **The cue looks too large or small:** select the correct aspect-ratio folder; avoid non-uniform stretching.
- **Text is hidden:** check track order and move the text above the image layer.
- **The cue is visible at the wrong time:** adjust the PNG layer's start point and duration on the timeline.

CapCut's current official overlay article covers desktop and phone workflows. Other editors can use the files if they support transparent PNG image layers, but they have not all been tested with this prototype.
