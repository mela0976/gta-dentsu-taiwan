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
          prompt: '[Search Log Anomaly] Branded Search claims 82% of orders with an 11-second click-to-checkout lag. Fix the attribution rule:',
          options: [
            { title: 'Rule A: Keep mixed, scale branded spend', lines: ['Glows at 12x surface ROAS', 'Overpays to harvest typing regulars'] },
            { title: 'Rule B: Credit 7-day display views all', lines: ['Assigns organic checkouts to banners', 'Masks true net growth completely'] },
            { title: 'Rule C: Optimize strictly to lowest CPC', lines: ['Floods low-intent clickbait traffic', 'Drops new buyer rate steadily'] },
            { title: 'Rule D: Split Brand vs Non-Brand + 15% Holdout', lines: ['Separates harvested intent from expansion', 'Measures true incremental lift per dollar'] }
          ],
          reveal: 'An 11-second click-to-order proves they came specifically for you (Rule D). Splitting Brand Search with a holdout reveals real customer growth.'
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
          prompt: '[In-House Governance Audit] When clients pull trading in-house without an architect, which 3 layers break first (multi):',
          options: [
            { title: 'Cross-platform frequency capping (one person hit 18x daily)', lines: [] },
            { title: 'Unified UTMs & deduplicated cross-channel attribution math', lines: [] },
            { title: 'Updating exec slide template color schemes every Monday', lines: [] },
            { title: 'Independent quarterly holdouts checking net-new algo lift', lines: [] }
          ],
          reveal: 'Capping fatigue, unifying attribution math, and running independent holdouts keep media leads anchored at the client’s architecture desk.'
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
          prompt: '[RTB Slump Split] Search CPCs tripled while prime brand video CPMs crashed 55%. What % goes to upper-funnel reach video?',
          unit: '%',
          reveal: '60%! Buying cheap upper-funnel reach via a 60% brand / 40% harvest split dominates rebound search demand later.'
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
          prompt: '[Post-Cookie Signal Recovery] Cookie deprecation dropped DSP match rates below 35%. How do you rebuild compliant scale?',
          options: [
            { title: 'Opt A: Rent shadowy cross-device fingerprint IDs', lines: ['Temporary match rate bounce', 'Severe PDPA fine & OS revocation risk'] },
            { title: 'Opt B: Link consented 1P LINE/CRM + CAPI + Context', lines: ['Privacy-safe signal precision', 'Accumulates permanent owned equity'] },
            { title: 'Opt C: Bid blind cheapest untargeted pop-ups', lines: ['Inflates raw impressions fast', 'Crashes qualified traffic & conversions'] },
            { title: 'Opt D: Narrow down solely to 3x repeat buyers', lines: ['Shrinks total audience pool monthly', 'Zero new-customer pipeline in 6 months'] }
          ],
          reveal: 'First-party consented seeds plus server-side CAPI and contextual media (Opt B) build privacy-proof durability without shady brokers.'
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
          prompt: '[Keyword Waste Triage] "ESG" & "Green" bids jumped 320% with 94% student research bounces. Fix the search account:',
          options: [
            { title: 'Fix A: Match 3x bid cap on broad "ESG"', lines: ['Burns 2 weeks budget in one afternoon', 'Zero checkout activity results'] },
            { title: 'Fix B: Negative "essay/definition" ➔ Shift utility', lines: ['Drops CPC by 60% immediately', 'Captures high-intent budget refill shoppers'] },
            { title: 'Fix C: Force 15s unskippable gaming pre-rolls', lines: ['Looks good on completion metrics', 'Sparks irritated player backlash'] },
            { title: 'Fix D: Turn off Search to run social sweepstakes', lines: ['Draws freebie-hunting accounts only', 'Zero real product demand captured'] }
          ],
          reveal: 'Smart media buyers don’t burn budget on textbook definitions—negative academic bloat and bid on real pocketbook utility (Fix B).'
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
          prompt: '[DCO Flatline Audit] All four automated ad-set headlines stalled identically at 1.2% CTR. Flag the synthetic filler bots wrote:',
          left: 'Human Craft',
          right: 'AI Filler',
          cards: [
            'More calm, less stress—start treating yourself gently starting today.',
            'Leave busy yesterday behind; let this quiet ritual guide your afternoon.',
            'Your dependable daily companion for every brighter step ahead.',
            'Some flavors take you straight back to Grandma’s kitchen in one sip.'
          ],
          reveal: 'All four bots! Flooding CPM auctions with uniform AI combinations pays media platforms—never builds distinct memory.'
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
          prompt: '[Clean Room Window Audit] RMN boasts 10x ROAS, yet raw Clean Room audit spots a "30-day view-through window." What is flawed?',
          options: [
            { title: 'Flaw A: 30 days is too brief—stretch it to 90 days', lines: ['Doubles phantom credit inflation', 'Hides zero true marginal return'] },
            { title: 'Flaw B: 1s passive app thumb-scroll claims 30d restocks', lines: ['Captures routine grocery habits as paid lift', 'Requires 1-day click + holdout baseline'] },
            { title: 'Flaw C: Dashboard lacked colorful stacked bar graphics', lines: ['Ignores broken attribution logic', 'Distracts leadership with pretty UI'] },
            { title: 'Flaw D: Push 100% DTC members to buy retail vouchers', lines: ['Surrenders first-party relationships', 'Turns brand into pure wholesaler'] }
          ],
          reveal: 'A 30-day view-through window lets retailers take credit every time regular shoppers open their app (Flaw B). Audit with 1-day clicks + holdouts!'
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
          prompt: '[PMax & Algo Guardrails] Automated bidding is farming loyal buyers while starving acquisition. Configure which 3 controls (multi):',
          options: [
            { title: 'Upload 90-day past buyers as hard exclusion lists on prospecting', lines: [] },
            { title: 'Switch bidding value rules to favor net New-Customer Acquisition', lines: [] },
            { title: 'Lift all caps & exclusions to chase the lowest aggregate CPA', lines: [] },
            { title: 'Isolate navigational Brand Search and lock weekly frequency caps', lines: [] }
          ],
          reveal: 'Algorithms default to the easiest repeat orders unless you block past buyers, weight new prospects, and isolate brand search.'
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
          prompt: '[2026 GEO + Brand Split] As AI shopping assistants scrape spec feeds before recommending drinks, how do you split media?',
          options: [
            { title: 'Split A: 100% price-feed & rebate aggregators', lines: ['Turns SKU into commodity row', 'Replaced the instant rivals cut $1'] },
            { title: 'Split B: 30% clean Schema + trusted reviews / 70% brand video', lines: ['Passes AI candidate retrieval filters', 'Drives buyers to name-drop brand to AI'] },
            { title: 'Split C: Block crawlers, demand manual homepage search', lines: ['Drops invisible across half of buyer journeys', 'Handing discovery to agile rivals'] },
            { title: 'Split D: Lock entire annual buy inside one mall banner', lines: ['Zero independent brand demand built', 'Held hostage by single platform fees'] }
          ],
          reveal: 'Feed structured truth so AI agents can shortlist you—then win hearts with reach media so shoppers request your name outright (Split B).'
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
          prompt: '[Flyer Boy Bonus Dispute] The promo teen hands flyers to 20-year regulars paying at your stall register and demands $5 per receipt. Grandma’s rule:',
          options: [
            { title: 'Rule 1: Gorgeous tally! Pay full bonus at register', lines: ['Pays $5 commission per bowl', 'Zero actual new eaters arrived'] },
            { title: 'Rule 2: Scrap promos entirely, wait for old faces', lines: ['New condo families never spot your stall', 'Revenue fades as elders age'] },
            { title: 'Rule 3: Send him 2 blocks to MRT with toothpick tastings', lines: ['Tasting token proves real first-time reach', 'Queues fresh young buyers past the alley'] },
            { title: 'Rule 4: Holler 50% off into your own full line', lines: ['Converts full-price regulars to bargain hunters', 'Crushes stall daily profit'] }
          ],
          reveal: 'Grandma snaps cleanly: "Standing by the cash bowl isn’t bringing new customers—walk two blocks to the station and earn commission on fresh faces (Rule 3)!"'
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
          prompt: '[Apprentice Branch Rules] Apprentice Ah-Ming wants his own noodle shop 2 blocks away. How does Grandma govern both stalls?',
          options: [
            { title: 'Rule 1: Barring pork wholesalers from supplying him', lines: ['Triggers bitter alleyway price wars', 'Embarrasses the whole lineage'] },
            { title: 'Rule 2: Secretly omit key spices from his recipe note', lines: ['His broth tastes flat and ruins family pride', 'Customers mock the master’s stinginess'] },
            { title: 'Rule 3: Let him run daily lunch while supplying house spice packs & Grandma keeps 50-table temple banquets', lines: ['He expands daily foot traffic seamlessly', 'Grandma earns steady supply & flagship feasts'] },
            { title: 'Rule 4: Pull down iron shutters and quit market watch', lines: ['Ah-Ming rebrands two years later', 'Grandma’s heritage fades from the street'] }
          ],
          reveal: 'Real masters grow the pie by stepping up (Rule 3): apprentices serve daily bowls while Grandma supplies secret spice packs and owns grand banquets.'
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
          prompt: '[Typhoon Week Triage] Three straight rainy days cut foot traffic 50% as neighbors darken stalls. Grandma’s storm counter?',
          options: [
            { title: 'Move 1: Scrap the neon box, hand $2 clearance slips', lines: ['Attracts one-day bargain hunters', 'Regulars think shop closed once sunny'] },
            { title: 'Move 2: Shine 2x neon + simmer fragrant radish broth + pack dry family bento sets', lines: ['Warm soup scent pulls the whole rainy arcade', 'Floods full street once skies clear'] },
            { title: 'Move 3: Lock shutters for 3 slow rainy weeks', lines: ['Saves electricity neatly today', 'Regulars bond with corner competitors'] },
            { title: 'Move 4: Shine one tiny blue bulb with whisper tape', lines: ['Passing scooters never spot open doors', 'Sales slide silently toward zero'] }
          ],
          reveal: 'While timid stalls pull shutters dark, warm radish broth and a bright neon corner lock the entire neighborhood’s heart (Move 2)!'
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
          prompt: '[Zero-Spy Regulars Club] Zero street cameras or creeping allowed—how does Grandma gather 500 happy daily pre-orders?',
          options: [
            { title: 'Trick 1: Buy neighbor scooter plate lists secretly', lines: ['Creeps shoppers out before checkout', 'Whole apartment block boycotts the stall'] },
            { title: 'Trick 2: Demand national ID cards before handing change', lines: ['Queues jam and shoppers yell angrily', 'Empty counter the very next dawn'] },
            { title: 'Trick 3: Have grandson log auntie shoes & bus routes', lines: ['Weird habit creeping customers out', 'Produces zero tomorrow soup orders'] },
            { title: 'Trick 4: Serve free winter-melon tea + QR for "Reserve tomorrow’s fresh catch first!"', lines: ['Warm tea earns joyful willing opt-in', '500 neighbors tap +1 daily by choice'] }
          ],
          reveal: 'Warm hospitality beats creepy ledgers every day: one cup of tea and fresh-fish pre-order perk (Trick 4) builds pure willing loyalty!'
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
          prompt: '[4 PM Cabbage Clear-Out] Young farmer Ah-Hao’s NT$120 organic heads sit untouched all afternoon. How does Grandma clear his baskets?',
          options: [
            { title: 'Fix 1: Slice sweet raw hearts for free bites + pre-washed 3-dish dinner packs saving 20 min!', lines: ['Tastes crisp sweetness AND cuts mom kitchen prep', 'Entire basket clears out by 4:30 PM'] },
            { title: 'Fix 2: Grab bullhorn scolding passersby about melting polar ice', lines: ['Moms shrug silently inside tight budgets', 'Shoppers steer clear of the booth'] },
            { title: 'Fix 3: Double gold cardboard wrapping & hike to NT$150', lines: ['More household box trash at higher cost', 'Roasted online for greedy packaging'] },
            { title: 'Fix 4: Shave NT$10 at closing with identical lecture card', lines: ['Still double neighboring bins without clarity', 'Wilts unsold in crates overnight'] }
          ],
          reveal: 'Grandma shows Ah-Hao the secret (Fix 1): busy moms don’t buy slogans—they gladly pay when it tastes sweet and saves 20 minutes at the sink!'
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
          prompt: '[Delivery App Description Check] Young staff let AI generate four poetic stall bios for Grandma’s braised pork. Flag zero-wok-hei fluff:',
          left: 'True Wok Hei',
          right: 'Plastic AI',
          cards: [
            'The gentle warmth at a dawn street corner celebrates tired souls on the move.',
            'Savor unhurried layers of tender harmony honoring evening family rituals.',
            'Weaving curated spice symphonies tenderly guarding your cherished supper.',
            'Some flavors take you straight back to Grandma’s kitchen in one sip.'
          ],
          reveal: 'Grandma laughs hard: "All flowery hot air! Not a mention of crisp fried shallots or five-hour bone broth—folks eat aroma, not adjectives!"'
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
          prompt: '[Black-Ledger Mall Audit] Your mall landlord charges a 25% "Elevator Poster Levy" claiming 100% footfall credit. How does Grandma audit it?',
          options: [
            { title: 'Move 1: Praise clean receipts & buy 3 extra lobby frames', lines: ['Landlord jacks rent every renewal', 'All regulars turn into mall points members'] },
            { title: 'Move 2: Rip lease up & retreat into dark dead-end alley', lines: ['Cuts off prime noon worker footfall', 'Handicaps natural neighborhood discovery'] },
            { title: 'Move 3: Match black-ledger receipts during 2 broken-poster weeks + street soup stamp cards', lines: ['Proves queues stood long even with dead posters', 'Tears holes straight through inflated landlord bills'] },
            { title: 'Move 4: Whisper 70% discount flyers beside the mall lifts', lines: ['Draws mall security violation warnings', 'Devalues craft & margins at once'] }
          ],
          reveal: 'Nothing beats an honest black ledger (Move 3): comparing broken-poster weeks against outside soup cards busts self-grading landlords immediately!'
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
          prompt: '[110dB Bullhorn Rewire] That smart horn blasts 110dB right when loyal Auntie Zhang steps close while scaring away office commuters. Rewire?',
          options: [
            { title: 'Tune A: Crank horn 3x louder 24/7 past Auntie’s path', lines: ['Fed-up regulars move two alleys away', 'Next month stall receipts hit zero'] },
            { title: 'Tune B: Ignore who walks in—just tally total coins monthly', lines: ['Coin jars stay filled by five aging faces', 'Three hundred new office workers walk past unknowing'] },
            { title: 'Tune C: Tear off menus & signs—keep yelling at register', lines: ['Strangers have zero clue what is cooking', 'Nobody new crosses the threshold'] },
            { title: 'Tune D: Unplug screeching horn! Roll steaming pot & signage out to the corner for commuters; pour quiet tea for regulars', lines: ['Old pals relax over unhurried tea', 'Curious commuters follow savory steam straight to the pot'] }
          ],
          reveal: 'Grandma unplugs that screeching horn cleanly (Tune D): regular aunties already show up daily—bring warm aroma and signs out to meet newcomers!'
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
          prompt: '[Defeat 38% AI Priority Fee] Delivery reps demand 38% commission to place Grandma on top of ranked lists. How do offices still order from you?',
          options: [
            { title: 'Move 1: Refuse the 38% extortion! Keep transparent menus online, pack thick-cut belly & house pickled greens that spark office group-orders by name', lines: ['Protects honest margins from toll hikes', 'Whole office floors shout "Order Grandma on Hulin St!" daily'] },
            { title: 'Move 2: Halve pork cuts & hike NT$30 to buy #1 bot slot', lines: ['Rises to top row for three days', 'Angry regulars drop 1-star skimpy-meat reviews forever'] },
            { title: 'Move 3: Scrub menus offline—serve only personal pals', lines: ['New office neighbors search blindly with zero results', 'Misses lucrative group lunch orders'] },
            { title: 'Move 4: Stuff 20 bot tags per item using microwave packs', lines: ['First bite exposes heat-lamp plastic taste', 'Zero repeat group buyers next week'] }
          ],
          reveal: 'Grandma taps her ladle confidently (Move 1): win real taste buds with thick-cut pork and pickled greens so whole floors chant your name past any algorithm!'
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
