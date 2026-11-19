// Web Audio API 多軌 GTA 台北車載電台配樂合成器 ＋ 全角色台灣語音播報引擎（零外部音訊依賴）

export const RADIO_STATIONS = [
  {
    id: 'synthwave',
    name: 'FM 101.7 信義霓虹 Synthwave',
    short: 'FM 101.7 信義霓虹',
    tempoMs: 195,
    bass: [110, 110, 130.81, 146.83, 164.81, 146.83, 130.81, 98],
    lead: [440, 0, 523.25, 659.25, 587.33, 0, 523.25, 392.0],
    pad: [220, 261.63, 329.63]
  },
  {
    id: 'lofi',
    name: 'FM 88.6 市民大道 Lo-Fi 爵士',
    short: 'FM 88.6 市民爵士',
    tempoMs: 260,
    bass: [130.81, 0, 146.83, 164.81, 110, 0, 123.47, 98],
    lead: [392.0, 493.88, 0, 587.33, 329.63, 0, 440.0, 392.0],
    pad: [261.63, 329.63, 392.0, 493.88]
  },
  {
    id: 'cyber',
    name: 'FM 99.9 松仁極速 Cyber-Pulse',
    short: 'FM 99.9 松仁極速',
    tempoMs: 155,
    bass: [98, 98, 146.83, 98, 130.81, 130.81, 164.81, 116.54],
    lead: [587.33, 659.25, 783.99, 659.25, 523.25, 587.33, 659.25, 493.88],
    pad: [196, 293.66, 392.0]
  }
];

const VOICE_PROFILES = {
  narrator: { rate: 1.03, pitch: 0.98, volume: 0.95 },
  boss: { rate: 1.12, pitch: 0.88, volume: 0.95 },
  lisa: { rate: 1.13, pitch: 1.18, volume: 0.95 },
  cindy: { rate: 1.02, pitch: 1.06, volume: 0.95 },
  grandma: { rate: 0.92, pitch: 0.84, volume: 1.0 },
  fsd: { rate: 1.08, pitch: 1.08, volume: 0.9 }
};

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.bgmMaster = null;
    this.muted = false;
    this.voiceEnabled = true;
    this.speaking = false;
    this.activeVoiceRole = '';
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.stationIndex = 0;
    this.onVoiceChange = null;
    this._noiseBuffer = null;
  }

  _ensureCtx() {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.bgmMaster = this.ctx.createGain();
      this.bgmMaster.gain.setValueAtTime(0.65, this.ctx.currentTime);
      this.bgmMaster.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  _updateBgmDucking() {
    if (!this.ctx || !this.bgmMaster) return;
    const now = this.ctx.currentTime;
    const target = this.muted ? 0.0001 : (this.speaking ? 0.22 : 0.65);
    this.bgmMaster.gain.cancelScheduledValues(now);
    this.bgmMaster.gain.linearRampToValueAtTime(target, now + 0.12);
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.muted) {
      this.stopBGM();
      this.stopSpeech();
    } else {
      this._updateBgmDucking();
    }
  }

  setVoiceEnabled(enabled) {
    this.voiceEnabled = Boolean(enabled);
    if (!this.voiceEnabled) this.stopSpeech();
  }

  toggleVoice() {
    this.setVoiceEnabled(!this.voiceEnabled);
    return this.voiceEnabled;
  }

  getCurrentStation() {
    return RADIO_STATIONS[this.stationIndex % RADIO_STATIONS.length];
  }

  setStation(idx) {
    this.stationIndex = ((idx % RADIO_STATIONS.length) + RADIO_STATIONS.length) % RADIO_STATIONS.length;
    if (this.bgmTimer) {
      this.stopBGM();
      this.startBGM();
    }
    return this.getCurrentStation();
  }

  nextStation() {
    this.playClick();
    return this.setStation(this.stationIndex + 1);
  }

  _tone(freq, duration = 0.12, type = 'triangle', gainPeak = 0.12, delay = 0, targetNode = null) {
    const ctx = this._ensureCtx();
    if (!ctx || !freq) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(targetNode || ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.025);
  }

  _kick(delay = 0, targetNode = null) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(125, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.11);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
    osc.connect(gain);
    gain.connect(targetNode || this.bgmMaster || ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  _hihat(delay = 0, targetNode = null) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    if (!this._noiseBuffer) {
      const len = Math.floor(ctx.sampleRate * 0.045);
      this._noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = this._noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    }
    const now = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6200, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.024, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(targetNode || this.bgmMaster || ctx.destination);
    src.start(now);
  }

  playClick() {
    this._tone(640, 0.06, 'sine', 0.08, 0);
  }

  playLinePing() {
    this._tone(880, 0.09, 'sine', 0.11, 0);
    this._tone(1174.66, 0.14, 'sine', 0.1, 0.075);
  }

  playScooterHorn() {
    this._tone(420, 0.08, 'sawtooth', 0.09, 0);
    this._tone(440, 0.09, 'sawtooth', 0.09, 0.11);
  }

  playAutopilotChime() {
    // 2026 Tesla FSD Autopilot 雙聲提示音
    this._tone(587.33, 0.09, 'sine', 0.1, 0);
    this._tone(880.0, 0.18, 'sine', 0.11, 0.085);
  }

  playStampImpact() {
    // 宮廟金印「衡斷破局」厚實蓋章震音＋銅鐘泛音
    this._kick(0);
    this._tone(196, 0.14, 'triangle', 0.12, 0.01);
    this._tone(523.25, 0.34, 'sine', 0.09, 0.05);
  }

  playTatungCooker() {
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
    if (this.muted || this.bgmTimer || typeof window === 'undefined') return;
    const station = this.getCurrentStation();
    this.bgmTimer = setInterval(() => {
      if (this.muted) return;
      const st = this.getCurrentStation();
      const step = this.bgmStep % st.bass.length;
      const dest = this.bgmMaster || this.ctx?.destination;

      const bassFreq = st.bass[step];
      if (bassFreq) this._tone(bassFreq, 0.2, 'triangle', 0.045, 0, dest);

      const leadFreq = st.lead[step];
      if (leadFreq) this._tone(leadFreq, 0.15, st.id === 'lofi' ? 'sine' : 'sawtooth', 0.018, 0.02, dest);

      if (step === 0) {
        st.pad.forEach((pf) => this._tone(pf, 0.65, 'sine', 0.014, 0, dest));
      }

      if (step % 2 === 0) this._kick(0, dest);
      if (step % 2 === 1) this._hihat(0, dest);

      this.bgmStep += 1;
    }, station.tempoMs);
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  _pickZhTwVoice(roleKey) {
    if (typeof window === 'undefined' || !window.speechSynthesis?.getVoices) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    const tw = voices.filter((v) => /zh[-_]?tw|taiwan/i.test(`${v.lang} ${v.name}`));
    const zh = tw.length ? tw : voices.filter((v) => /zh|cmn|chinese/i.test(`${v.lang} ${v.name}`));
    if (!zh.length) return null;
    if (roleKey === 'lisa' || roleKey === 'cindy' || roleKey === 'grandma') {
      const fem = zh.find((v) => /meijia|hsiaochen|yun|ting|female/i.test(v.name));
      if (fem) return fem;
    }
    return zh[0];
  }

  stopSpeech() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    if (this.speaking) {
      this.speaking = false;
      this.activeVoiceRole = '';
      this._updateBgmDucking();
      if (typeof this.onVoiceChange === 'function') this.onVoiceChange(false, '');
    }
  }

  speak(text, roleKey = 'narrator', forceManual = false) {
    if (!text || this.muted) return false;
    if (!forceManual && !this.voiceEnabled) return false;
    if (typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
      return false;
    }

    this.stopSpeech();
    if (roleKey === 'grandma') this.playTatungCooker();

    const clean = String(text)
      .replace(/[「」『』\[\]【】]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180);
    if (!clean) return false;

    const profile = VOICE_PROFILES[roleKey] || VOICE_PROFILES.narrator;
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'zh-TW';
    const v = this._pickZhTwVoice(roleKey);
    if (v) utter.voice = v;
    utter.rate = profile.rate;
    utter.pitch = profile.pitch;
    utter.volume = profile.volume;

    utter.onstart = () => {
      this.speaking = true;
      this.activeVoiceRole = roleKey;
      this._updateBgmDucking();
      if (typeof this.onVoiceChange === 'function') this.onVoiceChange(true, roleKey);
    };
    const finish = () => {
      this.speaking = false;
      this.activeVoiceRole = '';
      this._updateBgmDucking();
      if (typeof this.onVoiceChange === 'function') this.onVoiceChange(false, '');
    };
    utter.onend = finish;
    utter.onerror = finish;

    try {
      window.speechSynthesis.speak(utter);
      return true;
    } catch {
      finish();
      return false;
    }
  }
}

export const soundFX = new SoundEngine();
export default soundFX;
