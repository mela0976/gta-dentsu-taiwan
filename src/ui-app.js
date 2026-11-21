// 主介面控制器：GTA 6 × 台灣街頭工藝《決策智慧：電通台灣一日風雲》（Diegetic Game HUD）
import { PEOPLE_MODEL_TWINS, CHAPTERS } from './story-data.js';
import {
  initLang,
  getLang,
  setLang,
  t,
  getUiStrings,
  getCutsceneUrl,
  getLocalizedRoles,
  getLocalizedTwins,
  getLocalizedGrandmaQuips,
  getLocalizedGta6Analysis,
  getLocalizedScooterConfig,
  getLocalizedRouteMeta,
  getFsdLines,
  getCutsceneGrandmaLine,
  getLocalizedChapterForRole
} from './i18n.js';
import {
  CHEAT_CODE,
  createInitialState,
  getRole,
  getCurrentChapter,
  selectRole,
  finishCutscene,
  activateGrandmaCheat,
  consultTwin,
  useRoleSpecial,
  chooseReply,
  evaluateMiniGame,
  submitMiniGame,
  completeScooterRun,
  advanceChapter,
  determinePersona
} from './game-engine.js';
import { GrandmaScooterGame } from './scooter-minigame.js';
import { RADIO_STATIONS, soundFX } from './audio-fx.js';
import { gameAssetUrl } from './game-assets.js';
import {
  SVG_GTA_TAIWAN_CREST,
  SVG_IRON_GRILLE_CORNER,
  getTempleStampSvg,
  getIfruitChassisSvg,
  getRadarCompassRingSvg,
  SVG_ROAD_SIGN_BADGE,
  getStatIconSvg,
  getTeslaFsdOverlaySvg,
  getFubonA25BlueprintSvg
} from './ui-graphics.js';
import {
  META_STORAGE_KEY,
  AUDIO_PREFS_KEY,
  ACHIEVEMENT_IDS,
  createEmptyMeta,
  mergeCareerRecords,
  sanitizeLoadedState,
  computeStatDeltas,
  updateCareerMeta,
  buildShareSummaryText,
  renderResultCardCanvas
} from './launch-kit.js';
import {
  readHardwareFoldState,
  observeViewportLayout
} from './responsive-layout.js';

const STORAGE_KEY = 'gta_dentsu_taiwan_v2';
const LEGACY_STORAGE_KEY = 'gta_dentsu_taiwan_v1';
const LEGACY_META_KEY = 'gta_dentsu_meta_v1';

function readLegacySave() {
  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  try {
    const saved = JSON.parse(raw);
    return saved?.stats && saved?.phase ? raw : null;
  } catch {
    return null;
  }
}

function loadCampaign() {
  const current = localStorage.getItem(STORAGE_KEY);
  const legacy = readLegacySave();
  if (legacy === null) return { raw: current, snapshot: current };

  const baselineKey = `${STORAGE_KEY}_legacy_import`;
  if (current === null || current === legacy) {
    let snapshot = current;
    try {
      if (current === null) {
        localStorage.setItem(STORAGE_KEY, legacy);
        snapshot = legacy;
      }
      localStorage.setItem(baselineKey, legacy);
    } catch {
      // The readable legacy save remains available when there is no space to copy it.
    }
    return { raw: legacy, snapshot };
  }

  if (legacy === localStorage.getItem(baselineKey)) return { raw: current, snapshot: current };
  const useLegacy = window.confirm(t('launch.legacySaveChoice'));
  let snapshot = localStorage.getItem(STORAGE_KEY);
  try {
    if (useLegacy && snapshot !== legacy) {
      if (snapshot !== null) {
        const backupId = crypto.randomUUID();
        localStorage.setItem(`${STORAGE_KEY}_backup_${backupId}`, snapshot);
      }
      localStorage.setItem(STORAGE_KEY, legacy);
      snapshot = legacy;
    }
    localStorage.setItem(baselineKey, legacy);
  } catch {
    // Keep the existing campaign if its backup or the replacement could not be written.
  }
  return { raw: snapshot, snapshot };
}

function readCareerRecord(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

const TOUR_STORAGE_KEY = 'gta_dentsu_tour_done_v1';
const BEGINNER_TIP_STORAGE_KEY = 'gta_dentsu_beginner_tip_v1';

const getWelcomeSlides = () => getUiStrings(getLang()).welcomeSlides || [];
const getHudTourSteps = () => getUiStrings(getLang()).hudTourSteps || [];
const getHudStats = () => getUiStrings(getLang()).hudStats || [];

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
    else if (k === 'src' || k === 'poster') node.setAttribute(k, gameAssetUrl(v));
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
    initLang();
    soundFX.setLang(getLang());
    const audioPrefs = this._loadAudioPrefs();
    this.muted = Boolean(audioPrefs.muted);
    soundFX.setMuted(this.muted);
    soundFX.setVoiceEnabled(audioPrefs.voiceEnabled !== false);
    soundFX.stationIndex = Number(audioPrefs.stationIndex || 0);
    this.careerMeta = this._loadMeta();
    this.state = this._loadState();
    this.phoneTab = 'line'; // 'line' | 'people' | 'grandma' | 'gta6'
    this.scooterModalOpen = false;
    this.scooterInstance = null;
    this.ch6CallModalOpen = false;
    const swipeDraft = this.state.phase === 'game' && this.state.swipeDraft;
    this.ch6CallDismissed = Boolean(swipeDraft?.callAccepted);
    this.activeCutsceneSrc = null;

    // 暫存小互動即時狀態
    this.sliderVal = null;
    this.swipeChoices = Array.isArray(swipeDraft?.choices)
      ? swipeDraft.choices.filter(side => side === 'left' || side === 'right').slice(0, 3)
      : [];
    this.swipeIndex = this.swipeChoices.length;
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
    this.mobileHudExpanded = false;
    this.mobilePanel = 'mission'; // 'mission' | 'scene' | 'phone' | 'intel'
    this.lastStatDeltas = [];
    this.restartDialogOpen = false;
    this._pendingToasts = [];
    this._toastTimers = new WeakMap();
    this._copyTimers = new WeakMap();
    this._lastCopyMessage = '';
    this._lastToastTrigger = null;

    // 全螢幕動態場景氛圍背景（放在 #app 之外，render 時只換圖）
    this.backdrop = el('div', { class: 'ambient-backdrop', 'aria-hidden': 'true' });
    this.veil = el('div', { class: 'ambient-veil', 'aria-hidden': 'true' });
    document.body.prepend(this.veil);
    document.body.prepend(this.backdrop);
    this._mountTourOverlays();
    this._bindGlobalLaunchListeners();
    this.layout = readHardwareFoldState(window, navigator);
    this._layoutObserver = observeViewportLayout(window, document, navigator, (nextLayout, prevLayout) => {
      this._handleLayoutChange(nextLayout, prevLayout);
    });

    soundFX.onVoiceChange = () => this._syncVoiceIndicator();
    const startAudio = () => {
      if (this.muted) return;
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

  _handleLayoutChange(nextLayout, prevLayout) {
    this.layout = nextLayout;
    if (!nextLayout.useCompactHud) {
      this.mobileHudExpanded = false;
    }
    this._relayoutToasts();
    const activeTag = document.activeElement?.tagName?.toUpperCase() || '';
    const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA';
    const structureChanged = !prevLayout
      || nextLayout.useMobileTabs !== prevLayout.useMobileTabs
      || nextLayout.useCompactHud !== prevLayout.useCompactHud
      || nextLayout.mode !== prevLayout.mode;
    if (!isTyping && structureChanged && !this.scooterModalOpen) {
      this.render();
      return;
    }
    if (this.tourActive) {
      this._syncHudTourOverlay();
    }
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

  _switchLang(nextLang) {
    const lang = setLang(nextLang);
    soundFX.setLang(lang);
    this.activeCutsceneSrc = this.activeCutsceneSrc ? getCutsceneUrl(this.activeCutsceneSrc, lang) : null;
    if (this.toastRegion) this.toastRegion.setAttribute('aria-label', t('launch.toastRegionAria'));
    if (this.srToastContext) this.srToastContext.textContent = t('launch.toastRegionAria');
    if (this.srLiveRegion) this.srLiveRegion.textContent = '';
    this.state = this._localizeProgress(this.state, lang);
    this.render();
    if (this.welcomeDialogOpen) {
      this._renderWelcomeDialog();
    }
  }

  _localizeProgress(state, lang) {
    if (!state.roleId) return state;
    const ch = getCurrentChapter(state);
    const nextState = { ...state };
    if (state.activeReply && Array.isArray(ch.replies)) {
      const matchedReply = ch.replies.find((r) => r.id === state.activeReply.id) || ch.replies[0];
      nextState.activeReply = matchedReply;
      if (state.lastGameOutcome) {
        if (ch.game && state.lastGameOutcome.submission !== undefined) {
          const reval = evaluateMiniGame(ch.game, state.lastGameOutcome.submission);
          if (reval.correct === state.lastGameOutcome.correct && reval.ratio === state.lastGameOutcome.ratio) {
            nextState.lastGameOutcome = { ...state.lastGameOutcome, detail: reval.detail };
          }
        } else if (!ch.game || ch.finale) {
          nextState.lastGameOutcome = { ...state.lastGameOutcome, detail: matchedReply.feedback };
        }
      }
    }
    if (state.lastRescueMessage) {
      if (state.lastRescueIndex !== null && state.lastRescueIndex !== undefined) {
        const quips = getLocalizedGrandmaQuips(lang);
        const line = quips.rescueLines[state.lastRescueIndex % quips.rescueLines.length];
        nextState.lastRescueMessage = `${quips.rescueTitle} ${line}`;
      } else {
        nextState.lastRescueMessage = t('engine.cheatUnlockOnly');
      }
    }
    return nextState;
  }

  _renderLangSwitch(compact = false) {
    const active = getLang();
    const ui = getUiStrings(active);
    const names = (compact ? ui.langShort : ui.langNames) || { zh: '繁中', en: 'EN', ja: '日本語' };
    return el('div', {
      class: `lang-switch${compact ? ' is-hud' : ''}`,
      role: 'group',
      'aria-label': t('langSwitchLabel')
    }, ['zh', 'en', 'ja'].map((code) =>
      el('button', {
        type: 'button',
        class: `lang-btn${active === code ? ' is-active' : ''}`,
        'data-lang': code,
        'aria-pressed': String(active === code),
        text: names[code],
        onClick: (e) => {
          e.stopPropagation();
          soundFX.playClick();
          if (active !== code) this._switchLang(code);
        }
      })
    ));
  }

  _voiceBtnLabel() {
    return soundFX.voiceEnabled ? t('hud.voiceOn') : t('hud.voiceOff');
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
    this.backdrop.style.backgroundImage = `url("${gameAssetUrl(img)}")`;
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
      const { raw, snapshot } = loadCampaign();
      this.savedStateSnapshot = snapshot;
      if (!raw) return createInitialState();
      const parsed = JSON.parse(raw);
      return this._localizeProgress(sanitizeLoadedState(parsed, createInitialState, CHAPTERS.length), getLang());
    } catch {
      return createInitialState();
    }
  }

  _loadMeta() {
    const current = readCareerRecord(META_STORAGE_KEY) || this.careerMeta || createEmptyMeta();
    return mergeCareerRecords(current, readCareerRecord(LEGACY_META_KEY));
  }

  _saveMeta() {
    try {
      localStorage.setItem(META_STORAGE_KEY, JSON.stringify(this.careerMeta));
    } catch {}
  }

  _loadAudioPrefs() {
    try {
      const raw = localStorage.getItem(AUDIO_PREFS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  _saveAudioPrefs() {
    try {
      localStorage.setItem(AUDIO_PREFS_KEY, JSON.stringify({
        muted: Boolean(this.muted),
        voiceEnabled: Boolean(soundFX.voiceEnabled),
        stationIndex: Number(soundFX.stationIndex || 0)
      }));
    } catch {}
  }

  _bindGlobalLaunchListeners() {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        soundFX.pauseForBackground();
        document.querySelectorAll('.cutscene-video').forEach((v) => {
          try { if (!v.paused) v.pause(); } catch {}
        });
        if (this.scooterInstance) this.scooterInstance.pause();
        this._clearStopTimer();
      } else {
        soundFX.resumeFromBackground();
        if (this.scooterInstance) this.scooterInstance.resume();
        const ch = getCurrentChapter(this.state);
        if (this.state.phase === 'game' && ch?.game?.type === 'stop' && !this.stopFinished && !this.stopTimer) {
          this.render();
        }
      }
    });
    window.addEventListener('pagehide', () => soundFX.pauseForBackground());

    const dispatchCopy = (button, target, cmd) => {
      if (button && target) this._handleCopyCommand(button, target, cmd);
    };
    document.addEventListener('command', (event) => {
      if (typeof event.command === 'string' && event.command.startsWith('--copy')) {
        dispatchCopy(event.source, event.target, event.command);
      }
    }, true);
    if (!('CommandEvent' in window)) {
      document.addEventListener('click', (event) => {
        const button = event.target?.closest?.('button[command^="--copy"]');
        if (!button) return;
        const target = document.getElementById(button.getAttribute('commandfor') || '');
        if (target) dispatchCopy(button, target, button.getAttribute('command'));
      });
    }
  }

  _legacyCopyText(text) {
    const field = Object.assign(document.createElement('textarea'), { value: text });
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0';
    document.body.append(field);
    field.select();
    try { return document.execCommand('copy'); } catch { return false; } finally { field.remove(); }
  }

  async _handleCopyCommand(button, target) {
    const text = target.matches('input, textarea') ? target.value : (target.innerText || target.textContent || '').trim();
    if (!text) return;
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      } else {
        ok = this._legacyCopyText(text);
      }
    } catch {
      ok = this._legacyCopyText(text);
    }

    const tip = button.nextElementSibling;
    if (!tip) return;
    clearTimeout(this._copyTimers.get(button));
    button.removeAttribute('data-copied');
    button.removeAttribute('data-failed');
    let msg = ok ? t('launch.copiedOk') : t('launch.copiedFail');
    if (msg === this._lastCopyMessage) msg += '\u00A0';
    this._lastCopyMessage = msg;
    tip.textContent = '';
    void button.offsetWidth;
    button.setAttribute(ok ? 'data-copied' : 'data-failed', '');
    requestAnimationFrame(() => { tip.textContent = msg; });
    this._copyTimers.set(button, setTimeout(() => {
      button.removeAttribute('data-copied');
      button.removeAttribute('data-failed');
      tip.textContent = '';
    }, 2200));
  }

  _isAnyModalOpen() {
    return Boolean(
      this.welcomeDialogOpen
      || this.restartDialogOpen
      || this.scooterModalOpen
      || this.streetViewModalOpen
      || this.ch6CallModalOpen
    );
  }

  _relayoutToasts() {
    if (!this.toastRegion) return;
    [...this.toastRegion.children].forEach((node, idx) => {
      node.style.setProperty('--toast-idx', String(idx));
    });
  }

  _dismissToast(toast, restoreFocus = false) {
    if (!toast || !toast.isConnected) return;
    clearTimeout(this._toastTimers.get(toast));
    try {
      if (typeof toast.hidePopover === 'function' && toast.matches(':popover-open')) {
        toast.hidePopover();
      }
    } catch {}
    toast.removeAttribute('open');
    const nextToast = [...(this.toastRegion?.children || [])].find((n) => n !== toast && n.classList?.contains('app-toast'));
    toast.remove();
    this._relayoutToasts();
    if (restoreFocus) {
      if (nextToast) {
        nextToast.querySelector('.toast-close')?.focus();
      } else if (this._lastToastTrigger?.isConnected) {
        this._lastToastTrigger.focus();
      }
    }
  }

  _drainPendingToasts() {
    if (this._isAnyModalOpen() || !this._pendingToasts.length) return;
    const queued = this._pendingToasts.splice(0, 3);
    queued.forEach((item) => this._showToast(item.message, item.kind, item.durationMs));
  }

  _showToast(message, kind = 'info', durationMs = 3600) {
    if (typeof document === 'undefined' || !this.toastRegion || !message) return;
    if (this._isAnyModalOpen()) {
      this._pendingToasts.push({ message, kind, durationMs });
      return;
    }
    this._lastToastTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    while (this.toastRegion.children.length >= 3) {
      this._dismissToast(this.toastRegion.firstElementChild, false);
    }

    const toastId = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const closeBtn = el('button', {
      type: 'button',
      class: 'toast-close',
      popovertarget: toastId,
      popovertargetaction: 'hide',
      'aria-label': t('launch.toastClose'),
      text: '✕',
      onClick: () => this._dismissToast(toast, true)
    });
    const toast = el('div', {
      id: toastId,
      popover: 'manual',
      class: `app-toast is-${kind}`,
      role: 'status'
    }, [
      el('span', { class: 'toast-msg', text: message }),
      closeBtn
    ]);
    this.toastRegion.appendChild(toast);
    this._relayoutToasts();

    try {
      if (typeof toast.showPopover === 'function') toast.showPopover();
      else toast.setAttribute('open', '');
    } catch {
      toast.setAttribute('open', '');
    }

    try {
      if (typeof document.ariaNotify === 'function') {
        document.ariaNotify(message);
      } else if (this.srLiveRegion) {
        this.srLiveRegion.textContent = '';
        requestAnimationFrame(() => { if (this.srLiveRegion) this.srLiveRegion.textContent = message; });
      }
    } catch {}

    const scheduleHide = () => {
      clearTimeout(this._toastTimers.get(toast));
      this._toastTimers.set(toast, setTimeout(() => {
        if (!toast.isConnected) return;
        if (toast.matches(':focus-within')) {
          scheduleHide();
          return;
        }
        this._dismissToast(toast, false);
      }, durationMs));
    };
    toast.addEventListener('focusout', () => scheduleHide());
    scheduleHide();
  }

  _openRestartConfirm() {
    soundFX.playClick();
    if (!this.confirmRestartDialog) {
      this._resetGame();
      return;
    }
    this.restartDialogOpen = true;
    const dlg = this.confirmRestartDialog;
    dlg.innerHTML = '';
    const cancelBtn = el('button', {
      type: 'button',
      class: 'btn-ghost',
      text: t('launch.restartCancelBtn'),
      onClick: () => dlg.close('cancel')
    });
    const confirmBtn = el('button', {
      type: 'button',
      class: 'btn-primary',
      text: t('launch.restartConfirmBtn'),
      onClick: () => {
        dlg.close('confirm');
        this._resetGame();
      }
    });
    dlg.appendChild(el('div', { class: 'confirm-modal-inner' }, [
      el('div', { class: 'gta-kicker', text: t('hud.restartBtn') }),
      el('h2', { id: 'confirm-restart-title', style: 'margin:0;color:var(--gold);font-size:20px;', text: t('launch.restartDialogTitle') }),
      el('p', { style: 'margin:0;font-size:14.5px;color:#efeafd;', text: t('launch.restartDialogBody') }),
      el('div', { style: 'display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:6px;' }, [cancelBtn, confirmBtn])
    ]));
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
  }

  _saveState(next) {
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      if (this.savedStateSnapshot !== undefined && current !== this.savedStateSnapshot) {
        window.alert(t('launch.newerSaveNotice'));
        window.location.reload();
        return false;
      }
      const snapshot = JSON.stringify(next);
      localStorage.setItem(STORAGE_KEY, snapshot);
      this.savedStateSnapshot = snapshot;
    } catch {
      // Keep the current session playable when storage is unavailable.
    }
    return true;
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
        this._drainPendingToasts();
      });
      document.body.appendChild(dlg);
      this.welcomeDialog = dlg;
    }

    if (!this.confirmRestartDialog) {
      const cDlg = document.createElement('dialog');
      cDlg.className = 'confirm-modal';
      cDlg.setAttribute('aria-labelledby', 'confirm-restart-title');
      cDlg.setAttribute('closedby', 'any');
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        const outside = (e) => {
          const r = cDlg.getBoundingClientRect();
          return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        };
        let pressedOutside = false;
        cDlg.addEventListener('pointerdown', (e) => { pressedOutside = outside(e); });
        cDlg.addEventListener('pointerup', (e) => { if (pressedOutside && outside(e)) cDlg.close(); });
      }
      cDlg.addEventListener('close', () => {
        cDlg.returnValue = '';
        this.restartDialogOpen = false;
        this._drainPendingToasts();
      });
      document.body.appendChild(cDlg);
      this.confirmRestartDialog = cDlg;
    }

    if (!this.toastRegion) {
      const srCtx = el('p', { id: 'sr-toast-context', class: 'sr-only', text: t('launch.toastRegionAria') });
      const srLive = el('div', { id: 'sr-live-region', class: 'sr-only', 'aria-live': 'polite' });
      const region = el('div', {
        id: 'toast-region',
        class: 'toast-region',
        role: 'region',
        'aria-label': t('launch.toastRegionAria')
      });
      document.body.append(srCtx, srLive, region);
      this.srToastContext = srCtx;
      this.srLiveRegion = srLive;
      this.toastRegion = region;
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
    const slides = getWelcomeSlides();
    this._tourInvokerEl = invokerEl || document.activeElement;
    this.welcomeSlide = Math.max(0, Math.min(slides.length - 1, slide));
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
    const slides = getWelcomeSlides();
    const slide = slides[this.welcomeSlide] || slides[0];
    const isLast = this.welcomeSlide === slides.length - 1;

    const primaryBtn = el('button', {
      type: 'button',
      class: 'btn-primary',
      autofocus: 'true',
      text: isLast ? t('welcomeUi.startRoleTour') : t('welcomeUi.nextStep', this.welcomeSlide + 2, slides.length),
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
          el('div', { class: 'tour-dots', 'aria-hidden': 'true' }, slides.map((_, idx) =>
            el('span', { class: `tour-dot${idx === this.welcomeSlide ? ' is-active' : ''}` })
          )),
          el('form', { method: 'dialog', style: 'margin:0;' }, [
            el('button', {
              type: 'submit',
              class: 'btn-ghost',
              style: 'min-height:36px;padding:4px 10px;font-size:13px;',
              text: t('welcomeUi.closeEsc'),
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
                text: t('welcomeUi.prevStep'),
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
            text: t('welcomeUi.skipTour'),
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
    if (nextIdx >= getHudTourSteps().length) {
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

    const tourSteps = getHudTourSteps();
    const step = tourSteps[this.tourStepIndex];
    if (!step || this.state.phase !== step.phase) {
      this._hideHudPopoverNode();
      return;
    }

    if (this.layout?.useCompactHud) {
      if (step.selector === '.hud-bar') {
        this.mobileHudExpanded = true;
        document.querySelector('.hud-bar')?.classList.add('is-mobile-expanded');
      }
    }
    if (this.layout?.useMobileTabs) {
      const panelForSelector = {
        '.scene-card': 'scene',
        '#clue-card-panel': 'intel',
        '.main-stage': 'mission',
        '#phone-card-panel': 'phone'
      }[step.selector];
      if (panelForSelector) {
        this.mobilePanel = panelForSelector;
        document.querySelector('.play-grid')?.setAttribute('data-mobile-panel', panelForSelector);
      }
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
    if (!this.layout?.isDesktopLocked && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    pop.dataset.place = step.place || 'bottom';
    pop.innerHTML = '';
    const isLast = this.tourStepIndex === tourSteps.length - 1;
    const hideBtn = el('button', {
      type: 'button',
      class: 'btn-ghost',
      style: 'min-height:32px;padding:3px 9px;font-size:12px;',
      popovertarget: 'hud-tour-popover',
      popovertargetaction: 'hide',
      text: t('tourUi.skip'),
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
      text: isLast ? t('tourUi.finish') : (this.tourStepIndex === 0 ? t('tourUi.nextToScene') : t('tourUi.next')),
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
      el('span', { class: 'gta-kicker', text: t('tourUi.kicker', this.tourStepIndex + 1, tourSteps.length) }),
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
            text: t('tourUi.prev'),
            onClick: () => {
              soundFX.playClick();
              this._advanceHudTour(-1);
            }
          })
        : el('span', { style: 'font-size:12px;color:var(--cyan);', text: t('tourUi.hintPickCard') }),
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
    if (next.phase !== 'game' && next.swipeDraft) {
      const { swipeDraft: _, ...withoutDraft } = next;
      next = withoutDraft;
    }
    if (!this._saveState(next)) return;
    const changedView = next.phase !== this.state.phase || next.chapterIndex !== this.state.chapterIndex;
    const enteredReview = next.phase === 'review' && this.state.phase !== 'review';
    const enteredDeltaPhase = (next.phase === 'game' || next.phase === 'reveal') && next.phase !== this.state.phase;
    if (enteredDeltaPhase) {
      this.lastStatDeltas = computeStatDeltas(this.state, next);
    } else if (next.phase === 'scene' || next.phase === 'role' || next.phase === 'title') {
      this.lastStatDeltas = [];
    }
    if (this.state.phase === 'cutscene' && next.phase !== 'cutscene') {
      soundFX.setCutscenePlaying(false);
    }
    if (changedView) {
      this.mobilePanel = 'mission';
      this.mobileHudExpanded = false;
    }
    const personaId = enteredReview ? determinePersona(next).id : null;
    const { meta: nextMeta, newlyUnlocked } = updateCareerMeta(this._loadMeta(), next, personaId, enteredReview);
    this.careerMeta = nextMeta;
    this._saveMeta();
    this.state = next;
    this.render();
    if (changedView && !this.layout?.isDesktopLocked) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (newlyUnlocked.length) {
      const achStrings = t('launch.achievements') || {};
      newlyUnlocked.forEach((id) => {
        const item = achStrings[id];
        if (item?.title) this._showToast(t('launch.toastAchUnlocked', `${item.icon} ${item.title}`), 'gold', 4200);
      });
    }
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
    this.mobileHudExpanded = false;
    this.mobilePanel = 'mission';
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
    if (this.welcomeDialog?.open || this.confirmRestartDialog?.open) return;
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

    if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey && !this.cheatBuffer.endsWith('AM')) {
      e.preventDefault();
      this._toggleMute(true);
      return;
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
      if (e.defaultPrevented || e.target?.closest?.('button, a[href], select, video[controls], audio[controls], [role="button"], [contenteditable]')) return;
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
    if (this.layout?.useMobileTabs) {
      this.mobilePanel = target === 'clue' ? 'intel' : 'phone';
    }
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
      const clipId = next.lastRescueIndex !== null && next.lastRescueIndex !== undefined
        ? `grandma:rescue_${next.lastRescueIndex}`
        : null;
      const spoke = soundFX.speak(next.lastRescueMessage, 'grandma', false, clipId);
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
        const clipId = next.lastRescueIndex !== null && next.lastRescueIndex !== undefined
          ? `grandma:rescue_${next.lastRescueIndex}`
          : null;
        const spoke = soundFX.speak(next.lastRescueMessage, 'grandma', false, clipId);
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
        soundFX.speak(ch.grandmaPhoneCall.text, 'grandma', false, ch.voiceClips?.grandmaCall);
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
    this._drainPendingToasts();
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
        alt: t('titleScreen.heroAlt'),
        fetchpriority: 'high',
        decoding: 'async',
        onerror: (e) => { e.target.style.display = 'none'; }
      }),
      htmlNode('hero-fsd', getTeslaFsdOverlaySvg()),
      htmlNode('hero-a25', getFubonA25BlueprintSvg())
    ]);

    const body = el('div', { class: 'hero-body' }, [
      el('div', { class: 'hero-top-row' }, [
        htmlNode('hero-crest', SVG_GTA_TAIWAN_CREST),
        this._renderLangSwitch(false)
      ]),
      el('div', { class: 'gta-kicker', text: t('titleScreen.kicker') }),
      el('h1', { class: 'gta-title gta-title-split', 'aria-label': `${t('titleScreen.titleA')} ${t('titleScreen.titleB')}` }, [
        el('span', { class: 't-a', text: t('titleScreen.titleA') }),
        el('span', { class: 't-b', text: t('titleScreen.titleB') })
      ]),
      el('div', { class: 'hero-story-card' }, [
        el('div', { class: 'hero-story-label', text: t('titleScreen.storyLabel') }),
        el('p', {
          class: 'gta-subtitle',
          text: t('titleScreen.subtitle')
        })
      ]),
      el('div', { class: 'quickstart-strip', role: 'list', 'aria-label': t('titleScreen.quickstartAria') }, (t('titleScreen.steps') || []).map((st) =>
        el('div', { class: 'quickstart-step', role: 'listitem' }, [
          el('b', { text: st.b }),
          el('span', { text: st.s })
        ])
      )),
      this.state.grandmaUnlocked
        ? el('div', { class: 'rescue-toast', style: 'font-size:13.5px;padding:6px 10px;', text: t('titleScreen.grandmaUnlockedBanner') })
        : null,
      el('div', { class: 'hero-actions' }, [
        el('button', {
          class: 'btn-primary is-hero-pulse',
          onClick: () => this._startShift()
        }, [
          el('span', { class: 'hero-cta-badge', text: t('titleScreen.ctaStepBadge') }),
          el('span', { text: t('titleScreen.ctaStart') })
        ]),
        el('button', {
          class: 'btn-cyan',
          text: t('titleScreen.ctaTour'),
          onClick: (e) => {
            soundFX.playClick();
            this._openWelcomeTour(0, e.currentTarget);
          }
        }),
        el('button', {
          class: 'btn-gold is-compact',
          text: t('titleScreen.ctaScooter'),
          onClick: () => this._openScooterModal()
        }),
        this.state.history.length > 0
          ? el('button', {
              class: 'btn-cyan',
              text: t('titleScreen.ctaResume', this.state.chapterIndex + 1),
              onClick: () => {
                soundFX.playClick();
                this._setState({ ...this.state, phase: 'scene' });
              }
            })
          : null
      ]),
      el('div', { class: 'plate-box is-optional' }, [
        el('span', { class: 'plate-label', text: t('titleScreen.cheatOptionalLabel') }),
        this._renderCheatInput()
      ])
    ]);

    return el('section', { class: 'hero-card' }, [heroMedia, body]);
  }

  _renderCheatInput() {
    const input = el('input', {
      class: 'cheat-input',
      type: 'text',
      placeholder: t('titleScreen.cheatPlaceholder'),
      maxLength: '10',
      'aria-label': t('titleScreen.cheatAria')
    });
    const activate = () => {
      const val = input.value.trim().toUpperCase();
      if (val === CHEAT_CODE || val === 'GRANDMA') {
        this._triggerCheatCode(true);
      } else {
        soundFX.playClick();
        input.value = '';
        input.placeholder = t('titleScreen.cheatHint');
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
      text: t('titleScreen.cheatBtn'),
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
    const roles = getLocalizedRoles();
    const routeMap = getLocalizedRouteMeta();
    const hudStats = getHudStats();
    const clearedMap = this.careerMeta?.clearedRoles || {};
    const clearedCount = Object.keys(clearedMap).length;
    const achCount = (this.careerMeta?.achievements || []).length;
    const topBar = el('div', { class: 'panel role-topbar' }, [
      el('div', {}, [
        el('div', { class: 'role-kicker-row' }, [
          el('div', { class: 'gta-kicker', text: t('roleSelect.kicker') }),
          el('div', { class: 'meta-progress-pill', text: t('launch.metaProgress', clearedCount, roles.length, achCount, ACHIEVEMENT_IDS.length) })
        ]),
        el('h2', { text: t('roleSelect.heading') }),
        el('p', { class: 'role-topbar-hint', text: t('roleSelect.hint') })
      ]),
      el('div', { class: 'cheat-bar' }, [
        this._renderLangSwitch(false),
        el('button', {
          class: 'btn-cyan',
          style: 'min-height:40px;padding:6px 12px;font-size:13.5px;',
          text: t('roleSelect.tourBtn'),
          onClick: (e) => {
            soundFX.playClick();
            this._startHudTour('role', e.currentTarget);
          }
        }),
        el('button', {
          class: 'btn-gold',
          text: this.state.grandmaUnlocked ? t('roleSelect.grandmaUnlockedBtn') : t('roleSelect.grandmaUnlockBtn'),
          onClick: () => this._triggerCheatCode(true)
        }),
        el('button', {
          class: 'btn-ghost',
          text: t('roleSelect.backToTitle'),
          onClick: () => this._setState({ ...this.state, phase: 'title' })
        })
      ])
    ]);

    const grid = el('div', { class: 'role-grid' }, roles.map((role, idx) => {
      const locked = role.id === 'grandma' && !this.state.grandmaUnlocked;
      const isRec = role.id === 'planner';
      const clearedRec = clearedMap[role.id];
      const cls = `role-card${role.id === 'grandma' ? ' is-grandma' : ''}${isRec ? ' is-recommended' : ''}${clearedRec ? ' is-cleared' : ''}${locked ? ' is-locked' : ''}`;
      const route = routeMap[role.id] || {};
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
          el('span', { text: t('roleSelect.cardHeaderBrand') }),
          el('span', { style: 'display:inline-flex;align-items:center;gap:4px;' }, [
            clearedRec ? el('span', { class: 'role-cleared-badge', text: t('launch.roleClearedTag'), title: t('launch.roleBestScore', Number(clearedRec.bestScore || 0).toLocaleString()) }) : null,
            el('span', { text: `WANTED #0${idx + 1}` })
          ])
        ]),
        el('div', { class: 'role-avatar-wrap' }, [
          el('img', {
            src: role.image,
            alt: role.name,
            onerror: (e) => { e.target.style.display = 'none'; }
          }),
          isRec ? el('span', { class: 'role-rec-badge', text: t('roleSelect.recBadge') }) : null,
          el('span', {
            class: 'role-badge-float',
            style: `color:${role.color};`,
            text: locked ? t('roleSelect.lockedBadge') : role.badge
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
                  text: t('roleSelect.listenQuote'),
                  onClick: (e) => {
                    e.stopPropagation();
                    soundFX.speak(role.quote, 'grandma', true, 'grandma:quote');
                  },
                  onKeydown: (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      soundFX.speak(role.quote, 'grandma', true, 'grandma:quote');
                    }
                  }
                })
              : null
          ]),
          el('div', { class: 'role-bars' }, hudStats.map((st) =>
            el('div', { class: 'role-bar-row', title: `${st.label} ${role.startingStats[st.key]}` }, [
              htmlNode('role-bar-icon', getStatIconSvg(st.icon)),
              this._renderSegBar(role.startingStats[st.key], st.color)
            ])
          )),
          el('div', { class: 'role-pick-cta', text: locked ? t('roleSelect.ctaLocked') : t('roleSelect.ctaPick') })
        ])
      ]);
    }));

    return el('div', { class: 'role-select-wrap' }, [topBar, grid]);
  }

  _toggleVoice(btn) {
    soundFX.toggleVoice();
    this._saveAudioPrefs();
    const txt = btn.querySelector('.hud-btn-text');
    if (txt) txt.textContent = `${soundFX.voiceEnabled ? '🎙️' : '🔇'} ${this._voiceBtnLabel()}`;
    btn.setAttribute('aria-pressed', String(soundFX.voiceEnabled));
  }

  _toggleMute(withToast = false) {
    this.muted = !this.muted;
    soundFX.setMuted(this.muted);
    this._saveAudioPrefs();
    document.querySelectorAll('.cutscene-video').forEach((v) => {
      v.muted = this.muted;
    });
    if (!this.muted) soundFX.startBGM();
    document.querySelectorAll('[data-mute-btn]').forEach((b) => { b.textContent = this.muted ? t('hud.soundMuted') : t('hud.soundOn'); });
    if (withToast) {
      this._showToast(this.muted ? t('launch.toastMuted') : t('launch.toastUnmuted'), 'info', 2400);
    }
  }

  _renderHud() {
    const role = getRole(this.state.roleId);
    const ch = getCurrentChapter(this.state);
    const s = this.state.stats;
    const [roadZh, roadEn] = this._roadParts(ch);
    const stars = Math.max(0, Math.min(5, this.state.wantedStars));
    const starsText = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    const hudStats = getHudStats();
    const uiRadio = t('radioStations') || {};
    const curStation = soundFX.getCurrentStation();
    const curStationName = uiRadio[curStation.id] || curStation.short;

    const stationBtn = el('button', {
      class: 'hud-btn is-radio',
      title: t('hud.radioTitle'),
      'aria-label': t('hud.radioAria'),
      text: `📻 ${curStationName}`,
      onClick: (e) => {
        const st = soundFX.nextStation();
        this._saveAudioPrefs();
        const name = (t('radioStations') || {})[st.id] || st.short;
        e.currentTarget.textContent = `📻 ${name}`;
      }
    });

    const voiceBtn = el('button', {
      class: 'hud-btn',
      'data-voice': 'any',
      'aria-pressed': String(soundFX.voiceEnabled),
      title: t('hud.voiceTitle'),
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
      title: t('hud.helpTitle'),
      text: t('hud.helpBtn'),
      onClick: () => soundFX.playClick()
    });
    const helpPopover = el('div', {
      id: 'hud-help-popover',
      popover: 'auto',
      class: 'hud-help-popover',
      role: 'dialog',
      'aria-label': t('hud.helpAria')
    }, [
      el('div', { class: 'hud-help-title', text: t('hud.helpPopoverTitle') }),
      el('div', { class: 'hud-help-list' }, [
        ...hudStats.map((m) => el('div', { text: m.helpText })),
        el('div', { class: 'hud-help-star-note', text: t('hud.helpStarNote') })
      ])
    ]);

    return el('header', { class: `hud-bar${this.mobileHudExpanded ? ' is-mobile-expanded' : ''}` }, [
      el('div', { class: 'hud-identity' }, [
        el('div', { class: 'hud-avatar-frame', 'data-voice': 'any' }, [
          el('img', { src: role.image, alt: role.name, onerror: (e) => { e.target.style.display = 'none'; } })
        ]),
        el('div', { class: 'hud-id-text' }, [
          htmlNode('hud-sign', SVG_ROAD_SIGN_BADGE(roadZh, roadEn)),
          el('div', { class: 'hud-time', text: t('hud.timeMeta', ch.timeSlot, ch.id, ch.year) }),
          el('div', { class: 'hud-name', text: `${role.name}｜${ch.location}` }),
          el('div', { class: 'hud-pips', 'aria-hidden': 'true' }, CHAPTERS.map((c) =>
            el('i', { class: c.id < ch.id ? 'done' : (c.id === ch.id ? 'now' : '') })))
        ]),
        el('div', { class: 'hud-mobile-summary' }, [
          el('div', { class: 'hud-mobile-stats' }, [
            el('span', { class: 'hud-mobile-score', text: `$${this.state.points.toLocaleString()}` }),
            el('span', { class: 'hud-mobile-stars', 'aria-label': t('hud.wantedAria', stars), text: starsText })
          ]),
          el('button', {
            type: 'button',
            class: 'hud-mobile-toggle',
            'aria-expanded': String(this.mobileHudExpanded),
            'aria-label': t('hud.mobileToggleAria'),
            text: this.mobileHudExpanded ? t('hud.mobileToggleClose') : t('hud.mobileToggleOpen'),
            onClick: () => {
              soundFX.playClick();
              this.mobileHudExpanded = !this.mobileHudExpanded;
              this.render();
            }
          })
        ])
      ]),
      el('div', { class: 'hud-meters' }, hudStats.map((m) =>
        el('div', { class: 'meter-box', style: `--seg:${m.color};`, title: m.tip || m.label }, [
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
            title: t('hud.wantedTitle'),
            'aria-label': t('hud.wantedAria', stars),
            text: starsText
          })
        ]),
        stationBtn,
        voiceBtn,
        el('button', { class: 'hud-btn is-gold', text: t('hud.scooterBtn'), onClick: () => this._openScooterModal() }),
        el('button', {
          class: 'hud-btn',
          'data-mute-btn': '1',
          text: this.muted ? t('hud.soundMuted') : t('hud.soundOn'),
          'aria-label': t('hud.muteAria'),
          onClick: () => this._toggleMute()
        }),
        helpBtn,
        el('button', {
          type: 'button',
          class: 'hud-btn',
          text: t('hud.restartBtn'),
          onClick: () => this._openRestartConfirm()
        }),
        this._renderLangSwitch(true),
        helpPopover
      ])
    ]);
  }

  _renderCutsceneStage() {
    const ch = getCurrentChapter(this.state);
    const role = getRole(this.state.roleId);
    const src = getCutsceneUrl(this.activeCutsceneSrc || ch.cutscene);
    const isGrandmaVideo = String(src).includes('grandma');
    const subSender = ch.baseLineSender || ch.lineSender;
    const subMessage = ch.baseLineMessage || ch.lineMessage;
    const subtitleText = isGrandmaVideo
      ? `${t('engine.grandmaName')}：「${getCutsceneGrandmaLine()}」`
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
      text: this.muted ? t('cutscene.soundOff') : t('cutscene.soundOn'),
      onClick: () => {
        if (videoEl.muted || this.muted) {
          this.muted = false;
          soundFX.setMuted(false);
          document.querySelectorAll('[data-mute-btn]').forEach((b) => { b.textContent = t('hud.soundOn'); });
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
      text: t('cutscene.unlockSound'),
      onClick: () => {
        this.muted = false;
        soundFX.setMuted(false);
        document.querySelectorAll('[data-mute-btn]').forEach((b) => { b.textContent = t('hud.soundOn'); });
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
      soundToggleBtn.textContent = videoEl.muted || this.muted ? t('cutscene.soundOff') : t('cutscene.soundOn');
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
          el('div', { class: 'gta-kicker', text: isGrandmaVideo ? t('cutscene.kickerGrandma', role.name) : t('cutscene.kickerRoute', ch.timeSlot, ch.roleRoute?.routeName || role.name) }),
          el('h2', { style: 'margin:4px 0 0 0;', text: `${ch.title} — ${ch.location}` })
        ]),
        el('div', { style: 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;' }, [
          soundToggleBtn,
          el('button', {
            class: 'mode-chip',
            text: t('cutscene.replayVideo'),
            onClick: () => {
              videoEl.currentTime = 0;
              videoEl.muted = this.muted;
              videoEl.volume = 1.0;
              videoEl.play().catch(() => {});
              syncAudioUi();
            }
          }),
          el('button', { class: 'btn-primary', text: t('cutscene.skipBtn'), onClick: () => this._leaveCutscene() })
        ])
      ]),
      el('div', { class: 'cutscene-stage-wrap' }, [
        videoEl,
        unlockBtn,
        el('div', { class: 'cutscene-subtitle', text: subtitleText })
      ]),
      el('div', { class: 'cutscene-novice-tip', text: t('cutscene.noviceTip') }),
      el('p', { class: 'chapter-desc', text: ch.sceneDesc })
    ]);
  }

  _renderPlayGrid() {
    const ch = getCurrentChapter(this.state);
    if (this._getMapsApiKey() && !this.resolvedPanoInfo[ch.id]) {
      this._lookupLivePano(ch);
    }
    return el('div', { class: 'play-grid', 'data-mobile-panel': this.mobilePanel }, [
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
    const fsd = getFsdLines();
    if (this.fsdHudOverlay) {
      soundFX.speak(fsd.on, 'fsd', true, ch?.voiceClips?.fsdOn || 'voice:fsd_on');
    } else {
      soundFX.speak(fsd.off, 'fsd', true, ch?.voiceClips?.fsdOff || 'voice:fsd_off');
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
        title: t('sceneCard.iframeTitle360', ch.location),
        allowfullscreen: 'true',
        loading: 'lazy',
        referrerpolicy: 'no-referrer-when-downgrade'
      });
    } else if (mode === 'gmap_live' && gm.embedQuery) {
      isIframe = true;
      media = el('iframe', {
        class: 'scene-gmap-iframe',
        src: `https://maps.google.com/maps?q=${encodeURIComponent(gm.embedQuery)}&t=k&hl=${t('sceneCard.hlParam')}&z=18&output=embed`,
        title: t('sceneCard.iframeTitleSat', ch.location),
        loading: 'lazy',
        referrerpolicy: 'no-referrer-when-downgrade'
      });
    } else if (mode === 'gmap_photo' && gm.realPhoto) {
      media = el('img', {
        src: gm.realPhoto,
        alt: t('sceneCard.realPhotoAlt', gm.roadSign || ch.location),
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
    if (mode === 'gmap_photo') subtitleText = t('sceneCard.subtitleRealPhoto', gm.roadSign || ch.location);
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
      'aria-label': t('sceneCard.moreViewsAria')
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
      el('div', { class: 'scene-more-popover-title', text: t('sceneCard.moreViewsTitle') }),
      chipPop('gmap_photo', t('sceneCard.viewPhoto')),
      chipPop('gmap_live', t('sceneCard.viewSat')),
      el('button', {
        type: 'button',
        role: 'menuitem',
        class: `mode-chip${this.fsdHudOverlay ? ' is-active' : ''}`,
        'aria-pressed': String(this.fsdHudOverlay),
        text: this.fsdHudOverlay ? t('sceneCard.fsdOn') : t('sceneCard.fsdOff'),
        onClick: () => {
          closeMore();
          this._toggleFsd(ch);
        }
      }),
      el('button', {
        type: 'button',
        role: 'menuitem',
        class: 'mode-chip',
        text: t('sceneCard.zoom360'),
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
      this.fsdHudOverlay && !isIframe ? htmlNode('scene-fsd', getTeslaFsdOverlaySvg()) : null,
      subtitleText ? el('div', { class: 'scene-subtitle', text: subtitleText }) : null
    ]);

    return el('div', { class: 'panel scene-card' }, [
      el('div', { class: 'tex', style: `background-image:url("${gameAssetUrl('./public/images/ui-begonia-glass.webp')}");`, 'aria-hidden': 'true' }),
      htmlNode('grille tl', SVG_IRON_GRILLE_CORNER),
      htmlNode('grille tr', SVG_IRON_GRILLE_CORNER),
      el('div', { class: 'zone-tag is-ref', text: t('sceneCard.zoneRef') }),
      // Track 1：路牌狀態列（獨立空間）
      el('div', { class: 'track-status' }, [
        htmlNode('track-sign', SVG_ROAD_SIGN_BADGE(roadZh, roadEn)),
        el('div', { class: 'track-right' }, [
          htmlNode('track-a25', getFubonA25BlueprintSvg()),
          el('span', { class: 'time-tag', text: `${ch.timeSlot} · ${ch.title}` })
        ])
      ]),
      // Track 2：純淨 16:9 視景
      viewport,
      // Track 3：精簡單排視景控制列（次要視角收進原生 Popover 選單）
      el('div', { class: 'track-controls' }, [
        el('div', { class: 'ctl-row', role: 'group', 'aria-label': t('sceneCard.viewModesAria') }, [
          chip('gta', t('sceneCard.view3d')),
          chip('gmap_360', t('sceneCard.view360'), () => this._lookupLivePano(ch)),
          el('button', {
            id: 'more-views-trigger',
            type: 'button',
            class: `mode-chip${hasSecondaryActive ? ' is-active' : ''}`,
            popovertarget: 'scene-more-views',
            'aria-haspopup': 'menu',
            title: t('sceneCard.moreBtnTitle'),
            text: t('sceneCard.moreBtn'),
            onClick: () => soundFX.playClick()
          }),
          ch.cutscene
            ? el('button', {
                type: 'button',
                class: 'hotspot-chip',
                text: t('sceneCard.replayCutscene'),
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
        el('div', { class: 'clue-title', style: `color:${role.color};margin:0;`, text: t('clueCard.title', role.name) }),
        role.id === 'grandma'
          ? el('button', {
              class: 'replay-btn',
              'data-voice': 'grandma',
              text: t('clueCard.listenGrandma'),
              onClick: () => soundFX.speak(clue, 'grandma', true, ch.voiceClips?.grandmaClue)
            })
          : null
      ]),
      el('div', { class: 'clue-text', text: clue }),
      el('button', {
        class: 'btn-cyan',
        disabled: this.state.roleSpecialUsedThisChapter,
        text: this.state.roleSpecialUsedThisChapter ? t('clueCard.specialUsed', role.specialName) : t('clueCard.specialReady', role.specialName),
        onClick: () => {
          soundFX.playMissionPassed();
          this._setState(useRoleSpecial(this.state));
          this._showToast(t('launch.toastSkillUsed', role.specialName), 'info', 3000);
        }
      })
    ]);
  }

  // 台北 GPS 戰術雷達：底圖 ui-taipei-radar-map.webp ＋ 羅盤外環 ＋ 以百分比定位的十個站點
  _renderMiniMap(ch) {
    const gm = ch.googleMap || {};
    const hasKey = Boolean(this._getMapsApiKey());
    const radarNextLabel = this.radarMode === 'radar'
      ? t('minimap.toSat')
      : (this.radarMode === 'gmap' && hasKey ? t('minimap.toJs') : t('minimap.toRadar'));

    let body;
    if (this.radarMode === 'gmap' && gm.embedQuery) {
      body = el('iframe', {
        class: 'minimap-gmap-iframe',
        src: `https://maps.google.com/maps?q=${encodeURIComponent(gm.embedQuery)}&t=m&hl=${t('sceneCard.hlParam')}&z=16&output=embed`,
        title: t('minimap.gmapTitle'),
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
        el('span', { text: t('minimap.header', ch.id) }),
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
    const roleChapters = CHAPTERS.map((_, i) => getLocalizedChapterForRole(i, this.state.roleId));
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
        title: t('minimap.stationTitle', c.id, c.timeSlot, c.location)
      });
    });

    return el('div', { class: 'radar-wrap' }, [
      el('div', { class: 'radar-stage' }, [
        el('img', {
          class: 'radar-base',
          src: './public/images/ui-taipei-radar-map.webp',
          alt: t('minimap.radarAlt'),
          onerror: (e) => { e.target.style.display = 'none'; }
        }),
        route,
        ...dots,
        htmlNode('radar-ring', getRadarCompassRingSvg()),
        el('span', { class: 'radar-tag', text: `${activeCh.roleRoute?.routeBadge || t('minimap.defaultRouteBadge')} · ${activeCh.timeSlot}` })
      ])
    ]);
  }

  _speakTwin(ch, tid, manual) {
    const text = ch.peopleModel && ch.peopleModel[tid];
    if (text) soundFX.speak(text, tid, manual, ch.voiceClips?.[tid]);
  }

  _renderPhoneDrawer(ch) {
    const twins = getLocalizedTwins();
    const gta6Global = getLocalizedGta6Analysis();
    const tabs = el('div', { class: 'phone-tabs' }, [
      el('button', {
        class: `phone-tab${this.phoneTab === 'line' ? ' is-active' : ''}`,
        text: t('phone.tabLine', this.state.phoneLog.length),
        onClick: () => { this.phoneTab = 'line'; this.render(); }
      }),
      el('button', {
        class: `phone-tab${this.phoneTab === 'people' ? ' is-active' : ''}`,
        text: t('phone.tabPeople'),
        onClick: () => { this.phoneTab = 'people'; this.render(); }
      }),
      el('button', {
        class: `phone-tab${this.phoneTab === 'grandma' ? ' is-active' : ''}`,
        text: t('phone.tabGrandma'),
        onClick: () => {
          this.phoneTab = 'grandma';
          if (!this.state.grandmaUnlocked) {
            this._triggerCheatCode(false);
          } else {
            this.render();
          }
          soundFX.speak(ch.grandmaQuip, 'grandma', true, ch.voiceClips?.grandmaQuip);
        }
      }),
      el('button', {
        class: `phone-tab${this.phoneTab === 'gta6' ? ' is-active' : ''}`,
        text: t('phone.tabGta6'),
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
        el('div', { style: 'font-size:13px;color:var(--muted);', text: t('phone.peopleIntro') }),
        ...['lisa', 'cindy'].map((tid) => {
          const twin = twins[tid] || PEOPLE_MODEL_TWINS[tid];
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
              el('img', { class: 'twin-avatar', src: twin.image, alt: twin.name, loading: 'lazy', decoding: 'async', onerror: (e) => { e.target.style.display = 'none'; } }),
              el('div', { class: 'twin-text' }, [
                el('b', { text: twin.name }),
                el('span', { text: asked ? `「${ch.peopleModel[tid]}」` : t('phone.clickAsk') })
              ])
            ]),
            asked
              ? el('button', {
                  class: 'replay-btn',
                  'data-voice': tid,
                  'aria-label': t('phone.relistenAria', twin.name),
                  text: t('phone.relisten'),
                  onClick: () => this._speakTwin(ch, tid, true)
                })
              : null
          ]);
        })
      ]);
    } else if (this.phoneTab === 'gta6') {
      const g6 = ch.gta6Analysis || {};
      bodyNode = el('div', { class: 'chat-scroll gta6-analysis-card' }, [
        el('div', { style: 'font-size:12.5px;font-weight:800;color:var(--cyan);', text: `🎬 ${g6.trailerScene || gta6Global.title}` }),
        el('div', { style: 'font-size:13px;color:#efeafd;', text: `${t('phone.gta6CharPrefix')}${g6.characterArc || gta6Global.coreParallel}` }),
        el('div', { style: 'font-size:13px;color:var(--gold);', text: `${t('phone.gta6CraftPrefix')}${g6.taiwanCraft || gta6Global.taiwanMotifs[0]}` })
      ]);
    } else {
      bodyNode = el('div', { style: 'display:flex;flex-direction:column;gap:6px;' }, [
        el('div', { style: 'font-size:12px;color:var(--gold);font-weight:800;', text: t('phone.grandmaVoiceBadge') }),
        el('div', { class: 'rescue-toast', style: 'font-size:14px;padding:6px 10px;', text: ch.grandmaQuip }),
        el('div', { style: 'font-size:13px;color:var(--gold);', text: t('phone.callPrefix', ch.grandmaPhoneCall.title, ch.grandmaPhoneCall.text) }),
        el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap;' }, [
          el('button', {
            class: 'btn-gold',
            style: 'min-height:44px;font-size:14px;padding:6px 10px;flex:1 1 auto;',
            text: t('phone.summonPotBtn'),
            onClick: () => this._triggerCheatCode(true)
          }),
          el('button', {
            class: 'replay-btn',
            'data-voice': 'grandma',
            text: t('phone.relistenQuip'),
            onClick: () => soundFX.speak(ch.grandmaQuip, 'grandma', true, ch.voiceClips?.grandmaQuip)
          }),
          el('button', {
            class: 'replay-btn',
            'data-voice': 'grandma',
            text: t('phone.relistenCall'),
            onClick: () => soundFX.speak(ch.grandmaPhoneCall.text, 'grandma', true, ch.voiceClips?.grandmaCall)
          })
        ])
      ]);
    }

    return el('section', {
      id: 'phone-card-panel',
      class: `phone-frame${this.highlightTarget === 'phone' ? ' is-highlighted' : ''}`
    }, [
      htmlNode('phone-island', getIfruitChassisSvg()),
      el('div', { class: 'phone-head' }, [
        el('span', { style: 'color:var(--pink);', text: '📱 iFruit Taiwan · LINE 99+' }),
        el('span', { style: 'font-size:12px;color:var(--muted);', text: t('phone.headRight') })
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
      const c = getLocalizedChapterForRole(i, this.state.roleId);
      if (!c.googleMap) continue;
      const pos = { lat: c.googleMap.lat, lng: c.googleMap.lng };
      path.push(pos);
      new window.google.maps.Marker({
        position: pos,
        map,
        title: t('minimap.stationTitle', c.id, c.timeSlot, c.location),
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

  _renderDeltaChips() {
    if (!Array.isArray(this.lastStatDeltas) || !this.lastStatDeltas.length) return null;
    const statsMeta = Object.fromEntries(getHudStats().map((m) => [m.key, m]));
    return el('div', { class: 'delta-row', 'aria-live': 'polite' }, this.lastStatDeltas.map((d) => {
      let text = '';
      let isPositive = d.delta > 0;
      if (d.key === 'points') {
        text = t('launch.deltaPoints', d.delta);
      } else if (d.key === 'wantedStars') {
        text = t('launch.deltaWanted', d.delta);
        isPositive = d.delta < 0;
      } else {
        const label = statsMeta[d.key]?.label || d.key;
        text = `${label} ${d.delta > 0 ? '+' : ''}${d.delta}`;
      }
      return el('span', { class: `delta-chip ${isPositive ? 'is-up' : 'is-down'}`, text });
    }));
  }

  _renderStepFlow(phase) {
    const stepLabels = t('stage.steps') || ['① 讀行程與狀況', '② 選臨場回覆', '③ 解專屬題目', '④ 年鑑金句復盤'];
    const ids = ['scene', 'reply', 'game', 'reveal'];
    const steps = ids.map((id, idx) => ({ id, label: stepLabels[idx] || id }));
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
    const hasLineClip = Boolean(soundFX.resolveVoiceClip(ch.lineMessage, 'boss', ch.voiceClips?.line));
    const nextCh = this.state.chapterIndex < CHAPTERS.length - 1
      ? getLocalizedChapterForRole(this.state.chapterIndex + 1, this.state.roleId)
      : null;

    const actionZoneTag = el('span', { class: 'zone-tag is-action', text: t('stage.actionZone') });

    const header = el('div', { class: 'chapter-header' }, [
      el('div', {}, [
        el('div', { class: 'chapter-kicker-row' }, [
          actionZoneTag,
          el('div', { class: 'gta-kicker', text: t('stage.kickerChapter', ch.roleRoute?.routeBadge || '', ch.timeSlot, ch.id) })
        ]),
        el('h2', { text: `${ch.title}｜${ch.location}` })
      ]),
      el('div', { class: 'pill', text: `${ch.book}` })
    ]);

    const stepFlow = this._renderStepFlow(phase);
    const beginnerBanner = (this.state.chapterIndex === 0 && phase === 'scene' && !this.beginnerTipDismissed)
      ? el('div', { class: 'beginner-coach-banner', role: 'status' }, [
          el('span', { style: 'flex:1 1 200px;', text: t('stage.beginnerTip') }),
          el('div', { class: 'beginner-coach-actions' }, [
            el('button', {
              type: 'button',
              class: 'btn-cyan',
              text: t('stage.beginnerTourBtn'),
              onClick: (e) => {
                soundFX.playClick();
                this._startHudTour('scene', e.currentTarget);
              }
            }),
            el('button', {
              type: 'button',
              class: 'btn-ghost',
              text: t('stage.beginnerGotItBtn'),
              onClick: () => {
                soundFX.playClick();
                this._saveBeginnerTipDone(true);
                this.render();
              }
            })
          ])
        ])
      : null;

    const rescueClipId = this.state.lastRescueIndex !== null && this.state.lastRescueIndex !== undefined
      ? `grandma:rescue_${this.state.lastRescueIndex}`
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
            text: t('stage.relistenGrandma'),
            onClick: () => soundFX.speak(this.state.lastRescueMessage, 'grandma', true, rescueClipId)
          })
        ])
      : null;

    if (phase === 'scene') {
      const mobileScenePeek = el('button', {
        type: 'button',
        class: 'mobile-scene-peek',
        onClick: () => {
          soundFX.playClick();
          this.mobilePanel = 'scene';
          this.mobileHudExpanded = false;
          this.render();
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      }, [
        el('img', {
          src: ch.sceneImage,
          alt: ch.location,
          onerror: (e) => { e.target.style.display = 'none'; }
        }),
        el('span', { class: 'mobile-scene-peek-meta', text: `📍 ${ch.timeSlot} · ${ch.location}` }),
        el('span', { class: 'mobile-scene-peek-cta', text: t('mobile.scenePeekCta') })
      ]);

      return el('main', { class: 'panel main-stage is-action-focus' }, [
        actionZoneTag,
        header,
        stepFlow,
        beginnerBanner,
        rescueBanner,
        mobileScenePeek,
        el('p', { class: 'chapter-desc', text: ch.sceneDesc }),
        el('div', { class: 'boss-callout line-banner' }, [
          el('div', {}, [
            el('div', { class: 'boss-meta', text: t('stage.lineSenderSuffix', ch.lineSender.name, ch.lineSender.role) }),
            el('div', { text: `「${ch.lineMessage}」` })
          ]),
          hasLineClip
            ? el('button', {
                class: 'replay-btn',
                'data-voice': 'boss',
                text: t('stage.listenSender', ch.lineSender.name),
                onClick: () => soundFX.speak(ch.lineMessage, 'boss', true, ch.voiceClips?.line)
              })
            : null
        ]),
        el('div', { class: 'quiz-guide-box' }, [
          el('div', { class: 'quiz-guide-badge', text: t('stage.step1Badge', ch.roleRoute?.routeBadge || '') }),
          el('div', { class: 'prompt-line', text: t('stage.step1Prompt') })
        ]),
        el('div', { class: 'replies-grid' }, ch.replies.map((r, idx) =>
          el('button', {
            class: 'reply-btn',
            onClick: () => this._pickReply(idx)
          }, [
            el('span', { class: 'reply-key', text: String(idx + 1) }),
            el('span', { class: 'reply-label', text: r.text }),
            el('span', { class: 'reply-cta', text: t('stage.replyCta') })
          ])
        ))
      ]);
    }

    if (phase === 'game') {
      const gameTypeGuides = t('stage.gameGuides') || {};
      const gameGuideText = gameTypeGuides[ch.game?.type] || gameTypeGuides.fallback || '';

      return el('main', { class: 'panel main-stage is-action-focus' }, [
        actionZoneTag,
        header,
        stepFlow,
        rescueBanner,
        this.state.activeReply
          ? el('div', { style: 'padding:8px 12px;border-radius:10px;background:rgba(255,255,255,0.06);font-size:15px;color:#e0d6f7;' }, [
              el('div', { text: t('stage.activeReplyLine', this.state.activeReply.text, this.state.activeReply.feedback) }),
              this._renderDeltaChips()
            ])
          : null,
        el('div', { class: 'quiz-guide-box' }, [
          el('div', { class: 'quiz-guide-badge', text: t('stage.step2Badge', ch.roleRoute?.routeBadge || '') }),
          el('div', { class: 'prompt-line', text: gameGuideText })
        ]),
        this._renderMiniGame(ch.game)
      ]);
    }

    // phase === 'reveal'
    const out = this.state.lastGameOutcome || { scored: false, correct: true, detail: '', pointsEarned: 0 };
    const badgeText = out.scored ? (out.correct ? t('stage.revealBadgeCorrect') : t('stage.revealBadgeTried')) : t('stage.revealBadgeDone');
    return el('main', { class: 'panel main-stage is-action-focus' }, [
      actionZoneTag,
      header,
      stepFlow,
      rescueBanner,
      el('div', { class: 'boss-callout', style: `border-color:${out.correct ? 'var(--lime)' : 'var(--orange)'};` }, [
        el('div', { style: 'font-size:15px;color:var(--gold);margin-bottom:4px;', text: `${badgeText} · +$${out.pointsEarned.toLocaleString()}` }),
        el('div', { text: out.detail }),
        this._renderDeltaChips()
      ]),
      el('div', { class: 'panel takeaway-card' }, [
        htmlNode('stamp-slot', getTempleStampSvg()),
        el('div', { style: 'font-size:13px;font-weight:800;color:var(--cyan);margin-bottom:4px;', text: t('stage.takeawayBadge') }),
        el('div', { class: 'takeaway-text', text: `「${ch.takeaway}」` }),
        el('div', { style: 'font-size:14px;color:var(--muted);margin-top:4px;', text: t('stage.takeawaySource', ch.book, ch.source) }),
        el('button', {
          class: 'replay-btn',
          style: 'margin-top:6px;',
          'data-voice': 'narrator',
          text: t('stage.listenAgain'),
          onClick: () => soundFX.speak(ch.takeaway, 'narrator', true, ch.voiceClips?.takeaway)
        })
      ]),
      ch.gta6Analysis
        ? el('div', { class: 'panel gta6-stage-card', style: 'border-color:rgba(255,79,163,0.45);display:flex;flex-direction:column;gap:4px;' }, [
            el('div', { style: 'font-size:13px;font-weight:800;color:var(--pink);', text: t('stage.gta6Title', ch.gta6Analysis.trailerScene) }),
            el('div', { style: 'font-size:14px;color:#efeafd;', text: `🎭 ${ch.gta6Analysis.characterArc}` }),
            el('div', { style: 'font-size:13.5px;color:var(--gold);', text: t('stage.gta6Local', ch.gta6Analysis.taiwanCraft) })
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
          text: t('stage.listenGrandmaVoice'),
          onClick: () => soundFX.speak(ch.grandmaQuip, 'grandma', true, ch.voiceClips?.grandmaQuip)
        })
      ]),
      el('div', { class: 'prompt-line', text: nextCh ? t('stage.revealNextHint') : t('stage.revealFinalHint') }),
      el('div', { class: 'reveal-actions' }, [
        el('button', {
          class: 'btn-gold',
          text: t('stage.scooterBonusBtn'),
          onClick: () => this._openScooterModal()
        }),
        el('button', {
          class: 'btn-primary',
          text: nextCh ? t('stage.nextStationBtn', nextCh.timeSlot) : t('stage.viewReviewBtn'),
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
        ? t('miniGame.hintAgent')
        : t('miniGame.hintPick');
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
              el('span', { class: 'paper-cta', text: t('miniGame.cardPickCta') })
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
        el('div', { style: 'font-size:13px;color:var(--cyan);font-weight:700;', text: t('miniGame.sliderHint') }),
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
          text: t('miniGame.sliderSubmit'),
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
      let swipeStartX = null;
      let swipeMoved = false;
      const cardEl = el('div', {
        class: 'swipe-card',
        style: 'cursor:pointer;',
        onPointerdown: (e) => {
          try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}
          swipeStartX = e.clientX;
          swipeMoved = false;
          cardEl.style.transition = 'none';
        },
        onPointermove: (e) => {
          if (swipeStartX === null) return;
          const dx = e.clientX - swipeStartX;
          if (Math.abs(dx) > 10) swipeMoved = true;
          cardEl.style.transform = `translateX(${dx}px) rotate(${(dx * 0.04).toFixed(1)}deg)`;
        },
        onPointerup: (e) => {
          if (swipeStartX === null) return;
          const dx = e.clientX - swipeStartX;
          swipeStartX = null;
          cardEl.style.transition = '';
          cardEl.style.transform = '';
          if (Math.abs(dx) >= 48) {
            swipeMoved = true;
            this._pickSwipe(dx < 0 ? 'left' : 'right');
          }
        },
        onPointercancel: () => {
          swipeStartX = null;
          swipeMoved = false;
          cardEl.style.transition = '';
          cardEl.style.transform = '';
        },
        onClick: (e) => {
          if (swipeMoved) {
            swipeMoved = false;
            return;
          }
          const rect = e.currentTarget.getBoundingClientRect();
          const isLeft = (e.clientX - rect.left) < rect.width / 2;
          this._pickSwipe(isLeft ? 'left' : 'right');
        }
      }, cardText);

      return el('div', { style: 'display:flex;flex-direction:column;gap:10px;' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:center;' }, [
          el('h3', { style: 'margin:0;font-size:20px;color:var(--gold);', text: game.prompt }),
          el('span', { class: 'pill', text: t('miniGame.swipeCounter', this.swipeIndex + 1, game.cards.length) })
        ]),
        el('div', { style: 'font-size:13px;color:var(--cyan);font-weight:700;', text: t('miniGame.swipeHint', game.left, game.right) }),
        cardEl,
        el('div', { class: 'is-mobile-only', style: 'font-size:12px;color:var(--gold);font-weight:700;text-align:center;', text: t('mobile.swipeTouchHint') }),
        el('div', { class: 'swipe-actions' }, [
          el('button', {
            class: 'btn-cyan',
            text: t('miniGame.swipeLeftBtn', game.left),
            onClick: () => this._pickSwipe('left')
          }),
          el('button', {
            class: 'btn-primary',
            text: t('miniGame.swipeRightBtn', game.right),
            onClick: () => this._pickSwipe('right')
          })
        ])
      ]);
    }

    if (game.type === 'multi') {
      return el('div', { style: 'display:flex;flex-direction:column;gap:12px;' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:center;' }, [
          el('h3', { style: 'margin:0;font-size:20px;color:var(--gold);', text: game.prompt }),
          el('span', { class: 'pill', text: t('miniGame.multiCount', this.multiSelected.size) })
        ]),
        el('div', { style: 'font-size:13px;color:var(--cyan);font-weight:700;', text: t('miniGame.multiHint') }),
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
            el('div', { style: 'font-size:13px;color:#475569;margin-top:4px;', text: this.multiSelected.has(idx) ? t('miniGame.multiSelectedText') : t('miniGame.multiUnselectedText') })
          ])
        )),
        el('button', {
          class: 'btn-primary',
          text: t('miniGame.multiSubmit'),
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
        if (tick < 2) return t('miniGame.stopStatusEarly');
        if (tick <= (game.goodUntilTick ?? 4)) return t('miniGame.stopStatusWarn');
        return t('miniGame.stopStatusDanger');
      };
      const repEl = el('div', { class: 'stop-val', style: 'color:var(--lime);', text: String(game.report.start + this.stopTick * game.report.perTick) });
      const freshEl = el('div', { class: 'stop-val', style: 'color:var(--danger);', text: `${game.fresh.start + this.stopTick * game.fresh.perTick}${game.fresh.unit}` });
      const tickLabel = el('div', { class: 'pill', text: t('miniGame.stopWeek', this.stopTick, game.ticks) });
      const statusPill = el('div', { class: 'rescue-toast', style: 'padding:8px 12px;font-size:14px;', text: getStopStatusText(this.stopTick) });

      this.updateStopDisplay = () => {
        repEl.textContent = String(game.report.start + this.stopTick * game.report.perTick);
        freshEl.textContent = `${game.fresh.start + this.stopTick * game.fresh.perTick}${game.fresh.unit}`;
        tickLabel.textContent = t('miniGame.stopWeek', this.stopTick, game.ticks);
        statusPill.textContent = getStopStatusText(this.stopTick);
      };
      if (!this.stopTimer && !this.stopFinished) {
        this.stopTimer = setInterval(() => {
          this.stopTick += 1;
          this.updateStopDisplay();
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
          text: t('miniGame.stopBrakeBtn'),
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

  _acceptGrandmaCall() {
    soundFX.playTatungCooker();
    this.ch6CallModalOpen = false;
    this.ch6CallDismissed = true;
    const unlocked = { ...this.state, grandmaUnlocked: true };
    const ch = getCurrentChapter(unlocked);
    const next = this.swipeIndex >= ch.game.cards.length
      ? submitMiniGame(unlocked, this.swipeChoices)
      : { ...unlocked, swipeDraft: { callAccepted: true, choices: [...this.swipeChoices] } };
    this._setState(next);
    this._drainPendingToasts();
  }

  _renderCh6PhoneModal() {
    const ch = getCurrentChapter(this.state);
    const call = ch.grandmaPhoneCall;
    return el('div', { class: 'modal-backdrop' }, [
      el('div', { class: 'modal-box' }, [
        el('div', { style: 'display:flex;align-items:center;gap:14px;' }, [
          el('img', {
            src: './public/images/role-grandma.webp',
            alt: t('ch6Modal.alt'),
            style: 'width:76px;height:76px;border-radius:16px;object-fit:cover;border:2px solid var(--gold);'
          }),
          el('div', {}, [
            el('div', { class: 'gta-kicker', text: t('ch6Modal.kicker') }),
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
            text: t('ch6Modal.acceptBtn'),
            onClick: () => this._acceptGrandmaCall()
          }),
          el('button', {
            class: 'replay-btn',
            'data-voice': 'grandma',
            text: t('ch6Modal.relistenBtn'),
            onClick: () => soundFX.speak(call.text, 'grandma', true, ch.voiceClips?.grandmaCall)
          })
        ])
      ])
    ]);
  }

  _renderScooterModal() {
    const scooterCfg = getLocalizedScooterConfig();
    const canvas = el('canvas', { class: 'scooter-canvas', width: 640, height: 400 });
    const hudText = el('div', { class: 'pill pill-gold', text: t('scooterModal.ready') });

    let lastSteerPtrTs = 0;
    const steerBtn = (label, delta) => el('button', {
      type: 'button',
      class: 'btn-cyan',
      text: label,
      onPointerdown: (e) => {
        if (e.pointerType === 'mouse') return;
        lastSteerPtrTs = performance.now();
        if (this.scooterInstance) this.scooterInstance.moveLane(delta);
      },
      onClick: () => {
        if (performance.now() - lastSteerPtrTs < 350) return;
        if (this.scooterInstance) this.scooterInstance.moveLane(delta);
      }
    });

    const modal = el('div', { class: 'modal-backdrop' }, [
      el('div', { class: 'modal-box scooter-modal-box' }, [
        el('div', { class: 'scooter-modal-head' }, [
          el('div', {}, [
            el('div', { class: 'gta-kicker', text: t('scooterModal.kicker') }),
            el('h2', { style: 'margin:4px 0 0 0;', text: scooterCfg.title })
          ]),
          hudText
        ]),
        el('div', { class: 'scooter-canvas-wrap' }, [canvas]),
        el('div', { class: 'scooter-controls' }, [
          steerBtn(t('scooterModal.leftBtn'), -1),
          steerBtn(t('scooterModal.rightBtn'), 1),
          el('button', {
            type: 'button',
            class: 'btn-ghost',
            text: t('scooterModal.closeBtn'),
            onClick: () => this._closeScooterModal(false)
          })
        ]),
        el('div', { class: 'scooter-legend', text: t('scooterModal.legend') })
      ])
    ]);

    requestAnimationFrame(() => {
      if (!this.scooterModalOpen || this.scooterInstance) return;
      this.scooterInstance = new GrandmaScooterGame(canvas, scooterCfg, {
        onEvent: (kind) => {
          if (kind === 'lane') soundFX.playScooterHorn();
          else if (kind === 'good') soundFX.playPickup(true);
          else soundFX.playPickup(false);
        },
        onHudUpdate: (h) => {
          hudText.textContent = t('scooterModal.hudFmt', h.timeLeft, h.score, '❤️'.repeat(h.hp), h.shield);
        },
        onFinish: (result) => {
          soundFX.playTatungCooker();
          this.scooterInstance = null;
          this.scooterModalOpen = false;
          this._restoreStation();
          this._setState(completeScooterRun(this.state, result));
          this._showToast(t('launch.toastScooterDone', Number(result?.score || 0).toLocaleString()), 'gold', 3800);
          this._drainPendingToasts();
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
      ? t('streetViewModal.apiConnected', live.panoId, live.desc)
      : (hasKey
        ? t('streetViewModal.keyLoaded', gm.panoId || '')
        : t('streetViewModal.officialEmbed', gm.panoId || ''));

    let viewportNode;
    if (this.svModalMode === 'jsapi' && hasKey) {
      const host = el('div', { class: 'scene-gmap-iframe sv-modal-viewport', style: 'background:#0d1424;' });
      requestAnimationFrame(() => this._mountJsStreetView(host, ch));
      viewportNode = host;
    } else {
      viewportNode = el('iframe', {
        class: 'scene-gmap-iframe sv-modal-viewport',
        src: this._build360EmbedUrl({ ...gm, panoId: live?.panoId || gm.panoId }),
        title: t('streetViewModal.iframeTitle', ch.location),
        allowfullscreen: 'true',
        loading: 'lazy',
        referrerpolicy: 'no-referrer-when-downgrade'
      });
    }

    return el('div', {
      class: 'modal-backdrop',
      onClick: (e) => {
        if (e.target === e.currentTarget) {
          soundFX.playClick();
          this.streetViewModalOpen = false;
          this.render();
          this._drainPendingToasts();
        }
      }
    }, [
      el('div', { class: 'modal-box', style: 'width:min(880px,100%);' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;' }, [
          el('div', {}, [
            el('div', { class: 'gta-kicker', text: `GOOGLE STREET VIEW 360° · ${gm.roadSign || ch.location}` }),
            el('h2', { style: 'margin:4px 0 0 0;font-size:20px;', text: t('streetViewModal.title', ch.id, ch.location) })
          ]),
          el('div', { style: 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;' }, [
            el('button', {
              class: `mode-chip${this.svModalMode === 'embed' ? ' is-active' : ''}`,
              style: 'min-height:34px;padding:4px 10px;font-size:12px;',
              text: t('streetViewModal.tab360'),
              onClick: () => { soundFX.playClick(); this.svModalMode = 'embed'; this.render(); }
            }),
            hasKey
              ? el('button', {
                  class: `mode-chip${this.svModalMode === 'jsapi' ? ' is-active' : ''}`,
                  style: 'min-height:34px;padding:4px 10px;font-size:12px;',
                  text: t('streetViewModal.tabJs'),
                  onClick: () => { soundFX.playClick(); this.svModalMode = 'jsapi'; this.render(); }
                })
              : null,
            el('button', {
              class: 'btn-ghost',
              style: 'min-height:36px;',
              text: t('streetViewModal.closeBtn'),
              onClick: () => {
                soundFX.playClick();
                this.streetViewModalOpen = false;
                this.render();
                this._drainPendingToasts();
              }
            })
          ])
        ]),
        el('div', { style: 'font-size:12px;color:var(--cyan);font-weight:700;', text: statusBadge }),
        el('div', { class: 'cutscene-stage-wrap sv-modal-stage' }, [viewportNode]),
        el('div', { style: 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;' }, [
          el('span', { style: 'font-size:12.5px;color:var(--muted);', text: t('streetViewModal.tip') }),
          gm.streetViewUrl
            ? el('a', {
                class: 'btn-cyan',
                style: 'min-height:36px;padding:6px 14px;font-size:13px;text-decoration:none;display:inline-flex;align-items:center;',
                href: gm.streetViewUrl,
                target: '_blank',
                rel: 'noopener noreferrer',
                text: t('streetViewModal.openExternal')
              })
            : null
        ])
      ])
    ]);
  }

  _renderReview() {
    const persona = determinePersona(this.state);
    const role = getRole(this.state.roleId);
    const routeMeta = getLocalizedRouteMeta()[role.id];
    const s = this.state.stats;
    const hudStats = getHudStats();
    const grandmaRole = getLocalizedRoles().find((r) => r.id === 'grandma');
    const grandmaQuote = grandmaRole?.quote || '做生意跟煮飯一樣，火候到了，客人自己會來。';
    const unlockedSet = new Set(this.careerMeta?.achievements || []);
    const achStrings = t('launch.achievements') || {};
    const shareText = buildShareSummaryText({
      role,
      persona,
      state: this.state,
      meta: this.careerMeta,
      lang: getLang(),
      tFn: t
    });
    const reviewPortrait = el('img', {
      src: role.image,
      alt: role.name,
      class: 'hud-avatar',
      loading: 'lazy',
      decoding: 'async',
      onerror: (e) => { e.target.style.display = 'none'; }
    });

    return el('section', { class: 'panel review-stage' }, [
      el('div', { class: 'chapter-header review-head' }, [
        el('div', {}, [
          el('div', { class: 'gta-kicker', text: t('review.kicker', routeMeta?.routeName || role.name) }),
          el('h1', { class: 'gta-title review-title', text: persona.name }),
          el('p', { style: 'margin:4px 0 0 0;font-size:16px;color:var(--gold);', text: persona.title })
        ]),
        el('div', { class: 'review-right-head' }, [
          htmlNode('review-stamp', getTempleStampSvg()),
          el('div', { class: 'score-pill', style: 'font-size:20px;padding:8px 14px;', text: t('review.totalScore', this.state.points.toLocaleString()) })
        ])
      ]),
      el('div', { class: 'review-top-grid' }, [
        el('div', { class: 'panel', style: 'border-color:var(--cyan);' }, [
          el('div', { style: 'display:flex;align-items:center;gap:12px;margin-bottom:8px;' }, [
            reviewPortrait,
            el('div', {}, [
              el('div', { style: 'font-weight:800;font-size:17px;', text: role.name }),
              el('div', { style: 'font-size:13px;color:var(--muted);', text: t('review.scoreStats', this.state.gamesCorrectCount, this.state.gamesScoredCount, this.state.grandmaRescues) })
            ])
          ]),
          el('p', { style: 'margin:4px 0;', text: t('review.strength', persona.strength) }),
          el('p', { style: 'margin:4px 0;', text: t('review.blind', persona.blind) }),
          el('p', { style: 'color:var(--cyan);font-size:13.5px;margin:4px 0 0;', text: t('review.read', persona.read) })
        ]),
        el('div', { class: 'panel' }, [
          el('h3', { style: 'margin:0 0 8px 0;font-size:16px;', text: t('review.fiveStatsTitle') }),
          ...hudStats.map((st) => el('div', { style: 'display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:14px;' }, [
            el('span', { text: st.fullLabel || st.label }),
            el('strong', { style: 'color:var(--gold);', text: String(s[st.key]) })
          ]))
        ])
      ]),
      el('div', { class: 'panel' }, [
        el('h3', { style: 'margin:0 0 8px 0;font-size:16px;', text: t('launch.achievementsTitle') }),
        el('div', { class: 'achievements-grid' }, ACHIEVEMENT_IDS.map((id) => {
          const info = achStrings[id] || { icon: '🏆', title: id, desc: '' };
          const isUnlocked = unlockedSet.has(id);
          return el('div', { class: `ach-badge${isUnlocked ? ' is-unlocked' : ''}` }, [
            el('div', { class: 'ach-title', text: `${info.icon} ${info.title}` }),
            el('div', { class: 'ach-desc', text: info.desc })
          ]);
        }))
      ]),
      el('div', { class: 'panel share-card-panel' }, [
        el('h3', { style: 'margin:0 0 8px 0;font-size:16px;color:var(--gold);', text: t('launch.shareTitle') }),
        el('pre', { id: 'share-summary-text', class: 'share-preview', text: shareText }),
        el('div', { class: 'share-actions' }, [
          el('button', {
            type: 'button',
            class: 'btn-gold',
            text: t('launch.downloadCardBtn'),
            onClick: () => {
              soundFX.playMissionPassed();
              const dataUrl = renderResultCardCanvas({
                role,
                persona,
                state: this.state,
                meta: this.careerMeta,
                hudStats,
                tFn: t,
                portraitImg: reviewPortrait
              });
              if (dataUrl) {
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = `gta-dentsu-${role.id}-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                this._showToast(t('launch.cardDownloaded'), 'gold', 3200);
              }
            }
          }),
          el('span', { class: 'copy-wrap' }, [
            el('button', {
              type: 'button',
              class: 'btn-cyan copy-button',
              command: '--copy',
              commandfor: 'share-summary-text',
              'aria-label': t('launch.copyShareAria'),
              text: t('launch.copyShareBtn')
            }),
            el('span', { class: 'copy-tip', role: 'status' })
          ]),
          typeof navigator !== 'undefined' && typeof navigator.share === 'function'
            ? el('button', {
                type: 'button',
                class: 'btn-ghost',
                text: t('launch.nativeShareBtn'),
                onClick: () => {
                  navigator.share({
                    title: t('docTitle'),
                    text: shareText,
                    url: window.location.href
                  }).catch(() => {});
                }
              })
            : null
        ])
      ]),
      el('div', { class: 'panel' }, [
        el('h3', { style: 'margin:0 0 8px 0;font-size:16px;', text: t('review.historyTitle', role.name) }),
        el('div', { class: 'review-history-grid' }, this.state.history.map((h) => {
          const hCh = getLocalizedChapterForRole((h.chapterId || 1) - 1, this.state.roleId);
          const hRep = hCh.replies?.find((r) => r.id === h.replyId) || null;
          return el('div', { style: 'padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.05);font-size:12.5px;' }, [
            el('div', { style: 'font-weight:800;color:var(--cyan);', text: t('review.stationMeta', hCh.year || h.year, hCh.timeSlot || h.timeSlot || '', hCh.title || h.title) }),
            (hCh.location || h.location) ? el('div', { style: 'font-size:11.5px;color:var(--muted);margin-bottom:2px;', text: `📍 ${hCh.location || h.location}` }) : null,
            el('div', { text: t('review.repliedPrefix', hRep?.text || h.replyText) }),
            el('div', { style: 'color:var(--gold);', text: `${h.correct ? t('review.correctTag') : t('review.triedTag')} · +$${h.pointsEarned.toLocaleString()}` })
          ]);
        }))
      ]),
      el('div', { class: 'review-actions', style: 'display:flex;flex-wrap:wrap;gap:10px;' }, [
        el('button', {
          class: 'btn-primary',
          text: t('review.playAnotherBtn'),
          onClick: () => this._resetGame()
        }),
        el('button', {
          class: 'btn-gold',
          text: t('review.scooterRecordBtn'),
          onClick: () => this._openScooterModal()
        }),
        el('button', {
          class: 'btn-cyan',
          'data-voice': 'grandma',
          text: t('review.closingBlessingBtn'),
          onClick: () => soundFX.speak(grandmaQuote, 'grandma', true, 'grandma:quote')
        })
      ])
    ]);
  }

  _renderBottomGuideBar() {
    let text = t('guideBar.defaultText');
    const actions = [];

    if (this.streetViewModalOpen) {
      text = t('guideBar.svText');
      actions.push(
        el('button', {
          class: 'guide-btn is-primary',
          text: t('guideBar.svClose'),
          onClick: () => {
            this.streetViewModalOpen = false;
            this.render();
          }
        })
      );
    } else if (this.scooterModalOpen) {
      text = t('guideBar.scooterText');
      actions.push(
        el('button', { class: 'guide-btn', text: t('guideBar.scooterLeft'), onClick: () => this.scooterInstance && this.scooterInstance.moveLane(-1) }),
        el('button', { class: 'guide-btn', text: t('guideBar.scooterRight'), onClick: () => this.scooterInstance && this.scooterInstance.moveLane(1) }),
        el('button', { class: 'guide-btn is-primary', text: t('guideBar.scooterEnd'), onClick: () => this._closeScooterModal(false) })
      );
    } else if (this.ch6CallModalOpen) {
      text = t('guideBar.ch6Text');
      actions.push(
        el('button', {
          class: 'guide-btn is-primary',
          text: t('guideBar.ch6Accept'),
          onClick: () => this._acceptGrandmaCall()
        })
      );
    } else if (this.state.phase === 'title') {
      text = t('guideBar.titleText');
      actions.push(
        el('button', {
          class: 'guide-btn',
          text: t('guideBar.titleTour'),
          onClick: (e) => this._openWelcomeTour(0, e.currentTarget)
        })
      );
    } else if (this.state.phase === 'role') {
      text = t('guideBar.roleText');
      actions.push(
        el('button', {
          class: 'guide-btn',
          text: t('guideBar.roleTour'),
          onClick: (e) => this._startHudTour('role', e.currentTarget)
        }),
        el('button', {
          class: 'guide-btn',
          text: this.state.grandmaUnlocked ? t('guideBar.roleUnlocked') : t('guideBar.roleUnlockBtn'),
          onClick: () => this._triggerCheatCode(true)
        }),
        el('button', {
          class: 'guide-btn',
          text: t('guideBar.roleBack'),
          onClick: () => this._setState({ ...this.state, phase: 'title' })
        })
      );
    } else if (this.state.phase === 'cutscene') {
      text = t('guideBar.cutsceneText');
      actions.push(
        el('button', {
          class: 'guide-btn is-primary',
          text: t('guideBar.cutsceneSkip'),
          onClick: () => this._leaveCutscene()
        })
      );
    } else if (this.state.phase === 'scene') {
      const role = getRole(this.state.roleId);
      text = t('guideBar.sceneText');
      actions.push(
        el('button', {
          class: 'guide-btn',
          text: t('guideBar.sceneTour'),
          onClick: (e) => this._startHudTour('scene', e.currentTarget)
        }),
        el('button', { class: 'guide-btn', text: t('guideBar.sceneAsk'), onClick: () => this._focusHelper('phone', 'people', 'lisa') }),
        el('button', { class: 'guide-btn', text: t('guideBar.sceneGrandma'), onClick: () => this._focusHelper('phone', 'grandma') }),
        el('button', {
          class: 'guide-btn is-primary',
          disabled: this.state.roleSpecialUsedThisChapter,
          text: this.state.roleSpecialUsedThisChapter ? t('guideBar.skillDone', role.specialName) : t('guideBar.skillReady', role.specialName),
          onClick: () => {
            soundFX.playMissionPassed();
            this._setState(useRoleSpecial(this.state));
            this._showToast(t('launch.toastSkillUsed', role.specialName), 'info', 3000);
          }
        })
      );
    } else if (this.state.phase === 'game') {
      const ch = getCurrentChapter(this.state);
      const g = ch.game;
      if (g?.type === 'pick' || g?.type === 'agent') {
        text = t('guideBar.gamePick');
      } else if (g?.type === 'slider') {
        text = t('guideBar.gameSlider');
      } else if (g?.type === 'swipe') {
        text = t('guideBar.gameSwipe', g.cards.length);
      } else if (g?.type === 'multi') {
        text = t('guideBar.gameMulti');
      } else if (g?.type === 'stop') {
        text = t('guideBar.gameStop');
      }
      actions.push(
        el('button', { class: 'guide-btn', text: t('guideBar.gameClue'), onClick: () => this._focusHelper('clue') }),
        el('button', { class: 'guide-btn', text: t('guideBar.gameAsk'), onClick: () => this._focusHelper('phone', 'people', 'cindy') }),
        el('button', { class: 'guide-btn', text: t('guideBar.gameGrandma'), onClick: () => this._triggerCheatCode(true) })
      );
    } else if (this.state.phase === 'reveal') {
      const hasNext = this.state.chapterIndex < CHAPTERS.length - 1;
      text = hasNext
        ? t('guideBar.revealNext')
        : t('guideBar.revealLast');
      actions.push(
        el('button', { class: 'guide-btn', text: t('guideBar.revealScooter'), onClick: () => this._openScooterModal() }),
        el('button', {
          class: 'guide-btn is-primary',
          text: hasNext ? t('guideBar.revealNextBtn') : t('guideBar.revealReviewBtn'),
          onClick: () => {
            soundFX.playClick();
            this._setState(advanceChapter(this.state));
          }
        })
      );
    } else if (this.state.phase === 'review') {
      text = t('guideBar.reviewText');
      actions.push(
        el('button', { class: 'guide-btn', text: t('guideBar.reviewScooter'), onClick: () => this._openScooterModal() }),
        el('button', { class: 'guide-btn is-primary', text: t('guideBar.reviewReplay'), onClick: () => this._resetGame() })
      );
    }

    const modalOpen = Boolean(this.scooterModalOpen || this.streetViewModalOpen || this.ch6CallModalOpen);
    const isPlayPhase = !modalOpen && ['scene', 'game', 'reveal'].includes(this.state.phase);
    const showMobileTabs = isPlayPhase && Boolean(this.layout?.useMobileTabs);
    const mobileTabBar = showMobileTabs
      ? el('nav', { class: 'mobile-tab-bar', role: 'tablist', 'aria-label': t('mobile.tabAria') }, [
          ['mission', t('mobile.tabMission')],
          ['scene', t('mobile.tabScene')],
          ['phone', t('mobile.tabPhone')],
          ['intel', t('mobile.tabIntel')]
        ].map(([id, label]) => el('button', {
          type: 'button',
          role: 'tab',
          'aria-selected': String(this.mobilePanel === id),
          class: `mobile-tab-btn${this.mobilePanel === id ? ' is-active' : ''}`,
          'data-mobile-tab': id,
          text: label,
          onClick: () => {
            soundFX.playClick();
            this.mobilePanel = id;
            this.mobileHudExpanded = false;
            this.render();
            if (!this.layout?.isDesktopLocked) {
              window.scrollTo({ top: 0, behavior: 'instant' });
            }
          }
        })))
      : null;

    return el('div', {
      class: `bottom-guide-bar${modalOpen ? ' is-modal-hidden' : ''}${showMobileTabs ? ' has-mobile-tabs' : ''}`,
      role: 'region',
      'aria-label': t('guideBar.aria')
    }, [
      el('div', { class: 'guide-main' }, [
        el('span', { class: 'guide-badge', text: t('guideBar.badge') }),
        el('span', { class: 'guide-text', text })
      ]),
      el('div', { class: 'guide-actions' }, actions),
      mobileTabBar
    ]);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('app');
  if (root) {
    window.__gtaApp = new GtaDentsuApp(root);
  }
});
