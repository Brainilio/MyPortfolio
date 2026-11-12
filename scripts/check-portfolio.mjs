import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, relative, isAbsolute, sep } from 'node:path';
import projects from '../src/lib/projects.js';
import { projectGallery } from '../src/lib/project-gallery.mjs';
import { EXPERIMENTS } from '../src/app/journey/experiments.js';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const publicRoot = fileURLToPath(new URL('../public/', import.meta.url));
const dimensionsPath = new URL('../src/lib/project-image-sizes.json', import.meta.url);
const measure = process.argv.includes('--measure-images');
const dimensions = measure ? {} : JSON.parse(readFileSync(dimensionsPath, 'utf8'));
const errors = [];
const images = new Set();
const videos = new Set();
for (const [label, entries] of [['project', projects], ['experiment', EXPERIMENTS]]) {
  const seen = new Set();
  for (const { slug } of entries) {
    if (!slug || seen.has(slug)) errors.push(`Invalid or duplicate ${label} slug: ${slug}`);
    seen.add(slug);
  }
}
for (const project of projects) {
  images.add(project.previewImage);
  if (project.thumbnailVideo) videos.add(project.thumbnailVideo);
  for (const { src, videoSrc } of projectGallery(project)) {
    images.add(src);
    if (videoSrc) videos.add(videoSrc);
  }
}

function assetPath(src) {
  if (typeof src !== 'string' || !src.startsWith('/') || src.startsWith('//')) return null;
  const path = resolve(publicRoot, '.' + src);
  const rel = relative(publicRoot, path);
  if (rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel)) return null;
  try { return statSync(path).isFile() ? path : null; } catch { return null; }
}

for (const src of [...images].sort()) {
  const path = assetPath(src);
  if (!path) { errors.push(`Missing portfolio still: ${src}`); continue; }
  if (measure) {
    try {
      const { streams } = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', path], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
      dimensions[src] = [streams[0].width, streams[0].height];
    } catch { errors.push(`Could not read image dimensions: ${src}`); }
  }
  if (dimensions[src]?.length !== 2 || !dimensions[src].every(n => Number.isInteger(n) && n > 0)) {
    errors.push(`Missing intrinsic dimensions: ${src} (run npm run measure:images)`);
  }
}
for (const src of videos) if (!assetPath(src)) errors.push(`Missing portfolio video: ${src}`);
for (const { thumb } of EXPERIMENTS) if (!assetPath(thumb)) errors.push(`Missing Lab thumbnail: ${thumb}`);
const iconManifest = JSON.parse(read('../iconbuddy.json'));
const iconPaths = new Set([...Object.values(iconManifest.icons), ...Object.values(iconManifest.tech)].map(icon => icon.path));
for (const path of iconPaths) {
  if (!path.startsWith('public/') || !assetPath(path.slice('public'.length))) errors.push(`Missing Iconbuddy asset: ${path}`);
}


const form = read('../src/app/contact/contact-form.js');
const html = read('../public/__forms.html');
const staticForm = html.match(/<form\b[^>]*>/)?.[0] ?? '';
const staticFields = [...html.matchAll(/<(?:input|textarea)\b[^>]*\bname="([^"]+)"/g)].map(([, name]) => name);
const jsxFields = [...form.matchAll(/<(?:input|textarea|Choice)\b[^>]*?\bname="([^"]+)"/g)].map(([, name]) => name);
const formName = form.match(/const FORM_NAME = ['"]([^'"]+)/)?.[1];
const hiddenName = html.match(/name="form-name"\s+value="([^"]+)"/)?.[1];
const sameFields = JSON.stringify([...new Set(['form-name', ...jsxFields])].sort()) === JSON.stringify(staticFields.sort());
if (!formName || !staticForm.includes(`name="${formName}"`) || hiddenName !== formName || !sameFields) {
  errors.push('Contact form field names drifted from public/__forms.html.');
}
if (!staticForm.includes('data-netlify="true"') || !staticForm.includes('netlify-honeypot="bot-field"') || !form.includes("fetch('/__forms.html'")) {
  errors.push('Contact form endpoint, Netlify detection, or honeypot is out of sync.');
}

if (errors.length) {
  console.error(errors.map(error => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  if (measure) writeFileSync(dimensionsPath, '{\n' + Object.entries(dimensions).map(([src, size]) => `  ${JSON.stringify(src)}: ${JSON.stringify(size)}`).join(',\n') + '\n}\n');
  console.log(`Checked ${projects.length} projects, ${images.size} stills, ${videos.size} videos, ${EXPERIMENTS.length} Lab thumbnails, ${iconPaths.size} Iconbuddy assets, and Netlify form fields.`);
}
