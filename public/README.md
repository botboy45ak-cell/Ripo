# HandyKit — Everyday file tools

HandyKit is a static prototype of a browser-based file toolbox. It is being built in stages; every tool page explains what it does and any format or device limitations.

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

GitHub Pages publishes the `public/` folder from `main` using `.github/workflows/deploy-pages.yml`. The default project-site URL is `https://botboy45ak-cell.github.io/Ripo/`. `robots.txt` and `sitemap.xml` are generated with the HandyKit routes. After the first successful deployment, submit the sitemap in Google Search Console; indexing and ranking are not guaranteed.

## Archived projects

Cueframe remains available under [`cueframe/`](cueframe/). The old Tutor Setup pages remain under [`tutor/`](tutor/) as an archive.
