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
    // 0. Verify all 78 VoAI MP3 clips + 3 audio-enabled MP4 cutscenes serve cleanly over HTTP
    const audioChecks = [
      ...['quote', ...Array.from({ length: 5 }, (_, i) => `rescue_${i}`), ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_quip`), ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_call`), ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_clue`)]
        .map((id) => `/public/audio/grandma/${id}.mp3`),
      ...[...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_line`), ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_lisa`), ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_cindy`), ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_takeaway`), 'fsd_on', 'fsd_off']
        .map((id) => `/public/audio/voices/${id}.mp3`)
    ];
    for (const relUrl of audioChecks) {
      const res = await fetch(`${baseUrl}${relUrl}`);
      assert.equal(res.status, 200, `Expected HTTP 200 for ${relUrl}, got ${res.status}`);
      assert.ok((res.headers.get('content-type') || '').includes('audio/mpeg'), `Bad Content-Type for ${relUrl}`);
      const buf = Buffer.from(await res.arrayBuffer());
      assert.ok(buf.length > 2048, `Expected ${relUrl} > 2048 bytes, got ${buf.length}`);
    }
    for (const vid of ['intro-taipei.mp4', 'boardroom-push.mp4', 'grandma-rescue.mp4']) {
      const res = await fetch(`${baseUrl}/public/video/${vid}`);
      assert.equal(res.status, 200, `Expected HTTP 200 for ${vid}`);
      const buf = Buffer.from(await res.arrayBuffer());
      assert.ok(buf.includes('soun') && buf.includes('mp4a'), `Cutscene missing audio track over HTTP: ${vid}`);
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
    await mob.waitForSelector('.beginner-coach-banner');
    await mob.click('.beginner-coach-banner button:has-text("我懂了")');
    assert.equal(await mob.locator('.beginner-coach-banner').count(), 0, 'Beginner coach dismiss button did not hide banner');
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

    assert.deepEqual(errors, [], `Browser errors detected:\n${errors.join('\n')}`);
    console.log('E2E VERIFY PASSED: 1024x720, 1280x800, 1920x1080, 390x844, 0 Web Speech murmuring, decluttered left controls + #scene-more-views popover, 3-slide welcome + 7-step HUD tour, 5 distinct role itineraries/storylines/quizzes, full 10-chapter playthrough, 6 mini-games, Ch6 grandma call, review stage, copy proofread, and standalone HTML verified with 0 errors.');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error('E2E VERIFY FAILED:', err);
  process.exit(1);
});
