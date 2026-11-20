// 主介面控制器：GTA 6 × 台灣街頭工藝《決策智慧：電通台灣一日風雲》（Diegetic Game HUD）
import { ROLES, PEOPLE_MODEL_TWINS, GRANDMA_QUIPS, GTA6_TAIWAN_ANALYSIS, CHAPTERS, SCOOTER_CONFIG } from './story-data.js';
import {
  CHEAT_CODE,
  ROLE_ROUTE_META,
  createInitialState,
  getRole,
  getChapterForRole,
  getCurrentChapter,
  selectRole,
  finishCutscene,
  activateGrandmaCheat,
  consultTwin,
  useRoleSpecial,
  chooseReply,
  submitMiniGame,
  completeScooterRun,
  advanceChapter,
  determinePersona
} from './game-engine.js';
import { GrandmaScooterGame } from './scooter-minigame.js';
import { RADIO_STATIONS, soundFX } from './audio-fx.js';
import { SVG_GTA_TAIWAN_CREST, SVG_IRON_GRILLE_CORNER, SVG_TEMPLE_STAMP_PASSED, SVG_IFRUIT_CHASSIS_TOP, SVG_RADAR_COMPASS_RING, SVG_ROAD_SIGN_BADGE, getStatIconSvg, SVG_TESLA_FSD_HUD_OVERLAY, SVG_FUBON_A25_WIKI_BLUEPRINT } from './ui-graphics.js';

const STORAGE_KEY = 'gta_dentsu_taiwan_v1';
const TOUR_STORAGE_KEY = 'gta_dentsu_tour_done_v1';
const BEGINNER_TIP_STORAGE_KEY = 'gta_dentsu_beginner_tip_v1';

const WELCOME_SLIDES = [
  {
    kicker: '迎新簡報 1／3 · 五位角色＝五條不同行程、狀況與題目',
    title: '歡迎來到松仁路富邦 A25！不同職能有專屬行程表與考題',
    lead: '這不是單一路線的問答。你選哪個電通職能打卡上班，接下來十個時段的時間表、台北跑點、危機狀況與實務測驗都會完全不同！',
    cards: [
      { title: '💼 業務領航總監', body: '象山站趕早會 ➔ 品牌總部 ➔ 內湖陪拍 ➔ 午夜保約：攻防砍價與合約拆彈題庫。' },
      { title: '🧠 品牌策略與洞察師', body: '富邦 A25 ➔ 陶朱窗景 ➔ 瑞光攝影棚 ➔ 頂樓復盤：專攻消費心理與長期賽局。' },
      { title: '🎨 創意與內容總監', body: 'A25 靈感牆 ➔ 走廊比稿 ➔ 瑞光片場 ➔ 午夜定剪：守護作品靈魂與視覺主權。' },
      { title: '📊 媒體數據獵人 ＆ 👵 滿級阿嬤', body: '數據戰情室查帳抓鬼；輸入 AMA666 解鎖永春早市阿嬤菜市場經濟學行程！' }
    ]
  },
  {
    kicker: '迎新簡報 2／3 · 左看純淨實景、右區引導選題目',
    title: '介面怎麼分工？左邊看現場與線索，右邊一步步引導作答',
    lead: '新版介面把過多干擾按鈕收進選單，讓你專心照「左看 ➔ 右選 ➔ 測驗」三步破關：',
    cards: [
      { title: '🖼️ 左上純淨實景視窗', body: '只保留「3D劇照／360°街景」與「更多視角」收合選單，點開才看 A25 實拍、衛星圖或 FSD 視角。' },
      { title: '🕵️ 左下專屬雷達＆線索', body: '雷達即時標出你這角色的 10 站台北行程，旁邊是職能獨家線索與每站一次 ⚡ 絕招。' },
      { title: '👉 右上引導選題主舞台', body: '依序帶你讀本時段狀況、回老闆 LINE（1–4 快捷鍵），接著進入專屬實務題目。' },
      { title: '📱 右下 iFruit 戰情手機', body: '點「🧠 讀心」聽 Lisa 與 Cindy 真心話、「👵 阿嬤」聽台灣阿嬤台味金句或清通緝星。' }
    ]
  },
  {
    kicker: '迎新簡報 3／3 · 指標、通緝星與鍵盤快捷鍵',
    title: '上場前檢查：戰情數值與一鍵操作捷徑',
    lead: '點擊下方啟動導覽後，系統會直接帶你逛一遍真正的遊戲介面與按鈕位置！',
    cards: [
      { title: '🔥 五大能力＆通緝星', body: '每次回覆都會改寫肝指數、嘴砲力、真增量、品牌信任與衡斷力；滿 5 星會召來阿嬤救援！' },
      { title: '🎙️ 乾淨人聲配音體驗', body: '背景不自動呢喃打擾閱讀；只在你主動點擊 🔊 按鈕時播放錄音室配音與壓低配樂。' },
      { title: '⌨️ 超順手鍵盤操作', body: '選回覆按 1–4、左右滑卡按 ⬅ / ➡、騎電車按 A / D、過場或復盤按 Space / Enter。' },
      { title: '🛵 2026 電車 × FSD 加分', body: '隨時點頂部橘金色按鈕試駕買菜車衝松仁路，補滿體力並消一顆通緝星。' }
    ]
  }
];

const HUD_TOUR_STEPS = [
  {
    phase: 'role',
    selector: '.role-grid',
    place: 'top',
    title: '步驟 1／7｜挑選職能（5 位角色＝5 套行程、狀況與題目）',
    body: '每張識別證都預覽了該角色今天的一日台北跑點路線。選好職能打卡，接下來 10 站的時段表、狀況簡訊與實務考題都會跟著切換！'
  },
  {
    phase: 'scene',
    selector: '.hud-bar',
    place: 'bottom',
    title: '步驟 2／7｜頂部戰情儀表板：五維數值、通緝星與電台',
    body: '上方即時顯示你的目前時段與角色行程位置、五大能力數值與通緝星；右側可切換 3 台車載電台、開啟電動車挑戰或靜音。'
  },
  {
    phase: 'scene',
    selector: '.scene-card',
    place: 'right',
    title: '步驟 3／7｜左側純淨實景：簡潔切換 3D 劇照／360° 街景',
    body: '左上方只保留最常用的視角切換；需要查看 A25 實拍、衛星圖、Tesla FSD 或放大街景時，點擊「⋯ 更多視角」即可展開。'
  },
  {
    phase: 'scene',
    selector: '#clue-card-panel',
    place: 'right',
    title: '步驟 4／7｜左下角色雷達行程表 ＆ 獨家桌上線索',
    body: '左側 GPS 雷達會繪出該角色的 10 站專屬路線，右方線索卡告訴你只有這個職能看得到的內幕情報，每站還可按一次 ⚡ 絕招。'
  },
  {
    phase: 'scene',
    selector: '.main-stage',
    place: 'left',
    title: '步驟 5／7｜右側引導選題舞台：看狀況 ➔ 選回覆 ➔ 解題目',
    body: '右側主畫面是專注決策區：上方展示本時段專屬狀況與 LINE 危機，下方引導區帶你點選 1–4 臨場回覆，並接著挑戰專屬實務題。'
  },
  {
    phase: 'scene',
    selector: '#phone-card-panel',
    place: 'left',
    title: '步驟 6／7｜iFruit 手機助攻：需要才問 Lisa、Cindy 或阿嬤',
    body: '猶豫怎麼選題目時，可切換右下手機分頁偷問「🧠 讀心」或點「👵 阿嬤」收聽台味分析；只在你點選時播放清楚人聲，絕不背景干擾。'
  },
  {
    phase: 'scene',
    selector: '.bottom-guide-bar',
    place: 'top',
    title: '步驟 7／7｜底部即時指引列與導覽重播入口',
    body: '下方指示列會依當前進度提醒下一步操作，隨時點擊這裡的「🧭 介面導覽」都能再複習一遍操作。'
  }
];

// 五項指標：state.stats 欄位 → 標籤 / Codex 圖示 / 霓虹色
const HUD_STATS = [
  { key: 'stamina', icon: 'liver', label: '肝指數', color: '#4ade80' },
  { key: 'streetCred', icon: 'bs', label: '嘴砲力', color: '#ff9e2c' },
  { key: 'realLift', icon: 'incrementality', label: '真增量', color: '#00e5ff' },
  { key: 'brandTrust', icon: 'trust', label: '品牌信任', color: '#ff52b8' },
  { key: 'judgment', icon: 'judgment', label: '衡斷力', color: '#ffd166' }
];

// 十個時段在 ui-taipei-radar-map.webp（16:9）上的位置（百分比），對齊底圖內建的地標圖釘
const RADAR_POS = [
  [16.4, 61], [76.7, 68], [50, 57], [80.8, 71.7], [60, 59],
  [71, 20], [74.5, 64], [78.5, 74.5], [53, 49], [79.5, 65]
];

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null) continue;
    if (k === 'class') node.className = v;
    else if (k === 'style') node.setAttribute('style', v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'text') node.textContent = v;
    else if (k === 'disabled') node.disabled = Boolean(v);
    else node.setAttribute(k, String(v));
  }
  const list = Array.isArray(children) ? children : [children];
  for (const c of list) {
    if (c === null || c === undefined || c === false) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

// 僅用於本地靜態 SVG（ui-graphics.js）與已跳脫的 SVG_ROAD_SIGN_BADGE；使用者字元一律走 textContent
function htmlNode(className, svgString) {
  const node = document.createElement('div');
  node.className = className;
  node.innerHTML = svgString;
  return node;
}

class GtaDentsuApp {
  constructor(root) {
    this.root = root;
    this.state = this._loadState();
    this.phoneTab = 'line'; // 'line' | 'people' | 'grandma' | 'gta6'
    this.muted = false;
    this.scooterModalOpen = false;
    this.scooterInstance = null;
    this.ch6CallModalOpen = false;
    this.ch6CallDismissed = false;
    this.activeCutsceneSrc = null;

    // 暫存小互動即時狀態
    this.sliderVal = null;
    this.swipeIndex = 0;
    this.swipeChoices = [];
    this.multiSelected = new Set();
    this.stopTimer = null;
    this.stopTick = 0;
    this.stopFinished = false;
    this.cheatBuffer = '';
    this.highlightTarget = null; // 'clue' | 'phone' | null
    this.sceneViewMode = 'gta'; // 'gta' | 'gmap_360' | 'gmap_photo' | 'gmap_live'
    this.fsdHudOverlay = false; // 點擊「🤖 Tesla FSD視角」可一鍵切換抬頭顯示器圖層
    this.radarMode = 'radar'; // 'radar' | 'gmap' | 'gmap_js'
    this.svModalMode = 'embed'; // 'embed' | 'jsapi'
    this.streetViewModalOpen = false;
    this.resolvedPanoInfo = {};
    this._mapsJsPromise = null;
    this._lastSpokenChapterPhase = '';
    this._prevStation = null;
    this.welcomeDialogOpen = false;
    this.welcomeSlide = 0;
    this.tourActive = false;
    this.tourStepIndex = 0;
    this.tourDone = this._loadTourDone();
    this.beginnerTipDismissed = this._loadBeginnerTipDone();
    this.tourUserInitiated = false;
    this._tourHighlightEl = null;
    this._tourInvokerEl = null;

    // 全螢幕動態場景氛圍背景（放在 #app 之外，render 時只換圖）
    this.backdrop = el('div', { class: 'ambient-backdrop', 'aria-hidden': 'true' });
    this.veil = el('div', { class: 'ambient-veil', 'aria-hidden': 'true' });
    document.body.prepend(this.veil);
    document.body.prepend(this.backdrop);
    this._mountTourOverlays();

    soundFX.onVoiceChange = () => this._syncVoiceIndicator();
    const startAudio = () => {
      soundFX._ensureCtx();
      soundFX.startBGM();
    };
    window.addEventListener('pointerdown', startAudio, { once: true });
    window.addEventListener('keydown', startAudio, { once: true });

    window.addEventListener('keydown', (e) => this._handleGlobalKey(e));
    if (this._getMapsApiKey()) {
      this._ensureMapsJsLoaded();
    }
    this.render();
  }

  _roadParts(ch) {
    const raw = String((ch.googleMap && ch.googleMap.roadSign) || ch.location || '');
    const i = raw.indexOf('·');
    if (i < 0) return [raw, 'Taipei · Taiwan'];
    return [raw.slice(0, i).trim(), raw.slice(i + 1).trim()];
  }

  // 依 soundFX 狀態更新所有「說話中」指示（不重畫 DOM）
  _syncVoiceIndicator() {
    const speaking = Boolean(soundFX.speaking);
    const role = soundFX.activeVoiceRole;
    document.querySelectorAll('[data-voice]').forEach((n) => {
      const who = n.getAttribute('data-voice');
      n.classList.toggle('is-speaking', speaking && (who === 'any' || who === role));
    });
  }

  _voiceBtnLabel() {
    return soundFX.voiceEnabled ? '語音開' : '語音關';
  }

  // 章節進入時僅播放必要介面提示音，不在背景自動念稿打擾閱讀
  _onPhaseEnter() {
    const phase = this.state.phase;
    if (phase !== 'scene' && phase !== 'reveal') return;
    if (this.scooterModalOpen || this.ch6CallModalOpen) return;
    const key = `${this.state.chapterIndex}:${phase}`;
    if (this._lastSpokenChapterPhase === key) return;
    this._lastSpokenChapterPhase = key;
    if (phase === 'reveal' && !this.muted) {
      soundFX.playStampImpact();
    }
  }

  _syncBackdrop() {
    const phase = this.state.phase;
    let img = './public/images/scene-morning-scooter.webp';
    if (phase !== 'title' && phase !== 'role') {
      const ch = getCurrentChapter(this.state);
      if (ch && ch.sceneImage) img = ch.sceneImage;
    }
    this.backdrop.style.backgroundImage = `url("${img}")`;
  }

  _getMapsApiKey() {
    try {
      const k = (typeof window !== 'undefined' && window.__GOOGLE_MAPS_API_KEY__) || localStorage.getItem('gta_gmaps_key') || '';
      return String(k || '').trim();
    } catch {
      return '';
    }
  }

  _build360EmbedUrl(gm = {}) {
    const info = gm.panoId ? gm : {};
    const pid = info.panoId || 'dp2njH37xCDpod8-j4Ockw';
    const lat = info.lat || 25.0391247;
    const lng = info.lng || 121.5691512;
    const h = info.heading ?? 115;
    const p = info.pitch ?? 16;
    return `https://www.google.com/maps/embed?pb=!4v1700000000000!6m8!1m7!1s${encodeURIComponent(pid)}!2m2!1d${lat}!2d${lng}!3f${h}!4f${p}!5f0.7820865974627469`;
  }

  _ensureMapsJsLoaded() {
    const key = this._getMapsApiKey();
    if (!key) return Promise.resolve(false);
    if (window.google && window.google.maps && window.google.maps.StreetViewService) {
      return Promise.resolve(true);
    }
    if (this._mapsJsPromise) return this._mapsJsPromise;
    this._mapsJsPromise = new Promise((resolve) => {
      window.gm_authFailure = () => resolve(false);
      const s = document.createElement('script');
      s.async = true;
      s.defer = true;
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async`;
      s.onload = () => {
        const waitReady = (tries = 0) => {
          if (window.google?.maps?.StreetViewService) resolve(true);
          else if (tries < 20) setTimeout(() => waitReady(tries + 1), 100);
          else resolve(false);
        };
        waitReady();
      };
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
    return this._mapsJsPromise;
  }

  async _lookupLivePano(ch) {
    if (!ch || !ch.googleMap || this.resolvedPanoInfo[ch.id]) return;
    const ok = await this._ensureMapsJsLoaded();
    if (!ok || !window.google?.maps?.StreetViewService) return;
    const sv = new window.google.maps.StreetViewService();
    sv.getPanorama(
      {
        location: { lat: ch.googleMap.lat, lng: ch.googleMap.lng },
        radius: 120,
        source: window.google.maps.StreetViewSource.OUTDOOR
      },
      (data, status) => {
        if (status === 'OK' && data?.location?.pano) {
          this.resolvedPanoInfo[ch.id] = {
            panoId: data.location.pano,
            desc: data.location.description || ch.googleMap.roadSign
          };
          if (this.streetViewModalOpen) this.render();
        }
      }
    );
  }

  _loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createInitialState();
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.stats || typeof parsed.chapterIndex !== 'number') {
        return createInitialState();
      }
      return { ...createInitialState(), ...parsed };
    } catch {
      return createInitialState();
    }
  }

  _saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // ignore storage quota errors
    }
  }

  _loadTourDone() {
    try {
      return localStorage.getItem(TOUR_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  _saveTourDone(done = true) {
    this.tourDone = Boolean(done);
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, done ? '1' : '0');
    } catch {}
  }

  _loadBeginnerTipDone() {
    try {
      return localStorage.getItem(BEGINNER_TIP_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  _saveBeginnerTipDone(done = true) {
    this.beginnerTipDismissed = Boolean(done);
    try {
      localStorage.setItem(BEGINNER_TIP_STORAGE_KEY, done ? '1' : '0');
    } catch {}
  }

  _mountTourOverlays() {
    if (typeof document === 'undefined') return;
    if (!this.welcomeDialog) {
      const dlg = document.createElement('dialog');
      dlg.className = 'tour-modal';
      dlg.setAttribute('aria-labelledby', 'welcome-tour-title');
      dlg.setAttribute('closedby', 'any');

      if (!('closedBy' in HTMLDialogElement.prototype)) {
        const outside = (e) => {
          const r = dlg.getBoundingClientRect();
          return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        };
        let pressedOutside = false;
        dlg.addEventListener('pointerdown', (e) => { pressedOutside = outside(e); });
        dlg.addEventListener('pointerup', (e) => { if (pressedOutside && outside(e)) dlg.close(); });
      }
      dlg.addEventListener('close', () => {
        dlg.returnValue = '';
        this.welcomeDialogOpen = false;
      });
      document.body.appendChild(dlg);
      this.welcomeDialog = dlg;
    }

    if (!this.hudTourPopover) {
      const pop = document.createElement('dialog');
      pop.id = 'hud-tour-popover';
      pop.className = 'hud-tour-popover';
      pop.setAttribute('popover', 'manual');
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-labelledby', 'hud-tour-title');
      pop.addEventListener('toggle', (e) => {
        if (e.newState === 'closed' && this.tourActive && this._tourUserClosing) {
          this._tourUserClosing = false;
          this._finishHudTour(true);
        }
      });
      document.body.appendChild(pop);
      this.hudTourPopover = pop;
    }
  }

  _openWelcomeTour(slide = 0, invokerEl = null) {
    this._tourInvokerEl = invokerEl || document.activeElement;
    this.welcomeSlide = Math.max(0, Math.min(WELCOME_SLIDES.length - 1, slide));
    this.welcomeDialogOpen = true;
    this._stopHudTour(false);
    this._renderWelcomeDialog();
    if (this.welcomeDialog && !this.welcomeDialog.open) {
      if (typeof this.welcomeDialog.showModal === 'function') {
        this.welcomeDialog.showModal();
      } else {
        this.welcomeDialog.setAttribute('open', '');
      }
    }
  }

  _closeWelcomeTour() {
    this.welcomeDialogOpen = false;
    if (this.welcomeDialog?.open) {
      this.welcomeDialog.close();
    }
  }

  _renderWelcomeDialog() {
    const dlg = this.welcomeDialog;
    if (!dlg) return;
    dlg.innerHTML = '';
    const slide = WELCOME_SLIDES[this.welcomeSlide] || WELCOME_SLIDES[0];
    const isLast = this.welcomeSlide === WELCOME_SLIDES.length - 1;

    const primaryBtn = el('button', {
      type: 'button',
      class: 'btn-primary',
      autofocus: 'true',
      text: isLast ? '🚀 前往選角並啟動現場介面導覽 ➔' : `下一步（${this.welcomeSlide + 2}／${WELCOME_SLIDES.length}）➔`,
      onClick: () => {
        soundFX.playClick();
        if (!isLast) {
          this.welcomeSlide += 1;
          this._renderWelcomeDialog();
          dlg.querySelector('.btn-primary')?.focus();
        } else {
          this._closeWelcomeTour();
          soundFX.startBGM();
          this.tourUserInitiated = true;
          this.tourActive = true;
          this.tourStepIndex = 0;
          this._setState({ ...this.state, phase: 'role' });
        }
      }
    });

    const body = el('div', { class: 'tour-modal-inner' }, [
      el('div', { style: 'display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;' }, [
        el('div', { class: 'gta-kicker', text: slide.kicker }),
        el('div', { style: 'display:flex;align-items:center;gap:10px;' }, [
          el('div', { class: 'tour-dots', 'aria-hidden': 'true' }, WELCOME_SLIDES.map((_, idx) =>
            el('span', { class: `tour-dot${idx === this.welcomeSlide ? ' is-active' : ''}` })
          )),
          el('form', { method: 'dialog', style: 'margin:0;' }, [
            el('button', {
              type: 'submit',
              class: 'btn-ghost',
              style: 'min-height:36px;padding:4px 10px;font-size:13px;',
              text: '✕ 關閉 (Esc)',
              onClick: () => soundFX.playClick()
            })
          ])
        ])
      ]),
      el('h2', { id: 'welcome-tour-title', style: 'margin:0;font-size:clamp(19px,2vw,24px);color:var(--gold);', text: slide.title }),
      el('p', { style: 'margin:0;font-size:14.5px;color:#efeafd;line-height:1.45;', text: slide.lead }),
      el('div', { class: 'tour-card-grid' }, slide.cards.map((c) =>
        el('div', { class: 'tour-mini-card' }, [
          el('b', { text: c.title }),
          el('span', { text: c.body })
        ])
      )),
      el('div', { style: 'display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding-top:4px;' }, [
        el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;' }, [
          this.welcomeSlide > 0
            ? el('button', {
                type: 'button',
                class: 'btn-ghost',
                style: 'min-height:40px;padding:6px 12px;font-size:13.5px;',
                text: '← 上一步',
                onClick: () => {
                  soundFX.playClick();
                  this.welcomeSlide -= 1;
                  this._renderWelcomeDialog();
                }
              })
            : null,
          el('button', {
            type: 'button',
            class: 'btn-ghost',
            style: 'min-height:40px;padding:6px 12px;font-size:13.5px;',
            text: '跳過教學直接開始',
            onClick: () => {
              soundFX.playClick();
              this._saveTourDone(true);
              this._closeWelcomeTour();
            }
          })
        ]),
        primaryBtn
      ])
    ]);

    dlg.appendChild(body);
  }

  _startHudTour(fromPhase = null, invokerEl = null) {
    this._tourInvokerEl = invokerEl || document.activeElement;
    this.tourUserInitiated = true;
    this.tourActive = true;
    const phase = fromPhase || this.state.phase;
    if (phase === 'role') {
      this.tourStepIndex = 0;
      this._syncHudTourOverlay();
    } else if (phase === 'scene') {
      this.tourStepIndex = 1;
      this._syncHudTourOverlay();
    } else if (phase === 'title') {
      this._openWelcomeTour(0, invokerEl);
    } else {
      this.tourStepIndex = 1;
      this._setState({ ...this.state, phase: 'scene' });
    }
  }

  _advanceHudTour(delta = 1) {
    const nextIdx = this.tourStepIndex + delta;
    if (nextIdx >= HUD_TOUR_STEPS.length) {
      this._finishHudTour(true);
      return;
    }
    if (nextIdx === 0 && this.state.phase === 'scene') {
      this.tourStepIndex = 0;
      this.tourUserInitiated = true;
      this._setState({ ...this.state, phase: 'role' });
      return;
    }
    if (this.tourStepIndex === 0 && nextIdx === 1 && this.state.phase === 'role') {
      // 用策略洞察師示範進場並直接進入 Ch1 現場展示第 2/7 步
      this.tourStepIndex = 1;
      this.tourUserInitiated = true;
      soundFX.playMissionPassed();
      const next = selectRole(this.state, this.state.roleId || 'planner');
      this._setState({ ...next, phase: 'scene' });
      return;
    }
    this.tourStepIndex = Math.max(0, nextIdx);
    this.tourUserInitiated = true;
    this._syncHudTourOverlay();
  }

  _hideHudPopoverNode() {
    if (this._tourHighlightEl) {
      this._tourHighlightEl.classList.remove('tour-spotlight-target');
      this._tourHighlightEl = null;
    }
    const pop = this.hudTourPopover;
    if (!pop) return;
    if (pop.matches(':popover-open') || pop.matches('.\\:popover-open')) {
      try {
        pop.hidePopover();
      } catch {}
    }
    pop.removeAttribute('open');
  }

  _finishHudTour(restoreFocus = true) {
    this.tourActive = false;
    this._saveTourDone(true);
    const prevTarget = this._tourHighlightEl || this._tourInvokerEl;
    this._hideHudPopoverNode();
    if (restoreFocus && prevTarget && prevTarget.isConnected) {
      const focusable = prevTarget.matches('button,a,input,[tabindex]')
        ? prevTarget
        : (prevTarget.querySelector('button,a,input,[tabindex]:not([tabindex="-1"])') || this._tourInvokerEl);
      if (focusable && typeof focusable.focus === 'function') {
        try { focusable.focus(); } catch {}
      }
    }
  }

  _stopHudTour(markDone = false) {
    if (markDone) this._saveTourDone(true);
    this.tourActive = false;
    this._hideHudPopoverNode();
  }

  _syncHudTourOverlay() {
    const pop = this.hudTourPopover;
    if (!pop) return;
    if (!this.tourActive || this.welcomeDialogOpen || this.streetViewModalOpen || this.scooterModalOpen || this.ch6CallModalOpen) {
      this._hideHudPopoverNode();
      return;
    }

    const step = HUD_TOUR_STEPS[this.tourStepIndex];
    if (!step || this.state.phase !== step.phase) {
      this._hideHudPopoverNode();
      return;
    }

    const target = document.querySelector(step.selector);
    if (!target) {
      this._hideHudPopoverNode();
      return;
    }

    if (this._tourHighlightEl && this._tourHighlightEl !== target) {
      this._tourHighlightEl.classList.remove('tour-spotlight-target');
    }
    target.classList.add('tour-spotlight-target');
    this._tourHighlightEl = target;

    pop.dataset.place = step.place || 'bottom';
    pop.innerHTML = '';
    const isLast = this.tourStepIndex === HUD_TOUR_STEPS.length - 1;
    const hideBtn = el('button', {
      type: 'button',
      class: 'btn-ghost',
      style: 'min-height:32px;padding:3px 9px;font-size:12px;',
      popovertarget: 'hud-tour-popover',
      popovertargetaction: 'hide',
      text: '跳過導覽',
      onClick: () => {
        soundFX.playClick();
        this._tourUserClosing = true;
        this._finishHudTour(true);
      }
    });
    const nextBtn = el('button', {
      type: 'button',
      class: 'btn-primary',
      style: 'min-height:36px;padding:6px 12px;font-size:13px;',
      text: isLast ? '✅ 我學會了，開始決策！' : (this.tourStepIndex === 0 ? '先看現場操作導覽 ➔' : '下一步 ➔'),
      onClick: () => {
        soundFX.playClick();
        if (isLast) {
          this._finishHudTour(true);
        } else {
          this._advanceHudTour(1);
        }
      }
    });

    pop.appendChild(el('div', { style: 'display:flex;justify-content:space-between;align-items:center;gap:8px;' }, [
      el('span', { class: 'gta-kicker', text: `介面導覽 ${this.tourStepIndex + 1}／${HUD_TOUR_STEPS.length}` }),
      hideBtn
    ]));
    pop.appendChild(el('h3', { id: 'hud-tour-title', text: step.title }));
    pop.appendChild(el('p', { text: step.body }));
    pop.appendChild(el('div', { class: 'hud-tour-actions' }, [
      this.tourStepIndex > 0
        ? el('button', {
            type: 'button',
            class: 'btn-ghost',
            style: 'min-height:36px;padding:4px 10px;font-size:12.5px;',
            text: '← 上一步',
            onClick: () => {
              soundFX.playClick();
              this._advanceHudTour(-1);
            }
          })
        : el('span', { style: 'font-size:12px;color:var(--cyan);', text: '💡 也可以直接點擊左方任一職能卡' }),
      nextBtn
    ]));

    try {
      if (typeof pop.showPopover === 'function') {
        if (!pop.matches(':popover-open')) pop.showPopover();
      } else {
        pop.setAttribute('open', '');
      }
    } catch {
      pop.setAttribute('open', '');
    }

    if (this.tourUserInitiated) {
      nextBtn.focus();
    }
  }

  _setState(next) {
    if (this.state.phase === 'cutscene' && next.phase !== 'cutscene') {
      soundFX.setCutscenePlaying(false);
    }
    this.state = next;
    this._saveState();
    this.render();
  }

  _leaveCutscene() {
    document.querySelectorAll('.cutscene-video').forEach((v) => {
      try {
        v.pause();
      } catch {}
    });
    soundFX.setCutscenePlaying(false);
    this.activeCutsceneSrc = null;
    soundFX.playLinePing();
    this._setState(finishCutscene(this.state));
  }

  _resetGame() {
    this._clearStopTimer();
    this.scooterModalOpen = false;
    this.ch6CallModalOpen = false;
    this.ch6CallDismissed = false;
    this.sliderVal = null;
    this.swipeIndex = 0;
    this.swipeChoices = [];
    this.multiSelected.clear();
    const fresh = createInitialState();
    if (this.state.grandmaUnlocked) {
      fresh.grandmaUnlocked = true;
    }
    this._setState({ ...fresh, phase: 'role' });
  }

  _clearStopTimer() {
    if (this.stopTimer) {
      clearInterval(this.stopTimer);
      this.stopTimer = null;
    }
  }

  _handleGlobalKey(e) {
    if (this.welcomeDialog?.open) return;
    if (this.tourActive && e.key === 'Escape') {
      e.preventDefault();
      this._finishHudTour(true);
      return;
    }
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    // 秘技碼 AMA666 監聽
    if (/^[a-zA-Z0-9]$/.test(e.key)) {
      this.cheatBuffer = (this.cheatBuffer + e.key.toUpperCase()).slice(-CHEAT_CODE.length);
      if (this.cheatBuffer === CHEAT_CODE) {
        this._triggerCheatCode(true);
      }
    }

    if (this.scooterModalOpen || this.ch6CallModalOpen || this.streetViewModalOpen) {
      if (e.key === 'Escape') {
        if (this.streetViewModalOpen) {
          this.streetViewModalOpen = false;
          this.render();
        } else if (this.scooterModalOpen) {
          this._closeScooterModal(true);
        }
      }
      return;
    }

    const ch = getCurrentChapter(this.state);

    // 過場動畫 / 復盤頁支援 Enter / Space 快速前進
    if (e.key === 'Enter' || e.key === ' ') {
      if (this.state.phase === 'cutscene') {
        e.preventDefault();
        this._leaveCutscene();
        return;
      }
      if (this.state.phase === 'reveal') {
        e.preventDefault();
        soundFX.playClick();
        this._setState(advanceChapter(this.state));
        return;
      }
    }

    // 1-4 快選老闆訊息回覆
    if (this.state.phase === 'scene' && ['1', '2', '3', '4'].includes(e.key)) {
      const idx = Number(e.key) - 1;
      if (ch.replies && idx < ch.replies.length) {
        e.preventDefault();
        this._pickReply(idx);
      }
      return;
    }

    // 小互動快捷鍵支援
    if (this.state.phase === 'game' && ch.game) {
      const g = ch.game;
      if ((g.type === 'pick' || g.type === 'agent') && ['1', '2', '3', '4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (idx < g.options.length) {
          e.preventDefault();
          const next = submitMiniGame(this.state, idx);
          if (next.lastGameOutcome?.correct) soundFX.playMissionPassed();
          else soundFX.playClick();
          this._setState(next);
        }
        return;
      }
      if (g.type === 'multi') {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = Number(e.key) - 1;
          if (idx < g.options.length) {
            e.preventDefault();
            soundFX.playClick();
            if (this.multiSelected.has(idx)) this.multiSelected.delete(idx);
            else this.multiSelected.add(idx);
            this.render();
          }
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const next = submitMiniGame(this.state, [...this.multiSelected]);
          if (next.lastGameOutcome?.correct) soundFX.playMissionPassed();
          else soundFX.playClick();
          this._setState(next);
          return;
        }
      }
      if (g.type === 'slider' && e.key === 'Enter') {
        e.preventDefault();
        const val = this.sliderVal !== null ? this.sliderVal : g.start;
        const next = submitMiniGame(this.state, val);
        if (next.lastGameOutcome?.correct) soundFX.playMissionPassed();
        else soundFX.playClick();
        this._setState(next);
        return;
      }
      if (g.type === 'swipe') {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this._pickSwipe('left');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this._pickSwipe('right');
        }
        return;
      }
      if (g.type === 'stop' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        this._clearStopTimer();
        this.stopFinished = true;
        const next = submitMiniGame(this.state, this.stopTick);
        if (next.lastGameOutcome?.correct) soundFX.playMissionPassed();
        else soundFX.playWantedSiren();
        this._setState(next);
      }
    }
  }

  _focusHelper(target, phoneTab = null, twinId = null) {
    this.highlightTarget = target;
    if (phoneTab) this.phoneTab = phoneTab;
    if (twinId && !this.state.askedTwins.includes(twinId)) {
      soundFX.playLinePing();
      this._setState(consultTwin(this.state, twinId));
      this._speakTwin(getCurrentChapter(this.state), twinId, false);
    } else if (phoneTab === 'grandma' && !this.state.grandmaUnlocked) {
      this._triggerCheatCode(false);
    } else {
      soundFX.playClick();
      this.render();
    }
    requestAnimationFrame(() => {
      const node = document.getElementById(target === 'clue' ? 'clue-card-panel' : 'phone-card-panel');
      if (node && typeof node.scrollIntoView === 'function') {
        node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  _triggerCheatCode(withRescue = true) {
    const next = activateGrandmaCheat(this.state, withRescue);
    this._setState(next);
    if (withRescue && next.lastRescueMessage) {
      const spoke = soundFX.speak(next.lastRescueMessage, 'grandma', false);
      if (!spoke) soundFX.playTatungCooker();
    } else {
      soundFX.playTatungCooker();
    }
  }

  _pickReply(idx) {
    if (!this.beginnerTipDismissed) {
      this._saveBeginnerTipDone(true);
    }
    if (this.tourActive) {
      this._finishHudTour(false);
    }
    const prevWanted = this.state.wantedStars;
    const prevRescues = this.state.grandmaRescues;
    const next = chooseReply(this.state, idx);
    this.sliderVal = null;
    this.swipeIndex = 0;
    this.swipeChoices = [];
    this.multiSelected.clear();
    this.stopTick = 0;
    this.stopFinished = false;
    this._clearStopTimer();

    if (next.grandmaRescues > prevRescues) {
      this._setState(next);
      if (next.lastRescueMessage) {
        const spoke = soundFX.speak(next.lastRescueMessage, 'grandma', false);
        if (!spoke) soundFX.playTatungCooker();
      } else {
        soundFX.playTatungCooker();
      }
      return;
    } else if (next.wantedStars > prevWanted) {
      soundFX.playWantedSiren();
    } else {
      soundFX.playClick();
    }
    this._setState(next);
  }

  _pickSwipe(side) {
    const ch = getCurrentChapter(this.state);
    if (!ch.game || ch.game.type !== 'swipe') return;
    soundFX.playClick();
    this.swipeChoices.push(side);
    this.swipeIndex += 1;

    // Ch6 第 4 張卡：「有些味道，一喝就回到阿嬤家的廚房。」觸發阿嬤現場來電彩蛋！
    if (ch.grandmaCallTrigger && this.swipeIndex === (ch.grandmaPhoneCall?.triggerCard ?? 3) && !this.ch6CallDismissed) {
      soundFX.playLinePing();
      this.ch6CallModalOpen = true;
      this.render();
      if (ch.grandmaPhoneCall?.text) {
        soundFX.speak(ch.grandmaPhoneCall.text, 'grandma', false);
      }
      return;
    }

    if (this.swipeIndex >= ch.game.cards.length) {
      const next = submitMiniGame(this.state, this.swipeChoices);
      if (next.lastGameOutcome?.correct) soundFX.playMissionPassed();
      this._setState(next);
    } else {
      this.render();
    }
  }

  _openScooterModal() {
    this._prevStation = soundFX.stationIndex;
    soundFX.setStation(2); // Turbo Cyber-Pulse
    this.scooterModalOpen = true;
    soundFX.playScooterHorn();
    this.render();
  }

  _restoreStation() {
    if (this._prevStation !== null) {
      soundFX.setStation(this._prevStation);
      this._prevStation = null;
    }
  }

  _closeScooterModal(aborted = true) {
    if (this.scooterInstance) {
      this.scooterInstance.stop(aborted);
      this.scooterInstance = null;
    }
    this.scooterModalOpen = false;
    this._restoreStation();
    this.render();
  }

  render() {
    this.root.innerHTML = '';
    this._syncBackdrop();

    if (this.state.phase === 'title') {
      this.root.appendChild(this._renderTitle());
    } else if (this.state.phase === 'role') {
      this.root.appendChild(this._renderRoleSelect());
    } else {
      this.root.appendChild(this._renderHud());
      if (this.state.phase === 'cutscene') {
        this.root.appendChild(this._renderCutsceneStage());
      } else if (this.state.phase === 'review') {
        this.root.appendChild(this._renderReview());
      } else {
        this.root.appendChild(this._renderPlayGrid());
      }
    }

    if (this.ch6CallModalOpen) {
      this.root.appendChild(this._renderCh6PhoneModal());
    }
    if (this.streetViewModalOpen) {
      this.root.appendChild(this._renderStreetViewModal());
    }
    if (this.scooterModalOpen) {
      this.root.appendChild(this._renderScooterModal());
    }
    this.root.appendChild(this._renderBottomGuideBar());
    this._onPhaseEnter();
    this._syncVoiceIndicator();
    this._syncHudTourOverlay();
  }

  _startShift() {
    soundFX.playScooterHorn();
    soundFX.startBGM();
    this._setState({ ...this.state, phase: 'role' });
  }

  _renderTitle() {
    const heroMedia = el('div', { class: 'hero-media' }, [
      el('img', {
        src: './public/images/scene-morning-scooter.webp',
        alt: '2026 台北信義區松仁路富邦 A25 電通大樓與陶朱隱園 GTA 6 主視覺',
        onerror: (e) => { e.target.style.display = 'none'; }
      }),
      htmlNode('hero-fsd', SVG_TESLA_FSD_HUD_OVERLAY),
      htmlNode('hero-a25', SVG_FUBON_A25_WIKI_BLUEPRINT)
    ]);

    const body = el('div', { class: 'hero-body' }, [
      htmlNode('hero-crest', SVG_GTA_TAIWAN_CREST),
      el('div', { class: 'gta-kicker', text: 'DENTSU TAIWAN 富邦 A25 × 決策智慧 2018–2026' }),
      el('h1', { class: 'gta-title gta-title-split', 'aria-label': 'GRAND THEFT AGENCY 電通台灣一日風雲' }, [
        el('span', { class: 't-a', text: 'GRAND THEFT AGENCY' }),
        el('span', { class: 't-b', text: '電通台灣一日風雲' })
      ]),
      el('div', { class: 'hero-story-card' }, [
        el('div', { class: 'hero-story-label', text: '🎬 情境帶入｜這是一款「職場選擇題」互動體驗' }),
        el('p', {
          class: 'gta-subtitle',
          text: '從清晨到午夜的台北信義區富邦 A25 與陶朱隱園霓虹下，客戶砍預算、採購比價、AI 罐頭腳本與黑箱報表同時炸開。不用懂遊戲規則、也不用背術語！就像回 LINE 一樣直接點選項，就能體驗五位角色截然不同的台北一天。'
        })
      ]),
      el('div', { class: 'quickstart-strip', role: 'list', 'aria-label': '遊玩三步驟' }, [
        el('div', { class: 'quickstart-step', role: 'listitem' }, [
          el('b', { text: '① 挑 1 位角色' }),
          el('span', { text: '選想體驗的職能（不知選誰可選新手推薦）' })
        ]),
        el('div', { class: 'quickstart-step', role: 'listitem' }, [
          el('b', { text: '② 右邊選答案' }),
          el('span', { text: '看 LINE 狀況點 1–4 回覆，再解 1 題互動' })
        ]),
        el('div', { class: 'quickstart-step', role: 'listitem' }, [
          el('b', { text: '③ 過 10 站看稱號' }),
          el('span', { text: '選錯也不會死，每站都能看專家金句復盤' })
        ])
      ]),
      this.state.grandmaUnlocked
        ? el('div', { class: 'rescue-toast', style: 'font-size:13.5px;padding:6px 10px;', text: '🍲 秘技 AMA666 已啟動！隱藏第 5 角色「滿級皇太后・台灣阿嬤」解鎖完成，請按下方開始遊戲！' })
        : null,
      el('div', { class: 'hero-actions' }, [
        el('button', {
          class: 'btn-primary is-hero-pulse',
          onClick: () => this._startShift()
        }, [
          el('span', { class: 'hero-cta-badge', text: '👉 第一步' }),
          el('span', { text: '▶ 開始遊戲：挑選你的角色 ➔' })
        ]),
        el('button', {
          class: 'btn-cyan',
          text: '🧭 30 秒新手圖解導覽',
          onClick: (e) => {
            soundFX.playClick();
            this._openWelcomeTour(0, e.currentTarget);
          }
        }),
        el('button', {
          class: 'btn-gold is-compact',
          text: '🛵 先試玩 2026 電車',
          onClick: () => this._openScooterModal()
        }),
        this.state.history.length > 0
          ? el('button', {
              class: 'btn-cyan',
              text: `繼續上次進度（第 ${this.state.chapterIndex + 1}／10 站）`,
              onClick: () => {
                soundFX.playClick();
                this._setState({ ...this.state, phase: 'scene' });
              }
            })
          : null
      ]),
      el('div', { class: 'plate-box is-optional' }, [
        el('span', { class: 'plate-label', text: '進階彩蛋（非必填）· 輸入 AMA666 解鎖阿嬤角色' }),
        this._renderCheatInput()
      ])
    ]);

    return el('section', { class: 'hero-card' }, [heroMedia, body]);
  }

  _renderCheatInput() {
    const input = el('input', {
      class: 'cheat-input',
      type: 'text',
      placeholder: 'AMA666',
      maxLength: '10',
      'aria-label': '輸入阿嬤模組秘技碼'
    });
    const activate = () => {
      const val = input.value.trim().toUpperCase();
      if (val === CHEAT_CODE || val === 'GRANDMA') {
        this._triggerCheatCode(true);
      } else {
        soundFX.playClick();
        input.value = '';
        input.placeholder = '提示: AMA666';
      }
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        activate();
      }
    });
    const btn = el('button', {
      class: 'btn-ghost',
      text: '發動秘技',
      onClick: activate
    });
    return el('div', { class: 'cheat-bar' }, [input, btn]);
  }

  _renderSegBar(val, color) {
    const on = Math.max(0, Math.min(10, Math.round(Number(val) / 10)));
    return el('div', { class: 'seg-bar', style: `--seg:${color};`, role: 'img', 'aria-label': `${val} / 100` },
      Array.from({ length: 10 }, (_, i) => el('i', { class: i < on ? 'on' : '' })));
  }

  _renderRoleSelect() {
    const topBar = el('div', { class: 'panel role-topbar' }, [
      el('div', {}, [
        el('div', { class: 'gta-kicker', text: 'STEP 1 · 選好角色就等於選定今日專屬行程與題目' }),
        el('h2', { text: '2026 早安信義區：今天想當哪一位電通人？' }),
        el('p', { class: 'role-topbar-hint', text: '👇 點下方任一張角色卡就能直接出發！（第一次玩不知道選誰？推薦選有「⭐ 新手推薦」那張）' })
      ]),
      el('div', { class: 'cheat-bar' }, [
        el('button', {
          class: 'btn-cyan',
          style: 'min-height:40px;padding:6px 12px;font-size:13.5px;',
          text: '🧭 7 步導覽',
          onClick: (e) => {
            soundFX.playClick();
            this._startHudTour('role', e.currentTarget);
          }
        }),
        el('button', {
          class: 'btn-gold',
          text: this.state.grandmaUnlocked ? '👵 阿嬤模組已解鎖！' : '🧿 撫摸阿嬤平安符 (AMA666)',
          onClick: () => this._triggerCheatCode(true)
        }),
        el('button', {
          class: 'btn-ghost',
          text: '回封面',
          onClick: () => this._setState({ ...this.state, phase: 'title' })
        })
      ])
    ]);

    const grid = el('div', { class: 'role-grid' }, ROLES.map((role, idx) => {
      const locked = role.id === 'grandma' && !this.state.grandmaUnlocked;
      const isRec = role.id === 'planner';
      const cls = `role-card${role.id === 'grandma' ? ' is-grandma' : ''}${isRec ? ' is-recommended' : ''}${locked ? ' is-locked' : ''}`;
      const route = ROLE_ROUTE_META[role.id] || {};
      return el('button', {
        class: cls,
        disabled: locked,
        onClick: () => {
          soundFX.playMissionPassed();
          this.phoneTab = 'line';
          if (this.tourActive && this.tourStepIndex === 0) {
            this.tourStepIndex = 1;
          }
          const nextState = selectRole(this.state, role.id);
          this._setState(nextState);
        }
      }, [
        el('div', { class: 'role-lanyard' }),
        el('div', { class: 'role-id-head' }, [
          el('span', { text: 'DENTSU TW · FUBON A25' }),
          el('span', { text: `WANTED #0${idx + 1}` })
        ]),
        el('div', { class: 'role-avatar-wrap' }, [
          el('img', {
            src: role.image,
            alt: role.name,
            onerror: (e) => { e.target.style.display = 'none'; }
          }),
          isRec ? el('span', { class: 'role-rec-badge', text: '⭐ 新手推薦' }) : null,
          el('span', {
            class: 'role-badge-float',
            style: `color:${role.color};`,
            text: locked ? '🔒 輸入 AMA666 解鎖' : role.badge
          })
        ]),
        el('div', { class: 'role-info' }, [
          el('h3', { style: `color:${role.color};`, text: role.name }),
          el('p', { class: 'role-dept', text: `${role.dept} · ${role.title}` }),
          route.routeBadge ? el('span', { class: 'role-route-pill', text: route.routeBadge }) : null,
          route.routeItinerary ? el('p', { class: 'role-route-itinerary', text: `🗺️ ${route.routeItinerary}` }) : null,
          route.routeSummary ? el('p', { class: 'role-route-summary', text: route.routeSummary }) : null,
          el('p', { class: 'role-quote', text: `「${role.quote}」` }),
          el('div', { style: 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;' }, [
            el('span', { class: 'role-special', text: `⚡ ${role.specialName}` }),
            role.id === 'grandma' && !locked
              ? el('span', {
                  role: 'button',
                  tabindex: '0',
                  class: 'replay-btn',
                  style: 'margin-left:auto;padding:2px 8px;font-size:11px;min-height:24px;',
                  'data-voice': 'grandma',
                  text: '🔊 試聽阿嬤名言',
                  onClick: (e) => {
                    e.stopPropagation();
                    soundFX.speak(role.quote, 'grandma', true);
                  },
                  onKeydown: (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      soundFX.speak(role.quote, 'grandma', true);
                    }
                  }
                })
              : null
          ]),
          el('div', { class: 'role-bars' }, HUD_STATS.map((st) =>
            el('div', { class: 'role-bar-row', title: `${st.label} ${role.startingStats[st.key]}` }, [
              htmlNode('role-bar-icon', getStatIconSvg(st.icon)),
              this._renderSegBar(role.startingStats[st.key], st.color)
            ])
          )),
          el('div', { class: 'role-pick-cta', text: locked ? '🔒 點上方「阿嬤平安符」即可解鎖' : '👆 點此選這位出發 ➔' })
        ])
      ]);
    }));

    return el('div', { class: 'role-select-wrap' }, [topBar, grid]);
  }

  _toggleVoice(btn) {
    soundFX.toggleVoice();
    const t = btn.querySelector('.hud-btn-text');
    if (t) t.textContent = `${soundFX.voiceEnabled ? '🎙️' : '🔇'} ${this._voiceBtnLabel()}`;
    btn.setAttribute('aria-pressed', String(soundFX.voiceEnabled));
  }

  _toggleMute() {
    this.muted = !this.muted;
    soundFX.setMuted(this.muted);
    document.querySelectorAll('.cutscene-video').forEach((v) => {
      v.muted = this.muted;
    });
    if (!this.muted) soundFX.startBGM();
    document.querySelectorAll('[data-mute-btn]').forEach((b) => { b.textContent = this.muted ? '🔇 靜音' : '🔊 音效'; });
  }

  _renderHud() {
    const role = getRole(this.state.roleId);
    const ch = getCurrentChapter(this.state);
    const s = this.state.stats;
    const [roadZh, roadEn] = this._roadParts(ch);
    const stars = Math.max(0, Math.min(5, this.state.wantedStars));
    const starsText = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    const statTips = {
      stamina: '肝指數：你的體力，歸零會呼叫阿嬤送便當補滿！',
      streetCred: '嘴砲力：短期應付高層或客戶的話術能力。',
      realLift: '真增量：帶進真正新客人的實戰實力。',
      brandTrust: '品牌信任：消費者喜歡並相信品牌的程度。',
      judgment: '衡斷力：分辨真假與做決斷的關鍵能力。'
    };

    const stationBtn = el('button', {
      class: 'hud-btn is-radio',
      title: '切換 GTA 車載電台',
      'aria-label': '切換車載電台',
      text: `📻 ${soundFX.getCurrentStation().short}`,
      onClick: (e) => {
        const st = soundFX.nextStation();
        e.currentTarget.textContent = `📻 ${st.short}`;
      }
    });

    const voiceBtn = el('button', {
      class: 'hud-btn',
      'data-voice': 'any',
      'aria-pressed': String(soundFX.voiceEnabled),
      title: '台灣語音播報開關',
      onClick: (e) => this._toggleVoice(e.currentTarget)
    }, [
      el('span', { class: 'wave', 'aria-hidden': 'true' }, [el('i'), el('i'), el('i')]),
      el('span', { class: 'hud-btn-text', text: `${soundFX.voiceEnabled ? '🎙️' : '🔇'} ${this._voiceBtnLabel()}` })
    ]);

    const helpBtn = el('button', {
      id: 'hud-help-trigger',
      type: 'button',
      class: 'hud-btn',
      popovertarget: 'hud-help-popover',
      'aria-haspopup': 'dialog',
      title: '查看五項能力數值與通緝星說明',
      text: '❓ 說明',
      onClick: () => soundFX.playClick()
    });
    const helpPopover = el('div', {
      id: 'hud-help-popover',
      popover: 'auto',
      class: 'hud-help-popover',
      role: 'dialog',
      'aria-label': '頂部數值與通緝星說明'
    }, [
      el('div', { class: 'hud-help-title', text: '❓ 頂部五項數值 ＆ 通緝星代表什麼？' }),
      el('div', { class: 'hud-help-list' }, [
        el('div', { text: '🔥 肝指數：你的體力，歸零也沒關係，阿嬤會衝來補滿！' }),
        el('div', { text: '🎤 嘴砲力：短期應付老闆的話術，但太高會傷信任。' }),
        el('div', { text: '📈 真增量：真正帶進新客人的能力（不把熟客算進來）。' }),
        el('div', { text: '🛡️ 品牌信任：顧客喜歡你的程度，決定長期口碑。' }),
        el('div', { text: '⚖️ 衡斷力：分辨對錯的決勝關鍵，決定你的終局稱號！' }),
        el('div', { class: 'hud-help-star-note', text: '⭐ 通緝星：讓短視高層不爽會升星；滿 5 顆星會召喚阿嬤提電鍋拯救，遊戲不會失敗結束！' })
      ])
    ]);

    return el('header', { class: 'hud-bar' }, [
      el('div', { class: 'hud-identity' }, [
        el('div', { class: 'hud-avatar-frame', 'data-voice': 'any' }, [
          el('img', { src: role.image, alt: role.name, onerror: (e) => { e.target.style.display = 'none'; } })
        ]),
        el('div', { class: 'hud-id-text' }, [
          htmlNode('hud-sign', SVG_ROAD_SIGN_BADGE(roadZh, roadEn)),
          el('div', { class: 'hud-time', text: `${ch.timeSlot} · 第 ${ch.id}／10 站 · ${ch.year} 年鑑` }),
          el('div', { class: 'hud-name', text: `${role.name}｜${ch.location}` }),
          el('div', { class: 'hud-pips', 'aria-hidden': 'true' }, CHAPTERS.map((c) =>
            el('i', { class: c.id < ch.id ? 'done' : (c.id === ch.id ? 'now' : '') })))
        ])
      ]),
      el('div', { class: 'hud-meters' }, HUD_STATS.map((m) =>
        el('div', { class: 'meter-box', style: `--seg:${m.color};`, title: statTips[m.key] || m.label }, [
          htmlNode('meter-icon', getStatIconSvg(m.icon)),
          el('div', { class: 'meter-label' }, [
            el('span', { text: m.label }),
            el('b', { text: String(s[m.key]) })
          ]),
          this._renderSegBar(s[m.key], m.color)
        ])
      )),
      el('div', { class: 'hud-right' }, [
        el('div', { class: 'cash-box' }, [
          el('div', { class: 'score-pill', text: `$${this.state.points.toLocaleString()}` }),
          el('div', {
            class: `wanted-box${this.state.wantedStars >= 4 ? ' is-hot' : ''}`,
            title: '慣老闆／CFO 炎上通緝星級（滿 5 星觸發阿嬤電鍋救援）',
            'aria-label': `通緝 ${stars} 星`,
            text: starsText
          })
        ]),
        stationBtn,
        voiceBtn,
        el('button', { class: 'hud-btn is-gold', text: '🛵 電動車×FSD', onClick: () => this._openScooterModal() }),
        el('button', {
          class: 'hud-btn',
          'data-mute-btn': '1',
          text: this.muted ? '🔇 靜音' : '🔊 音效',
          'aria-label': '切換音效',
          onClick: () => this._toggleMute()
        }),
        helpBtn,
        el('button', {
          class: 'hud-btn',
          text: '↺ 重開',
          onClick: () => {
            if (window.confirm('確定要重開？目前進度會清除。')) this._resetGame();
          }
        }),
        helpPopover
      ])
    ]);
  }

  _renderCutsceneStage() {
    const ch = getCurrentChapter(this.state);
    const role = getRole(this.state.roleId);
    const src = this.activeCutsceneSrc || ch.cutscene;
    const isGrandmaVideo = String(src).includes('grandma');
    const subSender = ch.baseLineSender || ch.lineSender;
    const subMessage = ch.baseLineMessage || ch.lineMessage;
    const subtitleText = isGrandmaVideo
      ? '阿嬤：「你們先不要亂砍預算，阿嬤帶大同電鍋趕過去了！」'
      : `${subSender.name}：「${subMessage}」`;

    const videoEl = el('video', {
      class: 'cutscene-video',
      src,
      playsinline: 'true',
      controls: 'true',
      preload: 'auto',
      onerror: (e) => {
        soundFX.setCutscenePlaying(false);
        e.target.style.display = 'none';
      }
    });
    videoEl.muted = this.muted;
    videoEl.volume = 1.0;

    const soundToggleBtn = el('button', {
      class: 'mode-chip',
      text: this.muted ? '🔇 點擊開啟影片聲音' : '🔊 影片人聲＋環境音',
      onClick: () => {
        if (videoEl.muted || this.muted) {
          this.muted = false;
          soundFX.setMuted(false);
          document.querySelectorAll('[data-mute-btn]').forEach((b) => { b.textContent = '🔊 音效'; });
          videoEl.muted = false;
          videoEl.volume = 1.0;
          videoEl.play().catch(() => {});
        } else {
          videoEl.muted = true;
        }
        syncAudioUi();
      }
    });

    const unlockBtn = el('button', {
      class: 'btn-gold',
      style: 'position:absolute;top:14px;right:14px;z-index:3;display:none;min-height:38px;padding:6px 12px;font-size:13px;',
      text: '🔊 點擊開啟影片人聲與環境音效',
      onClick: () => {
        this.muted = false;
        soundFX.setMuted(false);
        document.querySelectorAll('[data-mute-btn]').forEach((b) => { b.textContent = '🔊 音效'; });
        videoEl.muted = false;
        videoEl.volume = 1.0;
        videoEl.currentTime = 0;
        videoEl.play().catch(() => {});
        unlockBtn.style.display = 'none';
        syncAudioUi();
      }
    });

    const syncAudioUi = () => {
      const activeAudio = !videoEl.paused && !videoEl.muted && !this.muted;
      soundFX.setCutscenePlaying(activeAudio);
      soundToggleBtn.textContent = videoEl.muted || this.muted ? '🔇 點擊開啟影片聲音' : '🔊 影片人聲＋環境音';
      soundToggleBtn.classList.toggle('is-active', !videoEl.muted && !this.muted);
    };

    videoEl.addEventListener('play', syncAudioUi);
    videoEl.addEventListener('pause', () => soundFX.setCutscenePlaying(false));
    videoEl.addEventListener('ended', () => soundFX.setCutscenePlaying(false));
    videoEl.addEventListener('volumechange', syncAudioUi);

    requestAnimationFrame(() => {
      if (!videoEl.isConnected) return;
      if (this.muted) {
        videoEl.play().catch(() => {});
        return;
      }
      const p = videoEl.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          videoEl.muted = true;
          syncAudioUi();
          unlockBtn.style.display = 'inline-flex';
          videoEl.play().catch(() => {});
        });
      }
    });

    return el('section', { class: 'panel cutscene-stage', style: 'display:flex;flex-direction:column;gap:14px;border-color:var(--gold);' }, [
      el('div', { class: 'chapter-header' }, [
        el('div', {}, [
          el('div', { class: 'gta-kicker', text: isGrandmaVideo ? `HIGGSFIELD CUTSCENE · 阿嬤緊急支援（${role.name}）` : `HIGGSFIELD CUTSCENE · ${ch.timeSlot} · ${ch.roleRoute?.routeName || role.name}` }),
          el('h2', { style: 'margin:4px 0 0 0;', text: `${ch.title} — ${ch.location}` })
        ]),
        el('div', { style: 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;' }, [
          soundToggleBtn,
          el('button', {
            class: 'mode-chip',
            text: '↺ 重播影片',
            onClick: () => {
              videoEl.currentTime = 0;
              videoEl.muted = this.muted;
              videoEl.volume = 1.0;
              videoEl.play().catch(() => {});
              syncAudioUi();
            }
          }),
          el('button', { class: 'btn-primary', text: '⏭️ 跳過動畫，直接開始玩 ➔', onClick: () => this._leaveCutscene() })
        ])
      ]),
      el('div', { class: 'cutscene-stage-wrap' }, [
        videoEl,
        unlockBtn,
        el('div', { class: 'cutscene-subtitle', text: subtitleText })
      ]),
      el('div', { class: 'cutscene-novice-tip', text: '💡 影片會帶你認識這個時段的現場背景；隨時點右上角粉色按鈕（或按空白鍵 Space）即可跳過直接進入選題畫面！' }),
      el('p', { class: 'chapter-desc', text: ch.sceneDesc })
    ]);
  }

  _renderPlayGrid() {
    const ch = getCurrentChapter(this.state);
    if (this._getMapsApiKey() && !this.resolvedPanoInfo[ch.id]) {
      this._lookupLivePano(ch);
    }
    return el('div', { class: 'play-grid' }, [
      this._renderLeftColumn(ch),
      this._renderRightColumn(ch)
    ]);
  }

  _renderLeftColumn(ch) {
    const role = getRole(this.state.roleId);
    return el('div', { class: 'col-left' }, [
      this._renderSceneCard(ch),
      el('div', { class: 'dock-row' }, [
        this._renderMiniMap(ch),
        this._renderClueCard(ch, role)
      ])
    ]);
  }

  _renderRightColumn(ch) {
    return el('div', { class: 'col-right' }, [
      this._renderMainStage(),
      this._renderPhoneDrawer(ch)
    ]);
  }

  _toggleFsd(ch) {
    soundFX.playAutopilotChime();
    this.fsdHudOverlay = !this.fsdHudOverlay;
    if (this.fsdHudOverlay && (this.sceneViewMode === 'gmap_360' || this.sceneViewMode === 'gmap_live')) {
      this.sceneViewMode = 'gta';
    }
    this.render();
    if (this.fsdHudOverlay) {
      soundFX.speak('Tesla FSD 已接管，前方機車十八公尺，車距鎖定，沿松仁路前進。', 'fsd', true);
    } else {
      soundFX.speak('已切換回手動駕駛。', 'fsd', true);
    }
  }

  _renderSceneCard(ch) {
    const gm = ch.googleMap || {};
    const mode = this.sceneViewMode;
    let media;
    let isIframe = false;
    if (mode === 'gmap_360' && gm.panoId) {
      isIframe = true;
      media = el('iframe', {
        class: 'scene-gmap-iframe',
        src: this._build360EmbedUrl({ ...gm, panoId: this.resolvedPanoInfo[ch.id]?.panoId || gm.panoId }),
        title: `Google 360° 互動街景：${ch.location}`,
        allowfullscreen: 'true',
        loading: 'lazy',
        referrerpolicy: 'no-referrer-when-downgrade'
      });
    } else if (mode === 'gmap_live' && gm.embedQuery) {
      isIframe = true;
      media = el('iframe', {
        class: 'scene-gmap-iframe',
        src: `https://maps.google.com/maps?q=${encodeURIComponent(gm.embedQuery)}&t=k&hl=zh-TW&z=18&output=embed`,
        title: `Google Maps 真實衛星圖：${ch.location}`,
        loading: 'lazy',
        referrerpolicy: 'no-referrer-when-downgrade'
      });
    } else if (mode === 'gmap_photo' && gm.realPhoto) {
      media = el('img', {
        src: gm.realPhoto,
        alt: `A25 完工實拍：${gm.roadSign || ch.location}`,
        onerror: (e) => { e.target.style.display = 'none'; }
      });
    } else {
      media = el('img', {
        src: ch.sceneImage,
        alt: ch.location,
        onerror: (e) => { e.target.style.display = 'none'; }
      });
    }

    let subtitleText = '';
    if (mode === 'gmap_photo') subtitleText = `📷 富邦 A25 完工實拍 · ${gm.roadSign || ch.location}`;
    else if (!isIframe) subtitleText = `📍 ${ch.timeSlot} · ${ch.location}`;

    const [roadZh, roadEn] = this._roadParts(ch);
    const setMode = (m, extra) => () => {
      soundFX.playClick();
      this.sceneViewMode = m;
      if (extra) extra();
      this.render();
    };
    const chip = (m, text, extra) => el('button', {
      type: 'button',
      class: `mode-chip${mode === m ? ' is-active' : ''}`,
      text,
      onClick: setMode(m, extra)
    });

    const morePopover = el('div', {
      id: 'scene-more-views',
      popover: 'auto',
      class: 'scene-more-popover',
      role: 'menu',
      'aria-label': '更多現場視角'
    });
    const closeMore = () => {
      try {
        if (typeof morePopover.hidePopover === 'function') morePopover.hidePopover();
      } catch {}
    };
    const chipPop = (m, text, extra) => el('button', {
      type: 'button',
      role: 'menuitem',
      class: `mode-chip${mode === m ? ' is-active' : ''}`,
      text,
      onClick: () => {
        closeMore();
        setMode(m, extra)();
      }
    });
    morePopover.append(
      el('div', { class: 'scene-more-popover-title', text: '更多現場視角' }),
      chipPop('gmap_photo', '🏛️ A25實拍'),
      chipPop('gmap_live', '🛰️ 衛星圖'),
      el('button', {
        type: 'button',
        role: 'menuitem',
        class: `mode-chip${this.fsdHudOverlay ? ' is-active' : ''}`,
        'aria-pressed': String(this.fsdHudOverlay),
        text: this.fsdHudOverlay ? '🤖 Tesla FSD：開' : '🤖 Tesla FSD 視角',
        onClick: () => {
          closeMore();
          this._toggleFsd(ch);
        }
      }),
      el('button', {
        type: 'button',
        role: 'menuitem',
        class: 'mode-chip',
        text: '🧭 放大 360° 街景',
        onClick: () => {
          closeMore();
          soundFX.playClick();
          this.streetViewModalOpen = true;
          this._lookupLivePano(ch);
          this.render();
        }
      })
    );

    const hasSecondaryActive = mode === 'gmap_photo' || mode === 'gmap_live' || this.fsdHudOverlay;
    const viewport = el('div', { class: 'scene-media-viewport' }, [
      media,
      this.fsdHudOverlay && !isIframe ? htmlNode('scene-fsd', SVG_TESLA_FSD_HUD_OVERLAY) : null,
      subtitleText ? el('div', { class: 'scene-subtitle', text: subtitleText }) : null
    ]);

    return el('div', { class: 'panel scene-card' }, [
      el('div', { class: 'tex', style: 'background-image:url(./public/images/ui-begonia-glass.webp);', 'aria-hidden': 'true' }),
      htmlNode('grille tl', SVG_IRON_GRILLE_CORNER),
      htmlNode('grille tr', SVG_IRON_GRILLE_CORNER),
      el('div', { class: 'zone-tag is-ref', text: '👀 左邊：現場參考與小抄（不用急著按，想看再看）' }),
      // Track 1：路牌狀態列（獨立空間）
      el('div', { class: 'track-status' }, [
        htmlNode('track-sign', SVG_ROAD_SIGN_BADGE(roadZh, roadEn)),
        el('div', { class: 'track-right' }, [
          htmlNode('track-a25', SVG_FUBON_A25_WIKI_BLUEPRINT),
          el('span', { class: 'time-tag', text: `${ch.timeSlot} · ${ch.title}` })
        ])
      ]),
      // Track 2：純淨 16:9 視景
      viewport,
      // Track 3：精簡單排視景控制列（次要視角收進原生 Popover 選單）
      el('div', { class: 'track-controls' }, [
        el('div', { class: 'ctl-row', role: 'group', 'aria-label': '視景模式' }, [
          chip('gta', '🎬 3D劇照'),
          chip('gmap_360', '🌐 360°街景', () => this._lookupLivePano(ch)),
          el('button', {
            id: 'more-views-trigger',
            type: 'button',
            class: `mode-chip${hasSecondaryActive ? ' is-active' : ''}`,
            popovertarget: 'scene-more-views',
            'aria-haspopup': 'menu',
            title: '展開 A25實拍／衛星圖／Tesla FSD／放大街景',
            text: '⋯ 更多視角',
            onClick: () => soundFX.playClick()
          }),
          ch.cutscene
            ? el('button', {
                type: 'button',
                class: 'hotspot-chip',
                text: '🎬 重播動畫',
                onClick: () => {
                  this.activeCutsceneSrc = ch.cutscene;
                  this._setState({ ...this.state, phase: 'cutscene' });
                }
              })
            : null
        ]),
        morePopover
      ])
    ]);
  }

  _renderClueCard(ch, role) {
    const clue = ch.roleClues[role.id] || ch.roleClues.planner;
    return el('div', {
      id: 'clue-card-panel',
      class: `panel clue-card${this.highlightTarget === 'clue' ? ' is-highlighted' : ''}`,
      style: `border-color:${role.color};`
    }, [
      htmlNode('grille', SVG_IRON_GRILLE_CORNER),
      el('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;' }, [
        el('div', { class: 'clue-title', style: `color:${role.color};margin:0;`, text: `🕵️ ${role.name}・桌上獨家線索` }),
        role.id === 'grandma'
          ? el('button', {
              class: 'replay-btn',
              'data-voice': 'grandma',
              text: '🔊 聽台灣阿嬤',
              onClick: () => soundFX.speak(clue, 'grandma', true)
            })
          : null
      ]),
      el('div', { class: 'clue-text', text: clue }),
      el('button', {
        class: 'btn-cyan',
        disabled: this.state.roleSpecialUsedThisChapter,
        text: this.state.roleSpecialUsedThisChapter ? `✓ 本章已用 ${role.specialName}` : `⚡ 發動絕招：${role.specialName}`,
        onClick: () => {
          soundFX.playMissionPassed();
          this._setState(useRoleSpecial(this.state));
        }
      })
    ]);
  }

  // 台北 GPS 戰術雷達：底圖 ui-taipei-radar-map.webp ＋ 羅盤外環 ＋ 以百分比定位的十個站點
  _renderMiniMap(ch) {
    const gm = ch.googleMap || {};
    const hasKey = Boolean(this._getMapsApiKey());
    const radarNextLabel = this.radarMode === 'radar'
      ? '🗺️ 衛星圖'
      : (this.radarMode === 'gmap' && hasKey ? '🔑 JS地圖' : '📡 切雷達');

    let body;
    if (this.radarMode === 'gmap' && gm.embedQuery) {
      body = el('iframe', {
        class: 'minimap-gmap-iframe',
        src: `https://maps.google.com/maps?q=${encodeURIComponent(gm.embedQuery)}&t=m&hl=zh-TW&z=16&output=embed`,
        title: 'Google Maps 小地圖',
        loading: 'lazy',
        referrerpolicy: 'no-referrer-when-downgrade'
      });
    } else if (this.radarMode === 'gmap_js' && hasKey) {
      const host = el('div', { class: 'minimap-gmap-iframe', style: 'background:#0d1424;' });
      requestAnimationFrame(() => this._mountJsRadarMap(host, ch));
      body = host;
    } else {
      body = this._buildRadarStage(ch);
    }

    return el('div', { class: 'minimap-box' }, [
      el('div', { class: 'minimap-head' }, [
        el('span', { text: `2026 信義 GPS · 站點 ${ch.id}/10` }),
        el('button', {
          class: 'mode-chip',
          text: radarNextLabel,
          onClick: () => {
            soundFX.playClick();
            if (this.radarMode === 'radar') this.radarMode = 'gmap';
            else if (this.radarMode === 'gmap' && hasKey) this.radarMode = 'gmap_js';
            else this.radarMode = 'radar';
            this.render();
          }
        })
      ]),
      body
    ]);
  }

  _buildRadarStage(activeCh) {
    const roleChapters = CHAPTERS.map((_, i) => getChapterForRole(i, this.state.roleId));
    const toPoint = (c, i) => {
      if (Array.isArray(c.mapPos) && c.mapPos.length >= 2) return c.mapPos;
      if (c.mapPos && typeof c.mapPos.x === 'number' && typeof c.mapPos.y === 'number') {
        return [c.mapPos.x, c.mapPos.y];
      }
      return RADAR_POS[i] || [50, 50];
    };
    const points = roleChapters.map(toPoint);

    const svgNS = 'http://www.w3.org/2000/svg';
    const route = document.createElementNS(svgNS, 'svg');
    route.setAttribute('viewBox', '0 0 100 100');
    route.setAttribute('preserveAspectRatio', 'none');
    route.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;');
    const line = document.createElementNS(svgNS, 'polyline');
    line.setAttribute('points', points.map((p) => `${p[0]},${p[1]}`).join(' '));
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', 'rgba(255,79,163,0.55)');
    line.setAttribute('stroke-width', '1.4');
    line.setAttribute('stroke-dasharray', '3 2');
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    route.appendChild(line);

    const dots = roleChapters.map((c, i) => {
      const p = points[i] || [50, 50];
      const cls = c.id === activeCh.id ? 'now' : (c.id < activeCh.id ? 'done' : '');
      return el('span', {
        class: `radar-dot ${cls}`,
        style: `left:${p[0]}%;top:${p[1]}%;`,
        title: `第 ${c.id} 站 ${c.timeSlot}｜${c.location}`
      });
    });

    return el('div', { class: 'radar-wrap' }, [
      el('div', { class: 'radar-stage' }, [
        el('img', {
          class: 'radar-base',
          src: './public/images/ui-taipei-radar-map.webp',
          alt: '台北信義區 GPS 戰術雷達底圖',
          onerror: (e) => { e.target.style.display = 'none'; }
        }),
        route,
        ...dots,
        htmlNode('radar-ring', SVG_RADAR_COMPASS_RING),
        el('span', { class: 'radar-tag', text: `${activeCh.roleRoute?.routeBadge || '2026 台北行程'} · ${activeCh.timeSlot}` })
      ])
    ]);
  }

  _speakTwin(ch, tid, manual) {
    const text = ch.peopleModel && ch.peopleModel[tid];
    if (text) soundFX.speak(text, tid, manual);
  }

  _renderPhoneDrawer(ch) {
    const tabs = el('div', { class: 'phone-tabs' }, [
      el('button', {
        class: `phone-tab${this.phoneTab === 'line' ? ' is-active' : ''}`,
        text: `💬 LINE (${this.state.phoneLog.length})`,
        onClick: () => { this.phoneTab = 'line'; this.render(); }
      }),
      el('button', {
        class: `phone-tab${this.phoneTab === 'people' ? ' is-active' : ''}`,
        text: '🧠 讀心',
        onClick: () => { this.phoneTab = 'people'; this.render(); }
      }),
      el('button', {
        class: `phone-tab${this.phoneTab === 'grandma' ? ' is-active' : ''}`,
        text: '👵 阿嬤',
        onClick: () => {
          this.phoneTab = 'grandma';
          if (!this.state.grandmaUnlocked) {
            this._triggerCheatCode(false);
          } else {
            this.render();
          }
          soundFX.speak(ch.grandmaQuip, 'grandma', true);
        }
      }),
      el('button', {
        class: `phone-tab${this.phoneTab === 'gta6' ? ' is-active' : ''}`,
        text: '🎬 GTA6',
        onClick: () => { soundFX.playClick(); this.phoneTab = 'gta6'; this.render(); }
      })
    ]);

    let bodyNode;
    if (this.phoneTab === 'line') {
      const items = [...this.state.phoneLog].reverse().slice(0, 8);
      bodyNode = el('div', { class: 'chat-scroll' }, items.map((m) => {
        const cls = m.badge?.includes('AMA') || m.badge === 'RESCUE'
          ? 'msg-bubble is-grandma'
          : (m.badge === 'BOSS' || m.badge === 'CFO' ? 'msg-bubble is-boss' : 'msg-bubble');
        return el('div', { class: cls }, [
          el('div', { style: 'font-size:12px;font-weight:800;color:var(--gold);margin-bottom:2px;', text: `${m.from} · ${m.time} [${m.badge}]` }),
          el('div', { text: m.text })
        ]);
      }));
    } else if (this.phoneTab === 'people') {
      bodyNode = el('div', { style: 'display:flex;flex-direction:column;gap:6px;' }, [
        el('div', { style: 'font-size:13px;color:var(--muted);', text: '電通 2026《People Model》數位分身，點擊即可追問（會用該角色聲線朗讀）：' }),
        ...['lisa', 'cindy'].map((tid) => {
          const twin = PEOPLE_MODEL_TWINS[tid];
          const asked = this.state.askedTwins.includes(tid);
          return el('div', { class: 'twin-wrap' }, [
            el('button', {
              class: 'twin-row',
              onClick: () => {
                soundFX.playLinePing();
                this._setState(consultTwin(this.state, tid));
                this._speakTwin(ch, tid, false);
              }
            }, [
              el('img', { class: 'twin-avatar', src: twin.image, alt: twin.name, onerror: (e) => { e.target.style.display = 'none'; } }),
              el('div', { class: 'twin-text' }, [
                el('b', { text: twin.name }),
                el('span', { text: asked ? `「${ch.peopleModel[tid]}」` : '點擊詢問（+250 分 / 衡斷力+2）' })
              ])
            ]),
            asked
              ? el('button', {
                  class: 'replay-btn',
                  'data-voice': tid,
                  'aria-label': `重聽 ${twin.name}`,
                  text: '🔊 重聽',
                  onClick: () => this._speakTwin(ch, tid, true)
                })
              : null
          ]);
        })
      ]);
    } else if (this.phoneTab === 'gta6') {
      const g6 = ch.gta6Analysis || {};
      bodyNode = el('div', { class: 'chat-scroll gta6-analysis-card' }, [
        el('div', { style: 'font-size:12.5px;font-weight:800;color:var(--cyan);', text: `🎬 ${g6.trailerScene || GTA6_TAIWAN_ANALYSIS.title}` }),
        el('div', { style: 'font-size:13px;color:#efeafd;', text: `🎭 Lucia × Jason 角色映射：${g6.characterArc || GTA6_TAIWAN_ANALYSIS.coreParallel}` }),
        el('div', { style: 'font-size:13px;color:var(--gold);', text: `🇹🇼 台灣設計元素：${g6.taiwanCraft || GTA6_TAIWAN_ANALYSIS.taiwanMotifs[0]}` })
      ]);
    } else {
      bodyNode = el('div', { style: 'display:flex;flex-direction:column;gap:6px;' }, [
        el('div', { style: 'font-size:12px;color:var(--gold);font-weight:800;', text: '🎙️ Google Gemini TTS「台灣阿嬤」台味配音' }),
        el('div', { class: 'rescue-toast', style: 'font-size:14px;padding:6px 10px;', text: ch.grandmaQuip }),
        el('div', { style: 'font-size:13px;color:var(--gold);', text: `☎️ ${ch.grandmaPhoneCall.title}：「${ch.grandmaPhoneCall.text}」` }),
        el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap;' }, [
          el('button', {
            class: 'btn-gold',
            style: 'min-height:44px;font-size:14px;padding:6px 10px;flex:1 1 auto;',
            text: '🍲 呼叫阿嬤大同電鍋（清通緝星＋補滿體力）',
            onClick: () => this._triggerCheatCode(true)
          }),
          el('button', {
            class: 'replay-btn',
            'data-voice': 'grandma',
            text: '🔊 重聽金句',
            onClick: () => soundFX.speak(ch.grandmaQuip, 'grandma', true)
          }),
          el('button', {
            class: 'replay-btn',
            'data-voice': 'grandma',
            text: '🔊 重聽來電',
            onClick: () => soundFX.speak(ch.grandmaPhoneCall.text, 'grandma', true)
          })
        ])
      ]);
    }

    return el('section', {
      id: 'phone-card-panel',
      class: `phone-frame${this.highlightTarget === 'phone' ? ' is-highlighted' : ''}`
    }, [
      htmlNode('phone-island', SVG_IFRUIT_CHASSIS_TOP),
      el('div', { class: 'phone-head' }, [
        el('span', { style: 'color:var(--pink);', text: '📱 iFruit Taiwan · LINE 99+' }),
        el('span', { style: 'font-size:12px;color:var(--muted);', text: '5G 富邦 A25' })
      ]),
      tabs,
      bodyNode
    ]);
  }

  async _mountJsRadarMap(hostEl, activeCh) {
    const ok = await this._ensureMapsJsLoaded();
    if (!ok || !window.google?.maps?.Map || !hostEl.isConnected) return;
    const gm = activeCh.googleMap || { lat: 25.0391247, lng: 121.5691512 };
    const map = new window.google.maps.Map(hostEl, {
      center: { lat: gm.lat, lng: gm.lng },
      zoom: 14,
      disableDefaultUI: true,
      mapTypeId: 'roadmap'
    });
    const path = [];
    for (let i = 0; i < CHAPTERS.length; i += 1) {
      const c = getChapterForRole(i, this.state.roleId);
      if (!c.googleMap) continue;
      const pos = { lat: c.googleMap.lat, lng: c.googleMap.lng };
      path.push(pos);
      new window.google.maps.Marker({
        position: pos,
        map,
        title: `第 ${c.id} 站 ${c.timeSlot}｜${c.location}`,
        label: String(c.id)
      });
    }
    new window.google.maps.Polyline({
      path,
      map,
      strokeColor: '#ff4fa3',
      strokeOpacity: 0.9,
      strokeWeight: 2.5
    });
    setTimeout(() => hostEl.querySelector('.dismissButton')?.click(), 450);
  }

  async _mountJsStreetView(hostEl, ch) {
    const ok = await this._ensureMapsJsLoaded();
    if (!ok || !window.google?.maps?.StreetViewPanorama || !hostEl.isConnected) return;
    const gm = ch.googleMap || {};
    new window.google.maps.StreetViewPanorama(hostEl, {
      pano: (this.resolvedPanoInfo[ch.id]?.panoId) || gm.panoId || 'dp2njH37xCDpod8-j4Ockw',
      pov: { heading: gm.heading ?? 115, pitch: gm.pitch ?? 16 },
      zoom: 0,
      addressControl: true,
      showRoadLabels: true
    });
    setTimeout(() => hostEl.querySelector('.dismissButton')?.click(), 450);
  }

  _renderStepFlow(phase) {
    const steps = [
      { id: 'scene', label: '① 讀行程與狀況' },
      { id: 'reply', label: '② 選臨場回覆' },
      { id: 'game', label: '③ 解專屬題目' },
      { id: 'reveal', label: '④ 年鑑金句復盤' }
    ];
    let activeIdx = 1;
    if (phase === 'scene') activeIdx = 1;
    else if (phase === 'game') activeIdx = 2;
    else if (phase === 'reveal') activeIdx = 3;

    return el('div', { class: 'step-flow-bar' }, steps.map((st, idx) => {
      const cls = idx < activeIdx
        ? 'step-pill is-done'
        : (idx === activeIdx || (phase === 'scene' && idx === 0) ? 'step-pill is-active' : 'step-pill');
      return el('div', { class: cls, text: idx < activeIdx ? `✓ ${st.label}` : st.label });
    }));
  }

  _renderMainStage() {
    const ch = getCurrentChapter(this.state);
    const phase = this.state.phase;
    const hasLineClip = Boolean(soundFX.resolveVoiceClip(ch.lineMessage, 'boss'));
    const nextCh = this.state.chapterIndex < CHAPTERS.length - 1
      ? getChapterForRole(this.state.chapterIndex + 1, this.state.roleId)
      : null;

    const actionZoneTag = el('span', { class: 'zone-tag is-action', text: '🎯 右邊操作區' });

    const header = el('div', { class: 'chapter-header' }, [
      el('div', {}, [
        el('div', { class: 'chapter-kicker-row' }, [
          actionZoneTag,
          el('div', { class: 'gta-kicker', text: `${ch.roleRoute?.routeBadge ? `${ch.roleRoute.routeBadge} · ` : ''}${ch.timeSlot} · 第 ${ch.id}／10 站` })
        ]),
        el('h2', { text: `${ch.title}｜${ch.location}` })
      ]),
      el('div', { class: 'pill', text: `${ch.book}` })
    ]);

    const stepFlow = this._renderStepFlow(phase);
    const beginnerBanner = (this.state.chapterIndex === 0 && phase === 'scene' && !this.beginnerTipDismissed)
      ? el('div', { class: 'beginner-coach-banner', role: 'status' }, [
          el('span', { style: 'flex:1 1 200px;', text: '🐣 新手提示：看完 LINE 直接點 1–4 回覆（選錯不會死！）；左欄線索卡關再看。' }),
          el('div', { class: 'beginner-coach-actions' }, [
            el('button', {
              type: 'button',
              class: 'btn-cyan',
              text: '🧭 導覽',
              onClick: (e) => {
                soundFX.playClick();
                this._startHudTour('scene', e.currentTarget);
              }
            }),
            el('button', {
              type: 'button',
              class: 'btn-ghost',
              text: '✓ 我懂了',
              onClick: () => {
                soundFX.playClick();
                this._saveBeginnerTipDone(true);
                this.render();
              }
            })
          ])
        ])
      : null;

    const rescueBanner = this.state.lastRescueMessage
      ? el('div', {
          class: 'rescue-toast',
          style: 'display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;'
        }, [
          el('span', { style: 'flex:1 1 240px;', text: `🍲 ${this.state.lastRescueMessage}` }),
          el('button', {
            class: 'replay-btn',
            'data-voice': 'grandma',
            text: '🔊 重聽阿嬤',
            onClick: () => soundFX.speak(this.state.lastRescueMessage, 'grandma', true)
          })
        ])
      : null;

    if (phase === 'scene') {
      return el('main', { class: 'panel main-stage is-action-focus' }, [
        actionZoneTag,
        header,
        stepFlow,
        beginnerBanner,
        rescueBanner,
        el('p', { class: 'chapter-desc', text: ch.sceneDesc }),
        el('div', { class: 'boss-callout line-banner' }, [
          el('div', {}, [
            el('div', { class: 'boss-meta', text: `📩 ${ch.lineSender.name}（${ch.lineSender.role}）剛剛傳 LINE 給你：` }),
            el('div', { text: `「${ch.lineMessage}」` })
          ]),
          hasLineClip
            ? el('button', {
                class: 'replay-btn',
                'data-voice': 'boss',
                text: `🔊 聽${ch.lineSender.name}語音`,
                onClick: () => soundFX.speak(ch.lineMessage, 'boss', true)
              })
            : null
        ]),
        el('div', { class: 'quiz-guide-box' }, [
          el('div', { class: 'quiz-guide-badge', text: `👇 第 1 步操作｜請點選下面 4 個回覆之一（${ch.roleRoute?.routeBadge || ''}）` }),
          el('div', { class: 'prompt-line', text: '直接用滑鼠點（或按鍵盤 1–4）；選錯也不會結束，選完馬上進入下一題！' })
        ]),
        el('div', { class: 'replies-grid' }, ch.replies.map((r, idx) =>
          el('button', {
            class: 'reply-btn',
            onClick: () => this._pickReply(idx)
          }, [
            el('span', { class: 'reply-key', text: String(idx + 1) }),
            el('span', { class: 'reply-label', text: r.text }),
            el('span', { class: 'reply-cta', text: '點選 ➔' })
          ])
        ))
      ]);
    }

    if (phase === 'game') {
      const gameTypeGuides = {
        pick: '👇 怎麼玩：直接點選你覺得最對的那張卡片，點一下就會自動送出！',
        agent: '👇 怎麼玩：直接點選你想挑選的那一張卡片，點一下就會自動送出！',
        slider: '👇 怎麼玩：① 先拖拉圓點或點下方數字刻度 ➔ ② 按最底下的「鎖定這個數字」按鈕送出！',
        swipe: '👇 怎麼玩：不用滑動拖曳！直接點下方左邊（藍）或右邊（粉）按鈕，連答 4 張就過關！',
        multi: '👇 怎麼玩：① 點多張卡片打勾（☑ 可複選）➔ ② 全部勾完後，按底下「送出複選審計」按鈕！',
        stop: '👇 怎麼玩：看準「新客比例」快掉下去時，馬上點下方超大粉色「緊急煞車」按鈕！'
      };
      const gameGuideText = gameTypeGuides[ch.game?.type] || '👇 怎麼玩：依提示完成下方實務題目！';

      return el('main', { class: 'panel main-stage is-action-focus' }, [
        actionZoneTag,
        header,
        stepFlow,
        rescueBanner,
        this.state.activeReply
          ? el('div', { style: 'padding:8px 12px;border-radius:10px;background:rgba(255,255,255,0.06);font-size:15px;color:#e0d6f7;', text: `你剛剛回：「${this.state.activeReply.text}」➔ ${this.state.activeReply.feedback}` })
          : null,
        el('div', { class: 'quiz-guide-box' }, [
          el('div', { class: 'quiz-guide-badge', text: `🎯 第 2 步操作｜${ch.roleRoute?.routeBadge || ''}・本角色專屬實務題` }),
          el('div', { class: 'prompt-line', text: gameGuideText })
        ]),
        this._renderMiniGame(ch.game)
      ]);
    }

    // phase === 'reveal'
    const out = this.state.lastGameOutcome || { scored: false, correct: true, detail: '', pointsEarned: 0 };
    const badgeText = out.scored ? (out.correct ? '🎯 識破迷霧！' : '💡 差一點（參與分照拿）') : '✅ 完成情境實測';
    return el('main', { class: 'panel main-stage is-action-focus' }, [
      actionZoneTag,
      header,
      stepFlow,
      rescueBanner,
      el('div', { class: 'boss-callout', style: `border-color:${out.correct ? 'var(--lime)' : 'var(--orange)'};` }, [
        el('div', { style: 'font-size:15px;color:var(--gold);margin-bottom:4px;', text: `${badgeText} · +$${out.pointsEarned.toLocaleString()}` }),
        el('div', { text: out.detail })
      ]),
      el('div', { class: 'panel takeaway-card' }, [
        htmlNode('stamp-slot', SVG_TEMPLE_STAMP_PASSED),
        el('div', { style: 'font-size:13px;font-weight:800;color:var(--cyan);margin-bottom:4px;', text: '📌 一句帶走 TAKEAWAY' }),
        el('div', { class: 'takeaway-text', text: `「${ch.takeaway}」` }),
        el('div', { style: 'font-size:14px;color:var(--muted);margin-top:4px;', text: `出處：${ch.book} ${ch.source}` }),
        el('button', {
          class: 'replay-btn',
          style: 'margin-top:6px;',
          'data-voice': 'narrator',
          text: '🔊 再聽一次',
          onClick: () => soundFX.speak(ch.takeaway, 'narrator', true)
        })
      ]),
      ch.gta6Analysis
        ? el('div', { class: 'panel', style: 'border-color:rgba(255,79,163,0.45);display:flex;flex-direction:column;gap:4px;' }, [
            el('div', { style: 'font-size:13px;font-weight:800;color:var(--pink);', text: `🎬 GTA 6 × 台灣設計美學｜${ch.gta6Analysis.trailerScene}` }),
            el('div', { style: 'font-size:14px;color:#efeafd;', text: `🎭 ${ch.gta6Analysis.characterArc}` }),
            el('div', { style: 'font-size:13.5px;color:var(--gold);', text: `🇹🇼 在地元素：${ch.gta6Analysis.taiwanCraft}` })
          ])
        : null,
      el('div', {
        class: 'rescue-toast',
        style: 'display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;'
      }, [
        el('span', { style: 'flex:1 1 260px;', text: `👵 ${ch.grandmaQuip}` }),
        el('button', {
          class: 'replay-btn',
          'data-voice': 'grandma',
          text: '🔊 聽台灣阿嬤配音',
          onClick: () => soundFX.speak(ch.grandmaQuip, 'grandma', true)
        })
      ]),
      el('div', { class: 'prompt-line', text: nextCh ? '🎉 本站完成！看完金句後，點下方粉色按鈕（或右下底部粉色按鈕）前往下一站！' : '🏁 全部 10 站完成！點下方粉色按鈕查看你的終局稱號！' }),
      el('div', { class: 'reveal-actions' }, [
        el('button', {
          class: 'btn-gold',
          text: '🛵 騎2026電動車衝一波加分',
          onClick: () => this._openScooterModal()
        }),
        el('button', {
          class: 'btn-primary',
          text: nextCh ? `下一站行程（${nextCh.timeSlot}）➔` : '查看終局考績與稱號 ➔',
          onClick: () => {
            soundFX.playClick();
            this._setState(advanceChapter(this.state));
          }
        })
      ])
    ]);
  }

  _renderMiniGame(game) {
    if (!game) return el('div');

    if (game.type === 'pick' || game.type === 'agent') {
      const hint = game.type === 'agent'
        ? '🧋 真實便利商店冰櫃情境：點一下你想拿的那瓶飲料（或按鍵盤 1–3）'
        : '📄 真實桌邊簡報情境：點一下你要帶進會議室的報告（或按鍵盤 1–4）';
      return el('div', { style: 'display:flex;flex-direction:column;gap:12px;' }, [
        el('h3', { style: 'margin:0;font-size:20px;color:var(--gold);', text: game.prompt }),
        el('div', { style: 'font-size:13px;color:var(--cyan);font-weight:700;', text: hint }),
        el('div', { class: 'paper-grid' }, game.options.map((opt, idx) =>
          el('button', {
            class: 'paper-card',
            onClick: () => {
              const next = submitMiniGame(this.state, idx);
              if (next.lastGameOutcome?.correct) soundFX.playMissionPassed();
              else soundFX.playClick();
              this._setState(next);
            }
          }, [
            el('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;' }, [
              el('h4', { style: 'margin:0;', text: `[${idx + 1}] ${opt.title}` }),
              el('span', { class: 'paper-cta', text: '👆 點選' })
            ]),
            opt.lines && opt.lines.length
              ? el('ul', {}, opt.lines.map((line) => el('li', { text: line })))
              : null
          ])
        ))
      ]);
    }

    if (game.type === 'slider') {
      if (this.sliderVal === null) this.sliderVal = game.start;
      const readout = el('div', { class: 'slider-readout', text: `${this.sliderVal} ${game.unit || ''}` });
      const range = el('input', {
        class: 'slider-input',
        type: 'range',
        min: game.min,
        max: game.max,
        step: game.step,
        value: this.sliderVal,
        onInput: (e) => {
          this.sliderVal = Number(e.target.value);
          readout.textContent = `${this.sliderVal} ${game.unit || ''}`;
        }
      });

      const presets = game.max <= 10
        ? [1, 3, 5, 7, 10]
        : (game.answer <= 70 ? [20, 40, 65, 80, 95] : [20, 40, 60, 80, 95]);

      return el('div', { class: 'slider-box' }, [
        el('h3', { style: 'margin:0;font-size:20px;color:var(--gold);', text: game.prompt }),
        el('div', { style: 'font-size:13px;color:var(--cyan);font-weight:700;', text: '🎛️ 可拖曳滑桿微調，或直接點選下方常見刻度按鈕，最後按「鎖定這個數字」：' }),
        readout,
        range,
        el('div', { class: 'preset-row' }, presets.map((val) =>
          el('button', {
            class: `preset-chip${this.sliderVal === val ? ' is-picked' : ''}`,
            text: `${val} ${game.unit || ''}`,
            onClick: () => {
              soundFX.playClick();
              this.sliderVal = val;
              range.value = String(val);
              readout.textContent = `${val} ${game.unit || ''}`;
            }
          })
        )),
        el('div', { style: 'display:flex;justify-content:space-between;font-size:13px;color:var(--muted);' }, [
          el('span', { text: `${game.min} ${game.unit || ''}` }),
          el('span', { text: `${game.max} ${game.unit || ''}` })
        ]),
        el('button', {
          class: 'btn-primary',
          text: '鎖定這個數字（Enter）➔',
          onClick: () => {
            const next = submitMiniGame(this.state, this.sliderVal);
            if (next.lastGameOutcome?.correct) soundFX.playMissionPassed();
            else soundFX.playClick();
            this._setState(next);
          }
        })
      ]);
    }

    if (game.type === 'swipe') {
      const cardText = game.cards[this.swipeIndex] || '';
      return el('div', { style: 'display:flex;flex-direction:column;gap:10px;' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:center;' }, [
          el('h3', { style: 'margin:0;font-size:20px;color:var(--gold);', text: game.prompt }),
          el('span', { class: 'pill', text: `第 ${this.swipeIndex + 1}／${game.cards.length} 張` })
        ]),
        el('div', { style: 'font-size:13px;color:var(--cyan);font-weight:700;', text: `📱 像滑手機一樣：點卡片左半或按 ⬅ 代表「${game.left}」，點右半或按 ➡ 代表「${game.right}」` }),
        el('div', {
          class: 'swipe-card',
          style: 'cursor:pointer;',
          onClick: (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const isLeft = (e.clientX - rect.left) < rect.width / 2;
            this._pickSwipe(isLeft ? 'left' : 'right');
          }
        }, cardText),
        el('div', { class: 'swipe-actions' }, [
          el('button', {
            class: 'btn-cyan',
            text: `⬅ ${game.left}（左鍵）`,
            onClick: () => this._pickSwipe('left')
          }),
          el('button', {
            class: 'btn-primary',
            text: `${game.right}（右鍵）➡`,
            onClick: () => this._pickSwipe('right')
          })
        ])
      ]);
    }

    if (game.type === 'multi') {
      return el('div', { style: 'display:flex;flex-direction:column;gap:12px;' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:center;' }, [
          el('h3', { style: 'margin:0;font-size:20px;color:var(--gold);', text: game.prompt }),
          el('span', { class: 'pill', text: `可複選 · 已勾選 ${this.multiSelected.size} 項` })
        ]),
        el('div', { style: 'font-size:13px;color:var(--cyan);font-weight:700;', text: '☑️ 像在會議白板勾重點：可點擊多張卡片（或按 1–4 切換），選好後按「送出複選審計」' }),
        el('div', { class: 'paper-grid' }, game.options.map((opt, idx) =>
          el('button', {
            class: `paper-card${this.multiSelected.has(idx) ? ' is-selected' : ''}`,
            onClick: () => {
              soundFX.playClick();
              if (this.multiSelected.has(idx)) this.multiSelected.delete(idx);
              else this.multiSelected.add(idx);
              this.render();
            }
          }, [
            el('h4', { text: `${this.multiSelected.has(idx) ? '☑ ' : '☐ '}[${idx + 1}] ${opt.title}` }),
            el('div', { style: 'font-size:13px;color:#475569;margin-top:4px;', text: this.multiSelected.has(idx) ? '✓ 已納入通路掌握清單' : '點擊勾選這項' })
          ])
        )),
        el('button', {
          class: 'btn-primary',
          text: '送出複選審計（Enter）➔',
          onClick: () => {
            const next = submitMiniGame(this.state, [...this.multiSelected]);
            if (next.lastGameOutcome?.correct) soundFX.playMissionPassed();
            else soundFX.playClick();
            this._setState(next);
          }
        })
      ]);
    }

    if (game.type === 'stop') {
      const getStopStatusText = (tick) => {
        if (tick < 2) return '🟢 新客比例健康：觀察數據走向，準備在失控前煞車…';
        if (tick <= (game.goodUntilTick ?? 4)) return '🟡 警報將至！報表虛胖、新客開始下跌 — 現在適合按緊急煞車！';
        return '🔴 嚴重警報：演算法只抓老客衝 ROAS！快按緊急煞車！';
      };
      const repEl = el('div', { class: 'stop-val', style: 'color:var(--lime);', text: String(game.report.start + this.stopTick * game.report.perTick) });
      const freshEl = el('div', { class: 'stop-val', style: 'color:var(--danger);', text: `${game.fresh.start + this.stopTick * game.fresh.perTick}${game.fresh.unit}` });
      const tickLabel = el('div', { class: 'pill', text: `第 ${this.stopTick}／${game.ticks} 週` });
      const statusPill = el('div', { class: 'rescue-toast', style: 'padding:8px 12px;font-size:14px;', text: getStopStatusText(this.stopTick) });

      if (!this.stopTimer && !this.stopFinished) {
        this.stopTimer = setInterval(() => {
          this.stopTick += 1;
          repEl.textContent = String(game.report.start + this.stopTick * game.report.perTick);
          freshEl.textContent = `${game.fresh.start + this.stopTick * game.fresh.perTick}${game.fresh.unit}`;
          tickLabel.textContent = `第 ${this.stopTick}／${game.ticks} 週`;
          statusPill.textContent = getStopStatusText(this.stopTick);
          if (this.stopTick >= game.ticks) {
            this._clearStopTimer();
            this.stopFinished = true;
            this._setState(submitMiniGame(this.state, null));
          }
        }, game.intervalMs || 700);
      }

      return el('div', { style: 'display:flex;flex-direction:column;gap:12px;' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:center;' }, [
          el('h3', { style: 'margin:0;font-size:20px;color:var(--gold);', text: game.prompt }),
          tickLabel
        ]),
        statusPill,
        el('div', { class: 'stop-arena' }, [
          el('div', { class: 'stop-metric' }, [
            el('div', { style: 'font-size:13px;color:var(--muted);', text: game.report.label }),
            repEl
          ]),
          el('div', { class: 'stop-metric' }, [
            el('div', { style: 'font-size:13px;color:var(--muted);', text: game.fresh.label }),
            freshEl
          ])
        ]),
        el('button', {
          class: 'btn-primary',
          style: 'font-size:19px;min-height:56px;',
          text: '🚨 按下去！緊急煞車停掉自動優化（Space / Enter）',
          onClick: () => {
            this._clearStopTimer();
            this.stopFinished = true;
            const next = submitMiniGame(this.state, this.stopTick);
            if (next.lastGameOutcome?.correct) soundFX.playMissionPassed();
            else soundFX.playWantedSiren();
            this._setState(next);
          }
        })
      ]);
    }

    return el('div');
  }

  _renderCh6PhoneModal() {
    const ch = getCurrentChapter(this.state);
    const call = ch.grandmaPhoneCall;
    return el('div', { class: 'modal-backdrop' }, [
      el('div', { class: 'modal-box' }, [
        el('div', { style: 'display:flex;align-items:center;gap:14px;' }, [
          el('img', {
            src: './public/images/role-grandma.webp',
            alt: '台灣阿嬤',
            style: 'width:76px;height:76px;border-radius:16px;object-fit:cover;border:2px solid var(--gold);'
          }),
          el('div', {}, [
            el('div', { class: 'gta-kicker', text: 'GRANDMA MOD EASTER EGG · CH6 現場來電' }),
            el('h2', { style: 'margin:6px 0 0 0;color:var(--gold);', text: call.title })
          ])
        ]),
        el('div', { class: 'boss-callout' }, [
          el('div', { text: `「${call.text}」` })
        ]),
        el('div', { class: 'rescue-toast', text: `🍲 ${call.rewardText}` }),
        el('div', { style: 'display:flex;gap:10px;flex-wrap:wrap;' }, [
          el('button', {
            class: 'btn-gold',
            style: 'flex:1 1 auto;',
            text: '謝阿嬤！繼續完成這張文案測試 ➔',
            onClick: () => {
              soundFX.playTatungCooker();
              this.ch6CallModalOpen = false;
              this.ch6CallDismissed = true;
              const next = submitMiniGame(
                { ...this.state, grandmaUnlocked: true },
                this.swipeChoices
              );
              this._setState(next);
            }
          }),
          el('button', {
            class: 'replay-btn',
            'data-voice': 'grandma',
            text: '🔊 重聽阿嬤來電',
            onClick: () => soundFX.speak(call.text, 'grandma', true)
          })
        ])
      ])
    ]);
  }

  _renderScooterModal() {
    const canvas = el('canvas', { class: 'scooter-canvas', width: 640, height: 400 });
    const hudText = el('div', { class: 'pill pill-gold', text: '準備上路！' });

    const modal = el('div', { class: 'modal-backdrop' }, [
      el('div', { class: 'modal-box' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;' }, [
          el('div', {}, [
            el('div', { class: 'gta-kicker', text: 'GRANDMA SCOOTER RUSH · 台北街頭霓虹大暴走' }),
            el('h2', { style: 'margin:4px 0 0 0;', text: SCOOTER_CONFIG.title })
          ]),
          hudText
        ]),
        canvas,
        el('div', { style: 'display:grid;grid-template-columns:1fr 1fr auto;gap:10px;' }, [
          el('button', {
            class: 'btn-cyan',
            text: '⬅ 左切車道 (A / ←)',
            onClick: () => this.scooterInstance && this.scooterInstance.moveLane(-1)
          }),
          el('button', {
            class: 'btn-cyan',
            text: '右切車道 (D / →) ➡',
            onClick: () => this.scooterInstance && this.scooterInstance.moveLane(1)
          }),
          el('button', {
            class: 'btn-ghost',
            text: '結束回公司',
            onClick: () => this._closeScooterModal(false)
          })
        ]),
        el('div', { style: 'font-size:13px;color:var(--muted);', text: '收集：🧋大冰奶、🍲大同電鍋(無敵護盾)、💬真實口碑、🧠People Model ｜ 閃避：🍎RMN毒蘋果、🪦Cookie墓碑、📉假曝光、🥫AI Slop' })
      ])
    ]);

    requestAnimationFrame(() => {
      if (!this.scooterModalOpen || this.scooterInstance) return;
      this.scooterInstance = new GrandmaScooterGame(canvas, SCOOTER_CONFIG, {
        onEvent: (kind) => {
          if (kind === 'lane') soundFX.playScooterHorn();
          else if (kind === 'good') soundFX.playPickup(true);
          else soundFX.playPickup(false);
        },
        onHudUpdate: (h) => {
          hudText.textContent = `⏱ ${h.timeLeft}s · 💰 ${h.score}分 · ❤️ ${'❤️'.repeat(h.hp)}${h.shield ? ' · 🍲電鍋護盾' : ''}`;
        },
        onFinish: (result) => {
          soundFX.playTatungCooker();
          this.scooterInstance = null;
          this.scooterModalOpen = false;
          this._restoreStation();
          this._setState(completeScooterRun(this.state, result));
        }
      });
      this.scooterInstance.start();
    });

    return modal;
  }

  _renderStreetViewModal() {
    const ch = getCurrentChapter(this.state);
    const gm = ch.googleMap || {};
    const live = this.resolvedPanoInfo[ch.id];
    const hasKey = Boolean(this._getMapsApiKey());

    const statusBadge = live
      ? `🟢 Google Maps API (.env.map) 已連線 · Pano ${live.panoId} (${live.desc})`
      : (hasKey
        ? `🟢 .env.map 金鑰已載入 · Pano ${gm.panoId || ''}`
        : `📍 官方 Google 360° 街景 · Pano ${gm.panoId || ''}`);

    let viewportNode;
    if (this.svModalMode === 'jsapi' && hasKey) {
      const host = el('div', { class: 'scene-gmap-iframe', style: 'min-height:360px;height:52dvh;background:#0d1424;' });
      requestAnimationFrame(() => this._mountJsStreetView(host, ch));
      viewportNode = host;
    } else {
      viewportNode = el('iframe', {
        class: 'scene-gmap-iframe',
        style: 'min-height:360px;height:52dvh;',
        src: this._build360EmbedUrl({ ...gm, panoId: live?.panoId || gm.panoId }),
        title: `Google Maps 360° 全景街景：${ch.location}`,
        allowfullscreen: 'true',
        loading: 'lazy',
        referrerpolicy: 'no-referrer-when-downgrade'
      });
    }

    return el('div', { class: 'modal-backdrop' }, [
      el('div', { class: 'modal-box', style: 'width:min(880px,100%);' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;' }, [
          el('div', {}, [
            el('div', { class: 'gta-kicker', text: `GOOGLE STREET VIEW 360° · ${gm.roadSign || ch.location}` }),
            el('h2', { style: 'margin:4px 0 0 0;font-size:20px;', text: `第 ${ch.id} 站實地踩點：${ch.location}` })
          ]),
          el('div', { style: 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;' }, [
            el('button', {
              class: `mode-chip${this.svModalMode === 'embed' ? ' is-active' : ''}`,
              style: 'min-height:34px;padding:4px 10px;font-size:12px;',
              text: '🌐 360° 全彩街景',
              onClick: () => { soundFX.playClick(); this.svModalMode = 'embed'; this.render(); }
            }),
            hasKey
              ? el('button', {
                  class: `mode-chip${this.svModalMode === 'jsapi' ? ' is-active' : ''}`,
                  style: 'min-height:34px;padding:4px 10px;font-size:12px;',
                  text: '🔑 JS API 街景',
                  onClick: () => { soundFX.playClick(); this.svModalMode = 'jsapi'; this.render(); }
                })
              : null,
            el('button', {
              class: 'btn-ghost',
              style: 'min-height:36px;',
              text: '✕ 關閉 (Esc)',
              onClick: () => {
                soundFX.playClick();
                this.streetViewModalOpen = false;
                this.render();
              }
            })
          ])
        ]),
        el('div', { style: 'font-size:12px;color:var(--cyan);font-weight:700;', text: statusBadge }),
        el('div', { class: 'cutscene-stage-wrap', style: 'max-height:54dvh;border-width:6px;' }, [viewportNode]),
        el('div', { style: 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;' }, [
          el('span', { style: 'font-size:12.5px;color:var(--muted);', text: '👆 可用滑鼠／手指 360° 旋轉環顧四周，或點擊路面箭頭沿松仁路實境前進！' }),
          gm.streetViewUrl
            ? el('a', {
                class: 'btn-cyan',
                style: 'min-height:36px;padding:6px 14px;font-size:13px;text-decoration:none;display:inline-flex;align-items:center;',
                href: gm.streetViewUrl,
                target: '_blank',
                rel: 'noopener noreferrer',
                text: '↗ 在 Google 地圖全螢幕開啟'
              })
            : null
        ])
      ])
    ]);
  }

  _renderReview() {
    const persona = determinePersona(this.state);
    const role = getRole(this.state.roleId);
    const s = this.state.stats;
    const grandmaQuote = ROLES.find((r) => r.id === 'grandma')?.quote || '做生意跟煮飯一樣，火候到了，客人自己會來。';

    return el('section', { class: 'panel review-stage' }, [
      el('div', { class: 'chapter-header review-head' }, [
        el('div', {}, [
          el('div', { class: 'gta-kicker', text: `MISSION PASSED · ${ROLE_ROUTE_META[role.id]?.routeName || role.name} 考績結算` }),
          el('h1', { class: 'gta-title', style: 'font-size:clamp(26px,2.8vw,40px);margin-top:6px;', text: persona.name }),
          el('p', { style: 'margin:4px 0 0 0;font-size:16px;color:var(--gold);', text: persona.title })
        ]),
        el('div', { class: 'review-right-head' }, [
          htmlNode('review-stamp', SVG_TEMPLE_STAMP_PASSED),
          el('div', { class: 'score-pill', style: 'font-size:20px;padding:8px 14px;', text: `總積分 $${this.state.points.toLocaleString()}` })
        ])
      ]),
      el('div', { class: 'review-top-grid' }, [
        el('div', { class: 'panel', style: 'border-color:var(--cyan);' }, [
          el('div', { style: 'display:flex;align-items:center;gap:12px;margin-bottom:8px;' }, [
            el('img', { src: role.image, alt: role.name, class: 'hud-avatar' }),
            el('div', {}, [
              el('div', { style: 'font-weight:800;font-size:17px;', text: role.name }),
              el('div', { style: 'font-size:13px;color:var(--muted);', text: `答對小互動 ${this.state.gamesCorrectCount}／${this.state.gamesScoredCount} · 阿嬤救援 ${this.state.grandmaRescues} 次` })
            ])
          ]),
          el('p', { style: 'margin:4px 0;', text: `✅ 強項：${persona.strength}` }),
          el('p', { style: 'margin:4px 0;', text: `⚠️ 盲點：${persona.blind}` }),
          el('p', { style: 'color:var(--cyan);font-size:13.5px;margin:4px 0 0;', text: `📖 推薦延伸閱讀：${persona.read}` })
        ]),
        el('div', { class: 'panel' }, [
          el('h3', { style: 'margin:0 0 8px 0;font-size:16px;', text: '五維能力最終數值' }),
          ...[
            ['🔥 肝指數 (Stamina)', s.stamina],
            ['🎤 嘴砲力 (Street Cred)', s.streetCred],
            ['📈 真實增量 (Real Lift)', s.realLift],
            ['🛡️ 品牌信任 (Brand Trust)', s.brandTrust],
            ['⚖️ 人類衡斷力 (Judgment)', s.judgment]
          ].map(([k, v]) => el('div', { style: 'display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:14px;' }, [
            el('span', { text: k }),
            el('strong', { style: 'color:var(--gold);', text: String(v) })
          ]))
        ])
      ]),
      el('div', { class: 'panel' }, [
        el('h3', { style: 'margin:0 0 8px 0;font-size:16px;', text: `${role.name}・今日 10 大專屬行程決策戰報` }),
        el('div', { class: 'review-history-grid' }, this.state.history.map((h) =>
          el('div', { style: 'padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.05);font-size:12.5px;' }, [
            el('div', { style: 'font-weight:800;color:var(--cyan);', text: `${h.year} · ${h.timeSlot ? `${h.timeSlot} · ` : ''}${h.title}` }),
            h.location ? el('div', { style: 'font-size:11.5px;color:var(--muted);margin-bottom:2px;', text: `📍 ${h.location}` }) : null,
            el('div', { text: `回覆：${h.replyText}` }),
            el('div', { style: 'color:var(--gold);', text: `${h.correct ? '✓ 識破' : '• 參與'} · +$${h.pointsEarned.toLocaleString()}` })
          ])
        ))
      ]),
      el('div', { class: 'review-actions', style: 'display:flex;flex-wrap:wrap;gap:10px;' }, [
        el('button', {
          class: 'btn-primary',
          text: '換個電通職能體驗不同行程 ↻',
          onClick: () => this._resetGame()
        }),
        el('button', {
          class: 'btn-gold',
          text: '👵 騎阿嬤電動車破紀錄',
          onClick: () => this._openScooterModal()
        }),
        el('button', {
          class: 'btn-cyan',
          'data-voice': 'grandma',
          text: '🔊 聽台灣阿嬤收工祝福',
          onClick: () => soundFX.speak(grandmaQuote, 'grandma', true)
        })
      ])
    ]);
  }

  _renderBottomGuideBar() {
    let text = '點選畫面按鈕操作；隨時可按鍵盤或點擊下方快捷指令。';
    const actions = [];

    if (this.streetViewModalOpen) {
      text = '🌐 操作指示：正在瀏覽 360° Google 真實街景！拖曳畫面旋轉視角看富邦 A25 與陶朱隱園，按「關閉視窗」或 Esc 回到任務。';
      actions.push(
        el('button', {
          class: 'guide-btn is-primary',
          text: '✕ 關閉 360° 街景回任務 (Esc)',
          onClick: () => {
            this.streetViewModalOpen = false;
            this.render();
          }
        })
      );
    } else if (this.scooterModalOpen) {
      text = '🛵 操作指示：點畫面左／右半邊、按 A / D（或 ← / →）切換三條車道！撿 🧋大冰奶 / 🍲大同電鍋，閃開 🍎RMN毒蘋果！';
      actions.push(
        el('button', { class: 'guide-btn', text: '⬅ 左切', onClick: () => this.scooterInstance && this.scooterInstance.moveLane(-1) }),
        el('button', { class: 'guide-btn', text: '右切 ➡', onClick: () => this.scooterInstance && this.scooterInstance.moveLane(1) }),
        el('button', { class: 'guide-btn is-primary', text: '結束回公司', onClick: () => this._closeScooterModal(false) })
      );
    } else if (this.ch6CallModalOpen) {
      text = '☎️ 操作指示：阿嬤緊急來電提醒中！點擊按鈕收下阿嬤的大同電鍋加持並繼續測驗。';
      actions.push(
        el('button', {
          class: 'guide-btn is-primary',
          text: '🍲 謝阿嬤繼續 ➔',
          onClick: () => {
            soundFX.playTatungCooker();
            this.ch6CallModalOpen = false;
            this.ch6CallDismissed = true;
            const next = submitMiniGame({ ...this.state, grandmaUnlocked: true }, this.swipeChoices);
            this._setState(next);
          }
        })
      );
    } else if (this.state.phase === 'title') {
      text = '👋 第一次玩？直接點上方粉色「開始遊戲」即可出發，不需要先輸入車牌喔！';
      actions.push(
        el('button', {
          class: 'guide-btn',
          text: '🧭 30 秒新手導覽',
          onClick: (e) => this._openWelcomeTour(0, e.currentTarget)
        })
      );
    } else if (this.state.phase === 'role') {
      text = '🪪 操作指示：直接點擊任一張角色識別證就能出發！不確定選誰可以挑「⭐ 新手推薦」那張。';
      actions.push(
        el('button', {
          class: 'guide-btn',
          text: '🧭 介面導覽',
          onClick: (e) => this._startHudTour('role', e.currentTarget)
        }),
        el('button', {
          class: 'guide-btn',
          text: this.state.grandmaUnlocked ? '✓ 阿嬤已解鎖' : '👵 一鍵解鎖 AMA666',
          onClick: () => this._triggerCheatCode(true)
        }),
        el('button', {
          class: 'guide-btn',
          text: '← 回封面',
          onClick: () => this._setState({ ...this.state, phase: 'title' })
        })
      );
    } else if (this.state.phase === 'cutscene') {
      text = '🎬 影片播放中：看完或隨時點右上角「⏭️ 跳過動畫，直接開始玩」（或按空白鍵 Space）進入選題！';
      actions.push(
        el('button', {
          class: 'guide-btn is-primary',
          text: '⏭️ 跳過動畫直接玩 (Space) ➔',
          onClick: () => this._leaveCutscene()
        })
      );
    } else if (this.state.phase === 'scene') {
      const role = getRole(this.state.roleId);
      text = '👉 右邊操作區：看完 LINE 危機後點右側 1–4 任一個回覆即可推進；卡關再看左邊線索或手機！';
      actions.push(
        el('button', {
          class: 'guide-btn',
          text: '🧭 介面導覽',
          onClick: (e) => this._startHudTour('scene', e.currentTarget)
        }),
        el('button', { class: 'guide-btn', text: '💡 問同事讀心術', onClick: () => this._focusHelper('phone', 'people', 'lisa') }),
        el('button', { class: 'guide-btn', text: '👵 阿嬤翻譯', onClick: () => this._focusHelper('phone', 'grandma') }),
        el('button', {
          class: 'guide-btn is-primary',
          disabled: this.state.roleSpecialUsedThisChapter,
          text: this.state.roleSpecialUsedThisChapter ? `✓ 已用${role.specialName}` : `⚡ ${role.specialName}`,
          onClick: () => {
            soundFX.playMissionPassed();
            this._setState(useRoleSpecial(this.state));
          }
        })
      );
    } else if (this.state.phase === 'game') {
      const ch = getCurrentChapter(this.state);
      const g = ch.game;
      if (g?.type === 'pick' || g?.type === 'agent') {
        text = '📄 右區題目引導：點擊右側任一選項卡片（或按鍵盤 1–4）立即拍板送出！';
      } else if (g?.type === 'slider') {
        text = '🎛️ 右區題目引導：拖曳滑桿或點快速刻度按鈕，最後按「鎖定這個數字」(Enter)！';
      } else if (g?.type === 'swipe') {
        text = `👆 右區題目引導：點選卡片左／右半或按 ⬅ / ➡ 完成 ${g.cards.length} 題實測！`;
      } else if (g?.type === 'multi') {
        text = '☑️ 右區題目引導：點擊多張卡片（或按 1–4）勾選項目後按「送出複選審計」(Enter)！';
      } else if (g?.type === 'stop') {
        text = '🚨 右區題目引導：緊盯新客比例下跌紅線！抓準時機按紅色「緊急煞車」(Space / Enter)！';
      }
      actions.push(
        el('button', { class: 'guide-btn', text: '🕵️ 看桌上線索', onClick: () => this._focusHelper('clue') }),
        el('button', { class: 'guide-btn', text: '💡 問同事', onClick: () => this._focusHelper('phone', 'people', 'cindy') }),
        el('button', { class: 'guide-btn', text: '👵 叫阿嬤', onClick: () => this._triggerCheatCode(true) })
      );
    } else if (this.state.phase === 'reveal') {
      const hasNext = this.state.chapterIndex < CHAPTERS.length - 1;
      text = hasNext
        ? `📌 操作指示：帶走這題的《決策智慧》金句，點擊「進入下一時段」(或按 Space / Enter) 繼續闖關，也可以先騎阿嬤買菜車衝分！`
        : '🏁 操作指示：恭喜完成 10 個松仁路富邦 A25 時段！點擊「查看終局考績」(或按 Space / Enter) 領取稱號！';
      actions.push(
        el('button', { class: 'guide-btn', text: '🛵 騎買菜車加分', onClick: () => this._openScooterModal() }),
        el('button', {
          class: 'guide-btn is-primary',
          text: hasNext ? '進入下一時段 ➔' : '查看終局考績 ➔',
          onClick: () => {
            soundFX.playClick();
            this._setState(advanceChapter(this.state));
          }
        })
      );
    } else if (this.state.phase === 'review') {
      text = '🏆 操作指示：已結算你的《決策智慧》十年戰績！可換其他電通職能（或解鎖阿嬤 AMA666）體驗全新對話與結局！';
      actions.push(
        el('button', { class: 'guide-btn', text: '👵 騎買菜車破紀錄', onClick: () => this._openScooterModal() }),
        el('button', { class: 'guide-btn is-primary', text: '↻ 換個職能重玩', onClick: () => this._resetGame() })
      );
    }

    return el('div', { class: 'bottom-guide-bar', role: 'region', 'aria-label': '下方即時操作指示' }, [
      el('div', { class: 'guide-main' }, [
        el('span', { class: 'guide-badge', text: '🧭 操作指示' }),
        el('span', { class: 'guide-text', text })
      ]),
      el('div', { class: 'guide-actions' }, actions)
    ]);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('app');
  if (root) {
    window.__gtaApp = new GtaDentsuApp(root);
  }
});
