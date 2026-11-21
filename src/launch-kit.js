// 上線強化工具組：存檔驗證、數值變動摘要、成就系統、跨局進度追蹤、戰績圖卡生成與病毒式分享文案
export const META_STORAGE_KEY = 'gta_dentsu_meta_v2';
export const AUDIO_PREFS_KEY = 'gta_dentsu_audio_v1';
export const LIVE_GAME_URL = 'https://mela0976.github.io/gta-dentsu-taiwan/';

export const ACHIEVEMENT_IDS = [
  'first_shift',
  'sharp_judge',
  'grandma_blessed',
  'scooter_ace',
  'mind_reader',
  'multi_role'
];

const VALID_PHASES = new Set(['title', 'role', 'cutscene', 'scene', 'game', 'reveal', 'review']);
const VALID_ROLES = new Set(['account', 'planner', 'creative', 'media', 'grandma']);

function boundNum(v, lo, hi, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

export function createEmptyMeta() {
  return {
    clearedRoles: {},
    achievements: [],
    bestScore: 0,
    bestScooterScore: 0,
    totalRuns: 0
  };
}

export function mergeCareerRecords(current, legacy) {
  const clearedRoles = { ...current.clearedRoles };
  for (const [role, oldRecord] of Object.entries(legacy?.clearedRoles || {})) {
    if (!VALID_ROLES.has(role) || !oldRecord) continue;
    const record = clearedRoles[role];
    clearedRoles[role] = {
      bestScore: Math.max(record?.bestScore || 0, oldRecord.bestScore || 0),
      runs: Math.max(record?.runs || 0, oldRecord.runs || 0),
      lastPersonaId: record?.lastPersonaId || oldRecord.lastPersonaId || null
    };
  }

  const achievements = [
    ...(Array.isArray(current.achievements) ? current.achievements : []),
    ...(Array.isArray(legacy?.achievements) ? legacy.achievements : [])
  ];
  const runsByRole = Object.values(clearedRoles).reduce((total, role) => total + (Number(role?.runs) || 0), 0);
  const merged = {
    clearedRoles,
    achievements,
    bestScore: Math.max(current.bestScore || 0, legacy?.bestScore || 0),
    bestScooterScore: Math.max(current.bestScooterScore || 0, legacy?.bestScooterScore || 0),
    // Per-role maxima avoid counting the shared pre-migration history twice.
    totalRuns: Math.max(current.totalRuns || 0, legacy?.totalRuns || 0, runsByRole)
  };
  merged.achievements = evaluateAchievements(merged, null);
  return merged;
}

export function sanitizeLoadedState(raw, fallbackFactory, chapterCount = 10) {
  const base = fallbackFactory();
  if (!raw || typeof raw !== 'object' || !raw.stats || typeof raw.stats !== 'object') {
    return base;
  }
  const maxIdx = Math.max(0, Number(chapterCount || 10) - 1);
  const roleId = VALID_ROLES.has(raw.roleId) ? raw.roleId : base.roleId;
  let phase = VALID_PHASES.has(raw.phase) ? raw.phase : base.phase;
  if ((phase === 'game' || phase === 'reveal') && !raw.activeReply && phase === 'game') {
    phase = 'scene';
  }
  const grandmaUnlocked = Boolean(raw.grandmaUnlocked);
  return {
    ...base,
    ...raw,
    phase,
    roleId: roleId === 'grandma' && !grandmaUnlocked ? 'planner' : roleId,
    grandmaUnlocked,
    grandmaActive: Boolean(raw.grandmaActive),
    grandmaRescues: boundNum(raw.grandmaRescues, 0, 999, 0),
    cheatUsed: Boolean(raw.cheatUsed),
    chapterIndex: boundNum(raw.chapterIndex, 0, maxIdx, 0),
    stats: {
      stamina: boundNum(raw.stats.stamina, 0, 100, base.stats.stamina),
      streetCred: boundNum(raw.stats.streetCred, 0, 100, base.stats.streetCred),
      realLift: boundNum(raw.stats.realLift, 0, 100, base.stats.realLift),
      brandTrust: boundNum(raw.stats.brandTrust, 0, 100, base.stats.brandTrust),
      judgment: boundNum(raw.stats.judgment, 0, 100, base.stats.judgment)
    },
    wantedStars: boundNum(raw.wantedStars, 0, 5, base.wantedStars),
    points: Math.max(0, Math.round(Number(raw.points) || 0)),
    perfPicks: Number.isFinite(Number(raw.perfPicks)) ? Number(raw.perfPicks) : 0,
    gamesScoredCount: boundNum(raw.gamesScoredCount, 0, 99, 0),
    gamesCorrectCount: boundNum(raw.gamesCorrectCount, 0, 99, 0),
    askedTwins: Array.isArray(raw.askedTwins) ? raw.askedTwins.filter((x) => typeof x === 'string') : [],
    roleSpecialUsedThisChapter: Boolean(raw.roleSpecialUsedThisChapter),
    scooterPlayedCount: boundNum(raw.scooterPlayedCount, 0, 999, 0),
    scooterBestScore: Math.max(0, Math.round(Number(raw.scooterBestScore) || 0)),
    history: Array.isArray(raw.history) ? raw.history.slice(0, chapterCount) : [],
    phoneLog: Array.isArray(raw.phoneLog) ? raw.phoneLog.slice(-60) : []
  };
}

export function computeStatDeltas(prevState, nextState) {
  if (!prevState || !nextState) return [];
  const out = [];
  const ptsDelta = (Number(nextState.points) || 0) - (Number(prevState.points) || 0);
  if (ptsDelta !== 0) out.push({ key: 'points', delta: ptsDelta });
  const wantedDelta = (Number(nextState.wantedStars) || 0) - (Number(prevState.wantedStars) || 0);
  if (wantedDelta !== 0) out.push({ key: 'wantedStars', delta: wantedDelta });
  for (const key of ['stamina', 'streetCred', 'realLift', 'brandTrust', 'judgment']) {
    const prevVal = Number(prevState.stats?.[key] ?? 0);
    const nextVal = Number(nextState.stats?.[key] ?? 0);
    const diff = nextVal - prevVal;
    if (diff !== 0) out.push({ key, delta: diff });
  }
  return out;
}

export function evaluateAchievements(meta, state, isRunComplete = false) {
  const safeMeta = meta || createEmptyMeta();
  const clearedCount = Object.keys(safeMeta.clearedRoles || {}).length;
  const bestScooter = Math.max(Number(safeMeta.bestScooterScore || 0), Number(state?.scooterBestScore || 0));
  const unlocked = new Set(Array.isArray(safeMeta.achievements) ? safeMeta.achievements : []);

  if (isRunComplete || clearedCount >= 1) unlocked.add('first_shift');
  if (isRunComplete && Number(state?.gamesScoredCount || 0) > 0 && (state.gamesCorrectCount / state.gamesScoredCount) >= 0.8) {
    unlocked.add('sharp_judge');
  }
  if (state?.grandmaUnlocked || Number(state?.grandmaRescues || 0) > 0 || state?.roleId === 'grandma') {
    unlocked.add('grandma_blessed');
  }
  if (bestScooter >= 1200) unlocked.add('scooter_ace');
  if (state?.roleSpecialUsedThisChapter && (state.askedTwins?.length || 0) >= 1) unlocked.add('mind_reader');
  if (clearedCount >= 2) unlocked.add('multi_role');

  return ACHIEVEMENT_IDS.filter((id) => unlocked.has(id));
}

export function updateCareerMeta(prevMeta, state, personaId = null, isRunComplete = false) {
  const base = {
    ...createEmptyMeta(),
    ...(prevMeta && typeof prevMeta === 'object' ? prevMeta : {}),
    clearedRoles: { ...((prevMeta && prevMeta.clearedRoles) || {}) },
    achievements: Array.isArray(prevMeta?.achievements) ? [...prevMeta.achievements] : []
  };

  if (isRunComplete && state?.roleId) {
    const prevRec = base.clearedRoles[state.roleId] || { bestScore: 0, runs: 0, lastPersonaId: null };
    base.clearedRoles[state.roleId] = {
      bestScore: Math.max(prevRec.bestScore || 0, Number(state.points || 0)),
      runs: (prevRec.runs || 0) + 1,
      lastPersonaId: personaId || prevRec.lastPersonaId || null
    };
    base.totalRuns = (base.totalRuns || 0) + 1;
  }

  base.bestScore = Math.max(base.bestScore || 0, Number(state?.points || 0));
  base.bestScooterScore = Math.max(base.bestScooterScore || 0, Number(state?.scooterBestScore || 0));

  const prevSet = new Set(base.achievements);
  const nextAch = evaluateAchievements(base, state, isRunComplete);
  const newlyUnlocked = nextAch.filter((id) => !prevSet.has(id));
  base.achievements = nextAch;

  return { meta: base, newlyUnlocked };
}

export function buildShareSummaryText({ role, persona, state, meta, lang, tFn }) {
  const achCount = (meta?.achievements || []).length;
  const shareUrl = lang && lang !== 'zh' ? `${LIVE_GAME_URL}?lang=${encodeURIComponent(lang)}` : LIVE_GAME_URL;
  return tFn('launch.shareTemplate', {
    roleName: role?.name || '',
    personaName: persona?.name || '',
    points: Number(state?.points || 0).toLocaleString(),
    correct: Number(state?.gamesCorrectCount || 0),
    total: Number(state?.gamesScoredCount || 0),
    achCount,
    achTotal: ACHIEVEMENT_IDS.length,
    url: shareUrl
  });
}

function drawRoundedRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function drawWrappedText(ctx, text, x, y, maxW, lineH, maxLines = 3) {
  const chars = Array.from(String(text || ''));
  let line = '';
  let cy = y;
  let count = 0;
  for (let i = 0; i < chars.length; i += 1) {
    const test = line + chars[i];
    if (ctx.measureText(test).width > maxW && line) {
      count += 1;
      if (count >= maxLines) {
        ctx.fillText(line.slice(0, -1) + '…', x, cy);
        return cy + lineH;
      }
      ctx.fillText(line, x, cy);
      line = chars[i];
      cy += lineH;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, cy);
    cy += lineH;
  }
  return cy;
}

export function renderResultCardCanvas({ role, persona, state, meta, hudStats, tFn, portraitImg = null }) {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Dark synthwave gradient background
  const bg = ctx.createLinearGradient(0, 0, 1200, 630);
  bg.addColorStop(0, '#0a0518');
  bg.addColorStop(0.55, '#190b34');
  bg.addColorStop(1, '#091426');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 630);

  // Neon ambient radial glow
  const glow1 = ctx.createRadialGradient(220, 120, 20, 220, 120, 420);
  glow1.addColorStop(0, 'rgba(255, 79, 163, 0.24)');
  glow1.addColorStop(1, 'rgba(255, 79, 163, 0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, 1200, 630);

  const glow2 = ctx.createRadialGradient(980, 500, 20, 980, 500, 440);
  glow2.addColorStop(0, 'rgba(0, 229, 255, 0.22)');
  glow2.addColorStop(1, 'rgba(0, 229, 255, 0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, 1200, 630);

  // Outer card frame
  drawRoundedRectPath(ctx, 26, 26, 1148, 578, 22);
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  ctx.stroke();

  drawRoundedRectPath(ctx, 36, 36, 1128, 558, 18);
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Header kicker & game title
  ctx.fillStyle = '#00e5ff';
  ctx.font = 'bold 20px "PingFang TC", "Noto Sans TC", system-ui, sans-serif';
  ctx.fillText('DENTSU TAIWAN · FUBON A25 · 2018–2026', 64, 82);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 22px "PingFang TC", "Noto Sans TC", system-ui, sans-serif';
  ctx.fillText(tFn('launch.cardSubtitle'), 64, 114);

  // Persona headline
  ctx.fillStyle = '#ffd166';
  ctx.font = '900 48px "PingFang TC", "Noto Sans TC", system-ui, sans-serif';
  ctx.fillText(persona?.name || '', 64, 182);

  ctx.fillStyle = '#ff6ad5';
  ctx.font = 'bold 24px "PingFang TC", "Noto Sans TC", system-ui, sans-serif';
  drawWrappedText(ctx, `${role?.name || ''} · ${persona?.title || ''}`, 64, 222, 700, 32, 2);

  // Score pill on top-right
  drawRoundedRectPath(ctx, 820, 64, 312, 86, 14);
  ctx.fillStyle = 'rgba(10, 42, 16, 0.85)';
  ctx.fill();
  ctx.strokeStyle = '#a8ff3e';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#a8ff3e';
  ctx.font = '900 42px "PingFang TC", "Noto Sans TC", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`$${Number(state?.points || 0).toLocaleString()}`, 976, 120);
  ctx.textAlign = 'left';

  // Portrait avatar card on right
  drawRoundedRectPath(ctx, 836, 174, 280, 280, 18);
  ctx.fillStyle = '#140b26';
  ctx.fill();
  ctx.strokeStyle = role?.color || '#00e5ff';
  ctx.lineWidth = 3;
  ctx.stroke();

  if (portraitImg && portraitImg.complete && portraitImg.naturalWidth > 0) {
    ctx.save();
    drawRoundedRectPath(ctx, 840, 178, 272, 272, 15);
    ctx.clip();
    try {
      const sSize = Math.min(portraitImg.naturalWidth, portraitImg.naturalHeight);
      const sx = (portraitImg.naturalWidth - sSize) / 2;
      const sy = Math.max(0, (portraitImg.naturalHeight - sSize) * 0.18);
      ctx.drawImage(portraitImg, sx, sy, sSize, sSize, 840, 178, 272, 272);
    } catch {
      // ignore tainted image fallback
    }
    ctx.restore();
  }

  // 5 Segmented stats bars
  const stats = Array.isArray(hudStats) ? hudStats : [];
  let sy = 290;
  stats.forEach((st) => {
    const val = Number(state?.stats?.[st.key] ?? 0);
    ctx.fillStyle = '#ece4fc';
    ctx.font = 'bold 20px "PingFang TC", "Noto Sans TC", system-ui, sans-serif';
    ctx.fillText(st.label, 64, sy);

    const onSegs = Math.max(0, Math.min(10, Math.round(val / 10)));
    for (let s = 0; s < 10; s += 1) {
      ctx.fillStyle = s < onSegs ? (st.color || '#00e5ff') : 'rgba(255, 255, 255, 0.14)';
      ctx.fillRect(190 + s * 46, sy - 16, 38, 16);
    }

    ctx.fillStyle = '#ffd166';
    ctx.font = '900 20px monospace';
    ctx.fillText(String(val), 670, sy);
    sy += 44;
  });

  // Footer badges (accuracy, milestones, URL)
  const accText = tFn('launch.cardAccuracy', Number(state?.gamesCorrectCount || 0), Number(state?.gamesScoredCount || 0));
  const achText = tFn('launch.cardMilestones', (meta?.achievements || []).length, ACHIEVEMENT_IDS.length);

  drawRoundedRectPath(ctx, 64, 514, 240, 50, 12);
  ctx.fillStyle = 'rgba(0, 229, 255, 0.14)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#00e5ff';
  ctx.font = 'bold 20px "PingFang TC", "Noto Sans TC", system-ui, sans-serif';
  ctx.fillText(accText, 84, 546);

  drawRoundedRectPath(ctx, 322, 514, 240, 50, 12);
  ctx.fillStyle = 'rgba(255, 209, 102, 0.14)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.fillText(achText, 342, 546);

  ctx.fillStyle = '#b8accf';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('mela0976.github.io/gta-dentsu-taiwan', 1130, 546);
  ctx.textAlign = 'left';

  try {
    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
}
