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

    // 1-4 快選老闆訊息回覆
    if (this.state.phase === 'scene' && ['1', '2', '3', '4'].includes(e.key)) {
      const idx = Number(e.key) - 1;
      this._pickReply(idx);
    }

    // 第 4/6 章滑卡支援左右鍵
    const ch = getCurrentChapter(this.state);
    if (this.state.phase === 'game' && ch.game?.type === 'swipe') {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this._pickSwipe('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this._pickSwipe('right');
      }
    }
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
  }

  _renderTitle() {
    const heroMedia = el('div', { class: 'hero-media' }, [
      el('img', {
        src: './public/images/scene-morning-scooter.webp',
        alt: '台北橋機車瀑布 GTA 6 台灣風格主視覺',
        onerror: (e) => { e.target.style.display = 'none'; }
      })
    ]);

    const body = el('div', { class: 'hero-body' }, [
      el('div', { class: 'gta-kicker', text: 'DENTSU TAIWAN × 決策智慧 2018–2026' }),
      el('h1', { class: 'gta-title', text: 'GRAND THEFT AGENCY\n電通台灣一日風雲' }),
      el('p', {
        class: 'gta-subtitle',
        text: '從早上 08:30 台北橋機車陣配大冰奶，到深夜 11:45 信義區戰情室終局拍板。九本《決策智慧》濃縮成十個高壓時段，看你怎麼在 CFO 通緝星與演算法迷霧中守住真實距離！'
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
    const topBar = el('div', { class: 'panel', style: 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;' }, [
      el('div', {}, [
        el('div', { class: 'gta-kicker', text: 'STEP 1 · 領取電通台灣識別證' }),
        el('h2', { style: 'margin:6px 0 0 0;font-size:26px;', text: '今天早上，你以哪個職能走進信義區？' })
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

    return el('div', { style: 'display:flex;flex-direction:column;gap:16px;' }, [topBar, grid]);
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
      videoEl,
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

    // 1. 台北場景主視覺卡
    const sceneCard = el('div', { class: 'panel scene-card' }, [
      el('div', { class: 'scene-banner-wrap' }, [
        el('img', {
          src: ch.sceneImage,
          alt: ch.location,
          onerror: (e) => { e.target.style.display = 'none'; }
        }),
        el('div', { class: 'scene-banner-overlay' }, [
          el('div', {}, [
            el('div', { style: 'font-size:12px;font-weight:800;color:var(--gold);', text: `${ch.book} · ${ch.timeSlot}` }),
            el('div', { style: 'font-size:15px;font-weight:800;', text: ch.location })
          ]),
          ch.cutscene
            ? el('button', {
                class: 'btn-ghost',
                style: 'min-height:34px;padding:4px 10px;font-size:12px;',
                text: '🎬 播動畫',
                onClick: () => {
                  this.activeCutsceneSrc = ch.cutscene;
                  this._setState({ ...this.state, phase: 'cutscene' });
                }
              })
            : null
        ])
      ])
    ]);

    // 2. 台北 GPS 雷達小地圖
    const miniMap = el('div', { class: 'minimap-box' }, [
      el('div', { style: 'display:flex;justify-content:space-between;font-size:12px;font-weight:800;color:var(--cyan);margin-bottom:6px;' }, [
        el('span', { text: 'TAIPEI GPS RADAR' }),
        el('span', { text: `站點 ${ch.id}/10` })
      ]),
      this._buildTaipeiMiniMapSvg(ch)
    ]);

    // 3. 職能獨家線索 ＋ 絕招
    const clueCard = el('div', { class: 'panel', style: `border-color:${role.color};display:flex;flex-direction:column;gap:10px;` }, [
      el('div', { style: `font-size:13px;font-weight:800;color:${role.color};`, text: `🕵️ ${role.name}・桌上獨家線索` }),
      el('div', { style: 'font-size:15px;color:#f5efff;', text: clue }),
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
      svg.appendChild(dot);
    }

    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', '10');
    label.setAttribute('y', '16');
    label.setAttribute('fill', '#ffd166');
    label.setAttribute('font-size', '10');
    label.setAttribute('font-weight', 'bold');
    label.textContent = '101 戰區 · 信義 / 內湖 / 台北橋';
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

    return el('section', { class: 'phone-frame' }, [
      el('div', { style: 'display:flex;justify-content:space-between;align-items:center;' }, [
        el('span', { style: 'font-size:13px;font-weight:800;color:var(--pink);', text: '📱 iFruit Taiwan · LINE 99+' }),
        el('span', { style: 'font-size:12px;color:var(--muted);', text: '5G 信義基地台' })
      ]),
      tabs,
      bodyNode
    ]);
  }

  _renderMainStage() {
    const ch = getCurrentChapter(this.state);
    const phase = this.state.phase;

    const header = el('div', { class: 'chapter-header' }, [
      el('div', {}, [
        el('div', { class: 'gta-kicker', text: `${ch.timeSlot} · ${ch.book} · 《${ch.title}》` }),
        el('h2', { style: 'margin:6px 0 0 0;font-size:26px;', text: ch.location })
      ]),
      el('div', { class: 'pill', text: `第 ${ch.id}／10 站` })
    ]);

    const rescueBanner = this.state.lastRescueMessage
      ? el('div', { class: 'rescue-toast', text: `🍲 ${this.state.lastRescueMessage}` })
      : null;

    if (phase === 'scene') {
      return el('main', { class: 'panel main-stage' }, [
        header,
        rescueBanner,
        el('p', { class: 'chapter-desc', text: ch.sceneDesc }),
        el('div', { class: 'boss-callout' }, [
          el('div', { style: 'font-size:13px;color:var(--gold);margin-bottom:4px;', text: `📩 ${ch.lineSender.name}（${ch.lineSender.role}）剛剛傳 LINE 給你：` }),
          el('div', { text: `「${ch.lineMessage}」` })
        ]),
        el('div', { style: 'font-size:14px;color:var(--muted);', text: '選擇你的臨場回覆（支援鍵盤 1–4 快捷鍵）：' }),
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
        rescueBanner,
        this.state.activeReply
          ? el('div', { style: 'padding:10px 14px;border-radius:10px;background:rgba(255,255,255,0.06);font-size:14px;color:#e0d6f7;', text: `你剛剛回：「${this.state.activeReply.text}」➔ ${this.state.activeReply.feedback}` })
          : null,
        this._renderMiniGame(ch.game)
      ]);
    }

    // phase === 'reveal'
    const out = this.state.lastGameOutcome || { scored: false, correct: true, detail: '', pointsEarned: 0 };
    const badgeText = out.scored ? (out.correct ? '🎯 識破迷霧！' : '💡 差一點（參與分照拿）') : '✅ 完成情境實測';
    return el('main', { class: 'panel main-stage' }, [
      header,
      rescueBanner,
      el('div', { class: 'boss-callout', style: `border-color:${out.correct ? 'var(--lime)' : 'var(--orange)'};` }, [
        el('div', { style: 'font-size:15px;color:var(--gold);margin-bottom:4px;', text: `${badgeText} · +$${out.pointsEarned.toLocaleString()}` }),
        el('div', { text: out.detail })
      ]),
      el('div', { class: 'panel', style: 'background:rgba(0,229,255,0.08);border-color:var(--cyan);' }, [
        el('div', { style: 'font-size:13px;font-weight:800;color:var(--cyan);margin-bottom:6px;', text: '📌 一句帶走 TAKEAWAY' }),
        el('div', { style: 'font-size:22px;font-weight:900;color:#ffffff;', text: `「${ch.takeaway}」` }),
        el('div', { style: 'font-size:14px;color:var(--muted);margin-top:6px;', text: `出處：${ch.book} ${ch.source}` })
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
      return el('div', { style: 'display:flex;flex-direction:column;gap:14px;' }, [
        el('h3', { style: 'margin:0;font-size:21px;color:var(--gold);', text: game.prompt }),
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
            el('h4', { text: opt.title }),
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

      return el('div', { class: 'slider-box' }, [
        el('h3', { style: 'margin:0;font-size:21px;color:var(--gold);', text: game.prompt }),
        readout,
        range,
        el('div', { style: 'display:flex;justify-content:space-between;font-size:14px;color:var(--muted);' }, [
          el('span', { text: `${game.min} ${game.unit || ''}` }),
          el('span', { text: `${game.max} ${game.unit || ''}` })
        ]),
        el('button', {
          class: 'btn-primary',
          text: '鎖定這個數字 ➔',
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
          el('h3', { style: 'margin:0;font-size:21px;color:var(--gold);', text: game.prompt }),
          el('span', { class: 'pill', text: `第 ${this.swipeIndex + 1}／${game.cards.length} 張` })
        ]),
        el('div', { class: 'swipe-card', text: cardText }),
        el('div', { class: 'swipe-actions' }, [
          el('button', {
            class: 'btn-cyan',
            text: `⬅ ${game.left}`,
            onClick: () => this._pickSwipe('left')
          }),
          el('button', {
            class: 'btn-primary',
            text: `${game.right} ➡`,
            onClick: () => this._pickSwipe('right')
          })
        ])
      ]);
    }

    if (game.type === 'multi') {
      return el('div', { style: 'display:flex;flex-direction:column;gap:14px;' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:center;' }, [
          el('h3', { style: 'margin:0;font-size:21px;color:var(--gold);', text: game.prompt }),
          el('span', { class: 'pill', text: `可複選 · 已選 ${this.multiSelected.size}` })
        ]),
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
            el('h4', { text: `${this.multiSelected.has(idx) ? '☑ ' : '☐ '}${opt.title}` })
          ])
        )),
        el('button', {
          class: 'btn-primary',
          text: '送出複選審計 ➔',
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
      const repEl = el('div', { class: 'stop-val', style: 'color:var(--lime);', text: String(game.report.start + this.stopTick * game.report.perTick) });
      const freshEl = el('div', { class: 'stop-val', style: 'color:var(--danger);', text: `${game.fresh.start + this.stopTick * game.fresh.perTick}${game.fresh.unit}` });
      const tickLabel = el('div', { class: 'pill', text: `第 ${this.stopTick}／${game.ticks} 週` });

      if (!this.stopTimer && !this.stopFinished) {
        this.stopTimer = setInterval(() => {
          this.stopTick += 1;
          repEl.textContent = String(game.report.start + this.stopTick * game.report.perTick);
          freshEl.textContent = `${game.fresh.start + this.stopTick * game.fresh.perTick}${game.fresh.unit}`;
          tickLabel.textContent = `第 ${this.stopTick}／${game.ticks} 週`;
          if (this.stopTick >= game.ticks) {
            this._clearStopTimer();
            this.stopFinished = true;
            this._setState(submitMiniGame(this.state, null));
          }
        }, game.intervalMs || 700);
      }

      return el('div', { style: 'display:flex;flex-direction:column;gap:14px;' }, [
        el('div', { style: 'display:flex;justify-content:space-between;align-items:center;' }, [
          el('h3', { style: 'margin:0;font-size:21px;color:var(--gold);', text: game.prompt }),
          tickLabel
        ]),
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
          style: 'font-size:20px;min-height:60px;',
          text: '🚨 按下去！緊急煞車停掉自動優化',
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
}

window.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('app');
  if (root) {
    window.__gtaApp = new GtaDentsuApp(root);
  }
});
