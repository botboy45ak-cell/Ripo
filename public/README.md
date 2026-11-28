# HandyKit — Everyday file tools

HandyKit is a free browser-based toolbox for image, PDF, text, and file tasks. Each tool page explains supported formats, how to use it, and relevant limitations.

## Tools currently in the directory

- Images: resize, compress, convert, crop/rotate, people-background removal, custom form photo/signature sizing, metadata removal, and photos-to-slideshow.
- PDF: photos-to-PDF, merge, split/extract, rotate/reorder/delete pages, image-based compression, and PDF-to-images.
- Quick helpers: ZIP/unzip, QR code, word counter, text cleaner, and JSON formatter.

## Privacy and limits

Image, PDF, and utility operations are designed to run in the browser on the user's device. Local AI background removal uses a person-segmentation model; it is not a universal object cut-out and may be slower on phones. PDF compression rasterizes pages, so the compressed copy will not retain selectable text. ZIP, video, and PDF work can use significant memory. The site does not claim official photo/signature sizes; users should enter current dimensions and file limits from the relevant form.

No file-format conversion is done by renaming an extension. The relevant tool decodes and writes a new output format. An exact target file size may not be possible without visible quality loss.

## Local preview and build

Serve the static site from the repository root:

```sh
python3 -m http.server 8000 --bind 0.0.0.0 --directory public
```

Build local vendor bundles and the PDF worker from the repository root:

```sh
npm ci --prefix products/file-tools/tools
npm --prefix products/file-tools/tools run build
```

The assets and app source live in `products/file-tools/`. Third-party licenses are listed in `public/THIRD-PARTY-NOTICES.txt`.

## Publishing and search

Netlify publishes the `public/` folder as configured by `netlify.toml`; the primary HandyKit URL is `https://handykit-free-images-pdf-file-tools.netlify.app/`. The generated `robots.txt`, `sitemap.xml`, canonical URLs, and social metadata use that host. A separate GitHub Pages workflow is also present in the repository; do not submit its GitHub-hosted URLs under the Netlify Search Console property. Submit the production `sitemap.xml` in the matching Google Search Console property after updates; Google controls crawling and indexing, so sitemap submission does not guarantee search appearance.
