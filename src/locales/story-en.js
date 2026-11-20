export const STORY_EN = {
  roles: [
    {
      id: 'account',
      name: 'Account Director',
      title: 'Account Director',
      badge: 'Xinyi Crisis Closer',
      dept: 'Client Services',
      tagline: 'One ring from the client and I already have three counters mapped on the MRT.',
      quote: 'Clients aren’t giving you a hard time—they just haven’t been convinced yet.',
      specialName: 'Tactful Defuse',
      specialDesc: 'Once per chapter, halve the Wanted Star gain from a risky reply.'
    },
    {
      id: 'planner',
      name: 'Strategic Planner',
      title: 'Strategic Planner',
      badge: 'People Model Reader',
      dept: 'Strategy & Insights',
      tagline: 'What the spreadsheet hides, I go straight to Lisa and Cindy to hear.',
      quote: 'Data tells you what happened. People tell you why.',
      specialName: 'Mind Read',
      specialDesc: 'Once per chapter, unlock both Lisa & Cindy insights plus +6 Judgment.'
    },
    {
      id: 'creative',
      name: 'Creative Director',
      title: 'Creative Director',
      badge: 'Anti-AI-Slop Keeper',
      dept: 'Creative & Content',
      tagline: 'Cranking out ten variants is easy. Making one people remember is the craft.',
      quote: 'Mediocrity scales. Favoritism doesn’t.',
      specialName: 'Taste Veto',
      specialDesc: 'Once per chapter, shield Brand Trust from any deduction on your reply.'
    },
    {
      id: 'media',
      name: 'Media & Data Lead',
      title: 'Media & Data Lead',
      badge: 'Algo Ghostbuster',
      dept: 'Media & Data',
      tagline: 'The prettier the ROAS looks, the faster I tear open the ad log.',
      quote: 'Numbers don’t lie, but people cherry-pick which ones speak.',
      specialName: 'Ghost Radar',
      specialDesc: 'Once per chapter, spot inflated metrics and gain +7 Real Lift.'
    },
    {
      id: 'grandma',
      name: 'Master Taiwan Grandma',
      title: 'Grandma Master',
      badge: 'Secret 5th Role',
      dept: 'Market HQ (Off-Org)',
      tagline: 'Riding an e-scooter with a green Tatung rice cooker straight into Xinyi.',
      quote: 'Business is like braising pork: hit the right simmer and folks line up themselves.',
      specialName: 'Full Tatung Pot',
      specialDesc: 'Once per chapter, serve braised pork rice for 100 Stamina and clear all Wanted Stars.'
    }
  ],
  peopleModelTwins: {
    lisa: {
      name: 'Lisa (25 · Value-Savvy Office Worker)',
      voice: 'Calculates value, checks reviews on PTT/Dcard, hard to fool.'
    },
    cindy: {
      name: 'Cindy (35 · Busy Working Mom)',
      voice: 'No time to waste, hates surprises, sticks with brands she trusts.'
    },
    grandma: {
      name: 'Grandma (Voice Advisor)',
      voice: 'Taiwanese-Mandarin straight talk, wet-market economics specialist.'
    }
  },
  grandmaQuips: {
    rescueTitle: 'There’s a Hunger Only Grandma Knows: You’re Overworked!',
    rescueSubtitle: 'Master Grandma weaves past Tao Zhu Yin Yuan on her e-scooter, bursts into Fubon A25 with a green Tatung cooker, and wipes all 5 CFO Wanted Stars with hot braised pork rice!',
    rescueLines: [
      'Kids, you stare at spreadsheets harder than you eat. Fill your stomach first—those numbers aren’t running away!',
      'Attribution what? At the market I check one thing: do folks come back to my stall next week?',
      'Free costs the most—sixty years at the market taught me that. A 0.5s view can’t even buy one scallion.',
      'AI copy? Talks smooth, zero wok hei. One bite tells everyone whether you cooked with heart.',
      'Nodding at everything the boss says makes you an errand runner. Speaking truth and taking heat makes you an advisor. Eat up!'
    ]
  },
  gta6Analysis: {
    title: 'GTA 6 Trailer 1 & 2 × 10 Years of Decision Intelligence in Taiwan',
    coreParallel: 'Like Lucia’s ankle monitor and “Trust? Trust.” beside Jason on neon streets, Dentsu folk spend a decade shaking off attribution handcuffs—reclaiming Human Judgment from black-box dashboards.',
    taiwanMotifs: [
      '🟢 Iconic green Taiwan road signs: Songren Rd., Songyong Rd., Ruiguang Rd. reimagined for Taipei’s grid.',
      '🪟 Begonia patterned glass & window grilles: Old Taipei alley light baked into UI textures and night reflections.',
      '🏙️ Fubon A25 X-braced tower × spiraling Tao Zhu Yin Yuan: Real Xinyi Street View coordinates mapped 1:1.',
      '🧋 Breakfast shop iced milk tea & scooter waterfall: Taipei morning commute swaps in for Vice City traffic.',
      '🍲 Green Tatung rice cooker & red plastic stools: Grandma’s market wisdom breaks the CFO’s short-term spreadsheet cage.'
    ]
  },
  personas: [
    {
      id: 'judge',
      name: 'The Arbiter',
      title: 'The one voice in the midnight war room willing to say “Hold on.”',
      rule: 'score >= 5 & 3 <= perf <= 7',
      strength: 'You don’t pick sides—you interrogate evidence.',
      blind: 'You move deliberately, and sometimes rain on everyone’s victory lap.',
      read: '2026 “Judgment Will Become the Scarcest Advantage”'
    },
    {
      id: 'hunter',
      name: 'Dashboard Hunter',
      title: 'Sharpest spreadsheet closer in Xinyi—and easiest for the numbers to trap.',
      rule: 'perf >= 7',
      strength: 'Every dollar shows a neat column on Monday morning.',
      blind: 'You keep crediting ads for loyal buyers who were already walking in.',
      read: '2025 “From Data Illusions to Brand Truth”'
    },
    {
      id: 'believer',
      name: 'Brand Devotee',
      title: 'Romantic defender of human favoritism over cheap clicks.',
      rule: 'perf <= 3',
      strength: 'You remember brands exist so people choose you without checking prices.',
      blind: 'When you can’t prove incrementality in numbers, your budget gets cut first.',
      read: '2020 “Connecting Media Effectiveness & Business Goals”'
    },
    {
      id: 'balance',
      name: 'Street Balancer',
      title: 'Seasoned Taipei operator who listens cleanly to both tables.',
      rule: 'Other combinations',
      strength: 'You hear both CFO pressure and creative craft clearly.',
      blind: 'Split every bet in half and neither side builds real breakthrough.',
      read: '2024 “Modernizing Brand Marketing”'
    },
    {
      id: 'grandma',
      name: 'Master Empresses’ Pot',
      title: 'One steaming pot of braised pork rice conquers all of Xinyi.',
      rule: 'Unlock AMA666 or trigger Grandma Rescue >= 1 time',
      strength: 'You cook honest judgment into every bowl—people keep returning.',
      blind: 'The pot tastes so good the CEO wonders what the other floors are for.',
      read: '2026 “AI Can Shop for People, Brands Make People Want It”'
    }
  ],
  scooterConfig: {
    title: 'Grandma E-Scooter Rush: Songren Rd. Fubon A25 × Tao Zhu Yin Yuan',
    subtitle: 'Haul the green Tatung pot past Tao Zhu Yin Yuan straight to Fubon A25 on Songgao Rd.!',
    goodItems: [
      { id: 'iced-milk', label: 'Iced Milk Tea', quip: 'Breakfast shop iced milk tea: +10 Stamina.' },
      { id: 'tatung-pot', label: 'Tatung Cooker', quip: 'One pot of braised pork wipes 1 Wanted Star.' },
      { id: 'real-wom', label: 'True Word of Mouth', quip: 'Real praise on PTT & Dcard beats empty posters.' },
      { id: 'people-model', label: 'People Model Clue', quip: 'Lisa & Cindy whisper what actually moved them.' }
    ],
    badItems: [
      { id: 'rmn-apple', label: 'RMN Poison Apple', quip: 'Looks sweet—turns out it only counted repeat buyers.' },
      { id: 'cookie-tomb', label: 'Cookie Tombstone', quip: 'Third-party tracking rests in peace.' },
      { id: 'fake-impression', label: '0.5s View Illusion', quip: 'Gone in a blink—didn’t even deliver one scallion.' },
      { id: 'ai-slop', label: 'AI Slop Tin', quip: 'Ultra-processed generic copy—zero wok hei, zero memory.' }
    ],
    quips: {
      start: 'Hold tight, kiddo—Grandma’s tearing into Xinyi!',
      goodHit: ['Good stuff—pack it in!', 'Mmm, real flavor.', 'Told you so!'],
      badHit: ['Ai-yo, don’t eat that junk!', 'Toss it, zero nutrition!', 'Fooled again—need new glasses!'],
      win: 'Grandma parked at A25 without spilling a single drop of broth!',
      lose: 'The pot tipped, but Grandma says: shake it off, we’ll simmer a fresh batch.'
    },
    canvas: {
      initBanner: '2026 E-Scooter × Tesla FSD Test Lane | Songren Rd. to Fubon A25!',
      shieldBanner: 'Tatung Pot Invincible Shield! Algorithms can’t bump Grandma!',
      pickupPrefix: 'Grabbed ',
      deflectTpl: 'Tatung Pot deflected "{label}"! +120',
      hitTpl: 'Hit {label}! "Ai-yo, those numbers are fake!"',
      signLeft: 'Tao Zhu Yin Yuan · Songyong',
      signRight: 'Songren Rd. · Fubon A25 HQ',
      roadOverlay: '2026 A25 · SONGREN RD',
      fsdOverlay: 'TESLA FSD v13 · LOCKED 18m'
    }
  },
  fsdLines: {
    on: 'Tesla FSD engaged. Scooter ahead 18 meters, headway locked along Songren Road.',
    off: 'Switched back to manual driving.'
  },
  cutsceneGrandmaLine: 'Don’t slash that budget yet! Grandma’s on her way with the Tatung rice cooker!',
  chapters: [
    {
      id: 1,
      year: 2018,
      timeSlot: '08:30 AM',
      location: 'Taipei Bridge Scooter Flow ➔ Fubon A25 & Tao Zhu Yin Yuan',
      book: '2018 Decision Intelligence',
      title: 'No Longer a Gamble',
      roadSign: 'No. 77 Songgao Rd. · Songren',
      gta6Analysis: {
        trailerScene: 'GTA 6 Trailer 1 (0:00 & 1:05) Golden morning light & Leonida bike pack',
        characterArc: 'Like Lucia breaking out from ankle-monitor tracking, escape attribution vanity: separate loyal repeat buyers from true incremental demand.',
        taiwanCraft: 'Songyong/Songren green road signs, 55688 yellow cabs, Fubon A25 white X-braces facing spiraling Tao Zhu Yin Yuan.'
      },
      sceneDesc: 'Taipei’s morning scooter waterfall sweeps down Songren Rd. to Fubon A25, facing spiraling Tao Zhu Yin Yuan and Taipei 101. Toast in hand, your Boss pings LINE: the new attribution tool tracks every dollar.',
      lineSender: { name: 'Boss', role: 'Group CEO', badge: 'BOSS' },
      lineMessage: 'Our new attribution tool measures every dollar. How do we allocate next quarter?',
      roleClues: {
        account: 'When the boss says "every dollar is measurable," budget cuts usually follow.',
        planner: 'Brand search volume hasn’t budged in two quarters—nobody’s asking for us.',
        creative: 'Dashboards have zero columns for "people liked us enough to pay full price."',
        media: 'Last-click credits loyal repeat buyers right before checkout as ad wins.',
        grandma: 'Market stalls know: regulars walk in anyway even if you never shout.'
      },
      peopleModel: {
        lisa: 'Last click? I was already going to buy that brand—the ad just popped up before checkout.',
        cindy: 'I have zero time for ads. I buy my usual brand—don’t take credit for my habit.'
      },
      grandmaQuip: 'Grandma says: claiming regulars came because you yelled—do accounting like that and your stall shuts down.',
      grandmaPhoneCall: {
        trigger: false,
        title: 'Grandma Quick Check-In',
        text: 'Did you eat real breakfast, kiddo? Iced milk tea and toast don’t count—eat a proper meal!'
      },
      replies: [
        { id: 0, text: 'All-in on measurable ads', feedback: 'The CFO loves the deck, while existing buyers get counted as new growth.' },
        { id: 1, text: '70% performance, 30% brand', feedback: 'Safe compromise—and those 30% brand dollars vanish first next budget trim.' },
        { id: 2, text: '50/50 split with a holdout test', feedback: 'A holdout reveals real lift cleanly, though leadership must wait one quarter.' },
        { id: 3, text: 'Protect unmeasurable brand spend', feedback: 'You keep oxygen in the brand—now be ready to defend it at every review.' }
      ],
      game: {
        prompt: 'Which campaign wrap report actually grew the business?',
        options: [
          { title: 'Report A', lines: ['8x Ad ROAS', '90% buyers were repeat customers'] },
          { title: 'Report B', lines: ['3x Ad ROAS', '40% buyers were brand new'] },
          { title: 'Report C', lines: ['6x Ad ROAS', 'Mostly bottom-funnel retargeting'] },
          { title: 'Report D', lines: ['4x Ad ROAS', 'Counted promo week only'] }
        ],
        reveal: 'Report A & C & D harvest people already ready to buy. Only Report B expands new demand.'
      },
      takeaway: 'Attribution shows who touched the finish line—not who built the lead.',
      source: 'Future Without Wrap Reports'
    },
    {
      id: 2,
      year: 2019,
      timeSlot: '10:00 AM',
      location: 'Fubon A25 Executive Boardroom (Facing Tao Zhu Yin Yuan & 101)',
      book: '2019 Decision Intelligence',
      title: 'The Infinite Game',
      roadSign: 'Songgao × Songren · A25 Tower',
      gta6Analysis: {
        trailerScene: 'GTA 6 Trailer 1 (0:11) & Trailer 2 sunlit glass visiting-room confrontation',
        characterArc: 'Glass walls divide agency and client: hoarding playbooks out of fear speeds up replacement; teaching builds advisory trust.',
        taiwanCraft: 'Songgao granite colonnades & Fubon A25 glass diagonal trusses with iced Americano cups.'
      },
      sceneDesc: 'Morning sunlight slices through Fubon A25 blinds, framing Tao Zhu Yin Yuan across the street. The client’s CDO throws slides on the wall—every single slide says "In-Housing." Will you keep your seat at the table?',
      lineSender: { name: 'Boss', role: 'Group CEO', badge: 'BOSS' },
      lineMessage: 'The client wants to take media buying in-house. Should we train their team?',
      roleClues: {
        account: 'Their lead whispered the CDO gave them just one quarter to show results.',
        planner: 'Look closely—the word "autonomy" appears on every single client slide.',
        creative: 'If we gatekeep, someone else teaches them; if we teach, they remember us.',
        media: 'Execution fees cover half our payroll—handing it away hurts short-term margin.',
        grandma: 'Scared your apprentice opens a shop? Upgrade to master instructor and charge tuition.'
      },
      peopleModel: {
        lisa: 'If a partner hides know-how so I stay dependent, I drop them immediately.',
        cindy: 'I just want direct answers without waiting in your agency ticket queue.'
      },
      grandmaQuip: 'Grandma says: hide recipes and apprentices learn next door. Train a hundred stalls and you’re still the grandmaster.',
      grandmaPhoneCall: {
        trigger: false,
        title: 'Grandma Quick Check-In',
        text: 'Stop glancing at your phone in meetings—look people in the eye, that’s basic respect.'
      },
      replies: [
        { id: 0, text: 'Refuse training, guard fees', feedback: 'You protect Q1 billing, while the client quietly shops elsewhere.' },
        { id: 1, text: 'Teach basics, hide core logic', feedback: 'They spot half-teaching fast and trust leaks out immediately.' },
        { id: 2, text: 'Teach on a long-term retainer', feedback: 'Contracts anchor transition periods, though patience remains scarce.' },
        { id: 3, text: 'Teach freely, pivot to advisor', feedback: 'Bold strategic shift—now leadership must bridge the fee transition.' }
      ],
      game: {
        prompt: 'How many years did the landmark bank benchmark spend rebuilding tech in-house first?',
        unit: ' yrs',
        reveal: '5 years. They cut tech outsourcing from 85% down to 15% over half a decade.'
      },
      takeaway: 'Transformation benchmarks took five years; boards often grant one quarter.',
      source: 'Lessons from DBS Bank Transformation'
    },
    {
      id: 3,
      year: 2020,
      timeSlot: '12:30 PM',
      location: 'Songren Back-Alley Bento Shop & Corner Boba Stand',
      book: '2020 Decision Intelligence',
      title: 'Second Half',
      roadSign: 'Songren × Zhongxiao E. Rd.',
      gta6Analysis: {
        trailerScene: 'GTA 6 Trailer 2 rainy street reflections & phone check for an exit route',
        characterArc: 'Under pandemic budget cuts, pouring everything into short clicks starves brand memory when foot traffic returns.',
        taiwanCraft: 'Green Taipei city buses, 55688 cabs, glowing bento signs & rainy arcade window grilles.'
      },
      sceneDesc: 'Afternoon rain slicks the Songren alley outside A25 as you grab a chicken-leg bento and boba, mist veiling Tao Zhu Yin Yuan. Your phone buzzes: budgets just got slashed in half.',
      lineSender: { name: 'Boss', role: 'Group CEO', badge: 'BOSS' },
      lineMessage: 'Downturn hit—budgets are cut by 50%. How do we split what remains?',
      roleClues: {
        account: 'CFO demands cashflow this quarter—nobody wants to hear "six months out."',
        planner: 'Markets that cut brand dark saw organic search decay half a year later.',
        creative: 'Consumers can’t recall one recent ad—only last year’s flagship film.',
        media: 'Brand placements are deeply discounted this quarter while rivals retreat.',
        grandma: 'Never switch off your shop sign during slow rain, or nobody finds you sunny days.'
      },
      peopleModel: {
        lisa: 'Before buying I search first—and only click brands already sitting in my head.',
        cindy: 'During crises I stick to familiar names. No time to gamble on unknowns.'
      },
      grandmaQuip: 'Grandma says: slow season isn’t excuse to scrap your sign—folks navigate by lights.',
      grandmaPhoneCall: {
        trigger: false,
        title: 'Grandma Quick Check-In',
        text: 'Rainy out—don’t eat bento while walking or you’ll drip oil on your client shirt.'
      },
      replies: [
        { id: 0, text: '100% performance ads', feedback: 'Quarterly receipts look neat—mostly harvesting people already searching for you.' },
        { id: 1, text: '70% performance, 30% brand', feedback: 'Thirty percent rarely buys enough share of voice, risking both goals.' },
        { id: 2, text: 'Split evenly 50/50', feedback: 'Tight funding stretches both sides thin, yet neither engine stalls out completely.' },
        { id: 3, text: 'Keep over half in brand', feedback: 'You’ll take heat in Q2 reviews—and thank yourself six months later.' }
      ],
      game: {
        prompt: 'A sportswear brand put 77% into performance ads. What share of sales actually came from brand?',
        unit: '%',
        reveal: '65%. Afterward they rebalanced to 60% brand and 40% performance.'
      },
      takeaway: 'Easy to count does not equal most valuable.',
      source: 'Demystifying Marketing Mix Modeling'
    },
    {
      id: 4,
      year: 2021,
      timeSlot: '02:00 PM',
      location: 'Fubon A25 Sky Pantry (Platform Rep Ambush)',
      book: '2021 Decision Intelligence',
      title: 'Across 2030',
      roadSign: 'Songyong Rd. · Tao Zhu View',
      gta6Analysis: {
        trailerScene: 'GTA 6 Trailer 1 convenience-store CCTV & omnipresent tracking lenses',
        characterArc: 'Cookie deprecation echoes shaking off a tracker: rented third-party IDs fade, while consented first-party trust endures.',
        taiwanCraft: 'Begonia glass partitions facing Tao Zhu Yin Yuan green balconies & iced Americanos.'
      },
      sceneDesc: 'By the A25 pantry coffee machine overlooking Tao Zhu Yin Yuan, a platform rep corners you like an ambush: third-party cookies are dying—buy our ID graph or go blind.',
      lineSender: { name: 'Platform Sales', role: 'Ad Platform AM', badge: 'SALES' },
      lineMessage: 'Cookies are fading out. Buy our identity graph to re-identify every shopper?',
      roleClues: {
        account: 'Their pricing charges per matched user—higher match rate, bigger invoice.',
        planner: 'Recognizable site visitors are already down sharply since last year.',
        creative: 'Customer service logs are piling up complaints saying "feels creepy."',
        media: 'Rented ID pools evaporate overnight if OS rules change—you own zero asset.',
        grandma: 'Following shoppers home before they speak is called stalking at the market.'
      },
      peopleModel: {
        lisa: 'I hit Reject on every cookie popup—why would I let you track me everywhere?',
        cindy: 'Ask nicely and I share willingly. Peek behind my back and I’m gone.'
      },
      grandmaQuip: 'Grandma says: hearing "see you next week" beats secretly copying someone’s address.',
      grandmaPhoneCall: {
        trigger: false,
        title: 'Grandma Quick Check-In',
        text: 'Watch out for fast talkers grinning nonstop—ask Grandma before signing anything.'
      },
      replies: [
        { id: 0, text: 'Buy full ID stack', feedback: 'Audience sizes stay padded while creepy-ad complaints climb with the bill.' },
        { id: 1, text: 'Trial it for one quarter', feedback: 'Ninety days show reach growth—zero clue how much brand trust eroded.' },
        { id: 2, text: 'Pass, organize our 1P CRM', feedback: 'Building owned data takes grind, yet finally stays yours permanently.' },
        { id: 3, text: 'Only use consented data', feedback: 'Smaller lists upfront—every single contact genuinely chose to hear you.' }
      ],
      game: {
        prompt: 'Put on your consumer hat. Which of these tracking prompts do you allow?',
        left: 'Decline',
        right: 'Allow',
        cards: [
          'Shopping app wants to log every item you peeked at',
          'News site shares your reading history with 214 partners',
          'Mobile game tracks your activity inside other apps',
          'Delivery app collects precise GPS even when closed'
        ],
        revealByCount: 'You declined {n} of 4. Half of Gen Z clears cookies monthly or runs blockers.'
      },
      takeaway: 'Even you hate being stalked.',
      source: 'New Identity Revolution & Gen Z Intent'
    },
    {
      id: 5,
      year: 2022,
      timeSlot: '03:45 PM',
      location: 'Fubon A25 Tea-Break War Room (Boba & ESG Crisis)',
      book: '2022 Decision Intelligence',
      title: 'Compound Leap',
      roadSign: 'Songren Tea Time · Yongji Dist.',
      gta6Analysis: {
        trailerScene: 'GTA 6 Trailer 1 (@DadBodSquad) yacht hype vs viral social reality check',
        characterArc: 'Social hype loves green pledges, yet 81% of shoppers still pick savings at checkout. Ship real product proof first.',
        taiwanCraft: 'Fried chicken cutlet, half-sugar boba, PTT/Dcard fact-check threads & A25 green reflections.'
      },
      sceneDesc: 'Stepping into A25 with afternoon boba and crispy chicken, your social editor runs up: a rival’s ESG pledge just got fact-checked online. Meanwhile, the boss pings: should we post ours too?',
      lineSender: { name: 'Boss', role: 'Group CEO', badge: 'BOSS' },
      lineMessage: 'Everyone is publishing sustainability pledges. Should we drop one too?',
      roleClues: {
        account: 'A competitor’s green pledge got torn apart line by line on forums last month.',
        planner: 'Shoppers say they support green—then grab the cheaper pack at checkout.',
        creative: 'Eco posts get high likes and near-zero actual purchases.',
        media: 'Everyone is bidding up green keywords this quarter, inflating CPM.',
        grandma: 'Praising earth then buying the cheaper veggies is basic human wallet math.'
      },
      peopleModel: {
        lisa: 'Of course I like eco—unless the identical item costs extra, then I compare prices.',
        cindy: 'For baby formula I inspect price and ingredients first, never poster slogans.'
      },
      grandmaQuip: 'Grandma says: talk organic all day, people still pick the cheaper greens—make yours worth the price.',
      grandmaPhoneCall: {
        trigger: false,
        title: 'Grandma Quick Check-In',
        text: 'Easy on fried chicken and cut sugar in that boba—take care of yourself!'
      },
      replies: [
        { id: 0, text: 'Post fast to claim space', feedback: 'You claim the spotlight—and invite forums to audit every factory pipe.' },
        { id: 1, text: 'Post vision, skip numbers', feedback: 'Leave metrics blank and netizens gleefully fill them in for you.' },
        { id: 2, text: 'Audit facts before speaking', feedback: 'You miss the hype wave, and dodge public greenwashing backlash.' },
        { id: 3, text: 'Fix one real thing first', feedback: 'Rivals dominate PR for a month while your claim actually holds water.' }
      ],
      game: {
        prompt: 'What percentage of Taiwan consumers prioritize saving money over "saving the planet"?',
        unit: '%',
        reveal: '81%. In the same study, 85% viewed eco products as pricier.'
      },
      takeaway: 'Saying you support it and paying more at checkout are two different things.',
      source: 'Sustainable Transition Insights'
    },
    {
      id: 6,
      year: 2023,
      timeSlot: '05:30 PM',
      location: 'Neihu Film Studio (Overlooking A25 & Tao Zhu Yin Yuan)',
      book: '2023 Decision Intelligence',
      title: 'Empowered Evolution',
      roadSign: 'Ruiguang Rd. · Neihu Studio',
      gta6Analysis: {
        trailerScene: 'GTA 6 Trailer 2 vintage custom pickup vs industrial neon gloss',
        characterArc: 'When AI generates thirty slick slogans per minute, human soul ("Grandma’s kitchen warmth") becomes the scarce asset.',
        taiwanCraft: 'Ruiguang Rd. studio rigs, green Tatung cooker with steel handle, Grandma crashing set in floral shirt.'
      },
      sceneDesc: 'Studio lights blaze in Neihu as dusk frames distant A25 and Tao Zhu Yin Yuan. Producers huddle around 30 AI images generated in one minute—just as the client asks to cut production fees in half.',
      lineSender: { name: 'Client', role: 'Brand Manager', badge: 'CLIENT' },
      lineMessage: 'AI makes 10x assets instantly. We can cut production budget 50%, right?',
      roleClues: {
        account: 'Cut 50% now and they’ll demand outcomes prove why you kept the other half.',
        planner: 'Focus groups couldn’t tell AI copy apart—and forgot all of it equally.',
        creative: 'Asset volume exploded, yet CTR flattened into identical beige noise.',
        media: 'Platforms cheer "more variants optimize better"—because platforms charge per impression.',
        grandma: 'Machines boil rice fast, yet regulars come back for Auntie’s wok aroma.'
      },
      peopleModel: {
        lisa: 'I don’t care if AI wrote it—just whether it speaks honestly to how I feel.',
        cindy: 'Everything looks identical lately, so I scroll right past without remembering.'
      },
      grandmaQuip: 'Grandma says: ten machine pots can’t beat one bowl that tastes like home.',
      grandmaPhoneCall: {
        trigger: true,
        title: 'Emergency Call: Master Grandma Enters Set',
        text: 'Hello? You shooting "Some flavors take you straight back to Grandma’s kitchen"? Don’t slash budgets—Grandma’s riding over with the pot right now!',
        triggerCard: 3,
        triggerCardText: 'Some flavors take you straight back to Grandma’s kitchen in one sip.',
        rewardText: 'Grandma storms the studio with hot braised pork rice—the room goes silent and budget cuts stall until tomorrow.'
      },
      replies: [
        { id: 0, text: 'Cut 50%, let AI handle all', feedback: 'Output swells while every ad blurs into indistinguishable template soup.' },
        { id: 1, text: 'AI writes, humans proofread', feedback: 'Proofreading catches typos—it never catches soul.' },
        { id: 2, text: 'Trim 30%, keep hero craft human', feedback: 'Smart negotiation—now deliver clear results to justify the 70% craft.' },
        { id: 3, text: 'AI drafts, humans craft finals', feedback: 'Slower and pricier—be ready to prove what that human nuance earned.' }
      ],
      game: {
        prompt: 'Human writer or AI generator? Swipe each ad headline.',
        left: 'Human',
        right: 'AI',
        cards: [
          'That first morning sip is today’s quiet gift to yourself.',
          'You don’t need to be great to start—starting makes you great.',
          'Leave the clutter to us, and reclaim your weekend back.',
          'Some flavors take you straight back to Grandma’s kitchen in one sip.'
        ],
        reveal: 'All four were written by AI. Guessing right matters less than noticing why they blend together.'
      },
      takeaway: 'When content becomes free, human warmth becomes expensive.',
      source: 'AI Shift from Content to Connection'
    },
    {
      id: 7,
      year: 2024,
      timeSlot: '07:30 PM',
      location: 'Fubon A25 Lobby Late Delivery & RMN Pitch',
      book: '2024 Decision Intelligence',
      title: 'Poisoned Apple',
      roadSign: 'Songren × Songgao · A25 Plaza',
      gta6Analysis: {
        trailerScene: 'GTA 6 Trailer 1 (0:58) Masked push through store glass doors',
        characterArc: 'Retail Media Networks own the shelves AND grade their own homework. Without independent verification, you work for the landlord.',
        taiwanCraft: 'Stone plaza pavers, delivery bento in striped bag, Tao Zhu reflections on glass.'
      },
      sceneDesc: '7:30 PM outside A25: green lights glow on Tao Zhu Yin Yuan like a neon tank. Delivery hands off porkchop bento as the CGO slides over a Retail Media proposal—reporting clean from impression straight to receipt.',
      lineSender: { name: 'CGO', role: 'Chief Growth Officer', badge: 'CGO' },
      lineMessage: 'Retail Media tracks straight from ad view to checkout! Shift brand budget here?',
      roleClues: {
        account: 'Funny how the shelf listing buyer and RMN ad rep are the same contact.',
        planner: 'Buyers remember which marketplace delivered—not which brand they bought.',
        creative: 'Our search rank inside the app rises and falls right beside ad spend.',
        media: 'RMN reports look spotless, yet raw log exports are strictly locked away.',
        grandma: 'Never trust a landlord who charges rent AND scores your sales book.'
      },
      peopleModel: {
        lisa: 'When I open that shopping app I’m already checking out—ads don’t change my cart.',
        cindy: 'Honestly I just remember buying it on the platform, not whose logo it carried.'
      },
      grandmaQuip: 'Grandma says: landlord collects rent and grades your ledger? Keep your own notebook!',
      grandmaPhoneCall: {
        trigger: false,
        title: 'Grandma Quick Check-In',
        text: 'Quit ordering takeout every night—Grandma saved warm dinner in the cooker.'
      },
      replies: [
        { id: 0, text: 'Shift all into Retail Media', feedback: 'Every number balances neatly—written entirely by the platform taking your fee.' },
        { id: 1, text: 'Shift half, scale if clean', feedback: '"If clean" still relies on numbers stamped by the referee.' },
        { id: 2, text: 'Move promo spend only', feedback: 'Frequent promos build loyalty to the marketplace, not to your brand.' },
        { id: 3, text: 'Pilot small, run holdout', feedback: 'Slow and unpopular with Growth—yet earns proof nobody can take away.' }
      ],
      game: {
        prompt: 'Which assets does the Retailer Media Network hold simultaneously?',
        options: [
          { title: 'Shelf access & listing control', lines: [] },
          { title: 'First-party shopper data', lines: [] },
          { title: 'On-site ad inventory', lines: [] },
          { title: 'Unbiased 3rd-party audit', lines: [] }
        ],
        reveal: 'The platform holds 1–3. Independent verification must be built outside its walls.'
      },
      takeaway: 'Never let the referee bet on the game.',
      source: 'RMN: Silver Bullet or Poisoned Apple?'
    },
    {
      id: 8,
      year: 2025,
      timeSlot: '09:30 PM',
      location: 'Yellow Cab Passing Tao Zhu Yin Yuan back to A25',
      book: '2025 Decision Intelligence',
      title: 'Autopilot Trap',
      roadSign: 'Songren Night Cab · Tao Zhu',
      gta6Analysis: {
        trailerScene: 'GTA 6 Trailer 2 midnight truck dragging a vault spraying sparks',
        characterArc: 'Hands-off auto-bidding sprints toward easy repeat buyers, blazing ROAS sparks while draining new customers dry.',
        taiwanCraft: 'Late cab radio glow, bus-lane street markings, Taipei 101 spire & spiraling tower.'
      },
      sceneDesc: 'Your yellow cab cruises past Tao Zhu Yin Yuan back toward A25. Two weeks on full auto-bidding sent ROAS soaring to records—yet a knot in your stomach whispers something is off.',
      lineSender: { name: 'Platform Sales', role: 'Ad Platform AM', badge: 'SALES' },
      lineMessage: 'Switch on full AI auto-optimization! Manual tweaks only slow the algorithm down.',
      roleClues: {
        account: 'Holding out a test cell hurts this quarter’s top-line—someone has to absorb it.',
        planner: 'Recruiting new-customer interviewees stalled—every respondent is already loyal.',
        creative: 'People who have never tried us haven’t seen one ad all month.',
        media: 'Headline ROAS breaks records weekly while new-buyer share slides straight down.',
        grandma: 'Selling solely to regulars looks busy—until they move away in three years.'
      },
      peopleModel: {
        lisa: 'If an ad hounds me for three straight days after browsing, I switch brands out of spite.',
        cindy: 'Never heard of your brand before—how would I trust trying you?'
      },
      grandmaQuip: 'Grandma says: sell only to regulars and books shine—until nobody new recognizes your stall.',
      grandmaPhoneCall: {
        trigger: false,
        title: 'Grandma Quick Check-In',
        text: 'Buckle up in night cabs, kiddo. Text Grandma the second you’re back.'
      },
      replies: [
        { id: 0, text: 'Enable full ROAS auto-bid', feedback: 'ROAS climbs forever because machines chase people ready to buy today.' },
        { id: 1, text: 'Enable, review weekly deck', feedback: 'Every weekly chart hits record highs—nobody ever hits pause in a boom.' },
        { id: 2, text: 'Enable with unexposed holdout', feedback: 'Short-term conversions dip slightly, and the truth finally steps onscreen.' },
        { id: 3, text: 'Retarget off, optimize new', feedback: 'CPA rises right away, yet the customer pie actually starts expanding.' }
      ],
      game: {
        prompt: 'Auto-bidding is live. Hit Pause when you think the machine crosses the line!',
        report: { label: 'Reported ROAS' },
        fresh: { label: 'New Buyer Share', unit: '%' },
        revealStopped: 'Paused at {fresh}% new buyers (Reported Index {report}). Sharp catch!',
        revealNever: 'Never paused—Reported Index hit {report} while new-buyer share fell to {fresh}%.',
        reveal: 'Dashboards keep climbing every tick—that’s why nobody hits stop voluntarily.'
      },
      takeaway: 'Algorithms amplify whoever was already easiest to close.',
      source: 'From Data Illusions to Brand Truth'
    },
    {
      id: 9,
      year: 2026,
      timeSlot: '10:45 PM',
      location: 'Songren Late Stir-Fry & Convenience Store Drink Fridge',
      book: '2026 Decision Intelligence',
      title: 'True Distance',
      roadSign: 'Civic Blvd. Sec. 4 · Stir-Fry',
      gta6Analysis: {
        trailerScene: 'GTA 6 Trailer 1 neon bar warmth vs cold convenience store coolers',
        characterArc: 'When AI shopping agents reduce brands to price-per-unit specs, only human word-of-mouth creates pricing power.',
        taiwanCraft: 'Red street lanterns, plastic stools, green beer bottles, neon scooter tail lights & glass drink cooler.'
      },
      sceneDesc: 'Wok steam rises off late-night stir-fry below A25’s glow. Boss taps his phone: shoppers now ask AI to pick products for them. Stepping before the store cooler, Lisa’s exact warning echoes back.',
      lineSender: { name: 'Boss', role: 'Group CEO', badge: 'BOSS' },
      lineMessage: 'People ask AI agents to choose purchases now. Feed AI specs first or build human memory?',
      roleClues: {
        account: 'You can buy AI feed placement—you can’t buy genuine consumer preference.',
        planner: 'Shoppers say: "What AI picks I try; what friends vouch for I ask by name."',
        creative: 'People typing our brand directly bypass every comparison chart.',
        media: 'We show up in AI recommendations—and its stated reason is literally "cheapest."',
        grandma: 'Neighbors asking "whose fish is fresh" beats posting a hundred flyers.'
      },
      peopleModel: {
        lisa: 'Whatever AI recommends, I check PTT/Dcard for horror stories first—zero buzz, zero buy.',
        cindy: 'I ask AI to compare options, unless a friend swore by theirs—then I skip comparison.'
      },
      grandmaQuip: 'Grandma says: one neighbor naming your stall beats a hundred megaphones.',
      grandmaPhoneCall: {
        trigger: false,
        title: 'Grandma Quick Check-In',
        text: 'Stir-fry is salty—drink water tonight, I’ve got mung bean soup ready.'
      },
      replies: [
        { id: 0, text: 'Feed AI specs first', feedback: 'You rank first by trimming price—until a rival cuts ten cents.' },
        { id: 1, text: '80% AI specs, 20% brand', feedback: 'Twenty percent never builds enough pull to beat lower prices.' },
        { id: 2, text: 'Split evenly 50/50', feedback: 'Half-funded awareness struggles, though neither side gets abandoned.' },
        { id: 3, text: 'Make humans remember first', feedback: 'Fewer default bot picks initially—someone must bridge product discoverability.' }
      ],
      game: {
        prompt: 'You’re thirsty after work. Which drink do you grab from the cooler?',
        options: [
          { title: 'Mountain Mist Oolong', lines: ['NT$55', 'Small-farm tea a friend raved about'] },
          { title: 'Daily C 1000', lines: ['NT$39', 'Highest Vitamin C spec per dollar'] },
          { title: 'Zero Sparkle Water', lines: ['NT$45', 'Minimalist designer bottle'] }
        ],
        revealSame: 'AI picked the exact same bottle: cheapest with top specs. You thought like a spreadsheet.',
        revealDiff: 'AI picked Daily C 1000 (cheapest, highest spec). Your pick rested on human memory.'
      },
      takeaway: 'AI helps people buy faster; brands make people actually want it.',
      source: 'AI Helps Shop, Brands Create Desire'
    },
    {
      id: 10,
      year: 2027,
      timeSlot: '11:45 PM',
      location: 'Fubon A25 Rooftop War Room (Overlooking 101 & Tao Zhu)',
      book: 'Finale',
      title: 'Judgment',
      roadSign: 'No. 77 Songgao · A25 Rooftop',
      gta6Analysis: {
        trailerScene: 'GTA 6 Trailer 1 (1:15) Lucia & Jason bedside vow: "Trust? — Trust."',
        characterArc: 'Ten years culminate here: when an automated pricing engine extracts extra margin from loyal buyers, judgment cannot be outsourced.',
        taiwanCraft: 'Begonia glass boardroom, midnight countdown glow on 101 & Tao Zhu, steaming Tatung braised pork bowl.'
      },
      sceneDesc: 'Minutes before New Year midnight inside A25’s rooftop war room, only you and the CFO remain. Audit logs just exposed an ugly truth: the automated engine silently charges loyal regulars higher prices. Your call?',
      lineSender: { name: 'CFO', role: 'Chief Financial Officer', badge: 'CFO' },
      lineMessage: 'That automation engine padded margins for ten years by upcharging loyal buyers. Shut it off?',
      roleClues: {
        account: 'Kill the engine now and next quarter’s forecast definitely drops.',
        planner: 'Look at who got overcharged—the faithful regulars buying longest.',
        creative: 'When this hits the news, headlines won’t blame "Algorithm"—they’ll name us.',
        media: 'Nobody fully decodes all weights inside the engine—even the vendor.',
        grandma: 'Overcharging old regulars? Never once in my life. Own this call—don’t blame metal.'
      },
      peopleModel: {
        lisa: 'Catch a brand quietly charging me extra as a loyal member? I screenshot it to PTT and walk forever.',
        cindy: 'Loyalty means treating me like family. Betray that and I delete my account.'
      },
      grandmaQuip: 'Grandma says: if the scale is rigged, that’s on the owner—not the brass weight.',
      grandmaPhoneCall: {
        trigger: false,
        title: 'Grandma Call: The Final Ring',
        text: 'Decide cleanly and act. Whatever happens tomorrow, Grandma’s rice cooker stays warm for you at home.'
      },
      replies: [
        { id: 0, text: 'Keep it on, protect numbers', feedback: 'Quarterly margins survive—until reporters print our company name across page one.' },
        { id: 1, text: 'Keep on, silently tweak down', feedback: 'Silent tuning admits you knew it exploited trust and kept quiet.' },
        { id: 2, text: 'Pause immediately, audit all', feedback: 'Next quarter takes a hit, yet responsibility finally returns to human hands.' },
        { id: 3, text: 'Shut off: never outsource', feedback: 'Ten years of easy margin vanish tonight—and you own your conscience cleanly.' }
      ],
      game: null,
      takeaway: 'Ten years ago we trusted data to replace judgment. Today we know: judgment cannot be outsourced.',
      source: '2026 Judgment Becomes the Scarcest Advantage'
    }
  ]
};
