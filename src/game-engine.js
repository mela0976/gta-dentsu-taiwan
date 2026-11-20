// 純函式遊戲狀態機：決策智慧 GTA 6 台灣生活情境遊戲
// 零 DOM 相依，可在 Node 測試與瀏覽器前端共用。

import { PEOPLE_MODEL_TWINS, GRANDMA_QUIPS, CHAPTERS } from './story-data.js';
import { ROLE_ROUTE_META, getChapterForRole } from './role-stories.js';
import { getLang, t, getLocalizedRole, getLocalizedTwins, getLocalizedGrandmaQuips, getLocalizedPersonas, getLocalizedChapterForRole } from './i18n.js';

export { ROLE_ROUTE_META, getChapterForRole };

export const CHEAT_CODE = GRANDMA_QUIPS.cheatCode || 'AMA666';

export function clampStat(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(val)));
}

export function createInitialState() {
  return {
    phase: 'title', // 'title' | 'role' | 'cutscene' | 'scene' | 'game' | 'reveal' | 'scooter' | 'review'
    roleId: 'planner',
    grandmaUnlocked: false,
    grandmaActive: false,
    grandmaRescues: 0,
    cheatUsed: false,
    chapterIndex: 0,
    stats: {
      stamina: 80,
      streetCred: 70,
      realLift: 70,
      brandTrust: 85,
      judgment: 80,
    },
    wantedStars: 1,
    points: 0,
    perfPicks: 0,
    gamesScoredCount: 0,
    gamesCorrectCount: 0,
    askedTwins: [], // e.g., ['lisa', 'cindy', 'grandma']
    roleSpecialUsedThisChapter: false,
    activeReply: null,
    lastGameOutcome: null,
    lastRescueMessage: null,
    chapter6PhoneTriggered: false,
    scooterPlayedCount: 0,
    scooterBestScore: 0,
    history: [], // per-chapter records
    phoneLog: [], // LINE inbox history
  };
}

export function getRole(roleId) {
  return getLocalizedRole(roleId, getLang());
}

export function getCurrentChapter(state) {
  return getLocalizedChapterForRole(state.chapterIndex, state.roleId, getLang());
}

export function selectRole(state, roleId) {
  if (roleId === 'grandma' && !state.grandmaUnlocked) {
    return state;
  }
  const role = getRole(roleId);
  const firstCh = getLocalizedChapterForRole(0, role.id, getLang());
  return {
    ...state,
    phase: firstCh.cutscene ? 'cutscene' : 'scene',
    roleId: role.id,
    grandmaActive: role.id === 'grandma' ? true : state.grandmaActive,
    chapterIndex: 0,
    stats: { ...role.startingStats },
    wantedStars: role.id === 'grandma' ? 0 : 1,
    points: role.id === 'grandma' ? 1666 : 1000,
    perfPicks: 0,
    gamesScoredCount: 0,
    gamesCorrectCount: 0,
    askedTwins: [],
    roleSpecialUsedThisChapter: false,
    activeReply: null,
    lastGameOutcome: null,
    lastRescueMessage: null,
    history: [],
    phoneLog: [
      {
        from: firstCh.lineSender.name,
        role: firstCh.lineSender.role,
        badge: firstCh.lineSender.badge,
        time: firstCh.timeSlot,
        text: firstCh.lineMessage,
      },
    ],
  };
}

export function finishCutscene(state) {
  if (state.phase !== 'cutscene') return state;
  return { ...state, phase: 'scene' };
}

export function activateGrandmaCheat(state, triggerRescue = true) {
  const quips = getLocalizedGrandmaQuips(getLang());
  const idx = state.grandmaRescues % quips.rescueLines.length;
  const rescueText = quips.rescueLines[idx];
  const nextStats = {
    ...state.stats,
    stamina: triggerRescue ? 100 : state.stats.stamina,
    judgment: clampStat(state.stats.judgment + (state.cheatUsed ? 0 : 8)),
    brandTrust: clampStat(state.stats.brandTrust + (state.cheatUsed ? 0 : 8)),
  };
  return {
    ...state,
    grandmaUnlocked: true,
    grandmaActive: true,
    cheatUsed: true,
    grandmaRescues: state.grandmaRescues + (triggerRescue ? 1 : 0),
    wantedStars: triggerRescue ? 0 : state.wantedStars,
    stats: nextStats,
    lastRescueIndex: triggerRescue ? idx : null,
    lastRescueMessage: triggerRescue
      ? `${quips.rescueTitle} ${rescueText}`
      : t('engine.cheatUnlockOnly'),
    phoneLog: [
      ...state.phoneLog,
      {
        from: t('engine.grandmaName'),
        role: t('engine.grandmaRole'),
        badge: 'AMA666',
        time: getCurrentChapter(state).timeSlot,
        text: rescueText,
      },
    ],
  };
}

export function consultTwin(state, twinId) {
  if (!PEOPLE_MODEL_TWINS[twinId]) return state;
  const twins = getLocalizedTwins(getLang());
  const ch = getCurrentChapter(state);
  const already = state.askedTwins.includes(twinId);
  const askedTwins = already ? state.askedTwins : [...state.askedTwins, twinId];
  let replyText = '';
  let senderName = twins[twinId].name;
  let badge = 'MODEL';
  if (twinId === 'grandma') {
    replyText = ch.grandmaQuip;
    senderName = t('engine.grandmaName');
    badge = 'AMA';
  } else {
    replyText = ch.peopleModel?.[twinId] || '';
  }

  const nextLog = already
    ? state.phoneLog
    : [
        ...state.phoneLog,
        {
          from: senderName,
          role: twins[twinId].voice,
          badge,
          time: ch.timeSlot,
          text: replyText,
        },
      ];

  const bonusJudgment = !already && twinId !== 'grandma' ? 2 : 0;
  return {
    ...state,
    askedTwins,
    points: state.points + (already ? 0 : 250),
    stats: {
      ...state.stats,
      judgment: clampStat(state.stats.judgment + bonusJudgment),
    },
    phoneLog: nextLog,
  };
}

export function useRoleSpecial(state) {
  if (state.roleSpecialUsedThisChapter) return state;
  const role = getRole(state.roleId);
  const ch = getCurrentChapter(state);
  let nextStats = { ...state.stats };
  let nextWanted = state.wantedStars;
  let note = t('engine.specialNotes.' + role.id);
  if (!note || note === 'engine.specialNotes.' + role.id) {
    note = t('engine.specialFallback', role.specialName);
  }

  if (role.id === 'account') {
    nextWanted = Math.max(0, nextWanted - 1);
    nextStats.streetCred = clampStat(nextStats.streetCred + 5);
  } else if (role.id === 'planner') {
    nextStats.judgment = clampStat(nextStats.judgment + 6);
  } else if (role.id === 'creative') {
    nextStats.brandTrust = clampStat(nextStats.brandTrust + 7);
  } else if (role.id === 'media') {
    nextStats.realLift = clampStat(nextStats.realLift + 7);
  } else if (role.id === 'grandma') {
    nextStats.stamina = 100;
    nextWanted = 0;
  }

  const nextAsked = role.id === 'planner'
    ? Array.from(new Set([...state.askedTwins, 'lisa', 'cindy']))
    : state.askedTwins;

  return {
    ...state,
    roleSpecialUsedThisChapter: true,
    askedTwins: nextAsked,
    wantedStars: nextWanted,
    stats: nextStats,
    points: state.points + 350,
    phoneLog: [
      ...state.phoneLog,
      {
        from: role.name,
        role: role.specialName,
        badge: 'SKILL',
        time: ch.timeSlot,
        text: note,
      },
    ],
  };
}

export function chooseReply(state, replyIndex) {
  const ch = getCurrentChapter(state);
  const rep = ch.replies[replyIndex] || ch.replies[0];
  let wantedDelta = rep.wantedDelta || 0;
  let trustDelta = rep.brandTrustDelta || 0;

  if (state.roleId === 'account' && wantedDelta > 0) {
    wantedDelta = Math.ceil(wantedDelta / 2);
  }
  if (state.roleId === 'creative' && trustDelta < 0) {
    trustDelta = 0;
  }

  let nextWanted = clampStat(state.wantedStars + wantedDelta, 0, 5);
  let nextStats = {
    stamina: clampStat(state.stats.stamina + (rep.staminaDelta || 0)),
    streetCred: clampStat(state.stats.streetCred + (rep.streetCredDelta || 0)),
    realLift: clampStat(state.stats.realLift + (rep.realLiftDelta || 0)),
    brandTrust: clampStat(state.stats.brandTrust + trustDelta),
    judgment: clampStat(state.stats.judgment + (rep.judgmentDelta || 0)),
  };

  let rescues = state.grandmaRescues;
  let rescueIndex = null;
  let rescueMessage = null;
  let grandmaUnlocked = state.grandmaUnlocked;
  let phoneLog = [...state.phoneLog];

  // 彩蛋 ②：5 星爆肝 / 體力歸零時，觸發阿嬤大同電鍋救援！
  if (nextWanted >= 5 || nextStats.stamina <= 0) {
    const quips = getLocalizedGrandmaQuips(getLang());
    rescueIndex = rescues % quips.rescueLines.length;
    const rescueLine = quips.rescueLines[rescueIndex];
    rescues += 1;
    grandmaUnlocked = true;
    nextWanted = 0;
    nextStats.stamina = 100;
    nextStats.judgment = clampStat(nextStats.judgment + 6);
    rescueMessage = `${quips.rescueTitle} ${rescueLine}`;
    phoneLog.push({
      from: t('engine.grandmaEmergencyFrom'),
      role: t('engine.grandmaEmergencyRole'),
      badge: 'RESCUE',
      time: ch.timeSlot,
      text: rescueMessage,
    });
  }

  const tier = ch.id <= 3 ? 1 : ch.id <= 6 ? 2 : 3;
  const replyPoints = 1000 * tier;
  const nextPerf = Math.round((state.perfPicks + (rep.perf ?? 0)) * 10) / 10;

  if (ch.finale || !ch.game) {
    const record = {
      chapterId: ch.id,
      year: ch.year,
      timeSlot: ch.timeSlot,
      location: ch.location,
      title: ch.title,
      replyId: rep.id,
      replyText: rep.text,
      lean: rep.lean,
      correct: true,
      pointsEarned: replyPoints,
      submission: null,
    };
    return {
      ...state,
      phase: 'reveal',
      wantedStars: nextWanted,
      stats: nextStats,
      points: state.points + replyPoints,
      perfPicks: nextPerf,
      grandmaRescues: rescues,
      grandmaUnlocked,
      lastRescueIndex: rescueIndex,
      lastRescueMessage: rescueMessage,
      activeReply: rep,
      lastGameOutcome: {
        scored: false,
        correct: true,
        detail: rep.feedback,
        pointsEarned: replyPoints,
        submission: null,
      },
      history: [...state.history, record],
      phoneLog,
    };
  }

  return {
    ...state,
    phase: 'game',
    wantedStars: nextWanted,
    stats: nextStats,
    points: state.points + replyPoints,
    perfPicks: nextPerf,
    grandmaRescues: rescues,
    grandmaUnlocked,
    lastRescueIndex: rescueIndex,
    lastRescueMessage: rescueMessage,
    activeReply: rep,
    phoneLog,
  };
}

export function evaluateMiniGame(game, submission) {
  if (!game) return { scored: false, correct: true, detail: '', ratio: 1 };

  if (game.type === 'pick') {
    const picked = Number(submission);
    const correct = picked === game.answer;
    return { scored: Boolean(game.scored), correct, detail: game.reveal, ratio: correct ? 1 : 0 };
  }

  if (game.type === 'slider') {
    const val = Number(submission);
    const correct = Math.abs(val - game.answer) <= (game.tolerance || 0);
    return {
      scored: Boolean(game.scored),
      correct,
      detail: t('engine.evalSlider', val, game.unit || '', game.reveal),
      ratio: correct ? 1 : 0,
    };
  }

  if (game.type === 'swipe') {
    const choices = Array.isArray(submission) ? submission : [];
    if (!game.scored) {
      const targetSide = game.countSide || 'left';
      const count = choices.filter((c) => c === targetSide).length;
      const detail = (game.revealByCount || '').replace('{n}', String(count));
      return { scored: false, correct: true, detail, ratio: 1 };
    }
    const answers = game.answers || [];
    let hits = 0;
    for (let i = 0; i < answers.length; i += 1) {
      if (choices[i] === answers[i]) hits += 1;
    }
    const correct = hits >= Math.ceil(answers.length * 0.75);
    return {
      scored: true,
      correct,
      detail: t('engine.evalSwipe', hits, answers.length, game.reveal),
      ratio: answers.length ? hits / answers.length : 0,
    };
  }

  if (game.type === 'multi') {
    const selected = Array.isArray(submission) ? [...new Set(submission.map(Number))] : [];
    const answers = game.answers || [];
    const rightHits = selected.filter((idx) => answers.includes(idx)).length;
    const wrongHits = selected.filter((idx) => !answers.includes(idx)).length;
    const correct = rightHits === answers.length && wrongHits === 0;
    return {
      scored: Boolean(game.scored),
      correct,
      detail: t('engine.evalMulti', rightHits, answers.length, wrongHits, game.reveal),
      ratio: answers.length ? Math.max(0, rightHits / answers.length) : 0,
    };
  }

  if (game.type === 'stop') {
    const tick = submission === null || submission === undefined ? null : Number(submission);
    if (tick === null || Number.isNaN(tick) || tick > game.ticks) {
      const finalReport = game.report.start + game.ticks * game.report.perTick;
      const finalFresh = game.fresh.start + game.ticks * game.fresh.perTick;
      const msg = game.revealNever
        .replace('{report}', String(finalReport))
        .replace('{fresh}', String(finalFresh));
      return { scored: true, correct: false, detail: `${msg} ${game.reveal}`, ratio: 0 };
    }
    const repVal = game.report.start + tick * game.report.perTick;
    const freshVal = game.fresh.start + tick * game.fresh.perTick;
    const correct = tick <= game.goodUntilTick;
    const msg = game.revealStopped
      .replace('{report}', String(repVal))
      .replace('{fresh}', String(freshVal));
    return { scored: true, correct, detail: `${msg} ${game.reveal}`, ratio: correct ? 1 : 0 };
  }

  if (game.type === 'agent') {
    const picked = Number(submission);
    const same = picked === game.agentPick;
    return {
      scored: false,
      correct: true,
      detail: same ? game.revealSame : game.revealDiff,
      ratio: 1,
    };
  }

  return { scored: false, correct: true, detail: '', ratio: 1 };
}

export function submitMiniGame(state, submission) {
  const ch = getCurrentChapter(state);
  const outcome = evaluateMiniGame(ch.game, submission);
  const tier = ch.id <= 3 ? 1 : ch.id <= 6 ? 2 : 3;

  const baseParticipate = 1000 * tier;
  const correctBonus = outcome.scored
    ? Math.round((outcome.correct ? 2000 : 1200 * outcome.ratio) * tier)
    : 1000 * tier;
  const pointsEarned = baseParticipate + correctBonus;

  const nextStats = {
    ...state.stats,
    realLift: clampStat(state.stats.realLift + (outcome.correct ? 6 : 1)),
    judgment: clampStat(state.stats.judgment + (outcome.correct ? 6 : 2)),
  };

  let phoneLog = [...state.phoneLog];
  let chapter6PhoneTriggered = state.chapter6PhoneTriggered;
  if (ch.grandmaCallTrigger && ch.grandmaPhoneCall?.trigger) {
    chapter6PhoneTriggered = true;
    phoneLog.push({
      from: t('engine.grandmaCh6From'),
      role: t('engine.grandmaCh6Role'),
      badge: 'CH6 CALL',
      time: ch.timeSlot,
      text: ch.grandmaPhoneCall.text,
    });
  }

  const record = {
    chapterId: ch.id,
    year: ch.year,
    timeSlot: ch.timeSlot,
    location: ch.location,
    title: ch.title,
    replyId: state.activeReply ? state.activeReply.id : 0,
    replyText: state.activeReply ? state.activeReply.text : '',
    lean: state.activeReply ? state.activeReply.lean : 'judge',
    correct: outcome.correct,
    pointsEarned,
    submission,
  };

  return {
    ...state,
    phase: 'reveal',
    stats: nextStats,
    points: state.points + pointsEarned,
    gamesScoredCount: state.gamesScoredCount + (outcome.scored ? 1 : 0),
    gamesCorrectCount: state.gamesCorrectCount + (outcome.scored && outcome.correct ? 1 : 0),
    lastGameOutcome: { ...outcome, pointsEarned, submission },
    chapter6PhoneTriggered,
    history: [...state.history, record],
    phoneLog,
  };
}

export function completeScooterRun(state, result) {
  const score = Number(result?.score || 0);
  const judgmentBonus = Number(result?.judgmentBonus || 4);
  const trustBonus = Number(result?.trustBonus || 4);
  return {
    ...state,
    scooterPlayedCount: state.scooterPlayedCount + 1,
    scooterBestScore: Math.max(state.scooterBestScore, score),
    points: state.points + Math.round(score * 2),
    wantedStars: Math.max(0, state.wantedStars - 1),
    stats: {
      ...state.stats,
      stamina: clampStat(state.stats.stamina + 12),
      brandTrust: clampStat(state.stats.brandTrust + trustBonus),
      judgment: clampStat(state.stats.judgment + judgmentBonus),
    },
    phoneLog: [
      ...state.phoneLog,
      {
        from: t('engine.grandmaScooterFrom'),
        role: t('engine.grandmaScooterRole'),
        badge: 'MINIGAME',
        time: getCurrentChapter(state).timeSlot,
        text: t('engine.scooterLog', score, judgmentBonus, trustBonus),
      },
    ],
  };
}

export function advanceChapter(state) {
  const nextIndex = state.chapterIndex + 1;
  if (nextIndex >= CHAPTERS.length) {
    return { ...state, phase: 'review' };
  }
  const nextCh = getLocalizedChapterForRole(nextIndex, state.roleId, getLang());
  return {
    ...state,
    phase: nextCh.cutscene ? 'cutscene' : 'scene',
    chapterIndex: nextIndex,
    askedTwins: [],
    roleSpecialUsedThisChapter: false,
    activeReply: null,
    lastGameOutcome: null,
    lastRescueIndex: null,
    lastRescueMessage: null,
    phoneLog: [
      ...state.phoneLog,
      {
        from: nextCh.lineSender.name,
        role: nextCh.lineSender.role,
        badge: nextCh.lineSender.badge,
        time: nextCh.timeSlot,
        text: nextCh.lineMessage,
      },
    ],
  };
}

export function determinePersona(state) {
  const personas = getLocalizedPersonas(getLang());
  if (state.roleId === 'grandma' || state.cheatUsed) {
    return personas.find((p) => p.id === 'grandma') || personas[4];
  }
  const score = state.gamesCorrectCount;
  const perf = state.perfPicks;
  if (score >= 5 && perf >= 3 && perf <= 7) {
    return personas.find((p) => p.id === 'judge') || personas[0];
  }
  if (perf >= 7) {
    return personas.find((p) => p.id === 'hunter') || personas[1];
  }
  if (perf <= 3) {
    return personas.find((p) => p.id === 'believer') || personas[2];
  }
  return personas.find((p) => p.id === 'balance') || personas[3];
}
