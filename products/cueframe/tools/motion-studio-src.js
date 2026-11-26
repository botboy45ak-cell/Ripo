import { GIFEncoder, quantize, applyPalette } from 'gifenc';

(() => {
  'use strict';

  const RATIO_SIZES = {
    portrait: [360, 640],
    wide: [640, 360],
    square: [480, 480],
    feed: [432, 540],
  };
  const EXPORT_SIZES = {
    portrait: { 540: [540, 960], 720: [720, 1280] },
    wide: { 540: [960, 540], 720: [1280, 720] },
    square: { 540: [540, 540], 720: [720, 720] },
    feed: { 540: [432, 540], 720: [576, 720] },
  };
  const PALETTES = [
    { main: '#62e5f4', accent: '#c5f16d', name: 'Signal' },
    { main: '#ff5f97', accent: '#ae8cff', name: 'Electric' },
    { main: '#ffbf69', accent: '#ff806d', name: 'Warm' },
    { main: '#f4f1ff', accent: '#76e3bd', name: 'Soft' },
    { main: '#8d91ff', accent: '#ffe56b', name: 'Neon' },
  ];
  const PRESET_NAMES = {
    focus: 'Focus ping', steps: 'Step reveal', pointer: 'Point + pop', orbit: 'Orbit loop'
  };
  const MOTION_LABELS = {
    draw: 'Draw-on', pop: 'Elastic pop', slide: 'Slide + settle', pulse: 'Beat pulse',
    orbit: 'Orbit', wipe: 'Wipe reveal', bounce: 'Bounce settle', float: 'Float',
    spin: 'Spin', 'beat-hit': 'Beat hit'
  };
  const SHAPE_LABELS = {
    ring: 'Signal ring', brackets: 'Focus brackets', arrow: 'Pointer arrow', spark: 'Spark',
    burst: 'Burst', wave: 'Wave line', scribble: 'Scribble', pill: 'Label plate',
    diamond: 'Diamond', circle: 'Solid circle'
  };
  const state = {
    version: 1,
    ratio: 'portrait',
    bpm: 120,
    loopBeats: 4,
    accentPattern: 'one-three',
    swing: 0,
    metronome: false,
    preset: 'focus',
    layers: [],
  };

  let selectedId = '';
  let isPlaying = false;
  let rafId = 0;
  let playStartedAt = 0;
  let manualTime = 0;
  let lastBeatSound = -1;
  let tapTimes = [];
  let backgroundUrl = '';
  let audioUrl = '';
  let guideAudio = null;
  let dragPointer = null;
  let audioContext = null;
  let exportBusy = false;

  const el = (id) => document.getElementById(id);
  const canvas = el('motionCanvas');
  const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
  const bgImage = el('userImage');
  const bgVideo = el('userVideo');

  const uid = () => `layer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const shortSide = (w, h) => Math.min(w, h);
  const selected = () => state.layers.find(layer => layer.id === selectedId) || state.layers[0] || null;
  const hexToRgba = (hex, alpha = 255) => {
    const value = String(hex || '#ffffff').replace('#', '');
    return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16), alpha];
  };
  const hexRgbaString = (hex, alpha) => {
    const [r, g, b] = hexToRgba(hex);
    return `rgba(${r},${g},${b},${alpha})`;
  };
  const bezierSmooth = t => t * t * (3 - 2 * t);
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const easeOutBack = t => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  const easeOutBounce = t => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + .75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + .9375;
    return n1 * (t -= 2.625 / d1) * t + .984375;
  };
  function easing(t, mode) {
    t = clamp(t, 0, 1);
    if (mode === 'linear') return t;
    if (mode === 'snappy') return easeOutCubic(t);
    if (mode === 'spring') return easeOutBack(t);
    if (mode === 'bounce') return easeOutBounce(t);
    return bezierSmooth(t);
  }

  function defaultLayers(preset = 'focus') {
    const common = { easing: 'snappy', direction: 'center', stroke: 7, rotation: 0, opacity: 100, intensity: 68, accent: '#c5f16d' };
    const specs = {
      focus: [
        { id: uid(), name: 'Lead · ring draw', kind: 'shape', shape: 'ring', motion: 'draw', x: 50, y: 43, size: 43, color: '#62e5f4', startBeat: 0, lengthBeats: 2.5, easing: 'snappy' },
        { id: uid(), name: 'Accent · beat hit', kind: 'shape', shape: 'spark', motion: 'beat-hit', x: 73, y: 31, size: 13, color: '#c5f16d', startBeat: 1, lengthBeats: 3, easing: 'spring' },
        { id: uid(), name: 'Text · key idea', kind: 'text', text: 'KEY IDEA', motion: 'slide', x: 50, y: 73, size: 42, fontSize: 60, color: '#f5f7fb', accent: '#62e5f4', startBeat: .5, lengthBeats: 3.5, direction: 'up', easing: 'spring' },
      ],
      steps: [
        { id: uid(), name: 'Lead · focus brackets', kind: 'shape', shape: 'brackets', motion: 'draw', x: 50, y: 42, size: 64, color: '#62e5f4', startBeat: 0, lengthBeats: 1.5 },
        { id: uid(), name: 'Accent · pill reveal', kind: 'shape', shape: 'pill', motion: 'wipe', x: 50, y: 72, size: 60, color: '#c5f16d', startBeat: 1, lengthBeats: 2 },
        { id: uid(), name: 'Text · step 01', kind: 'text', text: 'STEP 01', motion: 'slide', x: 50, y: 72, size: 40, fontSize: 62, color: '#101827', accent: '#c5f16d', startBeat: 1.25, lengthBeats: 2.75, direction: 'left' },
      ],
      pointer: [
        { id: uid(), name: 'Lead · pointer sweep', kind: 'shape', shape: 'arrow', motion: 'slide', x: 52, y: 48, size: 45, color: '#ff5f97', startBeat: 0, lengthBeats: 1.5, direction: 'right', rotation: -18 },
        { id: uid(), name: 'Accent · target hit', kind: 'shape', shape: 'ring', motion: 'beat-hit', x: 75, y: 34, size: 22, color: '#62e5f4', startBeat: 1, lengthBeats: 3 },
        { id: uid(), name: 'Text · tap here', kind: 'text', text: 'LOOK HERE', motion: 'pop', x: 46, y: 76, size: 42, fontSize: 56, color: '#f5f7fb', accent: '#ff5f97', startBeat: .75, lengthBeats: 3.25 },
      ],
      orbit: [
        { id: uid(), name: 'Lead · orbit ring', kind: 'shape', shape: 'ring', motion: 'orbit', x: 50, y: 48, size: 43, color: '#ae8cff', startBeat: 0, lengthBeats: 4, easing: 'linear' },
        { id: uid(), name: 'Accent · burst', kind: 'shape', shape: 'spark', motion: 'pulse', x: 70, y: 30, size: 15, color: '#ffbf69', startBeat: 0, lengthBeats: 4 },
        { id: uid(), name: 'Text · on beat', kind: 'text', text: 'ON BEAT', motion: 'beat-hit', x: 50, y: 76, size: 40, fontSize: 58, color: '#f5f7fb', accent: '#ae8cff', startBeat: 0, lengthBeats: 4 },
      ],
    };
    return specs[preset].map(item => ({ ...common, ...item }));
  }

  function setPreset(preset) {
    state.preset = preset;
    state.layers = defaultLayers(preset);
    for (const layer of state.layers) {
      layer.startBeat = clamp(Number(layer.startBeat), 0, Number(state.loopBeats) - .25);
      layer.lengthBeats = clamp(Number(layer.lengthBeats), .25, Number(state.loopBeats) - Number(layer.startBeat));
    }
    selectedId = state.layers[0].id;
    document.querySelectorAll('.preset').forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.preset === preset)));
    updateAll();
    setStatus(`${PRESET_NAMES[preset]} loaded. Edit every layer, beat, color, and move.`, 'info');
  }

  function getCanvasDims(ratio = state.ratio, quality = null) {
    if (quality) return EXPORT_SIZES[ratio][quality];
    return RATIO_SIZES[ratio] || RATIO_SIZES.portrait;
  }

  function resizePreview() {
    const [w, h] = getCanvasDims();
    canvas.width = w; canvas.height = h;
    el('stageShell').dataset.ratio = state.ratio;
    el('ratioSelect').value = state.ratio;
    el('canvasSizeLabel').textContent = `Preview canvas · ${state.ratio === 'portrait' ? 'portrait' : state.ratio === 'wide' ? 'landscape' : state.ratio === 'feed' ? '4:5 feed' : 'square'}`;
    drawAt(manualTime, ctx, canvas.width, canvas.height, 'transparent');
  }

  function applyBackgroundSelection() {
    const mode = el('previewBackground').value;
    const checker = el('checker');
    checker.dataset.bg = mode;
    bgImage.style.display = 'none';
    bgVideo.style.display = 'none';
    if (mode === 'custom' && bgImage.src && bgImage.style.display !== 'block') {
      if (bgImage.dataset.ready === 'true') bgImage.style.display = 'block';
      if (bgVideo.dataset.ready === 'true') bgVideo.style.display = 'block';
    }
    if (mode === 'dark') checker.style.background = 'radial-gradient(circle at 45% 35%,#30415b,#101725 65%)';
    else if (mode === 'light') checker.style.background = 'linear-gradient(145deg,#edf0f4,#bac8d4)';
    else if (mode === 'custom') checker.style.background = '#142033';
    else checker.style.background = '';
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function setStatus(message, kind = '') {
    const status = el('exportStatus');
    status.textContent = message;
    status.className = `export-status ${kind}`;
  }

  function setExportLock(locked) {
    document.body.classList.toggle('exporting', locked);
    const guarded = [document.querySelector('.workspace'), document.querySelector('.top-actions'), document.querySelector('.export-settings'), document.querySelector('.export-actions')];
    guarded.forEach(node => { if (node && 'inert' in node) node.inert = locked; });
    const workspace = document.querySelector('.workspace');
    if (workspace) workspace.setAttribute('aria-busy', String(locked));
  }

  function getDuration() { return Number(state.loopBeats) * 60 / Number(state.bpm); }

  function accentHit(beatIndex, phase) {
    const pattern = state.accentPattern;
    if (pattern === 'offbeat') return Math.max(0, 1 - Math.abs(phase - (.5 + Number(state.swing) / 100 * .35)) / .17);
    const index = Math.floor(beatIndex);
    const selectedBeat = pattern === 'every' || (pattern === 'first' && index === 0) || (pattern === 'one-three' && index % 2 === 0);
    return selectedBeat ? Math.max(0, 1 - phase / .18) : 0;
  }

  function roundRectPath(context, x, y, w, h, radius) {
    const r = Math.min(radius, Math.abs(w) / 2, Math.abs(h) / 2);
    context.beginPath(); context.moveTo(x + r, y); context.lineTo(x + w - r, y); context.quadraticCurveTo(x + w, y, x + w, y + r);
    context.lineTo(x + w, y + h - r); context.quadraticCurveTo(x + w, y + h, x + w - r, y + h); context.lineTo(x + r, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - r); context.lineTo(x, y + r); context.quadraticCurveTo(x, y, x + r, y); context.closePath();
  }

  function starPath(context, spikes, outer, inner) {
    context.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = -Math.PI / 2 + i * Math.PI / spikes;
      const radius = i % 2 === 0 ? outer : inner;
      const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
      if (i === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.closePath();
  }

  function drawShape(context, layer, size, progress, beatPos) {
    const half = size / 2;
    const sw = Math.max(1.5, Number(layer.stroke) * shortSide(context.canvas.width, context.canvas.height) / 720);
    context.lineWidth = sw; context.lineCap = 'round'; context.lineJoin = 'round';
    context.strokeStyle = layer.color; context.fillStyle = layer.color;
    const drawProgress = clamp(progress, 0, 1);
    if (layer.motion === 'draw') context.save();
    switch (layer.shape) {
      case 'ring': {
        context.beginPath();
        const start = -Math.PI / 2;
        const end = start + Math.PI * 2 * (layer.motion === 'draw' ? drawProgress : 1);
        context.arc(0, 0, half * .78, start, end);
        context.stroke();
        if (drawProgress > .22 || layer.motion !== 'draw') {
          context.beginPath(); context.arc(0, 0, half, -Math.PI * .77, -Math.PI * .77 + Math.PI * .46 * (layer.motion === 'draw' ? drawProgress : 1));
          context.strokeStyle = layer.accent; context.lineWidth = sw * 1.25; context.stroke();
        }
        context.beginPath(); context.arc(0, 0, half * .07, 0, Math.PI * 2); context.fillStyle = layer.accent; context.fill();
        break;
      }
      case 'brackets': {
        const x = half * .78, y = half * .62, l = half * .32;
        context.strokeStyle = layer.color; context.lineWidth = sw * 1.15;
        context.beginPath(); context.moveTo(-x, -y + l); context.lineTo(-x, -y); context.lineTo(-x + l, -y); context.moveTo(x - l, -y); context.lineTo(x, -y); context.lineTo(x, -y + l);
        context.moveTo(-x, y - l); context.lineTo(-x, y); context.lineTo(-x + l, y); context.moveTo(x - l, y); context.lineTo(x, y); context.lineTo(x, y - l); context.stroke();
        context.fillStyle = layer.accent; context.beginPath(); context.arc(x - sw * 1.5, -y + sw * 1.5, sw * .75, 0, Math.PI * 2); context.fill();
        break;
      }
      case 'arrow': {
        context.strokeStyle = layer.color; context.lineWidth = sw * 1.35;
        context.beginPath(); context.moveTo(-half * .82, half * .2); context.quadraticCurveTo(-half * .08, -half * .35, half * .47, -half * .25); context.stroke();
        context.beginPath(); context.moveTo(half * .16, -half * .58); context.lineTo(half * .52, -half * .25); context.lineTo(half * .12, -half * .02); context.stroke();
        context.fillStyle = layer.accent; context.beginPath(); context.arc(-half * .82, half * .2, sw * 1.1, 0, Math.PI * 2); context.fill();
        break;
      }
      case 'spark': {
        starPath(context, 4, half * .88, half * .24); context.fillStyle = layer.color; context.fill();
        context.beginPath(); context.arc(half * .7, -half * .55, sw * 1.2, 0, Math.PI * 2); context.fillStyle = layer.accent; context.fill();
        break;
      }
      case 'burst': {
        starPath(context, 10, half * .85, half * .56); context.fillStyle = layer.color; context.fill();
        context.beginPath(); context.arc(0, 0, half * .18, 0, Math.PI * 2); context.fillStyle = layer.accent; context.fill();
        break;
      }
      case 'wave':
      case 'scribble': {
        context.strokeStyle = layer.color; context.lineWidth = sw * 1.3;
        context.beginPath();
        const steps = 36, amplitude = half * (layer.shape === 'wave' ? .32 : .23), frequency = layer.shape === 'wave' ? 2 : 4;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = -half * .9 + t * half * 1.8;
          const y = Math.sin(t * Math.PI * 2 * frequency + beatPos * Math.PI * 2) * amplitude * (layer.shape === 'scribble' ? .8 : 1);
          if (i === 0) context.moveTo(x, y); else context.lineTo(x, y);
        }
        context.stroke();
        if (layer.shape === 'wave') {
          context.fillStyle = layer.accent;
          context.beginPath(); context.arc(half * .9, Math.sin(beatPos * Math.PI * 2) * amplitude, sw * 1.1, 0, Math.PI * 2); context.fill();
        }
        break;
      }
      case 'pill': {
        roundRectPath(context, -half * .9, -half * .30, half * 1.8, half * .6, half * .30);
        context.fillStyle = hexRgbaString(layer.color, .18); context.fill(); context.strokeStyle = layer.color; context.stroke();
        roundRectPath(context, -half * .77, -half * .30, sw * 1.2, half * .6, sw * .6); context.fillStyle = layer.accent; context.fill();
        context.beginPath(); context.arc(half * .68, 0, sw * .62, 0, Math.PI * 2); context.fillStyle = layer.accent; context.fill();
        break;
      }
      case 'diamond': {
        context.beginPath(); context.moveTo(0, -half * .86); context.lineTo(half * .76, 0); context.lineTo(0, half * .86); context.lineTo(-half * .76, 0); context.closePath();
        context.fillStyle = hexRgbaString(layer.color, .12); context.fill(); context.strokeStyle = layer.color; context.stroke();
        context.beginPath(); context.moveTo(-half * .32, 0); context.lineTo(0, half * .31); context.lineTo(half * .44, -half * .38); context.strokeStyle = layer.accent; context.lineWidth = sw * .9; context.stroke();
        break;
      }
      case 'circle': {
        context.beginPath(); context.arc(0, 0, half * .66, 0, Math.PI * 2); context.fillStyle = hexRgbaString(layer.color, .24); context.fill(); context.strokeStyle = layer.color; context.stroke();
        context.beginPath(); context.arc(0, 0, half * .18, 0, Math.PI * 2); context.fillStyle = layer.accent; context.fill();
        break;
      }
      default: break;
    }
    if (layer.motion === 'draw') context.restore();
  }

  function drawText(context, layer, size, progress, style) {
    const scale = shortSide(context.canvas.width, context.canvas.height) / 720 * (Number(layer.size || 42) / 42);
    let fontPx = Math.max(12, Number(layer.fontSize || 56) * scale);
    const text = String(layer.text || 'YOUR TEXT').trim();
    context.font = `850 ${fontPx}px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;
    while (context.measureText(text).width > context.canvas.width * .82 && fontPx > 12) {
      fontPx *= .94; context.font = `850 ${fontPx}px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;
    }
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.lineWidth = Math.max(2, fontPx * .065); context.strokeStyle = 'rgba(3,9,19,.78)';
    context.shadowColor = 'rgba(0,0,0,.42)'; context.shadowBlur = fontPx * .18; context.shadowOffsetY = fontPx * .08;
    context.strokeText(text, 0, 0); context.fillStyle = layer.color; context.fillText(text, 0, 0);
    context.shadowColor = 'transparent'; context.shadowBlur = 0; context.shadowOffsetY = 0;
    if (layer.accent && style > .75) {
      context.beginPath(); context.moveTo(-size * .35, fontPx * .8); context.lineTo(size * .35, fontPx * .8);
      context.strokeStyle = layer.accent; context.lineWidth = Math.max(2, fontPx * .07); context.stroke();
    }
  }

  function drawLayer(context, layer, beatPos, width, height) {
    const start = clamp(Number(layer.startBeat || 0), 0, Number(state.loopBeats));
    const length = clamp(Number(layer.lengthBeats || 1), .25, Number(state.loopBeats));
    const end = Math.min(Number(state.loopBeats), start + length);
    if (beatPos < start || beatPos > end) return;
    const progress = clamp((beatPos - start) / Math.max(.001, end - start), 0, 1);
    const eased = easing(progress, layer.easing || 'smooth');
    const sMin = shortSide(width, height);
    const baseSize = (Number(layer.size || 30) / 100) * sMin * .85;
    const intensity = Number(layer.intensity || 68) / 100;
    let scale = 1, dx = 0, dy = 0, rotate = Number(layer.rotation || 0) * Math.PI / 180;
    let alpha = clamp(Number(layer.opacity || 100) / 100, 0, 1);
    const localBeat = beatPos - start;
    const beatPhase = localBeat - Math.floor(localBeat);
    const hit = accentHit(beatPos, beatPhase);
    const distance = baseSize * (.42 + intensity * .36);
    if (layer.motion === 'pop') { scale = .16 + eased * .9 + Math.max(0, 1 - progress * 7) * .06 * intensity; alpha *= clamp(progress * 5, 0, 1); }
    else if (layer.motion === 'slide') {
      const off = (1 - eased) * distance;
      if (layer.direction === 'left') dx = -off; else if (layer.direction === 'right') dx = off;
      else if (layer.direction === 'down') dy = -off; else if (layer.direction === 'up') dy = off;
      alpha *= clamp(progress * 4, 0, 1);
    } else if (layer.motion === 'pulse') { scale = 1 + Math.sin(localBeat * Math.PI * 2) * .075 * intensity; }
    else if (layer.motion === 'orbit') { rotate += progress * Math.PI * 2; dx += Math.cos(localBeat * Math.PI * 2) * baseSize * .055; dy += Math.sin(localBeat * Math.PI * 2) * baseSize * .055; }
    else if (layer.motion === 'wipe') { scale = .9 + .1 * eased; alpha *= clamp(progress * 5, 0, 1); }
    else if (layer.motion === 'bounce') { scale = .7 + easeOutBounce(progress) * .34; alpha *= clamp(progress * 5, 0, 1); }
    else if (layer.motion === 'float') { dy = Math.sin(progress * Math.PI * 2) * baseSize * .10 * intensity; scale = .97 + .03 * Math.sin(progress * Math.PI * 2); }
    else if (layer.motion === 'spin') { rotate += progress * Math.PI * 2; scale = .82 + .18 * eased; }
    else if (layer.motion === 'beat-hit') { scale = 1 + hit * .3 * intensity; alpha *= clamp(.58 + hit * .55, 0, 1); }
    else if (layer.motion === 'draw') { alpha *= clamp(progress * 8 + .15, 0, 1); }
    const fadeBeats = Math.min(.18, Math.max(.06, (end - start) * .18));
    alpha *= clamp((beatPos - start) / fadeBeats, 0, 1) * clamp((end - beatPos) / fadeBeats, 0, 1);
    const cx = (Number(layer.x) / 100) * width + dx;
    const cy = (Number(layer.y) / 100) * height + dy;
    const size = baseSize * Math.max(.05, scale);
    context.save();
    context.globalAlpha = alpha;
    context.translate(cx, cy);
    context.rotate(rotate);
    context.scale(scale, scale);
    if (layer.motion === 'wipe') {
      context.beginPath(); context.rect(-baseSize, -baseSize, baseSize * 2 * eased, baseSize * 2); context.clip();
    } else if (layer.motion === 'draw') {
      context.beginPath(); context.rect(-baseSize, -baseSize, baseSize * 2 * progress, baseSize * 2); context.clip();
    }
    if (layer.kind === 'text') drawText(context, layer, size, progress, eased);
    else drawShape(context, layer, size, progress, beatPos);
    context.restore();
  }

  function drawBackground(context, width, height, background, customMedia = false) {
    if (background === 'green') { context.fillStyle = '#00ff00'; context.fillRect(0, 0, width, height); return; }
    if (background === 'dark') { context.fillStyle = '#111827'; context.fillRect(0, 0, width, height); return; }
    if (background === 'light') { context.fillStyle = '#ecf1f6'; context.fillRect(0, 0, width, height); return; }
    if (customMedia) {
      const media = bgVideo.dataset.ready === 'true' ? bgVideo : bgImage;
      if (media && media.readyState !== 0) {
        const mw = media.videoWidth || media.naturalWidth || width;
        const mh = media.videoHeight || media.naturalHeight || height;
        const ratio = Math.max(width / mw, height / mh);
        const dw = mw * ratio, dh = mh * ratio;
        context.drawImage(media, (width - dw) / 2, (height - dh) / 2, dw, dh);
      }
    }
  }

  function drawAt(timeSec, context = ctx, width = canvas.width, height = canvas.height, background = 'transparent', customMedia = false) {
    context.clearRect(0, 0, width, height);
    drawBackground(context, width, height, background, customMedia);
    const loop = getDuration();
    const t = ((Math.max(0, timeSec) % loop) + loop) % loop;
    const beatPos = (t / loop) * Number(state.loopBeats);
    const layers = state.layers.slice();
    for (const layer of layers) drawLayer(context, layer, beatPos, width, height);
  }

  function playCurrentTime(now = performance.now()) {
    const loop = getDuration();
    if (guideAudio && !guideAudio.paused) return (guideAudio.currentTime % loop + loop) % loop;
    return ((now - playStartedAt) / 1000 % loop + loop) % loop;
  }

  function playTone(beatIndex) {
    if (!state.metronome) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = beatIndex % 4 === 0 ? 1040 : 700;
      gain.gain.setValueAtTime(.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.075, audioContext.currentTime + .006);
      gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + .065);
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.start(); oscillator.stop(audioContext.currentTime + .07);
    } catch (_) { /* Audio preview is optional; visual beat grid still works. */ }
  }

  function animationFrame(now) {
    if (!isPlaying) return;
    const t = playCurrentTime(now);
    const beat = Math.floor(t * Number(state.bpm) / 60);
    if (beat !== lastBeatSound) { lastBeatSound = beat; if (beat >= 0) playTone(beat); }
    manualTime = t;
    drawAt(t);
    updatePlayhead(t);
    rafId = requestAnimationFrame(animationFrame);
  }

  function togglePlay(force = null) {
    const shouldPlay = force === null ? !isPlaying : force;
    if (shouldPlay === isPlaying) return;
    isPlaying = shouldPlay;
    if (isPlaying) {
      playStartedAt = performance.now() - manualTime * 1000;
      lastBeatSound = -1;
      if (guideAudio) {
        try { guideAudio.currentTime = manualTime % getDuration(); } catch (_) {}
        guideAudio.play().catch(() => {});
      }
      if (el('previewBackground').value === 'custom' && bgVideo.dataset.ready === 'true') bgVideo.play().catch(() => {});
      el('playPauseBtn').textContent = '■ Stop'; el('playheadBtn').textContent = 'Ⅱ';
      rafId = requestAnimationFrame(animationFrame);
    } else {
      const stoppedAt = playCurrentTime();
      cancelAnimationFrame(rafId);
      if (guideAudio) guideAudio.pause();
      bgVideo.pause();
      manualTime = stoppedAt;
      el('playPauseBtn').textContent = '▶ Play loop'; el('playheadBtn').textContent = '▶';
      drawAt(manualTime); updatePlayhead(manualTime);
    }
  }

  function updatePlayhead(time) {
    const duration = getDuration();
    const ratio = duration ? clamp(time / duration, 0, 1) : 0;
    el('scrubInput').value = String(Math.round(ratio * 1000));
    el('timecodeNow').textContent = formatClock(time);
    el('timecodeEnd').textContent = `/ ${formatClock(duration)}`;
    document.querySelectorAll('.playhead').forEach(line => { line.style.left = `${ratio * 100}%`; });
  }

  function formatClock(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds - mins * 60;
    return `${String(mins).padStart(2, '0')}:${secs.toFixed(1).padStart(4, '0')}`;
  }

  function renderLayers() {
    const list = el('layerList'); list.replaceChildren();
    el('layerCount').textContent = `${state.layers.length} layer${state.layers.length === 1 ? '' : 's'}`;
    for (const layer of state.layers) {
      const button = document.createElement('button');
      button.className = 'layer-row'; button.type = 'button'; button.setAttribute('role', 'option'); button.setAttribute('aria-pressed', String(layer.id === selectedId));
      const swatch = document.createElement('span'); swatch.className = 'layer-swatch'; swatch.style.setProperty('--layer-color', layer.color);
      const copy = document.createElement('span');
      const name = document.createElement('span'); name.className = 'layer-name'; name.textContent = layer.name;
      const meta = document.createElement('span'); meta.className = 'layer-meta'; meta.textContent = layer.kind === 'text' ? `Text · ${MOTION_LABELS[layer.motion]}` : `${SHAPE_LABELS[layer.shape]} · ${MOTION_LABELS[layer.motion]}`;
      copy.append(name, meta);
      const beatTag = document.createElement('span'); beatTag.className = 'layer-beat'; beatTag.textContent = `${formatBeat(layer.startBeat)}–${formatBeat(Number(layer.startBeat) + Number(layer.lengthBeats))}`;
      button.append(swatch, copy, beatTag);
      button.addEventListener('click', () => { selectedId = layer.id; renderLayers(); updateInspector(); });
      list.append(button);
    }
    renderTimeline();
  }

  function snapBeat(value) { return Math.round(value * 4) / 4; }
  function formatBeat(value) { return String(Number(Number(value).toFixed(2))); }

  function updateTimelineLayer(layer, fill, beatLabel) {
    const beatCount = Number(state.loopBeats);
    fill.style.left = `${clamp(Number(layer.startBeat) / beatCount, 0, 1) * 100}%`;
    fill.style.width = `${clamp(Number(layer.lengthBeats) / beatCount, 0, 1) * 100}%`;
    beatLabel.textContent = `${formatBeat(layer.startBeat)}–${formatBeat(Number(layer.startBeat) + Number(layer.lengthBeats))}`;
    const row = fill.closest('.timeline-row');
    if (row) row.querySelector('.row-name').textContent = layer.name;
  }

  function scrubTimeline(event, track) {
    const rect = track.getBoundingClientRect();
    if (!rect.width) return;
    togglePlay(false);
    manualTime = clamp((event.clientX - rect.left) / rect.width, 0, 1) * getDuration();
    drawAt(manualTime); updatePlayhead(manualTime);
  }

  function beginTimelineDrag(event, layer, fill, beatLabel) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    togglePlay(false); selectedId = layer.id; updateInspector();
    const track = fill.parentElement;
    const rect = track.getBoundingClientRect();
    dragPointer = {
      timeline: true, id: event.pointerId, fill, beatLabel, track, trackWidth: rect.width,
      startX: event.clientX, startBeat: Number(layer.startBeat), lengthBeats: Number(layer.lengthBeats),
      layerId: layer.id, mode: event.target.closest('.track-resize') ? 'resize' : 'move',
    };
    fill.setPointerCapture?.(event.pointerId);
  }

  function moveTimelineDrag(event) {
    if (!dragPointer?.timeline || event.pointerId !== dragPointer.id) return false;
    const layer = state.layers.find(item => item.id === dragPointer.layerId);
    if (!layer || !dragPointer.trackWidth) return true;
    const delta = snapBeat((event.clientX - dragPointer.startX) / dragPointer.trackWidth * Number(state.loopBeats));
    if (dragPointer.mode === 'resize') {
      layer.lengthBeats = clamp(dragPointer.lengthBeats + delta, .25, Number(state.loopBeats) - Number(layer.startBeat));
    } else {
      layer.startBeat = clamp(dragPointer.startBeat + delta, 0, Number(state.loopBeats) - Number(layer.lengthBeats));
    }
    updateTimelineLayer(layer, dragPointer.fill, dragPointer.beatLabel);
    updateInspector(); drawAt(manualTime); updatePlayhead(manualTime);
    return true;
  }

  function endTimelineDrag(event) {
    if (!dragPointer?.timeline) return false;
    if (dragPointer.fill.releasePointerCapture && event.pointerId !== undefined) {
      try { dragPointer.fill.releasePointerCapture(event.pointerId); } catch (_) {}
    }
    dragPointer = null; renderLayers(); updateInspector(); drawAt(manualTime);
    return true;
  }

  function renderTimeline() {
    const ruler = el('timelineRuler'), rows = el('timelineRows');
    ruler.replaceChildren(); rows.replaceChildren();
    const beatCount = Number(state.loopBeats);
    ruler.style.gridTemplateColumns = `repeat(${beatCount},1fr)`;
    for (let i = 0; i < beatCount; i++) {
      const tick = document.createElement('span'); tick.textContent = String(i + 1); ruler.append(tick);
    }
    for (const layer of state.layers) {
      const row = document.createElement('div'); row.className = 'timeline-row';
      const label = document.createElement('span'); label.className = 'row-name'; label.textContent = layer.name;
      const track = document.createElement('div'); track.className = 'track';
      const beatWidth = 100 / beatCount;
      track.style.background = `repeating-linear-gradient(90deg,#101a2b 0,#101a2b calc(${beatWidth}% - 1px),#29394f calc(${beatWidth}% - 1px),#29394f ${beatWidth}%)`;
      const fill = document.createElement('button'); fill.type = 'button'; fill.className = 'track-fill';
      fill.style.setProperty('--layer-color', layer.color);
      fill.setAttribute('aria-label', `Move ${layer.name} on the beat timeline; drag the end handle to change its length`);
      const beatLabel = document.createElement('span'); beatLabel.className = 'track-label';
      const resize = document.createElement('span'); resize.className = 'track-resize'; resize.setAttribute('aria-hidden', 'true');
      fill.append(beatLabel, resize); updateTimelineLayer(layer, fill, beatLabel);
      fill.addEventListener('pointerdown', event => beginTimelineDrag(event, layer, fill, beatLabel));
      fill.addEventListener('pointermove', moveTimelineDrag);
      fill.addEventListener('pointerup', endTimelineDrag); fill.addEventListener('pointercancel', endTimelineDrag);
      fill.addEventListener('keydown', event => {
        if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
        event.preventDefault(); selectedId = layer.id;
        if (event.shiftKey) {
          const delta = event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -.25 : .25;
          layer.lengthBeats = clamp(snapBeat(Number(layer.lengthBeats) + delta), .25, beatCount - Number(layer.startBeat));
        } else {
          const delta = event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -.25 : .25;
          layer.startBeat = clamp(snapBeat(Number(layer.startBeat) + delta), 0, beatCount - Number(layer.lengthBeats));
        }
        renderLayers(); updateInspector(); drawAt(manualTime);
      });
      const head = document.createElement('span'); head.className = 'playhead'; head.style.left = `${manualTime / getDuration() * 100}%`;
      track.append(fill, head);
      track.addEventListener('pointerdown', event => {
        if (event.target.closest('.track-fill')) return;
        selectedId = layer.id; scrubTimeline(event, track); renderLayers(); updateInspector();
      });
      row.append(label, track); rows.append(row);
    }
    el('timelineRuler').style.marginLeft = window.innerWidth < 440 ? '65px' : '82px';
  }

  function updateInspector() {
    const layer = selected();
    if (!layer) return;
    el('selectedLayerLabel').textContent = `Selected: ${layer.name}`;
    el('inspectorSubtitle').textContent = layer.kind === 'text' ? 'Text is editable; movement and timing are independent.' : 'Shape, movement, styling, and beat placement are editable.';
    const bindings = [
      ['layerName', 'name', 'value'], ['shapeSelect', 'shape', 'value'], ['motionSelect', 'motion', 'value'],
      ['easingSelect', 'easing', 'value'], ['directionSelect', 'direction', 'value'], ['layerText', 'text', 'value'],
      ['colorInput', 'color', 'value'], ['accentInput', 'accent', 'value'], ['xInput', 'x', 'value'], ['yInput', 'y', 'value'],
      ['sizeInput', 'size', 'value'], ['strokeInput', 'stroke', 'value'], ['rotationInput', 'rotation', 'value'], ['opacityInput', 'opacity', 'value'],
      ['fontSizeInput', 'fontSize', 'value'], ['startBeatInput', 'startBeat', 'value'], ['lengthBeatInput', 'lengthBeats', 'value'], ['intensityInput', 'intensity', 'value'],
    ];
    for (const [id, key] of bindings) {
      const control = el(id); if (control && document.activeElement !== control) control.value = layer[key] ?? '';
    }
    el('shapeField').hidden = layer.kind === 'text';
    el('textField').hidden = layer.kind !== 'text';
    el('deleteLayerBtn').disabled = state.layers.length <= 1;
    updateRangeValues();
  }

  function updateRangeValues() {
    const values = [
      ['xInput','xValue','%'],['yInput','yValue','%'],['sizeInput','sizeValue','%'],['strokeInput','strokeValue',''],
      ['rotationInput','rotationValue','°'],['opacityInput','opacityValue','%'],['fontSizeInput','fontSizeValue',''],['intensityInput','intensityValue','%'],['swingInput','swingValue','%']
    ];
    for (const [inputId, valueId, suffix] of values) {
      const input = el(inputId), output = el(valueId); if (input && output) output.textContent = `${input.value}${suffix}`;
    }
  }

  function updateBeatGrid() {
    const grid = el('beatGrid'); grid.replaceChildren();
    const beats = Number(state.loopBeats); grid.style.gridTemplateColumns = `repeat(${beats},1fr)`;
    for (let i = 0; i < beats; i++) {
      const cell = document.createElement('span'); cell.className = `beat-cell ${i === 0 ? 'downbeat' : ''}`;
      cell.textContent = String(i + 1); grid.append(cell);
    }
    el('durationBadge').textContent = `${getDuration().toFixed(2)}s loop`;
    el('exportSummary').textContent = `${el('gifBackground').value === 'transparent' ? 'Transparent GIF' : 'Green-screen GIF'} · ${beats} beats`;
  }

  function updateAll() {
    resizePreview(); renderLayers(); updateInspector(); updateBeatGrid();
    drawAt(manualTime); updatePlayhead(manualTime);
  }

  function addLayer(kind) {
    if (state.layers.length >= 64) { setStatus('A project can contain at most 64 layers.', 'error'); return; }
    const layer = {
      id: uid(), name: kind === 'text' ? 'New text' : 'New shape', kind,
      shape: kind === 'text' ? 'pill' : 'spark', motion: kind === 'text' ? 'slide' : 'pop', easing: 'spring', direction: 'up',
      x: 50, y: 50, size: 28, stroke: 7, rotation: 0, opacity: 100, intensity: 65,
      color: kind === 'text' ? '#f5f7fb' : '#62e5f4', accent: '#c5f16d', startBeat: 0, lengthBeats: Number(state.loopBeats),
      text: 'ADD YOUR TEXT', fontSize: 58,
    };
    state.layers.push(layer); selectedId = layer.id; updateAll();
  }

  function duplicateSelected() {
    if (state.layers.length >= 64) { setStatus('A project can contain at most 64 layers.', 'error'); return; }
    const layer = selected(); if (!layer) return;
    const copy = { ...layer, id: uid(), name: `${layer.name} copy`, x: clamp(Number(layer.x) + 7, 5, 95), y: clamp(Number(layer.y) + 6, 5, 95) };
    state.layers.push(copy); selectedId = copy.id; updateAll();
  }

  function deleteSelected() {
    if (state.layers.length <= 1) return;
    const index = state.layers.findIndex(layer => layer.id === selectedId);
    state.layers = state.layers.filter(layer => layer.id !== selectedId);
    selectedId = state.layers[Math.max(0, index - 1)].id; updateAll();
  }

  function updateLayerFromControl(id) {
    const layer = selected(); if (!layer) return;
    const map = {
      layerName: ['name', 'string'], shapeSelect: ['shape', 'string'], motionSelect: ['motion', 'string'], easingSelect: ['easing', 'string'],
      directionSelect: ['direction', 'string'], layerText: ['text', 'string'], colorInput: ['color', 'string'], accentInput: ['accent', 'string'],
      xInput: ['x', 'number'], yInput: ['y', 'number'], sizeInput: ['size', 'number'], strokeInput: ['stroke', 'number'],
      rotationInput: ['rotation', 'number'], opacityInput: ['opacity', 'number'], fontSizeInput: ['fontSize', 'number'],
      startBeatInput: ['startBeat', 'number'], lengthBeatInput: ['lengthBeats', 'number'], intensityInput: ['intensity', 'number'],
    };
    const binding = map[id]; if (!binding) return;
    const [key, type] = binding;
    const value = type === 'number' ? Number(el(id).value) : el(id).value;
    layer[key] = value;
    if (key === 'name' && !value.trim()) layer.name = 'Untitled layer';
    layer.startBeat = clamp(Number(layer.startBeat), 0, Number(state.loopBeats) - .25);
    layer.lengthBeats = clamp(Number(layer.lengthBeats), .25, Number(state.loopBeats) - Number(layer.startBeat));
    renderLayers(); updateInspector(); drawAt(manualTime); updateRangeValues();
  }

  function randomizePalette() {
    const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    state.layers.forEach((layer, index) => {
      if (layer.kind === 'text') { layer.color = '#f5f7fb'; layer.accent = palette.main; }
      else { layer.color = index % 2 ? palette.accent : palette.main; layer.accent = index % 2 ? palette.main : palette.accent; }
    });
    updateAll(); setStatus(`${palette.name} palette applied to the scene.`, 'info');
  }

  function normalizeProject(project) {
    if (!project || project.version !== 1 || !Array.isArray(project.layers) || !project.layers.length || project.layers.length > 64) throw new Error('This file is not a Cueframe Motion Studio v1 project.');
    const validShapes = new Set(Object.keys(SHAPE_LABELS));
    const validMotions = new Set(Object.keys(MOTION_LABELS));
    const validEasing = new Set(['smooth','snappy','spring','linear','bounce']);
    const validDirections = new Set(['up','down','left','right','center','clockwise']);
    const loopBeats = [1,2,4,8].includes(Number(project.loopBeats)) ? Number(project.loopBeats) : 4;
    const finite = (value, fallback, min, max) => {
      const number = Number(value);
      return clamp(Number.isFinite(number) ? number : fallback, min, max);
    };
    const layers = project.layers.map(raw => {
      if (!raw || !raw.id || !['shape','text'].includes(raw.kind)) throw new Error('A layer in this project is invalid.');
      const layer = { ...raw, id: String(raw.id).slice(0, 80), kind: raw.kind };
      if (!layer.id) throw new Error('A layer in this project is invalid.');
      if (!validShapes.has(layer.shape)) layer.shape = 'ring';
      if (!validMotions.has(layer.motion)) layer.motion = 'pop';
      if (!validEasing.has(layer.easing)) layer.easing = 'smooth';
      if (!validDirections.has(layer.direction)) layer.direction = 'center';
      layer.name = String(layer.name || 'Untitled layer').slice(0, 32);
      layer.text = String(layer.text ?? '').slice(0, 40);
      layer.color = /^#[0-9a-f]{6}$/i.test(layer.color) ? layer.color : '#62e5f4';
      layer.accent = /^#[0-9a-f]{6}$/i.test(layer.accent) ? layer.accent : '#c5f16d';
      layer.x = finite(layer.x, 50, 5, 95); layer.y = finite(layer.y, 50, 5, 95);
      layer.size = finite(layer.size, 30, 8, 90); layer.stroke = finite(layer.stroke, 7, 1, 24);
      layer.rotation = finite(layer.rotation, 0, -180, 180); layer.opacity = finite(layer.opacity, 100, 20, 100);
      layer.intensity = finite(layer.intensity, 65, 10, 100); layer.fontSize = finite(layer.fontSize, 56, 16, 160);
      layer.startBeat = finite(layer.startBeat, 0, 0, Math.max(0, loopBeats - .25));
      layer.lengthBeats = finite(layer.lengthBeats, loopBeats, .25, Math.max(.25, loopBeats - layer.startBeat));
      return layer;
    });
    const bpm = finite(project.bpm, 120, 40, 220);
    return {
      version: 1,
      ratio: Object.prototype.hasOwnProperty.call(RATIO_SIZES, project.ratio) ? project.ratio : 'portrait',
      bpm,
      loopBeats,
      accentPattern: ['every','one-three','first','offbeat'].includes(project.accentPattern) ? project.accentPattern : 'one-three',
      swing: finite(project.swing, 0, 0, 40),
      metronome: Boolean(project.metronome),
      preset: Object.prototype.hasOwnProperty.call(PRESET_NAMES, project.preset) ? project.preset : 'focus',
      layers,
    };
  }

  function saveProject() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `cueframe-${state.preset}-${state.bpm}bpm.cueframe`);
    setStatus('Project saved. Reopen the .cueframe file here to keep editing.', 'info');
  }

  function loadProjectFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const project = normalizeProject(JSON.parse(String(reader.result)));
        togglePlay(false); Object.assign(state, project); selectedId = state.layers[0].id; manualTime = getDuration() * .2;
        el('bpmInput').value = state.bpm; el('loopBeats').value = String(state.loopBeats);
        el('accentPattern').value = state.accentPattern; el('swingInput').value = state.swing; el('metronomeToggle').checked = state.metronome;
        document.querySelectorAll('.preset').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.preset === state.preset)));
        updateAll(); setStatus('Project loaded. Every layer is editable.', 'info');
      } catch (error) { setStatus(error.message || 'Could not open that project file.', 'error'); }
    };
    reader.onerror = () => setStatus('Could not read that project file.', 'error');
    reader.readAsText(file);
  }

  function updateTapTempo() {
    const now = performance.now();
    tapTimes = tapTimes.filter(time => now - time < 2200);
    tapTimes.push(now);
    if (tapTimes.length > 5) tapTimes.shift();
    if (tapTimes.length >= 3) {
      const intervals = [];
      for (let i = 1; i < tapTimes.length; i++) intervals.push(tapTimes[i] - tapTimes[i - 1]);
      const average = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
      state.bpm = clamp(Math.round(60000 / average), 40, 220); el('bpmInput').value = state.bpm; updateBeatGrid(); renderTimeline();
      setStatus(`Tempo set to ${state.bpm} BPM. Tap again to refine.`, 'info');
    } else setStatus('Tap on the music at least three times to estimate its tempo.', 'info');
  }

  function updateMediaFile(file) {
    if (!file) return;
    if (file.type.startsWith('video/') || file.type.startsWith('image/')) {
      if (backgroundUrl) URL.revokeObjectURL(backgroundUrl);
      backgroundUrl = URL.createObjectURL(file);
      if (file.type.startsWith('video/')) {
        bgImage.dataset.ready = 'false'; bgImage.style.display = 'none';
        bgVideo.pause(); bgVideo.src = backgroundUrl; bgVideo.dataset.ready = 'true'; bgVideo.load();
        bgVideo.onloadeddata = () => { if (el('previewBackground').value === 'custom') { drawAt(manualTime); if (isPlaying) bgVideo.play().catch(() => {}); } };
        el('previewBackground').value = 'custom'; applyBackgroundSelection();
        el('audioLabel').textContent = 'Video loaded for local preview';
        setStatus('Footage preview loaded locally. The exported overlay stays separate.', 'info');
      } else {
        bgVideo.pause(); bgVideo.dataset.ready = 'false'; bgVideo.style.display = 'none';
        bgImage.dataset.ready = 'false'; bgImage.src = backgroundUrl;
        bgImage.onload = () => { bgImage.dataset.ready = 'true'; el('previewBackground').value = 'custom'; applyBackgroundSelection(); drawAt(manualTime); };
        el('audioLabel').textContent = 'Image loaded for local preview';
        setStatus('Image preview loaded locally. The exported overlay stays separate.', 'info');
      }
    } else if (file.type.startsWith('audio/')) {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      audioUrl = URL.createObjectURL(file);
      if (guideAudio) { guideAudio.pause(); guideAudio.src = ''; }
      guideAudio = new Audio(audioUrl); guideAudio.loop = true; guideAudio.preload = 'metadata';
      el('audioLabel').textContent = file.name;
      setStatus('Audio loaded only as a timing reference; it is not sent or included in exports.', 'info');
    }
  }

  function beginDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const layer = selected(); if (!layer) return;
    dragPointer = { id: event.pointerId, x: event.clientX, y: event.clientY, layerX: Number(layer.x), layerY: Number(layer.y) };
    canvas.setPointerCapture?.(event.pointerId);
  }
  function moveDrag(event) {
    if (!dragPointer || event.pointerId !== dragPointer.id) return;
    const layer = selected(); if (!layer) return;
    const rect = canvas.getBoundingClientRect();
    layer.x = Math.round(clamp(dragPointer.layerX + (event.clientX - dragPointer.x) / rect.width * 100, 5, 95));
    layer.y = Math.round(clamp(dragPointer.layerY + (event.clientY - dragPointer.y) / rect.height * 100, 5, 95));
    el('xInput').value = layer.x; el('yInput').value = layer.y; updateRangeValues(); renderLayers(); drawAt(manualTime);
  }
  function endDrag(event) {
    if (!dragPointer) return;
    if (canvas.releasePointerCapture && event.pointerId !== undefined) { try { canvas.releasePointerCapture(event.pointerId); } catch (_) {} }
    dragPointer = null;
  }

  function keyframeMotionSvg() {
    // Self-contained SMIL SVG for browser/vector workflows; test it in the target editor before relying on import support.
    const dimensions = { portrait: [1080,1920], wide: [1920,1080], square: [1080,1080], feed: [864,1080] };
    const [width, height] = dimensions[state.ratio] || dimensions.portrait;
    const unit = Math.min(width, height);
    const duration = getDuration();
    const x = layer => (Number(layer.x) / 100 * width).toFixed(1);
    const y = layer => (Number(layer.y) / 100 * height).toFixed(1);
    const escapeXml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
    const xmlNum = value => Number(value).toFixed(2).replace(/\.00$/, '');
    const starPath = (spikes, outer, inner) => {
      const points = [];
      for (let i = 0; i < spikes * 2; i++) {
        const angle = -Math.PI / 2 + i * Math.PI / spikes;
        const radius = i % 2 === 0 ? outer : inner;
        points.push(`${i ? 'L' : 'M'}${xmlNum(Math.cos(angle) * radius)} ${xmlNum(Math.sin(angle) * radius)}`);
      }
      return `${points.join(' ')} Z`;
    };
    const layers = state.layers.map((layer, index) => {
      const start = clamp(Number(layer.startBeat) / state.loopBeats, 0, 1);
      const end = clamp((Number(layer.startBeat) + Number(layer.lengthBeats)) / state.loopBeats, 0, 1);
      const startSec = (start * duration).toFixed(3);
      const span = Math.max(.001, end - start);
      const shapeSize = Number(layer.size) / 100 * unit * .85;
      const r = shapeSize / 2;
      const sw = Math.max(1.5, Number(layer.stroke) * unit / 720);
      const opacity = clamp(Number(layer.opacity) / 100, 0, 1).toFixed(2);
      const visibleFrames = start <= 0 && end >= 1 ? '' : (() => {
        const frames = start <= 0
          ? [[0, opacity], [end, '0'], [1, '0']]
          : end >= 1
            ? [[0, '0'], [start, opacity], [1, opacity]]
            : [[0, '0'], [start, opacity], [end, '0'], [1, '0']];
        return `<animate attributeName="opacity" values="${frames.map(frame => frame[1]).join(';')}" keyTimes="${frames.map(frame => frame[0].toFixed(5)).join(';')}" calcMode="discrete" dur="${duration.toFixed(3)}s" repeatCount="indefinite"/>`;
      })();
      const loopTransform = (type, values, neutral) => {
        const frames = [];
        if (start > 0) frames.push([0, neutral]);
        values.forEach((value, valueIndex) => frames.push([start + span * valueIndex / (values.length - 1), value]));
        if (end < 1) frames.push([1, neutral]);
        const curves = { smooth: '0.4 0 0.2 1', snappy: '0.16 0.72 0.24 1', spring: '0.2 0.78 0.28 1', bounce: '0.22 0.74 0.3 1' };
        const easingAttrs = layer.easing === 'linear' ? 'calcMode="linear"' : `calcMode="spline" keySplines="${Array(Math.max(1,frames.length-1)).fill(curves[layer.easing] || curves.smooth).join(';')}"`;
        return `<animateTransform attributeName="transform" type="${type}" values="${frames.map(frame => frame[1]).join(';')}" keyTimes="${frames.map(frame => frame[0].toFixed(5)).join(';')}" ${easingAttrs} dur="${duration.toFixed(3)}s" repeatCount="indefinite" additive="sum"/>`;
      };
      let motion = '';
      if (layer.motion === 'slide') {
        const distance = shapeSize * .38;
        const dx = layer.direction === 'left' ? -distance : layer.direction === 'right' ? distance : 0;
        const dy = layer.direction === 'down' ? -distance : layer.direction === 'up' ? distance : 0;
        motion = loopTransform('translate', [`${xmlNum(dx)} ${xmlNum(dy)}`, '0 0'], '0 0');
      } else if (layer.motion === 'orbit' || layer.motion === 'spin') {
        motion = loopTransform('rotate', ['0', '360'], '0');
      } else if (layer.motion === 'pop') {
        motion = loopTransform('scale', ['.12','1.12','1'], '1');
      } else if (layer.motion === 'bounce') {
        motion = loopTransform('scale', ['.72','1.15','.94','1'], '1');
      } else if (layer.motion === 'pulse' || layer.motion === 'beat-hit') {
        const amount = layer.motion === 'pulse' ? 1.08 : 1.24;
        const beatSeconds = (60 / state.bpm).toFixed(3);
        motion = `<animateTransform attributeName="transform" type="scale" values="1;${amount};1;1" keyTimes="0;.14;.34;1" dur="${beatSeconds}s" begin="${startSec}s" repeatCount="indefinite" additive="sum"/>`;
      } else if (layer.motion === 'draw') {
        motion = loopTransform('scale', ['.86','1'], '1');
      } else if (layer.motion === 'wipe') {
        motion = loopTransform('translate', [`${xmlNum(-shapeSize * .22)} 0`, '0 0'], '0 0');
      } else if (layer.motion === 'float') {
        motion = loopTransform('translate', ['0 0', `0 ${xmlNum(-shapeSize*.08)}`, '0 0'], '0 0');
      }

      let content;
      if (layer.kind === 'text') {
        const text = escapeXml(layer.text || 'YOUR TEXT');
        const fontSize = Number(layer.fontSize) * unit / 720 * (Number(layer.size || 42) / 42);
        const estimatedWidth = text.length * fontSize * .62;
        const fitAttrs = estimatedWidth > width * .82 ? ` textLength="${(width * .82).toFixed(1)}" lengthAdjust="spacingAndGlyphs"` : '';
        content = `<text x="0" y="0" text-anchor="middle" dominant-baseline="middle" fill="${layer.color}" stroke="#030913" stroke-width="${Math.max(2,fontSize*.065).toFixed(1)}" stroke-linejoin="round" paint-order="stroke" font-family="system-ui,-apple-system,sans-serif" font-size="${fontSize.toFixed(1)}" font-weight="850"${fitAttrs}>${text}</text><path d="M-${xmlNum(shapeSize*.35)} ${xmlNum(fontSize*.8)} H${xmlNum(shapeSize*.35)}" fill="none" stroke="${layer.accent}" stroke-width="${Math.max(2,fontSize*.07).toFixed(1)}" stroke-linecap="round"/>`;
      } else {
        const c = layer.color, a = layer.accent;
        switch (layer.shape) {
          case 'ring':
            content = `<circle r="${xmlNum(r*.78)}" fill="none" stroke="${c}" stroke-width="${xmlNum(sw)}"/><circle r="${xmlNum(r*.98)}" fill="none" stroke="${a}" stroke-width="${xmlNum(sw*1.25)}" stroke-dasharray="${xmlNum(2*Math.PI*r*.98*.2)} ${xmlNum(2*Math.PI*r*.98)}" transform="rotate(-70)"/><circle r="${xmlNum(sw*.7)}" fill="${a}"/>`;
            break;
          case 'brackets': {
            const bx = r*.78, by = r*.62, len = r*.32;
            content = `<path d="M-${xmlNum(bx)} -${xmlNum(by-len)}V-${xmlNum(by)}H-${xmlNum(bx-len)} M${xmlNum(bx-len)} -${xmlNum(by)}H${xmlNum(bx)}V-${xmlNum(by-len)} M-${xmlNum(bx)} ${xmlNum(by-len)}V${xmlNum(by)}H-${xmlNum(bx-len)} M${xmlNum(bx-len)} ${xmlNum(by)}H${xmlNum(bx)}V-${xmlNum(by-len)}" fill="none" stroke="${c}" stroke-width="${xmlNum(sw*1.15)}" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${xmlNum(bx-sw)}" cy="-${xmlNum(by-sw)}" r="${xmlNum(sw*.75)}" fill="${a}"/>`;
            break;
          }
          case 'arrow':
            content = `<path d="M-${xmlNum(r*.82)} ${xmlNum(r*.2)} Q-${xmlNum(r*.08)} -${xmlNum(r*.35)} ${xmlNum(r*.47)} -${xmlNum(r*.25)} M${xmlNum(r*.16)} -${xmlNum(r*.58)} L${xmlNum(r*.52)} -${xmlNum(r*.25)} L${xmlNum(r*.12)} -${xmlNum(r*.02)}" fill="none" stroke="${c}" stroke-width="${xmlNum(sw*1.35)}" stroke-linecap="round" stroke-linejoin="round"/><circle cx="-${xmlNum(r*.82)}" cy="${xmlNum(r*.2)}" r="${xmlNum(sw)}" fill="${a}"/>`;
            break;
          case 'spark':
            content = `<path d="${starPath(4,r*.88,r*.24)}" fill="${c}"/><circle cx="${xmlNum(r*.7)}" cy="-${xmlNum(r*.55)}" r="${xmlNum(sw*1.2)}" fill="${a}"/>`;
            break;
          case 'burst':
            content = `<path d="${starPath(10,r*.85,r*.56)}" fill="${c}"/><circle r="${xmlNum(r*.18)}" fill="${a}"/>`;
            break;
          case 'wave':
          case 'scribble': {
            const steps = 36, frequency = layer.shape === 'wave' ? 2 : 4, amplitude = r * (layer.shape === 'wave' ? .32 : .23);
            const path = [];
            for (let i = 0; i <= steps; i++) {
              const t = i / steps, px = -r*.9 + t*r*1.8;
              const py = Math.sin(t * Math.PI * 2 * frequency) * amplitude;
              path.push(`${i ? 'L' : 'M'}${xmlNum(px)} ${xmlNum(py)}`);
            }
            content = `<path d="${path.join(' ')}" fill="none" stroke="${c}" stroke-width="${xmlNum(sw*1.3)}" stroke-linecap="round" stroke-linejoin="round"/>${layer.shape === 'wave' ? `<circle cx="${xmlNum(r*.9)}" cy="0" r="${xmlNum(sw)}" fill="${a}"/>` : ''}`;
            break;
          }
          case 'pill':
            content = `<rect x="-${xmlNum(r*.9)}" y="-${xmlNum(r*.3)}" width="${xmlNum(r*1.8)}" height="${xmlNum(r*.6)}" rx="${xmlNum(r*.3)}" fill="${c}" fill-opacity=".18" stroke="${c}" stroke-width="${xmlNum(sw)}"/><rect x="-${xmlNum(r*.77)}" y="-${xmlNum(r*.3)}" width="${xmlNum(sw*1.2)}" height="${xmlNum(r*.6)}" rx="${xmlNum(sw*.6)}" fill="${a}"/><circle cx="${xmlNum(r*.68)}" r="${xmlNum(sw*.62)}" fill="${a}"/>`;
            break;
          case 'diamond':
            content = `<path d="M0 -${xmlNum(r*.86)}L${xmlNum(r*.76)} 0L0 ${xmlNum(r*.86)}L-${xmlNum(r*.76)} 0Z" fill="${c}" fill-opacity=".12" stroke="${c}" stroke-width="${xmlNum(sw)}"/><path d="M-${xmlNum(r*.32)} 0L0 ${xmlNum(r*.31)}L${xmlNum(r*.44)} -${xmlNum(r*.38)}" fill="none" stroke="${a}" stroke-width="${xmlNum(sw*.9)}" stroke-linecap="round" stroke-linejoin="round"/>`;
            break;
          case 'circle':
          default:
            content = `<circle r="${xmlNum(r*.66)}" fill="${c}" fill-opacity=".24" stroke="${c}" stroke-width="${xmlNum(sw)}"/><circle r="${xmlNum(r*.18)}" fill="${a}"/>`;
        }
      }
      const baseOpacity = visibleFrames ? '0' : opacity;
      return `<g id="layer-${index+1}" transform="translate(${x(layer)} ${y(layer)}) rotate(${Number(layer.rotation)||0})" opacity="${baseOpacity}">${visibleFrames}<g transform="translate(0 0)">${motion}${content}</g></g>`;
    }).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>Cueframe motion scene · ${state.bpm} BPM</title>${layers}</svg>`;
  }

  async function exportGif() {
    if (exportBusy) return;
    exportBusy = true; togglePlay(false); setStatus('Rendering GIF frames. Keep this tab open; on a phone, Medium is the safer first export.', 'info');
    el('exportGifBtn').disabled = true; setExportLock(true);
    try {
      const quality = el('exportSize').value;
      const [w, h] = EXPORT_SIZES[state.ratio][quality];
      const transparent = el('gifBackground').value === 'transparent';
      const background = transparent ? 'transparent' : 'green';
      const duration = getDuration();
      const fps = quality === '720' ? (duration <= 3 ? 12 : duration <= 6 ? 8 : 6) : (duration <= 3 ? 15 : duration <= 6 ? 10 : 6);
      const frames = Math.max(8, Math.min(96, Math.round(duration * fps)));
      const off = document.createElement('canvas'); off.width = w; off.height = h;
      const offCtx = off.getContext('2d', { alpha: transparent, willReadFrequently: true });
      const sampleCount = 4;
      const samples = new Uint8Array(w * h * 4 * sampleCount);
      for (let i = 0; i < sampleCount; i++) {
        drawAt(duration * i / sampleCount, offCtx, w, h, background);
        samples.set(offCtx.getImageData(0, 0, w, h).data, i * w * h * 4);
      }
      const format = transparent ? 'rgba4444' : 'rgb565';
      const palette = quantize(samples, transparent ? 127 : 256, transparent ? { format, oneBitAlpha: 127, clearAlpha: true, clearAlphaThreshold: 127, clearAlphaColor: 0 } : { format });
      let transparentIndex = -1;
      if (transparent) {
        transparentIndex = palette.findIndex(color => color.length > 3 && color[3] === 0);
        if (transparentIndex < 0) palette.unshift([0, 0, 0, 0]);
        else if (transparentIndex > 0) palette.unshift(palette.splice(transparentIndex, 1)[0]);
        transparentIndex = 0;
      }
      const gif = GIFEncoder();
      const delay = Math.max(20, Math.round(1000 / fps));
      for (let i = 0; i < frames; i++) {
        drawAt(duration * i / frames, offCtx, w, h, background);
        const pixels = new Uint8Array(offCtx.getImageData(0, 0, w, h).data);
        const indexed = applyPalette(pixels, palette, format);
        gif.writeFrame(indexed, w, h, { palette, transparent, transparentIndex: Math.max(0, transparentIndex), delay, repeat: 0, dispose: 2 });
        if (i % Math.max(1, Math.floor(frames / 8)) === 0) {
          setStatus(`Rendering GIF · ${Math.round((i + 1) / frames * 100)}%`, 'info');
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      gif.finish();
      const blob = new Blob([gif.bytes()], { type: 'image/gif' });
      downloadBlob(blob, `cueframe-${state.preset}-${state.bpm}bpm-${state.ratio}.gif`);
      setStatus(`GIF exported · ${w}×${h} · ${frames} frames · ${transparent ? 'transparent background' : 'green-key background'}.`, '');
    } catch (error) {
      console.error(error); setStatus(`GIF export failed: ${error.message || error}`, 'error');
    } finally { exportBusy = false; el('exportGifBtn').disabled = false; setExportLock(false); drawAt(manualTime); }
  }

  async function exportVideo() {
    if (exportBusy) return;
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) { setStatus('This browser cannot record a canvas video. Use animated GIF export instead.', 'error'); return; }
    const candidates = ['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
    const mimeType = candidates.find(type => MediaRecorder.isTypeSupported?.(type));
    if (!mimeType) { setStatus('This browser does not expose a compatible video recorder. Use animated GIF export.', 'error'); return; }
    exportBusy = true; togglePlay(false); el('exportVideoBtn').disabled = true; setExportLock(true);
    const releaseVideoUiLock = () => {
      exportBusy = false; el('exportVideoBtn').disabled = false; setExportLock(false); drawAt(manualTime);
    };
    const quality = el('exportSize').value; const [w, h] = EXPORT_SIZES[state.ratio][quality];
    const background = 'green';
    const duration = getDuration();
    const repeatCount = Math.max(1, Math.ceil(2 / duration));
    const recordingDuration = duration * repeatCount;
    const exportCanvas = document.createElement('canvas'); exportCanvas.width = w; exportCanvas.height = h;
    let exportCtx, stream;
    try {
      exportCtx = exportCanvas.getContext('2d', { alpha: false });
      if (!exportCtx) throw new Error('The export canvas is unavailable.');
      stream = exportCanvas.captureStream(30);
    } catch (error) {
      releaseVideoUiLock(); setStatus(`Recorder could not start: ${error.message || error}`, 'error'); return;
    }
    const chunks = [];
    let recorder;
    let finalized = false;
    const releaseExportLock = () => {
      if (finalized) return false;
      finalized = true;
      stream.getTracks().forEach(track => track.stop());
      releaseVideoUiLock();
      return true;
    };
    try { recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: quality === '720' ? 8_000_000 : 4_500_000 }); }
    catch (error) { releaseExportLock(); setStatus(`Recorder could not start: ${error.message || error}`, 'error'); return; }
    recorder.ondataavailable = event => { if (event.data && event.data.size) chunks.push(event.data); };
    recorder.onerror = event => {
      if (!releaseExportLock()) return;
      setStatus(`Video recorder error: ${event.error?.message || 'unknown error'}`, 'error');
      try { if (recorder.state !== 'inactive') recorder.stop(); } catch {}
    };
    recorder.onstop = () => {
      if (!releaseExportLock()) return;
      const type = recorder.mimeType || mimeType;
      const ext = type.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type });
      if (!blob.size) {
        setStatus('Video recorder returned an empty file. Try a longer loop or export a GIF instead.', 'error');
      } else {
        downloadBlob(blob, `cueframe-${state.preset}-${state.bpm}bpm-${state.ratio}.${ext}`);
        const cycles = repeatCount === 1 ? '1 loop' : `${repeatCount} loop cycles`;
        setStatus(`Video exported as ${ext.toUpperCase()} · ${w}×${h} · ${cycles} · green-key background.`, '');
      }
    };
    try { recorder.start(200); }
    catch (error) {
      const shouldStop = recorder.state !== 'inactive';
      releaseExportLock();
      if (shouldStop) { try { recorder.stop(); } catch {} }
      setStatus(`Recorder could not start: ${error.message || error}`, 'error'); return;
    }
    let start;
    const recordFrame = now => {
      if (finalized) return;
      if (start === undefined) start = now;
      const elapsed = (now - start) / 1000;
      if (elapsed >= recordingDuration) {
        drawAt(0, exportCtx, w, h, background);
        try { recorder.stop(); }
        catch (error) { if (releaseExportLock()) setStatus(`Video recorder could not stop: ${error.message || error}`, 'error'); }
        return;
      }
      drawAt(elapsed % duration, exportCtx, w, h, background);
      const cycleNote = repeatCount > 1 ? ` · ${repeatCount} cycles for a short loop` : '';
      setStatus(`Recording video · ${Math.min(100, Math.round(elapsed / recordingDuration * 100))}%${cycleNote}`, 'info');
      requestAnimationFrame(recordFrame);
    };
    requestAnimationFrame(recordFrame);
  }

  function exportPng() {
    if (exportBusy) return;
    const quality = el('exportSize').value; const [w, h] = EXPORT_SIZES[state.ratio][quality];
    const out = document.createElement('canvas'); out.width = w; out.height = h;
    const outCtx = out.getContext('2d', { alpha: true });
    const t = isPlaying ? manualTime : Number(el('scrubInput').value) / 1000 * getDuration();
    drawAt(t, outCtx, w, h, 'transparent');
    out.toBlob(blob => { if (blob) { downloadBlob(blob, `cueframe-${state.preset}-${state.bpm}bpm-frame.png`); setStatus('Transparent PNG still exported.', ''); } }, 'image/png');
  }

  function exportSvg() {
    if (exportBusy) return;
    const blob = new Blob([keyframeMotionSvg()], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, `cueframe-${state.preset}-${state.bpm}bpm-motion.svg`);
    setStatus('Animated SVG exported for browsers and vector workflows. Use GIF/video for a video-editor timeline.', 'info');
  }

  function updateFromGlobal() {
    state.bpm = clamp(Number(el('bpmInput').value) || 120, 40, 220);
    state.loopBeats = Number(el('loopBeats').value);
    state.accentPattern = el('accentPattern').value;
    state.swing = Number(el('swingInput').value);
    state.metronome = el('metronomeToggle').checked;
    for (const layer of state.layers) {
      layer.startBeat = clamp(Number(layer.startBeat), 0, state.loopBeats - .25);
      layer.lengthBeats = clamp(Number(layer.lengthBeats), .25, state.loopBeats - Number(layer.startBeat));
    }
    manualTime %= getDuration(); updateBeatGrid(); renderLayers(); updateInspector(); drawAt(manualTime); updatePlayhead(manualTime);
  }

  function installEvents() {
    document.querySelectorAll('.preset').forEach(button => button.addEventListener('click', () => setPreset(button.dataset.preset)));
    el('randomizeBtn').addEventListener('click', randomizePalette);
    el('addShapeBtn').addEventListener('click', () => addLayer('shape'));
    el('addTextBtn').addEventListener('click', () => addLayer('text'));
    el('duplicateLayerBtn').addEventListener('click', duplicateSelected);
    el('deleteLayerBtn').addEventListener('click', deleteSelected);
    el('bpmInput').addEventListener('input', updateFromGlobal);
    el('loopBeats').addEventListener('change', updateFromGlobal);
    el('accentPattern').addEventListener('change', updateFromGlobal);
    el('swingInput').addEventListener('input', updateFromGlobal);
    el('metronomeToggle').addEventListener('change', updateFromGlobal);
    el('tapTempoBtn').addEventListener('click', updateTapTempo);
    el('ratioSelect').addEventListener('change', () => { state.ratio = el('ratioSelect').value; resizePreview(); drawAt(manualTime); renderTimeline(); });
    el('previewBackground').addEventListener('change', () => { applyBackgroundSelection(); drawAt(manualTime); });
    el('gifBackground').addEventListener('change', updateBeatGrid);
    el('backgroundFile').addEventListener('change', event => updateMediaFile(event.target.files?.[0]));
    el('audioFile').addEventListener('change', event => updateMediaFile(event.target.files?.[0]));
    el('playPauseBtn').addEventListener('click', () => togglePlay());
    el('playheadBtn').addEventListener('click', () => togglePlay());
    el('scrubInput').addEventListener('input', () => {
      togglePlay(false); manualTime = Number(el('scrubInput').value) / 1000 * getDuration();
      drawAt(manualTime); updatePlayhead(manualTime);
    });
    el('saveProjectBtn').addEventListener('click', saveProject);
    el('loadProjectBtn').addEventListener('click', () => el('projectFile').click());
    el('projectFile').addEventListener('change', event => { if (event.target.files?.[0]) loadProjectFile(event.target.files[0]); event.target.value = ''; });
    el('newProjectBtn').addEventListener('click', () => { togglePlay(false); state.layers = defaultLayers('focus'); state.preset = 'focus'; state.bpm = 120; state.loopBeats = 4; state.ratio = 'portrait'; state.accentPattern = 'one-three'; state.swing = 0; state.metronome = false; selectedId = state.layers[0].id; manualTime = getDuration() * .2; el('bpmInput').value = 120; el('loopBeats').value = '4'; el('ratioSelect').value = 'portrait'; el('accentPattern').value = 'one-three'; el('swingInput').value = 0; el('metronomeToggle').checked = false; document.querySelectorAll('.preset').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.preset === 'focus'))); setPreset('focus'); });
    el('exportGifBtn').addEventListener('click', exportGif);
    el('exportVideoBtn').addEventListener('click', exportVideo);
    el('exportPngBtn').addEventListener('click', exportPng);
    el('exportSvgBtn').addEventListener('click', exportSvg);
    const controls = ['layerName','shapeSelect','motionSelect','easingSelect','directionSelect','layerText','colorInput','accentInput','xInput','yInput','sizeInput','strokeInput','rotationInput','opacityInput','fontSizeInput','startBeatInput','lengthBeatInput','intensityInput'];
    for (const id of controls) {
      const control = el(id); control.addEventListener(control.tagName === 'SELECT' ? 'change' : 'input', () => updateLayerFromControl(id));
      if (control.tagName === 'SELECT') control.addEventListener('input', () => updateLayerFromControl(id));
    }
    for (const id of ['xInput','yInput','sizeInput','strokeInput','rotationInput','opacityInput','fontSizeInput','intensityInput']) el(id).addEventListener('input', updateRangeValues);
    canvas.addEventListener('pointerdown', beginDrag); canvas.addEventListener('pointermove', moveDrag); canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
    window.addEventListener('resize', () => { renderTimeline(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && isPlaying) togglePlay(false); });
  }

  function initRecorderButton() {
    const available = Boolean(window.MediaRecorder && HTMLCanvasElement.prototype.captureStream);
    el('exportVideoBtn').title = available ? 'Record the loop in the format supported by this browser; loops under two seconds repeat for a reliable clip' : 'This browser does not offer canvas recording; export a GIF instead.';
    if (!available) el('exportVideoBtn').textContent = 'Video · not supported here';
  }

  function init() {
    state.layers = defaultLayers('focus'); selectedId = state.layers[0].id;
    manualTime = getDuration() * .2;
    installEvents(); initRecorderButton(); applyBackgroundSelection(); updateAll();
  }

  init();
})();
