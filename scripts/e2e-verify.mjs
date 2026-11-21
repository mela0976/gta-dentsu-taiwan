import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import os from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

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
  '.webmanifest': 'application/manifest+json; charset=utf-8',
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
    const leftControlBtns = document.querySelectorAll('.track-controls .ctl-row > button').length;

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
      leftControlBtns,
      controlOverlap,
      takeawayH
    };
  }, checkReveal);

  assert.ok(geo.docSw <= geo.vw, `${label}: Horizontal overflow (${geo.docSw} > ${geo.vw})`);
  assert.ok(geo.docSh <= geo.vh + 1, `${label}: Vertical overflow (${geo.docSh} > ${geo.vh})`);
  assert.equal(geo.meterOverlap, false, `${label}: HUD meters overlapped`);
  assert.deepEqual(geo.meterTruncated, [], `${label}: HUD meter labels truncated: ${geo.meterTruncated.join(', ')}`);
  assert.equal(geo.controlOverlap, false, `${label}: Controls overlapped scene media viewport`);
  assert.ok(geo.leftControlBtns <= 4, `${label}: Too many left control buttons (${geo.leftControlBtns} > 4)`);
  assert.ok(geo.controlsH <= 64, `${label}: track-controls too tall (${geo.controlsH}px)`);
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
    // 0. Verify all 354 Google Gemini TTS MP3 clips + 9 audio-enabled MP4 cutscenes across zh / en / ja serve cleanly over HTTP
    for (const prefix of ['', 'en/', 'ja/']) {
      const audioChecks = [
        ...['quote', ...Array.from({ length: 5 }, (_, i) => `rescue_${i}`), ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_quip`), ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_call`), ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_clue`)]
          .map((id) => `/public/audio/${prefix}grandma/${id}.mp3`),
        ...[
          ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_line`),
          ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_lisa`),
          ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_cindy`),
          ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_takeaway`),
          'fsd_on',
          'fsd_off',
          ...['account', 'creative', 'media', 'grandma'].flatMap((role) =>
            Array.from({ length: 10 }, (_, i) => `role_${role}_ch${i + 1}_line`)
          )
        ].map((id) => `/public/audio/${prefix}voices/${id}.mp3`)
      ];
      for (const relUrl of audioChecks) {
        const res = await fetch(`${baseUrl}${relUrl}`);
        assert.equal(res.status, 200, `Expected HTTP 200 for ${relUrl}, got ${res.status}`);
        assert.ok((res.headers.get('content-type') || '').includes('audio/mpeg'), `Bad Content-Type for ${relUrl}`);
        const buf = Buffer.from(await res.arrayBuffer());
        assert.ok(buf.length > 2048, `Expected ${relUrl} > 2048 bytes, got ${buf.length}`);
      }
      for (const vid of ['intro-taipei.mp4', 'boardroom-push.mp4', 'grandma-rescue.mp4']) {
        const res = await fetch(`${baseUrl}/public/video/${prefix}${vid}`);
        assert.equal(res.status, 200, `Expected HTTP 200 for ${prefix}${vid}`);
        const buf = Buffer.from(await res.arrayBuffer());
        assert.ok(buf.includes('soun') && buf.includes('mp4a'), `Cutscene missing audio track over HTTP: ${prefix}${vid}`);
      }
    }

    // 1. Multi-resolution geometry & interactive matrix (1024x720, 1280x800, 1920x1080)
    for (const [w, h, name] of [[1024, 720, 'compact-1024'], [1280, 800, 'laptop-1280'], [1920, 1080, 'fhd-1920']]) {
      const page = await browser.newPage({ viewport: { width: w, height: h } });
      await page.addInitScript(() => {
        window.__ttsSpeakCalls = 0;
        if (window.speechSynthesis && typeof window.speechSynthesis.speak === 'function') {
          const orig = window.speechSynthesis.speak.bind(window.speechSynthesis);
          window.speechSynthesis.speak = (...args) => {
            window.__ttsSpeakCalls += 1;
            return orig(...args);
          };
        }
      });
      attachErrorWatchers(page, name);
      await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
      await checkImagesLoaded(page, `${name}-title`);
      if (name === 'compact-1024') {
        const metaCheck = await page.evaluate(() => ({
          ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
          ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
          twitterCard: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || '',
          preloadHero: document.querySelector('link[rel="preload"][as="image"]')?.getAttribute('fetchpriority') || '',
          heroImgPriority: document.querySelector('.hero-media img')?.getAttribute('fetchpriority') || ''
        }));
        assert.ok(metaCheck.ogTitle.length > 5, 'Missing og:title metadata');
        assert.ok(metaCheck.ogImage.includes('scene-morning-scooter.webp'), 'Missing og:image metadata');
        assert.equal(metaCheck.twitterCard, 'summary_large_image', 'Missing twitter:card metadata');
        assert.equal(metaCheck.preloadHero, 'high', 'Missing LCP image preload fetchpriority=high');
        assert.equal(metaCheck.heroImgPriority, 'high', 'Hero LCP <img> missing fetchpriority=high');
      }
      const titleBounds = await page.evaluate(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const actionsRect = document.querySelector('.hero-actions')?.getBoundingClientRect();
        const plateRect = document.querySelector('.plate-box.is-optional')?.getBoundingClientRect();
        return {
          sw: document.documentElement.scrollWidth,
          sh: document.documentElement.scrollHeight,
          vw,
          vh,
          hasStoryCard: Boolean(document.querySelector('.hero-story-card')),
          flowSteps: document.querySelectorAll('.quickstart-step').length,
          actionsTop: actionsRect ? Math.round(actionsRect.top) : 0,
          actionsBottom: actionsRect ? Math.round(actionsRect.bottom) : 0,
          plateTop: plateRect ? Math.round(plateRect.top) : 0,
          plateBottom: plateRect ? Math.round(plateRect.bottom) : 0,
          guideTop: Math.round(document.querySelector('.bottom-guide-bar')?.getBoundingClientRect()?.top || vh)
        };
      });
      assert.equal(titleBounds.hasStoryCard, true, `${name}: Missing rewritten hero story card`);
      assert.equal(titleBounds.flowSteps, 3, `${name}: Expected 3 novice-friendly play flow steps on Title`);
      assert.ok(titleBounds.plateTop >= titleBounds.actionsBottom - 4, `${name}: Optional AMA666 box must sit below hero-actions`);
      assert.ok(titleBounds.actionsBottom <= titleBounds.guideTop, `${name}: Title actions overlapped guide bar (${titleBounds.actionsBottom} > ${titleBounds.guideTop})`);
      assert.ok(titleBounds.plateBottom <= titleBounds.guideTop, `${name}: Optional AMA666 box overlapped guide bar (${titleBounds.plateBottom} > ${titleBounds.guideTop})`);

      if (ssDir && name === 'compact-1024') {
        await page.screenshot({ path: path.join(ssDir, 'e2e-1024-title.png') });
      }

      // Test AMA666 cheat code unlock + banner feedback + enter role select
      await page.fill('.cheat-input', 'AMA666');
      await page.click('.plate-box .btn-ghost');
      await page.waitForSelector('.hero-body .rescue-toast');
      await page.click('.hero-actions .btn-primary');
      await page.waitForSelector('.role-grid');
      await checkImagesLoaded(page, `${name}-roles`);
      if (ssDir && name === 'compact-1024') {
        await page.screenshot({ path: path.join(ssDir, 'e2e-1024-roles.png') });
      }

      const roleCount = await page.locator('.role-card:not([disabled])').count();
      assert.equal(roleCount, 5, `${name}: Expected all 5 roles unlocked by AMA666, got ${roleCount}`);
      assert.equal(await page.locator('.role-route-itinerary').count(), 5, `${name}: Expected 5 role itinerary previews on role cards`);
      assert.equal(await page.locator('.role-rec-badge').count(), 1, `${name}: Expected beginner recommended badge on Role Select`);
      assert.equal(await page.locator('.role-pick-cta').count(), 5, `${name}: Expected 5 clickable footer CTAs on role cards`);
      const roleOverflow = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth > window.innerWidth,
        sh: document.documentElement.scrollHeight > window.innerHeight + 1
      }));
      assert.equal(roleOverflow.sw, false, `${name}: Role select horizontal overflow`);
      assert.equal(roleOverflow.sh, false, `${name}: Role select vertical overflow`);

      await page.click('.role-card');
      await page.waitForSelector('.cutscene-video');
      await page.click('.chapter-header .btn-primary');
      await page.waitForSelector('.play-grid');
      await page.waitForSelector('.quiz-guide-box');
      await page.waitForSelector('.zone-tag.is-ref');
      await page.waitForSelector('.zone-tag.is-action');
      await page.waitForSelector('.main-stage.is-action-focus');
      await page.waitForSelector('.beginner-coach-banner');
      assert.equal(await page.locator('.reply-cta').count(), 4, `${name}: Expected 4 clickable affordances on replies`);
      const repliesVisible = await page.evaluate(() => {
        const ms = document.querySelector('.main-stage')?.getBoundingClientRect();
        const btns = [...document.querySelectorAll('.reply-btn')];
        if (!ms || btns.length !== 4) return { ok: false, reason: 'missing elements' };
        const lastRect = btns[3].getBoundingClientRect();
        return {
          ok: lastRect.bottom <= ms.bottom + 2,
          lastBottom: Math.round(lastRect.bottom),
          stageBottom: Math.round(ms.bottom)
        };
      });
      assert.equal(repliesVisible.ok, true, `${name}: Reply buttons 3-4 clipped below fold (${repliesVisible.lastBottom} > ${repliesVisible.stageBottom})`);
      await checkImagesLoaded(page, `${name}-scene`);
      await checkDesktopGeometry(page, `${name}-scene`, false);
      if (ssDir && name === 'compact-1024') {
        await page.screenshot({ path: path.join(ssDir, 'e2e-1024-scene.png') });
      }

      // Test HUD help popover (on-demand beginner metric explainer)
      await page.click('#hud-help-trigger');
      await page.waitForSelector('#hud-help-popover:popover-open');
      await page.keyboard.press('Escape');

      // Test decluttered left scene controls & native #scene-more-views popover
      await page.click('#more-views-trigger');
      await page.waitForSelector('#scene-more-views:popover-open');
      await page.click('#scene-more-views button:has-text("A25實拍")');
      await page.waitForTimeout(120);
      await checkImagesLoaded(page, `${name}-a25photo`);

      await page.click('#more-views-trigger');
      await page.waitForSelector('#scene-more-views:popover-open');
      await page.click('#scene-more-views button:has-text("Tesla FSD")');
      await page.waitForSelector('.scene-fsd svg');
      await page.click('.track-controls button:has-text("3D劇照")');

      await page.click('#more-views-trigger');
      await page.waitForSelector('#scene-more-views:popover-open');
      await page.click('#scene-more-views button:has-text("放大")');
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
      assert.equal(await page.evaluate(() => localStorage.getItem('gta_dentsu_beginner_tip_v1')), '1', `${name}: First reply did not dismiss beginner tip`);
      await page.waitForSelector('.paper-card');
      await page.click('.paper-card');
      await page.waitForSelector('.stamp-slot');
      await page.waitForTimeout(650);
      await checkDesktopGeometry(page, `${name}-reveal`, true);
      const ttsCalls = await page.evaluate(() => window.__ttsSpeakCalls || 0);
      assert.equal(ttsCalls, 0, `${name}: Expected 0 browser Web Speech murmuring calls, got ${ttsCalls}`);
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
        const videoState = await play.evaluate(() => {
          const v = document.querySelector('.cutscene-video');
          const sub = document.querySelector('.cutscene-subtitle')?.textContent || '';
          return {
            hasMutedAttr: v?.hasAttribute('muted'),
            volume: v?.volume,
            subtitle: sub,
            hasSoundBtn: Boolean(document.querySelector('.cutscene-stage .mode-chip'))
          };
        });
        assert.equal(videoState.hasMutedAttr, false, `ch${ch}: cutscene <video> must not force muted attribute`);
        assert.equal(videoState.volume, 1, `ch${ch}: cutscene <video> volume must be 1.0`);
        assert.equal(videoState.hasSoundBtn, true, `ch${ch}: missing cutscene sound control button`);
        if (ch === 6) {
          assert.ok(videoState.subtitle.includes('你們先不要亂砍預算'), `ch6: unexpected cutscene subtitle: ${videoState.subtitle}`);
        }
        await play.click('.chapter-header .btn-primary');
      }
      await play.waitForSelector('.replies-grid');
      await proofreadPage(play, FORBIDDEN_WORDS, `ch${ch}-scene`);
      await checkImagesLoaded(play, `ch${ch}-scene`);

      if (ch === 1) {
        // Test phone 4 tabs + Lisa/Cindy voice UI + Google Gemini TTS Grandma tab
        await play.click('.phone-tab:has-text("讀心")');
        await play.locator('.twin-row').first().click();
        await play.waitForSelector('.replay-btn');
        await play.click('.phone-tab:has-text("阿嬤")');
        await play.waitForSelector('text=Google Gemini TTS「台灣阿嬤」');
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
              await play.waitForSelector('.swipe-card');
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
      assert.ok(await play.locator('.delta-chip').count() >= 1, `ch${ch}: expected stat delta chips on reveal stage`);
      if (ch === 1) {
        await play.click('button:has-text("聽台灣阿嬤配音")');
      }
      await proofreadPage(play, FORBIDDEN_WORDS, `ch${ch}-reveal`);
      await play.click('.reveal-actions .btn-primary');
    }

    await play.waitForSelector('.review-stage');
    await proofreadPage(play, FORBIDDEN_WORDS, 'review-stage');
    const reviewCheck = await play.evaluate(() => ({
      historyCards: document.querySelectorAll('.review-history-grid > div').length,
      stamp: Boolean(document.querySelector('.review-stamp svg')),
      achCount: document.querySelectorAll('.ach-badge').length,
      achUnlocked: document.querySelectorAll('.ach-badge.is-unlocked').length,
      hasSharePreview: Boolean(document.querySelector('#share-summary-text')?.textContent?.includes('mela0976.github.io')),
      overflowX: document.documentElement.scrollWidth > window.innerWidth,
      replayBtnBottom: document.querySelector('.review-actions .btn-primary').getBoundingClientRect().bottom,
      guideTop: document.querySelector('.bottom-guide-bar').getBoundingClientRect().top
    }));
    assert.equal(reviewCheck.historyCards, 10, 'Expected 10 chapter history items on review stage');
    assert.equal(reviewCheck.stamp, true, 'Missing temple stamp on review stage');
    assert.equal(reviewCheck.achCount, 6, 'Expected 6 career milestone badges on review stage');
    assert.ok(reviewCheck.achUnlocked >= 1, 'Expected at least 1 unlocked achievement on review completion');
    assert.equal(reviewCheck.hasSharePreview, true, 'Missing share summary text on review stage');
    assert.equal(reviewCheck.overflowX, false, 'Horizontal overflow on review stage');

    // Verify Invoker copy button + PNG card download + native Restart <dialog> + mute persistence
    await play.click('.copy-button');
    await play.waitForFunction(() => Boolean(document.querySelector('.copy-tip')?.textContent?.trim()));
    await play.click('.share-actions .btn-gold');
    await play.waitForTimeout(150);

    await play.locator('.review-actions .btn-primary').scrollIntoViewIfNeeded();
    if (ssDir) await play.screenshot({ path: path.join(ssDir, 'e2e-review-1280.png') });
    await play.click('.review-actions .btn-primary');
    await play.waitForSelector('.role-grid');
    assert.ok(await play.locator('.role-cleared-badge').count() >= 1, 'Expected cleared badge on role card after finishing shift');

    // Test native <dialog> Restart confirm & audio mute persistence across reload
    await play.click('.role-card');
    await play.waitForSelector('.hud-bar');
    await play.click('[data-mute-btn]');
    await play.click('.hud-bar button:has-text("重開")');
    await play.waitForSelector('dialog.confirm-modal[open]');
    await play.click('dialog.confirm-modal .btn-ghost');
    assert.equal(await play.locator('dialog.confirm-modal[open]').count(), 0, 'Confirm dialog did not close on cancel');
    await play.click('.hud-bar button:has-text("重開")');
    await play.waitForSelector('dialog.confirm-modal[open]');
    await play.click('dialog.confirm-modal .btn-primary');
    await play.waitForSelector('.role-grid');
    await play.reload({ waitUntil: 'networkidle' });
    await play.click('.role-card');
    await play.waitForSelector('[data-mute-btn]');
    const persistedMute = await play.textContent('[data-mute-btn]');
    assert.ok(persistedMute.includes('靜音'), `Expected muted preference to persist across reload, got "${persistedMute}"`);
    await play.close();

    // 3. Mobile responsive checks (320x568, 375x667, 390x844 with touch + trilingual)
    const mob375 = await browser.newPage({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });
    attachErrorWatchers(mob375, 'mobile-375');
    await mob375.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
    const titleMetrics = await mob375.evaluate(() => {
      const inp = document.querySelector('.cheat-input');
      const btn = document.querySelector('.hero-actions .btn-primary');
      return {
        sw: document.documentElement.scrollWidth,
        inputFs: inp ? parseFloat(getComputedStyle(inp).fontSize) : 0,
        startBtnH: btn ? Math.round(btn.getBoundingClientRect().height) : 0
      };
    });
    assert.ok(titleMetrics.sw <= 375, `Mobile 375 title horizontal overflow: ${titleMetrics.sw}`);
    assert.ok(titleMetrics.inputFs >= 16, `Mobile .cheat-input fontSize too small for iOS Safari: ${titleMetrics.inputFs}px`);
    assert.ok(titleMetrics.startBtnH >= 44, `Mobile Start CTA touch target too small: ${titleMetrics.startBtnH}px`);
    if (ssDir) await mob375.screenshot({ path: path.join(ssDir, 'e2e-mobile-375-title.png') });

    await mob375.click('.hero-actions .btn-primary');
    await mob375.waitForSelector('.role-card');
    const rolesSw = await mob375.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(rolesSw <= 375, `Mobile 375 roles horizontal overflow: ${rolesSw}`);
    if (ssDir) await mob375.screenshot({ path: path.join(ssDir, 'e2e-mobile-375-roles.png') });

    await mob375.click('.role-card');
    await mob375.waitForSelector('.cutscene-video');
    assert.ok(await mob375.evaluate(() => document.documentElement.scrollWidth <= 375), 'Mobile 375 cutscene overflow');
    await mob375.click('.chapter-header .btn-primary');
    await mob375.waitForSelector('.play-grid');
    await mob375.waitForSelector('.beginner-coach-banner');
    await mob375.click('.beginner-coach-banner button:has-text("我懂了")');
    assert.equal(await mob375.locator('.beginner-coach-banner').count(), 0, 'Beginner coach dismiss button did not hide banner');
    await checkImagesLoaded(mob375, 'mobile-375-scene');

    const hudAndTabs = await mob375.evaluate(() => {
      const hud = document.querySelector('.hud-bar').getBoundingClientRect();
      const bar = document.querySelector('.bottom-guide-bar').getBoundingClientRect();
      const tabs = [...document.querySelectorAll('.mobile-tab-btn')].map((b) => ({
        id: b.getAttribute('data-mobile-tab'),
        h: Math.round(b.getBoundingClientRect().height)
      }));
      return {
        sw: document.documentElement.scrollWidth,
        hudH: Math.round(hud.height),
        barH: Math.round(bar.height),
        tabs
      };
    });
    assert.ok(hudAndTabs.sw <= 375, `Mobile 375 mission horizontal overflow: ${hudAndTabs.sw}`);
    assert.ok(hudAndTabs.hudH <= 86, `Mobile collapsed HUD too tall: ${hudAndTabs.hudH}px`);
    assert.ok(hudAndTabs.barH <= 78, `Mobile bottom tab bar too tall: ${hudAndTabs.barH}px`);
    assert.equal(hudAndTabs.tabs.length, 4, 'Expected 4 mobile bottom tabs');
    for (const tb of hudAndTabs.tabs) {
      assert.ok(tb.h >= 44, `Mobile tab ${tb.id} below 44px height: ${tb.h}`);
    }
    if (ssDir) await mob375.screenshot({ path: path.join(ssDir, 'e2e-mobile-375-mission.png') });

    // Test mobile HUD drawer expand/collapse & 5-meter non-truncation
    await mob375.click('.hud-mobile-toggle');
    const expandedHud = await mob375.evaluate(() => ({
      expanded: document.querySelector('.hud-mobile-toggle')?.getAttribute('aria-expanded'),
      sw: document.documentElement.scrollWidth,
      trunc: [...document.querySelectorAll('.hud-meters .meter-label span')]
        .filter((sp) => sp.scrollWidth > sp.clientWidth + 1)
        .map((sp) => sp.textContent)
    }));
    assert.equal(expandedHud.expanded, 'true', 'Mobile HUD toggle did not expand');
    assert.ok(expandedHud.sw <= 375, `Expanded mobile HUD caused overflow: ${expandedHud.sw}`);
    assert.deepEqual(expandedHud.trunc, [], `Expanded mobile HUD meter truncated: ${expandedHud.trunc.join(', ')}`);

    // Test Scooter modal on mobile: bottom bar hides, touch-action:none canvas, >=48px steering buttons
    await mob375.click('.hud-btn.is-gold');
    await mob375.waitForSelector('.scooter-canvas');
    const scooterMob = await mob375.evaluate(() => {
      const canvas = document.querySelector('.scooter-canvas');
      const bar = document.querySelector('.bottom-guide-bar');
      const btns = [...document.querySelectorAll('.scooter-controls .btn-cyan')].map((b) => Math.round(b.getBoundingClientRect().height));
      return {
        sw: document.documentElement.scrollWidth,
        touchAction: canvas ? getComputedStyle(canvas).touchAction : '',
        barHidden: bar ? getComputedStyle(bar).display === 'none' : false,
        steerBtnHs: btns
      };
    });
    assert.ok(scooterMob.sw <= 375, `Mobile 375 scooter modal overflow: ${scooterMob.sw}`);
    assert.equal(scooterMob.touchAction, 'none', `Scooter canvas missing touch-action:none (got ${scooterMob.touchAction})`);
    assert.equal(scooterMob.barHidden, true, 'Bottom guide bar should hide while mobile modal is open');
    assert.ok(scooterMob.steerBtnHs.length === 2 && scooterMob.steerBtnHs.every((h) => h >= 48), `Mobile scooter buttons too small: ${scooterMob.steerBtnHs}`);
    if (ssDir) await mob375.screenshot({ path: path.join(ssDir, 'e2e-mobile-375-scooter.png') });
    await mob375.click('.scooter-controls .btn-ghost');
    await mob375.waitForSelector('.mobile-tab-bar');

    // Test 4 mobile tabs & quick scene peek
    await mob375.click('.mobile-scene-peek');
    assert.equal(await mob375.getAttribute('.play-grid', 'data-mobile-panel'), 'scene', 'mobile-scene-peek did not switch to scene tab');
    assert.ok(await mob375.evaluate(() => document.querySelector('.scene-card').offsetParent !== null && document.documentElement.scrollWidth <= 375), 'Mobile scene panel visibility/width check failed');
    await mob375.click('.mobile-tab-btn[data-mobile-tab="phone"]');
    assert.ok(await mob375.evaluate(() => document.querySelector('#phone-card-panel').offsetParent !== null && document.documentElement.scrollWidth <= 375), 'Mobile phone tab check failed');
    await mob375.click('.mobile-tab-btn[data-mobile-tab="intel"]');
    assert.ok(await mob375.evaluate(() => document.querySelector('#clue-card-panel').offsetParent !== null && document.documentElement.scrollWidth <= 375), 'Mobile intel tab check failed');
    await mob375.click('.mobile-tab-btn[data-mobile-tab="mission"]');
    await mob375.locator('.reply-btn').first().click();
    await mob375.waitForSelector('.paper-card');
    assert.ok(await mob375.evaluate(() => document.documentElement.scrollWidth <= 375), 'Mobile mini-game horizontal overflow');
    await mob375.close();

    // Mobile 390x844 across zh / en / ja + Extreme narrow 320x568 sanity check
    for (const [mTag, mVp, mLang] of [
      ['390-zh', { width: 390, height: 844 }, 'zh'],
      ['390-en', { width: 390, height: 844 }, 'en'],
      ['390-ja', { width: 390, height: 844 }, 'ja'],
      ['320-zh', { width: 320, height: 568 }, 'zh']
    ]) {
      const mPage = await browser.newPage({ viewport: mVp, hasTouch: true, isMobile: true });
      attachErrorWatchers(mPage, `mobile-${mTag}`);
      await mPage.goto(`${baseUrl}/index.html?lang=${mLang}`, { waitUntil: 'networkidle' });
      assert.ok(await mPage.evaluate((vw) => document.documentElement.scrollWidth <= vw, mVp.width), `${mTag} title overflow`);
      await mPage.click('.hero-actions .btn-primary');
      await mPage.waitForSelector('.role-card');
      assert.ok(await mPage.evaluate((vw) => document.documentElement.scrollWidth <= vw, mVp.width), `${mTag} roles overflow`);
      await mPage.click('.role-card');
      await mPage.waitForSelector('.cutscene-video');
      await mPage.click('.chapter-header .btn-primary');
      await mPage.waitForSelector('.replies-grid');
      assert.ok(await mPage.evaluate((vw) => document.documentElement.scrollWidth <= vw, mVp.width), `${mTag} mission overflow`);
      if (mTag === '390-zh' && ssDir) await mPage.screenshot({ path: path.join(ssDir, 'e2e-mobile-390-mission.png') });
      await mPage.close();
    }

    // 4. Standalone single-file HTML smoke check
    const solo = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    attachErrorWatchers(solo, 'standalone-1920');
    const offlineCopy = fs.mkdtempSync(path.join(os.tmpdir(), 'gta-offline-'));
    const offlineHtml = path.join(offlineCopy, 'game.html');
    fs.copyFileSync(path.join(DIST, 'gta-dentsu-taiwan-standalone.html'), offlineHtml);
    await solo.context().setOffline(true);
    try {
      await solo.goto(pathToFileURL(offlineHtml).href);
      await solo.click('.hero-actions .btn-primary');
      await solo.waitForSelector('.role-card');
      await solo.click('.role-card');
      await solo.waitForFunction(() => {
        const video = document.querySelector('.cutscene-video');
        return video?.currentSrc.startsWith('blob:') && video.readyState >= 1;
      });
      assert.equal(await solo.evaluate(() => {
        const assets = window.__GTA_OFFLINE_ASSETS__;
        return Object.values(assets).filter(asset => asset.type === 'audio/mpeg').length;
      }), 354);
      await solo.click('.chapter-header .btn-primary');
      await solo.waitForSelector('.play-grid');
      await checkImagesLoaded(solo, 'standalone-scene');
      await checkDesktopGeometry(solo, 'standalone-1920-scene', false);
    } finally {
      await solo.close();
      fs.rmSync(offlineCopy, { recursive: true, force: true });
    }
    // 5. Interactive Step-by-Step Onboarding (<dialog>) & 7-Step Live HUD Tour (popover="manual")
    const tourPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    attachErrorWatchers(tourPage, 'onboarding-tour');
    await tourPage.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
    await tourPage.waitForSelector('.quickstart-strip');
    await tourPage.click('.hero-actions .btn-cyan'); // Open 3-slide Welcome dialog
    await tourPage.waitForSelector('dialog.tour-modal[open]');
    await proofreadPage(tourPage, FORBIDDEN_WORDS, 'tour-welcome-1');
    await tourPage.click('dialog.tour-modal .btn-primary'); // Slide 2
    await tourPage.waitForSelector('text=迎新簡報 2／3');
    await tourPage.click('dialog.tour-modal .btn-primary'); // Slide 3
    await tourPage.waitForSelector('text=迎新簡報 3／3');
    await tourPage.click('dialog.tour-modal .btn-primary'); // Launch Role Screen Step 1/7
    await tourPage.waitForSelector('dialog.hud-tour-popover');

    const expectedSelectors = ['.role-grid', '.hud-bar', '.scene-card', '#clue-card-panel', '.main-stage', '#phone-card-panel', '.bottom-guide-bar'];
    for (let i = 0; i < expectedSelectors.length; i += 1) {
      const sel = expectedSelectors[i];
      await tourPage.waitForSelector(`${sel}.tour-spotlight-target`);
      await proofreadPage(tourPage, FORBIDDEN_WORDS, `tour-step-${i + 1}`);
      await tourPage.click('dialog.hud-tour-popover .btn-primary');
    }
    assert.equal(await tourPage.locator('.tour-spotlight-target').count(), 0, 'Tour spotlight did not clear after finishing Step 7/7');
    assert.equal(await tourPage.evaluate(() => localStorage.getItem('gta_dentsu_tour_done_v1')), '1', 'Tour completion not saved');
    await tourPage.close();

    // 6. Verify all 5 roles produce 5 distinct Ch1 itineraries, storylines, LINE dilemmas, mini-game prompts, and fit all 4 replies cleanly at 1024x720
    const roleDiffPage = await browser.newPage({ viewport: { width: 1024, height: 720 } });
    attachErrorWatchers(roleDiffPage, 'role-diff');
    const seenItineraries = new Set();
    const seenHeadings = new Set();
    const seenScenes = new Set();
    const seenMessages = new Set();
    const seenPrompts = new Set();
    for (let rIdx = 0; rIdx < 5; rIdx += 1) {
      await roleDiffPage.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
      await roleDiffPage.evaluate(() => localStorage.clear());
      await roleDiffPage.reload({ waitUntil: 'networkidle' });
      await roleDiffPage.fill('.cheat-input', 'AMA666');
      await roleDiffPage.click('.plate-box .btn-ghost');
      await roleDiffPage.click('.hero-actions .btn-primary');
      await roleDiffPage.waitForSelector('.role-card');
      await roleDiffPage.locator('.role-card').nth(rIdx).click();
      await roleDiffPage.waitForSelector('.cutscene-video');
      await roleDiffPage.click('.chapter-header .btn-primary');
      await roleDiffPage.waitForSelector('.replies-grid');
      await proofreadPage(roleDiffPage, FORBIDDEN_WORDS, `role-${rIdx}-ch1-scene`);
      const roleRepliesVisible = await roleDiffPage.evaluate(() => {
        const ms = document.querySelector('.main-stage')?.getBoundingClientRect();
        const btns = [...document.querySelectorAll('.reply-btn')];
        if (!ms || btns.length !== 4) return { ok: false };
        const b = btns[3].getBoundingClientRect();
        return { ok: b.bottom <= ms.bottom + 2, diff: Math.round(b.bottom - ms.bottom) };
      });
      assert.equal(roleRepliesVisible.ok, true, `role-${rIdx} at 1024x720: 4th reply clipped (diff=${roleRepliesVisible.diff})`);

      const ch1Kicker = await roleDiffPage.locator('.main-stage .chapter-header .gta-kicker').textContent();
      const ch1Heading = await roleDiffPage.locator('.main-stage .chapter-header h2').textContent();
      const ch1Scene = await roleDiffPage.locator('.main-stage .chapter-desc').textContent();
      const ch1Msg = await roleDiffPage.locator('.boss-callout.line-banner div div:nth-child(2)').textContent();
      seenItineraries.add(ch1Kicker.trim());
      seenHeadings.add(ch1Heading.trim());
      seenScenes.add(ch1Scene.trim());
      seenMessages.add(ch1Msg.trim());

      await roleDiffPage.locator('.reply-btn').first().click();
      await roleDiffPage.waitForSelector('.paper-grid');
      const ch1Prompt = await roleDiffPage.locator('.main-stage h3').first().textContent();
      seenPrompts.add(ch1Prompt.trim());
      await proofreadPage(roleDiffPage, FORBIDDEN_WORDS, `role-${rIdx}-ch1-game`);
    }
    assert.equal(seenItineraries.size, 5, `Expected 5 distinct Ch1 itinerary timeSlots across roles, got ${seenItineraries.size}`);
    assert.equal(seenHeadings.size, 5, `Expected 5 distinct Ch1 itinerary locations/titles across roles, got ${seenHeadings.size}`);
    assert.equal(seenScenes.size, 5, `Expected 5 distinct Ch1 scene descriptions across roles, got ${seenScenes.size}`);
    assert.equal(seenMessages.size, 5, `Expected 5 distinct Ch1 LINE messages across roles, got ${seenMessages.size}`);
    assert.equal(seenPrompts.size, 5, `Expected 5 distinct Ch1 mini-game prompts across roles, got ${seenPrompts.size}`);
    await roleDiffPage.close();

    // 7. Trilingual UI switching (zh -> en -> ja), 0 CJK leak in EN, 1024x720 geometry across all 5 roles, & EN/JA MP3 + standalone HTML check
    for (const [langCode, htmlLangPrefix] of [['en', 'en'], ['ja', 'ja']]) {
      const i18nPage = await browser.newPage({ viewport: { width: 1024, height: 720 } });
      await i18nPage.addInitScript(() => {
        window.__ttsSpeakCalls = 0;
        if (window.speechSynthesis && typeof window.speechSynthesis.speak === 'function') {
          const orig = window.speechSynthesis.speak.bind(window.speechSynthesis);
          window.speechSynthesis.speak = (...args) => {
            window.__ttsSpeakCalls += 1;
            return orig(...args);
          };
        }
      });
      attachErrorWatchers(i18nPage, `i18n-${langCode}`);
      const audioResponses = [];
      i18nPage.on('response', (res) => {
        if (res.url().includes(`/public/audio/${langCode}/`)) {
          audioResponses.push({ url: res.url(), status: res.status() });
        }
      });

      await i18nPage.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
      await i18nPage.click(`.lang-btn[data-lang="${langCode}"]`);
      const actualHtmlLang = await i18nPage.getAttribute('html', 'lang');
      assert.ok(actualHtmlLang.startsWith(htmlLangPrefix), `${langCode}: unexpected html[lang]=${actualHtmlLang}`);
      await proofreadPage(i18nPage, FORBIDDEN_WORDS, `${langCode}-title`);

      if (langCode === 'en') {
        const cjkInEnTitle = await i18nPage.evaluate(() => {
          const clone = document.body.cloneNode(true);
          clone.querySelectorAll('.lang-switch').forEach((n) => n.remove());
          return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(clone.innerText);
        });
        assert.equal(cjkInEnTitle, false, 'EN title leaked CJK characters outside language switcher');
      }

      // Check all 5 roles at 1024x720 for meter truncation and 4th reply visibility, plus voice click
      for (let rIdx = 0; rIdx < 5; rIdx += 1) {
        await i18nPage.evaluate((lc) => {
          localStorage.clear();
          localStorage.setItem('gta_dentsu_lang_v1', lc);
        }, langCode);
        await i18nPage.goto(`${baseUrl}/index.html?lang=${langCode}`, { waitUntil: 'networkidle' });
        await i18nPage.fill('.cheat-input', 'AMA666');
        await i18nPage.click('.plate-box .btn-ghost');
        await i18nPage.click('.hero-actions .btn-primary');
        await i18nPage.waitForSelector('.role-grid');
        await i18nPage.locator('.role-card').nth(rIdx).click();
        await i18nPage.waitForSelector('.cutscene-video');
        const vidSrc = await i18nPage.getAttribute('.cutscene-video', 'src');
        assert.ok(vidSrc.includes(`/public/video/${langCode}/`), `${langCode}: cutscene src mismatch (${vidSrc})`);
        await i18nPage.click('.chapter-header .btn-primary');
        await i18nPage.waitForSelector('.replies-grid');
        await proofreadPage(i18nPage, FORBIDDEN_WORDS, `${langCode}-role-${rIdx}-scene`);
        await checkDesktopGeometry(i18nPage, `${langCode}-role-${rIdx}-1024`, false);
        const fits = await i18nPage.evaluate(() => {
          const ms = document.querySelector('.main-stage')?.getBoundingClientRect();
          const btns = [...document.querySelectorAll('.reply-btn')];
          if (!ms || btns.length !== 4) return { ok: false, diff: 999 };
          const b = btns[3].getBoundingClientRect();
          return { ok: b.bottom <= ms.bottom + 2, diff: Math.round(b.bottom - ms.bottom) };
        });
        assert.equal(fits.ok, true, `${langCode} role-${rIdx} at 1024x720: 4th reply clipped (diff=${fits.diff})`);
        if (rIdx === 1) {
          await i18nPage.click('.line-banner .replay-btn');
          await i18nPage.waitForTimeout(350);
          assert.ok(
            audioResponses.some((r) => r.status === 200 || r.status === 206),
            `${langCode}: Expected HTTP 200/206 for /public/audio/${langCode}/ voice clip on click`
          );
          if (langCode === 'en') {
            const cjkInEnScene = await i18nPage.evaluate(() => {
              const clone = document.body.cloneNode(true);
              clone.querySelectorAll('.lang-switch').forEach((n) => n.remove());
              return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(clone.innerText);
            });
            assert.equal(cjkInEnScene, false, 'EN scene leaked CJK characters outside language switcher');
          }
        }
      }
      assert.equal(await i18nPage.evaluate(() => window.__ttsSpeakCalls || 0), 0, `${langCode}: Unexpected Web Speech calls`);
      await i18nPage.close();
    }

    // Standalone HTML trilingual switch check
    const soloI18n = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    attachErrorWatchers(soloI18n, 'standalone-i18n');
    await soloI18n.goto(`${baseUrl}/gta-dentsu-taiwan-standalone.html?lang=en`, { waitUntil: 'networkidle' });
    assert.ok((await soloI18n.getAttribute('html', 'lang')).startsWith('en'), 'Standalone ?lang=en did not set html[lang]');
    await soloI18n.click('.lang-btn[data-lang="ja"]');
    assert.ok((await soloI18n.getAttribute('html', 'lang')).startsWith('ja'), 'Standalone click JA did not set html[lang]');
    await soloI18n.close();

    // 8. Full-Spectrum Responsive & Foldable Suite + Manifest + Live Fold/Unfold/Rotate
    const mfRes = await fetch(`${baseUrl}/manifest.webmanifest`);
    assert.equal(mfRes.status, 200, `Expected HTTP 200 for manifest.webmanifest, got ${mfRes.status}`);
    const mfJson = await mfRes.json();
    assert.equal(mfJson.orientation, 'any', 'Manifest orientation must be "any" for foldables');

    // 8A. Ultra-narrow Foldable Cover & Mini Flip Cover Screens (280x653, 320x320, 344x882)
    for (const [tag, vp] of [
      ['cover-280', { width: 280, height: 653 }],
      ['flip-320', { width: 320, height: 320 }],
      ['fold6-344', { width: 344, height: 882 }]
    ]) {
      const cp = await browser.newPage({ viewport: vp, hasTouch: true, isMobile: true });
      attachErrorWatchers(cp, tag);
      await cp.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
      assert.equal(await cp.getAttribute('html', 'data-layout-mode'), 'compact', `${tag}: expected compact mode`);
      assert.ok(await cp.evaluate((vw) => document.documentElement.scrollWidth <= vw, vp.width), `${tag}: title overflow`);
      await cp.click('.hero-actions .btn-primary');
      await cp.waitForSelector('.role-card');
      assert.ok(await cp.evaluate((vw) => document.documentElement.scrollWidth <= vw, vp.width), `${tag}: roles overflow`);
      await cp.click('.role-card');
      await cp.waitForSelector('.cutscene-video');
      await cp.click('.chapter-header .btn-primary');
      await cp.waitForSelector('.replies-grid');
      assert.ok(await cp.evaluate((vw) => document.documentElement.scrollWidth <= vw, vp.width), `${tag}: scene overflow`);
      if (tag === 'cover-280' && ssDir) await cp.screenshot({ path: path.join(ssDir, 'e2e-fold-cover-280.png') });
      await cp.locator('.reply-btn').first().click();
      await cp.waitForSelector('.paper-card');
      assert.ok(await cp.evaluate((vw) => document.documentElement.scrollWidth <= vw, vp.width), `${tag}: mini-game overflow`);
      await cp.click('.hud-mobile-toggle');
      await cp.click('.hud-btn.is-gold');
      await cp.waitForSelector('.scooter-canvas');
      assert.ok(await cp.evaluate((vw) => document.documentElement.scrollWidth <= vw, vp.width), `${tag}: scooter overflow`);
      await cp.click('.scooter-controls .btn-ghost');
      await cp.click('.mobile-tab-btn[data-mobile-tab="scene"]');
      await cp.click('#more-views-trigger');
      await cp.click('#scene-more-views button:has-text("放大")');
      await cp.waitForSelector('.sv-modal-viewport');
      assert.ok(await cp.evaluate((vw) => document.documentElement.scrollWidth <= vw, vp.width), `${tag}: streetview modal overflow`);
      await cp.keyboard.press('Escape');
      await cp.close();
    }

    // 8B. Phone Landscape (667x375, 844x390): both Scene & Mission visible + Scooter landscape arcade mode
    for (const [lTag, lVp] of [['land-667', { width: 667, height: 375 }], ['land-844', { width: 844, height: 390 }]]) {
      const lp = await browser.newPage({ viewport: lVp, hasTouch: true, isMobile: true });
      attachErrorWatchers(lp, lTag);
      await lp.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
      assert.equal(await lp.getAttribute('html', 'data-layout-mode'), 'compact-landscape', `${lTag}: expected compact-landscape`);
      await lp.click('.hero-actions .btn-primary');
      await lp.waitForSelector('.role-card');
      await lp.click('.role-card');
      await lp.waitForSelector('.cutscene-video');
      await lp.click('.chapter-header .btn-primary');
      await lp.waitForSelector('.replies-grid');
      const landGeo = await lp.evaluate((vw) => {
        const sceneVis = document.querySelector('.scene-card')?.offsetParent !== null;
        const stageVis = document.querySelector('.main-stage')?.offsetParent !== null;
        return { sw: document.documentElement.scrollWidth, vw, sceneVis, stageVis };
      }, lVp.width);
      assert.ok(landGeo.sw <= landGeo.vw, `${lTag}: overflow (${landGeo.sw} > ${landGeo.vw})`);
      assert.equal(landGeo.sceneVis && landGeo.stageVis, true, `${lTag}: expected both scene & stage visible`);

      await lp.click('.hud-mobile-toggle');
      await lp.click('.hud-btn.is-gold');
      await lp.waitForSelector('.scooter-canvas');
      const scooterLand = await lp.evaluate((vw) => {
        const c = document.querySelector('.scooter-canvas')?.getBoundingClientRect();
        const ctrl = document.querySelector('.scooter-controls')?.getBoundingClientRect();
        return {
          sw: document.documentElement.scrollWidth,
          vw,
          sideBySide: Boolean(c && ctrl && ctrl.left > c.left + 120),
          ctrlBottom: ctrl ? Math.round(ctrl.bottom) : 999,
          vh: window.innerHeight
        };
      }, lVp.width);
      assert.ok(scooterLand.sw <= scooterLand.vw, `${lTag} scooter overflow`);
      assert.equal(scooterLand.sideBySide, true, `${lTag}: expected landscape scooter canvas beside controls`);
      assert.ok(scooterLand.ctrlBottom <= scooterLand.vh, `${lTag}: scooter controls pushed below landscape viewport`);
      if (lTag === 'land-844' && ssDir) await lp.screenshot({ path: path.join(ssDir, 'e2e-landscape-844-scooter.png') });
      await lp.close();
    }

    // 8C. Unfolded Foldables & Tablets (690x829, 840x840, 829x690, 768x1024 across zh & en)
    for (const [mTag, mVp, mLang] of [
      ['fold5-690-zh', { width: 690, height: 829 }, 'zh'],
      ['fold5-690-en', { width: 690, height: 829 }, 'en'],
      ['pixel-fold-840', { width: 840, height: 840 }, 'zh'],
      ['fold-land-829', { width: 829, height: 690 }, 'zh'],
      ['ipad-768', { width: 768, height: 1024 }, 'en']
    ]) {
      const fp = await browser.newPage({ viewport: mVp, hasTouch: true, isMobile: true });
      attachErrorWatchers(fp, mTag);
      await fp.goto(`${baseUrl}/index.html?lang=${mLang}`, { waitUntil: 'networkidle' });
      assert.equal(await fp.getAttribute('html', 'data-layout-mode'), 'medium', `${mTag}: expected medium mode`);
      assert.equal(await fp.getAttribute('html', 'data-mobile-tabs'), '0', `${mTag}: expected mobile tabs disabled`);
      await fp.click('.hero-actions .btn-primary');
      await fp.waitForSelector('.role-card');
      await fp.click('.role-card');
      await fp.waitForSelector('.cutscene-video');
      await fp.click('.chapter-header .btn-primary');
      await fp.waitForSelector('.replies-grid');
      const fGeo = await fp.evaluate((vw) => {
        const meters = [...document.querySelectorAll('.meter-box')];
        const trunc = meters
          .map((b) => b.querySelector('.meter-label span'))
          .filter((sp) => sp && sp.scrollWidth > sp.clientWidth + 1)
          .map((sp) => sp.textContent);
        const sceneR = document.querySelector('.scene-card')?.getBoundingClientRect();
        const stageR = document.querySelector('.main-stage')?.getBoundingClientRect();
        return {
          sw: document.documentElement.scrollWidth,
          vw,
          trunc,
          bothVisible: Boolean(sceneR && sceneR.width > 100 && stageR && stageR.width > 100),
          tabsVisible: Boolean(document.querySelector('.mobile-tab-bar')?.offsetParent)
        };
      }, mVp.width);
      assert.ok(fGeo.sw <= fGeo.vw, `${mTag}: horizontal overflow (${fGeo.sw} > ${fGeo.vw})`);
      assert.deepEqual(fGeo.trunc, [], `${mTag}: HUD meters truncated: ${fGeo.trunc.join(', ')}`);
      assert.equal(fGeo.bothVisible, true, `${mTag}: expected both scene & stage visible side-by-side`);
      assert.equal(fGeo.tabsVisible, false, `${mTag}: mobile-tab-bar should not show on medium mode`);
      if (mTag === 'fold5-690-zh' && ssDir) await fp.screenshot({ path: path.join(ssDir, 'e2e-fold-inner-690.png') });
      await fp.close();
    }

    // 8D. Dual-Screen Fold Book Mode (1114x720 with emulated vertical hinge 540..574)
    const bookPage = await browser.newPage({ viewport: { width: 1114, height: 720 }, hasTouch: true });
    attachErrorWatchers(bookPage, 'fold-book-1114');
    const bookDevice = await bookPage.context().newCDPSession(bookPage);
    await bookDevice.send('Emulation.setDeviceMetricsOverride', {
      width: 1114, height: 720, deviceScaleFactor: 1, mobile: true,
      displayFeature: { orientation: 'vertical', offset: 540, maskLength: 34 },
      devicePosture: { type: 'folded' }
    });
    await bookPage.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
    assert.equal(await bookPage.getAttribute('html', 'data-layout-mode'), 'fold-book', 'Expected fold-book layout mode');
    await bookPage.click('.hero-actions .btn-primary');
    await bookPage.waitForSelector('.role-card');
    await bookPage.click('.role-card');
    await bookPage.waitForSelector('.cutscene-video');
    await bookPage.click('.chapter-header .btn-primary');
    await bookPage.waitForSelector('.replies-grid');
    const bookGeo = await bookPage.evaluate(() => {
      const left = document.querySelector('.col-left').getBoundingClientRect();
      const right = document.querySelector('.col-right').getBoundingClientRect();
      return { sw: document.documentElement.scrollWidth, leftRight: Math.round(left.right), rightLeft: Math.round(right.left) };
    });
    assert.ok(bookGeo.sw <= 1114, `fold-book horizontal overflow: ${bookGeo.sw}`);
    assert.ok(bookGeo.leftRight <= 540, `fold-book .col-left crossed vertical hinge (right=${bookGeo.leftRight})`);
    assert.ok(bookGeo.rightLeft >= 574, `fold-book .col-right touched vertical hinge (left=${bookGeo.rightLeft})`);
    if (ssDir) await bookPage.screenshot({ path: path.join(ssDir, 'e2e-fold-book-1114.png') });
    await bookPage.close();

    // 8E. Foldable Flex Tabletop Mode (412x915 with emulated horizontal hinge 440..465 + folded posture)
    const flexPage = await browser.newPage({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true });
    attachErrorWatchers(flexPage, 'fold-flex-412');
    const flexDevice = await flexPage.context().newCDPSession(flexPage);
    await flexDevice.send('Emulation.setDeviceMetricsOverride', {
      width: 412, height: 915, deviceScaleFactor: 1, mobile: true,
      displayFeature: { orientation: 'horizontal', offset: 440, maskLength: 25 },
      devicePosture: { type: 'folded' }
    });
    await flexPage.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
    assert.equal(await flexPage.getAttribute('html', 'data-layout-mode'), 'fold-flex', 'Expected fold-flex layout mode');
    await flexPage.click('.hero-actions .btn-primary');
    await flexPage.waitForSelector('.role-card');
    await flexPage.click('.role-card');
    await flexPage.waitForSelector('.cutscene-video');
    await flexPage.click('.chapter-header .btn-primary');
    await flexPage.waitForSelector('.replies-grid');
    const flexGeo = await flexPage.evaluate(() => {
      const left = document.querySelector('.col-left').getBoundingClientRect();
      const right = document.querySelector('.col-right').getBoundingClientRect();
      return { sw: document.documentElement.scrollWidth, leftBottom: Math.round(left.bottom), rightTop: Math.round(right.top) };
    });
    assert.ok(flexGeo.sw <= 412, `fold-flex horizontal overflow: ${flexGeo.sw}`);
    assert.ok(flexGeo.leftBottom <= 440, `fold-flex top pane crossed horizontal hinge (bottom=${flexGeo.leftBottom})`);
    assert.ok(flexGeo.rightTop >= 465, `fold-flex bottom pane crossed horizontal hinge (top=${flexGeo.rightTop})`);
    if (ssDir) await flexPage.screenshot({ path: path.join(ssDir, 'e2e-fold-flex-412.png') });
    const repliesBeforeUnfold = await flexPage.locator('.reply-btn').allTextContents();
    const unfoldedViewport = { width: 768, height: 904, deviceScaleFactor: 1, mobile: true };
    await flexDevice.send('Emulation.setDeviceMetricsOverride', unfoldedViewport);
    await flexPage.waitForFunction(() => document.documentElement.dataset.layoutMode === 'medium');
    assert.deepEqual(await flexPage.locator('.reply-btn').allTextContents(), repliesBeforeUnfold);
    await flexPage.locator('.reply-btn').first().click();
    await flexPage.waitForSelector('.paper-card');
    await flexPage.close();

    // 8F. Short Desktop Window (1024x540) & Ultrawide Monitor (2560x1080)
    const shortDesk = await browser.newPage({ viewport: { width: 1024, height: 540 } });
    attachErrorWatchers(shortDesk, 'short-desktop-1024x540');
    await shortDesk.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
    assert.equal(await shortDesk.getAttribute('html', 'data-short-viewport'), '1', '1024x540 expected data-short-viewport=1');
    await shortDesk.click('.hero-actions .btn-primary');
    await shortDesk.waitForSelector('.role-card');
    await shortDesk.click('.role-card');
    await shortDesk.waitForSelector('.cutscene-video');
    await shortDesk.click('.chapter-header .btn-primary');
    await shortDesk.waitForSelector('.replies-grid');
    const shortGeo = await shortDesk.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      overflowY: getComputedStyle(document.querySelector('.gta-shell')).overflowY
    }));
    assert.ok(shortGeo.sw <= 1024, `1024x540 overflow: ${shortGeo.sw}`);
    assert.notEqual(shortGeo.overflowY, 'hidden', '1024x540 shell must allow vertical scrolling on short windows');
    if (ssDir) await shortDesk.screenshot({ path: path.join(ssDir, 'e2e-short-desktop-1024x540.png') });
    await shortDesk.close();

    const ultraPage = await browser.newPage({ viewport: { width: 2560, height: 1080 } });
    attachErrorWatchers(ultraPage, 'ultrawide-2560');
    await ultraPage.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
    assert.equal(await ultraPage.getAttribute('html', 'data-layout-mode'), 'wide', '2560x1080 expected wide mode');
    await ultraPage.click('.hero-actions .btn-primary');
    await ultraPage.waitForSelector('.role-card');
    await ultraPage.click('.role-card');
    await ultraPage.waitForSelector('.cutscene-video');
    await ultraPage.click('.chapter-header .btn-primary');
    await ultraPage.waitForSelector('.replies-grid');
    await checkDesktopGeometry(ultraPage, 'ultrawide-2560-scene', false);
    if (ssDir) await ultraPage.screenshot({ path: path.join(ssDir, 'e2e-ultrawide-2560.png') });
    assert.equal(await ultraPage.locator('.gta-shell').evaluate(shell => shell.clientWidth), 2560);
    await ultraPage.close();

    // 8G. Live Dynamic Fold / Unfold / Rotate / Resize Cycle without reload
    const dynPage = await browser.newPage({ viewport: { width: 344, height: 882 }, hasTouch: true });
    attachErrorWatchers(dynPage, 'dynamic-fold-unfold');
    await dynPage.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
    await dynPage.click('.hero-actions .btn-primary');
    await dynPage.waitForSelector('.role-card');
    await dynPage.click('.role-card');
    await dynPage.waitForSelector('.cutscene-video');
    await dynPage.click('.chapter-header .btn-primary');
    await dynPage.waitForSelector('.replies-grid');

    for (const [stepName, vp, expMode, expTabs] of [
      ['cover-344', { width: 344, height: 882 }, 'compact', true],
      ['unfold-768', { width: 768, height: 904 }, 'medium', false],
      ['rotate-844', { width: 844, height: 390 }, 'compact-landscape', false],
      ['desktop-1280', { width: 1280, height: 800 }, 'desktop', false],
      ['refold-344', { width: 344, height: 882 }, 'compact', true]
    ]) {
      await dynPage.setViewportSize(vp);
      await dynPage.waitForFunction((m) => document.documentElement.getAttribute('data-layout-mode') === m, expMode);
      await dynPage.waitForTimeout(80);
      const snap = await dynPage.evaluate((vw) => ({
        sw: document.documentElement.scrollWidth,
        vw,
        hasTabs: document.querySelectorAll('.mobile-tab-btn').length === 4,
        colLeftVis: document.querySelector('.col-left')?.offsetParent !== null,
        colRightVis: document.querySelector('.col-right')?.offsetParent !== null
      }), vp.width);
      assert.ok(snap.sw <= snap.vw, `Dynamic resize ${stepName}: overflow (${snap.sw} > ${snap.vw})`);
      assert.equal(snap.hasTabs, expTabs, `Dynamic resize ${stepName}: mobile-tab-bar expected=${expTabs}, got=${snap.hasTabs}`);
      if (!expTabs) {
        assert.equal(snap.colLeftVis && snap.colRightVis, true, `Dynamic resize ${stepName}: expected dual columns visible`);
      }
    }
    await dynPage.close();

    // Narrow tabletop: the last role can be reached through the upper pane scroller.
    const roster = await browser.newPage({ viewport: { width: 320, height: 650 }, hasTouch: true, isMobile: true });
    attachErrorWatchers(roster, 'tabletop-roster');
    const rosterDevice = await roster.context().newCDPSession(roster);
    await rosterDevice.send('Emulation.setDeviceMetricsOverride', {
      width: 320, height: 650, deviceScaleFactor: 1, mobile: true,
      displayFeature: { orientation: 'horizontal', offset: 310, maskLength: 30 }
    });
    await roster.goto(baseUrl);
    await roster.click('.hero-actions .btn-primary');
    await roster.keyboard.type('AMA666');
    await roster.locator('.role-card.is-grandma').click();
    await roster.waitForSelector('.cutscene-video');
    await roster.close();

    // A long-running stop game updates the current DOM after a layout transition.
    const timed = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    attachErrorWatchers(timed, 'timed-unfold');
    await timed.goto(baseUrl);
    await timed.evaluate(async () => {
      const { createInitialState, selectRole } = await import('./src/game-engine.js');
      const state = selectRole(createInitialState(), 'account');
      localStorage.setItem('gta_dentsu_taiwan_v1', JSON.stringify({ ...state, phase: 'scene', chapterIndex: 7 }));
    });
    await timed.reload();
    await timed.locator('.reply-btn').first().click();
    await timed.locator('.stop-val').first().waitFor();
    await timed.setViewportSize({ width: 768, height: 904 });
    await timed.waitForFunction(() => document.documentElement.dataset.layoutMode === 'medium');
    const value = await timed.locator('.stop-val').first().textContent();
    await timed.waitForFunction(old => document.querySelector('.stop-val')?.textContent !== old, value);
    assert.ok(await timed.locator('.stop-val').first().isVisible());
    await timed.close();

    const saveContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const saveA = await saveContext.newPage();
    await saveA.goto(baseUrl);
    await saveA.click('.hero-actions .btn-primary');
    await saveA.locator('.role-card').first().click();
    await saveA.click('.chapter-header .btn-primary');
    const saveB = await saveContext.newPage();
    await saveB.goto(baseUrl);
    await saveA.locator('.reply-btn').first().click();
    await saveA.locator('.paper-card').first().click();
    const key = 'gta_dentsu_taiwan_v2';
    const newerSave = await saveA.evaluate(key => localStorage.getItem(key), key);
    await saveB.evaluate(() => localStorage.setItem('gta_dentsu_taiwan_v1', '{"phase":"title"}'));
    assert.equal(await saveA.evaluate(key => localStorage.getItem(key), key), newerSave);
    await saveB.locator('.lang-switch .lang-btn').filter({ hasText: /^EN$/ }).first().click();
    assert.equal(await saveA.evaluate(key => localStorage.getItem(key), key), newerSave);
    await saveB.locator('.lang-switch .lang-btn').filter({ hasText: /繁中/ }).first().click();
    const conflict = saveB.waitForEvent('dialog');
    const staleClick = saveB.locator('.reply-btn').first().click();
    const notice = await conflict;
    assert.match(notice.message(), /另一個分頁已更新存檔/);
    await notice.accept();
    await staleClick;
    await saveB.waitForSelector('.takeaway-card');
    assert.equal(await saveB.evaluate(key => localStorage.getItem(key), key), newerSave);
    const voiceButton = saveB.locator('.takeaway-card .replay-btn');
    await voiceButton.focus();
    await saveB.keyboard.press('Enter');
    assert.ok(await voiceButton.isVisible(), 'Enter on replay button must not advance the chapter');
    await saveContext.close();

    assert.deepEqual(errors, [], `Browser errors detected:\n${errors.join('\n')}`);
    console.log('E2E VERIFY PASSED: zh/en/ja (354 MP3s, 9 MP4s), full responsive & foldable suite (280x653, 320x320, 344x882, 375x667, 390x844, 667x375, 844x390, 690x829, 840x840, 768x1024, 1024x540, 1024x720, fold-book 1114x720, fold-flex 412x915, 1280x800, 1920x1080, 2560x1080 + live fold/unfold/rotate), 0 Web Speech murmuring, and standalone HTML verified with 0 errors.');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error('E2E VERIFY FAILED:', err);
  process.exit(1);
});
