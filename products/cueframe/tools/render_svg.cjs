#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { Resvg } = require('@resvg/resvg-js');

const jobsFile = process.argv[2];
if (!jobsFile) {
  console.error('Usage: node render_svg.cjs <jobs.json>');
  process.exit(2);
}
const jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
for (const job of jobs) {
  const svg = fs.readFileSync(job.svg, 'utf8');
  const renderer = new Resvg(svg, {
    fitTo: { mode: 'original' },
    background: 'rgba(0,0,0,0)'
  });
  const png = renderer.render().asPng();
  fs.mkdirSync(path.dirname(job.png), { recursive: true });
  fs.writeFileSync(job.png, png);
  console.log(`${path.basename(job.png)} · ${job.width}×${job.height}`);
}
