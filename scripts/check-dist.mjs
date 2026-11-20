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
  'scene-rechao-night.webp',
  'gmap-morning-scooter.webp',
  'gmap-boardroom.webp',
  'gmap-bento-rain.webp',
  'gmap-neihu-studio.webp',
  'gmap-xinyi-overtime.webp',
  'gmap-rechao-night.webp',
  'ui-taipei-radar-map.webp',
  'ui-begonia-glass.webp'
];

const REQUIRED_VIDEOS = [
  'intro-taipei.mp4',
  'boardroom-push.mp4',
  'grandma-rescue.mp4'
];

const REQUIRED_GRANDMA_CLIPS = [
  'quote.mp3',
  ...Array.from({ length: 5 }, (_, i) => `rescue_${i}.mp3`),
  ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_quip.mp3`),
  ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_call.mp3`),
  ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_clue.mp3`)
];

const REQUIRED_CHARACTER_CLIPS = [
  ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_line.mp3`),
  ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_lisa.mp3`),
  ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_cindy.mp3`),
  ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_takeaway.mp3`),
  'fsd_on.mp3',
  'fsd_off.mp3',
  ...['account', 'creative', 'media', 'grandma'].flatMap((role) =>
    Array.from({ length: 10 }, (_, i) => `role_${role}_ch${i + 1}_line.mp3`)
  )
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
  } else {
    const buf = fs.readFileSync(p);
    if (!buf.includes('soun') || !buf.includes('mp4a')) {
      errors.push(`MP4 cutscene missing embedded AAC audio track: ${vid}`);
    }
  }
}

for (const clip of REQUIRED_GRANDMA_CLIPS) {
  const p = path.join(DIST, 'public/audio/grandma', clip);
  if (!fs.existsSync(p) || fs.statSync(p).size <= 2048) {
    errors.push(`Missing or invalid Google Gemini TTS Grandma MP3 clip: ${clip}`);
  }
}

for (const clip of REQUIRED_CHARACTER_CLIPS) {
  const p = path.join(DIST, 'public/audio/voices', clip);
  if (!fs.existsSync(p) || fs.statSync(p).size <= 2048) {
    errors.push(`Missing or invalid Google Gemini TTS character MP3 clip: ${clip}`);
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

console.log(`CHECK PASSED: ${distFiles.length} files in dist/, ${REQUIRED_IMAGES.length} WebP images, ${REQUIRED_VIDEOS.length} audio-enabled MP4 cutscenes, ${REQUIRED_GRANDMA_CLIPS.length + REQUIRED_CHARACTER_CLIPS.length} Google Gemini TTS MP3 clips (36 grandma + 82 character), 0 leaks.`);
