import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3] / 'public'
SITE_BASE = 'https://botboy45ak-cell.github.io/Ripo'
SOCIAL_IMAGE = f'{SITE_BASE}/assets/images/handykit-social.jpg'


def public_url(path):
    parent = Path(path).parent.as_posix()
    route = '/' if parent == '.' else f'/{parent}/'
    return f'{SITE_BASE}{route}'

TOOLS = [
    ('image-resize', 'Resize image', 'Images', 'Set an exact width and height, or resize by percentage while keeping the shape.', '↔', 'Resize', 'Choose a photo, enter its new dimensions, and download the resized copy.', 'image/*', True),
    ('image-compress', 'Compress image', 'Images', 'Make a photo smaller for sharing, email, websites, or an upload limit.', '⇣', 'Compress', 'Choose a target size in KB. The tool tries to keep the image clear while it gets smaller.', 'image/*', True),
    ('image-convert', 'Convert image format', 'Images', 'Make a real JPG, PNG, or WebP file—not just a renamed extension.', '◈', 'Convert', 'Pick the format you need. Transparency can be filled with a color when saving as JPG.', 'image/*', True),
    ('crop-rotate', 'Crop & rotate image', 'Images', 'Crop with percentages, turn a photo, or flip it before downloading.', '⌖', 'Apply changes', 'Set a simple crop box as percentages of the original image, then rotate or flip.', 'image/*', True),
    ('remove-background', 'Remove background', 'Images', 'Create a transparent cut-out of a person using an on-device segmentation model.', '✿', 'Remove background', 'Best with a clear person in the photo. The first run downloads a local model; your photo is not uploaded.', 'image/*', False),
    ('form-photo', 'Form photo & signature', 'Images', 'Resize and compress a photo or signature to the dimensions and KB limit your form asks for.', '▧', 'Prepare image', 'Enter the exact values from the current form instructions. Requirements vary; this page does not claim official exam presets.', 'image/*', True),
    ('remove-metadata', 'Remove image metadata', 'Images', 'Save a fresh image copy without the original EXIF metadata.', '⌕', 'Make clean copy', 'Re-encoding in the browser strips common camera metadata. Compare the result before sharing.', 'image/*', True),
    ('slideshow', 'Photos to slideshow', 'Images', 'Arrange photos, choose a pace, and export a short video file in your browser.', '▶', 'Make slideshow', 'Exports WebM where your browser supports recording. The slideshow contains no music.', 'image/*', True),
    ('photos-to-pdf', 'Photos to PDF', 'PDF', 'Turn one or more photos into an ordered, multi-page PDF.', '▤', 'Create PDF', 'Arrange photos in the order you select them. Pick a page size and margins before downloading.', 'image/*', True),
    ('pdf-merge', 'Merge PDFs', 'PDF', 'Combine several PDF files into one document in the order you choose.', '⊞', 'Merge PDFs', 'Add PDFs in the order you want the pages to appear. Password-protected files are not supported.', '.pdf,application/pdf', True),
    ('pdf-split', 'Split or extract PDF pages', 'PDF', 'Choose page numbers or ranges and save only the pages you need.', '✂', 'Extract pages', 'Use page numbers like 1,3-5. The tool checks the range against the selected PDF.', '.pdf,application/pdf', False),
    ('pdf-organize', 'Rotate & organize PDF', 'PDF', 'Rotate pages, remove unwanted pages, or set a new page order.', '↻', 'Update PDF', 'Page numbers start at 1. You can leave the order field blank to keep the existing order.', '.pdf,application/pdf', False),
    ('pdf-compress', 'Compress PDF', 'PDF', 'Reduce a scanned PDF by making a new image-based copy at a lower resolution.', '⇣', 'Make smaller copy', 'This flattens pages into images, so text will no longer be selectable. Keep your original; reduction varies.', '.pdf,application/pdf', False),
    ('pdf-to-images', 'PDF to images', 'PDF', 'Save each PDF page as a JPG or PNG image.', '▧', 'Convert pages', 'Converted pages are bundled in a ZIP when there is more than one. Large PDFs use more memory.', '.pdf,application/pdf', False),
    ('zip', 'ZIP & unzip files', 'Quick', 'Bundle selected files into a ZIP or unpack a ZIP archive in your browser.', 'ZIP', 'Create ZIP', 'ZIP is an archive format; it does not always make already-compressed photos or videos smaller.', '*/*', True),
    ('qr-code', 'QR code maker', 'Quick', 'Turn a short link, message, or contact detail into a QR code you can download.', '▦', 'Make QR code', 'Check the decoded content before printing or sharing your QR code.', '', False),
    ('word-counter', 'Word & character counter', 'Quick', 'Count words, characters, lines, and estimated reading time as you type.', 'Aa', 'Count words', 'Text is measured in this page only; it is not sent anywhere.', '', False),
    ('text-cleaner', 'Text cleaner', 'Quick', 'Trim lines, remove duplicates, sort text, or change letter case.', '≋', 'Clean text', 'Paste text, choose one cleanup action, then copy the result.', '', False),
    ('json-formatter', 'JSON formatter', 'Quick', 'Format, minify, and validate JSON in your browser.', '{ }', 'Format JSON', 'Invalid JSON is not changed. The error message points to where parsing stopped.', '', False),
]

CATEGORIES = {
    'Images': ('images', 'Images & photos', 'Resize, convert, compress, crop, and prepare form-ready images. Background removal works on people and runs locally in your browser.', 'Photo tools for everyday jobs'),
    'PDF': ('pdf', 'PDF & documents', 'Create PDFs from photos, combine or extract pages, rotate files, and convert pages to images.', 'Small PDF jobs, in one place'),
    'Quick': ('quick', 'Quick little helpers', 'A few useful browser-based helpers for text, QR codes, JSON, and file bundles.', 'Useful extras, without extra setup'),
}

NAV = '''<header class="site-header"><div class="wrap header-inner">
<a class="brand" href="../../index.html" aria-label="HandyKit home"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 36 36"><path d="M9 9.5h14.5l5 5V27a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V11.5a2 2 0 0 1 2-2Z"/><path d="M23.5 9.5v5h5M12 19h11M12 23h8"/></svg></span><span>HandyKit<small>Everyday file tools</small></span></a>
<nav class="main-nav" aria-label="Main navigation"><a href="../../tools/images/">Images</a><a href="../../tools/pdf/">PDFs</a><a href="../../tools/quick/">Quick tools</a></nav><a class="header-cta" href="../../tools/">All tools <span>↗</span></a></div></header>'''


def site_header(depth):
    pre = '../' * depth
    return f'''<header class="site-header"><div class="wrap header-inner">
<a class="brand" href="{pre}index.html" aria-label="HandyKit home"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 36 36"><path d="M9 9.5h14.5l5 5V27a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V11.5a2 2 0 0 1 2-2Z"/><path d="M23.5 9.5v5h5M12 19h11M12 23h8"/></svg></span><span>HandyKit<small>Everyday file tools</small></span></a>
<nav class="main-nav" aria-label="Main navigation"><a href="{pre}tools/images/">Images</a><a href="{pre}tools/pdf/">PDFs</a><a href="{pre}tools/quick/">Quick tools</a></nav><a class="header-cta" href="{pre}tools/">All tools <span>↗</span></a></div></header>'''


def footer(depth):
    pre = '../' * depth
    return f'''<footer class="site-footer"><div class="wrap footer-inner"><a class="brand footer-brand" href="{pre}index.html"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 36 36"><path d="M9 9.5h14.5l5 5V27a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V11.5a2 2 0 0 1 2-2Z"/><path d="M23.5 9.5v5h5M12 19h11M12 23h8"/></svg></span><span>HandyKit<small>Useful, not fussy</small></span></a><p>Independent browser tools. No account required. Not affiliated with government portals.</p><div class="footer-links"><a href="{pre}tools/">All tools</a><a href="{pre}README.md">About privacy & limits</a><a href="{pre}THIRD-PARTY-NOTICES.txt">Third-party notices</a><a href="{pre}cueframe/index.html">Cueframe archive</a><a href="{pre}tutor/">Tutor Setup archive</a></div><small>© 2026 HandyKit · Prototype, built with care</small></div></footer>'''


def card(tool, pre='../../'):
    slug, name, category, desc, symbol, *_ = tool
    href = f'{pre}tools/{slug}/'
    return f'''<a class="tool-card" data-tool-card href="{href}" data-search="{escape((name+' '+desc+' '+category).lower())}"><span class="tool-symbol" aria-hidden="true">{escape(symbol)}</span><span><strong>{escape(name)}</strong><p>{escape(desc)}</p></span><span class="tool-open" aria-hidden="true">↗</span></a>'''


def write_page(path, title, description, body, depth, tool_key=None, accept='', multiple=False):
    script = '../' * depth + 'assets/js/app.js'
    rootlink = '../' * depth
    canonical = public_url(path)
    full_title = f'{title} · HandyKit'
    data = f' data-tool="{escape(tool_key)}" data-accept="{escape(accept)}" data-multiple="{str(multiple).lower()}"' if tool_key else ''
    schema = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication' if tool_key else 'CollectionPage',
        'name': title,
        'description': description,
        'url': canonical,
    }
    if tool_key:
        schema.update({
            'applicationCategory': 'UtilitiesApplication',
            'operatingSystem': 'Any',
            'isAccessibleForFree': True,
        })
    schema_json = json.dumps(schema, ensure_ascii=False).replace('<', r'\u003c')
    html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#f4f0e8"><meta name="description" content="{escape(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="{escape(canonical)}"><meta property="og:type" content="website"><meta property="og:site_name" content="HandyKit"><meta property="og:title" content="{escape(full_title)}"><meta property="og:description" content="{escape(description)}"><meta property="og:url" content="{escape(canonical)}"><meta property="og:image" content="{SOCIAL_IMAGE}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="HandyKit everyday file tools: a PDF, photo and simple browser tools"><meta property="og:locale" content="en_US"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{escape(full_title)}"><meta name="twitter:description" content="{escape(description)}"><meta name="twitter:image" content="{SOCIAL_IMAGE}"><meta name="twitter:image:alt" content="HandyKit everyday file tools: a PDF, photo and simple browser tools"><title>{escape(full_title)}</title><link rel="stylesheet" href="{rootlink}assets/css/site.css"><script type="application/ld+json">{schema_json}</script><script type="module" src="{script}"></script></head>
<body{data}>{site_header(depth)}<main>{body}</main>{footer(depth)}</body></html>'''
    file = ROOT / path
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(html, encoding='utf-8')


def tool_page(tool):
    slug, name, category, desc, symbol, button, how, accept, multiple = tool
    category_slug = CATEGORIES[category][0]
    rootlink = '../../'
    accept_attr = f' accept="{escape(accept)}"' if accept else ''
    multi_attr = ' multiple' if multiple else ''
    upload = f'''<label class="dropzone" id="dropzone"><input id="fileInput" type="file"{accept_attr}{multi_attr}><span><span class="drop-icon" aria-hidden="true">↑</span><strong>Choose {"files" if multiple else "a file"} or drop {"them" if multiple else "it"} here</strong><p>Files stay on this device while the tool is running.</p></span></label><div class="file-list" id="fileList" aria-live="polite"></div><div id="quickToolControls" class="option-grid"></div><div class="tool-actions"><button class="btn" id="runTool" type="button">{escape(button)} <span aria-hidden="true">→</span></button><button class="btn secondary" id="resetTool" type="button">Clear</button></div>'''
    if slug == 'qr-code':
        upload = f'''<div id="quickToolControls" class="option-grid"></div><div class="tool-actions"><button class="btn" id="runTool" type="button">{escape(button)} <span aria-hidden="true">→</span></button><button class="btn secondary" id="resetTool" type="button">Clear</button></div>'''
    if slug == 'word-counter':
        upload = '''<div id="quickToolControls" class="option-grid"></div><div class="text-stats" id="textStats" aria-live="polite"></div><div class="tool-actions"><button class="btn secondary" id="resetTool" type="button">Clear text</button></div>'''
    if slug in ('text-cleaner', 'json-formatter'):
        upload = f'''<div id="quickToolControls" class="option-grid"></div><div class="tool-actions"><button class="btn" id="runTool" type="button">{escape(button)} <span aria-hidden="true">→</span></button><button class="btn secondary" id="copyResult" type="button">Copy output</button><button class="btn secondary" id="resetTool" type="button">Clear</button></div>'''
    aside = f'''<aside class="tool-aside"><div class="side-card"><h3>What this tool does</h3><p>{escape(how)}</p><p class="privacy-note"><span aria-hidden="true">✳</span> On-device processing; this page does not upload your selected file.</p></div><div class="side-card"><h3>A small heads-up</h3><p>{'Try one file first. Very large images or PDFs can use a lot of phone memory.' if category != 'Quick' else 'Check the result before using it in a form or sharing it.'}</p><a class="text-link" href="{rootlink}tools/{category_slug}/">More {category.lower()} tools <span>→</span></a></div></aside>'''
    body = f'''<section class="wrap page-hero"><div class="breadcrumb"><a href="{rootlink}tools/">All tools</a><span>/</span><a href="{rootlink}tools/{category_slug}/">{escape(CATEGORIES[category][1])}</a><span>/</span><span>{escape(name)}</span></div><p class="eyebrow">{escape(category)} tool</p><h1>{escape(name)}</h1><p>{escape(desc)}</p></section>
<section class="wrap tool-main"><div class="tool-layout"><section class="tool-panel" aria-label="{escape(name)} tool"><div class="tool-panel-head"><h2>{escape(button)}</h2><p>{escape(how)}</p></div><div class="tool-body">{upload}<div class="tool-status" id="toolStatus" role="status" aria-live="polite"></div><div class="progress-track" id="progressTrack" hidden><i id="progressBar"></i></div><div class="result-box" id="resultBox"><p class="result-title" id="resultTitle">Your file is ready</p><div class="result-content" id="resultContent"></div><div class="result-actions" id="resultActions"></div></div></div></section>{aside}</div></section>'''
    write_page(f'tools/{slug}/index.html', name, desc, body, 2, slug, accept, multiple)


# Complete tools directory.
all_body = ['<section class="wrap page-hero"><div class="breadcrumb"><a href="../index.html">Home</a><span>/</span><span>All tools</span></div><p class="eyebrow">A shelf of small helpers</p><h1>All the useful little tools.</h1><p>Search by the job you need done. Each tool has its own page, clear options, and a download at the end.</p><form class="directory-search" role="search"><label class="sr-only" for="directorySearch">Search all tools</label><span aria-hidden="true">⌕</span><input id="directorySearch" type="search" placeholder="Search, e.g. resize, PDF, QR…" autocomplete="off"><small id="toolCount"></small></form></section><section class="wrap tool-directory">']
for category, (slug, heading, desc, eyebrow) in CATEGORIES.items():
    cat_tools = [t for t in TOOLS if t[2] == category]
    all_body.append(f'<section class="tool-group" data-category="{slug}"><h2>{escape(heading)}</h2><div class="tool-grid">')
    all_body.extend(card(t, pre='../') for t in cat_tools)
    all_body.append('</div></section>')
all_body.append('</section>')
write_page('tools/index.html', 'All tools', 'Browse browser-based image, PDF, text, QR, and file helpers.', ''.join(all_body), 1)

# Category landing pages.
for category, (slug, heading, desc, eyebrow) in CATEGORIES.items():
    cat_tools = [t for t in TOOLS if t[2] == category]
    body_parts = [f'<section class="wrap page-hero"><div class="breadcrumb"><a href="../../index.html">Home</a><span>/</span><a href="../../tools/">All tools</a><span>/</span><span>{escape(heading)}</span></div><p class="eyebrow">{escape(eyebrow)}</p><h1>{escape(heading)}.</h1><p>{escape(desc)}</p></section><section class="wrap tool-directory"><div class="tool-grid">']
    body_parts.extend(card(t) for t in cat_tools)
    body_parts.append('</div></section>')
    write_page(f'tools/{slug}/index.html', heading, desc, ''.join(body_parts), 2)

# Individual tool pages.
for t in TOOLS:
    tool_page(t)

# Keep crawler directives and URLs aligned with the current published toolbox.
def write_search_files():
    routes = ['/', '/tools/']
    routes.extend(f'/tools/{slug}/' for slug, *_ in CATEGORIES.values())
    routes.extend(f'/tools/{tool[0]}/' for tool in TOOLS)
    urls = ''.join(f'  <url><loc>{escape(SITE_BASE + route)}</loc></url>\n' for route in routes)
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '</urlset>\n'
    (ROOT / 'sitemap.xml').write_text(sitemap, encoding='utf-8')
    (ROOT / 'robots.txt').write_text(f'User-agent: *\nAllow: /\n\nSitemap: {SITE_BASE}/sitemap.xml\n', encoding='utf-8')
    (ROOT / '.nojekyll').write_text('', encoding='utf-8')


write_search_files()

# Root public site notes.
readme = '''# HandyKit — Everyday file tools\n\nHandyKit is a static prototype of a browser-based file toolbox. It is being built in stages; every tool page explains what it does and any format or device limitations.\n\n## Tools currently in the directory\n\n- Images: resize, compress, convert, crop/rotate, people-background removal, custom form photo/signature sizing, metadata removal, and photos-to-slideshow.\n- PDF: photos-to-PDF, merge, split/extract, rotate/reorder/delete pages, image-based compression, and PDF-to-images.\n- Quick helpers: ZIP/unzip, QR code, word counter, text cleaner, and JSON formatter.\n\n## Privacy and limits\n\nImage, PDF, and utility operations are designed to run in the browser on the user's device. Local AI background removal uses a person-segmentation model; it is not a universal object cut-out and may be slower on phones. PDF compression rasterizes pages, so the compressed copy will not retain selectable text. ZIP, video, and PDF work can use significant memory. The site does not claim official photo/signature sizes; users should enter current dimensions and file limits from the relevant form.\n\nNo file-format conversion is done by renaming an extension. The relevant tool decodes and writes a new output format. An exact target file size may not be possible without visible quality loss.\n\n## Local preview and build\n\nServe the static site from the repository root:\n\n```sh\npython3 -m http.server 8000 --bind 0.0.0.0 --directory public\n```\n\nBuild local vendor bundles and the PDF worker from the repository root:\n\n```sh\nnpm ci --prefix products/file-tools/tools\nnpm --prefix products/file-tools/tools run build\n```\n\nThe assets and app source live in `products/file-tools/`. Third-party licenses are listed in `public/THIRD-PARTY-NOTICES.txt`.\n\n## Publishing and search\n\nGitHub Pages publishes the `public/` folder from `main` using `.github/workflows/deploy-pages.yml`. The default project-site URL is `https://botboy45ak-cell.github.io/Ripo/`. `robots.txt` and `sitemap.xml` are generated with the HandyKit routes. After the first successful deployment, submit the sitemap in Google Search Console; indexing and ranking are not guaranteed.\n\n## Archived projects\n\nCueframe remains available under [`cueframe/`](cueframe/). The old Tutor Setup pages remain under [`tutor/`](tutor/) as an archive.\n'''
(ROOT / 'README.md').write_text(readme, encoding='utf-8')
print(f'Generated {len(TOOLS)} individual tool pages and 4 directory/category pages.')
