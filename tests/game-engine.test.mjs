import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CHAPTERS, ROLES, PEOPLE_MODEL_TWINS, GRANDMA_QUIPS, SCOOTER_CONFIG } from '../src/story-data.js';
import { soundFX, normalizeGrandmaVoiceKey } from '../src/audio-fx.js';
import {
  createInitialState,
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
