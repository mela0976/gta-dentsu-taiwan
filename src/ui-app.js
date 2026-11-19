// 主介面控制器：GTA 6 台灣風格《決策智慧：電通台灣一日風雲》
import { ROLES, PEOPLE_MODEL_TWINS, GRANDMA_QUIPS, CHAPTERS, SCOOTER_CONFIG } from './story-data.js';
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
import { soundFX } from './audio-fx.js';

const STORAGE_KEY = 'gta_dentsu_taiwan_v1';

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

class GtaDentsuApp {
  constructor(root) {
    this.root = root;
    this.state = this._loadState();
    this.phoneTab = 'line'; // 'line' | 'people' | 'grandma'
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

    window.addEventListener('keydown', (e) => this._handleGlobalKey(e));
    this.render();
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
    this.state = next;
    this._saveState();
    this.render();
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

    if (this.scooterModalOpen || this.ch6CallModalOpen) return;

    const ch = getCurrentChapter(this.state);

    // 過場動畫 / 復盤頁支援 Enter / Space 快速前進
    if (e.key === 'Enter' || e.key === ' ') {
      if (this.state.phase === 'cutscene') {
        e.preventDefault();
        this.activeCutsceneSrc = null;
        soundFX.playLinePing();
        this._setState(finishCutscene(this.state));
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
    soundFX.playTatungCooker();
    this._setState(activateGrandmaCheat(this.state, withRescue));
  }

  _toggleMute() {
    this.muted = !this.muted;
    soundFX.setMuted(this.muted);
    this.render();
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
      soundFX.playTatungCooker();
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
    this.scooterModalOpen = true;
    soundFX.playScooterHorn();
    this.render();
  }

  _closeScooterModal(aborted = true) {
    if (this.scooterInstance) {
      this.scooterInstance.stop(aborted);
      this.scooterInstance = null;
    }
    this.scooterModalOpen = false;
    this.render();
  }

  render() {
    this.root.innerHTML = '';

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
    if (this.scooterModalOpen) {
      this.root.appendChild(this._renderScooterModal());
    }
    this.root.appendChild(this._renderBottomGuideBar());
  }

  _renderTitle() {
    const heroMedia = el('div', { class: 'hero-media' }, [
      el('img', {
        src: './public/images/scene-morning-scooter.webp',
        alt: '2026 台北信義區松仁路富邦 A25 電通大樓與陶豬隱園 GTA 6 主視覺',
        onerror: (e) => { e.target.style.display = 'none'; }
      })
    ]);

    const body = el('div', { class: 'hero-body' }, [
      el('div', { class: 'gta-kicker', text: 'DENTSU TAIWAN 富邦 A25 × 決策智慧 2018–2026' }),
      el('h1', { class: 'gta-title', text: 'GRAND THEFT AGENCY\n電通台灣一日風雲' }),
      el('p', {
        class: 'gta-subtitle',
        text: '08:30 從台北橋殺進信義區松仁路「富邦 A25 電通大樓」，對面就是旋轉地標「陶豬隱園」與 101。九本《決策智慧》濃縮成十個高壓時段，看你怎麼用真實判斷力破局！'
      }),
      el('div', { class: 'hero-badges' }, [
        el('span', { class: 'pill', text: '🛵 10 個台北代理商一日時段' }),
        el('span', { class: 'pill', text: '🧠 People Model（Lisa & Cindy）' }),
        el('span', { class: 'pill pill-gold', text: '👵 隱藏阿嬤模組（AMA666）' }),
        el('span', { class: 'pill', text: '🎬 Higgsfield 實景過場動畫' })
      ]),
      el('div', { class: 'hero-actions' }, [
        el('button', {
          class: 'btn-primary',
          text: '打卡上班：選你的電通職能 ➔',
          onClick: () => {
            soundFX.playScooterHorn();
            soundFX.startBGM();
            this._setState({ ...this.state, phase: 'role' });
          }
        }),
        el('button', {
          class: 'btn-gold',
          text: '🛵 先試騎：阿嬤買菜電動車',
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
      el('div', { class: 'cheat-bar' }, [
        el('span', { style: 'font-size:13px;color:var(--muted);', text: 'GTA 台灣秘技碼（試試輸入 AMA666）：' }),
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
    const btn = el('button', {
      class: 'btn-ghost',
      text: '發動秘技',
      onClick: () => {
        const val = input.value.trim().toUpperCase();
        if (val === CHEAT_CODE || val === 'GRANDMA') {
          this._triggerCheatCode(true);
        } else {
          soundFX.playClick();
          input.value = '';
          input.placeholder = '提示: AMA666';
        }
      }
    });
    return el('div', { class: 'cheat-bar' }, [input, btn]);
  }

  _renderRoleSelect() {
    const topBar = el('div', { class: 'panel role-topbar' }, [
      el('div', {}, [
        el('div', { class: 'gta-kicker', text: 'STEP 1 · 領取松仁路富邦 A25 電通台灣識別證' }),
        el('h2', { style: 'margin:4px 0 0 0;font-size:clamp(18px,2.2vw,24px);', text: '2026 早安信義區：今天你以哪個職能走進富邦 A25？' })
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

    const grid = el('div', { class: 'role-grid' }, ROLES.map((role) => {
      const locked = role.id === 'grandma' && !this.state.grandmaUnlocked;
      const cls = `role-card${role.id === 'grandma' ? ' is-grandma' : ''}${locked ? ' is-locked' : ''}`;
      return el('button', {
        class: cls,
        disabled: locked,
        onClick: () => {
          soundFX.playMissionPassed();
          this.phoneTab = 'line';
          this._setState(selectRole(this.state, role.id));
        }
      }, [
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
          el('p', { style: 'font-weight:700;color:#efeafd;', text: `${role.dept} · ${role.title}` }),
          el('p', { text: `「${role.quote}」` }),
          el('p', { style: 'font-size:13px;color:var(--cyan);', text: `⚡ 絕招：${role.specialName}` }),
          el('div', { class: 'mini-stats' }, [
            el('span', { text: `🔥 肝指數 ${role.startingStats.stamina}` }),
            el('span', { text: `🎤 嘴砲力 ${role.startingStats.streetCred}` }),
            el('span', { text: `📈 真增量 ${role.startingStats.realLift}` }),
            el('span', { text: `🛡️ 衡斷力 ${role.startingStats.judgment}` })
          ])
        ])
      ]);
    }));

    return el('div', { class: 'role-select-wrap' }, [topBar, grid]);
  }

  _renderHud() {
    const role = getRole(this.state.roleId);
    const ch = getCurrentChapter(this.state);
    const s = this.state.stats;

    const meters = [
      { label: '肝指數', val: s.stamina, color: '#4ade80' },
      { label: '嘴砲力', val: s.streetCred, color: '#ff9e2c' },
      { label: '真增量', val: s.realLift, color: '#00e5ff' },
      { label: '品牌信任', val: s.brandTrust, color: '#ff52b8' },
      { label: '衡斷力', val: s.judgment, color: '#ffd166' }
    ];

    const starsText = '★'.repeat(this.state.wantedStars) + '☆'.repeat(Math.max(0, 5 - this.state.wantedStars));

    return el('header', { class: 'hud-bar' }, [
      el('div', { class: 'hud-identity' }, [
        el('img', {
          class: 'hud-avatar',
          src: role.image,
          alt: role.name,
          onerror: (e) => { e.target.style.display = 'none'; }
        }),
        el('div', {}, [
          el('div', { class: 'hud-time', text: `${ch.timeSlot} · 第 ${ch.id}／10 站 · ${ch.year} 年鑑` }),
          el('div', { class: 'hud-name', text: `${role.name}｜${ch.location}` })
        ])
      ]),
      el('div', { class: 'hud-meters' }, meters.map((m) =>
        el('div', { class: 'meter-box' }, [
          el('div', { class: 'meter-label' }, [
            el('span', { text: m.label }),
            el('span', { text: String(m.val) })
          ]),
          el('div', { class: 'meter-track' }, [
            el('div', { class: 'meter-fill', style: `width:${m.val}%;background:${m.color};` })
          ])
        ])
      )),
      el('div', { class: 'hud-right' }, [
        el('div', {
          class: `wanted-box${this.state.wantedStars >= 4 ? ' is-hot' : ''}`,
          title: '慣老闆／CFO 炎上通緝星級（滿 5 星觸發阿嬤電鍋救援）',
          text: `通緝 ${starsText}`
        }),
        el('div', { class: 'score-pill', text: `$${this.state.points.toLocaleString()}` }),
        el('button', {
          class: 'btn-gold',
          style: 'min-height:40px;padding:6px 12px;font-size:14px;',
          text: '🛵 買菜車',
          onClick: () => this._openScooterModal()
        }),
        el('button', {
          class: 'btn-ghost',
          style: 'min-height:40px;padding:6px 12px;font-size:14px;',
          text: this.muted ? '🔇' : '🔊',
          'aria-label': '切換音效',
          onClick: () => this._toggleMute()
        })
      ])
    ]);
  }

  _renderCutsceneStage() {
    const ch = getCurrentChapter(this.state);
    const src = this.activeCutsceneSrc || ch.cutscene;
    const isGrandmaVideo = String(src).includes('grandma');

    const videoEl = el('video', {
      class: 'cutscene-video',
      src,
      autoplay: 'true',
      loop: 'true',
      muted: 'true',
      playsinline: 'true',
      controls: 'true',
      onerror: (e) => {
        e.target.style.display = 'none';
      }
    });

    const proceed = () => {
      this.activeCutsceneSrc = null;
      soundFX.playLinePing();
      this._setState(finishCutscene(this.state));
    };

    return el('section', { class: 'panel', style: 'display:flex;flex-direction:column;gap:14px;border-color:var(--gold);' }, [
      el('div', { class: 'chapter-header' }, [
        el('div', {}, [
          el('div', { class: 'gta-kicker', text: isGrandmaVideo ? 'HIGGSFIELD CUTSCENE · 阿嬤緊急支援' : `HIGGSFIELD CUTSCENE · ${ch.timeSlot}` }),
          el('h2', { style: 'margin:4px 0 0 0;', text: `${ch.title} — ${ch.location}` })
        ]),
        el('button', { class: 'btn-primary', text: '進入現場 ➔', onClick: proceed })
      ]),
      el('div', { class: 'cutscene-stage-wrap' }, [
        videoEl,
        el('div', { class: 'cutscene-subtitle', text: `${ch.lineSender.name}：「${ch.lineMessage}」` })
      ]),
      el('p', { class: 'chapter-desc', text: ch.sceneDesc })
    ]);
  }

  _renderPlayGrid() {
    return el('div', { class: 'play-grid' }, [
      this._renderSideColumn(),
      this._renderMainStage()
    ]);
  }

  _renderSideColumn() {
    const ch = getCurrentChapter(this.state);
    const role = getRole(this.state.roleId);
    const clue = ch.roleClues[role.id] || ch.roleClues.planner;

    // 1. 2026 台北場景主視覺卡＋真實世界場景互動熱點
    const sceneCard = el('div', { class: 'panel scene-card' }, [
      el('div', { class: 'scene-banner-wrap' }, [
        el('img', {
          src: ch.sceneImage,
          alt: ch.location,
          onerror: (e) => { e.target.style.display = 'none'; }
        }),
        el('div', { class: 'scene-subtitle', text: `${ch.lineSender.name}：「${ch.lineMessage}」` })
      ]),
      el('div', { class: 'scene-hotspots' }, [
        el('button', {
          class: 'hotspot-chip',
          title: '點擊查看你的專屬桌上線索',
          text: '🕵️ 桌上線索',
          onClick: () => this._focusHelper('clue')
        }),
        el('button', {
          class: 'hotspot-chip',
          title: '即問同事 Lisa / Cindy 真心話',
          text: '🧠 問同事',
          onClick: () => this._focusHelper('phone', 'people', 'lisa')
        }),
        el('button', {
          class: 'hotspot-chip',
          title: '切換到阿嬤翻譯機聽一句人話',
          text: '👵 阿嬤話',
          onClick: () => this._focusHelper('phone', 'grandma')
        }),
        el('button', {
          class: 'hotspot-chip is-scooter',
          title: '騎阿嬤買菜電動車衝松仁路加分',
          text: '🛵 買菜車',
          onClick: () => this._openScooterModal()
        })
      ]),
      el('div', { class: 'scene-banner-overlay' }, [
        el('div', {}, [
          el('div', { style: 'font-size:11px;font-weight:800;color:var(--gold);', text: `${ch.book} · ${ch.timeSlot}` }),
          el('div', { style: 'font-size:13px;font-weight:800;', text: ch.location })
        ]),
        ch.cutscene
          ? el('button', {
              class: 'btn-ghost',
              style: 'min-height:32px;padding:4px 10px;font-size:12px;',
              text: '🎬 播動畫',
              onClick: () => {
                this.activeCutsceneSrc = ch.cutscene;
                this._setState({ ...this.state, phase: 'cutscene' });
              }
            })
          : null
      ])
    ]);

    // 2. 2026 台北 GPS 雷達小地圖（富邦 A25 / 陶豬隱園 / 101）
    const miniMap = el('div', { class: 'minimap-box' }, [
      el('div', { style: 'display:flex;justify-content:space-between;font-size:11px;font-weight:800;color:var(--cyan);margin-bottom:4px;' }, [
        el('span', { text: '2026 信義 GPS · 松仁路富邦 A25 × 陶豬隱園' }),
        el('span', { text: `站點 ${ch.id}/10` })
      ]),
      this._buildTaipeiMiniMapSvg(ch)
    ]);

    // 3. 職能獨家線索 ＋ 絕招
    const clueCard = el('div', {
      id: 'clue-card-panel',
      class: `panel${this.highlightTarget === 'clue' ? ' is-highlighted' : ''}`,
      style: `border-color:${role.color};display:flex;flex-direction:column;gap:8px;`
    }, [
      el('div', { style: `font-size:13px;font-weight:800;color:${role.color};`, text: `🕵️ ${role.name}・桌上獨家線索` }),
      el('div', { style: 'font-size:14px;color:#f5efff;', text: clue }),
      el('button', {
        class: 'btn-cyan',
        style: 'min-height:40px;padding:8px 14px;font-size:14px;',
        disabled: this.state.roleSpecialUsedThisChapter,
        text: this.state.roleSpecialUsedThisChapter ? `✓ 本章已用 ${role.specialName}` : `⚡ 發動絕招：${role.specialName}`,
        onClick: () => {
          soundFX.playMissionPassed();
          this._setState(useRoleSpecial(this.state));
        }
      })
    ]);

    // 4. GTA LINE 99+ 智慧型手機
    const phone = this._renderPhoneDrawer(ch);

    return el('aside', { class: 'side-stack' }, [sceneCard, miniMap, clueCard, phone]);
  }

  _buildTaipeiMiniMapSvg(activeCh) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 240 130');
    svg.setAttribute('class', 'minimap-svg');

    // 背景網格與基隆河/淡水河意象線
    const grid = document.createElementNS(svgNS, 'path');
    grid.setAttribute('d', 'M0 30 H240 M0 65 H240 M0 100 H240 M60 0 V130 M120 0 V130 M180 0 V130');
    grid.setAttribute('stroke', 'rgba(0,229,255,0.12)');
    grid.setAttribute('stroke-width', '1');
    svg.appendChild(grid);

    const river = document.createElementNS(svgNS, 'path');
    river.setAttribute('d', 'M0 112 Q 75 90, 140 96 T 240 50');
    river.setAttribute('fill', 'none');
    river.setAttribute('stroke', 'rgba(0, 229, 255, 0.28)');
    river.setAttribute('stroke-width', '6');
    svg.appendChild(river);

    // 10 個章節連線
    const pts = CHAPTERS.map((c) => `${Math.round((c.mapPos.x / 100) * 210 + 15)},${Math.round((c.mapPos.y / 100) * 100 + 15)}`);
    const route = document.createElementNS(svgNS, 'polyline');
    route.setAttribute('points', pts.join(' '));
    route.setAttribute('fill', 'none');
    route.setAttribute('stroke', 'rgba(255,79,163,0.45)');
    route.setAttribute('stroke-width', '2');
    route.setAttribute('stroke-dasharray', '4 3');
    svg.appendChild(route);

    // 2026 台北信義區實景地標標記
    const landmarks = [
      { x: 148, y: 36, text: '★富邦A25', color: '#ffd166' },
      { x: 162, y: 55, text: '🌀陶豬隱園', color: '#4ade80' },
      { x: 112, y: 50, text: '🗼101', color: '#00e5ff' },
      { x: 192, y: 22, text: '🎬內湖棚', color: '#ff52b8' },
      { x: 24, y: 105, text: '🛵台北橋', color: '#e2d9f3' }
    ];
    for (const lm of landmarks) {
      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', String(lm.x));
      t.setAttribute('y', String(lm.y));
      t.setAttribute('fill', lm.color);
      t.setAttribute('font-size', '9');
      t.setAttribute('font-weight', 'bold');
      t.textContent = lm.text;
      svg.appendChild(t);
    }

    for (const c of CHAPTERS) {
      const cx = Math.round((c.mapPos.x / 100) * 210 + 15);
      const cy = Math.round((c.mapPos.y / 100) * 100 + 15);
      const isCurrent = c.id === activeCh.id;
      const dot = document.createElementNS(svgNS, 'circle');
      dot.setAttribute('cx', String(cx));
      dot.setAttribute('cy', String(cy));
      dot.setAttribute('r', isCurrent ? '6.5' : '3.5');
      dot.setAttribute('fill', isCurrent ? '#ffd166' : (c.id < activeCh.id ? '#4ade80' : '#ff4fa3'));
      if (isCurrent) {
        dot.setAttribute('stroke', '#ffffff');
        dot.setAttribute('stroke-width', '2');
      }
      const tip = document.createElementNS(svgNS, 'title');
      tip.textContent = `第 ${c.id} 站 ${c.timeSlot}｜${c.location}`;
      dot.appendChild(tip);
      svg.appendChild(dot);
    }

    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', '8');
    label.setAttribute('y', '14');
    label.setAttribute('fill', '#ffd166');
    label.setAttribute('font-size', '9.5');
    label.setAttribute('font-weight', 'bold');
    label.textContent = '2026 松仁路 · 富邦A25 ⇄ 陶豬隱園';
    svg.appendChild(label);

    return svg;
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
        text: '🧠 讀心術',
        onClick: () => { this.phoneTab = 'people'; this.render(); }
      }),
      el('button', {
        class: `phone-tab${this.phoneTab === 'grandma' ? ' is-active' : ''}`,
        text: '👵 阿嬤翻譯',
        onClick: () => {
          this.phoneTab = 'grandma';
          if (!this.state.grandmaUnlocked) {
            this._triggerCheatCode(false);
          } else {
            this.render();
          }
        }
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
      bodyNode = el('div', { style: 'display:flex;flex-direction:column;gap:8px;' }, [
        el('div', { style: 'font-size:13px;color:var(--muted);', text: '電通 2026《People Model》數位分身，點擊即可即時追問：' }),
        ...['lisa', 'cindy'].map((tid) => {
          const twin = PEOPLE_MODEL_TWINS[tid];
          const asked = this.state.askedTwins.includes(tid);
          return el('button', {
            class: 'twin-row',
            onClick: () => {
              soundFX.playLinePing();
              this._setState(consultTwin(this.state, tid));
            }
          }, [
            el('img', { class: 'twin-avatar', src: twin.image, alt: twin.name, onerror: (e) => { e.target.style.display = 'none'; } }),
            el('div', {}, [
              el('div', { style: 'font-size:14px;font-weight:800;color:var(--cyan);', text: twin.name }),
              el('div', {
                style: 'font-size:13px;color:#efeafd;',
                text: asked ? `「${ch.peopleModel[tid]}」` : `點擊詢問（+${tid === 'lisa' || tid === 'cindy' ? '250 分 / 衡斷力+2' : ''}）`
              })
            ])
          ]);
        })
      ]);
    } else {
      bodyNode = el('div', { style: 'display:flex;flex-direction:column;gap:10px;' }, [
        el('div', { class: 'rescue-toast', text: ch.grandmaQuip }),
        el('div', { style: 'font-size:13px;color:var(--gold);', text: `☎️ ${ch.grandmaPhoneCall.title}：「${ch.grandmaPhoneCall.text}」` }),
        el('button', {
          class: 'btn-gold',
          text: '🍲 呼叫阿嬤大同電鍋（清通緝星＋補滿體力）',
          onClick: () => this._triggerCheatCode(true)
        })
      ]);
    }

    return el('section', {
      id: 'phone-card-panel',
      class: `phone-frame${this.highlightTarget === 'phone' ? ' is-highlighted' : ''}`
    }, [
      el('div', { style: 'display:flex;justify-content:space-between;align-items:center;' }, [
        el('span', { style: 'font-size:13px;font-weight:800;color:var(--pink);', text: '📱 iFruit Taiwan · LINE 99+' }),
        el('span', { style: 'font-size:12px;color:var(--muted);', text: '5G 富邦 A25 基地台' })
      ]),
      tabs,
      bodyNode
    ]);
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
        el('h2', { style: 'margin:4px 0 0 0;font-size:clamp(18px,2vw,24px);', text: ch.location })
      ]),
      el('div', { class: 'pill', text: `第 ${ch.id}／10 站` })
    ]);

    const stepFlow = this._renderStepFlow(phase);

    const rescueBanner = this.state.lastRescueMessage
      ? el('div', { class: 'rescue-toast', text: `🍲 ${this.state.lastRescueMessage}` })
      : null;

    if (phase === 'scene') {
      return el('main', { class: 'panel main-stage' }, [
        header,
        stepFlow,
        rescueBanner,
        el('p', { class: 'chapter-desc', text: ch.sceneDesc }),
        el('div', { class: 'boss-callout' }, [
          el('div', { style: 'font-size:13px;color:var(--gold);margin-bottom:4px;', text: `📩 ${ch.lineSender.name}（${ch.lineSender.role}）剛剛傳 LINE 給你：` }),
          el('div', { text: `「${ch.lineMessage}」` })
        ]),
        el('div', { style: 'font-size:13px;color:var(--cyan);font-weight:700;', text: '👆 請直接點擊下方 4 個真實臨場回覆之一（或按鍵盤 1–4 快捷鍵）：' }),
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
          ? el('div', { style: 'padding:8px 12px;border-radius:10px;background:rgba(255,255,255,0.06);font-size:14px;color:#e0d6f7;', text: `你剛剛回：「${this.state.activeReply.text}」➔ ${this.state.activeReply.feedback}` })
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
      el('div', { class: 'panel', style: 'background:rgba(0,229,255,0.08);border-color:var(--cyan);' }, [
        el('div', { style: 'font-size:12px;font-weight:800;color:var(--cyan);margin-bottom:4px;', text: '📌 一句帶走 TAKEAWAY' }),
        el('div', { style: 'font-size:clamp(17px,1.8vw,21px);font-weight:900;color:#ffffff;', text: `「${ch.takeaway}」` }),
        el('div', { style: 'font-size:13px;color:var(--muted);margin-top:4px;', text: `出處：${ch.book} ${ch.source}` })
      ]),
      el('div', { class: 'rescue-toast', text: `👵 ${ch.grandmaQuip}` }),
      el('div', { style: 'display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;' }, [
        el('button', {
          class: 'btn-gold',
          text: '🛵 騎阿嬤買菜車衝一波加分',
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
        el('div', { class: 'boss-callout', text: `「${call.text}」` }),
        el('div', { class: 'rescue-toast', text: `🍲 ${call.rewardText}` }),
        el('button', {
          class: 'btn-gold',
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
        })
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
          this._setState(completeScooterRun(this.state, result));
        }
      });
      this.scooterInstance.start();
    });

    return modal;
  }

  _renderReview() {
    const persona = determinePersona(this.state);
    const role = getRole(this.state.roleId);
    const s = this.state.stats;

    return el('section', { class: 'panel', style: 'display:flex;flex-direction:column;gap:18px;border-color:var(--gold);' }, [
      el('div', { class: 'chapter-header' }, [
        el('div', {}, [
          el('div', { class: 'gta-kicker', text: 'MISSION PASSED · 電通台灣十年一日考績結算' }),
          el('h1', { class: 'gta-title', style: 'font-size:38px;margin-top:6px;', text: persona.name }),
          el('p', { style: 'margin:4px 0 0 0;font-size:18px;color:var(--gold);', text: persona.title })
        ]),
        el('div', { class: 'score-pill', style: 'font-size:22px;padding:10px 18px;', text: `總積分 $${this.state.points.toLocaleString()}` })
      ]),
      el('div', { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;' }, [
        el('div', { class: 'panel', style: 'border-color:var(--cyan);' }, [
          el('div', { style: 'display:flex;align-items:center;gap:12px;margin-bottom:10px;' }, [
            el('img', { src: role.image, alt: role.name, class: 'hud-avatar' }),
            el('div', {}, [
              el('div', { style: 'font-weight:800;font-size:17px;', text: role.name }),
              el('div', { style: 'font-size:13px;color:var(--muted);', text: `答對小互動 ${this.state.gamesCorrectCount}／${this.state.gamesScoredCount} · 阿嬤救援 ${this.state.grandmaRescues} 次` })
            ])
          ]),
          el('p', { text: `✅ 強項：${persona.strength}` }),
          el('p', { text: `⚠️ 盲點：${persona.blind}` }),
          el('p', { style: 'color:var(--cyan);font-size:14px;', text: `📖 推薦延伸閱讀：${persona.read}` })
        ]),
        el('div', { class: 'panel' }, [
          el('h3', { style: 'margin:0 0 10px 0;', text: '五維能力最終數值' }),
          ...[
            ['🔥 肝指數 (Stamina)', s.stamina],
            ['🎤 嘴砲力 (Street Cred)', s.streetCred],
            ['📈 真實增量 (Real Lift)', s.realLift],
            ['🛡️ 品牌信任 (Brand Trust)', s.brandTrust],
            ['⚖️ 人類衡斷力 (Judgment)', s.judgment]
          ].map(([k, v]) => el('div', { style: 'display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.08);' }, [
            el('span', { text: k }),
            el('strong', { style: 'color:var(--gold);', text: String(v) })
          ]))
        ])
      ]),
      el('div', { class: 'panel' }, [
        el('h3', { style: 'margin:0 0 10px 0;', text: '今日 10 大時段決策戰報' }),
        el('div', { style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;' }, this.state.history.map((h) =>
          el('div', { style: 'padding:10px;border-radius:10px;background:rgba(255,255,255,0.05);font-size:13px;' }, [
            el('div', { style: 'font-weight:800;color:var(--cyan);', text: `${h.year} · ${h.title}` }),
            el('div', { text: `回覆：${h.replyText}` }),
            el('div', { style: 'color:var(--gold);', text: `${h.correct ? '✓ 識破' : '• 參與'} · +$${h.pointsEarned.toLocaleString()}` })
          ])
        ))
      ]),
      el('div', { style: 'display:flex;flex-wrap:wrap;gap:12px;' }, [
        el('button', {
          class: 'btn-primary',
          text: '換個電通職能再玩一天 ↻',
          onClick: () => this._resetGame()
        }),
        el('button', {
          class: 'btn-gold',
          text: '👵 騎阿嬤電動車破紀錄',
          onClick: () => this._openScooterModal()
        })
      ])
    ]);
  }

  _renderBottomGuideBar() {
    let text = '點選畫面按鈕操作；隨時可按鍵盤或點擊下方快捷指令。';
    const actions = [];

    if (this.scooterModalOpen) {
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
      text = '🎬 操作指示：正在播放 2026 台北實景過場動畫，隨時可點「進入現場」或按 Space / Enter 直接開工！';
      actions.push(
        el('button', {
          class: 'guide-btn is-primary',
          text: '⏭️ 進入現場 (Space / Enter) ➔',
          onClick: () => {
            this.activeCutsceneSrc = null;
            soundFX.playLinePing();
            this._setState(finishCutscene(this.state));
          }
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
