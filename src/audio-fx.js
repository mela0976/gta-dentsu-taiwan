// Web Audio API 程序化台味音效與 GTA 霓虹 Synthwave 配樂（零外部音訊檔依賴）
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
  }

  _ensureCtx() {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.muted) {
      this.stopBGM();
    }
  }

  _tone(freq, duration = 0.12, type = 'triangle', gainPeak = 0.12, delay = 0) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playClick() {
    this._tone(640, 0.06, 'sine', 0.08, 0);
  }

  playLinePing() {
    // 模擬台灣上班族恐懼又熟悉的 LINE 雙音通知
    this._tone(880, 0.09, 'sine', 0.11, 0);
    this._tone(1174.66, 0.14, 'sine', 0.1, 0.075);
  }

  playScooterHorn() {
    // 台灣 125cc 機車雙音「叭叭！」
    this._tone(420, 0.08, 'sawtooth', 0.09, 0);
    this._tone(440, 0.09, 'sawtooth', 0.09, 0.11);
  }

  playTatungCooker() {
    // 大同電鍋開關「喀！」＋溫熱叮咚
    this._tone(150, 0.08, 'square', 0.14, 0);
    this._tone(523.25, 0.16, 'triangle', 0.12, 0.09);
    this._tone(659.25, 0.18, 'triangle', 0.12, 0.22);
    this._tone(783.99, 0.26, 'triangle', 0.13, 0.36);
  }

  playWantedSiren() {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.linearRampToValueAtTime(860, now + 0.18);
    osc.frequency.linearRampToValueAtTime(520, now + 0.36);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.44);
  }

  playMissionPassed() {
    // GTA 任務過關霓虹和弦
    const notes = [392.0, 493.88, 587.33, 783.99];
    notes.forEach((n, idx) => {
      this._tone(n, 0.28, 'triangle', 0.11, idx * 0.09);
    });
  }

  playPickup(good = true) {
    if (good) {
      this._tone(659.25, 0.09, 'sine', 0.11, 0);
      this._tone(987.77, 0.14, 'sine', 0.1, 0.06);
    } else {
      this._tone(210, 0.16, 'sawtooth', 0.11, 0);
      this._tone(145, 0.22, 'sawtooth', 0.1, 0.08);
    }
  }

  startBGM() {
    if (this.muted || this.bgmTimer) return;
    const bassline = [110, 110, 130.81, 146.83, 164.81, 146.83, 130.81, 98];
    this.bgmTimer = setInterval(() => {
      if (this.muted) return;
      const freq = bassline[this.bgmStep % bassline.length];
      this._tone(freq, 0.22, 'triangle', 0.035, 0);
      if (this.bgmStep % 4 === 2) {
        this._tone(freq * 3, 0.14, 'sine', 0.018, 0.04);
      }
      this.bgmStep += 1;
    }, 320);
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const soundFX = new SoundEngine();
export default soundFX;
