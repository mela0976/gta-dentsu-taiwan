// 阿嬤模組彩蛋 ③：阿嬤買菜電動車大暴走 (Grandma Scooter Rush)
// 60fps Canvas 偽 3D 台北霓虹夜市街頭閃避小遊戲

const DEFAULT_CONFIG = {
  durationSec: 22,
  goodItems: [
    { id: 'milktea', label: '大冰奶', emoji: '🧋', color: '#00e5ff', pts: 150, heal: 1 },
    { id: 'tatung', label: '大同電鍋', emoji: '🍲', color: '#4ade80', pts: 300, shield: true },
    { id: 'trust', label: '真實口碑', emoji: '💬', color: '#ff6ad5', pts: 220 },
    { id: 'people', label: 'People Model', emoji: '🧠', color: '#ffd166', pts: 250 }
  ],
  hazards: [
    { id: 'rmn', label: 'RMN 毒蘋果', emoji: '🍎', color: '#ff3b6b', dmg: 1, pts: -80 },
    { id: 'cookie', label: 'Cookie 墓碑', emoji: '🪦', color: '#a78bfa', dmg: 1, pts: -60 },
    { id: 'slop', label: 'AI Slop 罐頭', emoji: '🥫', color: '#fb923c', dmg: 1, pts: -70 },
    { id: 'cpm', label: '0.5秒假曝光', emoji: '📉', color: '#f43f5e', dmg: 1, pts: -90 }
  ]
};

const EMOJI_MAP = {
  'iced-milk': '🧋',
  milktea: '🧋',
  'tatung-pot': '🍲',
  tatung: '🍲',
  'real-wom': '💬',
  trust: '💬',
  'people-model': '🧠',
  people: '🧠',
  'rmn-apple': '🍎',
  rmn: '🍎',
  'cookie-tomb': '🪦',
  cookie: '🪦',
  'ai-slop': '🥫',
  slop: '🥫',
  'fake-impression': '📉',
  cpm: '📉'
};

function normalizeItems(items, isGood, fallback) {
  if (!Array.isArray(items) || !items.length) return fallback;
  return items.map((it) => ({
    id: it.id,
    label: it.label,
    emoji: it.emoji || EMOJI_MAP[it.id] || (isGood ? '✨' : '⚠️'),
    color: it.color || (isGood ? '#00e5ff' : '#ff3b6b'),
    pts: isGood ? (it.pts ?? it.score ?? 150) : (it.pts ?? -(it.penalty ?? 80)),
    heal: it.heal ?? (it.id === 'iced-milk' || it.id === 'milktea' ? 1 : 0),
    shield: it.shield ?? (it.id === 'tatung-pot' || it.id === 'tatung'),
    dmg: isGood ? 0 : (it.dmg ?? 1)
  }));
}

export class GrandmaScooterGame {
  constructor(canvas, config = {}, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cfg = {
      durationSec: config.durationSec || config.durationSeconds || DEFAULT_CONFIG.durationSec,
      goodItems: normalizeItems(config.goodItems, true, DEFAULT_CONFIG.goodItems),
      hazards: normalizeItems(config.hazards || config.badItems, false, DEFAULT_CONFIG.hazards)
    };
    this.labels = {
      initBanner: '2026 旗艦電摩 × Tesla FSD 自動駕駛測試道｜松仁路直達富邦 A25！',
      shieldBanner: '大同電鍋無敵護盾啟動！演算法撞不倒阿嬤！',
      pickupPrefix: '撿到 ',
      deflectTpl: '大同電鍋彈飛「{label}」！+120',
      hitTpl: '撞到 {label}！「唉唷，這款數字攏係假！」',
      signLeft: '陶朱隱園 · 松勇路',
      signRight: '松仁路 · 富邦A25總部',
      ...(config.canvas || {})
    };
    this.onFinish = callbacks.onFinish || (() => {});
    this.onEvent = callbacks.onEvent || (() => {});
    this.onHudUpdate = callbacks.onHudUpdate || (() => {});

    this.lane = 1; // 0: left, 1: center, 2: right
    this.visualX = 1;
    this.hp = 3;
    this.maxHp = 3;
    this.shieldTimer = 0;
    this.score = 0;
    this.combo = 0;
    this.collected = 0;
    this.dodged = 0;
    this.timeLeft = this.cfg.durationSec;
    this.entities = [];
    this.particles = [];
    this.teslaCars = [
      { lane: 0, z: 0.22, speed: 0.13, targetLane: 0, color: '#8da2b8', label: 'TESLA FSD v13' },
      { lane: 2, z: 0.54, speed: 0.16, targetLane: 2, color: '#cbd5e1', label: 'MODEL Y 2026 FSD' }
    ];
    this.spawnCooldown = 0.45;
    this.roadOffset = 0;
    this.running = false;
    this.rafId = null;
    this.lastTs = 0;
    this.bannerText = this.labels.initBanner;
    this.bannerTimer = 2.8;

    this._onKeyDown = (e) => {
      if (!this.running) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        this.moveLane(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        this.moveLane(1);
      }
    };

    this._onPointerDown = (e) => {
      if (!this.running || !this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / Math.max(1, rect.width);
      if (relX < 0.42) this.moveLane(-1);
      else if (relX > 0.58) this.moveLane(1);
    };
  }

  moveLane(delta) {
    const next = Math.max(0, Math.min(2, this.lane + delta));
    if (next !== this.lane) {
      this.lane = next;
      this.onEvent('lane');
    }
  }

  start() {
    this.running = true;
    this.lastTs = performance.now();
    window.addEventListener('keydown', this._onKeyDown);
    if (this.canvas) this.canvas.addEventListener('pointerdown', this._onPointerDown);
    const loop = (ts) => {
      if (!this.running) return;
      const dt = Math.min(0.05, Math.max(0.001, (ts - this.lastTs) / 1000));
      this.lastTs = ts;
      this.update(dt);
      this.render();
      if (this.running) {
        this.rafId = requestAnimationFrame(loop);
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(aborted = false) {
    this.running = false;
    window.removeEventListener('keydown', this._onKeyDown);
    if (this.canvas) this.canvas.removeEventListener('pointerdown', this._onPointerDown);
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (!aborted) {
      const judgmentBonus = Math.min(18, Math.max(4, Math.round(this.score / 120)));
      const trustBonus = Math.min(18, Math.max(4, Math.round(this.collected * 2)));
      this.onFinish({
        score: Math.max(0, this.score),
        collected: this.collected,
        hpLeft: this.hp,
        judgmentBonus,
        trustBonus
      });
    }
  }

  _spawnEntity() {
    const lane = Math.floor(Math.random() * 3);
    const isGood = Math.random() < 0.56;
    const pool = isGood ? this.cfg.goodItems : this.cfg.hazards;
    const template = pool[Math.floor(Math.random() * pool.length)];
    this.entities.push({
      lane,
      z: 0.04, // 0.04 horizon -> 1.0 player line
      speed: 0.44 + Math.random() * 0.16 + (1 - this.timeLeft / this.cfg.durationSec) * 0.18,
      isGood,
      ...template
    });
  }

  _emitParticles(x, y, color, count = 12) {
    for (let i = 0; i < count; i += 1) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const spd = 55 + Math.random() * 120;
      this.particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.5,
        maxLife: 0.5,
        color
      });
    }
  }

  update(dt) {
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    this.roadOffset = (this.roadOffset + dt * 4.2) % 1;
    this.visualX += (this.lane - this.visualX) * Math.min(1, dt * 15);
    if (this.shieldTimer > 0) this.shieldTimer = Math.max(0, this.shieldTimer - dt);
    if (this.bannerTimer > 0) this.bannerTimer = Math.max(0, this.bannerTimer - dt);

    this.spawnCooldown -= dt;
    if (this.spawnCooldown <= 0) {
      this._spawnEntity();
      this.spawnCooldown = 0.52 - (1 - this.timeLeft / this.cfg.durationSec) * 0.18;
    }

    const w = this.canvas.width;
    const h = this.canvas.height;
    const playerLane = this.lane;

    for (let i = this.entities.length - 1; i >= 0; i -= 1) {
      const ent = this.entities[i];
      ent.z += ent.speed * dt;
      if (ent.z >= 0.84 && ent.z <= 0.96 && ent.lane === playerLane) {
        const px = this._laneX(ent.lane, ent.z, w);
        const py = this._zToY(ent.z, h);
        if (ent.isGood) {
          this.combo += 1;
          this.collected += 1;
          this.score += ent.pts + Math.min(150, this.combo * 20);
          if (ent.heal) this.hp = Math.min(this.maxHp, this.hp + ent.heal);
          if (ent.shield) {
            this.shieldTimer = 4.5;
            this.bannerText = this.labels.shieldBanner;
            this.bannerTimer = 2.0;
          } else {
            this.bannerText = `${this.labels.pickupPrefix}${ent.label} +${ent.pts}`;
            this.bannerTimer = 1.1;
          }
          this._emitParticles(px, py, ent.color, 14);
          this.onEvent('good');
        } else if (this.shieldTimer > 0) {
          this.score += 120;
          this.bannerText = String(this.labels.deflectTpl).replace('{label}', ent.label);
          this.bannerTimer = 1.2;
          this._emitParticles(px, py, '#4ade80', 14);
          this.onEvent('good');
        } else {
          this.hp = Math.max(0, this.hp - (ent.dmg || 1));
          this.combo = 0;
          this.score = Math.max(0, this.score + (ent.pts || -60));
          this.bannerText = String(this.labels.hitTpl).replace('{label}', ent.label);
          this.bannerTimer = 1.6;
          this._emitParticles(px, py, '#ff3b6b', 16);
          this.onEvent('bad');
        }
        this.entities.splice(i, 1);
      } else if (ent.z > 1.05) {
        if (!ent.isGood) this.dodged += 1;
        this.entities.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // 2026 Tesla FSD 自動駕駛巡航車流：自動偵測並禮讓玩家車道，避免穿模碰撞
    for (const car of this.teslaCars) {
      car.z += car.speed * dt;
      if (car.z > 0.66 && Math.round(car.targetLane) === playerLane) {
        car.targetLane = playerLane === 0 ? 1 : playerLane === 2 ? 1 : 2;
      } else if (Math.random() < dt * 0.45 && car.z < 0.58) {
        const choices = [0, 1, 2].filter((ln) => ln !== playerLane || car.z < 0.45);
        car.targetLane = choices[Math.floor(Math.random() * choices.length)] ?? car.targetLane;
      }
      car.lane += (car.targetLane - car.lane) * Math.min(1, dt * 4.5);
      if (car.z > 1.08) {
        car.z = 0.08 + Math.random() * 0.08;
        const safeLanes = [0, 2];
        car.targetLane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
        car.lane = car.targetLane;
      }
    }

    this.onHudUpdate({
      timeLeft: Math.ceil(this.timeLeft),
      score: this.score,
      hp: this.hp,
      shield: this.shieldTimer > 0,
      combo: this.combo
    });

    if (this.timeLeft <= 0 || this.hp <= 0) {
      this.stop(false);
    }
  }

  _zToY(z, h) {
    const horizon = h * 0.34;
    return horizon + Math.pow(z, 1.35) * (h - horizon);
  }

  _laneX(laneIdx, z, w) {
    const center = w * 0.5;
    const roadHalfAtPlayer = w * 0.36;
    const roadHalfAtHorizon = w * 0.08;
    const half = roadHalfAtHorizon + (roadHalfAtPlayer - roadHalfAtHorizon) * Math.pow(z, 1.25);
    const norm = laneIdx - 1; // -1, 0, +1
    return center + norm * half * 0.64;
  }

  _drawTeslaCar(ctx, car, w, h) {
    const x = this._laneX(car.lane, car.z, w);
    const y = this._zToY(car.z, h);
    const scale = 0.28 + Math.pow(car.z, 1.05) * 0.95;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // FSD v13 自動駕駛藍色全息光毯路徑（向前投影至地平線方向）
    const pathGrad = ctx.createLinearGradient(0, -14, 0, -96);
    pathGrad.addColorStop(0, 'rgba(0, 229, 255, 0.42)');
    pathGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = pathGrad;
    ctx.beginPath();
    ctx.moveTo(-18, -14);
    ctx.lineTo(-7, -92);
    ctx.lineTo(7, -92);
    ctx.lineTo(18, -14);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.78)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(-17, -16);
    ctx.lineTo(-7, -86);
    ctx.moveTo(17, -16);
    ctx.lineTo(7, -86);
    ctx.stroke();
    ctx.setLineDash([]);

    // 車底陰影
    ctx.fillStyle = 'rgba(0,0,0,0.52)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 34, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2026 Tesla Model Y Juniper 流線車體
    const bodyGrad = ctx.createLinearGradient(-28, -28, 28, 10);
    bodyGrad.addColorStop(0, '#cbd5e1');
    bodyGrad.addColorStop(0.45, car.color || '#94a3b8');
    bodyGrad.addColorStop(1, '#334155');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-29, 6);
    ctx.lineTo(-27, -10);
    ctx.lineTo(-19, -24);
    ctx.lineTo(19, -24);
    ctx.lineTo(27, -10);
    ctx.lineTo(29, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 全景玻璃天窗與後檔
    ctx.fillStyle = '#0b1526';
    ctx.beginPath();
    ctx.moveTo(-17, -22);
    ctx.lineTo(17, -22);
    ctx.lineTo(21, -11);
    ctx.lineTo(-21, -11);
    ctx.closePath();
    ctx.fill();

    // 2026 貫穿式間接反射紅色光條尾燈 (Juniper Lightbar)
    ctx.shadowColor = '#ff2a5f';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff3864';
    ctx.fillRect(-25, -9, 50, 3.2);
    ctx.fillStyle = '#ffe4ea';
    ctx.fillRect(-20, -8.3, 40, 1.4);
    ctx.shadowBlur = 0;

    // 白色低調車牌 + FSD 偵測標註（z > 0.24 才顯示避免堆疊）
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-8, -2, 16, 5.5);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 4.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EAL-2026', 0, 2.3);

    if (car.z > 0.24 && car.z < 0.92) {
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.72)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-33, -29, 66, 42);
      ctx.fillStyle = 'rgba(8, 20, 38, 0.88)';
      ctx.fillRect(-28, -42, 56, 11);
      ctx.strokeRect(-28, -42, 56, 11);
      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 6.5px monospace';
      ctx.fillText('AUTOPILOT FSD', 0, -34.2);
    }

    ctx.restore();
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const horizon = Math.round(h * 0.34);

    // 1. 嚴格裁切天空與台北信義天際線（絕不向路面穿模）
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, horizon);
    ctx.clip();

    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#0f172a');
    sky.addColorStop(0.55, '#3b1d5a');
    sky.addColorStop(1, '#f97352');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, horizon);

    // 夕陽與大氣光暈
    const sunGrad = ctx.createRadialGradient(w * 0.5, horizon - 12, 6, w * 0.5, horizon - 12, 56);
    sunGrad.addColorStop(0, 'rgba(255, 226, 148, 0.95)');
    sunGrad.addColorStop(1, 'rgba(255, 115, 70, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(w * 0.5, horizon - 12, 56, Math.PI, 0);
    ctx.fill();

    // 1.1 「陶朱隱園」雙螺旋寫實綠植建築（左側遠景）
    const ax = w * 0.22;
    for (let fl = 0; fl < 9; fl += 1) {
      const fy = horizon - 6 - fl * 6.5;
      const shift = Math.sin((fl / 8) * Math.PI) * 6 - 2;
      const fw = 32 - Math.abs(4 - fl) * 1.2;
      ctx.fillStyle = '#182235';
      ctx.fillRect(ax - fw / 2 + shift, fy, fw, 5.4);
      ctx.fillStyle = fl % 2 === 0 ? '#4ade80' : '#38bdf8';
      ctx.fillRect(ax - fw / 2 + shift + 2, fy + 1.5, 5, 2.2);
      ctx.fillRect(ax + fw / 2 + shift - 7, fy + 1.5, 5, 2.2);
    }

    // 1.2 已完工「富邦信義 A25 總部（Renzo Piano 超白水晶玻璃塔 + 富邦美術館白色群樓）」
    const fx = w * 0.72;
    const towerGrad = ctx.createLinearGradient(fx - 18, horizon - 92, fx + 18, horizon);
    towerGrad.addColorStop(0, '#93c5fd');
    towerGrad.addColorStop(0.5, '#3b648f');
    towerGrad.addColorStop(1, '#1e3554');
    ctx.fillStyle = towerGrad;
    ctx.fillRect(fx - 17, horizon - 88, 34, 88);
    // 雙側外露鋼構斜撐桁架
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.65)';
    ctx.lineWidth = 1.2;
    for (let gy = horizon - 84; gy < horizon - 14; gy += 10) {
      ctx.beginPath();
      ctx.moveTo(fx - 17, gy);
      ctx.lineTo(fx - 12, gy + 10);
      ctx.moveTo(fx + 17, gy);
      ctx.lineTo(fx + 12, gy + 10);
      ctx.stroke();
    }
    // 冠頂青綠 Fubon LOGO
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.8)';
    ctx.strokeRect(fx - 17, horizon - 92, 34, 6);
    ctx.fillStyle = '#00d2ff';
    ctx.fillRect(fx - 3, horizon - 91, 6, 4);
    // 低樓層白色富邦美術館
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(fx - 26, horizon - 14, 52, 14);

    // 1.3 台北 101 寫實剪影
    ctx.fillStyle = '#141a30';
    const tx = w * 0.89;
    ctx.fillRect(tx - 11, horizon - 78, 22, 78);
    ctx.fillRect(tx - 15, horizon - 58, 30, 12);
    ctx.fillRect(tx - 14, horizon - 40, 28, 12);
    ctx.fillRect(tx - 2, horizon - 96, 4, 20);

    // 信義區松仁路高架綠底白框台灣路牌（設於開闊天空，絕不遮擋大樓冠頂）
    const signs = [
      { x: 0.22, y: 0.13, txt: this.labels.signLeft, bg: '#0b1628', border: '#4ade80' },
      { x: 0.62, y: 0.13, txt: this.labels.signRight, bg: '#006b54', border: '#e2e8f0' }
    ];
    ctx.font = 'bold 10.5px sans-serif';
    ctx.textAlign = 'center';
    signs.forEach((s) => {
      const boxW = Math.max(94, Math.ceil(ctx.measureText(s.txt).width) + 18);
      ctx.fillStyle = s.bg;
      ctx.fillRect(w * s.x - boxW / 2, h * s.y - 9, boxW, 18);
      ctx.strokeStyle = s.border;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(w * s.x - boxW / 2, h * s.y - 9, boxW, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(s.txt, w * s.x, h * s.y + 4);
    });
    ctx.restore();

    // 2. 寫實台北松仁路柏油路面 + 人行道紅白緣石 + 雙黃線
    ctx.fillStyle = '#111622';
    ctx.fillRect(0, horizon, w, h - horizon);

    // 左右人行道與路緣
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, horizon, w, h - horizon);
    ctx.beginPath();
    ctx.moveTo(w * 0.42, horizon);
    ctx.lineTo(w * 0.58, horizon);
    ctx.lineTo(w * 0.90, h);
    ctx.lineTo(w * 0.10, h);
    ctx.closePath();
    const roadGrad = ctx.createLinearGradient(0, horizon, 0, h);
    roadGrad.addColorStop(0, '#1e222d');
    roadGrad.addColorStop(0.55, '#272c38');
    roadGrad.addColorStop(1, '#191c26');
    ctx.fillStyle = roadGrad;
    ctx.fill();

    // 台灣紅白標線人行道邊緣 + 霓虹微光
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.42, horizon);
    ctx.lineTo(w * 0.10, h);
    ctx.moveTo(w * 0.58, horizon);
    ctx.lineTo(w * 0.90, h);
    ctx.stroke();

    // 左車道外側雙黃線標線（寫實台北道路）
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.426, horizon);
    ctx.lineTo(w * 0.13, h);
    ctx.moveTo(w * 0.431, horizon);
    ctx.lineTo(w * 0.145, h);
    ctx.stroke();

    // 白色車道分隔虛線
    ctx.strokeStyle = 'rgba(241, 245, 249, 0.85)';
    ctx.lineWidth = 2.2;
    for (let seg = 0; seg < 8; seg += 1) {
      const z1 = (seg + this.roadOffset) / 8;
      const z2 = Math.min(1, z1 + 0.055);
      const y1 = this._zToY(z1, h);
      const y2 = this._zToY(z2, h);
      ctx.beginPath();
      ctx.moveTo(this._laneX(0.5, z1, w), y1);
      ctx.lineTo(this._laneX(0.5, z2, w), y2);
      ctx.moveTo(this._laneX(1.5, z1, w), y1);
      ctx.lineTo(this._laneX(1.5, z2, w), y2);
      ctx.stroke();
    }

    // 3. 依 Z 軸由遠而近繪製：2026 Tesla FSD 車流 + 道具/障礙物（零穿模 Z-sorting）
    const drawList = [
      ...this.entities.map((ent) => ({ kind: 'entity', z: ent.z, data: ent })),
      ...this.teslaCars.map((car) => ({ kind: 'tesla', z: car.z, data: car }))
    ].sort((a, b) => a.z - b.z);

    for (const item of drawList) {
      if (item.kind === 'tesla') {
        this._drawTeslaCar(ctx, item.data, w, h);
        continue;
      }
      const ent = item.data;
      const ex = this._laneX(ent.lane, ent.z, w);
      const ey = this._zToY(ent.z, h);
      const scale = 0.35 + ent.z * 0.9;
      const radius = 20 * scale;

      ctx.save();
      ctx.translate(ex, ey);
      ctx.fillStyle = ent.isGood ? 'rgba(0, 229, 255, 0.22)' : 'rgba(255, 59, 107, 0.26)';
      ctx.beginPath();
      ctx.arc(0, 0, radius + 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = ent.color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = `${Math.round(21 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ent.emoji, 0, 1);

      if (ent.z > 0.38 && ent.z < 0.85) {
        ctx.font = `bold ${Math.max(10, Math.round(11 * scale))}px sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(ent.label, 0, -radius - 8);
      }
      ctx.restore();
    }

    // 4. 繪製 2026 最新款旗艦電動跑旅機車（Gogoro Pulse / SYM DRGBT II 風格）+ 寫實安全帽騎士 + 大同電鍋
    const px = this._laneX(this.visualX, 0.9, w);
    const py = this._zToY(0.9, h);
    const lean = (this.lane - this.visualX) * 0.14;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(lean);

    if (this.shieldTimer > 0) {
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(74, 222, 128, 0.16)';
      ctx.beginPath();
      ctx.arc(0, -18, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 影子
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 15, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2026 寬胎後輪
    ctx.fillStyle = '#090d16';
    ctx.fillRect(-5, 3, 10, 14);

    // 2026 消光鈦銀 × 翡翠綠空力車殼整流罩
    const bikeGrad = ctx.createLinearGradient(-20, -18, 20, 10);
    bikeGrad.addColorStop(0, '#64748b');
    bikeGrad.addColorStop(0.5, '#10b981');
    bikeGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bikeGrad;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-16, 4);
    ctx.lineTo(-22, -11);
    ctx.lineTo(-10, -21);
    ctx.lineTo(10, -21);
    ctx.lineTo(22, -11);
    ctx.lineTo(16, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2026 矩陣式一體尾燈光條
    ctx.shadowColor = '#ff2a5f';
    ctx.shadowBlur = 9;
    ctx.fillStyle = '#ff3864';
    ctx.fillRect(-16, -12, 32, 3.2);
    ctx.shadowBlur = 0;

    // 雙側後視鏡與雙手握把（無穿模）
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14, -22); ctx.lineTo(-23, -29);
    ctx.moveTo(14, -22); ctx.lineTo(23, -29);
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-28, -32, 9, 4);
    ctx.fillRect(19, -32, 9, 4);

    // 車牌 AMA-666
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-10, -3, 20, 8);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 5.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AMA-666', 0, 3);

    // 寫實騎士身軀 + 雙臂穩握把手 + 亮面全罩/3/4安全帽
    ctx.fillStyle = '#9f1239';
    ctx.beginPath();
    ctx.roundRect(-12, -37, 24, 19, 6);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, -43, 10.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-7, -45, 14, 3);

    // 後貨架固定綠色大同電鍋（緊貼車尾架，絕不懸空穿模）
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(13, -20, 14, 11);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(12, -23, 16, 3);
    ctx.restore();

    // 5. 粒子特效
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 6. 頂部即時播報條
    if (this.bannerTimer > 0 && this.bannerText) {
      ctx.fillStyle = 'rgba(10, 14, 28, 0.9)';
      ctx.fillRect(14, 6, w - 28, 24);
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(14, 6, w - 28, 24);
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 11.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.bannerText, w / 2, 22);
    }
  }
}

export default GrandmaScooterGame;
