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
    this.spawnCooldown = 0.45;
    this.roadOffset = 0;
    this.running = false;
    this.rafId = null;
    this.lastTs = 0;
    this.bannerText = '阿嬤騎買菜車衝進 2026 信義區松仁路！掠過陶朱隱園直達富邦 A25 電通大樓！';
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
            this.bannerText = '大同電鍋無敵護盾啟動！演算法撞不倒阿嬤！';
            this.bannerTimer = 2.0;
          } else {
            this.bannerText = `撿到 ${ent.label}！+${ent.pts}`;
            this.bannerTimer = 1.1;
          }
          this._emitParticles(px, py, ent.color, 14);
          this.onEvent('good');
        } else if (this.shieldTimer > 0) {
          this.score += 120;
          this.bannerText = `大同電鍋彈飛「${ent.label}」！+120`;
          this.bannerTimer = 1.2;
          this._emitParticles(px, py, '#4ade80', 14);
          this.onEvent('good');
        } else {
          this.hp = Math.max(0, this.hp - (ent.dmg || 1));
          this.combo = 0;
          this.score = Math.max(0, this.score + (ent.pts || -60));
          this.bannerText = `撞到 ${ent.label}！「唉唷，這款數字攏係假！」`;
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

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const horizon = h * 0.34;

    // 1. GTA 6 台灣夕陽夜市天空漸層
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#190b2e');
    sky.addColorStop(0.55, '#6b1d5e');
    sky.addColorStop(1, '#ff6b4a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, horizon + 2);

    // 霓虹太陽 + 台北 101 剪影
    ctx.fillStyle = 'rgba(255, 198, 92, 0.85)';
    ctx.beginPath();
    ctx.arc(w * 0.5, horizon - 14, 40, Math.PI, 0);
    ctx.fill();

    // 1.1 「陶朱隱園」雙螺旋旋轉豪宅剪影（陶朱隱園實景地標）
    const ax = w * 0.25;
    for (let fl = 0; fl < 9; fl += 1) {
      const fy = horizon - 7 - fl * 6.5;
      const shift = Math.sin((fl / 8) * Math.PI) * 7 - 3;
      const fw = 30 - Math.abs(4 - fl) * 1.1;
      ctx.fillStyle = '#18102d';
      ctx.fillRect(ax - fw / 2 + shift, fy, fw, 5.5);
      ctx.fillStyle = fl % 2 === 0 ? '#4ade80' : '#00e5ff';
      ctx.fillRect(ax - fw / 2 + shift + 2, fy + 1.5, 4, 2.5);
      ctx.fillRect(ax + fw / 2 + shift - 6, fy + 1.5, 4, 2.5);
    }

    // 1.2 「富邦 A25 電通大樓」玻璃摩天樓剪影
    const fx = w * 0.67;
    ctx.fillStyle = '#140c29';
    ctx.fillRect(fx - 15, horizon - 74, 30, 74);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.48)';
    ctx.lineWidth = 1;
    for (let gy = horizon - 68; gy < horizon - 6; gy += 9) {
      ctx.beginPath();
      ctx.moveTo(fx - 12, gy);
      ctx.lineTo(fx + 12, gy);
      ctx.stroke();
    }
    ctx.fillStyle = '#ff52b8';
    ctx.fillRect(fx - 13, horizon - 76, 26, 3);

    // 1.3 台北 101 剪影
    ctx.fillStyle = '#150826';
    const tx = w * 0.84;
    ctx.fillRect(tx - 10, horizon - 72, 20, 72);
    ctx.fillRect(tx - 14, horizon - 54, 28, 12);
    ctx.fillRect(tx - 13, horizon - 36, 26, 12);
    ctx.fillRect(tx - 2, horizon - 88, 4, 18);

    // 2026 信義區街邊霓虹招牌（位於頂部播報條下方，互不遮擋）
    const signs = [
      { x: 0.10, y: 0.25, txt: '大冰奶', c: '#00e5ff' },
      { x: 0.25, y: 0.15, txt: '陶朱隱園', c: '#4ade80' },
      { x: 0.67, y: 0.14, txt: '富邦A25電通', c: '#ffd166' },
      { x: 0.91, y: 0.25, txt: '熱炒', c: '#ff52b8' }
    ];
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    signs.forEach((s) => {
      const boxW = Math.max(46, s.txt.length * 12 + 12);
      ctx.fillStyle = 'rgba(15,8,30,0.88)';
      ctx.fillRect(w * s.x - boxW / 2, h * s.y - 10, boxW, 18);
      ctx.strokeStyle = s.c;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(w * s.x - boxW / 2, h * s.y - 10, boxW, 18);
      ctx.fillStyle = s.c;
      ctx.fillText(s.txt, w * s.x, h * s.y + 3);
    });

    // 2. 柏油地面與霓虹路面梯形
    ctx.fillStyle = '#0d0718';
    ctx.fillRect(0, horizon, w, h - horizon);

    ctx.beginPath();
    ctx.moveTo(w * 0.42, horizon);
    ctx.lineTo(w * 0.58, horizon);
    ctx.lineTo(w * 0.88, h);
    ctx.lineTo(w * 0.12, h);
    ctx.closePath();
    const roadGrad = ctx.createLinearGradient(0, horizon, 0, h);
    roadGrad.addColorStop(0, '#23133b');
    roadGrad.addColorStop(1, '#140c24');
    ctx.fillStyle = roadGrad;
    ctx.fill();

    // 道路兩側霓虹護欄線
    ctx.strokeStyle = '#ff52b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.42, horizon);
    ctx.lineTo(w * 0.12, h);
    ctx.moveTo(w * 0.58, horizon);
    ctx.lineTo(w * 0.88, h);
    ctx.stroke();

    // 虛線車道分隔
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
    ctx.lineWidth = 2;
    for (let seg = 0; seg < 8; seg += 1) {
      const z1 = ((seg + this.roadOffset) / 8);
      const z2 = Math.min(1, z1 + 0.06);
      const y1 = this._zToY(z1, h);
      const y2 = this._zToY(z2, h);
      const xL1 = this._laneX(0.5, z1, w);
      const xL2 = this._laneX(0.5, z2, w);
      const xR1 = this._laneX(1.5, z1, w);
      const xR2 = this._laneX(1.5, z2, w);
      ctx.beginPath();
      ctx.moveTo(xL1, y1); ctx.lineTo(xL2, y2);
      ctx.moveTo(xR1, y1); ctx.lineTo(xR2, y2);
      ctx.stroke();
    }

    // 3. 排序繪製道具與障礙物
    const sorted = [...this.entities].sort((a, b) => a.z - b.z);
    for (const ent of sorted) {
      const ex = this._laneX(ent.lane, ent.z, w);
      const ey = this._zToY(ent.z, h);
      const scale = 0.35 + ent.z * 0.9;
      const radius = 20 * scale;

      ctx.save();
      ctx.translate(ex, ey);
      ctx.fillStyle = ent.isGood ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 59, 107, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, radius + 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = ent.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = `${Math.round(22 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ent.emoji, 0, 1);

      if (ent.z > 0.35) {
        ctx.font = `bold ${Math.max(10, Math.round(11 * scale))}px sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(ent.label, 0, -radius - 8);
      }
      ctx.restore();
    }

    // 4. 繪製阿嬤與綠色買菜電動車 + 大同電鍋
    const px = this._laneX(this.visualX, 0.9, w);
    const py = this._zToY(0.9, h);
    ctx.save();
    ctx.translate(px, py);

    if (this.shieldTimer > 0) {
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(74, 222, 128, 0.16)';
      ctx.beginPath();
      ctx.arc(0, -14, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 影子與霓虹尾燈
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 30, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // 機車車身
    ctx.fillStyle = '#38d399';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-20, -16, 40, 26, 10);
    ctx.fill();
    ctx.stroke();

    // 雙尾燈
    ctx.fillStyle = '#ff3b6b';
    ctx.fillRect(-16, -2, 8, 5);
    ctx.fillRect(8, -2, 8, 5);

    // 車牌台灣味
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-10, 4, 20, 7);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AMA-666', 0, 9.5);

    // 阿嬤安全帽與花襯衫 + 菜籃大同電鍋
    ctx.font = '26px sans-serif';
    ctx.fillText('👵', 0, -28);
    ctx.font = '15px sans-serif';
    ctx.fillText('🍲', 20, -12);
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
      ctx.fillStyle = 'rgba(12, 8, 28, 0.88)';
      ctx.fillRect(14, 6, w - 28, 26);
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(14, 6, w - 28, 26);
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.bannerText, w / 2, 23);
    }
  }
}

export default GrandmaScooterGame;
