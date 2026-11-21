import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CHAPTERS, ROLES, PEOPLE_MODEL_TWINS, GRANDMA_QUIPS, SCOOTER_CONFIG } from '../src/story-data.js';
import { ROLE_CHAPTER_VARIANTS } from '../src/role-stories.js';
import { soundFX, normalizeGrandmaVoiceKey, BGM_MIX_LEVELS, BGM_FILTER_HZ } from '../src/audio-fx.js';
import {
  setLang,
  getLocalizedRoles,
  getLocalizedPersonas,
  getLocalizedChapterForRole,
  getLocalizedRouteMeta,
  getUiStrings,
} from '../src/i18n.js';
import {
  createInitialState,
  ROLE_ROUTE_META,
  getChapterForRole,
  selectRole,
  activateGrandmaCheat,
  consultTwin,
  useRoleSpecial,
  chooseReply,
  submitMiniGame,
  completeScooterRun,
  advanceChapter,
  determinePersona,
} from '../src/game-engine.js';

test('Story data covers 9 books across 10 agency workday time slots and 4+1 roles', () => {
  assert.equal(CHAPTERS.length, 10);
  assert.equal(ROLES.length, 5);
  assert.equal(ROLES.some((r) => r.id === 'grandma' && r.unlockCheat === 'AMA666'), true);
  assert.ok(PEOPLE_MODEL_TWINS.lisa && PEOPLE_MODEL_TWINS.cindy);
  assert.equal(GRANDMA_QUIPS.cheatCode, 'AMA666');
  assert.ok(SCOOTER_CONFIG.goodItems.length >= 4);
  assert.ok(SCOOTER_CONFIG.badItems.length >= 4);
  for (const ch of CHAPTERS) {
    assert.ok(ch.timeSlot && ch.location && ch.grandmaQuip && ch.takeaway && ch.source);
    assert.equal(ch.replies.length, 4);
    assert.ok(ch.roleClues.account && ch.roleClues.planner && ch.roleClues.creative && ch.roleClues.media && ch.roleClues.grandma);
  }
});

test('Grandma Mod 1: AMA666 unlocks Grandma Master role and rescues Wanted stars', () => {
  let state = createInitialState();
  assert.equal(selectRole(state, 'grandma').roleId, 'planner'); // locked initially

  state = activateGrandmaCheat(state, true);
  assert.equal(state.grandmaUnlocked, true);
  assert.equal(state.cheatUsed, true);
  assert.equal(state.wantedStars, 0);

  const grandmaState = selectRole(state, 'grandma');
  assert.equal(grandmaState.roleId, 'grandma');
  assert.equal(grandmaState.stats.stamina, 100);
});

test('Grandma Mod 2: 5-star Wanted triggers Tatung Rice Cooker rescue and Chapter 6 triggers phone call', () => {
  let state = selectRole(createInitialState(), 'media');
  state = { ...state, wantedStars: 4, stats: { ...state.stats, stamina: 45 } };
  // Reply index 3 in Ch1 has wantedDelta +2 -> hits 5 -> Grandma rescue clears to 0 and stamina 100!
  state = chooseReply(state, 3);
  assert.equal(state.wantedStars, 0);
  assert.equal(state.stats.stamina, 100);
  assert.equal(state.grandmaRescues, 1);
  assert.ok(state.lastRescueMessage.includes('阿嬤'));

  // Jump to Chapter 6 (index 5) and complete swipe game -> triggers Ch6 grandma phone call
  let ch6 = selectRole(createInitialState(), 'creative');
  ch6 = { ...ch6, chapterIndex: 5, phase: 'scene' };
  ch6 = chooseReply(ch6, 2);
  ch6 = submitMiniGame(ch6, ['right', 'right', 'right', 'right']);
  assert.equal(ch6.chapter6PhoneTriggered, true);
  assert.equal(ch6.lastGameOutcome.correct, true);
});

test('Grandma Mod 3: Scooter Rush completion boosts Trust, Judgment, and reduces Wanted stars', () => {
  let state = selectRole(createInitialState(), 'account');
  state = { ...state, wantedStars: 3 };
  state = completeScooterRun(state, { score: 900, judgmentBonus: 8, trustBonus: 6 });
  assert.equal(state.scooterPlayedCount, 1);
  assert.equal(state.scooterBestScore, 900);
  assert.equal(state.wantedStars, 2);
  assert.equal(state.stats.judgment, 73);
});

test('Full 10-chapter playthrough across all 6 mini-game types reaches career review', () => {
  let state = selectRole(createInitialState(), 'planner');
  state = consultTwin(state, 'lisa');
  state = useRoleSpecial(state);
  assert.equal(state.askedTwins.includes('cindy'), true);

  const submissions = [
    1,                                    // Ch1 pick -> B
    5,                                    // Ch2 slider -> 5 years
    65,                                   // Ch3 slider -> 65%
    ['left', 'left', 'left', 'right'],    // Ch4 swipe unscored
    80,                                   // Ch5 slider -> 80 within tolerance 10 of 81
    ['right', 'right', 'right', 'right'], // Ch6 swipe all AI
    [0, 1, 2],                            // Ch7 multi RMN
    3,                                    // Ch8 stop <= 4
    0,                                    // Ch9 agent
  ];

  for (let i = 0; i < 10; i += 1) {
    if (state.phase === 'cutscene') state = { ...state, phase: 'scene' };
    state = chooseReply(state, 2); // judge reply
    if (i < 9) {
      assert.equal(state.phase, 'game');
      state = submitMiniGame(state, submissions[i]);
    }
    assert.equal(state.phase, 'reveal');
    state = advanceChapter(state);
  }

  assert.equal(state.phase, 'review');
  assert.equal(state.history.length, 10);
  const persona = determinePersona(state);
  assert.equal(persona.id, 'judge');
});

test('Google Gemini TTS 台灣阿嬤 voice clips map and exist for all 36 Grandma lines', () => {
  const grandmaRole = ROLES.find((r) => r.id === 'grandma');
  assert.ok(grandmaRole?.quote);

  const lines = [
    grandmaRole.quote,
    ...GRANDMA_QUIPS.rescueLines,
    ...CHAPTERS.map((ch) => ch.grandmaQuip),
    ...CHAPTERS.map((ch) => ch.grandmaPhoneCall.text),
    ...CHAPTERS.map((ch) => ch.roleClues.grandma),
  ];
  assert.equal(lines.length, 36);

  const resolvedSet = new Set();
  for (const line of lines) {
    const clip = soundFX.resolveGrandmaClip(line);
    assert.ok(clip, `Missing Google Gemini TTS clip mapping for: ${line}`);
    resolvedSet.add(clip);
    const absPath = path.join(process.cwd(), clip.replace(/^\.\//, ''));
    assert.ok(fs.existsSync(absPath), `Missing MP3 file: ${absPath}`);
    assert.ok(fs.statSync(absPath).size > 2048, `Truncated MP3 file: ${absPath}`);
  }
  assert.equal(resolvedSet.size, 36);

  // Also verify stripping "阿嬤說：" produces identical resolution
  const ch1Stripped = CHAPTERS[0].grandmaQuip.replace(/^阿嬤說[:：]?/, '');
  assert.equal(
    normalizeGrandmaVoiceKey(CHAPTERS[0].grandmaQuip),
    normalizeGrandmaVoiceKey(ch1Stripped)
  );
  assert.equal(
    soundFX.resolveGrandmaClip(`👵 ${CHAPTERS[0].grandmaQuip}`),
    soundFX.resolveGrandmaClip(ch1Stripped)
  );
});

test('Voice mix foregrounds dialogue over BGM and covers 82 character Google Gemini TTS clips + 3 audio MP4 cutscenes', () => {
  assert.ok(BGM_MIX_LEVELS.cutscene > 0 && BGM_MIX_LEVELS.cutscene < BGM_MIX_LEVELS.speaking);
  assert.ok(BGM_MIX_LEVELS.speaking < BGM_MIX_LEVELS.normal);
  assert.ok(BGM_MIX_LEVELS.speaking / BGM_MIX_LEVELS.normal <= 0.2, 'Voice ducking must keep BGM <= 20% of normal gain');
  assert.ok(BGM_FILTER_HZ.cutscene > 0 && BGM_FILTER_HZ.cutscene < BGM_FILTER_HZ.speaking);
  assert.ok(BGM_FILTER_HZ.speaking < BGM_FILTER_HZ.normal);

  const voiceSpecs = [
    ...CHAPTERS.map((ch) => ['boss', ch.lineMessage]),
    ...CHAPTERS.map((ch) => ['lisa', ch.peopleModel.lisa]),
    ...CHAPTERS.map((ch) => ['cindy', ch.peopleModel.cindy]),
    ...CHAPTERS.map((ch) => ['narrator', ch.takeaway]),
    ['fsd', 'Tesla FSD 已接管，前方機車十八公尺，車距鎖定，沿松仁路前進。'],
    ['fsd', '已切換回手動駕駛。'],
    ...['account', 'creative', 'media', 'grandma'].flatMap((roleId) =>
      Object.values(ROLE_CHAPTER_VARIANTS[roleId]).map((variant) => ['boss', variant.lineMessage])
    ),
  ];
  assert.equal(voiceSpecs.length, 82);

  const uniqueClips = new Set();
  for (const [roleKey, line] of voiceSpecs) {
    const clip = soundFX.resolveVoiceClip(line, roleKey);
    assert.ok(clip, `Missing Google Gemini TTS character clip for (${roleKey}): ${line}`);
    uniqueClips.add(clip);
    const absPath = path.join(process.cwd(), clip.replace(/^\.\//, ''));
    assert.ok(fs.existsSync(absPath), `Missing character MP3: ${absPath}`);
    assert.ok(fs.statSync(absPath).size > 2048, `Truncated character MP3: ${absPath}`);
  }
  assert.equal(uniqueClips.size, 82);

  for (const vid of ['intro-taipei.mp4', 'boardroom-push.mp4', 'grandma-rescue.mp4']) {
    const absVid = path.join(process.cwd(), 'public/video', vid);
    const buf = fs.readFileSync(absVid);
    assert.ok(buf.includes('soun') && buf.includes('mp4a'), `Cutscene missing embedded AAC audio track: ${vid}`);
  }
});

test('All 5 roles have distinct itineraries, storylines, LINE dilemmas, replies, mini-games across 10 chapters, and full playthroughs', () => {
  const roleIds = ROLES.map((r) => r.id);
  assert.equal(roleIds.length, 5);

  for (const rid of roleIds) {
    assert.ok(ROLE_ROUTE_META[rid]?.routeItinerary, `Missing routeItinerary for ${rid}`);
  }

  for (let i = 0; i < CHAPTERS.length; i += 1) {
    const timeSlots = new Set();
    const locations = new Set();
    const titles = new Set();
    const roadSigns = new Set();
    const scenes = new Set();
    const messages = new Set();
    const prompts = new Set();
    for (const rid of roleIds) {
      const ch = getChapterForRole(i, rid);
      assert.equal(ch.replies.length, 4, `${rid} Ch${i + 1} must have 4 replies`);
      assert.ok(ROLE_ROUTE_META[rid], `Missing ROLE_ROUTE_META for ${rid}`);
      assert.ok(Array.isArray(ch.mapPos) && ch.mapPos.length === 2, `${rid} Ch${i + 1} missing mapPos [x, y]`);
      timeSlots.add(ch.timeSlot);
      locations.add(ch.location);
      titles.add(ch.title);
      roadSigns.add(ch.googleMap?.roadSign || '');
      scenes.add(ch.sceneDesc);
      messages.add(ch.lineMessage);
      if (i < 9) {
        assert.ok(ch.game?.prompt, `${rid} Ch${i + 1} missing game prompt`);
        prompts.add(ch.game.prompt);
      }
      if (i === 5) {
        assert.equal(ch.game.type, 'swipe');
        assert.equal(ch.game.cards.length, 4);
        assert.ok(ch.game.cards[3].includes(ch.grandmaPhoneCall.triggerCardText));
      }
    }
    assert.equal(timeSlots.size, 5, `Ch${i + 1} expected 5 unique timeSlot values`);
    assert.equal(locations.size, 5, `Ch${i + 1} expected 5 unique location values`);
    assert.equal(titles.size, 5, `Ch${i + 1} expected 5 unique title values`);
    assert.equal(roadSigns.size, 5, `Ch${i + 1} expected 5 unique roadSign values`);
    assert.equal(scenes.size, 5, `Ch${i + 1} expected 5 unique sceneDesc values`);
    assert.equal(messages.size, 5, `Ch${i + 1} expected 5 unique lineMessage values`);
    if (i < 9) {
      assert.equal(prompts.size, 5, `Ch${i + 1} expected 5 unique game prompts`);
    }
  }

  // Verify unmapped lines never trigger fallback browser TTS murmuring
  assert.equal(soundFX.speak('尚未錄製音檔的角色對話測試絕不觸發背景女聲呢喃', 'boss', true), false);

  // Run full 10-chapter playthrough for every role
  for (const rid of roleIds) {
    let state = createInitialState();
    state = activateGrandmaCheat(state, false);
    state = selectRole(state, rid);
    assert.equal(state.roleId, rid);
    assert.ok(state.phoneLog[0].text.length > 0);

    for (let i = 0; i < 10; i += 1) {
      if (state.phase === 'cutscene') state = { ...state, phase: 'scene' };
      const ch = getChapterForRole(i, rid);
      assert.equal(state.phoneLog[state.phoneLog.length - 1].text, ch.lineMessage);
      state = chooseReply(state, 2);
      if (i < 9) {
        assert.equal(state.phase, 'game');
        const g = ch.game;
        let sub = 1;
        if (g.type === 'slider') sub = g.answer;
        else if (g.type === 'swipe') sub = g.answers || ['left', 'left', 'left', 'right'];
        else if (g.type === 'multi') sub = g.answers;
        else if (g.type === 'stop') sub = g.goodUntilTick - 1;
        else if (g.type === 'pick') sub = g.answer;
        else if (g.type === 'agent') sub = 0;
        state = submitMiniGame(state, sub);
      }
      assert.equal(state.phase, 'reveal');
      assert.equal(state.history[state.history.length - 1].timeSlot, ch.timeSlot);
      assert.equal(state.history[state.history.length - 1].location, ch.location);
      state = advanceChapter(state);
    }
    assert.equal(state.phase, 'review', `${rid} did not reach review`);
    assert.equal(state.history.length, 10);
    assert.ok(determinePersona(state).id);
  }
});

test('Trilingual parity (zh/en/ja), zero EN CJK leaks, zero forbidden words, and 10-chapter playthroughs in EN & JA', () => {
  const FORBIDDEN = ['陶豬', '逃豬', '松仁路 100 號', '视频', '软件', '信息', '优化', '项目', '营销', '网络', '内存', '默认', '界面', '联系', '账号'];
  const cjkRe = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
  try {
    for (const lang of ['zh', 'en', 'ja']) {
      setLang(lang);
      soundFX.setLang(lang);
      const roles = getLocalizedRoles(lang);
      const routeMeta = getLocalizedRouteMeta(lang);
      const personas = getLocalizedPersonas(lang);
      assert.equal(roles.length, 5);
      assert.equal(personas.length, 5);
      for (const r of roles) {
        assert.ok(routeMeta[r.id]?.routeName);
      }

      if (lang === 'en') {
        const uiEn = { ...getUiStrings('en'), langNames: null, langShort: null };
        assert.equal(cjkRe.test(JSON.stringify(uiEn)), false, 'Unexpected CJK characters in UI_STRINGS.en');
        assert.equal(cjkRe.test(JSON.stringify(roles)), false, 'Unexpected CJK characters in EN roles');
        assert.equal(cjkRe.test(JSON.stringify(personas)), false, 'Unexpected CJK characters in EN personas');
      }

      for (const r of roles) {
        for (let i = 0; i < CHAPTERS.length; i += 1) {
          const ch = getLocalizedChapterForRole(i, r.id, lang);
          assert.equal(ch.replies.length, 4);
          assert.ok(ch.voiceClips?.line && ch.voiceClips?.grandmaQuip);
          const chText = JSON.stringify({
            title: ch.title,
            sceneDesc: ch.sceneDesc,
            lineMessage: ch.lineMessage,
            replies: ch.replies,
            takeaway: ch.takeaway,
            grandmaQuip: ch.grandmaQuip,
          });
          for (const w of FORBIDDEN) {
            assert.equal(chText.includes(w), false, `${lang}/${r.id}/ch${i + 1} contains forbidden word "${w}"`);
          }
          if (lang === 'en') {
            assert.equal(cjkRe.test(chText), false, `EN ${r.id} ch${i + 1} leaked CJK text`);
          }
          if (i === 5) {
            assert.ok(ch.game.cards[3].includes(ch.grandmaPhoneCall.triggerCardText), `${lang}/${r.id} Ch6 card[3] missing triggerCardText`);
          }
        }
      }

      if (lang !== 'zh') {
        let state = activateGrandmaCheat(createInitialState(), false);
        state = selectRole(state, 'planner');
        const subs = [1, 5, 65, ['left', 'left', 'left', 'right'], 80, ['right', 'right', 'right', 'right'], [0, 1, 2], 3, 0];
        for (let i = 0; i < 10; i += 1) {
          if (state.phase === 'cutscene') state = { ...state, phase: 'scene' };
          state = chooseReply(state, 2);
          if (i < 9) state = submitMiniGame(state, subs[i]);
          state = advanceChapter(state);
        }
        assert.equal(state.phase, 'review');
        assert.equal(state.history.length, 10);
        assert.ok(determinePersona(state).id);
      }
    }
  } finally {
    setLang('zh');
    soundFX.setLang('zh');
  }
});

test('All 354 Google Gemini TTS MP3 clips (zh/en/ja x 118) and 9 AAC MP4 cutscenes exist on disk', () => {
  const grandmaFiles = [
    'quote.mp3',
    ...Array.from({ length: 5 }, (_, i) => `rescue_${i}.mp3`),
    ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_quip.mp3`),
    ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_call.mp3`),
    ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_clue.mp3`),
  ];
  const voiceFiles = [
    ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_line.mp3`),
    ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_lisa.mp3`),
    ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_cindy.mp3`),
    ...Array.from({ length: 10 }, (_, i) => `ch${i + 1}_takeaway.mp3`),
    'fsd_on.mp3',
    'fsd_off.mp3',
    ...['account', 'creative', 'media', 'grandma'].flatMap((roleId) =>
      Array.from({ length: 10 }, (_, i) => `role_${roleId}_ch${i + 1}_line.mp3`)
    ),
  ];

  for (const lang of ['zh', 'en', 'ja']) {
    const prefix = lang === 'zh' ? '' : `${lang}/`;
    soundFX.setLang(lang);
    const clipUrl = soundFX.resolveVoiceClip('x', 'boss', 'voice:ch1_line');
    assert.equal(clipUrl, `./public/audio/${prefix}voices/ch1_line.mp3`);

    for (const f of grandmaFiles) {
      const p = path.join(process.cwd(), 'public/audio', prefix, 'grandma', f);
      assert.ok(fs.existsSync(p), `Missing ${lang} grandma MP3: ${p}`);
      assert.ok(fs.statSync(p).size > 2048, `Truncated ${lang} grandma MP3: ${p}`);
    }
    for (const f of voiceFiles) {
      const p = path.join(process.cwd(), 'public/audio', prefix, 'voices', f);
      assert.ok(fs.existsSync(p), `Missing ${lang} voice MP3: ${p}`);
      assert.ok(fs.statSync(p).size > 2048, `Truncated ${lang} voice MP3: ${p}`);
    }
    for (const vid of ['intro-taipei.mp4', 'boardroom-push.mp4', 'grandma-rescue.mp4']) {
      const vp = path.join(process.cwd(), 'public/video', prefix, vid);
      assert.ok(fs.existsSync(vp), `Missing ${lang} video: ${vp}`);
      const buf = fs.readFileSync(vp);
      assert.ok(buf.includes('soun') && buf.includes('mp4a'), `Video missing AAC audio track: ${vp}`);
    }
  }
  soundFX.setLang('zh');
});

test('Launch kit sanitizes corrupt saves, tracks achievements & stat deltas, and builds clean share summaries', async () => {
  const { getLocalizedRole, t } = await import('../src/i18n.js');
  const {
    ACHIEVEMENT_IDS,
    createEmptyMeta,
    sanitizeLoadedState,
    computeStatDeltas,
    updateCareerMeta,
    buildShareSummaryText
  } = await import('../src/launch-kit.js');

  const recovered = sanitizeLoadedState(
    {
      phase: 'invalid_phase',
      roleId: 'grandma',
      grandmaUnlocked: false,
      chapterIndex: 99,
      wantedStars: 12,
      stats: { stamina: 999, streetCred: -20, realLift: 50, brandTrust: 50, judgment: 50 }
    },
    createInitialState,
    10
  );
  assert.equal(recovered.phase, 'title');
  assert.equal(recovered.roleId, 'planner');
  assert.equal(recovered.chapterIndex, 9);
  assert.equal(recovered.wantedStars, 5);
  assert.equal(recovered.stats.stamina, 100);
  assert.equal(recovered.stats.streetCred, 0);

  const s0 = selectRole(createInitialState(), 'planner');
  const s1 = chooseReply(s0, 2);
  const deltas = computeStatDeltas(s0, s1);
  assert.ok(deltas.some((d) => d.key === 'points' && d.delta === 1000));

  let meta = createEmptyMeta();
  const r1 = updateCareerMeta(
    meta,
    {
      roleId: 'planner',
      points: 35000,
      gamesScoredCount: 8,
      gamesCorrectCount: 7,
      grandmaUnlocked: true,
      grandmaRescues: 1,
      scooterBestScore: 1500,
      roleSpecialUsedThisChapter: true,
      askedTwins: ['lisa']
    },
    'judge',
    true
  );
  meta = r1.meta;
  assert.equal(r1.newlyUnlocked.includes('first_shift'), true);
  assert.equal(r1.newlyUnlocked.includes('sharp_judge'), true);
  assert.equal(r1.newlyUnlocked.includes('grandma_blessed'), true);
  assert.equal(r1.newlyUnlocked.includes('scooter_ace'), true);
  assert.equal(r1.newlyUnlocked.includes('mind_reader'), true);

  const r2 = updateCareerMeta(
    meta,
    { roleId: 'account', points: 28000, gamesScoredCount: 8, gamesCorrectCount: 4, askedTwins: [] },
    'balance',
    true
  );
  assert.equal(r2.meta.achievements.length, ACHIEVEMENT_IDS.length);
  assert.equal(r2.newlyUnlocked.includes('multi_role'), true);

  for (const lang of ['zh', 'en', 'ja']) {
    setLang(lang);
    const role = getLocalizedRole('planner', lang);
    const txt = buildShareSummaryText({
      role,
      persona: determinePersona({ roleId: 'planner', gamesCorrectCount: 7, perfPicks: 4 }),
      state: { points: 35000, gamesCorrectCount: 7, gamesScoredCount: 8 },
      meta: r2.meta,
      lang,
      tFn: t
    });
    assert.ok(txt.includes('mela0976.github.io/gta-dentsu-taiwan'));
    if (lang === 'en') {
      assert.equal(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(txt), false, `EN share leaked CJK: ${txt}`);
    }
  }
  setLang('zh');
});

test('Responsive & foldable layout engine classifies cover, phone, landscape, unfolded, dual-screen, short desktop, and ultrawide accurately', async () => {
  const { detectViewportLayout, applyViewportLayoutToRoot } = await import('../src/responsive-layout.js');

  const cover280 = detectViewportLayout({ width: 280, height: 653, coarsePointer: true });
  assert.equal(cover280.mode, 'compact');
  assert.equal(cover280.isUltraNarrow, true);
  assert.equal(cover280.useMobileTabs, true);
  assert.equal(cover280.useCompactHud, true);

  const flipCover320 = detectViewportLayout({ width: 320, height: 320, coarsePointer: true });
  assert.equal(flipCover320.mode, 'compact');
  assert.equal(flipCover320.isCoverSquare, true);
  assert.equal(flipCover320.isUltraNarrow, true);
  assert.equal(flipCover320.useMobileTabs, true);

  const fold6Outer = detectViewportLayout({ width: 344, height: 882, coarsePointer: true });
  assert.equal(fold6Outer.mode, 'compact');
  assert.equal(fold6Outer.isUltraNarrow, true);
  assert.equal(fold6Outer.useMobileTabs, true);

  const phone390 = detectViewportLayout({ width: 390, height: 844, coarsePointer: true });
  assert.equal(phone390.mode, 'compact');
  assert.equal(phone390.isUltraNarrow, false);
  assert.equal(phone390.useMobileTabs, true);

  const landscapeSe1 = detectViewportLayout({ width: 568, height: 320, coarsePointer: true });
  assert.equal(landscapeSe1.mode, 'compact-landscape');
  assert.equal(landscapeSe1.useMobileTabs, true);
  assert.equal(landscapeSe1.useCompactHud, true);

  const landscapePhone = detectViewportLayout({ width: 844, height: 390, coarsePointer: true });
  assert.equal(landscapePhone.mode, 'compact-landscape');
  assert.equal(landscapePhone.useMobileTabs, false);
  assert.equal(landscapePhone.useCompactHud, true);

  const fold5Inner = detectViewportLayout({ width: 690, height: 829, coarsePointer: true });
  assert.equal(fold5Inner.mode, 'medium');
  assert.equal(fold5Inner.useMobileTabs, false);
  assert.equal(fold5Inner.useCompactHud, false);

  const pixelFoldInner = detectViewportLayout({ width: 840, height: 840, coarsePointer: true });
  assert.equal(pixelFoldInner.mode, 'medium');

  const tablet768 = detectViewportLayout({ width: 768, height: 1024, coarsePointer: true });
  assert.equal(tablet768.mode, 'medium');
  assert.equal(tablet768.isDesktopLocked, false);

  const foldBook = detectViewportLayout({
    width: 1114,
    height: 720,
    segments: [
      { left: 0, top: 0, width: 540, height: 720 },
      { left: 574, top: 0, width: 540, height: 720 }
    ]
  });
  assert.equal(foldBook.mode, 'fold-book');
  assert.equal(foldBook.hinge.orientation, 'vertical');
  assert.equal(foldBook.hinge.gap, 34);
  assert.equal(foldBook.useMobileTabs, false);

  const foldFlexSeg = detectViewportLayout({
    width: 412,
    height: 915,
    segments: [
      { left: 0, top: 0, width: 412, height: 440 },
      { left: 0, top: 465, width: 412, height: 450 }
    ],
    posture: 'folded',
    coarsePointer: true
  });
  assert.equal(foldFlexSeg.mode, 'fold-flex');
  assert.equal(foldFlexSeg.hinge.orientation, 'horizontal');
  assert.equal(foldFlexSeg.hinge.gap, 25);
  assert.equal(foldFlexSeg.useCompactHud, true);
  assert.equal(foldFlexSeg.useMobileTabs, false);

  const foldFlexPosture = detectViewportLayout({ width: 412, height: 840, posture: 'folded', coarsePointer: true });
  assert.equal(foldFlexPosture.mode, 'compact');
  assert.equal(foldFlexPosture.hinge.orientation, 'none');
  assert.equal(foldFlexPosture.useMobileTabs, true);

  const shortDesktop = detectViewportLayout({ width: 1024, height: 540 });
  assert.equal(shortDesktop.mode, 'desktop');
  assert.equal(shortDesktop.isShortViewport, true);
  assert.equal(shortDesktop.isDesktopLocked, false);

  const stdDesktop = detectViewportLayout({ width: 1024, height: 720 });
  assert.equal(stdDesktop.mode, 'desktop');
  assert.equal(stdDesktop.isShortViewport, false);
  assert.equal(stdDesktop.isDesktopLocked, true);

  const ultrawide = detectViewportLayout({ width: 2560, height: 1080 });
  assert.equal(ultrawide.mode, 'wide');
  assert.equal(ultrawide.isDesktopLocked, true);

  // Verify applyViewportLayoutToRoot writes attributes & CSS fold variables cleanly
  const fakeAttrs = {};
  const fakeProps = {};
  const fakeDoc = {
    documentElement: {
      setAttribute: (k, v) => { fakeAttrs[k] = v; },
      style: {
        setProperty: (k, v) => { fakeProps[k] = v; },
        removeProperty: (k) => { delete fakeProps[k]; }
      }
    }
  };
  applyViewportLayoutToRoot(fakeDoc, foldBook);
  assert.equal(fakeAttrs['data-layout-mode'], 'fold-book');
  assert.equal(fakeAttrs['data-fold-hinge'], 'vertical');
  assert.equal(fakeProps['--fold-seg0-w'], '540px');
  assert.equal(fakeProps['--fold-seg1-w'], '540px');
  assert.equal(fakeProps['--fold-hinge-gap'], '34px');

  applyViewportLayoutToRoot(fakeDoc, stdDesktop);
  assert.equal(fakeAttrs['data-layout-mode'], 'desktop');
  assert.equal(fakeProps['--fold-seg0-w'], undefined);
  assert.equal(fakeProps['--fold-hinge-gap'], undefined);
});

test('Senior QA Suite: phase guards prevent double-submit exploits, deduplicate history, and sanitize corrupt reveal saves', async () => {
  const { sanitizeLoadedState } = await import('../src/launch-kit.js');

  let state = selectRole(createInitialState(), 'planner');
  if (state.phase === 'cutscene') state = { ...state, phase: 'scene' };

  // Calling submitMiniGame or advanceChapter in wrong phase must be a no-op
  assert.equal(submitMiniGame(state, 1), state);
  assert.equal(advanceChapter(state), state);

  // Double-submitting chooseReply in 'game' phase must not deduct stats or add points twice
  const afterReply = chooseReply(state, 2);
  assert.equal(afterReply.phase, 'game');
  assert.equal(chooseReply(afterReply, 3), afterReply);

  // Submitting mini-game transitions to 'reveal', and calling submitMiniGame again must be a no-op
  const afterGame = submitMiniGame(afterReply, 1);
  assert.equal(afterGame.phase, 'reveal');
  assert.equal(afterGame.history.length, 1);
  assert.equal(submitMiniGame(afterGame, 1), afterGame);

  // Re-evaluating same chapter (if replayed into game) must deduplicate history by chapterId
  const replayedGame = { ...afterGame, phase: 'game' };
  const afterReplayGame = submitMiniGame(replayedGame, 0);
  assert.equal(afterReplayGame.history.length, 1);
  assert.equal(afterReplayGame.history[0].chapterId, 1);
  assert.equal(afterReplayGame.history[0].correct, false);

  // Corrupt 'reveal' save missing activeReply or lastGameOutcome falls back safely to 'scene'
  const corruptRevealNoReply = sanitizeLoadedState(
    { ...afterGame, phase: 'reveal', activeReply: null },
    createInitialState,
    10
  );
  assert.equal(corruptRevealNoReply.phase, 'scene');

  const corruptRevealNoOutcome = sanitizeLoadedState(
    { ...afterGame, phase: 'reveal', lastGameOutcome: null },
    createInitialState,
    10
  );
  assert.equal(corruptRevealNoOutcome.phase, 'scene');

  const validReveal = sanitizeLoadedState(afterGame, createInitialState, 10);
  assert.equal(validReveal.phase, 'reveal');
});
