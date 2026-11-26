const SITE_ROOT = new URL('../../', import.meta.url);
const assetUrl = (path) => new URL(path, SITE_ROOT).href;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const fileState = { files: [], resultUrls: [], results: [] };
const QUICK_TOOLS = [
  ['Image resize', 'tools/image-resize/', 'resize, pixels, dimensions, scale, photo'],
  ['Image compression', 'tools/image-compress/', 'compress, reduce, kb, size, photo'],
  ['Image format conversion', 'tools/image-convert/', 'convert, jpg, jpeg, png, webp, format'],
  ['Crop and rotate', 'tools/crop-rotate/', 'crop, rotate, flip, turn'],
  ['Remove background', 'tools/remove-background/', 'background, transparent, cutout, person'],
  ['Form photo and signature', 'tools/form-photo/', 'form, signature, upload, kb, pixels'],
  ['Remove image metadata', 'tools/remove-metadata/', 'metadata, exif, privacy'],
  ['Photos to PDF', 'tools/photos-to-pdf/', 'photo, jpg, image, pdf, document'],
  ['Merge PDFs', 'tools/pdf-merge/', 'merge, join, combine, pdf'],
  ['Split PDF pages', 'tools/pdf-split/', 'split, extract, pdf pages'],
  ['Organize PDF', 'tools/pdf-organize/', 'rotate, reorder, delete, pages, pdf'],
  ['Compress PDF', 'tools/pdf-compress/', 'compress, reduce, pdf, file size'],
  ['PDF to images', 'tools/pdf-to-images/', 'pdf, jpg, png, image, pages'],
  ['Photos to slideshow', 'tools/slideshow/', 'photos, video, slideshow, story'],
  ['ZIP and unzip files', 'tools/zip/', 'zip, archive, bundle, unzip, compress files'],
  ['QR code maker', 'tools/qr-code/', 'qr, code, link, wifi'],
  ['Word and character counter', 'tools/word-counter/', 'word, character, count, text'],
  ['Text cleaner', 'tools/text-cleaner/', 'text, duplicate lines, sort, case'],
  ['JSON formatter', 'tools/json-formatter/', 'json, format, validate, minify'],
];

function initSiteSearch() {
  const input = $('#toolSearch');
  const panel = $('#searchResults');
  if (!input || !panel) return;
  const render = () => {
    const query = input.value.trim().toLowerCase();
    if (!query) { panel.hidden = true; panel.replaceChildren(); return; }
    const matches = QUICK_TOOLS.filter(([name, path, terms]) => `${name} ${terms}`.toLowerCase().includes(query)).slice(0, 6);
    panel.replaceChildren();
    if (!matches.length) {
      const empty = document.createElement('p'); empty.className = 'search-empty'; empty.textContent = 'No exact match yet. Browse all tools to see what is available.'; panel.append(empty);
    } else {
      for (const [name, path, terms] of matches) {
        const link = document.createElement('a'); link.href = path;
        const title = document.createElement('strong'); title.textContent = name;
        const arrow = document.createElement('small'); arrow.textContent = 'Open →';
        link.append(title, arrow); panel.append(link);
      }
    }
    panel.hidden = false;
  };
  input.addEventListener('input', render);
  input.addEventListener('focus', render);
  input.addEventListener('keydown', (event) => { if (event.key === 'Escape') { panel.hidden = true; input.blur(); } });
  document.addEventListener('click', (event) => { if (!event.target.closest('.tool-search')) panel.hidden = true; });
  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) { event.preventDefault(); input.focus(); }
  });
}

function initDirectorySearch() {
  const input = $('#directorySearch');
  if (!input) return;
  const cards = $$('[data-tool-card]');
  const count = $('#toolCount');
  const groups = $$('[data-category]');
  const update = () => {
    const query = input.value.trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const content = `${card.dataset.search || ''} ${card.textContent}`.toLowerCase();
      const match = !query || content.includes(query);
      card.hidden = !match;
      if (match) visible++;
    });
    groups.forEach(group => { group.hidden = !group.querySelector('[data-tool-card]:not([hidden])'); });
    if (count) count.textContent = query ? `${visible} ${visible === 1 ? 'tool' : 'tools'}` : `${cards.length} tools`;
  };
  input.addEventListener('input', update); update();
}

function initCardTilt() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  $$('.card-tilt').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      card.style.transform = `perspective(950px) rotateX(${(-y * 2.2).toFixed(2)}deg) rotateY(${(x * 2.2).toFixed(2)}deg) translateY(-3px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

function humanSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB']; let value = bytes / 1024, unit = units[0], i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; unit = units[++i]; }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${unit}`;
}
function formatLabel(type) { return ({ 'image/jpeg': 'JPG', 'image/png': 'PNG', 'image/webp': 'WebP' })[type] || 'file'; }
function stem(name) { return name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || 'file'; }
function setStatus(message, kind = '') {
  const node = $('#toolStatus'); if (!node) return;
  node.textContent = message; node.className = `tool-status${kind ? ` ${kind}` : ''}`;
}
function setProgress(value, show = true) {
  const track = $('#progressTrack'), bar = $('#progressBar');
  if (!track || !bar) return;
  track.hidden = !show; bar.style.width = `${Math.max(0, Math.min(100, value))}%`;
}
function clearResults() {
  fileState.resultUrls.forEach(URL.revokeObjectURL); fileState.resultUrls = []; fileState.results = [];
  const box = $('#resultBox'); if (box) { box.classList.remove('visible'); $('#resultContent')?.replaceChildren(); $('#resultActions')?.replaceChildren(); }
}
function blobUrl(blob) { const url = URL.createObjectURL(blob); fileState.resultUrls.push(url); return url; }
function showResults(results, title = 'Your file is ready') {
  clearResults(); fileState.results = results;
  const box = $('#resultBox'), content = $('#resultContent'), actions = $('#resultActions');
  if (!box || !content || !actions) return;
  $('#resultTitle').textContent = title;
  for (const result of results) {
    const url = blobUrl(result.blob);
    if (result.kind === 'image') {
      const card = document.createElement('div'); card.className = 'image-preview-card';
      const img = document.createElement('img'); img.src = url; img.alt = result.name;
      const label = document.createElement('small'); label.textContent = `${result.name} · ${humanSize(result.blob.size)}${result.note ? ` · ${result.note}` : ''}`;
      card.append(img, label); content.append(card);
    } else if (result.kind === 'video') {
      const video = document.createElement('video'); video.className = 'result-video'; video.controls = true; video.src = url; video.setAttribute('playsinline', ''); content.append(video);
    } else if (result.kind === 'qr') {
      const img = document.createElement('img'); img.className = 'result-preview'; img.src = url; img.alt = 'Generated QR code'; img.style.width = 'min(280px, 100%)'; content.append(img);
    } else {
      const note = document.createElement('div'); note.className = 'result-meta';
      note.innerHTML = `<strong>${escapeHtml(result.name)}</strong><br>${humanSize(result.blob.size)}${result.note ? `<br>${escapeHtml(result.note)}` : ''}`; content.append(note);
    }
    const link = document.createElement('a'); link.className = 'btn secondary'; link.href = url; link.download = result.name; link.textContent = `Download ${result.name}`; actions.append(link);
  }
  box.classList.add('visible'); box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }

function addFiles(files) {
  const tool = document.body.dataset.tool;
  const list = [...files];
  let valid = list;
  if (['image-resize','image-compress','image-convert','crop-rotate','remove-background','form-photo','remove-metadata','slideshow','photos-to-pdf'].includes(tool)) {
    valid = list.filter(file => file.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif|avif|heic)$/i.test(file.name));
  } else if (tool?.startsWith('pdf-') || tool === 'pdf-merge') {
    valid = list.filter(file => file.type === 'application/pdf' || /\.pdf$/i.test(file.name));
  } else if (tool === 'zip') {
    const mode = $('#zipMode')?.value || 'zip';
    valid = mode === 'unzip' ? list.filter(file => file.name.toLowerCase().endsWith('.zip')) : list;
  }
  if (!valid.length && list.length) { setStatus('That file type does not match this tool. Please choose a supported file.', 'error'); return; }
  fileState.files = tool === 'remove-background' || tool === 'form-photo' || tool === 'remove-metadata' || tool === 'pdf-split' || tool === 'pdf-organize' || tool === 'pdf-compress' || tool === 'pdf-to-images' ? valid.slice(0, 1) : [...fileState.files, ...valid];
  if (!document.body.dataset.multiple || document.body.dataset.multiple === 'false') fileState.files = fileState.files.slice(0, 1);
  clearResults(); renderFiles(); setStatus(`${fileState.files.length} ${fileState.files.length === 1 ? 'file' : 'files'} selected.`);
}
function renderFiles() {
  const root = $('#fileList'); if (!root) return;
  root.replaceChildren();
  fileState.files.forEach((file, index) => {
    const row = document.createElement('div'); row.className = 'file-row';
    const name = document.createElement('span'); name.className = 'file-row-name'; name.textContent = file.name;
    const size = document.createElement('small'); size.textContent = humanSize(file.size);
    row.append(name, size);
    if (fileState.files.length > 1) {
      for (const [label, delta] of [['↑', -1], ['↓', 1]]) {
        const move = document.createElement('button'); move.type = 'button'; move.textContent = label; move.title = `Move ${label === '↑' ? 'up' : 'down'}`; move.disabled = index + delta < 0 || index + delta >= fileState.files.length;
        move.addEventListener('click', () => { const j = index + delta; [fileState.files[index], fileState.files[j]] = [fileState.files[j], fileState.files[index]]; renderFiles(); }); row.append(move);
      }
    }
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.title = `Remove ${file.name}`;
    remove.addEventListener('click', () => { fileState.files.splice(index, 1); renderFiles(); setStatus(`${fileState.files.length} files selected.`); }); row.append(remove); root.append(row);
  });
}

function field(id, label, type, value = '', hint = '', attrs = '') {
  const wide = attrs.includes('data-wide') ? ' wide' : '';
  const cleanAttrs = attrs.replace('data-wide', '');
  return `<div class="control${wide}"><label for="${id}">${label}</label><input id="${id}" type="${type}" value="${value}" ${cleanAttrs}>${hint ? `<small class="help">${hint}</small>` : ''}</div>`;
}
function selectField(id, label, options, hint = '') {
  return `<div class="control"><label for="${id}">${label}</label><select id="${id}">${options.map(([v, text]) => `<option value="${v}">${text}</option>`).join('')}</select>${hint ? `<small class="help">${hint}</small>` : ''}</div>`;
}
function textareaField(id, label, placeholder, rows = 7) {
  return `<div class="control wide"><label for="${id}">${label}</label><textarea id="${id}" rows="${rows}" placeholder="${placeholder}"></textarea></div>`;
}
function rangeField(id, label, value, min, max, suffix = '%') {
  return `<div class="control"><label for="${id}">${label} <output id="${id}Value">${value}${suffix}</output></label><input id="${id}" type="range" min="${min}" max="${max}" value="${value}" data-output="${id}Value" data-suffix="${suffix}"></div>`;
}
function checkboxField(id, label, checked = true) {
  return `<div class="control inline"><input id="${id}" type="checkbox" ${checked ? 'checked' : ''}><label for="${id}">${label}</label></div>`;
}
function renderControls() {
  const root = $('#quickToolControls'); if (!root) return;
  const tool = document.body.dataset.tool;
  const imageFormats = [['image/jpeg','JPG'],['image/png','PNG'],['image/webp','WebP']];
  let html = '';
  if (tool === 'image-resize') html = `${field('width','New width (pixels)','number','1200','','min="1" max="12000"')}${field('height','New height (pixels)','number','','Leave empty to keep the original ratio.','min="1" max="12000"')}${checkboxField('keepRatio','Keep the image proportions',true)}${selectField('format','Save as',imageFormats)}${rangeField('quality','Image quality',88,40,100)}`;
  if (tool === 'image-compress') html = `${field('targetKB','Maximum size (KB)','number','300','The tool will try the best quality that fits.','min="5" max="50000"')}${field('maxWidth','Maximum width (pixels)','number','','Optional; leave empty to keep the current width.','min="64" max="12000"')}${selectField('format','Save as',[['image/jpeg','JPG'],['image/webp','WebP']])}${rangeField('quality','Starting quality',86,20,100)}`;
  if (tool === 'image-convert') html = `${selectField('format','New file format',imageFormats,'This writes a new file in the selected format.')}${field('background','Background for JPG','color','#ffffff','JPG does not keep transparency.')}${rangeField('quality','Image quality',90,40,100)}`;
  if (tool === 'crop-rotate') html = `<div class="control wide"><span class="control-label">Crop box (% of original image)</span><div class="range-pair">${field('cropX','Left','number','0','','min="0" max="99"')}${field('cropY','Top','number','0','','min="0" max="99"')}${field('cropW','Width','number','100','','min="1" max="100"')}${field('cropH','Height','number','100','','min="1" max="100"')}</div></div>${selectField('rotation','Rotate',[['0','No turn'],['90','90° right'],['180','180°'],['270','90° left']])}${checkboxField('flipH','Flip horizontally',false)}${selectField('format','Save as',imageFormats)}${rangeField('quality','Image quality',90,40,100)}`;
  if (tool === 'form-photo') html = `${field('width','Required width (pixels)','number','','Enter the value shown by your form.','min="1" max="6000"')}${field('height','Required height (pixels)','number','','Enter the value shown by your form.','min="1" max="6000"')}${field('targetKB','Maximum file size (KB)','number','','Optional. Leave blank to skip size targeting.','min="5" max="20000"')}${selectField('format','Save as',[['image/jpeg','JPG'],['image/png','PNG'],['image/webp','WebP']])}${checkboxField('centerCrop','Crop to fit dimensions (no stretching)',true)}`;
  if (tool === 'remove-metadata') html = `${selectField('format','Save clean copy as',imageFormats)}${rangeField('quality','JPEG/WebP quality',91,40,100)}<p class="inline-help control wide">The image is decoded and saved again in your browser. This strips common camera metadata; it does not edit pixels beyond format encoding.</p>`;
  if (tool === 'remove-background') html = `${rangeField('softness','Edge softness',2,0,8,' px')}<p class="inline-help control wide">This local model focuses on people. It is not a general object remover and can leave rough edges around hair or transparent items.</p>`;
  if (tool === 'slideshow') html = `${field('secondsPerPhoto','Seconds per photo','number','3','Choose 1 to 15 seconds.','min="1" max="15" step="0.5"')}${selectField('aspect','Video shape',[['landscape','Landscape · 16:9'],['portrait','Portrait · 9:16'],['square','Square · 1:1']])}${selectField('transition','Transition',[['crossfade','Gentle crossfade'],['cut','Simple cut']])}${field('slideBackground','Background color','color','#efe9dc','Used behind photos that do not fill the frame.')}`;
  if (tool === 'photos-to-pdf') html = `${selectField('pageSize','Page size',[['a4','A4'],['letter','US Letter'],['fit','Fit each photo']])}${selectField('orientation','Orientation',[['auto','Match each photo'],['portrait','Portrait'],['landscape','Landscape']])}${field('margin','Margin (mm)','number','10','Use 0 for edge-to-edge.','min="0" max="40" step="1"')}`;
  if (tool === 'pdf-merge') html = `${field('outputName','Output file name','text','merged-document','Without the .pdf ending.')}`;
  if (tool === 'pdf-split') html = `${field('pageRange','Pages to keep','text','1','Examples: 1,3-5,8','placeholder="1,3-5"')}`;
  if (tool === 'pdf-organize') html = `${selectField('rotation','Rotate every page',[['0','No rotation'],['90','90° clockwise'],['180','180°'],['270','90° counter-clockwise']])}${field('removePages','Pages to remove','text','','Optional. Example: 2,5-6','placeholder="2,5-6"')}${field('pageOrder','New page order','text','','Optional: list every page once, e.g. 3,1,2','placeholder="3,1,2"')}`;
  if (tool === 'pdf-compress') html = `${selectField('dpi','Page resolution',[['144','144 DPI · clearer'],['110','110 DPI · smaller'],['80','80 DPI · smallest']])}${rangeField('pdfQuality','JPEG quality',72,35,92)}<p class="tiny-warning control wide">This makes a new flattened PDF. Text will become part of the page image, so it will not be selectable or searchable.</p>`;
  if (tool === 'pdf-to-images') html = `${field('pageRange','Pages to convert','text','','Leave blank for all pages. Example: 1,3-5','placeholder="all pages"')}${selectField('format','Image format',[['image/jpeg','JPG'],['image/png','PNG']])}${selectField('scale','Image size',[['1','Standard'],['1.5','Large'],['2','Extra large']])}`;
  if (tool === 'zip') html = `${selectField('zipMode','What do you want to do?',[['zip','Create a ZIP'],['unzip','Unpack a ZIP']])}${field('archiveName','ZIP file name','text','my-files','Used when creating a ZIP. Do not include .zip.')}`;
  if (tool === 'qr-code') html = `${textareaField('qrText','Text or link','Paste a website address or short text here.',3)}${field('qrSize','QR image size (pixels)','number','512','','min="160" max="1600" step="16"')}${selectField('qrCorrection','Damage correction',[['M','Standard'],['Q','More resistant'],['H','Most resistant']])}`;
  if (tool === 'word-counter') html = `${textareaField('textInput','Your text','Type or paste your text here. It stays in this page.',10)}`;
  if (tool === 'text-cleaner') html = `${textareaField('textInput','Text to clean','Paste your lines here.',8)}${selectField('cleanAction','Cleanup action',[['trim','Trim spaces on each line'],['remove-empty','Remove blank lines'],['dedupe','Remove duplicate lines'],['sort','Sort lines A–Z'],['lower','lowercase'],['upper','UPPERCASE'],['title','Title Case']])}<div class="control wide"><label for="textOutput">Cleaned text</label><textarea id="textOutput" rows="8" readonly placeholder="Your cleaned text will appear here."></textarea></div>`;
  if (tool === 'json-formatter') html = `${textareaField('jsonInput','JSON to check','Paste JSON here.',10)}${selectField('jsonMode','Output',[['pretty','Readable / indented'],['minify','Minified']])}<div class="control wide"><label for="jsonOutput">Result</label><textarea id="jsonOutput" rows="9" readonly placeholder="Formatted JSON will appear here."></textarea></div>`;
  root.innerHTML = html;
  $$('input[type="range"][data-output]', root).forEach((input) => input.addEventListener('input', () => { const out = document.getElementById(input.dataset.output); if (out) out.textContent = `${input.value}${input.dataset.suffix || ''}`; }));
}

function initFileInput() {
  const input = $('#fileInput'), drop = $('#dropzone');
  if (input) input.addEventListener('change', () => addFiles(input.files));
  if (!drop) return;
  for (const eventName of ['dragenter', 'dragover']) drop.addEventListener(eventName, event => { event.preventDefault(); drop.classList.add('is-over'); });
  for (const eventName of ['dragleave', 'drop']) drop.addEventListener(eventName, event => { event.preventDefault(); drop.classList.remove('is-over'); });
  drop.addEventListener('drop', event => addFiles(event.dataTransfer.files));
}
function initToolButtons() {
  $('#runTool')?.addEventListener('click', runTool);
  $('#resetTool')?.addEventListener('click', () => location.reload());
  $('#copyResult')?.addEventListener('click', copyTextResult);
  $('#zipMode')?.addEventListener('change', () => { fileState.files = []; clearResults(); renderFiles(); setStatus('Choose files for the selected ZIP action.'); });
  $('#textInput')?.addEventListener('input', updateWordCount);
}
function updateWordCount() {
  const input = $('#textInput'), stats = $('#textStats'); if (!input || !stats) return;
  const text = input.value; const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
  const characters = [...text].length; const noSpaces = [...text.replace(/\s/gu, '')].length;
  const lines = text ? text.split(/\r\n|\r|\n/).length : 0; const minutes = words ? Math.max(1, Math.ceil(words / 200)) : 0;
  stats.innerHTML = `<span class="text-stat"><b>${words}</b> words</span><span class="text-stat"><b>${characters}</b> characters</span><span class="text-stat"><b>${noSpaces}</b> without spaces</span><span class="text-stat"><b>${lines}</b> lines</span><span class="text-stat"><b>${minutes}</b> min read</span>`;
}

async function runTool() {
  const tool = document.body.dataset.tool;
  const button = $('#runTool'); if (button) button.disabled = true;
  clearResults(); setProgress(0); setStatus('Working in your browser…');
  try {
    let results;
    if (['image-resize','image-compress','image-convert','crop-rotate','form-photo','remove-metadata'].includes(tool)) results = await runImageOperation(tool);
    else if (tool === 'remove-background') results = await runBackgroundRemoval();
    else if (tool === 'photos-to-pdf') results = [await imagesToPdf()];
    else if (tool === 'pdf-merge') results = [await mergePdfs()];
    else if (tool === 'pdf-split') results = [await splitPdf()];
    else if (tool === 'pdf-organize') results = [await organizePdf()];
    else if (tool === 'pdf-compress') results = [await compressPdf()];
    else if (tool === 'pdf-to-images') results = await pdfToImages();
    else if (tool === 'zip') results = await runZip();
    else if (tool === 'qr-code') results = [await makeQr()];
    else if (tool === 'text-cleaner') { cleanText(); return; }
    else if (tool === 'json-formatter') { formatJson(); return; }
    else if (tool === 'word-counter') { updateWordCount(); setStatus('Counts update as you type.', 'success'); return; }
    else if (tool === 'slideshow') results = [await makeSlideshow()];
    else throw new Error('This tool is not available yet.');
    showResults(results, results.length > 1 ? `${results.length} files are ready` : 'Your file is ready');
    setStatus('Done. Check the result before using or sharing it.', 'success'); setProgress(100, false);
  } catch (error) {
    console.error(error); setStatus(error instanceof Error ? error.message : 'That file could not be processed. Try another file.', 'error'); setProgress(0, false);
  } finally {
    if (button) button.disabled = false;
  }
}

function requireFiles(min = 1) {
  if (fileState.files.length < min) throw new Error(`Choose ${min > 1 ? 'at least ' + min + ' files' : 'a file'} first.`);
  return fileState.files;
}
function readNumber(id, fallback = 0) { const value = Number($(id)?.value); return Number.isFinite(value) ? value : fallback; }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function getFormat() { return $('#format')?.value || 'image/jpeg'; }
function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('The browser could not make that image format.')), type, quality));
}
function makeCanvas(width, height) { const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(width)); canvas.height = Math.max(1, Math.round(height)); return canvas; }
async function fileToBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch { /* SVGs and some browser-supported formats need the Image element path. */ }
  }
  const url = URL.createObjectURL(file);
  try { const image = await new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('The image could not be opened.')); img.src = url; }); return image; }
  finally { URL.revokeObjectURL(url); }
}
function imageDims(bitmap) { return { width: bitmap.width || bitmap.naturalWidth, height: bitmap.height || bitmap.naturalHeight }; }
function applyCrop(bitmap, mode) {
  const { width, height } = imageDims(bitmap);
  let sx = 0, sy = 0, sw = width, sh = height;
  if (mode === 'crop') {
    sx = width * clamp(readNumber('#cropX'), 0, 99) / 100; sy = height * clamp(readNumber('#cropY'), 0, 99) / 100;
    sw = width * clamp(readNumber('#cropW', 100), 1, 100) / 100; sh = height * clamp(readNumber('#cropH', 100), 1, 100) / 100;
    sw = Math.min(sw, width - sx); sh = Math.min(sh, height - sy);
  } else if (mode === 'form' && $('#centerCrop')?.checked) {
    const wantedW = readNumber('#width'), wantedH = readNumber('#height');
    if (wantedW > 0 && wantedH > 0) {
      const targetRatio = wantedW / wantedH, sourceRatio = width / height;
      if (sourceRatio > targetRatio) { sw = height * targetRatio; sx = (width - sw) / 2; }
      else { sh = width / targetRatio; sy = (height - sh) / 2; }
    }
  }
  const crop = makeCanvas(sw, sh); crop.getContext('2d').drawImage(bitmap, sx, sy, sw, sh, 0, 0, crop.width, crop.height); return crop;
}
function transformCanvas(source, mode) {
  let canvas = source;
  if (mode === 'crop') canvas = applyCrop(source, 'crop');
  if (mode === 'form') canvas = applyCrop(source, 'form');
  const angle = mode === 'crop' ? readNumber('#rotation') : 0;
  const flip = mode === 'crop' && $('#flipH')?.checked;
  let out = makeCanvas((angle === 90 || angle === 270) ? canvas.height : canvas.width, (angle === 90 || angle === 270) ? canvas.width : canvas.height);
  let ctx = out.getContext('2d');
  if (getFormat() === 'image/jpeg') {
    ctx.fillStyle = $('#background')?.value || '#ffffff'; ctx.fillRect(0, 0, out.width, out.height);
  }
  ctx.translate(out.width / 2, out.height / 2); ctx.rotate(angle * Math.PI / 180); if (flip) ctx.scale(-1, 1);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  if (mode === 'image-resize' || mode === 'form') {
    const desiredW = readNumber('#width'), desiredH = readNumber('#height');
    if (desiredW > 0 || desiredH > 0) {
      let width = desiredW || out.width * desiredH / out.height, height = desiredH || out.height * desiredW / out.width;
      const keep = mode === 'image-resize' ? $('#keepRatio')?.checked : $('#centerCrop')?.checked;
      if (mode === 'image-resize' && keep && desiredW > 0 && desiredH > 0) { const scale = Math.min(desiredW / out.width, desiredH / out.height); width = out.width * scale; height = out.height * scale; }
      const resized = makeCanvas(width, height); const rctx = resized.getContext('2d');
      rctx.imageSmoothingEnabled = true; rctx.imageSmoothingQuality = 'high';
      if (mode === 'form' && !$('#centerCrop')?.checked) { rctx.drawImage(out, 0, 0, resized.width, resized.height); }
      else { const scale = Math.min(resized.width / out.width, resized.height / out.height); const w = out.width * scale, h = out.height * scale; rctx.drawImage(out, (resized.width - w) / 2, (resized.height - h) / 2, w, h); }
      out = resized;
    }
  }
  return out;
}
async function encodeImage(canvas, mime, quality, targetKB = 0) {
  const qMin = .25, qMax = clamp(quality, .4, 1);
  let bestCanvas = canvas; let best = await canvasBlob(canvas, mime, qMax);
  if (targetKB > 0 && mime !== 'image/png') {
    const limit = targetKB * 1024; let low = qMin, high = qMax;
    if (best.size > limit) {
      let candidate = null;
      for (let i = 0; i < 8; i++) {
        const mid = (low + high) / 2; const blob = await canvasBlob(canvas, mime, mid);
        if (blob.size <= limit) { candidate = blob; low = mid; } else high = mid;
      }
      if (candidate) best = candidate;
    }
    if (best.size > limit) {
      let current = canvas;
      for (let i = 0; i < 5 && best.size > limit && current.width > 240 && current.height > 240; i++) {
        const smaller = makeCanvas(current.width * .82, current.height * .82); const ctx = smaller.getContext('2d'); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(current, 0, 0, smaller.width, smaller.height); current = smaller; best = await canvasBlob(current, mime, .62);
      }
      bestCanvas = current;
    }
  }
  return { blob: best, width: bestCanvas.width, height: bestCanvas.height };
}
function extensionFor(type) { return ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf', 'video/webm': 'webm', 'application/zip': 'zip' })[type] || 'bin'; }
async function runImageOperation(tool) {
  const files = requireFiles(); const outputs = []; const mime = tool === 'image-compress' ? ($('#format')?.value || 'image/jpeg') : getFormat();
  for (let i = 0; i < files.length; i++) {
    setStatus(`Preparing image ${i + 1} of ${files.length}…`); setProgress((i / files.length) * 100);
    const bitmap = await fileToBitmap(files[i]);
    try {
      const mode = tool === 'crop-rotate' ? 'crop' : tool === 'form-photo' ? 'form' : tool;
      let canvas = transformCanvas(bitmap, mode);
      if (tool === 'image-compress') {
        const cap = readNumber('#maxWidth');
        if (cap > 0 && canvas.width > cap) { const scaled = makeCanvas(cap, canvas.height * cap / canvas.width); const cx = scaled.getContext('2d'); cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high'; cx.drawImage(canvas, 0, 0, scaled.width, scaled.height); canvas = scaled; }
      }
      let type = mime;
      if (tool === 'remove-metadata') type = getFormat();
      if (tool === 'form-photo' && !$('#width')?.value && !$('#height')?.value) setStatus('No dimensions entered; saving a clean copy at the original pixel size.');
      const quality = readNumber(tool === 'image-compress' ? '#quality' : tool === 'remove-metadata' ? '#quality' : '#quality', 88) / 100;
      const targetKB = tool === 'image-compress' || tool === 'form-photo' ? readNumber('#targetKB') : 0;
      const encoded = await encodeImage(canvas, type, quality, targetKB);
      const { blob, width, height } = encoded;
      let sizeNote = '';
      if (targetKB > 0 && type === 'image/png') sizeNote = ` · PNG is lossless; the ${targetKB} KB target is not applied`;
      else if (targetKB > 0 && blob.size > targetKB * 1024) sizeNote = ` · Could not reach ${targetKB} KB (current ${humanSize(blob.size)}); try smaller dimensions or a larger limit`;
      const name = `${stem(files[i].name)}-${tool === 'image-resize' ? 'resized' : tool === 'image-compress' ? 'compressed' : tool === 'image-convert' ? 'converted' : tool === 'form-photo' ? 'form-ready' : tool === 'remove-metadata' ? 'clean' : 'edited'}.${extensionFor(type)}`;
      outputs.push({ blob, name, kind: 'image', note: `${width} × ${height} px · from ${humanSize(files[i].size)}${sizeNote}` });
    } finally { bitmap.close?.(); }
  }
  if (outputs.length > 1) {
    setStatus('Making a ZIP copy of all processed images…');
    const { zipSync } = await import('fflate'); const entries = {};
    for (const out of outputs) entries[out.name] = new Uint8Array(await out.blob.arrayBuffer());
    outputs.push({ blob: new Blob([zipSync(entries, { level: 5 })], { type: 'application/zip' }), name: 'processed-images.zip', kind: 'file', note: `${outputs.length} processed images` });
  }
  return outputs;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (window.SelfieSegmentation) { resolve(); return; }
    const script = document.createElement('script'); script.src = src; script.onload = resolve; script.onerror = () => reject(new Error('The on-device model could not load. Try a current desktop browser.')); document.head.append(script);
  });
}
async function runBackgroundRemoval() {
  const file = requireFiles()[0]; setStatus('Loading the on-device person model…'); setProgress(8);
  await loadScript(assetUrl('assets/vendor/selfie-segmentation/selfie_segmentation.js'));
  const bitmap = await fileToBitmap(file); const { width, height } = imageDims(bitmap);
  const image = document.createElement('img'); const url = URL.createObjectURL(file);
  try {
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('Could not read this image.')); image.src = url; });
    const maskSoftness = readNumber('#softness', 2);
    const segmentation = new window.SelfieSegmentation({ locateFile: (name) => assetUrl(`assets/vendor/selfie-segmentation/${name}`) });
    segmentation.setOptions({ modelSelection: 0 });
    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Background removal took too long on this device. Try a smaller photo.')), 60000);
      segmentation.onResults((res) => {
        clearTimeout(timeout);
        try {
          const output = makeCanvas(width, height); const ctx = output.getContext('2d'); ctx.drawImage(res.image, 0, 0, width, height);
          if (maskSoftness > 0) { const mask = makeCanvas(width, height); const mctx = mask.getContext('2d'); mctx.filter = `blur(${maskSoftness}px)`; mctx.drawImage(res.segmentationMask, 0, 0, width, height); ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(mask, 0, 0); }
          else { ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(res.segmentationMask, 0, 0, width, height); }
          resolve(output);
        } catch (error) { reject(error); }
      });
      setStatus('Finding the person in your photo…');
      segmentation.send({ image }).then(() => setProgress(72)).catch(reject);
    });
    await segmentation.close();
    const blob = await canvasBlob(result, 'image/png');
    return [{ blob, name: `${stem(file.name)}-background-removed.png`, kind: 'image', note: `${width} × ${height} px · transparent PNG` }];
  } finally { URL.revokeObjectURL(url); bitmap.close?.(); }
}

function parsePageList(expression, maxPages, allowBlank = false) {
  const text = String(expression || '').trim(); if (!text && allowBlank) return Array.from({ length: maxPages }, (_, i) => i + 1);
  if (!text) throw new Error('Enter page numbers, such as 1,3-5.');
  const pages = new Set();
  for (const item of text.split(',')) {
    const part = item.trim(); if (!part) continue;
    const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error(`“${part}” is not a page number or range.`);
    const start = Number(match[1]), end = Number(match[2] || match[1]);
    if (start < 1 || end < start || end > maxPages) throw new Error(`Page range “${part}” is outside this ${maxPages}-page PDF.`);
    for (let page = start; page <= end; page++) pages.add(page);
  }
  return [...pages].sort((a, b) => a - b);
}
async function loadPdfDocument(file) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = assetUrl('assets/js/pdf.worker.mjs');
  const bytes = new Uint8Array(await file.arrayBuffer());
  return { pdfjs, bytes, loading: pdfjs.getDocument({ data: bytes, useWorkerFetch: false }) };
}
async function pdfBlob(doc, name) { const bytes = await doc.save({ useObjectStreams: true }); return { blob: new Blob([bytes], { type: 'application/pdf' }), name, kind: 'file', note: 'PDF' }; }
async function imagesToPdf() {
  const files = requireFiles(); const { PDFDocument } = await import('pdf-lib'); const doc = await PDFDocument.create();
  const pageSize = $('#pageSize')?.value || 'a4', orientation = $('#orientation')?.value || 'auto'; const margin = readNumber('#margin', 10) * 72 / 25.4;
  for (let i = 0; i < files.length; i++) {
    setStatus(`Adding photo ${i + 1} of ${files.length}…`); setProgress(((i + 1) / files.length) * 75);
    let bytes = new Uint8Array(await files[i].arrayBuffer()); let image;
    const type = files[i].type.toLowerCase();
    if (type === 'image/png' || /\.png$/i.test(files[i].name)) image = await doc.embedPng(bytes);
    else if (type === 'image/jpeg' || type === 'image/jpg' || /\.jpe?g$/i.test(files[i].name)) image = await doc.embedJpg(bytes);
    else { const bitmap = await fileToBitmap(files[i]); try { const canvas = makeCanvas(bitmap.width, bitmap.height); canvas.getContext('2d').drawImage(bitmap, 0, 0); const jpg = await canvasBlob(canvas, 'image/jpeg', .92); image = await doc.embedJpg(new Uint8Array(await jpg.arrayBuffer())); } finally { bitmap.close?.(); } }
    let w, h;
    if (pageSize === 'fit') { w = image.width + margin * 2; h = image.height + margin * 2; }
    else { [w, h] = pageSize === 'letter' ? [612, 792] : [595.28, 841.89]; const landscape = orientation === 'landscape' || orientation === 'auto' && image.width > image.height; if (landscape) [w, h] = [h, w]; }
    if (orientation === 'portrait' && w > h || orientation === 'landscape' && h > w) [w, h] = [h, w];
    const page = doc.addPage([w, h]); const maxW = Math.max(1, w - margin * 2), maxH = Math.max(1, h - margin * 2); const scale = Math.min(maxW / image.width, maxH / image.height);
    const drawW = image.width * scale, drawH = image.height * scale;
    page.drawImage(image, { x: (w - drawW) / 2, y: (h - drawH) / 2, width: drawW, height: drawH });
  }
  setProgress(90); return pdfBlob(doc, 'photos-document.pdf');
}
async function mergePdfs() {
  const files = requireFiles(2); const { PDFDocument } = await import('pdf-lib'); const out = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    setStatus(`Reading PDF ${i + 1} of ${files.length}…`); setProgress((i / files.length) * 80);
    const doc = await PDFDocument.load(await files[i].arrayBuffer()); const pages = await out.copyPages(doc, doc.getPageIndices()); pages.forEach(page => out.addPage(page));
  }
  const base = stem($('#outputName')?.value || 'merged-document'); return pdfBlob(out, `${base}.pdf`);
}
async function splitPdf() {
  const file = requireFiles()[0]; const { PDFDocument } = await import('pdf-lib'); const source = await PDFDocument.load(await file.arrayBuffer());
  const pages = parsePageList($('#pageRange')?.value, source.getPageCount()); const out = await PDFDocument.create();
  const copied = await out.copyPages(source, pages.map(n => n - 1)); copied.forEach(page => out.addPage(page)); setProgress(85);
  return pdfBlob(out, `${stem(file.name)}-pages-${pages.join('-')}.pdf`);
}
function parsePageOrder(expression, maxPages) {
  const output = [];
  for (const item of String(expression || '').split(',')) {
    const part = item.trim(); if (!part) continue;
    const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error(`“${part}” is not a page number or range.`);
    const start = Number(match[1]), end = Number(match[2] || match[1]);
    if (start < 1 || end < start || end > maxPages) throw new Error(`Page range “${part}” is outside this ${maxPages}-page PDF.`);
    for (let page = start; page <= end; page++) output.push(page);
  }
  return output;
}
async function organizePdf() {
  const file = requireFiles()[0]; const { PDFDocument, degrees } = await import('pdf-lib'); const source = await PDFDocument.load(await file.arrayBuffer());
  const max = source.getPageCount(), removeText = $('#removePages')?.value.trim(); const removed = removeText ? new Set(parsePageList(removeText, max)) : new Set();
  let pages = Array.from({ length: max }, (_, i) => i + 1).filter(page => !removed.has(page));
  const orderText = $('#pageOrder')?.value.trim();
  if (orderText) {
    const ordered = parsePageOrder(orderText, max);
    if (ordered.length !== pages.length || new Set(ordered).size !== pages.length || ordered.some(n => removed.has(n))) throw new Error('New page order must list each remaining page once, without removed pages.');
    pages = ordered;
  }
  if (!pages.length) throw new Error('At least one page must remain.');
  const out = await PDFDocument.create(); const copied = await out.copyPages(source, pages.map(n => n - 1)); const rotation = readNumber('#rotation');
  copied.forEach(page => { if (rotation) page.setRotation(degrees((page.getRotation().angle + rotation) % 360)); out.addPage(page); });
  return pdfBlob(out, `${stem(file.name)}-organized.pdf`);
}
async function renderPdfPage(pdfjs, pdf, pageNumber, scale) {
  const page = await pdf.getPage(pageNumber); const viewport = page.getViewport({ scale }); const canvas = makeCanvas(viewport.width, viewport.height); const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport, background: '#fff' }).promise; return { canvas, viewport, page };
}
async function compressPdf() {
  const file = requireFiles()[0]; const { PDFDocument } = await import('pdf-lib'); const loaded = await loadPdfDocument(file); const pdf = await loaded.loading.promise;
  const out = await PDFDocument.create(); const dpi = readNumber('#dpi', 110), quality = readNumber('#pdfQuality', 72) / 100;
  for (let i = 1; i <= pdf.numPages; i++) {
    setStatus(`Flattening page ${i} of ${pdf.numPages}…`); setProgress((i / pdf.numPages) * 85);
    const { canvas, viewport, page } = await renderPdfPage(loaded.pdfjs, pdf, i, dpi / 72);
    const jpg = await canvasBlob(canvas, 'image/jpeg', quality); const image = await out.embedJpg(new Uint8Array(await jpg.arrayBuffer()));
    const pageOut = out.addPage([viewport.width * 72 / dpi, viewport.height * 72 / dpi]); pageOut.drawImage(image, { x: 0, y: 0, width: pageOut.getWidth(), height: pageOut.getHeight() }); page.cleanup();
  }
  await pdf.destroy(); return pdfBlob(out, `${stem(file.name)}-smaller.pdf`);
}
async function pdfToImages() {
  const file = requireFiles()[0]; const loaded = await loadPdfDocument(file); const pdf = await loaded.loading.promise; const pages = parsePageList($('#pageRange')?.value, pdf.numPages, true); const scale = readNumber('#scale', 1.5); const type = $('#format')?.value || 'image/jpeg'; const outputs = [];
  for (let i = 0; i < pages.length; i++) {
    const n = pages[i]; setStatus(`Rendering page ${n} of ${pdf.numPages}…`); setProgress((i / pages.length) * 85);
    const { canvas, page } = await renderPdfPage(loaded.pdfjs, pdf, n, scale); const blob = await canvasBlob(canvas, type, .92);
    outputs.push({ blob, name: `${stem(file.name)}-page-${String(n).padStart(3, '0')}.${extensionFor(type)}`, kind: 'image' }); page.cleanup();
  }
  await pdf.destroy();
  if (outputs.length > 1) {
    setStatus('Packing page images into a ZIP…'); const { zipSync } = await import('fflate'); const entries = {};
    for (const item of outputs) entries[item.name] = new Uint8Array(await item.blob.arrayBuffer());
    outputs.push({ blob: new Blob([zipSync(entries, { level: 4 })], { type: 'application/zip' }), name: `${stem(file.name)}-pages.zip`, kind: 'file' });
  }
  return outputs;
}

function uniqueName(name, used) { let base = name, i = 2; while (used.has(base)) { const dot = name.lastIndexOf('.'); base = dot > 0 ? `${name.slice(0, dot)}-${i}${name.slice(dot)}` : `${name}-${i}`; i++; } used.add(base); return base; }
async function runZip() {
  const files = requireFiles(); const { zipSync, unzipSync } = await import('fflate');
  if (($('#zipMode')?.value || 'zip') === 'unzip') {
    if (files.length !== 1) throw new Error('Choose one ZIP file to unpack at a time.');
    if (files[0].size > 100 * 1024 * 1024) throw new Error('This ZIP is over the 100 MB safety limit for browser processing.');
    setStatus('Reading the ZIP contents locally…'); const content = unzipSync(new Uint8Array(await files[0].arrayBuffer())); const entries = Object.entries(content).filter(([name, data]) => data.length && !name.endsWith('/'));
    if (!entries.length) throw new Error('No files were found in that ZIP.'); if (entries.length > 200) throw new Error('That archive contains more than 200 files. Try a smaller archive.');
    const used = new Set(); const outputs = entries.map(([path, data]) => { const name = uniqueName(path.split('/').pop().replace(/[\\/]/g, ''), used); return { blob: new Blob([data]), name, kind: 'file' }; });
    return outputs;
  }
  const used = new Set(), entries = {};
  for (let i = 0; i < files.length; i++) { setStatus(`Adding file ${i + 1} of ${files.length}…`); setProgress((i / files.length) * 80); const name = uniqueName(files[i].name.split(/[\\/]/).pop(), used); entries[name] = new Uint8Array(await files[i].arrayBuffer()); }
  const zipped = zipSync(entries, { level: 6 }); const base = stem($('#archiveName')?.value || 'my-files');
  return [{ blob: new Blob([zipped], { type: 'application/zip' }), name: `${base}.zip`, kind: 'file', note: `${files.length} files` }];
}
async function makeQr() {
  const text = $('#qrText')?.value.trim(); if (!text) throw new Error('Enter a link or short message for the QR code.');
  if (text.length > 1800) throw new Error('Please keep QR content under 1,800 characters for a clearer code.');
  const qrModule = await import('qrcode'); const QRCode = qrModule.default || qrModule; const size = clamp(readNumber('#qrSize', 512), 160, 1600);
  const data = await QRCode.toDataURL(text, { width: size, margin: 3, errorCorrectionLevel: $('#qrCorrection')?.value || 'M', color: { dark: '#26302e', light: '#fffdf8' } });
  const response = await fetch(data); const blob = await response.blob(); return { blob, name: 'handykit-qr.png', kind: 'qr' };
}
function cleanText() {
  const input = $('#textInput')?.value || ''; const action = $('#cleanAction')?.value || 'trim'; const lines = input.split(/\r\n|\r|\n/); let output = input;
  if (action === 'trim') output = lines.map(line => line.trim()).join('\n');
  if (action === 'remove-empty') output = lines.filter(line => line.trim()).join('\n');
  if (action === 'dedupe') output = [...new Set(lines.map(line => line.trim()).filter(Boolean))].join('\n');
  if (action === 'sort') output = lines.map(line => line.trim()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })).join('\n');
  if (action === 'lower') output = input.toLocaleLowerCase();
  if (action === 'upper') output = input.toLocaleUpperCase();
  if (action === 'title') output = input.toLocaleLowerCase().replace(/(^|\s)\p{L}/gu, char => char.toLocaleUpperCase());
  $('#textOutput').value = output; setStatus('Cleaned text is ready to copy.', 'success');
}
function formatJson() {
  const input = $('#jsonInput')?.value.trim(); if (!input) throw new Error('Paste JSON into the box first.');
  try { const object = JSON.parse(input); $('#jsonOutput').value = JSON.stringify(object, null, $('#jsonMode')?.value === 'minify' ? 0 : 2); setStatus('Valid JSON. Output is ready.', 'success'); }
  catch (error) { setStatus(`JSON error: ${error.message}`, 'error'); $('#jsonOutput').value = ''; }
}
async function copyTextResult() {
  const output = $('#textOutput')?.value || $('#jsonOutput')?.value || '';
  if (!output) { setStatus('There is no output to copy yet.', 'error'); return; }
  try { await navigator.clipboard.writeText(output); setStatus('Copied to clipboard.', 'success'); }
  catch { const node = $('#textOutput')?.value ? $('#textOutput') : $('#jsonOutput'); node?.select(); document.execCommand('copy'); setStatus('Output selected; copy it from your device.', 'success'); }
}

async function makeSlideshow() {
  const files = requireFiles(2); if (!('MediaRecorder' in window) || !HTMLCanvasElement.prototype.captureStream) throw new Error('This browser cannot export slideshow video. Try a recent desktop Chrome or Edge.');
  const bitmaps = [];
  try {
    for (let i = 0; i < files.length; i++) { setStatus(`Loading photo ${i + 1} of ${files.length}…`); bitmaps.push(await fileToBitmap(files[i])); }
    const aspect = $('#aspect')?.value || 'landscape'; const size = aspect === 'portrait' ? [720, 1280] : aspect === 'square' ? [720, 720] : [1280, 720]; const canvas = makeCanvas(size[0], size[1]); const ctx = canvas.getContext('2d');
    const seconds = clamp(readNumber('#secondsPerPhoto', 3), 1, 15); const fade = $('#transition')?.value === 'crossfade' ? Math.min(.7, seconds / 4) : 0; const total = seconds * bitmaps.length;
    const mime = ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(type => MediaRecorder.isTypeSupported(type));
    if (!mime) throw new Error('This browser does not support WebM video export. Try Chrome or Edge on desktop.');
    const stream = canvas.captureStream(24); const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2800000 }); const chunks = [];
    const stopped = new Promise((resolve, reject) => { recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); }; recorder.onerror = () => reject(new Error('The browser could not finish recording. Try fewer or smaller photos.')); recorder.onstop = () => resolve(new Blob(chunks, { type: mime })); });
    function drawFit(bitmap, alpha = 1) { const { width, height } = imageDims(bitmap); const scale = Math.max(canvas.width / width, canvas.height / height); const w = width * scale, h = height * scale; ctx.globalAlpha = alpha; ctx.drawImage(bitmap, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h); ctx.globalAlpha = 1; }
    const background = $('#slideBackground')?.value || '#efe9dc'; let start = 0;
    const draw = (now) => {
      if (!start) start = now; const elapsed = (now - start) / 1000;
      if (elapsed >= total) { if (recorder.state === 'recording') recorder.stop(); setProgress(100); return; }
      const index = Math.min(bitmaps.length - 1, Math.floor(elapsed / seconds)); const within = elapsed - index * seconds;
      ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height); drawFit(bitmaps[index]);
      if (fade && within > seconds - fade && index < bitmaps.length - 1) { const alpha = (within - (seconds - fade)) / fade; ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height); drawFit(bitmaps[index], 1 - alpha); drawFit(bitmaps[index + 1], alpha); }
      setProgress((elapsed / total) * 100); requestAnimationFrame(draw);
    };
    ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height); drawFit(bitmaps[0]); recorder.start(250); requestAnimationFrame(draw); setStatus(`Recording ${bitmaps.length} photos · about ${Math.ceil(total)} seconds…`);
    const blob = await Promise.race([stopped, new Promise((_, reject) => setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); reject(new Error('The video recorder timed out. Try fewer or smaller photos.')); }, Math.max(45000, total * 6000)))]);
    stream.getTracks().forEach(track => track.stop()); return { blob, name: 'handykit-slideshow.webm', kind: 'video', note: `${canvas.width} × ${canvas.height} px · WebM · no audio` };
  } finally { bitmaps.forEach(bitmap => bitmap.close?.()); }
}

function initTool() {
  const tool = document.body.dataset.tool; if (!tool) return;
  renderControls(); initFileInput(); initToolButtons();
  if (tool === 'word-counter') updateWordCount();
  if (tool === 'remove-background') {
    const status = $('#toolStatus'); if (status) status.textContent = 'Person cut-out runs on this device. It is not a general object remover.';
  }
}

initSiteSearch(); initDirectorySearch(); initCardTilt(); initTool();
