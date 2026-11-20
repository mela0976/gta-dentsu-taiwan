import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import os from 'node:os';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    const npxDir = path.join(os.homedir(), '.npm', '_npx');
    if (fs.existsSync(npxDir)) {
      for (const entry of fs.readdirSync(npxDir)) {
        const pkg = path.join(npxDir, entry, 'package.json');
        if (fs.existsSync(pkg)) {
          try {
            const req = createRequire(pkg);
            return req('playwright');
          } catch {}
        }
      }
    }
    throw new Error('Playwright package not found.');
  }
}

function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const cleanPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const rel = cleanPath === '/' ? 'index.html' : cleanPath.replace(/^\/+/, '');
      const fullPath = path.resolve(rootDir, rel);
      if (!fullPath.startsWith(rootDir) || !fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(fullPath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(fullPath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

async function checkImagesLoaded(page, label) {
  await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('img')].filter((img) => getComputedStyle(img).display !== 'none');
    await Promise.all(imgs.map((img) => (
      img.complete ? null : new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, 4000);
      })
    )));
  });
  const broken = await page.evaluate(() =>
    [...document.querySelectorAll('img')]
      .filter((img) => img.offsetParent !== null && getComputedStyle(img).display !== 'none')
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.getAttribute('src'))
  );
  assert.equal(broken.length, 0, `${label}: Broken visible images: ${broken.join(', ')}`);
}

async function checkDesktopGeometry(page, label, checkReveal = false) {
  const geo = await page.evaluate((wantReveal) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const docSw = document.documentElement.scrollWidth;
    const docSh = document.documentElement.scrollHeight;

    const meters = [...document.querySelectorAll('.meter-box')].map((b) => {
      const r = b.getBoundingClientRect();
      const sp = b.querySelector('.meter-label span');
      return {
        text: b.textContent,
        left: r.left,
        right: r.right,
        trunc: sp ? sp.scrollWidth > sp.clientWidth + 1 : false
      };
    });
    const meterOverlap = meters.some((m, i) => meters[i + 1] && m.right > meters[i + 1].left + 1);
    const meterTruncated = meters.filter((m) => m.trunc).map((m) => m.text);

    const media = document.querySelector('.scene-media-viewport')?.getBoundingClientRect();
    const controls = document.querySelector('.track-controls')?.getBoundingClientRect();
    const controlOverlap = Boolean(media && controls && controls.top < media.bottom - 1);

    let takeawayH = null;
    if (wantReveal) {
      takeawayH = document.querySelector('.takeaway-card')?.getBoundingClientRect()?.height || 0;
    }

    return {
      vw,
      vh,
      docSw,
      docSh,
      meterOverlap,
      meterTruncated,
      controlsH: controls ? Math.round(controls.height) : 0,
      controlOverlap,
      takeawayH
    };
  }, checkReveal);

  assert.ok(geo.docSw <= geo.vw, `${label}: Horizontal overflow (${geo.docSw} > ${geo.vw})`);
  assert.ok(geo.docSh <= geo.vh + 1, `${label}: Vertical overflow (${geo.docSh} > ${geo.vh})`);
  assert.equal(geo.meterOverlap, false, `${label}: HUD meters overlapped`);
  assert.deepEqual(geo.meterTruncated, [], `${label}: HUD meter labels truncated: ${geo.meterTruncated.join(', ')}`);
  assert.equal(geo.controlOverlap, false, `${label}: Controls overlapped scene media viewport`);
  assert.ok(geo.controlsH <= 98, `${label}: track-controls wrapped unexpectedly tall (${geo.controlsH}px)`);
  if (checkReveal) {
    assert.ok(geo.takeawayH >= 100, `${label}: Takeaway card crushed (${geo.takeawayH}px)`);
  }
}

async function proofreadPage(page, forbiddenWords, label) {
  const txt = await page.evaluate(() => document.body.innerText);
  for (const word of forbiddenWords) {
    assert.equal(txt.includes(word), false, `${label}: Forbidden copy found -> "${word}"`);
  }
}

async function run() {
  assert.ok(fs.existsSync(path.join(DIST, 'index.html')), 'Missing dist/index.html; run npm run build first.');
  const ssIdx = process.argv.indexOf('--screenshots');
  const ssDir = ssIdx >= 0 ? process.argv[ssIdx + 1] : null;
  if (ssDir) fs.mkdirSync(ssDir, { recursive: true });

  const { chromium } = await loadPlaywright();
  const { server, baseUrl } = await startStaticServer(DIST);
  const launchOpts = fs.existsSync(CHROME_PATH) ? { headless: true, executablePath: CHROME_PATH } : { headless: true };
  const browser = await chromium.launch(launchOpts);

  const FORBIDDEN_WORDS = ['陶豬', '逃豬', '松仁路 100 號', '视频', '软件', '信息', '优化', '项目', '营销', '网络', '内存', '默认', '界面', '联系', '账号'];
  const errors = [];

  const attachErrorWatchers = (page, tag) => {
    page.on('pageerror', (e) => errors.push(`${tag} pageerror: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`${tag} console.error: ${m.text()}`); });
    page.on('response', (r) => {
      if (r.url().startsWith(baseUrl) && r.status() >= 400) {
        errors.push(`${tag} HTTP ${r.status()}: ${r.url()}`);
      }
    });
  };

  try {
    // 0. Verify all 36 VoAI 春枝 MP3 clips serve cleanly over HTTP
    const grandmaClipIds = [
      'quote',
      ...Array.from({ length: 5 }, (_, i) => `rescue_${i}`),
      ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_quip`),
      ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_call`),
      ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_clue`)
    ];
    for (const id of grandmaClipIds) {
      const res = await fetch(`${baseUrl}/public/audio/grandma/${id}.mp3`);
      assert.equal(res.status, 200, `Expected HTTP 200 for ${id}.mp3, got ${res.status}`);
      assert.ok((res.headers.get('content-type') || '').includes('audio/mpeg'), `Bad Content-Type for ${id}.mp3`);
      const buf = Buffer.from(await res.arrayBuffer());
      assert.ok(buf.length > 2048, `Expected ${id}.mp3 > 2048 bytes, got ${buf.length}`);
    }

    // 1. Multi-resolution geometry & interactive matrix (1024x720, 1280x800, 1920x1080)
    for (const [w, h, name] of [[1024, 720, 'compact-1024'], [1280, 800, 'laptop-1280'], [1920, 1080, 'fhd-1920']]) {
      const page = await browser.newPage({ viewport: { width: w, height: h } });
      attachErrorWatchers(page, name);
      await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
      await checkImagesLoaded(page, `${name}-title`);

      // Test AMA666 cheat code unlock + banner feedback + enter role select
      await page.fill('.cheat-input', 'AMA666');
      await page.click('.plate-box .btn-ghost');
      await page.waitForSelector('.hero-body .rescue-toast');
      await page.click('.hero-actions .btn-primary');
      await page.waitForSelector('.role-grid');
      await checkImagesLoaded(page, `${name}-roles`);

      const roleCount = await page.locator('.role-card:not([disabled])').count();
      assert.equal(roleCount, 5, `${name}: Expected all 5 roles unlocked by AMA666, got ${roleCount}`);

      await page.click('.role-card');
      await page.waitForSelector('.cutscene-video');
      await page.click('.chapter-header .btn-primary');
      await page.waitForSelector('.play-grid');
      await checkImagesLoaded(page, `${name}-scene`);
      await checkDesktopGeometry(page, `${name}-scene`, false);
      if (ssDir && name === 'compact-1024') {
        await page.screenshot({ path: path.join(ssDir, 'e2e-1024-scene.png') });
      }

      // Test scene tabs, FSD toggle, radio, voice, mute, and Escape-closable modals
      await page.click('button:has-text("A25實拍")');
      await page.waitForTimeout(120);
      await checkImagesLoaded(page, `${name}-a25photo`);
      await page.click('button:has-text("Tesla FSD")');
      await page.waitForSelector('.scene-fsd svg');
      await page.click('button:has-text("3D劇照")');

      await page.click('button:has-text("放大街景")');
      await page.waitForSelector('.modal-box');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.modal-box').count(), 0, `${name}: Escape did not close StreetView modal`);

      await page.click('.hud-btn.is-gold');
      await page.waitForSelector('.scooter-canvas');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.scooter-canvas').count(), 0, `${name}: Escape did not close Scooter modal`);

      await page.click('.hud-btn.is-radio');
      assert.ok((await page.locator('.hud-btn.is-radio').textContent()).includes('88.6'), `${name}: Radio did not cycle to FM 88.6`);

      await page.click('.reply-btn');
      await page.waitForSelector('.paper-card');
      await page.click('.paper-card');
      await page.waitForSelector('.stamp-slot');
      await page.waitForTimeout(650);
      await checkDesktopGeometry(page, `${name}-reveal`, true);
      if (ssDir && (name === 'compact-1024' || name === 'laptop-1280')) {
        await page.screenshot({ path: path.join(ssDir, `e2e-${name}-reveal.png`) });
      }
      await page.close();
    }

    // 2. Full 10-chapter playthrough across ALL 6 mini-games + Ch6 grandma call + copy scan + review page
    const play = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    attachErrorWatchers(play, 'full-playthrough');
    await play.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
    await play.click('.hero-actions .btn-primary');
    await play.waitForSelector('.role-card');
    await play.locator('.role-card').nth(1).click(); // Strategic Planner

    for (let ch = 1; ch <= 10; ch += 1) {
      const phase = await play.evaluate(() => window.__gtaApp.state.phase);
      if (phase === 'cutscene') {
        await play.click('.chapter-header .btn-primary');
      }
      await play.waitForSelector('.replies-grid');
      await proofreadPage(play, FORBIDDEN_WORDS, `ch${ch}-scene`);
      await checkImagesLoaded(play, `ch${ch}-scene`);

      if (ch === 1) {
        // Test phone 4 tabs + Lisa/Cindy voice UI + VoAI 春枝 Grandma tab
        await play.click('.phone-tab:has-text("讀心")');
        await play.locator('.twin-row').first().click();
        await play.waitForSelector('.replay-btn');
        await play.click('.phone-tab:has-text("阿嬤")');
        await play.waitForSelector('text=VoAI 聲優「春枝」');
        await play.click('button:has-text("重聽金句")');
        await play.click('button:has-text("重聽來電")');
        await play.click('.phone-tab:has-text("GTA6")');
        await play.waitForSelector('.gta6-analysis-card');
        await play.click('.phone-tab:has-text("LINE")');
      }

      // Pick Balanced/Judge option (index 2)
      await play.locator('.reply-btn').nth(2).click();

      if (ch < 10) {
        const gtype = await play.evaluate(() => window.__gtaApp.state.phase === 'game' ? (window.__gtaApp.state && window.__gtaApp) && document.querySelector('.main-stage')?.textContent : '');
        assert.ok(gtype !== undefined);
        const type = await play.evaluate(() => {
          const idx = window.__gtaApp.state.chapterIndex;
          return ['pick', 'slider', 'slider', 'swipe', 'slider', 'swipe', 'multi', 'stop', 'agent', 'none'][idx];
        });

        if (type === 'pick' || type === 'agent') {
          await play.waitForSelector('.paper-card');
          await play.locator('.paper-card').nth(1).click();
        } else if (type === 'slider') {
          await play.waitForSelector('.slider-box');
          await play.locator('.preset-chip').nth(2).click();
          await play.click('.slider-box .btn-primary');
        } else if (type === 'swipe') {
          for (let card = 0; card < 4; card += 1) {
            await play.waitForSelector('.swipe-card');
            await play.click('.swipe-actions .btn-primary');
            if (ch === 6 && card === 2) {
              await play.waitForSelector('.modal-box');
              await play.click('.modal-box .btn-gold');
              break;
            }
          }
        } else if (type === 'multi') {
          await play.waitForSelector('.paper-card');
          await play.locator('.paper-card').nth(0).click();
          await play.locator('.paper-card').nth(1).click();
          await play.click('.main-stage .btn-primary');
        } else if (type === 'stop') {
          await play.waitForSelector('.stop-arena');
          await play.click('.main-stage .btn-primary');
        }
      }

      await play.waitForSelector('.stamp-slot');
      if (ch === 1) {
        await play.click('button:has-text("聽春枝阿嬤配音")');
      }
      await proofreadPage(play, FORBIDDEN_WORDS, `ch${ch}-reveal`);
      await play.click('.reveal-actions .btn-primary');
    }

    await play.waitForSelector('.review-stage');
    await proofreadPage(play, FORBIDDEN_WORDS, 'review-stage');
    const reviewCheck = await play.evaluate(() => ({
      historyCards: document.querySelectorAll('.review-history-grid > div').length,
      stamp: Boolean(document.querySelector('.review-stamp svg')),
      overflowX: document.documentElement.scrollWidth > window.innerWidth,
      replayBtnBottom: document.querySelector('.review-actions .btn-primary').getBoundingClientRect().bottom,
      guideTop: document.querySelector('.bottom-guide-bar').getBoundingClientRect().top
    }));
    assert.equal(reviewCheck.historyCards, 10, 'Expected 10 chapter history items on review stage');
    assert.equal(reviewCheck.stamp, true, 'Missing temple stamp on review stage');
    assert.equal(reviewCheck.overflowX, false, 'Horizontal overflow on review stage');
    await play.locator('.review-actions .btn-primary').scrollIntoViewIfNeeded();
    if (ssDir) await play.screenshot({ path: path.join(ssDir, 'e2e-review-1280.png') });
    await play.click('.review-actions .btn-primary');
    await play.waitForSelector('.role-grid');
    await play.close();

    // 3. Mobile 390x844 layout & scroll check
    const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    attachErrorWatchers(mob, 'mobile-390');
    await mob.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
    await mob.click('.hero-actions .btn-primary');
    await mob.waitForSelector('.role-card');
    await mob.click('.role-card');
    await mob.waitForSelector('.cutscene-video');
    await mob.click('.chapter-header .btn-primary');
    await mob.waitForSelector('.play-grid');
    await checkImagesLoaded(mob, 'mobile-scene');
    const mobSw = await mob.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(mobSw <= 390, `Mobile horizontal overflow: ${mobSw}`);
    await mob.close();

    // 4. Standalone single-file HTML smoke check
    const solo = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    attachErrorWatchers(solo, 'standalone-1920');
    await solo.goto(`${baseUrl}/gta-dentsu-taiwan-standalone.html`, { waitUntil: 'networkidle' });
    await solo.click('.hero-actions .btn-primary');
    await solo.waitForSelector('.role-card');
    await solo.click('.role-card');
    await solo.waitForSelector('.cutscene-video');
    await solo.click('.chapter-header .btn-primary');
    await solo.waitForSelector('.play-grid');
    await checkImagesLoaded(solo, 'standalone-scene');
    await checkDesktopGeometry(solo, 'standalone-1920-scene', false);
    if (ssDir) await solo.screenshot({ path: path.join(ssDir, 'e2e-1920-standalone.png') });
    await solo.close();

    assert.deepEqual(errors, [], `Browser errors detected:\n${errors.join('\n')}`);
    console.log('E2E VERIFY PASSED: 1024x720, 1280x800, 1920x1080, 390x844, full 10-chapter playthrough, 6 mini-games, Ch6 grandma call, review stage, copy proofread, and standalone HTML verified with 0 errors.');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error('E2E VERIFY FAILED:', err);
  process.exit(1);
});
