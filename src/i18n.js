import { ROLES, PEOPLE_MODEL_TWINS, GRANDMA_QUIPS, GTA6_TAIWAN_ANALYSIS, CHAPTERS, PERSONAS, SCOOTER_CONFIG } from './story-data.js';
import { ROLE_ROUTE_META, ROLE_ITINERARIES, ROLE_CHAPTER_VARIANTS } from './role-stories.js';
import { UI_STRINGS } from './locales/ui-strings.js';
import { STORY_EN } from './locales/story-en.js';
import { ROLES_EN_1 } from './locales/roles-en-1.js';
import { ROLES_EN_2 } from './locales/roles-en-2.js';
import { STORY_JA } from './locales/story-ja.js';
import { ROLES_JA_1 } from './locales/roles-ja-1.js';
import { ROLES_JA_2 } from './locales/roles-ja-2.js';
import { getRoleChapterStory, getRoleEpilogueData } from './locales/role-chapters/index.js';

export const SUPPORTED_LANGS = ['zh', 'en', 'ja'];
export const LANG_STORAGE_KEY = 'gta_dentsu_lang_v1';

const STORY_PACKS = { en: STORY_EN, ja: STORY_JA };
const ROLE_PACKS = {
  en: {
    routeMeta: ROLES_EN_1.routeMeta,
    itineraries: ROLES_EN_1.itineraries,
    variants: { ...ROLES_EN_1.variants, ...ROLES_EN_2.variants }
  },
  ja: {
    routeMeta: ROLES_JA_1.routeMeta,
    itineraries: ROLES_JA_1.itineraries,
    variants: { ...ROLES_JA_1.variants, ...ROLES_JA_2.variants }
  }
};

let activeLang = 'zh';
const langListeners = new Set();

export function normalizeLang(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (s === 'en' || s.startsWith('en-')) return 'en';
  if (s === 'ja' || s === 'jp' || s.startsWith('ja-')) return 'ja';
  return 'zh';
}

export function getLang() {
  return activeLang;
}

export function getUiStrings(lang = activeLang) {
  const norm = normalizeLang(lang);
  return UI_STRINGS[norm] || UI_STRINGS.zh;
}

export function onLangChange(listener) {
  if (typeof listener !== 'function') return () => {};
  langListeners.add(listener);
  return () => langListeners.delete(listener);
}

export function detectInitialLang() {
  if (typeof window === 'undefined') return 'zh';
  try {
    const params = new URLSearchParams(window.location.search || '');
    const qp = params.get('lang');
    if (qp) return normalizeLang(qp);
  } catch {}
  try {
    const saved = window.localStorage?.getItem(LANG_STORAGE_KEY);
    if (saved) return normalizeLang(saved);
  } catch {}
  return 'zh';
}

export function syncDocumentLangMeta(lang = activeLang, standalone = false) {
  if (typeof document === 'undefined') return;
  const pack = getUiStrings(lang);
  if (document.documentElement) {
    document.documentElement.lang = pack.htmlLang || 'zh-Hant';
  }
  const hasModuleTag = typeof document.querySelector === 'function' && Boolean(document.querySelector('script[type="module"]'));
  const isStandalone = standalone || !hasModuleTag;
  document.title = isStandalone ? (pack.docTitleStandalone || pack.docTitle) : pack.docTitle;
}

export function setLang(nextLang, { persist = true } = {}) {
  const norm = normalizeLang(nextLang);
  activeLang = norm;
  if (persist && typeof window !== 'undefined') {
    try {
      window.localStorage?.setItem(LANG_STORAGE_KEY, norm);
    } catch {}
  }
  syncDocumentLangMeta(norm);
  langListeners.forEach((fn) => {
    try {
      fn(norm);
    } catch {}
  });
  return norm;
}

export function initLang() {
  return setLang(detectInitialLang(), { persist: false });
}

function getNestedValue(obj, path) {
  const parts = String(path || '').split('.');
  let cur = obj;
  for (let i = 0; i < parts.length; i += 1) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[parts[i]];
  }
  return cur;
}

export function t(path, ...args) {
  const pack = getUiStrings(activeLang);
  let val = getNestedValue(pack, path);
  if (val === undefined && activeLang !== 'zh') {
    val = getNestedValue(UI_STRINGS.zh, path);
  }
  if (typeof val === 'function') return val(...args);
  return val !== undefined ? val : path;
}

function mergeLocalizedGame(baseGame, locGame) {
  if (!baseGame) return null;
  if (!locGame) return baseGame;
  const out = { ...baseGame };
  const textKeys = ['prompt', 'unit', 'left', 'right', 'reveal', 'revealByCount', 'revealStopped', 'revealNever', 'revealSame', 'revealDiff'];
  textKeys.forEach((k) => {
    if (locGame[k] !== undefined) out[k] = locGame[k];
  });
  if (Array.isArray(locGame.cards)) {
    out.cards = locGame.cards;
  }
  if (Array.isArray(locGame.options) && Array.isArray(baseGame.options)) {
    out.options = baseGame.options.map((opt, idx) => {
      const locOpt = locGame.options[idx];
      if (!locOpt) return opt;
      return {
        ...opt,
        title: locOpt.title !== undefined ? locOpt.title : opt.title,
        lines: Array.isArray(locOpt.lines) ? locOpt.lines : opt.lines
      };
    });
  }
  if (locGame.report && baseGame.report) {
    out.report = { ...baseGame.report, ...locGame.report };
  }
  if (locGame.fresh && baseGame.fresh) {
    out.fresh = { ...baseGame.fresh, ...locGame.fresh };
  }
  return out;
}

function mergeReplies(baseReplies = [], locReplies = []) {
  return baseReplies.map((r, idx) => {
    const lr = locReplies.find((x) => x.id === r.id) || locReplies[idx];
    if (!lr) return r;
    return {
      ...r,
      text: lr.text !== undefined ? lr.text : r.text,
      feedback: lr.feedback !== undefined ? lr.feedback : r.feedback
    };
  });
}

export function getCutsceneUrl(basePath, lang = activeLang) {
  if (!basePath) return null;
  const norm = normalizeLang(lang);
  if (norm === 'zh') return basePath;
  const clean = String(basePath);
  const idx = clean.lastIndexOf('/');
  if (idx < 0) return clean;
  const file = clean.slice(idx + 1);
  return `./public/video/${norm}/${file}`;
}

export function getAudioPath(relPath, lang = activeLang) {
  const norm = normalizeLang(lang);
  const clean = String(relPath || '').replace(/^\.?\/?public\/audio\//, '');
  return norm === 'zh' ? `./public/audio/${clean}` : `./public/audio/${norm}/${clean}`;
}

export function getLocalizedRoles(lang = activeLang) {
  const norm = normalizeLang(lang);
  const pack = STORY_PACKS[norm];
  if (!pack) return ROLES;
  return ROLES.map((role, idx) => {
    const lr = pack.roles.find((r) => r.id === role.id) || pack.roles[idx];
    return lr ? { ...role, ...lr } : role;
  });
}

export function getLocalizedRole(roleId, lang = activeLang) {
  const roles = getLocalizedRoles(lang);
  return roles.find((r) => r.id === roleId) || roles[1];
}

export function getLocalizedTwins(lang = activeLang) {
  const norm = normalizeLang(lang);
  const pack = STORY_PACKS[norm];
  if (!pack?.peopleModelTwins) return PEOPLE_MODEL_TWINS;
  return {
    lisa: { ...PEOPLE_MODEL_TWINS.lisa, ...pack.peopleModelTwins.lisa },
    cindy: { ...PEOPLE_MODEL_TWINS.cindy, ...pack.peopleModelTwins.cindy },
    grandma: { ...PEOPLE_MODEL_TWINS.grandma, ...pack.peopleModelTwins.grandma }
  };
}

export function getLocalizedGrandmaQuips(lang = activeLang) {
  const norm = normalizeLang(lang);
  const pack = STORY_PACKS[norm];
  if (!pack?.grandmaQuips) return GRANDMA_QUIPS;
  return {
    ...GRANDMA_QUIPS,
    ...pack.grandmaQuips,
    cheatCode: GRANDMA_QUIPS.cheatCode
  };
}

export function getLocalizedGta6Analysis(lang = activeLang) {
  const norm = normalizeLang(lang);
  const pack = STORY_PACKS[norm];
  if (!pack?.gta6Analysis) return GTA6_TAIWAN_ANALYSIS;
  return { ...GTA6_TAIWAN_ANALYSIS, ...pack.gta6Analysis };
}

export function getLocalizedPersonas(lang = activeLang) {
  const norm = normalizeLang(lang);
  const pack = STORY_PACKS[norm];
  if (!pack?.personas) return PERSONAS;
  return PERSONAS.map((p, idx) => {
    const lp = pack.personas.find((x) => x.id === p.id) || pack.personas[idx];
    return lp ? { ...p, ...lp } : p;
  });
}

export function getLocalizedScooterConfig(lang = activeLang) {
  const norm = normalizeLang(lang);
  const pack = STORY_PACKS[norm];
  const loc = pack?.scooterConfig;
  if (!loc) return SCOOTER_CONFIG;
  return {
    ...SCOOTER_CONFIG,
    title: loc.title || SCOOTER_CONFIG.title,
    subtitle: loc.subtitle || SCOOTER_CONFIG.subtitle,
    goodItems: SCOOTER_CONFIG.goodItems.map((it, i) => {
      const li = loc.goodItems?.find((x) => x.id === it.id) || loc.goodItems?.[i];
      return li ? { ...it, label: li.label, quip: li.quip } : it;
    }),
    badItems: SCOOTER_CONFIG.badItems.map((it, i) => {
      const li = loc.badItems?.find((x) => x.id === it.id) || loc.badItems?.[i];
      return li ? { ...it, label: li.label, quip: li.quip } : it;
    }),
    quips: loc.quips ? { ...SCOOTER_CONFIG.quips, ...loc.quips } : SCOOTER_CONFIG.quips,
    canvas: loc.canvas || null
  };
}

export function getLocalizedRouteMeta(lang = activeLang) {
  const norm = normalizeLang(lang);
  const rPack = ROLE_PACKS[norm];
  if (!rPack?.routeMeta) return ROLE_ROUTE_META;
  const out = {};
  Object.keys(ROLE_ROUTE_META).forEach((k) => {
    out[k] = rPack.routeMeta[k] ? { ...ROLE_ROUTE_META[k], ...rPack.routeMeta[k] } : ROLE_ROUTE_META[k];
  });
  return out;
}

export function getFsdLines(lang = activeLang) {
  const norm = normalizeLang(lang);
  const pack = STORY_PACKS[norm];
  return pack?.fsdLines || {
    on: 'Tesla FSD 已接管，前方機車十八公尺，車距鎖定，沿松仁路前進。',
    off: '已切換回手動駕駛。'
  };
}

export function getLocalizedRoleEpilogue(roleId = 'planner', lang = activeLang) {
  const norm = normalizeLang(lang);
  return getRoleEpilogueData(roleId, norm) || getRoleEpilogueData('planner', norm);
}

export function getCutsceneGrandmaLine(lang = activeLang) {
  const norm = normalizeLang(lang);
  const pack = STORY_PACKS[norm];
  return pack?.cutsceneGrandmaLine || '你們先不要亂砍預算，阿嬤帶大同電鍋趕過去了！';
}

export function getLocalizedChapterForRole(chapterIndex, roleId = 'planner', lang = activeLang) {
  const norm = normalizeLang(lang);
  const base = CHAPTERS[chapterIndex] || CHAPTERS[0];
  const baseVariant = ROLE_CHAPTER_VARIANTS[roleId]?.[base.id] || null;
  const baseItin = ROLE_ITINERARIES[roleId]?.[base.id] || null;

  const sPack = STORY_PACKS[norm];
  const rPack = ROLE_PACKS[norm];
  const locBase = sPack?.chapters?.find((c) => c.id === base.id) || sPack?.chapters?.[chapterIndex] || null;
  const locVar = rPack?.variants?.[roleId]?.[base.id] || null;
  const locItin = rPack?.itineraries?.[roleId]?.[base.id] || null;

  // Build base localized chapter first
  let ch = { ...base };
  if (locBase) {
    ch = {
      ...ch,
      timeSlot: locBase.timeSlot || ch.timeSlot,
      location: locBase.location || ch.location,
      book: locBase.book || ch.book,
      title: locBase.title || ch.title,
      gta6Analysis: locBase.gta6Analysis ? { ...ch.gta6Analysis, ...locBase.gta6Analysis } : ch.gta6Analysis,
      sceneDesc: locBase.sceneDesc || ch.sceneDesc,
      lineSender: locBase.lineSender ? { ...ch.lineSender, ...locBase.lineSender } : ch.lineSender,
      lineMessage: locBase.lineMessage || ch.lineMessage,
      roleClues: locBase.roleClues ? { ...ch.roleClues, ...locBase.roleClues } : ch.roleClues,
      peopleModel: locBase.peopleModel ? { ...ch.peopleModel, ...locBase.peopleModel } : ch.peopleModel,
      grandmaQuip: locBase.grandmaQuip || ch.grandmaQuip,
      grandmaPhoneCall: locBase.grandmaPhoneCall ? { ...ch.grandmaPhoneCall, ...locBase.grandmaPhoneCall } : ch.grandmaPhoneCall,
      replies: mergeReplies(ch.replies, locBase.replies),
      game: mergeLocalizedGame(ch.game, locBase.game),
      takeaway: locBase.takeaway || ch.takeaway,
      source: locBase.source || ch.source,
      googleMap: {
        ...ch.googleMap,
        roadSign: locBase.roadSign || ch.googleMap?.roadSign
      }
    };
  } else {
    ch.googleMap = { ...ch.googleMap };
  }

  const baseLineSender = ch.lineSender;
  const baseLineMessage = ch.lineMessage;

  // Layer role-specific itinerary
  if (baseItin) {
    const mergedItin = locItin ? { ...baseItin, ...locItin } : baseItin;
    ch.timeSlot = mergedItin.timeSlot || ch.timeSlot;
    ch.location = mergedItin.location || ch.location;
    ch.title = mergedItin.title || ch.title;
    ch.sceneImage = baseItin.sceneImage || ch.sceneImage;
    ch.mapPos = Array.isArray(baseItin.mapPos) ? baseItin.mapPos : ch.mapPos;
    ch.googleMap = {
      ...ch.googleMap,
      roadSign: mergedItin.roadSign || ch.googleMap.roadSign
    };
  }

  // Layer role-specific scenario, replies & mini-game
  if (baseVariant) {
    ch.sceneDesc = locVar?.sceneDesc || baseVariant.sceneDesc || ch.sceneDesc;
    if (baseVariant.lineSender || locVar?.lineSender) {
      ch.lineSender = { ...(baseVariant.lineSender || ch.lineSender), ...(locVar?.lineSender || {}) };
    }
    if (baseVariant.lineMessage || locVar?.lineMessage) {
      ch.lineMessage = locVar?.lineMessage || baseVariant.lineMessage;
    }
    if (Array.isArray(baseVariant.replies)) {
      ch.replies = mergeReplies(baseVariant.replies, locVar?.replies || []);
    }
    if (Object.prototype.hasOwnProperty.call(baseVariant, 'game')) {
      ch.game = baseVariant.game === null
        ? null
        : mergeLocalizedGame(baseVariant.game, locVar?.game);
    }
  }

  // Resolve localized role-exclusive story overlay across zh, en & ja
  const roleStory = getRoleChapterStory(roleId, base.id, norm);
  if (roleStory) {
    ch.sceneDesc = roleStory.sceneDesc || ch.sceneDesc;
    if (roleStory.roleClue) {
      ch.roleClues = { ...ch.roleClues, [roleId]: roleStory.roleClue };
    }
    if (roleStory.peopleModel) {
      ch.peopleModel = { ...ch.peopleModel, ...roleStory.peopleModel };
    }
    if (roleStory.takeaway) {
      ch.takeaway = roleStory.takeaway;
    }
    if (roleStory.gta6Analysis) {
      ch.gta6Analysis = { ...ch.gta6Analysis, ...roleStory.gta6Analysis };
    }
  }
  ch.epilogue = getLocalizedRoleEpilogue(roleId, norm);

  // Resolve localized cutscene URL & canonical clip IDs for TTS audio playback
  const routeMeta = getLocalizedRouteMeta(norm)[roleId] || null;
  const isVariantLine = Boolean(baseVariant?.lineMessage) && roleId !== 'planner';
  ch.cutscene = getCutsceneUrl(base.cutscene, norm);
  ch.cutsceneBase = base.cutscene;
  ch.baseLineSender = baseLineSender;
  ch.baseLineMessage = baseLineMessage;
  ch.roadSign = ch.googleMap.roadSign;
  ch.roleRoute = routeMeta;
  ch.routeMeta = routeMeta;
  ch.roleClue = ch.roleClues?.[roleId] || ch.roleClues?.planner || '';
  ch.voiceClips = {
    line: isVariantLine ? `voice:role_${roleId}_ch${base.id}_line` : `voice:ch${base.id}_line`,
    lisa: `voice:ch${base.id}_lisa`,
    cindy: `voice:ch${base.id}_cindy`,
    takeaway: `voice:ch${base.id}_takeaway`,
    grandmaQuip: `grandma:ch${base.id}_quip`,
    grandmaCall: `grandma:ch${base.id}_call`,
    grandmaClue: `grandma:ch${base.id}_clue`,
    fsdOn: 'voice:fsd_on',
    fsdOff: 'voice:fsd_off'
  };
  return ch;
}
