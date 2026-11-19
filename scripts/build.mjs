import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');

function readMapsApiKey() {
  if (process.env.GOOGLE_MAPS_API_KEY) return process.env.GOOGLE_MAPS_API_KEY.trim();
  for (const cand of [path.join(ROOT, '.env.map'), path.resolve(ROOT, '../.env.map')]) {
    if (!fs.existsSync(cand)) continue;
    const raw = fs.readFileSync(cand, 'utf8');
    const m = raw.match(/(?:^|\n)\s*(?:api|GOOGLE_MAPS_API_KEY)\s*=\s*([^\r\n#]+)/i);
    if (m && m[1]) return m[1].trim();
  }
  return '';
}

const MAPS_API_KEY = readMapsApiKey();
if (MAPS_API_KEY) {
  console.log('Detected Google Maps API key from environment / .env.map');
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else if (!entry.name.endsWith('.log') && !entry.name.endsWith('.png')) {
      fs.copyFileSync(s, d);
    }
  }
}

const rawIndexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const injectedIndexHtml = rawIndexHtml.replace(
  '<script type="module" src="./src/ui-app.js"></script>',
  `<script>window.__GOOGLE_MAPS_API_KEY__ = ${JSON.stringify(MAPS_API_KEY)};</script>\n  <script type="module" src="./src/ui-app.js"></script>`
);
fs.writeFileSync(path.join(DIST, 'index.html'), injectedIndexHtml, 'utf8');
copyDir(path.join(ROOT, 'src'), path.join(DIST, 'src'));
copyDir(path.join(ROOT, 'public'), path.join(DIST, 'public'));

// Build standalone single-file HTML bundle (no external CSS/JS module requests, loads ./public assets if beside dist)
const css = fs.readFileSync(path.join(ROOT, 'src/styles.css'), 'utf8');
const storyJs = fs.readFileSync(path.join(ROOT, 'src/story-data.js'), 'utf8');
const audioJs = fs.readFileSync(path.join(ROOT, 'src/audio-fx.js'), 'utf8')
  .replace(/export const soundFX =/g, 'const soundFX =')
  .replace(/export default soundFX;/g, '');
const engineJs = fs.readFileSync(path.join(ROOT, 'src/game-engine.js'), 'utf8')
  .replace(/^import .* from '\.\/story-data\.js';\s*$/gm, '')
  .replace(/export const /g, 'const ')
  .replace(/export function /g, 'function ');
const scooterJs = fs.readFileSync(path.join(ROOT, 'src/scooter-minigame.js'), 'utf8')
  .replace(/export class /g, 'class ')
  .replace(/export default GrandmaScooterGame;/g, '');
const uiJs = fs.readFileSync(path.join(ROOT, 'src/ui-app.js'), 'utf8')
  .replace(/^import\s*\{[\s\S]*?\}\s*from\s*'\.\/[^']+';\s*$/gm, '')
  .replace(/^import\s+\w+\s+from\s*'\.\/[^']+';\s*$/gm, '');
const cleanStory = storyJs.replace(/export const /g, 'const ');

const standaloneHtml = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Grand Theft Agency｜電通台灣一日風雲・決策智慧 2018–2026（單檔版）</title>
  <style>\n${css}\n  </style>
</head>
<body>
  <div id="app" class="gta-shell"></div>
  <script>window.__GOOGLE_MAPS_API_KEY__ = ${JSON.stringify(MAPS_API_KEY)};</script>
  <script>
(() => {
'use strict';
${cleanStory}
${audioJs}
${engineJs}
${scooterJs}
${uiJs}
})();
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(DIST, 'gta-dentsu-taiwan-standalone.html'), standaloneHtml, 'utf8');
console.log('Built dist/ and dist/gta-dentsu-taiwan-standalone.html');
