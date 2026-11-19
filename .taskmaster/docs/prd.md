# PRD: Grand Theft Agency — 電通台灣一日風雲（《決策智慧》2018–2026 生活情境遊戲）

**Author:** Dentsu Taiwan Multi-Agent Engineering Team (Orchestrator + Claude + Codex + Unity CLI)
**Date:** 2026-11-19
**Status:** Approved
**Version:** 1.0
**Taskmaster Optimized:** Yes

---

## Executive Summary

Grand Theft Agency: Dentsu Taiwan One-Day Odyssey transforms nine volumes of Dentsu Taiwan's Intelligent Decision yearbooks (2018–2026) into an interactive Taiwanese GTA 6 neon-street life simulation game built for marketing practitioners, brand leaders, and agency teams. Players select one of four Dentsu Taiwan roles or an unlockable Grandma Master character, navigate ten realistic workday time slots from 08:30 AM Taipei scooter commute to 11:45 PM war-room judgment, and solve six decision mini-games plus a Grandma Scooter Rush arcade stage. The project integrates Claude narrative generation, Codex + ChatGPT gpt-image 2.6 character and scene illustrations, Codex + Higgsfield cutscene videos, Unity CLI companion C# assets, and dual deployment to GitHub Pages and Netlify.

---

## Problem Statement

### Current Situation
Marketing and agency teams rarely finish reading nine thick annual thought-leadership books (2018–2026 Intelligent Decision), and conventional corporate training lectures fail to replicate the split-second pressure of real agency workdays in Taiwan when CFOs demand immediate ROAS while AI algorithms erode long-term brand trust.

### User Impact
- **Who is affected:** Brand marketers (CMO, Brand Manager), Dentsu Taiwan agency specialists (Account, Planner, Creative, Media/Data), and workshop trainees.
- **Pain points:** High cognitive fatigue from academic slides, disconnect between book frameworks (Last-Click attribution, MMM, Cookie deprecation, RMN Poison Apple, People Model, Judgment/AX/SLIP) and actual daily Taiwanese agency scenarios.
- **Severity:** High — without experiential play, practitioners fall into Goodhart's Law traps and optimize vanity metrics.

### Business Impact
- **Cost of problem:** Misallocated ad budgets toward short-term retargeting and AI Slop rather than incremental new-customer growth and brand preference.
- **Strategic importance:** Turns Dentsu Taiwan's flagship 9-year IP into an approachable, shareable, high-engagement web game playable offline as a single HTML bundle or online via GitHub Pages and Netlify.

---

## Goals & Success Metrics

### Goal 1: Complete 9-Book, 10-Time-Slot Agency Life Simulation
- **Description:** Map every Intelligent Decision volume (2018–2026, splitting 2026 into People/Model and AI/Judgment) onto 10 authentic Taiwanese advertising agency workday chapters.
- **Metric:** Chapter and knowledge-point coverage across all 9 yearbooks.
- **Baseline:** 0 GTA-style interactive chapters in `gta-dentsu-taiwan/`.
- **Target:** 10 playable chapters (08:30 AM–11:45 PM), 4 Dentsu Taiwan functional roles + 1 unlockable Grandma role, and 6 distinct mini-game mechanics + Grandma Scooter Rush.
- **Timeframe:** Single sprint delivery on 2026-11-19.
- **Measurement Method:** Automated Node verification suite (`node --test tests/game-engine.test.mjs`) asserting chapter count, role abilities, and score rules.

### Goal 2: Full Grandma Mod Easter Egg Integration (Modes 1 + 2 + 3)
- **Description:** Implement all three requested layers of the Taiwanese Grandma Easter Egg module.
- **Metric:** Interactive Grandma features verified in DOM and state machine.
- **Baseline:** 0 Grandma Mod triggers.
- **Target:** 100% support for cheat code `AMA666` + amulet toggle with Hokkien-Taiwanese market economics translations, 2023 AI copy phone-call + 5-star Wanted Tatung rice cooker rescue, and 60fps Canvas Grandma Scooter Rush minigame.
- **Timeframe:** Single sprint delivery on 2026-11-19.
- **Measurement Method:** Automated unit tests and live headless/browser verification in Orca Browser.

### Goal 3: Multi-Agent Asset & Dual-Platform Web Deployment
- **Description:** Coordinate Claude, Codex, ChatGPT gpt-image 2.6, Higgsfield video cutscenes, and Unity CLI C# scaffolding, then ship clean static web artifacts without leaking any source PDFs.
- **Metric:** Validated assets and live deployment checks.
- **Baseline:** Local workspace initialization.
- **Target:** 0 source PDFs or InDesign files inside repository/dist, 100% WebP images + Higgsfield MP4 cutscenes loaded with graceful fallbacks, standalone HTML + GitHub Pages + Netlify configuration passing checks.
- **Timeframe:** Single sprint delivery on 2026-11-19.
- **Measurement Method:** Asset integrity check script, `git status` audit, and `curl`/browser verification on preview server and deployed URL.

---

## User Stories

### Story 1: Agency Role Selection & Taiwanese GTA 6 HUD
**As a** Taiwanese marketing practitioner,
**I want to** pick my Dentsu Taiwan role (Account Director, Strategic Planner, Creative Director, Media & Data Lead, or secret Grandma Master) and view a GTA 6 neon-style HUD with Wanted Stars, Taipei GPS mini-map, and LINE phone alerts,
**So that I can** experience the workday crisis through authentic agency lenses and role-specific desk clues.

**Acceptance Criteria:**
- [ ] Player can inspect stats, desk clues, and special abilities for all 4 core roles plus unlockable Grandma role (`AMA666`).
- [ ] HUD renders 5-star CFO/Boss Wanted Level, 5 core metrics (Stamina, Street Cred, Real Lift, Brand Trust, Judgment), Taipei GPS radar mini-map, and interactive LINE phone drawer.
- [ ] Selecting a role updates starting stats, chapter desk clues, and available People Model / Advisor tactical actions.
- [ ] All UI text uses natural Traditional Chinese (Taiwan) terminology with accessible touch targets (>= 44px) and desktop/mobile responsiveness.

**Task Breakdown Hint:**
- Task 1.1: Build story-data.js role definitions and 10 chapter scripts (~3h)
- Task 1.2: Implement game-engine.js pure reducer and role modifiers (~2h)
- Task 1.3: Build GTA 6 neon HUD, GPS mini-map, and LINE phone component (~3h)

**Dependencies:** None

### Story 2: 10-Time-Slot Agency Day & 6 Interactive Decision Mini-Games
**As a** player progressing through a 16-hour agency day,
**I want to** respond to urgent boss/client LINE messages, unlock People Model consumer mind-reading (Lisa & Cindy), and complete interactive challenges (Pick, Slider, Swipe, Multi, Stop, Agent),
**So that I can** absorb the 2018–2026 Intelligent Decision insights without tedious textbook reading.

**Acceptance Criteria:**
- [ ] Every chapter pairs a vivid Taiwanese agency scene (Taipei Bridge scooter rush, Xinyi 12F boardroom, bento rain break, Neihu studio, midnight war room, Rechao night feast) with one of the 9 yearbooks.
- [ ] Players can ask People Model (Lisa / Cindy) or Grandma for clues before locking in decisions and completing the chapter mini-game.
- [ ] Reveals contrast short-term vanity metrics against real business lift and quote the exact yearbook article title.
- [ ] Final 11:45 PM Judgment chapter evaluates player persona, 5-axis radar score, and generates a shareable career appraisal card.

**Task Breakdown Hint:**
- Task 2.1: Implement 6 mini-game interaction widgets (~4h)
- Task 2.2: Wire chapter progression, cutscene playback, and reveal flow (~3h)
- Task 2.3: Implement end-of-day career appraisal and radar summary (~2h)

**Dependencies:** REQ-001, REQ-002

### Story 3: Grandma Mod Easter Egg (1 + 2 + 3) & Cutscene Pipeline
**As a** player seeking Taiwanese humor and surprise mechanics,
**I want to** activate the Grandma Mod via cheat code `AMA666` or amulet button, get rescued by Grandma's Tatung rice cooker at 5-star Wanted burnout, hear her call in Chapter 6, and ride her electric grocery scooter in an arcade minigame,
**So that I can** enjoy memorable street-level translations of marketing theories and replayable arcade breaks.

**Acceptance Criteria:**
- [ ] Typing `AMA666` or clicking the Amulet toggles Grandma Mod, reveals the 5th playable character, and displays Taiwanese market economics translations on every chapter.
- [ ] Reaching 5 Wanted Stars or 0 Stamina triggers Grandma's Tatung Rice Cooker rescue cutscene, clearing Wanted Stars and restoring Stamina.
- [ ] Grandma Scooter Rush Canvas minigame runs at 60fps with keyboard and touch lane controls, spawning positive items (iced milk tea, Tatung cooker, real word-of-mouth) and hazards (RMN poison apple, cookie tombstone, 0.5s trash video, AI Slop).

**Task Breakdown Hint:**
- Task 3.1: Implement Grandma Mod triggers and Tatung cooker rescue state machine (~2h)
- Task 3.2: Build 60fps Canvas Grandma Scooter Rush minigame (~3h)
- Task 3.3: Integrate Higgsfield MP4 cutscenes and Web Audio API sound effects (~2h)

**Dependencies:** REQ-001, REQ-003

---

## Functional Requirements

### Must Have (P0) - Critical for Launch

#### REQ-001: 9-Yearbook 10-Time-Slot Narrative & Role Matrix (`src/story-data.js`)
**Description:** Author complete Taiwanese agency storyline covering 2018 through 2026 (10 chapters), 4 Dentsu Taiwan roles, 1 hidden Grandma Master role, People Model twins (Lisa 25yo, Cindy 35yo), and Grandma market-economics translations via Claude agent generation and review.

**Acceptance Criteria:**
- [ ] Contains exactly 10 chapters spanning 08:30 AM to 11:45 PM mapped to 2018–2026 Intelligent Decision books.
- [ ] Each role defines id, name, title, deskClue per chapter, specialAbility, and statModifiers.
- [ ] Each chapter includes sceneVisual, timeLabel, location, bossLine, 4 tactical replies, miniGame payload, revealSummary, yearbookSource, and grandmaTranslation.

**Task Breakdown:**
- Generate role and chapter narrative JSON/JS via Claude agent (~2h)
- Verify historical yearbook citations and Taiwanese agency tone (~1h)

**Dependencies:** None

#### REQ-002: Pure Game State Engine & Scoring Rules (`src/game-engine.js`)
**Description:** Implement deterministic state reducer supporting role selection, chapter replies, People Model consultations, mini-game scoring across all 6 mechanics (`pick`, `slider`, `swipe`, `multi`, `stop`, `agent`), Wanted star escalation, Grandma Tatung rescue, and final persona evaluation.

**Acceptance Criteria:**
- [ ] Zero DOM dependencies inside `src/game-engine.js` so Node tests execute cleanly.
- [ ] Enforces 5-star Wanted escalation and Grandma rescue reset rules.
- [ ] Computes final persona (Judgment Architect, Report Hunter, Brand Believer, Balanced Strategist, or Grandma Legend).

**Task Breakdown:**
- Implement state transitions and scoring calculators (~2h)
- Write comprehensive Node unit tests (`tests/game-engine.test.mjs`) (~1h)

**Dependencies:** REQ-001

#### REQ-003: Grandma Mod 1+2+3 & Canvas Scooter Rush (`src/scooter-minigame.js`)
**Description:** Build all three Grandma Easter Egg mechanics: keyboard/UI cheat `AMA666`, 2023 phone-call + 5-star Tatung cooker rescue, and a 3-lane Canvas arcade minigame with touch/mouse/keyboard controls.

**Acceptance Criteria:**
- [ ] Cheat code buffer listens case-insensitively for `AMA666` anywhere outside text inputs.
- [ ] Scooter Rush supports Arrow/A-D keys and left/right touch buttons, tracks score, combo, shields, and awards bonus Judgment/Trust points back to the main campaign.

**Task Breakdown:**
- Build Canvas 3-lane perspective road renderer and entity spawner (~2h)
- Connect Grandma rescue trigger and reward callback to main engine (~1h)

**Dependencies:** REQ-002

#### REQ-004: ChatGPT `gpt-image 2.6` & Higgsfield Video Cutscene Assets (`public/images/`, `public/video/`)
**Description:** Generate natural Taiwanese GTA 6 hand-painted WebP portraits and 6 Taipei workday scenes via ChatGPT gpt-image 2.6, and generate cutscene MP4 clips via Codex calling the connected Higgsfield connector, post-processed via `cwebp` and `ffmpeg`.

**Acceptance Criteria:**
- [ ] All character portraits (`role-account.webp`, `role-planner.webp`, `role-creative.webp`, `role-media.webp`, `role-grandma.webp`, `advisor-lisa.webp`, `advisor-cindy.webp`) and scene banners exist as `.webp` files under `public/images/`.
- [ ] Cutscene videos (`intro-taipei.mp4`, `boardroom-push.mp4`, `grandma-rescue.mp4`) exist under `public/video/` and render smoothly with skip/mute controls and Canvas fallback.

**Task Breakdown:**
- Invoke Codex + Higgsfield video jobs and download/encode MP4 cutscenes (~2h)
- Generate high-resolution Taiwanese GTA 6 WebP portraits and scenes via ChatGPT gpt-image 2.6 (~2h)

**Dependencies:** REQ-001

#### REQ-005: GTA 6 Taiwan Web UI, Audio Synth & Standalone Bundle (`index.html`, `src/ui-app.js`, `src/audio-fx.js`, `dist/`)
**Description:** Assemble zero-framework HTML5 frontend with GTA 6 neon aesthetic, interactive LINE smartphone, Taipei GPS mini-map, Web Audio synthesized sound effects, and a build script producing a single-file standalone HTML plus deployable `dist/`.

**Acceptance Criteria:**
- [ ] Relative paths only (`./public/...`); zero hardcoded external CDNs or network blockers.
- [ ] Runs both via `index.html` static server and as `dist/gta-dentsu-taiwan-standalone.html`.
- [ ] Zero console errors and responsive across 1280x800 desktop and 390x844 mobile viewports.

**Task Breakdown:**
- Build GTA 6 CSS/UI components and cutscene overlay player (~3h)
- Add Web Audio synth sound effects and standalone bundler script (~1h)

**Dependencies:** REQ-002, REQ-003, REQ-004

### Should Have (P1) - Important but Not Blocking

#### REQ-006: Unity CLI Companion Project & C# Core Scripts (`unity-companion/`)
**Description:** Utilize installed Unity CLI (`/Users/lewis/.unity/bin/unity`) to verify environment/templates and scaffold Unity C# companion gameplay controllers (`DecisionWisdomCampaign.cs`, `GrandmaScooterController.cs`, `GTATaiwanHUDController.cs`) matching the web game's data schema.

**Acceptance Criteria:**
- [ ] Unity CLI diagnostics and project/script scaffolding documented and verified.
- [ ] C# scripts compile-clean in syntax and mirror all 10 chapters, 5 roles, and Grandma Scooter Rush lane mechanics.

**Task Breakdown:**
- Inspect Unity CLI capabilities and create `unity-companion/` structure (~1h)
- Author mirrored C# gameplay and HUD scripts (~2h)

**Dependencies:** REQ-001, REQ-002

#### REQ-007: Dual GitHub Pages + Netlify Deployment & IP Isolation Audit
**Description:** Configure `netlify.toml`, `.github/workflows/deploy.yml`, strict `.gitignore` blocking all PDFs and InDesign files, push to GitHub under `mela0976`, and configure Netlify deployment.

**Acceptance Criteria:**
- [ ] `git ls-files` contains zero `.pdf`, `.indd`, or `ZH/` files.
- [ ] GitHub repository and Pages workflow succeed cleanly; Netlify config verified and deployed if authenticated or ready-to-link.

**Task Breakdown:**
- Run asset and IP leak audit tests (~1h)
- Configure `netlify.toml`, GitHub Actions, and push to GitHub (~1h)

**Dependencies:** REQ-005, REQ-006

---

## Non-Functional Requirements

### Performance
- **Initial Load Time:** < 1.5 seconds on 4G for HTML/CSS/JS shell (< 250 KB uncompressed code excluding optional MP4 cutscenes).
- **Frame Rate:** >= 60 fps Canvas animation during Grandma Scooter Rush and GPS mini-map sweep.
- **Asset Size:** All `.webp` portraits < 250 KB each; compressed `.mp4` cutscenes <= 2.5 MB each with lazy preload.

### Security & IP Compliance
- **Zero Source Material Leakage:** All 9 original PDFs and `ZH/` InDesign files remain strictly excluded from `gta-dentsu-taiwan/` git history and deployment artifacts.
- **XSS Prevention:** All dynamic dialog and user inputs render strictly via `textContent` and validated DOM builders; zero `eval()` or unsafe innerHTML injection from untrusted input.

### Compatibility & Accessibility
- **Browsers:** Chrome, Safari, Firefox, Edge (latest 2 versions), plus iOS Safari and Android Chrome.
- **Responsive Breakpoints:** Mobile 390px, Tablet 768px, Desktop 1280px+.
- **Keyboard & Reduced Motion:** Full keyboard playability (1–4 reply hotkeys, Arrow/A-D for Scooter Rush, `AMA666` cheat code) and `prefers-reduced-motion` support.

---

## Technical Considerations

### System Architecture
The application uses a clean modular ES Module architecture with zero external runtime dependencies, enabling direct deployment on both GitHub Pages and Netlify as well as bundling into a standalone HTML file.

```
┌────────────────────────────────────────────────────────────────────┐
│  Multi-Agent Production Pipeline                                   │
│  [Claude Code] -> story-data.js  |  [Codex + Higgsfield] -> .mp4   │
│  [ChatGPT gpt-image 2.6] -> .webp |  [Unity CLI] -> unity-companion │
└───────────────────────────────┬────────────────────────────────────┘
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│  gta-dentsu-taiwan Web Runtime (ES Modules + Standalone Bundle)    │
│  index.html -> ui-app.js <--> game-engine.js (Pure State Machine)  │
│                   │               ▲                                │
│                   ├─> scooter-minigame.js (60fps Canvas Arcade)    │
│                   ├─> audio-fx.js (Web Audio Synth SFX)            │
│                   └─> public/images/*.webp + public/video/*.mp4    │
└───────────────────────────────┬────────────────────────────────────┘
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│  Dual Deployment Target                                            │
│  GitHub Pages (.github/workflows/deploy.yml)  +  Netlify (netlify.toml) │
└────────────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Frontend:** Vanilla HTML5, CSS3 (GTA 6 Neon Theme), ES2022 Modules, HTML5 Canvas 2D, Web Audio API.
- **Build & Test:** Node.js (`node --test`), custom zero-dependency standalone HTML bundler (`scripts/build.mjs`), `cwebp`, `ffmpeg`.
- **Multi-Agent Tools:** Claude Code (`claude`), OpenAI Codex (`codex` + Higgsfield connector), ChatGPT `gpt-image 2.6`, Unity CLI (`/Users/lewis/.unity/bin/unity`), GitHub CLI (`gh`).
- **Hosting:** GitHub Pages (`mela0976`) and Netlify (`netlify.toml`).

---

## Implementation Roadmap

### Phase 1: Specification & Multi-Agent Kickoff
- Task 1: Initialize TaskMaster PRD & validated task graph (`REQ-001`..`REQ-007`)
- Task 2: Generate Taiwanese agency storyline & Grandma translations via Claude (`REQ-001`)

### Phase 2: Visual, Video & Unity CLI Asset Production
- Task 3: Generate ChatGPT `gpt-image 2.6` Taiwanese GTA 6 WebP portraits & scenes (`REQ-004`)
- Task 4: Generate Higgsfield cutscene MP4 videos via Codex (`REQ-004`)
- Task 5: Scaffold Unity CLI companion project & C# controllers (`REQ-006`)

### Phase 3: Core Game Engine, Minigames & GTA 6 UI
- Task 6: Implement pure game engine reducer & Node unit tests (`REQ-002`)
- Task 7: Implement Grandma Mod 1+2+3 & 60fps Canvas Scooter Rush (`REQ-003`)
- Task 8: Build GTA 6 Taiwan HUD, LINE smartphone, mini-games & Web Audio SFX (`REQ-005`)

### Phase 4: Verification, Packaging & Dual Deployment
- Task 9: Build standalone HTML bundle & pass full test + IP audit suite (`REQ-005`, `REQ-007`)
- Task 10: Configure Netlify & GitHub Actions and deploy live (`REQ-007`)

**Validation Checkpoint:** `node --test tests/game-engine.test.mjs`, `node scripts/build.mjs`, `node scripts/check-dist.mjs`, live browser check via Orca Browser, and GitHub Pages + Netlify deploy verification.

---

## Out of Scope
- Real-time multiplayer WebSocket server hosting (this release focuses on rich single-player agency life simulation with People Model & Grandma AI companion; real-time 4-player rooms remain in `game3d/`).
- Uploading or redistributing raw Intelligent Decision PDFs or InDesign source packages.
- Paid backend database persistence (player state persists cleanly in browser `localStorage`).

---

## Open Questions & Risks
- **Higgsfield Queue Latency:** Video generation jobs may take 60–180 seconds; mitigated by parallel execution with Claude/UI work and `ffmpeg`-styled fallback cutscenes if a queue stalls.
- **Netlify Authentication State:** `netlify` CLI is not pre-installed locally; mitigated by preparing `netlify.toml` and checking `npx netlify-cli` / GitHub-to-Netlify auto-deploy readiness alongside live GitHub Pages deployment.

---

## Validation Checkpoints
- **Checkpoint 1 (PRD & Tasks):** `validate-prd` score >= 85% and `validate-tasks --require-phase-config` passes with zero errors.
- **Checkpoint 2 (Engine & IP Audit):** 100% pass on Node state machine tests, Grandma Mod 1+2+3 assertions, and zero-PDF/zero-InDesign verification.
- **Checkpoint 3 (Visual & Browser E2E):** Orca Browser loads served build at both 1280x800 and 390x844 with zero console errors, all `.webp` images and `.mp4` cutscenes playable, and deployment pushed to GitHub.

---

## Appendix: Task Breakdown Hints
- Task 1 (PRD & Setup): ~1h, Dependencies: None
- Task 2 (Claude Narrative `story-data.js`): ~2h, Dependencies: Task 1
- Task 3 (ChatGPT `gpt-image 2.6` Portraits & Scenes): ~2h, Dependencies: Task 1
- Task 4 (Codex + Higgsfield Cutscenes): ~2h, Dependencies: Task 1
- Task 5 (Unity CLI Companion Scripts): ~2h, Dependencies: Task 2
- Task 6 (Pure Game Engine & Tests): ~2h, Dependencies: Task 2
- Task 7 (Grandma Mod + Canvas Scooter Rush): ~3h, Dependencies: Task 6
- Task 8 (GTA 6 Taiwan UI & Audio FX): ~3h, Dependencies: Task 2, Task 3, Task 4, Task 6, Task 7
- Task 9 (Bundler, IP Audit & Browser QA): ~2h, Dependencies: Task 8
- Task 10 (GitHub + Netlify Dual Deployment): ~1h, Dependencies: Task 5, Task 9
