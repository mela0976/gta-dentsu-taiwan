import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');

const REQUIRED_IMAGES = [
  'role-account.webp',
  'role-planner.webp',
  'role-creative.webp',
  'role-media.webp',
  'role-grandma.webp',
  'advisor-lisa.webp',
  'advisor-cindy.webp',
  'scene-morning-scooter.webp',
  'scene-boardroom.webp',
  'scene-bento-rain.webp',
  'scene-neihu-studio.webp',
  'scene-xinyi-overtime.webp',
  'scene-rechao-night.webp'
];

const REQUIRED_VIDEOS = [
  'intro-taipei.mp4',
  'boardroom-push.mp4',
  'grandma-rescue.mp4'
];

const errors = [];

if (!fs.existsSync(DIST)) {
  errors.push('Missing dist/ directory. Run npm run build first.');
}

function walk(dir) {
  let out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(walk(p));
    else out.push(p);
  }
  return out;
}

const distFiles = walk(DIST);
for (const file of distFiles) {
  const lower = file.toLowerCase();
  if (lower.endsWith('.pdf') || lower.endsWith('.indd') || lower.endsWith('.idml')) {
    errors.push(`Forbidden source file found in dist/: ${file}`);
  }
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    errors.push(`Unconverted raster image found in dist/ (must be .webp): ${file}`);
  }
  if (lower.endsWith('.html') || lower.endsWith('.js') || lower.endsWith('.css')) {
    const txt = fs.readFileSync(file, 'utf8');
    if (/https?:\/\/(cdn\.|fonts\.googleapis|unpkg\.com|jsdelivr)/i.test(txt)) {
      errors.push(`Forbidden external CDN URL found in ${file}`);
    }
  }
}

for (const img of REQUIRED_IMAGES) {
  const p = path.join(DIST, 'public/images', img);
  if (!fs.existsSync(p) || fs.statSync(p).size < 1024) {
    errors.push(`Missing or invalid WebP image: ${img}`);
  }
}

for (const vid of REQUIRED_VIDEOS) {
  const p = path.join(DIST, 'public/video', vid);
  if (!fs.existsSync(p) || fs.statSync(p).size < 10240) {
    errors.push(`Missing or invalid MP4 cutscene: ${vid}`);
  }
}

const standalone = path.join(DIST, 'gta-dentsu-taiwan-standalone.html');
if (!fs.existsSync(standalone) || fs.statSync(standalone).size < 20000) {
  errors.push('Missing or truncated standalone HTML bundle.');
}

if (errors.length) {
  console.error('DIST CHECK FAILED:\n' + errors.map((e) => ' - ' + e).join('\n'));
  process.exit(1);
}

console.log(`CHECK PASSED: ${distFiles.length} files in dist/, ${REQUIRED_IMAGES.length} WebP images, ${REQUIRED_VIDEOS.length} Higgsfield MP4 cutscenes, 0 leaks.`);
