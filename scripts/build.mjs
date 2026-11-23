import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

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

function copyDir(src, dest, transformJs = null) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d, transformJs);
    } else if (!entry.name.endsWith('.log') && !entry.name.endsWith('.png')) {
      if (transformJs && entry.name.endsWith('.js')) {
        fs.writeFileSync(d, transformJs(fs.readFileSync(s, 'utf8')), 'utf8');
      } else {
        fs.copyFileSync(s, d);
      }
    }
  }
}

// Build a single-file offline edition with local images, cutscenes and voices.
function stripModuleSyntax(code) {
  return code
    .replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"]\.[^'"]*['"];\s*$/gm, '')
    .replace(/^import\s+\w+\s+from\s+['"]\.[^'"]*['"];\s*$/gm, '')
    .replace(/^export\s*\{[^}]*\};\s*$/gm, '')
    .replace(/^export\s+default\s+\w+;\s*$/gm, '')
    .replace(/^export\s+(const|let|var|function|class)\s+/gm, '$1 ');
}

const css = fs.readFileSync(path.join(ROOT, 'src/styles.css'), 'utf8');
const roleChapterFiles = fs
  .readdirSync(path.join(ROOT, 'src/locales/role-chapters'))
  .filter((name) => name.startsWith('role-') && name.endsWith('.js'))
  .sort()
  .map((name) => `src/locales/role-chapters/${name}`);

const bundledModules = [
  'src/story-data.js',
  ...roleChapterFiles,
  'src/locales/role-chapters/index.js',
  'src/role-stories.js',
  'src/locales/ui-strings.js',
  'src/locales/story-en.js',
  'src/locales/roles-en-1.js',
  'src/locales/roles-en-2.js',
  'src/locales/story-ja.js',
  'src/locales/roles-ja-1.js',
  'src/locales/roles-ja-2.js',
  'src/i18n.js',
  'src/game-assets.js',
  'src/audio-fx.js',
  'src/game-engine.js',
  'src/scooter-minigame.js',
  'src/ui-graphics.js',
  'src/launch-kit.js',
  'src/responsive-layout.js',
  'src/ui-app.js'
].map((rel) => stripModuleSyntax(fs.readFileSync(path.join(ROOT, rel), 'utf8'))).join('\n\n');

const BUILD_VER = crypto.createHash('sha256').update(css).update(bundledModules).digest('hex').slice(0, 10);

function bustRelativeImports(code) {
  return code
    .replace(/from\s+(['"])(\.\.?\/[^'"?]+?\.js)\1/g, (_, q, rel) => `from ${q}${rel}?v=${BUILD_VER}${q}`)
    .replace(/import\(\s*(['"])(\.\.?\/[^'"?]+?\.js)\1\s*\)/g, (_, q, rel) => `import(${q}${rel}?v=${BUILD_VER}${q})`);
}

const rawIndexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const injectedIndexHtml = rawIndexHtml
  .replace('./src/styles.css', `./src/styles.css?v=${BUILD_VER}`)
  .replace(
    '<script type="module" src="./src/ui-app.js"></script>',
    `<script>window.__GOOGLE_MAPS_API_KEY__ = ${JSON.stringify(MAPS_API_KEY)};</script>\n  <script type="module" src="./src/ui-app.js?v=${BUILD_VER}"></script>`
  );
fs.writeFileSync(path.join(DIST, 'index.html'), injectedIndexHtml, 'utf8');
if (fs.existsSync(path.join(ROOT, 'slides.html'))) {
  fs.copyFileSync(path.join(ROOT, 'slides.html'), path.join(DIST, 'slides.html'));
}
if (fs.existsSync(path.join(ROOT, 'manifest.webmanifest'))) {
  fs.copyFileSync(path.join(ROOT, 'manifest.webmanifest'), path.join(DIST, 'manifest.webmanifest'));
}
copyDir(path.join(ROOT, 'src'), path.join(DIST, 'src'), bustRelativeImports);
copyDir(path.join(ROOT, 'public'), path.join(DIST, 'public'));

const offlineTypes = { '.webp': 'image/webp', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg' };
const offlineAssets = {};
const publicDir = path.join(DIST, 'public');
function embedAssets(directory, prefix) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    const assetPath = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      embedAssets(file, assetPath);
      continue;
    }
    const type = offlineTypes[path.extname(entry.name)];
    if (type) offlineAssets[assetPath] = {
      type,
      base64: fs.readFileSync(file).toString('base64')
    };
  }
}
embedAssets(publicDir, './public');

const standaloneHtml = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#0b0616" />
  <meta name="description" content="電通台灣一日風雲《決策智慧 2018–2026》互動職場冒險（單檔離線版）。" />
  <title>Grand Theft Agency｜電通台灣一日風雲・決策智慧 2018–2026（單檔版）</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%23006b54'/><rect x='2' y='2' width='28' height='28' rx='6' fill='none' stroke='%23ffffff' stroke-width='2'/><text x='16' y='21' text-anchor='middle' font-family='sans-serif' font-size='13' font-weight='bold' fill='%23ffffff'>A25</text></svg>" />
  <style>\n${css}\n  </style>
</head>
<body>
  <div id="app" class="gta-shell"></div>
  <script>window.__GTA_OFFLINE_ASSETS__ = ${JSON.stringify(offlineAssets)};</script>
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
