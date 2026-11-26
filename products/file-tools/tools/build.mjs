import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const publicRoot = path.join(repo, 'public');
const jsOut = path.join(publicRoot, 'assets/js');
const vendorOut = path.join(publicRoot, 'assets/vendor/selfie-segmentation');
const require = createRequire(import.meta.url);
await rm(jsOut, { recursive: true, force: true });
await rm(vendorOut, { recursive: true, force: true });
await mkdir(jsOut, { recursive: true });
await mkdir(vendorOut, { recursive: true });

await build({
  entryPoints: [path.join(repo, 'products/file-tools/src/app.js')],
  nodePaths: [path.join(here, 'node_modules')],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2020',
  splitting: true,
  outdir: jsOut,
  entryNames: 'app',
  chunkNames: 'chunks/[name]-[hash]',
  legalComments: 'eof',
});
await build({
  entryPoints: [require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2020',
  outfile: path.join(jsOut, 'pdf.worker.mjs'),
  legalComments: 'eof',
});

const mediapipe = path.join(here, 'node_modules/@mediapipe/selfie_segmentation');
for (const name of [
  'selfie_segmentation.js',
  'selfie_segmentation.binarypb',
  'selfie_segmentation.tflite',
  'selfie_segmentation_landscape.tflite',
  'selfie_segmentation_solution_simd_wasm_bin.js',
  'selfie_segmentation_solution_simd_wasm_bin.wasm',
  'selfie_segmentation_solution_wasm_bin.js',
  'selfie_segmentation_solution_wasm_bin.wasm',
]) {
  await cp(path.join(mediapipe, name), path.join(vendorOut, name));
}

const apacheLicense = await readFile(path.join(here, 'node_modules/pdfjs-dist/LICENSE'), 'utf8');
const licenseEntries = [
  ['@mediapipe/selfie_segmentation 0.1.1675465747 — MediaPipe Selfie Segmentation', 'Apache-2.0', 'node_modules/pdfjs-dist/LICENSE', 'Copyright 2019–2022 The MediaPipe Authors.'],
  ['pdfjs-dist 4.10.38 — PDF.js', 'Apache-2.0', 'node_modules/pdfjs-dist/LICENSE', 'Copyright Mozilla Foundation and contributors.'],
  ['fflate 0.8.3', 'MIT', 'node_modules/fflate/LICENSE', ''],
  ['pdf-lib 1.17.1', 'MIT', 'node_modules/pdf-lib/LICENSE.md', ''],
  ['@pdf-lib/standard-fonts 1.0.0', 'MIT', 'node_modules/@pdf-lib/standard-fonts/LICENSE.md', ''],
  ['@pdf-lib/upng 1.0.1', 'MIT', 'node_modules/@pdf-lib/upng/LICENSE', ''],
  ['pako 1.0.11', 'MIT and Zlib', 'node_modules/pako/LICENSE', ''],
  ['tslib 1.14.1', '0BSD', 'node_modules/tslib/LICENSE.txt', ''],
  ['qrcode 1.5.4', 'MIT', 'node_modules/qrcode/license', ''],
  ['dijkstrajs 1.0.3', 'MIT', 'node_modules/dijkstrajs/LICENSE.md', ''],
];
let notices = 'THIRD-PARTY NOTICES\n\nHandyKit includes or redistributes the browser libraries and model assets listed below. License texts are reproduced from the installed npm packages where provided.\n';
for (const [name, license, file, attribution] of licenseEntries) {
  const rawText = name.startsWith('@mediapipe/') || name.startsWith('pdfjs-dist ')
    ? apacheLicense
    : await readFile(path.join(here, file), 'utf8');
  const text = rawText.replace(/\r\n/g, '\n').trim();
  notices += `\n\n--- ${name} · ${license} ---\n${attribution ? `${attribution}\n` : ''}\n${text}\n`;
}
notices += '\n\nZlib license notice for zlib-derived code distributed with pako:\n\nCopyright (C) 1995-2022 Jean-loup Gailly and Mark Adler\n\nThis software is provided \'as-is\', without any express or implied warranty. In no event will the authors be held liable for any damages arising from the use of this software.\n\nPermission is granted to anyone to use this software for any purpose, including commercial applications, and to alter it and redistribute it freely, subject to the following restrictions:\n\n1. The origin of this software must not be misrepresented; you must not claim that you wrote the original software. If you use this software in a product, an acknowledgment in the product documentation would be appreciated but is not required.\n2. Altered source versions must be plainly marked as such, and must not be misrepresented as being the original software.\n3. This notice may not be removed or altered from any source distribution.\n';
await writeFile(path.join(publicRoot, 'THIRD-PARTY-NOTICES.txt'), notices, 'utf8');
console.log('Built local app and PDF worker bundles, copied MediaPipe assets, and wrote third-party notices.');
