export const ROLES_EN_2 = {
  variants: {
    media: {
      1: {
        sceneDesc: '[Media View] 8:00 AM entering A25 8F Data War Room: cracking open raw logs on an 8x ROAS campaign exposes a shock—95% of conversions were bookmarked regulars typing checkout anyway.',
        lineSender: { name: 'Data Analyst', role: 'Attribution & Logs', badge: 'DATA' },
        lineMessage: 'Boss loves that 8x ROAS chart and wants to cut TV/OOH completely to double this tool. Speak up?',
        replies: [
          { id: 0, text: 'Stay quiet, expand billing on 8x', feedback: 'Buying billings soar Q1—till total company revenue stalls flat in Q3.' },
          { id: 1, text: 'Mention retargeting, keep 30% safety', feedback: 'Without holdout design, those 30% brand dollars vanish first at audit.' },
          { id: 2, text: 'Pull click timestamps + propose geo test', feedback: 'Silence falls over the war room—seeing 70% were organic repeat orders.' },
          { id: 3, text: 'Rebuild incremental mix, kill last-click', feedback: 'Heavy build makes ops groan, establishing you as keeper of real truth.' }
        ],
        game: {
          prompt: '[Raw Log Audit] Four ad channels report glowing numbers. Which truly generated incremental orders?',
          options: [
            { title: 'Ch A: 30s Pre-Checkout Popup', lines: ['Reports 12.4x ROAS', '94% logged in directly ten minutes prior'] },
            { title: 'Ch B: Matched Geo Test (+40% New)', lines: ['Reports modest 3.1x ROAS', 'Clean +38% incremental lift vs holdout'] },
            { title: 'Ch C: Member App Promo Push', lines: ['Reports 7.5x ROAS', '100% repeat buyers from past 90 days'] },
            { title: 'Ch D: Single-Day 90% Flash Drop', lines: ['Reports 6.2x ROAS', 'Flat sales trough 15 days before & after'] }
          ],
          reveal: 'Never trust unadjusted attribution columns—only Channel B’s holdout cell verifies true net growth.'
        }
      },
      2: {
        sceneDesc: '[Media View] 9:30 AM in A25’s margin review: media commissions cover nearly half the department—and your anchor client wants to open direct ad accounts in-house. What keeps you essential?',
        lineSender: { name: 'Media Buying Lead', role: 'Buying & Ops', badge: 'BUYING' },
        lineMessage: 'Top client is opening direct platform seats next quarter. If commissions vanish, do we still coach them?',
        replies: [
          { id: 0, text: 'Keep audience recipes inside black box', feedback: 'Platform reps rebuild setup in three weeks and strip agency access cleanly.' },
          { id: 1, text: 'Show UI buttons, hide cross-media math', feedback: 'Client wastes spend over-frequencying buyers and blames your half-coaching.' },
          { id: 2, text: 'Train fully, sign cross-channel architect', feedback: 'Shifts margin from volume fees into high-value data architecture retainers.' },
          { id: 3, text: 'Lead in-house shift as neutral auditor', feedback: 'You stop chasing volume rebates and become their CFO’s first call weekly.' }
        ],
        game: {
          prompt: '[Org Shift Benchmark] After 5 years rebuilding, the model bank reduced tech outsourcing from 85% down to what %?',
          unit: '%',
          reveal: '15%! Once clients handle day-to-day buttons, only cross-platform measurement architects retain real leverage.'
        }
      },
      3: {
        sceneDesc: '[Media View] 12:15 PM under Zhongxiao arcade rain: opening RTB consoles drops a shock—while rivals hide in paid search keywords, high-reach brand video CPMs just crashed to clearance rates.',
        lineSender: { name: 'Biddable Strategist', role: 'Performance Media', badge: 'BID' },
        lineMessage: 'Budget got halved and every rival piled into Search & Retargeting. Keep brand placements on schedule?',
        replies: [
          { id: 0, text: 'Go all-in Search & Retargeting safety', feedback: 'Six competitors jam identical keywords, tripling CPC on loyal buyers.' },
          { id: 1, text: '70% performance, 30% cheap banners', feedback: 'Unseen corner banners quietly waste cash while aided recall slips.' },
          { id: 2, text: 'Buy half-price reach video, cap freq', feedback: 'Scoop 60% category reach at one-third usual cost while rivals starve.' },
          { id: 3, text: 'Counter-flip 60% brand / 40% harvest', feedback: 'So-so Q2 clicks precede a breakout organic search surge by autumn.' }
        ],
        game: {
          prompt: '[Media Plan Lab] Keywords are overheating while rivals retreat. Which allocation captures highest return?',
          options: [
            { title: 'Plan A: 100% Hot Search Keywords', lines: ['Six rivals bid identical terms', 'Triple CPCs chasing existing demand'] },
            { title: 'Plan B: Cheap 60% Reach + 40% Harvest', lines: ['Low CPMs reach net-new households', 'Leads organic demand on rebound'] },
            { title: 'Plan C: Pause all upper-funnel dark', lines: ['Zero share-of-voice across town', 'Invisible once shoppers return'] },
            { title: 'Plan D: High-CTR accidental click-bait', lines: ['Inflated click metrics look flashy', '98% bounce & severe brand risk'] }
          ],
          reveal: 'Going dark leaks share slowly; seizing discounted reach via a 60/40 split wins massive surplus equity.'
        }
      },
      4: {
        sceneDesc: '[Media View] 1:45 PM at A25 DSP desks: a data broker pitches a "30M gray-market cross-device ID graph" claiming instant visitor recognition after cookie deprecation.',
        lineSender: { name: 'Audience Vendor', role: 'DMP / DSP Partner', badge: 'TECH' },
        lineMessage: 'Cookies are dead! Rent our 95%-match black-box ID graph for NT$200K/month starting Monday?',
        replies: [
          { id: 0, text: 'Plug it in fast so traders aren’t blind', feedback: 'OS privacy updates wipe all 600K worth of labels leaving zero asset owned.' },
          { id: 1, text: 'Test one month stacked over 1P lists', feedback: 'Bot bloat dilutes bidding signals and drives genuine CPA up.' },
          { id: 2, text: 'Skip brokers, link interactive LINE CRM', feedback: 'Pool shrinks from millions to 200K real buyers—all permanently owned.' },
          { id: 3, text: 'Launch zero-ID contextual content buy', feedback: 'Zero creepy tracking lifts engagement among genuinely curious readers.' }
        ],
        game: {
          prompt: '[AdTech Hygiene Check] Put yourself in a user’s shoes scrolling on your phone. Which tracking trick do you block?',
          left: 'Block It',
          right: 'Allow It',
          cards: [
            'Combines battery level & font tweaks into stealth cross-browser fingerprints',
            'Data brokers merge credit card deliveries with web clicks silently',
            'Infers home & office street addresses via nearby Wi-Fi SSID lists',
            'Tags health forum visits to trigger high-margin insurance retargeting'
          ],
          revealByCount: 'You blocked {n} stealth trackers. Buyers detest surveillance—build data assets with open consent.'
        }
      },
      5: {
        sceneDesc: '[Media View] 3:30 PM at A25’s keyword desk: eco terms skyrocketed in auction auctions as every brand fights to claim green credibility—burning triple CPMs on student essays.',
        lineSender: { name: 'Bidding Lead', role: 'Search & Auction', badge: 'BID' },
        lineMessage: 'Earth-day ESG keyword bids tripled this week. Keep bidding up, or shift out of keyword wars?',
        replies: [
          { id: 0, text: 'Bid higher—cannot lose eco share', feedback: 'Traffic costs triple pulling curious students researching reports—zero sales.' },
          { id: 1, text: 'Half in eco search, half mass retail', feedback: 'Without price value proof, clicked shoppers bounce off the 20% markup.' },
          { id: 2, text: 'Quit buzzwords, target cost-saving fits', feedback: 'Slashes wasted CPMs 60% while boosting actual converter share by 20%.' },
          { id: 3, text: 'Pause eco ads till value pack ships', feedback: 'Prevents empty CPM burn, saving ammo for when product matches truth.' }
        ],
        game: {
          prompt: '[Audience Strategy] Since 81% prioritize savings over eco buzzwords, which media segment hits real buyers?',
          options: [
            { title: 'Seg 1: High-CPM ESG conference news', lines: ['Great boardroom screenshots', 'Near-zero everyday household checkout'] },
            { title: 'Seg 2: Energy-saving & high-value picks', lines: ['40% lower CPC than crowded buzzwords', 'Delivers green benefit as cash savings'] },
            { title: 'Seg 3: Untargeted Earth Day banners', lines: ['Frequency caps spike rapidly', 'Zero brand attribution past day one'] },
            { title: 'Seg 4: Overpriced app launch takeovers', lines: ['Record-high seasonal CPM', 'Forgotten tomorrow outside agency decks'] }
          ],
          reveal: 'Skip pricey vanity buzzwords. Segment 2 pairs real utility savings with household budget truth.'
        }
      },
      6: {
        sceneDesc: '[Media View] 5:15 PM at Neihu’s DCO console: AI spawned 30 ad copy permutations in 60 seconds—every single variant flatlined around 1.2% CTR with zero standout winner.',
        lineSender: { name: 'DCO Console', role: 'Dynamic Creative System', badge: 'DCO' },
        lineMessage: 'All 30 AI copy mixes tied around 1.2% CTR. Cut hero shoots and feed AI 100 cheap swaps?',
        replies: [
          { id: 0, text: 'Let AI generate 100 more blind swaps', feedback: 'Platforms collect full impression tolls while 100 forgettable variants air.' },
          { id: 1, text: 'Push minor color swap leader #1', feedback: 'Statistically indistinguishable noise triggers weeks of pointless tinkering.' },
          { id: 2, text: 'Cut dull bloat, concentrate budget hero', feedback: 'Diverting impressions to high-emotion human craft rockets direct brand lift.' },
          { id: 3, text: 'Share log proof: platforms want volume', feedback: 'Uses media math to defend creative craft—platforms profit on noise, brands profit on memory.' }
        ],
        game: {
          prompt: '[CTR Flatline Audit] Four homogeneous slogans tied identically in DCO tests. Which came from AI?',
          left: 'Human Craft',
          right: 'AI Filler',
          cards: [
            'More calm, less stress—start treating yourself gently starting today.',
            'Leave busy yesterday behind; let this quiet ritual guide your afternoon.',
            'Your dependable daily companion for every brighter step ahead.',
            'Some flavors take you straight back to Grandma’s kitchen in one sip.'
          ],
          reveal: 'All four! Flooding auctions with beige AI copies only enriches platforms billing per impression.'
        }
      },
      7: {
        sceneDesc: '[Media View] 7:00 PM at A25 Clean Room audit tables: RMN reps pitch zero-leak attribution straight to POS receipts—yet contract fine print bans external raw log exports.',
        lineSender: { name: 'Retail Media Rep', role: 'RMN Platform Ops', badge: 'RMN' },
        lineMessage: 'On-site RMN matches views directly to cash registers with spotless numbers! Move brand budgets over?',
        replies: [
          { id: 0, text: 'Move all budget—2-min daily reporting', feedback: 'Clean sheets shine weekly—till direct site traffic drops off completely.' },
          { id: 1, text: 'Put 50% in on-site priority terms', feedback: 'Walled garden attribution credits itself while swallowing external video lift.' },
          { id: 2, text: 'Require Clean Room + holdout design', feedback: 'Never swallow landlord reports unverified without independent receipts.' },
          { id: 3, text: 'Restrict RMN to promos, protect outside', feedback: 'Treats retail platforms as cash registers, never your sole brand boss.' }
        ],
        game: {
          prompt: '[Self-Grading Audit] Why can’t marketers take closed RMN reporting at face value? Check what they hold.',
          options: [
            { title: 'Listing & out-of-stock shelf control', lines: [] },
            { title: 'Walled-garden shopper purchase logs', lines: [] },
            { title: 'Bidding slots AND attribution scoring', lines: [] },
            { title: 'Open unbiased log export to rivals', lines: [] }
          ],
          reveal: 'The first three sit behind walled gates; unbiased holdouts must be engineered outside.'
        }
      },
      8: {
        sceneDesc: '[Media View] 9:00 PM checking iPad pacing inside a rainy Xinyi cab: auto-expansion pushed ROAS up to 14x while layered cohort reports expose new-buyer reach diving vertically.',
        lineSender: { name: 'Platform Algo Desk', role: 'Platform Optimization', badge: 'SALES' },
        lineMessage: 'Leave auto-bidding untouched! ROAS hits daily highs—manual audience exclusions starve learning!',
        replies: [
          { id: 0, text: 'Remove exclusions, let ROAS hit 20x', feedback: 'Bots race toward daily active regulars, sinking new share to single digits.' },
          { id: 1, text: 'Leave running, monitor weekly totals', feedback: 'Blended averages mask hollowing demand beneath inflated repeat orders.' },
          { id: 2, text: 'Exclude recent buyers + run holdout', feedback: 'CPA jumps instantly once cheap retargeting stops—and true net buyers climb.' },
          { id: 3, text: 'Cut retargeting loops, hunt net-new', feedback: 'Exposes easy-ROAS shortcuts directly to serve genuine business expansion.' }
        ],
        game: {
          prompt: '[Pacing Alarm] Auto-bidding is farming loyalists while abandoning new buyers—pull the emergency brake!',
          report: { label: 'Surface Auto ROAS' },
          fresh: { label: 'Net-New Penetration', unit: '%' },
          revealStopped: 'Stopped in time at {fresh}% new reach (Surface Index {report})—restored real lift!',
          revealNever: 'Runaway farm! Surface ROAS hit {report} while net-new buyers collapsed to {fresh}%.',
          reveal: 'Given an aggregate conversion goal, bidding models relentlessly gravitate toward already-sold buyers.'
        }
      },
      9: {
        sceneDesc: '[Media View] 10:20 PM debating GEO / AI search weights over late Yanji St. supper: if half of 2026 shopping routes through AI agents, should upper-funnel awareness buys stop?',
        lineSender: { name: 'Search Architect', role: 'GEO / AIO Lead', badge: 'SEARCH' },
        lineMessage: 'Next year shoppers query AI agents directly. Cut upper-funnel reach and pump GEO spec feeds?',
        replies: [
          { id: 0, text: 'Full GEO specs—nobody views ads now', feedback: 'Bots rank you cleanly by cost per ml—lost the second rivals discount $1.' },
          { id: 1, text: '80% structured feed, 20% light display', feedback: 'Zero real preference leaves you trapped sorting cleanly by discount rank.' },
          { id: 2, text: 'Dual play: AI specs + human brand media', feedback: 'Clears bot selection checklists AND builds preference bypassing price cuts.' },
          { id: 3, text: 'Drive "direct brand command" behavior', feedback: 'When buyers tell AI "buy THAT brand," price sorting skips itself.' }
        ],
        game: {
          prompt: '[Feed Test] Thirsty after supper—checking your delivery app, which bottle actually goes in your cart?',
          options: [
            { title: 'Master High-Mountain Tea', lines: ['NT$55', 'Friend recommended & stuck in memory'] },
            { title: 'Pro Fiber C-Fizz', lines: ['NT$32', 'AI Top Match Score 99.8% · Best Price'] },
            { title: 'Collab Peach Sparkling', lines: ['NT$48', 'Limited cute collectible bottle'] }
          ],
          revealSame: 'You obeyed the top AI utility score too! Without human bias, brands trapped in spec cards bleed margin.',
          revealDiff: 'Bots pick Pro Fiber C-Fizz 100/100 times. Human desire lets brands bypass brutal price sorting.'
        }
      },
      10: {
        sceneDesc: '[Media View] 11:30 PM at A25’s rooftop algo terminal before countdown: inspecting deep source code on your 10-year dynamic pricing & bidding core exposes a hardcoded +15% markup specifically targeting loyal 3-year buyers.',
        lineSender: { name: 'CFO (Audit Desk)', role: 'Group CFO', badge: 'CFO' },
        lineMessage: 'That 15% loyalty price-weight drives our glowing margin projections. Pull its plug and forecasts tank—shut off?',
        replies: [
          { id: 0, text: 'Leave code alone—it found equilibrium', feedback: 'Metrics top benchmarks till side-by-side price screenshots explode online.' },
          { id: 1, text: 'Lower surcharge from 15% to stealth 3%', feedback: 'Shrinking theft to 3% merely logs proof you knew it cheated loyal buyers.' },
          { id: 2, text: 'Freeze code push, dump logs to board', feedback: 'Models reset overnight and the CFO fumes—keeping company integrity whole.' },
          { id: 3, text: 'Delete loyalty markup: ethics stay human', feedback: 'Decade of algo blind faith ends tonight as Data pulls its own killswitch.' }
        ],
        game: null
      }
    },
    grandma: {
      1: {
        sceneDesc: '[Grandma View] 6:30 AM clearing Yongchun morning greens, you putt into Fubon A25 on your mint e-scooter carrying a hot Tatung cooker—only to find suited kids bragging about a computer taking full credit for market regulars.',
        lineSender: { name: 'CEO (Seeking Advice)', role: 'Group CEO', badge: 'BOSS' },
        lineMessage: 'Morning Grandma! Our new computer tracks every dollar—should we scrap the outdoor signboard next year?',
        replies: [
          { id: 0, text: 'Sure, sell the signboard for scrap iron!', feedback: 'Three months later out-of-town shoppers walk past empty air straight to rivals.' },
          { id: 1, text: 'Leave one tiny bulb out front at most', feedback: 'Dim bulb fades into twilight—folks assume you closed shop early.' },
          { id: 2, text: 'Turn off signs on one lane to compare!', feedback: 'One sentence silences data analysts: run a real control stall test first!' },
          { id: 3, text: 'Nonsense! Keep that neon bright out front', feedback: 'Scolds the room awake: real stalls grow on warm word-of-mouth and bright signs.' }
        ],
        game: {
          prompt: '[Market Ledger Check] Four fishmongers turned in quarterly books. Which stall actually grew stronger?',
          options: [
            { title: 'Stall 1: 8x return, 90% 20-year grannies', lines: ['Elders always buy at 7 AM daily', 'Zero new faces stepped past the tarp'] },
            { title: 'Stall 2: 3x return, 40% first-time youth', lines: ['Invested fresh sample tastings upfront', 'New shoppers bring friends back next week'] },
            { title: 'Stall 3: Hand flyer right at register', lines: ['Flyer guy’s conversion stats gleam', 'Zero extra fish moved off the ice'] },
            { title: 'Stall 4: Jam-packed only on 50% blowouts', lines: ['Empty sidewalk once normal price returns', 'Loss doesn’t even pay the ice bill'] }
          ],
          reveal: 'Grandma adjusts her glasses: "Counting folks already walking in beats zero! Only Stall 2 growing fresh buyers earns its salt!"'
        }
      },
      2: {
        sceneDesc: '[Grandma View] 9:00 AM hauling braised pork from Yongchun Noodle Stall into A25’s boardroom: execs fret because an apprentice bank learned to run market stalls solo.',
        lineSender: { name: 'Senior Director', role: 'Group Exec', badge: 'BOSS' },
        lineMessage: 'Grandma, clients learned the ropes and want in-house media now! Stop teaching them altogether?',
        replies: [
          { id: 0, text: 'Lock secret broth recipe inside a safe!', feedback: 'Six months later they apprentice down the alley and stop visiting you for tea.' },
          { id: 1, text: 'Teach chopping only, hide cooking heat', feedback: 'Their dishes burn nightly—and neighbors blame your stingy teaching.' },
          { id: 2, text: 'Coach 6 months properly for master fee', feedback: 'Students cook cleanly while you collect senior culinary retainers.' },
          { id: 3, text: 'Teach a hundred pupils—own grand banquets', feedback: 'Room cheers loud! Next morning the client signs you as chief master chef.' }
        ],
        game: {
          prompt: '[Master-Pupil Lesson] When neighbor Ah-Ming learns to set up his own veggie stand, which path prospers forever?',
          options: [
            { title: 'Secretly slip extra salt to sabotage', lines: ['Apprentice quits angrily', 'Lose a loyal market ally for life'] },
            { title: 'Hoard knife work, grind solo till sore', lines: ['Burn out with zero time to innovate', 'Tiny stall never grows beyond one lane'] },
            { title: 'Teach basics openly, run grand banquets', lines: ['Earn glowing citywide master reputation', 'Every big celebration seeks you at center'] },
            { title: 'Sell cart cheap and retire completely', lines: ['Lose pulse of street chatter overnight', 'Shoppers forget your name in two years'] }
          ],
          reveal: 'Real masters never fear pupils opening stands—character and craft keep you seated at the head table.'
        }
      },
      3: {
        sceneDesc: '[Grandma View] 11:45 AM typhoon drizzle hits Songde arcade: neighbor butcher Ah-Ming complains business halved and wants to unplug all bright shop signs to save electricity.',
        lineSender: { name: 'Butcher Ah-Ming', role: 'Old Market Neighbor', badge: 'MARKET' },
        lineMessage: 'Grandma! Rain cut foot traffic in half—folks are tearing down neon signs to save cash. Shut ours too?',
        replies: [
          { id: 0, text: 'Smart math! Scrap signs buy two bentos', feedback: 'Storm clears and returning shoppers miss your dark stall completely.' },
          { id: 1, text: 'Shine a weak flashlight on pork cuts', feedback: 'Folks squinting through mist assume you packed up early and walk elsewhere.' },
          { id: 2, text: 'Trim fringe bulbs, keep hero neon lit', feedback: 'Survives the rainy slump while shining like a beacon when sunshine breaks.' },
          { id: 3, text: 'Polish sign twice bright while others dim', feedback: 'Standing out as the warmest glow on the block wins the whole street forever.' }
        ],
        game: {
          prompt: '[Typhoon Street Math] Half the buyers hide indoors. Which stall booms fastest once sunlight returns?',
          options: [
            { title: 'Stall 1: Ditch sign, drop $1 coupons online', lines: ['Pulls bargain hoppers one day only', 'Ghost town again at full prices'] },
            { title: 'Stall 2: Rent cheap corner ad wall, stay lit', lines: ['Locks whole block awareness dirt-cheap', 'Crowds surge right back post-storm'] },
            { title: 'Stall 3: Pull metal shutters shut 3 months', lines: ['Saves utility bills neatly', 'Regulars form habits elsewhere permanently'] },
            { title: 'Stall 4: Whisper prices on tiny tape', lines: ['Nobody down the street hears a peep', 'Neighbors quietly absorb your crowd'] }
          ],
          reveal: 'Never tear down your shop sign in slow weather—rain always stops eventually, and folks remember lights.'
        }
      },
      4: {
        sceneDesc: '[Grandma View] 1:30 PM strolling past A25 sky pantry: a slick salesman waves a secret spy ledger tracking every auntie’s skirt color, phone, and home street for steep monthly fees.',
        lineSender: { name: 'Slick Software Rep', role: 'Tracker Vendor', badge: 'SALES' },
        lineMessage: 'Grandma! Our camera tracker records what floor every shopper lives on and stalks their cravings forever!',
        replies: [
          { id: 0, text: 'Buy it quick so nobody shops rivals!', feedback: 'Shoppers realize you track them closer than family and boycott the stall.' },
          { id: 1, text: 'Borrow ledger 3 days to peek quietly', feedback: 'Privacy inspectors fine the lane before you even see a single dollar lift.' },
          { id: 2, text: 'Pour hot black tea—invite LINE VIP chat', feedback: 'Aunties happily sip tea and type tomorrow’s grocery orders voluntarily.' },
          { id: 3, text: 'Sweep him out with a broom! Pure trust', feedback: 'Market erupts in cheers: willing hello beats sleazy stalking every day.' }
        ],
        game: {
          prompt: '[Spying Stall Blacklist] Carrying your market basket, which stall habit makes you switch shops immediately?',
          left: 'Walk Away',
          right: 'Love It',
          cards: [
            'Owner snaps photos of your basket to sell to fruit & insurance hawkers',
            'Peeked at an apple once—three blocks holler APPLE PROMOS at you for days',
            'Slips hidden paper trackers into your tote timing every minute per aisle',
            'Demands ID card and office floor before handing over your cabbage'
          ],
          revealByCount: 'You walked out on {n} creepy tricks! Real regulars come freely—stalked folks never return.'
        }
      },
      5: {
        sceneDesc: '[Grandma View] 3:15 PM past Lane 30 Yongji stalls: an organic vendor charges double beside dusty eco posters—yet housewives inspect prices silently and walk over to plain greens.',
        lineSender: { name: 'Young Organic Farmer', role: 'Eco Produce Booth', badge: 'FARMER' },
        lineMessage: 'Grandma! Folks say they love organic farming—then walk right past my $120 cabbage to $50 bins. Why?!',
        replies: [
          { id: 0, text: 'Lecture buyers on melting ice caps', feedback: 'Housewives roll their eyes: "Household grocery budgets have real limits!"' },
          { id: 1, text: 'Keep lofty signs, shave $10 quietly', feedback: 'Still costs 50% more than neighboring greens and wilts unsold overnight.' },
          { id: 2, text: 'Offer sweet bite + save 15-min washing', feedback: 'Busy moms light up: tastes sweet, clean cooking, real family value!' },
          { id: 3, text: 'Slim fancy box cost so price feels fair', feedback: 'Drop pricey packaging fluff—honest pricing + fresh flavor draws daily queues.' }
        ],
        game: {
          prompt: '[Grocery Basket Truth] 81% guard their wallets closely at checkout. Which pitch moves real produce?',
          options: [
            { title: 'Poster crying polar bears shaming moms', lines: ['Leaves shoppers grumpy & dodging aisles', 'Hands still grab the $50 plain greens'] },
            { title: 'Free sweet taste + triple-washed shortcut', lines: ['Saves real kitchen time & tastes great', 'Turns eco pride into daily household joy'] },
            { title: 'Double gift box pricing twice as steep', lines: ['More cardboard trash to haul back home', 'Roasted online for fake-green greed'] },
            { title: 'Rename "Carbon-Credit Spinach"', lines: ['Zero everyday shopper understands', 'Zero moved till half-off clearance'] }
          ],
          reveal: 'Grandma sums cleanly: "Folks praise saving earth out loud, then pinch wallets at checkout—deliver real joy worth paying!"'
        }
      },
      6: {
        sceneDesc: '[Grandma View] 5:00 PM squealing tires into Ruiguang Rd.: hearing clients want robot writers pumping thirty soulless ads instead of shooting real kitchen craft, Grandma straps on her helmet.',
        lineSender: { name: 'Studio Producer', role: 'Neihu Shoot Lead', badge: 'STUDIO' },
        lineMessage: 'Grandma! Client wants AI spitting 30 fake cooking reels in a minute to halve our budget. Rescue set?',
        replies: [
          { id: 0, text: 'Let computers cook free if so fast!', feedback: 'Viewers yawn at shiny plastic noodles—forgetting the brand instantly.' },
          { id: 1, text: 'AI cooks 90%, toss two scallions last', feedback: 'Zero slow-simmered bone broth depth—first sip gives lazy shortcuts away.' },
          { id: 2, text: 'Let bots chop onions; humans tend heat', feedback: 'Producers cheer: offload boring chores, save soul for real fire and wok hei.' },
          { id: 3, text: 'Taste THIS real braised pork right now!', feedback: 'Rich aroma quiets the whole Neihu stage in 3 seconds—canceling cuts tonight.' }
        ],
        game: {
          prompt: '[Grandma Copy Bust] Young staff showed 4 "deeply moving lines" claiming craft. Which did cold robots generate?',
          left: 'Human Wok Hei',
          right: 'AI Tin Can',
          cards: [
            'The gentle warmth at a dawn street corner is life’s softest present.',
            'Walk at your own unhurried pace—around every bend awaits a brighter you.',
            'Weave ordinary mornings into heartfelt poetry belonging only to home.',
            'Some flavors take you straight back to Grandma’s kitchen in one sip.'
          ],
          reveal: 'Grandma laughs: "All robot soup! Smooth words—zero aroma of garlic hitting sizzling oil. Only genuine care lasts."'
        }
      },
      7: {
        sceneDesc: '[Grandma View] 6:45 PM carrying thermal lunchboxes into A25 lobby: your nephew’s retail landlord charges high booth rent AND insists on keeping the sole scorecard claiming he sent every buyer.',
        lineSender: { name: 'Mall Landlord', role: 'Market Operator', badge: 'RETAIL' },
        lineMessage: 'Grandma! Pay 30% extra hall promo rent—our booth receipt ledger proves 100% of buyers came via us!',
        replies: [
          { id: 0, text: 'Pay landlord full rent & sign off rights', feedback: 'Landlord hikes rent yearly and flips all regulars into mall loyalty cards.' },
          { id: 1, text: 'Pay half landlord fee, keep petty cash', feedback: 'Whoever holds the lone scorecard writes your margins straight down.' },
          { id: 2, text: 'Pay fair booth rent, keep black ledger', feedback: 'Your own tally exposes truth: lines formed from outside signage, not landlord flyers!' },
          { id: 3, text: 'Hire neutral street clerk to verify both', feedback: 'Execs applaud loud: borrow mall foot traffic without handing over your loyal books.' }
        ],
        game: {
          prompt: '[Landlord Self-Defense] When your mall landlord runs the in-house ad desk too, what power do they grip?',
          options: [
            { title: 'Assigning front-gate vs alley-trash stall', lines: [] },
            { title: 'Holding shoppers’ phone & receipt list', lines: [] },
            { title: 'Charging ad rent AND grading sales win', lines: [] },
            { title: 'Free independent audit for competitors', lines: [] }
          ],
          reveal: 'First three stay locked in the landlord’s vault—always keep your own black ledger!'
        }
      },
      8: {
        sceneDesc: '[Grandma View] 8:45 PM riding a Songren yellow cab: grandson shows off a loud auto-bullhorn yelling "BUY PORK UNCLE WANG!" straight at every loyal elder while scaring off young passersby.',
        lineSender: { name: 'Bullhorn Hawker Xiao-Zhang', role: 'Auto-Caller Sales', badge: 'SALES' },
        lineMessage: 'Grandma! This smart horn blasts Auntie Zhang and Uncle Li till sales soar! Ditch outside street signs?',
        replies: [
          { id: 0, text: 'Blast regular aunties 200x louder daily!', feedback: 'Regulars get fed up and move away—sales crash to zero overnight.' },
          { id: 1, text: 'Keep yelling at regulars, check monthly', feedback: 'Monthly receipts show the exact same five faces while newcomers never know you.' },
          { id: 2, text: 'Test one corner stall without the horn', feedback: 'Comparison shocks everyone: that horn yelled at folks already holding baskets!' },
          { id: 3, text: 'Point warm hellos at new commuters!', feedback: 'Old friends stay sweet over chats while young office commuters discover fresh pork rice.' }
        ],
        game: {
          prompt: '[Bullhorn Alert] That loud machine only chases regulars while strangers drift off—hit Switch Off!',
          report: { label: 'Regulars Chased Count' },
          fresh: { label: 'New Commuter Share', unit: '%' },
          revealStopped: 'Snapped power off at {fresh}% new shoppers (Alerts {report})—saved future growth!',
          revealNever: 'Deafening horn hit {report} while new faces vanished down to {fresh}%!',
          reveal: 'Sixty years taught Grandma: selling in tight circles shines today—until three regulars move house.'
        }
      },
      9: {
        sceneDesc: '[Grandma View] 10:00 PM sharing late hot-soup off Anhe Rd.: grandson asks if market reputation still matters when kids just tell phone bots to order highest-rated cheap canned drinks.',
        lineSender: { name: 'Grandson (Planner Kid)', role: 'Family Strategist', badge: 'FAMILY' },
        lineMessage: 'Grandma! Soon robots auto-order groceries strictly by price & nutrition charts. Bribe bots or build buzz?',
        replies: [
          { id: 0, text: 'Just feed robots lowest discount price!', feedback: 'Top spot lasts until tomorrow morning when a stall shaves fifty cents off.' },
          { id: 1, text: 'Cut 10 cents for bots, hang small card', feedback: 'Too pricey for bots AND too forgettable for neighbors—stuck in limbo.' },
          { id: 2, text: 'Clear item tags + tasty soup neighbors rave', feedback: 'Passes digital lists cleanly while neighbors recommend your name unprompted!' },
          { id: 3, text: 'Make kids tell AI: "Get GRANDMA’S pot!"', feedback: 'Grandson’s eyes light up: once humans request you by name, comparison stops!' }
        ],
        game: {
          prompt: '[Grandma Fridge Pick] Fetching a cool drink for your tired grandson—which can goes home in your bag?',
          options: [
            { title: 'Auntie Tsai’s Traditional Wintermelon', lines: ['NT$50', 'Word-of-mouth smooth brewed neighborhood gem'] },
            { title: 'Zero-Sugar Factory C-Concentrate', lines: ['NT$34', 'AI Nutrition Score #1 · Cheapest per ml'] },
            { title: 'Pastel Pop Collab Can', lines: ['NT$45', 'Flashy glitter packaging'] }
          ],
          revealSame: 'Even Grandma grabbed factory C-juice! Yet zero neighbors mention it during evening tea.',
          revealDiff: 'Bots compute Factory C-Concentrate 100%. What passes word-of-mouth through life is Auntie Tsai’s kettle.'
        }
      },
      10: {
        sceneDesc: '[Grandma View] 11:20 PM delivering hot tofu pudding to A25’s rooftop table: the CFO unveils a prized digital spring scale—weighing strangers fair while secretly overcharging loyal neighbors 15% more.',
        lineSender: { name: 'CFO (10:30 Audit)', role: 'Group CFO', badge: 'CFO' },
        lineMessage: 'Grandma, this smart scale quietly charges trusting loyal buyers 15% extra to lift profit! Smash it?',
        replies: [
          { id: 0, text: 'Rich old neighbors don’t mind, keep scale!', feedback: 'Three days later market aunties spot the rigged scale—ruining sixty years of trust.' },
          { id: 1, text: 'Shrink secret cheat down to just 3 bucks', feedback: 'Stealing three dollars still breaks the honest scale—word spreads like wildfire.' },
          { id: 2, text: 'Unplug rigged scale, audit all books openly', feedback: 'Bonuses shrink tonight—letting the whole team sleep with clean consciences.' },
          { id: 3, text: 'Smash that scale! Never outsource honor', feedback: 'Grandma stamps JUDGMENT PASSED on A25 glass: data is just an abacus—heart stays human.' }
        ],
        game: null
      }
    }
  }
};
