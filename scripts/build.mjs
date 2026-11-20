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
function stripModuleSyntax(code) {
  return code
    .replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"]\.[^'"]*['"];\s*$/gm, '')
    .replace(/^import\s+\w+\s+from\s+['"]\.[^'"]*['"];\s*$/gm, '')
    .replace(/^export\s*\{[^}]*\};\s*$/gm, '')
    .replace(/^export\s+default\s+\w+;\s*$/gm, '')
    .replace(/^export\s+(const|let|var|function|class)\s+/gm, '$1 ');
}

const css = fs.readFileSync(path.join(ROOT, 'src/styles.css'), 'utf8');
const bundledModules = [
  'src/story-data.js',
  'src/role-stories.js',
  'src/locales/ui-strings.js',
  'src/locales/story-en.js',
  'src/locales/roles-en-1.js',
  'src/locales/roles-en-2.js',
  'src/locales/story-ja.js',
  'src/locales/roles-ja-1.js',
  'src/locales/roles-ja-2.js',
  'src/i18n.js',
  'src/audio-fx.js',
  'src/game-engine.js',
  'src/scooter-minigame.js',
  'src/ui-graphics.js',
  'src/ui-app.js'
].map((rel) => stripModuleSyntax(fs.readFileSync(path.join(ROOT, rel), 'utf8'))).join('\n\n');

const standaloneHtml = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Grand Theft Agency｜電通台灣一日風雲・決策智慧 2018–2026（單檔版）</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%23006b54'/><rect x='2' y='2' width='28' height='28' rx='6' fill='none' stroke='%23ffffff' stroke-width='2'/><text x='16' y='21' text-anchor='middle' font-family='sans-serif' font-size='13' font-weight='bold' fill='%23ffffff'>A25</text></svg>" />
  <style>\n${css}\n  </style>
</head>
<body>
  <div id="app" class="gta-shell"></div>
  <script>window.__GOOGLE_MAPS_API_KEY__ = ${JSON.stringify(MAPS_API_KEY)};</script>
  <script>
(() => {
'use strict';
${bundledModules}
})();
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(DIST, 'gta-dentsu-taiwan-standalone.html'), standaloneHtml, 'utf8');
console.log('Built dist/ and dist/gta-dentsu-taiwan-standalone.html');
