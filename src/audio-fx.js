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

export const normalizeGrandmaVoiceKey = (text) =>
  String(text || '')
    .replace(/\uFE0F/g, '')
    .replace(/[📞🔊👵🍲📩⚡🎯🎬🛵🚗⭐🔥🧠🎙☎\[\]【】]/g, '')
    .trim()
    .replace(/^阿嬤說[:：]?/, '')
    .replace(/[「」『』""“”''‘’（）()，。！？、：；…—\-·\s]/g, '');

export const GRANDMA_VOICE_CLIPS = {
  '做生意跟煮飯一樣火候到了客人自己會來': './public/audio/grandma/quote.mp3',
  '你們這些少年仔報表看得比吃飯還認真肚子都沒在顧先吃飯數字不會跑掉啦': './public/audio/grandma/rescue_0.mp3',
  '什麼歸因阿嬤買菜只看一件事這攤的菜我下禮拜還想不想再來': './public/audio/grandma/rescue_1.mp3',
  '免費的最貴這個阿嬤在菜市場六十年了你那個0.5秒的曝光連蔥都送不到一把': './public/audio/grandma/rescue_2.mp3',
  'AI寫的文案喔很會講但是沒有鍋氣啦人家吃一口就知道有沒有用心': './public/audio/grandma/rescue_3.mp3',
  '老闆講什麼你都說好那是跟班講出你的判斷再被罵那才是顧問來吃肉': './public/audio/grandma/rescue_4.mp3',
  '老主顧本來就會來你還跟人家說是你吆喝來的這樣算帳菜攤早就倒了': './public/audio/grandma/ch1_quip.mp3',
  '師傅怕徒弟徒弟就去隔壁拜別人當師傅真的有本事教出一百個徒弟你還是師傅': './public/audio/grandma/ch2_quip.mp3',
  '景氣差菜攤也不能把招牌拆下來賣廢鐵生意回來的時候客人是看招牌找路的': './public/audio/grandma/ch3_quip.mp3',
  '客人自己說老闆我下次還來比你偷偷記他住哪裡可靠一百倍': './public/audio/grandma/ch4_quip.mp3',
  '嘴巴說要吃有機結帳還是挑最便宜的那一把青菜你要賣有機就要讓人覺得值得': './public/audio/grandma/ch5_quip.mp3',
  '機器煮飯很快但客人記得的是那碗飯有沒有人的味道多煮十鍋也比不上一碗讓人想再來的': './public/audio/grandma/ch6_quip.mp3',
  '房東又是收租的又幫你算生意好不好這樣的帳你不能全信要自己拿個小本子記': './public/audio/grandma/ch7_quip.mp3',
  '攤位只賣給熟客生意數字很好看但哪天熟客搬家你就沒人買了要常常叫賣給路過的新面孔': './public/audio/grandma/ch8_quip.mp3',
  '客人問哪一攤的魚好鄰居講你的名字比你拿喇叭喊一百次還有用這個叫口碑': './public/audio/grandma/ch9_quip.mp3',
  '秤子不準是老闆的責任不是秤子的責任判斷這件事從來沒有辦法外包給別人': './public/audio/grandma/ch10_quip.mp3',
  '少年仔早餐有吃嗎冰奶不算吐司也不算要吃飯啦': './public/audio/grandma/ch1_call.mp3',
  '開會不要一直看手機人家講話要看著眼睛這樣才有禮貌': './public/audio/grandma/ch2_call.mp3',
  '外面下雨雞腿便當不要邊走邊吃會滴到襯衫晚上還要見客戶': './public/audio/grandma/ch3_call.mp3',
  '那個推銷的講話太快一直笑的人要小心簽名之前先回來問阿嬤': './public/audio/grandma/ch4_call.mp3',
  '雞排不要一次吃那麼多啦會上火珍奶也要少糖阿嬤看你都沒在顧身體': './public/audio/grandma/ch5_call.mp3',
  '喂你們是不是在拍什麼有些味道一喝就回到阿嬤家的廚房那句是誰寫的阿嬤現在騎電動車過去你們先不要亂砍預算等我帶鍋子到': './public/audio/grandma/ch6_call.mp3',
  '晚餐不要又叫外送阿嬤在電鍋裡有留一份你下班回來記得吃': './public/audio/grandma/ch7_call.mp3',
  '這麼晚還在外面坐計程車記得繫安全帶到了要傳訊息跟阿嬤說': './public/audio/grandma/ch8_call.mp3',
  '熱炒吃太鹹回家記得喝水阿嬤有煮綠豆湯明天早上熱一下': './public/audio/grandma/ch9_call.mp3',
  '決定好了就去做不要想太久不管結果怎樣回家阿嬤的電鍋都還是熱的': './public/audio/grandma/ch10_call.mp3',
  '賣菜的最清楚天天來買的老主顧你站在攤位前面喊一聲他也會買': './public/audio/grandma/ch1_clue.mp3',
  '徒弟學會了就出去開店那你就當師傅開班收學費還能抽成': './public/audio/grandma/ch2_clue.mp3',
  '生意難做的時候更不能關門招牌熄了客人下次就不認得路了': './public/audio/grandma/ch3_clue.mp3',
  '客人還沒開口你就先跟蹤人家回家這種生意菜市場叫做討人厭': './public/audio/grandma/ch4_clue.mp3',
  '嘴巴說愛護地球結帳還是挑便宜的這是人之常情你不要罵人家': './public/audio/grandma/ch5_clue.mp3',
  '機器煮的飯可以吃但客人記得的是阿嬤的味道': './public/audio/grandma/ch6_clue.mp3',
  '又當老闆又當評審的攤位你的菜怎麼賣得贏他': './public/audio/grandma/ch7_clue.mp3',
  '一直只賣給熟客生意看起來很好但三年後就沒有新朋友了': './public/audio/grandma/ch8_clue.mp3',
  '客人問鄰居哪一攤好鄰居講你的名字這比貼多少海報都有用': './public/audio/grandma/ch9_clue.mp3',
  '對老主顧多收錢阿嬤這輩子沒這樣做過你自己決定不要推給機器': './public/audio/grandma/ch10_clue.mp3'
};

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.bgmMaster = null;
    this.muted = false;
    this.voiceEnabled = true;
    this.speaking = false;
    this.activeVoiceRole = '';
    this.activeAudio = null;
    this._audioToken = 0;
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

  resolveGrandmaClip(text) {
    return GRANDMA_VOICE_CLIPS[normalizeGrandmaVoiceKey(text)] || null;
  }

  _clearSpeechState() {
    if (this.speaking || this.activeVoiceRole) {
      this.speaking = false;
      this.activeVoiceRole = '';
      this._updateBgmDucking();
      if (typeof this.onVoiceChange === 'function') this.onVoiceChange(false, '');
    }
  }

  stopSpeech() {
    this._audioToken += 1;
    if (this.activeAudio) {
      try {
        this.activeAudio.onended = null;
        this.activeAudio.onerror = null;
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch {}
      this.activeAudio = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this._clearSpeechState();
  }

  _speakWithWebSpeech(cleanText, roleKey) {
    if (typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
      return false;
    }

    const speechBody = String(cleanText)
      .replace(/[「」『』\[\]【】]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180);
    if (!speechBody) return false;

    const profile = VOICE_PROFILES[roleKey] || VOICE_PROFILES.narrator;
    const utter = new SpeechSynthesisUtterance(speechBody);
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
    const finish = () => this._clearSpeechState();
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

  speak(text, roleKey = 'narrator', forceManual = false) {
    if (!text || this.muted) return false;
    if (!forceManual && !this.voiceEnabled) return false;

    const clean = String(text)
      .replace(/\uFE0F/g, '')
      .replace(/[📞🔊👵🍲📩⚡🎯🎬🛵🚗⭐🔥🧠🎙☎]/g, '')
      .trim();
    if (!clean) return false;

    this.stopSpeech();

    if (roleKey === 'grandma') {
      this.playTatungCooker();
      const clipUrl = this.resolveGrandmaClip(clean);
      if (clipUrl && typeof Audio !== 'undefined') {
        const token = ++this._audioToken;
        const audio = new Audio(clipUrl);
        audio.preload = 'auto';
        audio.volume = 1.0;
        this.activeAudio = audio;
        this.speaking = true;
        this.activeVoiceRole = 'grandma';
        this._updateBgmDucking();
        if (typeof this.onVoiceChange === 'function') this.onVoiceChange(true, 'grandma');

        audio.onended = () => {
          if (token !== this._audioToken) return;
          this.activeAudio = null;
          this._clearSpeechState();
        };
        audio.onerror = () => {
          if (token !== this._audioToken) return;
          this.activeAudio = null;
          this._clearSpeechState();
          this._speakWithWebSpeech(clean, 'grandma');
        };

        try {
          const playPromise = audio.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch((err) => {
              if (token !== this._audioToken) return;
              this.activeAudio = null;
              this._clearSpeechState();
              if (err?.name !== 'NotAllowedError') {
                this._speakWithWebSpeech(clean, 'grandma');
              }
            });
          }
          return true;
        } catch {
          this.activeAudio = null;
          this._clearSpeechState();
        }
      }
    }

    return this._speakWithWebSpeech(clean, roleKey);
  }
}

export const soundFX = new SoundEngine();
export default soundFX;
