// 主介面控制器：GTA 6 × 台灣街頭工藝《決策智慧：電通台灣一日風雲》（Diegetic Game HUD）
import { ROLES, PEOPLE_MODEL_TWINS, GRANDMA_QUIPS, GTA6_TAIWAN_ANALYSIS, CHAPTERS, SCOOTER_CONFIG } from './story-data.js';
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
  submitMiniGame,
  completeScooterRun,
  advanceChapter,
  determinePersona
} from './game-engine.js';
import { GrandmaScooterGame } from './scooter-minigame.js';
import { RADIO_STATIONS, soundFX } from './audio-fx.js';
import { SVG_GTA_TAIWAN_CREST, SVG_IRON_GRILLE_CORNER, SVG_TEMPLE_STAMP_PASSED, SVG_IFRUIT_CHASSIS_TOP, SVG_RADAR_COMPASS_RING, SVG_ROAD_SIGN_BADGE, getStatIconSvg, SVG_TESLA_FSD_HUD_OVERLAY, SVG_FUBON_A25_WIKI_BLUEPRINT } from './ui-graphics.js';

const STORAGE_KEY = 'gta_dentsu_taiwan_v1';

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

    // 全螢幕動態場景氛圍背景（放在 #app 之外，render 時只換圖）
    this.backdrop = el('div', { class: 'ambient-backdrop', 'aria-hidden': 'true' });
    this.veil = el('div', { class: 'ambient-veil', 'aria-hidden': 'true' });
    document.body.prepend(this.veil);
    document.body.prepend(this.backdrop);

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

  // 章節剛進入時溫和朗讀一次（以 chapterIndex:phase 去重，re-render 不會重唸）
  _speakOnce(key, text, roleKey) {
    if (this._lastSpokenChapterPhase === key) return;
    this._lastSpokenChapterPhase = key;
    if (soundFX.voiceEnabled && !this.muted) soundFX.speak(text, roleKey);
  }

  _onPhaseEnter() {
    const phase = this.state.phase;
    if (phase !== 'scene' && phase !== 'reveal') return;
    if (this.scooterModalOpen || this.ch6CallModalOpen) return;
    const ch = getCurrentChapter(this.state);
    const key = `${this.state.chapterIndex}:${phase}`;
    if (this._lastSpokenChapterPhase === key) return;
    if (phase === 'scene') {
      this._speakOnce(key, ch.lineMessage, 'boss');
    } else {
      if (!this.muted) soundFX.playStampImpact();
      this._speakOnce(key, ch.takeaway, 'narrator');
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
      el('p', {
        class: 'gta-subtitle',
        text: '08:30 從台北橋殺進信義區松仁路「富邦 A25 電通大樓」，對面就是旋轉地標「陶朱隱園」與 101。九本《決策智慧》濃縮成十個高壓時段，看你怎麼用真實判斷力破局！'
      }),
      el('div', { class: 'hero-badges' }, [
        el('span', { class: 'pill', text: '🛵 10 個台北代理商一日時段' }),
        el('span', { class: 'pill', text: '🧠 People Model（Lisa & Cindy）' }),
        el('span', { class: 'pill', text: '📻 3 台 GTA 車載電台' }),
        el('span', { class: 'pill', text: '🎙️ 台灣語音播報' }),
        el('span', { class: 'pill pill-gold', text: this.state.grandmaUnlocked ? '👵 隱藏阿嬤已解鎖 ✓' : '👵 隱藏阿嬤模組' })
      ]),
      this.state.grandmaUnlocked
        ? el('div', { class: 'rescue-toast', style: 'font-size:13.5px;padding:6px 10px;', text: '🍲 秘技 AMA666 已啟動！隱藏第 5 角色「滿級皇太后・台灣阿嬤」解鎖完成，請點下方打卡上班！' })
        : null,
      el('div', { class: 'plate-box' }, [
        el('span', { class: 'plate-label', text: '台灣秘技車牌 AMA-666' }),
        this._renderCheatInput()
      ]),
      el('div', { class: 'hero-actions' }, [
        el('button', {
          class: 'btn-primary',
          text: '打卡上班：選你的電通職能 ➔',
          onClick: () => this._startShift()
        }),
        el('button', {
          class: 'btn-gold',
          text: '🛵 試駕 2026 電車 × Tesla FSD',
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
        el('div', { class: 'gta-kicker', text: 'STEP 1 · 領取松仁路富邦 A25 電通台灣識別證' }),
        el('h2', { text: '2026 早安信義區：今天你以哪個職能走進富邦 A25？' })
      ]),
      el('div', { class: 'cheat-bar' }, [
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
      const cls = `role-card${role.id === 'grandma' ? ' is-grandma' : ''}${locked ? ' is-locked' : ''}`;
      return el('button', {
        class: cls,
        disabled: locked,
        onClick: () => {
          soundFX.playMissionPassed();
          this.phoneTab = 'line';
          const nextState = selectRole(this.state, role.id);
          this._setState(nextState);
          if (role.id === 'grandma' && nextState.phase !== 'cutscene') {
            soundFX.speak(role.quote, 'grandma', false);
          }
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
          el('span', {
            class: 'role-badge-float',
            style: `color:${role.color};`,
            text: locked ? '🔒 輸入 AMA666 解鎖' : role.badge
          })
        ]),
        el('div', { class: 'role-info' }, [
          el('h3', { style: `color:${role.color};`, text: role.name }),
          el('p', { class: 'role-dept', text: `${role.dept} · ${role.title}` }),
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
                  text: '🔊 試聽春枝名言',
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
          ))
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
        el('div', { class: 'meter-box', style: `--seg:${m.color};` }, [
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
        el('button', {
          class: 'hud-btn',
          text: '↺ 重開',
          onClick: () => {
            if (window.confirm('確定要重開？目前進度會清除。')) this._resetGame();
          }
        })
      ])
    ]);
  }

  _renderCutsceneStage() {
    const ch = getCurrentChapter(this.state);
    const src = this.activeCutsceneSrc || ch.cutscene;
    const isGrandmaVideo = String(src).includes('grandma');
    const subtitleText = isGrandmaVideo
      ? '阿嬤：「你們先不要亂砍預算，阿嬤帶大同電鍋趕過去了！」'
      : `${ch.lineSender.name}：「${ch.lineMessage}」`;

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
          el('div', { class: 'gta-kicker', text: isGrandmaVideo ? 'HIGGSFIELD CUTSCENE · 阿嬤緊急支援' : `HIGGSFIELD CUTSCENE · ${ch.timeSlot}` }),
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
          el('button', { class: 'btn-primary', text: '進入現場 ➔', onClick: () => this._leaveCutscene() })
        ])
      ]),
      el('div', { class: 'cutscene-stage-wrap' }, [
        videoEl,
        unlockBtn,
        el('div', { class: 'cutscene-subtitle', text: subtitleText })
      ]),
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
    else if (!isIframe) subtitleText = `${ch.lineSender.name}：「${ch.lineMessage}」`;

    const [roadZh, roadEn] = this._roadParts(ch);
    const setMode = (m, extra) => () => {
      soundFX.playClick();
      this.sceneViewMode = m;
      if (extra) extra();
      this.render();
    };
    const chip = (m, text, extra) => el('button', {
      class: `mode-chip${mode === m ? ' is-active' : ''}`,
      text,
      onClick: setMode(m, extra)
    });

    const viewport = el('div', { class: 'scene-media-viewport' }, [
      media,
      this.fsdHudOverlay && !isIframe ? htmlNode('scene-fsd', SVG_TESLA_FSD_HUD_OVERLAY) : null,
      subtitleText ? el('div', { class: 'scene-subtitle', text: subtitleText }) : null
    ]);

    return el('div', { class: 'panel scene-card' }, [
      el('div', { class: 'tex', style: 'background-image:url(./public/images/ui-begonia-glass.webp);', 'aria-hidden': 'true' }),
      htmlNode('grille tl', SVG_IRON_GRILLE_CORNER),
      htmlNode('grille tr', SVG_IRON_GRILLE_CORNER),
      // Track 1：路牌狀態列（獨立空間）
      el('div', { class: 'track-status' }, [
        htmlNode('track-sign', SVG_ROAD_SIGN_BADGE(roadZh, roadEn)),
        el('div', { class: 'track-right' }, [
          htmlNode('track-a25', SVG_FUBON_A25_WIKI_BLUEPRINT),
          el('span', { class: 'time-tag', text: `${ch.timeSlot} · ${ch.book}` })
        ])
      ]),
      // Track 2：純淨 16:9 視景
      viewport,
      // Track 3：雙列控制列（固定不折 3 排）
      el('div', { class: 'track-controls' }, [
        el('div', { class: 'ctl-row', role: 'group', 'aria-label': '視景模式' }, [
          chip('gta', '🎬 3D劇照'),
          chip('gmap_360', '🌐 360°街景', () => this._lookupLivePano(ch)),
          chip('gmap_photo', '🏛️ A25實拍'),
          chip('gmap_live', '🛰️ 衛星圖'),
          el('button', {
            class: `mode-chip${this.fsdHudOverlay ? ' is-active' : ''}`,
            'aria-pressed': String(this.fsdHudOverlay),
            title: '開關 Tesla FSD 疊加 HUD',
            text: '🤖 Tesla FSD',
            onClick: () => this._toggleFsd(ch)
          }),
          el('button', {
            class: 'mode-chip',
            title: '放大開啟 Google Maps 360° 實景視窗',
            text: '🧭 放大街景',
            onClick: () => {
              soundFX.playClick();
              this.streetViewModalOpen = true;
              this._lookupLivePano(ch);
              this.render();
            }
          })
        ]),
        el('div', { class: 'ctl-row', role: 'group', 'aria-label': '捷徑' }, [
          el('button', { class: 'hotspot-chip', title: '查看你的專屬桌上線索', text: '🕵️ 線索', onClick: () => this._focusHelper('clue') }),
          el('button', { class: 'hotspot-chip', title: '問 Lisa / Cindy 真心話', text: '🧠 問同事', onClick: () => this._focusHelper('phone', 'people', 'lisa') }),
          el('button', { class: 'hotspot-chip is-scooter', title: '騎 2026 電動車／Tesla FSD 衝松高路富邦 A25 加分', text: '🛵 2026騎車', onClick: () => this._openScooterModal() }),
          el('button', {
            class: 'hotspot-chip',
            'data-voice': 'narrator',
            title: '朗讀現場旁白',
            text: '🎙️ 聽旁白',
            onClick: () => { soundFX.playClick(); soundFX.speak(ch.sceneDesc, 'narrator', true); }
          }),
          ch.cutscene
            ? el('button', {
                class: 'hotspot-chip',
                text: '🎬 重播動畫',
                onClick: () => {
                  this.activeCutsceneSrc = ch.cutscene;
                  this._setState({ ...this.state, phase: 'cutscene' });
                }
              })
            : null
        ])
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
              text: '🔊 聽春枝阿嬤',
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
    const svgNS = 'http://www.w3.org/2000/svg';
    const route = document.createElementNS(svgNS, 'svg');
    route.setAttribute('viewBox', '0 0 100 100');
    route.setAttribute('preserveAspectRatio', 'none');
    route.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;');
    const line = document.createElementNS(svgNS, 'polyline');
    line.setAttribute('points', RADAR_POS.map((p) => `${p[0]},${p[1]}`).join(' '));
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', 'rgba(255,79,163,0.55)');
    line.setAttribute('stroke-width', '1.4');
    line.setAttribute('stroke-dasharray', '3 2');
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    route.appendChild(line);

    const dots = CHAPTERS.map((c, i) => {
      const p = RADAR_POS[i] || [50, 50];
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
        el('span', { class: 'radar-tag', text: '2026 松仁路 · 富邦A25 ⇄ 陶朱隱園' })
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
        el('div', { style: 'font-size:12px;color:var(--gold);font-weight:800;', text: '🎙️ VoAI 聲優「春枝」台味配音' }),
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
    for (const c of CHAPTERS) {
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
      { id: 'scene', label: '① 看現場＆同事線索' },
      { id: 'reply', label: '② 點選 LINE 回覆老闆' },
      { id: 'game', label: '③ 現場實務操作' },
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

    const header = el('div', { class: 'chapter-header' }, [
      el('div', {}, [
        el('div', { class: 'gta-kicker', text: `${ch.timeSlot} · ${ch.book} · 《${ch.title}》` }),
        el('h2', { text: ch.location })
      ]),
      el('div', { class: 'pill', text: `第 ${ch.id}／10 站` })
    ]);

    const stepFlow = this._renderStepFlow(phase);
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
      return el('main', { class: 'panel main-stage' }, [
        header,
        stepFlow,
        rescueBanner,
        el('p', { class: 'chapter-desc', text: ch.sceneDesc }),
        el('div', { class: 'boss-callout line-banner' }, [
          el('div', {}, [
            el('div', { class: 'boss-meta', text: `📩 ${ch.lineSender.name}（${ch.lineSender.role}）剛剛傳 LINE 給你：` }),
            el('div', { text: `「${ch.lineMessage}」` })
          ]),
          el('button', {
            class: 'replay-btn',
            'data-voice': 'boss',
            text: '🔊 聽老闆語音',
            onClick: () => soundFX.speak(ch.lineMessage, 'boss', true)
          })
        ]),
        el('div', { class: 'prompt-line', text: '👆 請直接點擊下方 4 個真實臨場回覆之一（或按鍵盤 1–4 快捷鍵）：' }),
        el('div', { class: 'replies-grid' }, ch.replies.map((r, idx) =>
          el('button', {
            class: 'reply-btn',
            onClick: () => this._pickReply(idx)
          }, [
            el('span', { class: 'reply-key', text: String(idx + 1) }),
            el('span', { text: r.text })
          ])
        ))
      ]);
    }

    if (phase === 'game') {
      return el('main', { class: 'panel main-stage' }, [
        header,
        stepFlow,
        rescueBanner,
        this.state.activeReply
          ? el('div', { style: 'padding:8px 12px;border-radius:10px;background:rgba(255,255,255,0.06);font-size:15px;color:#e0d6f7;', text: `你剛剛回：「${this.state.activeReply.text}」➔ ${this.state.activeReply.feedback}` })
          : null,
        this._renderMiniGame(ch.game)
      ]);
    }

    // phase === 'reveal'
    const out = this.state.lastGameOutcome || { scored: false, correct: true, detail: '', pointsEarned: 0 };
    const badgeText = out.scored ? (out.correct ? '🎯 識破迷霧！' : '💡 差一點（參與分照拿）') : '✅ 完成情境實測';
    return el('main', { class: 'panel main-stage' }, [
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
          text: '🔊 聽春枝阿嬤配音',
          onClick: () => soundFX.speak(ch.grandmaQuip, 'grandma', true)
        })
      ]),
      el('div', { class: 'reveal-actions' }, [
        el('button', {
          class: 'btn-gold',
          text: '🛵 騎2026電動車衝一波加分',
          onClick: () => this._openScooterModal()
        }),
        el('button', {
          class: 'btn-primary',
          text: this.state.chapterIndex === CHAPTERS.length - 1 ? '查看終局考績與稱號 ➔' : `進入下一時段（${CHAPTERS[this.state.chapterIndex + 1].timeSlot}）➔`,
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
    const reviewSpeech = `恭喜完成十個時段！你的終局稱號是${persona.name}，${persona.title}。強項：${persona.strength}。總積分${this.state.points}元。`;

    return el('section', { class: 'panel review-stage' }, [
      el('div', { class: 'chapter-header review-head' }, [
        el('div', {}, [
          el('div', { class: 'gta-kicker', text: 'MISSION PASSED · 電通台灣十年一日考績結算' }),
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
        el('h3', { style: 'margin:0 0 8px 0;font-size:16px;', text: '今日 10 大時段決策戰報' }),
        el('div', { class: 'review-history-grid' }, this.state.history.map((h) =>
          el('div', { style: 'padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.05);font-size:12.5px;' }, [
            el('div', { style: 'font-weight:800;color:var(--cyan);', text: `${h.year} · ${h.title}` }),
            el('div', { text: `回覆：${h.replyText}` }),
            el('div', { style: 'color:var(--gold);', text: `${h.correct ? '✓ 識破' : '• 參與'} · +$${h.pointsEarned.toLocaleString()}` })
          ])
        ))
      ]),
      el('div', { class: 'review-actions', style: 'display:flex;flex-wrap:wrap;gap:10px;' }, [
        el('button', {
          class: 'btn-primary',
          text: '換個電通職能再玩一天 ↻',
          onClick: () => this._resetGame()
        }),
        el('button', {
          class: 'btn-gold',
          text: '👵 騎阿嬤電動車破紀錄',
          onClick: () => this._openScooterModal()
        }),
        el('button', {
          class: 'btn-cyan',
          'data-voice': 'narrator',
          text: '🔊 朗讀十年考績評語',
          onClick: () => soundFX.speak(reviewSpeech, 'narrator', true)
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
      text = '👋 操作指示：先點「打卡上班」挑選電通台灣職能（或先試騎阿嬤買菜電動車）；輸入 AMA666 可解鎖第 5 位阿嬤角色！';
      actions.push(
        el('button', {
          class: 'guide-btn is-primary',
          text: '打卡上班選職能 ➔',
          onClick: () => {
            soundFX.playScooterHorn();
            soundFX.startBGM();
            this._setState({ ...this.state, phase: 'role' });
          }
        }),
        el('button', {
          class: 'guide-btn',
          text: '👵 一鍵解鎖 AMA666',
          onClick: () => this._triggerCheatCode(true)
        })
      );
    } else if (this.state.phase === 'role') {
      text = '🪪 操作指示：直接點擊 5 張電通識別證卡片之一就能進富邦 A25 上班；第 5 張阿嬤卡可按右上或下方「一鍵解鎖 AMA666」開啟！';
      actions.push(
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
      text = '🎬 操作指示：正在播放 2026 台北實景過場動畫（含人物配音與環境音效），隨時可點「進入現場」或按 Space / Enter 直接開工！';
      actions.push(
        el('button', {
          class: 'guide-btn is-primary',
          text: '⏭️ 進入現場 (Space / Enter) ➔',
          onClick: () => this._leaveCutscene()
        })
      );
    } else if (this.state.phase === 'scene') {
      const role = getRole(this.state.roleId);
      text = '📩 操作指示：先看左側「桌上線索」與手機 Lisa/Cindy 讀心術，再點擊右側 4 個臨場回覆之一（或按鍵盤 1–4）回老闆 LINE！';
      actions.push(
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
        text = '📄 操作指示：點擊上方任一選項卡片（或按鍵盤 1–4）立即拍板送出！';
      } else if (g?.type === 'slider') {
        text = '🎛️ 操作指示：拖曳數值滑桿或直接點快速刻度按鈕，接著按「鎖定這個數字」(或 Enter)！';
      } else if (g?.type === 'swipe') {
        text = `👆 操作指示：點選卡片左／右半或下方按鈕判斷（也可用鍵盤 ⬅ / ➡），完成 ${g.cards.length} 題實測！`;
      } else if (g?.type === 'multi') {
        text = '☑️ 操作指示：點擊卡片（或按 1–4）可複選多個項目，確認後按「送出複選審計」(或 Enter)！';
      } else if (g?.type === 'stop') {
        text = '🚨 操作指示：緊盯新客比例下跌紅線！看好時機點擊紅色「緊急煞車」按鈕（或按 Space / Enter）！';
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
