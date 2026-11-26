const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'motion-studio.html'), 'utf8');
const bundlePath = path.join(root, 'motion-studio.bundle.js');
if (!fs.existsSync(bundlePath)) throw new Error('Build the Motion Studio bundle before running this test.');
const bundle = fs.readFileSync(bundlePath, 'utf8');
const scriptErrors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', error => scriptErrors.push(error.message));

const dom = new JSDOM(html, {
  url: 'http://localhost/products/cueframe/motion-studio.html',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  virtualConsole,
});
const { window } = dom;
const { document } = window;
const downloads = [];
const blobs = new Map();
let blobSequence = 0;
let drawOperations = 0;

function contextFor(canvas) {
  const context = {
    canvas,
    fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, lineCap: 'butt', lineJoin: 'miter',
    globalAlpha: 1, font: '16px sans-serif', textAlign: 'start', textBaseline: 'alphabetic',
    save() { drawOperations++; }, restore() { drawOperations++; },
    clearRect() { drawOperations++; }, fillRect() { drawOperations++; },
    beginPath() { drawOperations++; }, arc() { drawOperations++; }, stroke() { drawOperations++; }, fill() { drawOperations++; },
    moveTo() {}, lineTo() {}, closePath() {}, quadraticCurveTo() {}, rect() {}, clip() {}, translate() {}, rotate() {}, scale() {},
    drawImage() { drawOperations++; }, strokeText() { drawOperations++; }, fillText() { drawOperations++; },
    measureText(text) { return { width: String(text).length * 9 }; },
    getImageData(_x, _y, width, height) { return { data: new Uint8ClampedArray(width * height * 4), width, height }; },
  };
  return context;
}

const contexts = new WeakMap();
Object.defineProperty(window.HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: function getContext() {
    if (!contexts.has(this)) contexts.set(this, contextFor(this));
    return contexts.get(this);
  },
});
Object.defineProperty(window.HTMLCanvasElement.prototype, 'toBlob', {
  configurable: true,
  value(callback, type = 'image/png') { callback(new window.Blob(['png-smoke-test'], { type })); },
});
Object.defineProperty(window.Element.prototype, 'getBoundingClientRect', {
  configurable: true,
  value: function getBoundingClientRect() {
    if (this.id === 'motionCanvas') return { x: 0, y: 0, left: 0, top: 0, right: 360, bottom: 640, width: 360, height: 640, toJSON() {} };
    if (this.classList?.contains('track')) return { x: 0, y: 0, left: 0, top: 0, right: 100, bottom: 21, width: 100, height: 21, toJSON() {} };
    return { x: 0, y: 0, left: 0, top: 0, right: 100, bottom: 40, width: 100, height: 40, toJSON() {} };
  },
});
window.URL.createObjectURL = blob => {
  const href = `blob:cueframe-test-${++blobSequence}`;
  blobs.set(href, blob);
  return href;
};
window.URL.revokeObjectURL = () => {};
window.HTMLAnchorElement.prototype.click = function click() {
  downloads.push({ filename: this.download, href: this.href });
};

function event(target, type, options = {}) {
  target.dispatchEvent(new window.Event(type, { bubbles: true, cancelable: true, ...options }));
}
function input(id, value, type = 'input') {
  const control = document.getElementById(id);
  control.value = String(value);
  event(control, type);
  return control;
}
function pointerLike(target, type, x, pointerId = 1) {
  const action = new window.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: 10, button: 0 });
  Object.defineProperty(action, 'pointerId', { value: pointerId });
  target.dispatchEvent(action);
}
function wait(ms = 20) { return new Promise(resolve => setTimeout(resolve, ms)); }
function waitFor(test, timeout = 5000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (test()) return resolve();
      if (Date.now() - started > timeout) return reject(new Error('Timed out waiting for editor action.'));
      setTimeout(check, 20);
    };
    check();
  });
}
function readBlob(blob, method = 'readAsText') {
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Could not read test blob'));
    reader[method](blob);
  });
}
function lastDownload() {
  const download = downloads.at(-1);
  assert.ok(download, 'expected an export download');
  const blob = blobs.get(download.href);
  assert.ok(blob, `download blob missing for ${download.filename}`);
  return { ...download, blob };
}

async function main() {
  window.eval(bundle);
  const q = selector => document.querySelector(selector);

  assert.equal(q('#layerList').querySelectorAll('.layer-row').length, 3, 'starter preset has three editable layers');
  assert.equal(q('#shapeField').hidden, false);
  assert.equal(q('#textField').hidden, true);
  assert.equal(q('#shapeSelect').value, 'ring');
  assert.ok(drawOperations > 0, 'canvas rendered the initial composition');

  for (const preset of ['focus','steps','pointer','orbit']) {
    q(`.preset[data-preset="${preset}"]`).click();
    assert.equal(q('#layerList').querySelectorAll('.layer-row').length, 3, `${preset} preset loads three layers`);
  }
  q('.preset[data-preset="steps"]').click();
  assert.equal(q('.preset[data-preset="steps"]').getAttribute('aria-pressed'), 'true');
  assert.equal(q('#shapeSelect').value, 'brackets');

  // Drag a timeline bar by half a beat; the inspector and displayed timing update together.
  let fill = q('.track-fill');
  pointerLike(fill, 'pointerdown', 10);
  pointerLike(fill, 'pointermove', 22);
  pointerLike(fill, 'pointerup', 22);
  assert.equal(q('#startBeatInput').value, '0.5');
  assert.match(q('.layer-row[aria-pressed="true"] .layer-beat').textContent, /^0\.5–2/);

  // The timeline background scrubs the playhead, and the standalone scrubber follows it.
  let track = q('.track');
  pointerLike(track, 'pointerdown', 50);
  assert.equal(q('#timecodeNow').textContent, '00:01.0');
  assert.equal(Number(q('#scrubInput').value), 500);

  for (const shape of ['ring','brackets','arrow','spark','burst','wave','scribble','pill','diamond','circle']) {
    input('shapeSelect', shape, 'change');
    assert.equal(q('#shapeSelect').value, shape);
  }
  for (const motion of ['draw','pop','slide','pulse','orbit','wipe','bounce','float','spin','beat-hit']) {
    input('motionSelect', motion, 'change');
    assert.equal(q('#motionSelect').value, motion);
  }
  for (const easing of ['smooth','snappy','spring','linear','bounce']) input('easingSelect', easing, 'change');
  input('shapeSelect', 'wave', 'change');
  input('motionSelect', 'orbit', 'change');
  input('layerName', 'Wave lead');
  input('xInput', 63);
  input('sizeInput', 60);
  input('fontSizeInput', 70);
  assert.equal(q('#sizeValue').textContent, '60%');
  assert.equal(q('#fontSizeValue').textContent, '70');
  assert.equal(q('#xValue').textContent, '63%');
  assert.equal(q('#shapeSelect').value, 'wave');
  assert.equal(q('#motionSelect').value, 'orbit');
  const canvas = q('#motionCanvas');
  pointerLike(canvas, 'pointerdown', 10);
  pointerLike(canvas, 'pointermove', 46);
  pointerLike(canvas, 'pointerup', 46);
  assert.equal(q('#xInput').value, '73', 'canvas drag moves the selected layer');

  q('#duplicateLayerBtn').click();
  assert.equal(q('#layerList').querySelectorAll('.layer-row').length, 4, 'selected layer can be duplicated');
  q('#deleteLayerBtn').click();
  assert.equal(q('#layerList').querySelectorAll('.layer-row').length, 3, 'duplicated layer can be deleted');

  q('#addTextBtn').click();
  assert.equal(q('#textField').hidden, false, 'text layer exposes editable copy');
  input('layerText', 'Hello <world> & friends');
  assert.equal(q('#layerText').value, 'Hello <world> & friends');
  assert.equal(q('#layerList').querySelectorAll('.layer-row').length, 4);

  input('bpmInput', 100);
  assert.equal(q('#durationBadge').textContent, '2.40s loop');
  input('loopBeats', 2, 'change');
  assert.equal(q('#beatGrid').querySelectorAll('.beat-cell').length, 2);
  assert.equal(q('#timelineRuler').querySelectorAll('span').length, 2);

  input('ratioSelect', 'wide', 'change');
  assert.equal(q('#stageShell').dataset.ratio, 'wide');
  assert.equal(q('#motionCanvas').width, 640);
  input('previewBackground', 'dark', 'change');
  assert.match(q('#checker').style.background, /radial-gradient/);

  q('#saveProjectBtn').click();
  const saved = lastDownload();
  assert.match(saved.filename, /\.cueframe$/);
  const project = JSON.parse(await readBlob(saved.blob));
  assert.equal(project.version, 1);
  assert.equal(project.bpm, 100);
  assert.equal(project.layers.length, 4);

  // Import is bounded and normalizes malformed numeric/style values rather than rendering invalid geometry.
  project.bpm = 900;
  project.loopBeats = 4;
  project.ratio = 'not-a-ratio';
  project.layers[0].x = 9999;
  project.layers[0].startBeat = 8;
  project.layers[0].lengthBeats = 80;
  project.layers[0].shape = 'url-javascript';
  project.layers[0].color = 'url(evil)';
  const projectFile = new window.File([JSON.stringify(project)], 'edited.cueframe', { type: 'application/json' });
  const projectInput = q('#projectFile');
  Object.defineProperty(projectInput, 'files', { configurable: true, value: [projectFile] });
  event(projectInput, 'change');
  await waitFor(() => q('#exportStatus').textContent.includes('Project loaded'));
  assert.equal(q('#bpmInput').value, '220');
  assert.equal(q('#ratioSelect').value, 'portrait');
  assert.equal(q('#xInput').value, '95');
  assert.equal(q('#shapeSelect').value, 'ring');
  assert.equal(q('#colorInput').value, '#62e5f4');
  assert.equal(q('#startBeatInput').value, '3.75');
  assert.equal(q('#lengthBeatInput').value, '0.25');

  // SVG is complete for all layer types and keeps the selected aspect ratio and editable text escaped.
  input('ratioSelect', 'wide', 'change');
  q('#exportSvgBtn').click();
  const svgDownload = lastDownload();
  assert.match(svgDownload.filename, /\.svg$/);
  const svg = String(await readBlob(svgDownload.blob));
  const parsedSvg = new window.DOMParser().parseFromString(svg, 'image/svg+xml');
  assert.equal(parsedSvg.querySelector('parsererror'), null, 'animated SVG parses as XML');
  assert.equal(parsedSvg.documentElement.getAttribute('width'), '1920');
  assert.ok(parsedSvg.querySelectorAll('animateTransform').length > 0, 'SVG includes motion keyframes');
  assert.ok(svg.includes('layer-1'), 'SVG includes layer markup');
  assert.ok(svg.includes('Hello &lt;world&gt; &amp; friends'), 'SVG text is XML-escaped');
  assert.ok([...parsedSvg.querySelectorAll('text')].some(node => node.textContent === 'Hello <world> & friends'));

  q('#exportPngBtn').click();
  assert.match(lastDownload().filename, /\.png$/);
  assert.equal(lastDownload().blob.type, 'image/png');

  assert.match(q('#exportVideoBtn').textContent, /not supported here/i, 'unsupported browser gets an honest video-export state');
  q('#exportVideoBtn').click();
  assert.match(q('#exportStatus').textContent, /cannot record a canvas video/i);

  // Canvas-stream setup, recorder construction/start, and asynchronous errors all release the export lock.
  let stoppedTracks = 0;
  let failureMode = '';
  Object.defineProperty(window.HTMLCanvasElement.prototype, 'captureStream', {
    configurable: true,
    value() {
      if (failureMode === 'capture') throw new Error('simulated captureStream failure');
      return { getTracks: () => [{ stop() { stoppedTracks++; } }] };
    },
  });
  for (const failure of ['capture', 'constructor', 'start', 'event']) {
    failureMode = failure;
    window.MediaRecorder = class {
      static isTypeSupported() { return true; }
      constructor(_stream, options) {
        this.mimeType = options.mimeType;
        this.state = 'inactive';
        if (failure === 'constructor') throw new Error('simulated constructor failure');
      }
      start() {
        if (failure === 'start') throw new Error('simulated start failure');
        this.state = 'recording';
        window.setTimeout(() => this.onerror?.({ error: new Error('simulated recorder failure') }), 0);
      }
      stop() { this.state = 'inactive'; }
    };
    q('#exportVideoBtn').click();
    const statusPrefix = failure === 'event' ? 'Video recorder error:' : 'Recorder could not start:';
    if (failure === 'event') {
      assert.equal(document.body.classList.contains('exporting'), true, 'active recording locks editing controls');
      const downloadCount = downloads.length;
      q('#exportPngBtn').click();
      q('#exportSvgBtn').click();
      assert.equal(downloads.length, downloadCount, 'still exports are ignored while video recording is active');
    }
    await waitFor(() => q('#exportStatus').textContent.startsWith(statusPrefix));
    assert.equal(document.body.classList.contains('exporting'), false, `${failure} failure releases the visual lock`);
    assert.equal(q('.workspace').getAttribute('aria-busy'), 'false', `${failure} failure clears aria-busy`);
    assert.equal(q('#exportVideoBtn').disabled, false, `${failure} failure re-enables video export`);
  }
  assert.ok(stoppedTracks >= 3, 'failure paths stop each capture stream');

  // Small square test export exercises the real gifenc palette + writer path without a large fixture.
  input('ratioSelect', 'square', 'change');
  input('loopBeats', 1, 'change');
  q('#exportGifBtn').click();
  await waitFor(() => q('#exportStatus').textContent.startsWith('GIF exported') || q('#exportStatus').textContent.startsWith('GIF export failed'), 15000);
  assert.match(q('#exportStatus').textContent, /^GIF exported/, q('#exportStatus').textContent);
  const gif = lastDownload();
  assert.match(gif.filename, /\.gif$/);
  const bytes = new Uint8Array(await readBlob(gif.blob, 'readAsArrayBuffer'));
  assert.ok(bytes.length > 50, `GIF has encoded image data (${bytes.length} bytes)`);
  assert.equal(String.fromCharCode(...bytes.slice(0, 6)), 'GIF89a');

  assert.ok(drawOperations > 100, 'interaction and export paths drew multiple frames');
  assert.deepEqual(scriptErrors, [], `JSDOM reported script errors: ${scriptErrors.join('; ')}`);
  assert.match(html, /@media\(max-width:760px\)/, 'mobile single-column layout is present');
  assert.match(html, /@media\(max-width:440px\)/, 'small-phone layout is present');
  console.log('Motion Studio smoke test passed: presets, layer editing, canvas drag, timeline move/scrub, project save/open, SVG/PNG/GIF exports, recorder failure recovery, and responsive CSS checks.');
  dom.window.close();
}

main().catch(error => {
  console.error(error);
  dom.window.close();
  process.exitCode = 1;
});
