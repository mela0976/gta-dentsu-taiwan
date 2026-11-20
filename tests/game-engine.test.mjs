import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CHAPTERS, ROLES, PEOPLE_MODEL_TWINS, GRANDMA_QUIPS, SCOOTER_CONFIG } from '../src/story-data.js';
import { soundFX, normalizeGrandmaVoiceKey, BGM_MIX_LEVELS, BGM_FILTER_HZ } from '../src/audio-fx.js';
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

test('VoAI 春枝 voice clips map and exist for all 36 Grandma lines', () => {
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
    assert.ok(clip, `Missing VoAI clip mapping for: ${line}`);
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

test('Voice mix foregrounds dialogue over BGM and covers 42 character VoAI clips + 3 audio MP4 cutscenes', () => {
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
  ];
  assert.equal(voiceSpecs.length, 42);

  const uniqueClips = new Set();
  for (const [roleKey, line] of voiceSpecs) {
    const clip = soundFX.resolveVoiceClip(line, roleKey);
    assert.ok(clip, `Missing VoAI character clip for (${roleKey}): ${line}`);
    uniqueClips.add(clip);
    const absPath = path.join(process.cwd(), clip.replace(/^\.\//, ''));
    assert.ok(fs.existsSync(absPath), `Missing character MP3: ${absPath}`);
    assert.ok(fs.statSync(absPath).size > 2048, `Truncated character MP3: ${absPath}`);
  }
  assert.equal(uniqueClips.size, 42);

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
