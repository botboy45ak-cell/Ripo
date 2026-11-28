import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3] / 'public'
SITE_BASE = 'https://handykit-free-images-pdf-file-tools.netlify.app'
SOCIAL_IMAGE = f'{SITE_BASE}/assets/images/handykit-social.jpg'


def public_url(path):
    parent = Path(path).parent.as_posix()
    route = '/' if parent == '.' else f'/{parent}/'
    return f'{SITE_BASE}{route}'

TOOLS = [
    ('image-resize', 'Resize image', 'Images', 'Set an exact width and height while keeping the original proportions.', '↔', 'Resize', 'Choose a photo, enter its new dimensions, and download the resized copy.', 'image/*', True),
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

# Search titles and descriptions are separate from the visible page copy so they can
# describe search intent without changing tool instructions or making unsupported claims.
ALL_TOOLS_SEO = (
    'Free Online Image, PDF & File Tools | HandyKit',
    'Browse browser tools for resizing, compressing, and converting images; PDF page tasks; QR codes; text cleanup; JSON; and ZIP files.',
)
CATEGORY_SEO = {
    'Images': (
        'Free Image Tools Online: Resize, Compress & Convert | HandyKit',
        'Free online image tools to resize, crop, rotate, convert, and compress photos, prepare a form-ready copy, remove common metadata, or cut out a person.',
    ),
    'PDF': (
        'Free PDF Tools Online: Merge, Split & Compress | HandyKit',
        'Free browser-based PDF tools to merge files, extract or reorder pages, compress scanned PDFs into image-based copies, and convert pages to JPG or PNG.',
    ),
    'Quick': (
        'QR, Text & JSON Tools Online | HandyKit',
        'Browser tools for QR codes, word and character counts, text cleanup, JSON formatting, and creating or unpacking ZIP archives. No account is required.',
    ),
}
TOOL_SEO = {
    'image-resize': (
        'Resize Images Online to Exact Dimensions | HandyKit',
        'Resize images online by setting a new width and height. Keep proportions, save a JPG, PNG, or WebP copy, and check the output dimensions before use.',
    ),
    'image-compress': (
        'Compress Images Online to a Target KB Size | HandyKit',
        'Reduce an image file size by setting a target KB limit and optional maximum width. Compare the result; exact size and image quality can vary.',
    ),
    'image-convert': (
        'Convert JPG, PNG & WebP Images Online | HandyKit',
        'Convert an image to JPG, PNG, or WebP in your browser. Choose a background color when saving a transparent image as JPG.',
    ),
    'crop-rotate': (
        'Crop, Rotate & Flip Images Online | HandyKit',
        'Crop an image with percentage controls, rotate or flip it, then download the edited copy. Check the crop before sharing.',
    ),
    'remove-background': (
        'Remove a Person’s Photo Background | HandyKit',
        'Create a transparent cutout of a person in a photo using a local model. Results can vary around hair and edges; check the image before use.',
    ),
    'form-photo': (
        'Resize a Photo for a Form (Pixels & KB) | HandyKit',
        'Resize and compress a photo or signature to pixel and KB limits you enter from a form’s current instructions. No official presets are provided.',
    ),
    'remove-metadata': (
        'Remove EXIF Metadata from Images Online | HandyKit',
        'Save a new image copy without common camera EXIF metadata. Re-encoding may affect image quality; inspect the copy before sharing.',
    ),
    'slideshow': (
        'Create a Photo Slideshow Video Online | HandyKit',
        'Turn selected photos into a short WebM slideshow in your browser. Export support depends on your browser; music is not included.',
    ),
    'photos-to-pdf': (
        'Convert Photos to PDF Online | HandyKit',
        'Combine photos into an ordered PDF with page size, orientation, and margin options. Check the exported PDF before submitting or sharing.',
    ),
    'pdf-merge': (
        'Merge PDF Files Online in Your Chosen Order | HandyKit',
        'Combine multiple PDF files in the order you choose. Password-protected PDFs are not supported; keep your original files.',
    ),
    'pdf-split': (
        'Split a PDF or Extract Pages Online | HandyKit',
        'Extract selected pages or ranges from a PDF into a new file. Enter page numbers such as 1,3-5 and check the result before sharing.',
    ),
    'pdf-organize': (
        'Reorder, Rotate & Remove PDF Pages | HandyKit',
        'Reorder, rotate, or remove PDF pages. Review the page order and rotation in the new copy before downloading.',
    ),
    'pdf-compress': (
        'Compress Scanned PDFs Online (Image-Based) | HandyKit',
        'Make a lower-resolution, image-based copy of a scanned PDF. Text becomes non-selectable and the amount of size reduction varies.',
    ),
    'pdf-to-images': (
        'Convert PDF Pages to JPG or PNG | HandyKit',
        'Convert PDF pages to JPG or PNG images. Multiple pages are bundled in a ZIP; large PDFs may need more device memory.',
    ),
    'zip': (
        'Create or Unzip ZIP Files Online | HandyKit',
        'Create a ZIP archive or unpack a ZIP file in your browser. ZIP may not reduce already-compressed photos or videos.',
    ),
    'qr-code': (
        'Free QR Code Generator for Links & Text | HandyKit',
        'Generate a downloadable QR code from a short link, text, or contact detail. Scan and verify the QR before printing or sharing.',
    ),
    'word-counter': (
        'Word & Character Counter Online | HandyKit',
        'Count words, characters, lines, and estimated reading time as you type. Text is processed in this page and is not sent anywhere.',
    ),
    'text-cleaner': (
        'Clean Text: Sort Lines & Remove Duplicates | HandyKit',
        'Trim line spaces, remove blank or duplicate lines, sort text, or change letter case. Review the output before copying it.',
    ),
    'json-formatter': (
        'JSON Formatter & Validator Online | HandyKit',
        'Format, minify, or validate JSON in your browser. Invalid JSON stays unchanged, and the error message points to where parsing stopped.',
    ),
}

TOOL_FAQS = {
    'image-resize': [
        ("How do I set image dimensions?", "Enter a new width and/or height in pixels. Leave one dimension blank to derive it from the original proportions; with proportions kept, the image fits within the requested size."),
        ("Can I resize by percentage?", "No. This tool uses pixel dimensions rather than percentage scaling."),
        ("Which formats can I save?", "Choose JPG, PNG, or WebP, then check the downloaded copy before using it."),
    ],
    'image-compress': [
        ("Can I compress an image to 50 KB?", "Enter 50 as the maximum size in KB. The tool tries to meet that limit, but results depend on the image, format, quality, and dimensions."),
        ("Will compression change image dimensions?", "If adjusting quality is not enough to meet the limit, the tool may also reduce the dimensions. Check the output size and appearance."),
        ("Which formats can I save?", "The compressor offers JPG and WebP output. Compare quality before sharing or uploading the result."),
    ],
    'image-convert': [
        ("Which formats can I save?", "Choose JPG, PNG, or WebP as the new image format."),
        ("Can a JPG keep transparency?", "No. JPG is opaque; choose a background color when converting an image with transparent areas to JPG."),
        ("Does changing the file extension convert an image?", "No. This tool decodes the image and writes a new file in the selected format; renaming alone would not convert it."),
    ],
    'crop-rotate': [
        ("How do the crop values work?", "Set the left edge, top edge, width, and height as percentages of the original image, then review the result."),
        ("Can I rotate or flip an image?", "You can rotate in quarter-turn steps and flip horizontally before saving."),
        ("Which formats can I save?", "Choose JPG, PNG, or WebP. Check the cropped output before sharing it."),
    ],
    'remove-background': [
        ("Does this remove every kind of object?", "No. The local segmentation model is designed to cut out a person; it is not a general-purpose object remover."),
        ("Is my photo uploaded for background removal?", "The selected photo is processed in your browser. The first use may download a supporting model; the photo itself is not uploaded by this tool."),
        ("Why can edges look rough?", "Hair, transparent items, and complex backgrounds can be difficult to separate. Inspect the cut-out before using it."),
    ],
    'form-photo': [
        ("Does this tool include official form presets?", "No. Enter the current width, height, and file-size limit shown by the form or organization."),
        ("Can I set both pixel dimensions and a KB limit?", "Yes. Enter the requested dimensions and, if needed, a maximum file size in KB; check the result against the form's rules."),
        ("Will the image be stretched?", "Crop-to-fit is on by default to avoid stretching. You can change that option, so review the result before submitting it."),
    ],
    'remove-metadata': [
        ("What metadata does this remove?", "Re-encoding removes common camera EXIF metadata. Do not treat it as a guarantee that every kind of metadata is removed from every file."),
        ("Can saving a clean copy affect image quality?", "It can. Choose an output format and quality, then inspect the new copy before sharing it."),
        ("Does the tool change the image itself?", "It creates a re-encoded copy in your browser; the selected original file is not overwritten."),
    ],
    'slideshow': [
        ("What video format does the slideshow export?", "It exports WebM when supported by your browser. Export support can vary by browser and device."),
        ("Can I set the pace and video shape?", "Yes. Choose seconds per photo, landscape, portrait, or square framing, and a crossfade or simple cut."),
        ("Can I add music?", "No. The slideshow export contains no music; add audio separately in an editor if you have the rights to use it."),
    ],
    'photos-to-pdf': [
        ("Can I change the photo order?", "Choose multiple photos and use the move controls to arrange their order before creating the PDF."),
        ("Which page sizes are available?", "Choose A4, US Letter, or Fit each photo, then set orientation and margins."),
        ("Does creating a PDF change my photos?", "No. The tool creates a separate PDF download; your selected photo files remain unchanged."),
    ],
    'pdf-merge': [
        ("Can I choose the order of merged PDFs?", "Yes. Add the PDFs in your preferred order and use the move controls to arrange them before merging."),
        ("Can I merge password-protected PDFs?", "Password-protected PDFs are not supported by this tool."),
        ("Will the original PDFs be changed?", "No. The tool creates a new merged PDF and leaves the selected source files unchanged."),
    ],
    'pdf-split': [
        ("How do I choose PDF pages?", "Enter page numbers or ranges such as 1,3-5,8. Page numbers start at 1."),
        ("Can I extract non-consecutive pages?", "Yes. Separate page numbers and ranges with commas, then check the new PDF."),
        ("Does splitting change the original PDF?", "No. The selected pages are saved as a new PDF; the source file is not overwritten."),
    ],
    'pdf-organize': [
        ("How do I set a new page order?", "Enter every page number once in the order you want, for example 3,1,2. Leave the field blank to keep the existing order."),
        ("Can I rotate or remove pages?", "You can rotate every page or enter page numbers/ranges to remove before saving a new copy."),
        ("Do page numbers start at zero?", "No. The first page is page 1. Check the exported PDF before sharing it."),
    ],
    'pdf-compress': [
        ("Will text remain selectable after compression?", "No. This tool rasterizes pages into images, so text in the new PDF will not remain selectable or searchable."),
        ("Will compression always make a PDF smaller?", "No. The size change depends on the source PDF and chosen settings; compare the new file with the original."),
        ("How do the resolution settings affect the result?", "Lower DPI and JPEG quality usually produce smaller files with less detail. Keep the original and review the compressed copy."),
    ],
    'pdf-to-images': [
        ("Can I choose JPG or PNG output?", "Yes. Select JPG or PNG before converting the chosen PDF pages."),
        ("Can I convert only some pages?", "Yes. Enter page numbers or ranges; leave the field blank to convert all pages."),
        ("How are multiple page images downloaded?", "When more than one page is converted, the images are bundled in a ZIP file. Large PDFs can use substantial device memory."),
    ],
    'zip': [
        ("Can I create and unpack ZIP files?", "Yes. Choose Create a ZIP to bundle selected files, or Unpack a ZIP to extract files from an archive."),
        ("Will a ZIP always make my files smaller?", "No. Photos and videos are often already compressed, so archiving them may not reduce their size."),
        ("Are my files uploaded while zipping?", "The archive is created or unpacked in your browser; the tool does not upload your selected files."),
    ],
    'qr-code': [
        ("What can I put in a QR code?", "Paste a website address, short text, or contact detail. Longer content can make a denser code that is harder to scan."),
        ("Can I change the QR image size?", "Yes. Choose an output size in pixels and a damage-correction level before generating it."),
        ("Should I test a QR code before printing?", "Yes. Scan the downloaded image with a phone and confirm that it opens the intended content before sharing or printing."),
    ],
    'word-counter': [
        ("What does the counter measure?", "It shows words, characters, characters without spaces, lines, and an estimated reading time."),
        ("How is reading time estimated?", "The estimate uses about 200 words per minute, so it is only a guide and may not match every reader."),
        ("Is my text sent to a server?", "No. Text is measured in the page and is not sent anywhere by this tool."),
    ],
    'text-cleaner': [
        ("What cleanup actions are available?", "You can trim line spaces, remove blank or duplicate lines, sort lines, and change letter case."),
        ("Does cleanup overwrite my original text?", "No. The cleaned result appears separately; review it and copy it if you want to use it."),
        ("Is pasted text uploaded?", "No. The cleanup runs in this page, and the text is not sent to a server by this tool."),
    ],
    'json-formatter': [
        ("Can I format or minify JSON?", "Yes. Choose readable, indented output or a minified result, then review it before copying."),
        ("What happens if my JSON is invalid?", "The tool leaves invalid input unchanged and shows where parsing stopped so you can check the syntax."),
        ("Is my JSON sent to a server?", "No. The JSON is processed in this page and is not sent anywhere by this tool."),
    ],
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
    return f'''<footer class="site-footer"><div class="wrap footer-inner"><a class="brand footer-brand" href="{pre}index.html"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 36 36"><path d="M9 9.5h14.5l5 5V27a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V11.5a2 2 0 0 1 2-2Z"/><path d="M23.5 9.5v5h5M12 19h11M12 23h8"/></svg></span><span>HandyKit<small>Useful, not fussy</small></span></a><p>Independent browser tools. No account required. Not affiliated with government portals.</p><div class="footer-links"><a href="{pre}tools/">All tools</a><a href="{pre}README.md">About privacy & limits</a><a href="{pre}THIRD-PARTY-NOTICES.txt">Third-party notices</a></div><small>© 2026 HandyKit · Free browser tools</small></div></footer>'''


def card(tool, pre='../../'):
    slug, name, category, desc, symbol, *_ = tool
    href = f'{pre}tools/{slug}/'
    return f'''<a class="tool-card" data-tool-card href="{href}" data-search="{escape((name+' '+desc+' '+category).lower())}"><span class="tool-symbol" aria-hidden="true">{escape(symbol)}</span><span><strong>{escape(name)}</strong><p>{escape(desc)}</p></span><span class="tool-open" aria-hidden="true">↗</span></a>'''


def write_page(path, title, description, body, depth, tool_key=None, accept='', multiple=False, seo_title=None, seo_description=None):
    script = '../' * depth + 'assets/js/app.js'
    rootlink = '../' * depth
    canonical = public_url(path)
    full_title = seo_title or f'{title} | HandyKit'
    search_description = seo_description or description
    data = f' data-tool="{escape(tool_key)}" data-accept="{escape(accept)}" data-multiple="{str(multiple).lower()}"' if tool_key else ''
    schema = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication' if tool_key else 'CollectionPage',
        'name': title,
        'description': search_description,
        'url': canonical,
    }
    if tool_key:
        schema.update({
            'applicationCategory': 'UtilitiesApplication',
            'operatingSystem': 'Any',
            'isAccessibleForFree': True,
            'offers': {
                '@type': 'Offer',
                'price': '0',
                'priceCurrency': 'INR',
            },
        })
    schema_json = json.dumps(schema, ensure_ascii=False).replace('<', r'\u003c')
    faq_items = TOOL_FAQS.get(tool_key, [])
    faq_schema_json = ''
    if faq_items:
        faq_schema = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': [
                {
                    '@type': 'Question',
                    'name': question,
                    'acceptedAnswer': {'@type': 'Answer', 'text': answer},
                }
                for question, answer in faq_items
            ],
        }
        faq_schema_json = json.dumps(faq_schema, ensure_ascii=False).replace('<', r'\u003c')
    faq_script = f'<script type="application/ld+json">{faq_schema_json}</script>' if faq_schema_json else ''
    html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#f4f0e8"><meta name="description" content="{escape(search_description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="{escape(canonical)}"><meta property="og:type" content="website"><meta property="og:site_name" content="HandyKit"><meta property="og:title" content="{escape(full_title)}"><meta property="og:description" content="{escape(search_description)}"><meta property="og:url" content="{escape(canonical)}"><meta property="og:image" content="{SOCIAL_IMAGE}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="HandyKit everyday file tools: a PDF, photo and simple browser tools"><meta property="og:locale" content="en_US"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{escape(full_title)}"><meta name="twitter:description" content="{escape(search_description)}"><meta name="twitter:image" content="{SOCIAL_IMAGE}"><meta name="twitter:image:alt" content="HandyKit everyday file tools: a PDF, photo and simple browser tools"><title>{escape(full_title)}</title><link rel="stylesheet" href="{rootlink}assets/css/site.css"><script type="application/ld+json">{schema_json}</script>{faq_script}<script type="module" src="{script}"></script></head>
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
    faq_markup = ''.join(
        f'<details><summary>{escape(question)}</summary><p>{escape(answer)}</p></details>'
        for question, answer in TOOL_FAQS[slug]
    )
    body += f'''<section class="wrap section-block tool-faq" aria-labelledby="tool-faq-heading"><div class="section-heading"><div><p class="eyebrow">Helpful answers</p><h2 id="tool-faq-heading">Questions about {escape(name)}</h2></div></div><div class="accordion">{faq_markup}</div></section>'''
    seo_title, seo_description = TOOL_SEO[slug]
    write_page(f'tools/{slug}/index.html', name, desc, body, 2, slug, accept, multiple, seo_title=seo_title, seo_description=seo_description)


# Complete tools directory.
all_body = ['<section class="wrap page-hero"><div class="breadcrumb"><a href="../index.html">Home</a><span>/</span><span>All tools</span></div><p class="eyebrow">A shelf of small helpers</p><h1>All the useful little tools.</h1><p>Search by the job you need done. Each tool has its own page, clear options, and a download at the end.</p><form class="directory-search" role="search"><label class="sr-only" for="directorySearch">Search all tools</label><span aria-hidden="true">⌕</span><input id="directorySearch" type="search" placeholder="Search, e.g. resize, PDF, QR…" autocomplete="off"><small id="toolCount"></small></form></section><section class="wrap tool-directory">']
for category, (slug, heading, desc, eyebrow) in CATEGORIES.items():
    cat_tools = [t for t in TOOLS if t[2] == category]
    all_body.append(f'<section class="tool-group" data-category="{slug}"><h2>{escape(heading)}</h2><div class="tool-grid">')
    all_body.extend(card(t, pre='../') for t in cat_tools)
    all_body.append('</div></section>')
all_body.append('</section>')
write_page(
    'tools/index.html',
    'All tools',
    'Browse browser-based image, PDF, text, QR, and file helpers.',
    ''.join(all_body),
    1,
    seo_title=ALL_TOOLS_SEO[0],
    seo_description=ALL_TOOLS_SEO[1],
)

# Category landing pages.
for category, (slug, heading, desc, eyebrow) in CATEGORIES.items():
    cat_tools = [t for t in TOOLS if t[2] == category]
    body_parts = [f'<section class="wrap page-hero"><div class="breadcrumb"><a href="../../index.html">Home</a><span>/</span><a href="../../tools/">All tools</a><span>/</span><span>{escape(heading)}</span></div><p class="eyebrow">{escape(eyebrow)}</p><h1>{escape(heading)}.</h1><p>{escape(desc)}</p></section><section class="wrap tool-directory"><div class="tool-grid">']
    body_parts.extend(card(t) for t in cat_tools)
    body_parts.append('</div></section>')
    seo_title, seo_description = CATEGORY_SEO[category]
    write_page(
        f'tools/{slug}/index.html',
        heading,
        desc,
        ''.join(body_parts),
        2,
        seo_title=seo_title,
        seo_description=seo_description,
    )

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
readme = '''# HandyKit — Everyday file tools\n\nHandyKit is a free browser-based toolbox for image, PDF, text, and file tasks. Each tool page explains supported formats, how to use it, and relevant limitations.\n\n## Tools currently in the directory\n\n- Images: resize, compress, convert, crop/rotate, people-background removal, custom form photo/signature sizing, metadata removal, and photos-to-slideshow.\n- PDF: photos-to-PDF, merge, split/extract, rotate/reorder/delete pages, image-based compression, and PDF-to-images.\n- Quick helpers: ZIP/unzip, QR code, word counter, text cleaner, and JSON formatter.\n\n## Privacy and limits\n\nImage, PDF, and utility operations are designed to run in the browser on the user's device. Local AI background removal uses a person-segmentation model; it is not a universal object cut-out and may be slower on phones. PDF compression rasterizes pages, so the compressed copy will not retain selectable text. ZIP, video, and PDF work can use significant memory. The site does not claim official photo/signature sizes; users should enter current dimensions and file limits from the relevant form.\n\nNo file-format conversion is done by renaming an extension. The relevant tool decodes and writes a new output format. An exact target file size may not be possible without visible quality loss.\n\n## Local preview and build\n\nServe the static site from the repository root:\n\n```sh\npython3 -m http.server 8000 --bind 0.0.0.0 --directory public\n```\n\nBuild local vendor bundles and the PDF worker from the repository root:\n\n```sh\nnpm ci --prefix products/file-tools/tools\nnpm --prefix products/file-tools/tools run build\n```\n\nThe assets and app source live in `products/file-tools/`. Third-party licenses are listed in `public/THIRD-PARTY-NOTICES.txt`.\n\n## Publishing and search\n\nNetlify publishes the `public/` folder as configured by `netlify.toml`; the primary HandyKit URL is `https://handykit-free-images-pdf-file-tools.netlify.app/`. The generated `robots.txt`, `sitemap.xml`, canonical URLs, and social metadata use that host. A separate GitHub Pages workflow is also present in the repository; do not submit its GitHub-hosted URLs under the Netlify Search Console property. Submit the production `sitemap.xml` in the matching Google Search Console property after updates; Google controls crawling and indexing, so sitemap submission does not guarantee search appearance.\n'''
(ROOT / 'README.md').write_text(readme, encoding='utf-8')
print(f'Generated {len(TOOLS)} individual tool pages and 4 directory/category pages.')
