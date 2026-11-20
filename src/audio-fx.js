// Web Audio API 多軌 GTA 台北車載電台配樂合成器 ＋ 全角色台灣語音播報引擎（零外部音訊依賴）

export const RADIO_STATIONS = [
  {
    id: 'synthwave',
    name: 'FM 101.7 信義霓虹 Synthwave',
    short: 'FM 101.7 信義霓虹',
    tempoMs: 195,
    bass: [110, 110, 130.81, 146.83, 164.81, 146.83, 130.81, 98],
    lead: [440, 0, 523.25, 659.25, 587.33, 0, 523.25, 392.0],
    pad: [220, 261.63, 329.63]
  },
  {
    id: 'lofi',
    name: 'FM 88.6 市民大道 Lo-Fi 爵士',
    short: 'FM 88.6 市民爵士',
    tempoMs: 260,
    bass: [130.81, 0, 146.83, 164.81, 110, 0, 123.47, 98],
    lead: [392.0, 493.88, 0, 587.33, 329.63, 0, 440.0, 392.0],
    pad: [261.63, 329.63, 392.0, 493.88]
  },
  {
    id: 'cyber',
    name: 'FM 99.9 松仁極速 Cyber-Pulse',
    short: 'FM 99.9 松仁極速',
    tempoMs: 155,
    bass: [98, 98, 146.83, 98, 130.81, 130.81, 164.81, 116.54],
    lead: [587.33, 659.25, 783.99, 659.25, 523.25, 587.33, 659.25, 493.88],
    pad: [196, 293.66, 392.0]
  }
];

const VOICE_PROFILES = {
  narrator: { rate: 1.03, pitch: 0.98, volume: 1.0 },
  boss: { rate: 1.12, pitch: 0.88, volume: 1.0 },
  lisa: { rate: 1.13, pitch: 1.18, volume: 1.0 },
  cindy: { rate: 1.02, pitch: 1.06, volume: 1.0 },
  grandma: { rate: 0.92, pitch: 0.84, volume: 1.0 },
  fsd: { rate: 1.08, pitch: 1.08, volume: 1.0 }
};

export const BGM_MIX_LEVELS = {
  normal: 0.14,
  speaking: 0.022,
  cutscene: 0.008
};

export const BGM_FILTER_HZ = {
  normal: 2100,
  speaking: 580,
  cutscene: 420
};

export const normalizeVoiceKey = (text) =>
  String(text || '')
    .replace(/\uFE0F/g, '')
    .replace(/[📞🔊👵🍲📩⚡🎯🎬🛵🚗⭐🔥🧠🎙☎\[\]【】]/g, '')
    .trim()
    .replace(/[「」『』""“”''‘’（）()，。！？、：；…—\-·\s]/g, '');

export const normalizeGrandmaVoiceKey = (text) =>
  normalizeVoiceKey(
    String(text || '')
      .replace(/\uFE0F/g, '')
      .replace(/[📞🔊👵🍲📩⚡🎯🎬🛵🚗⭐🔥🧠🎙☎\[\]【】]/g, '')
      .trim()
      .replace(/^阿嬤說[:：]?/, '')
  );

export const GRANDMA_VOICE_CLIPS = {
  '做生意跟煮飯一樣火候到了客人自己會來': './public/audio/grandma/quote.mp3',
  '你們這些少年仔報表看得比吃飯還認真肚子都沒在顧先吃飯數字不會跑掉啦': './public/audio/grandma/rescue_0.mp3',
  '什麼歸因阿嬤買菜只看一件事這攤的菜我下禮拜還想不想再來': './public/audio/grandma/rescue_1.mp3',
  '免費的最貴這個阿嬤在菜市場六十年了你那個0.5秒的曝光連蔥都送不到一把': './public/audio/grandma/rescue_2.mp3',
  'AI寫的文案喔很會講但是沒有鍋氣啦人家吃一口就知道有沒有用心': './public/audio/grandma/rescue_3.mp3',
  '老闆講什麼你都說好那是跟班講出你的判斷再被罵那才是顧問來吃肉': './public/audio/grandma/rescue_4.mp3',
  '老主顧本來就會來你還跟人家說是你吆喝來的這樣算帳菜攤早就倒了': './public/audio/grandma/ch1_quip.mp3',
  '師傅怕徒弟徒弟就去隔壁拜別人當師傅真的有本事教出一百個徒弟你還是師傅': './public/audio/grandma/ch2_quip.mp3',
  '景氣差菜攤也不能把招牌拆下來賣廢鐵生意回來的時候客人是看招牌找路的': './public/audio/grandma/ch3_quip.mp3',
  '客人自己說老闆我下次還來比你偷偷記他住哪裡可靠一百倍': './public/audio/grandma/ch4_quip.mp3',
  '嘴巴說要吃有機結帳還是挑最便宜的那一把青菜你要賣有機就要讓人覺得值得': './public/audio/grandma/ch5_quip.mp3',
  '機器煮飯很快但客人記得的是那碗飯有沒有人的味道多煮十鍋也比不上一碗讓人想再來的': './public/audio/grandma/ch6_quip.mp3',
  '房東又是收租的又幫你算生意好不好這樣的帳你不能全信要自己拿個小本子記': './public/audio/grandma/ch7_quip.mp3',
  '攤位只賣給熟客生意數字很好看但哪天熟客搬家你就沒人買了要常常叫賣給路過的新面孔': './public/audio/grandma/ch8_quip.mp3',
  '客人問哪一攤的魚好鄰居講你的名字比你拿喇叭喊一百次還有用這個叫口碑': './public/audio/grandma/ch9_quip.mp3',
  '秤子不準是老闆的責任不是秤子的責任判斷這件事從來沒有辦法外包給別人': './public/audio/grandma/ch10_quip.mp3',
  '少年仔早餐有吃嗎冰奶不算吐司也不算要吃飯啦': './public/audio/grandma/ch1_call.mp3',
  '開會不要一直看手機人家講話要看著眼睛這樣才有禮貌': './public/audio/grandma/ch2_call.mp3',
  '外面下雨雞腿便當不要邊走邊吃會滴到襯衫晚上還要見客戶': './public/audio/grandma/ch3_call.mp3',
  '那個推銷的講話太快一直笑的人要小心簽名之前先回來問阿嬤': './public/audio/grandma/ch4_call.mp3',
  '雞排不要一次吃那麼多啦會上火珍奶也要少糖阿嬤看你都沒在顧身體': './public/audio/grandma/ch5_call.mp3',
  '喂你們是不是在拍什麼有些味道一喝就回到阿嬤家的廚房那句是誰寫的阿嬤現在騎電動車過去你們先不要亂砍預算等我帶鍋子到': './public/audio/grandma/ch6_call.mp3',
  '晚餐不要又叫外送阿嬤在電鍋裡有留一份你下班回來記得吃': './public/audio/grandma/ch7_call.mp3',
  '這麼晚還在外面坐計程車記得繫安全帶到了要傳訊息跟阿嬤說': './public/audio/grandma/ch8_call.mp3',
  '熱炒吃太鹹回家記得喝水阿嬤有煮綠豆湯明天早上熱一下': './public/audio/grandma/ch9_call.mp3',
  '決定好了就去做不要想太久不管結果怎樣回家阿嬤的電鍋都還是熱的': './public/audio/grandma/ch10_call.mp3',
  '賣菜的最清楚天天來買的老主顧你站在攤位前面喊一聲他也會買': './public/audio/grandma/ch1_clue.mp3',
  '徒弟學會了就出去開店那你就當師傅開班收學費還能抽成': './public/audio/grandma/ch2_clue.mp3',
  '生意難做的時候更不能關門招牌熄了客人下次就不認得路了': './public/audio/grandma/ch3_clue.mp3',
  '客人還沒開口你就先跟蹤人家回家這種生意菜市場叫做討人厭': './public/audio/grandma/ch4_clue.mp3',
  '嘴巴說愛護地球結帳還是挑便宜的這是人之常情你不要罵人家': './public/audio/grandma/ch5_clue.mp3',
  '機器煮的飯可以吃但客人記得的是阿嬤的味道': './public/audio/grandma/ch6_clue.mp3',
  '又當老闆又當評審的攤位你的菜怎麼賣得贏他': './public/audio/grandma/ch7_clue.mp3',
  '一直只賣給熟客生意看起來很好但三年後就沒有新朋友了': './public/audio/grandma/ch8_clue.mp3',
  '客人問鄰居哪一攤好鄰居講你的名字這比貼多少海報都有用': './public/audio/grandma/ch9_clue.mp3',
  '對老主顧多收錢阿嬤這輩子沒這樣做過你自己決定不要推給機器': './public/audio/grandma/ch10_clue.mp3'
};

export const CHARACTER_VOICE_CLIPS = {
  'boss:新的歸因工具上線了以後每塊錢都算得出來下一季怎麼投': './public/audio/voices/ch1_line.mp3',
  'boss:客戶想把投放收回去自己做我們教不教': './public/audio/voices/ch2_line.mp3',
  'boss:疫情預算砍半剩下的錢怎麼分': './public/audio/voices/ch3_line.mp3',
  'boss:追蹤工具快沒了要不要買我們的方案把每個人重新認出來': './public/audio/voices/ch4_line.mp3',
  'boss:大家都在做永續宣告我們也發一篇': './public/audio/voices/ch5_line.mp3',
  'boss:AI可以做十倍素材製作費砍一半可以吧': './public/audio/voices/ch6_line.mp3',
  'boss:通路的廣告平台能從曝光追到結帳數字超乾淨品牌預算轉過去': './public/audio/voices/ch7_line.mp3',
  'boss:開自動優化吧讓AI自己打仗人工調只會拖慢它': './public/audio/voices/ch8_line.mp3',
  'boss:現在大家叫AI幫忙挑東西我們要先讓AI看見還是先讓人記得': './public/audio/voices/ch9_line.mp3',
  'boss:那台讓報表漂亮了十年的自動引擎被發現對某些客人定比較高的價關不關': './public/audio/voices/ch10_line.mp3',
  'lisa:最後點擊我本來就要買那個牌子啊廣告只是剛好在我結帳前出現': './public/audio/voices/ch1_lisa.mp3',
  'lisa:如果廠商怕被我取代而藏一手我會直接換掉他我又不是沒有選擇': './public/audio/voices/ch2_lisa.mp3',
  'lisa:我下單前一定會先搜尋常出現在我腦中的牌子我才會點進去': './public/audio/voices/ch3_lisa.mp3',
  'lisa:我自己都會按拒絕我憑什麼要幫你們被追蹤': './public/audio/voices/ch4_lisa.mp3',
  'lisa:我當然支持環保但同樣的東西貴一點我還是會去比價這很正常吧': './public/audio/voices/ch5_lisa.mp3',
  'lisa:我分不出來是不是AI寫的我只在乎有沒有講中我現在的狀態': './public/audio/voices/ch6_lisa.mp3',
  'lisa:我在那個購物站買東西廣告有沒有看到都沒差反正我都會在裡面買': './public/audio/voices/ch7_lisa.mp3',
  'lisa:我如果被廣告跟了三天我反而會覺得這牌子有點煩想換掉': './public/audio/voices/ch8_lisa.mp3',
  'lisa:AI推薦我就會去PTTDcard查有沒有人踩雷沒口碑的我不買': './public/audio/voices/ch9_lisa.mp3',
  'lisa:如果我發現我是被多收錢的那一群我會直接截圖丟到PTT然後永遠不再回來': './public/audio/voices/ch10_lisa.mp3',
  'cindy:我沒空看廣告習慣買哪牌就買哪牌你們不要算成是自己的功勞': './public/audio/voices/ch1_cindy.mp3',
  'cindy:我只想要有人可以直接問不要每次都排隊等你們排程': './public/audio/voices/ch2_cindy.mp3',
  'cindy:疫情期間我都買熟悉的牌子沒時間研究新的出錯代價太高': './public/audio/voices/ch3_cindy.mp3',
  'cindy:你問我我會給不要偷看會讓我很不舒服': './public/audio/voices/ch4_cindy.mp3',
  'cindy:說我愛地球沒問題但小孩的奶粉我只看價格和成分不看標語': './public/audio/voices/ch5_cindy.mp3',
  'cindy:看起來都差不多我就隨手滑掉了有什麼好記的': './public/audio/voices/ch6_cindy.mp3',
  'cindy:我只記得是在那裡買的不太記得是哪個牌子反正順手就買了': './public/audio/voices/ch7_cindy.mp3',
  'cindy:我根本沒看過這個牌子怎麼可能知道它好不好': './public/audio/voices/ch8_cindy.mp3',
  'cindy:我會請AI幫我挑但如果朋友說她用過覺得好我會直接買朋友推的': './public/audio/voices/ch9_cindy.mp3',
  'cindy:我只要知道牌子有沒有把我當自己人這種事被爆出來我一定退會員': './public/audio/voices/ch10_cindy.mp3',
  'narrator:報表漂亮不等於生意變大': './public/audio/voices/ch1_takeaway.mp3',
  'narrator:典範花了五年董事會只給你一季': './public/audio/voices/ch2_takeaway.mp3',
  'narrator:量得到的不一定是最有用的': './public/audio/voices/ch3_takeaway.mp3',
  'narrator:你自己也不想被追蹤': './public/audio/voices/ch4_takeaway.mp3',
  'narrator:說支持和願意付錢是兩回事': './public/audio/voices/ch5_takeaway.mp3',
  'narrator:內容不用錢之後稀缺的是被記得': './public/audio/voices/ch6_takeaway.mp3',
  'narrator:小心球員兼裁判': './public/audio/voices/ch7_takeaway.mp3',
  'narrator:演算法只放大你本來就打得到的人': './public/audio/voices/ch8_takeaway.mp3',
  'narrator:AI可以幫人買東西品牌要讓人想買': './public/audio/voices/ch9_takeaway.mp3',
  'narrator:十年前相信數據能取代判斷十年後的結論是判斷不能外包': './public/audio/voices/ch10_takeaway.mp3',
  'fsd:TeslaFSD已接管前方機車十八公尺車距鎖定沿松仁路前進': './public/audio/voices/fsd_on.mp3',
  'fsd:已切換回手動駕駛': './public/audio/voices/fsd_off.mp3',
  'boss:你們上季ROAS報告數字超美但品牌宣傳預算看不出直接轉換明年預算只簽看得到成效的那包好嗎': './public/audio/voices/role_account_ch1_line.mp3',
  'boss:明年我們自己養媒體團隊了你們還要跟我們簽顧問約嗎開個價吧': './public/audio/voices/role_account_ch2_line.mp3',
  'boss:總部剛通知我們Q3預算直接砍一半品牌檔期先全抽掉保促銷轉換吧': './public/audio/voices/role_account_ch3_line.mp3',
  'boss:這個全網ID追蹤外掛只要客戶加簽150萬受眾名單立刻回來獎金也算你們帳上簽嗎': './public/audio/voices/role_account_ch4_line.mp3',
  'boss:客戶想推貴20%的永續減碳版包裝要我們在提案寫保證賣爆這業績你要扛嗎': './public/audio/voices/role_account_ch5_line.mp3',
  'boss:我看友商整套改用AI產片製作費只要一半我們今年這筆製作合約直接對砍好嗎': './public/audio/voices/role_account_ch6_line.mp3',
  'boss:你們若把預算全簽進我們通路RMN聯名包年底結帳單數字絕對最漂亮進貨位置也能保第一排喔': './public/audio/voices/role_account_ch7_line.mp3',
  'boss:全自動投放跑兩週報表好看到老闆都想發獎金了要不要建議他直接把預算翻倍灌進去': './public/audio/voices/role_account_ch8_line.mp3',
  'boss:明年連企業採購都叫AI先比三家規格了我們該勸客戶搶AI推薦欄位還是繼續養品牌': './public/audio/voices/role_account_ch9_line.mp3',
  'boss:那台差別定價引擎替大客戶多賺了三千萬也讓我們抽佣破表下季合約要繼續打包它嗎': './public/audio/voices/role_account_ch10_line.mp3',
  'boss:老闆嫌品牌電影看不到最後點擊成效要把30秒好劇本剪成純折扣比價卡你讓嗎': './public/audio/voices/role_creative_ch1_line.mp3',
  'boss:客戶想自己成立內容部門要我們交出所有創意發想模板跟攝影規範教出去我們不會失業嗎': './public/audio/voices/role_creative_ch2_line.mp3',
  'boss:預算只剩一半客戶乾脆叫我們拿前年的庫存素材重剪配個折價語音就過一年真的要接嗎': './public/audio/voices/role_creative_ch3_line.mp3',
  'boss:互動官網只要加一道同意全網追蹤授權才能看彩蛋片客戶就能收集超多明細要加上去嗎': './public/audio/voices/role_creative_ch4_line.mp3',
  'boss:客戶這支ESG廣告腳本只想要模特兒在草地奔跑喊愛地球口號我們就順水推舟交稿嗎': './public/audio/voices/role_creative_ch5_line.mp3',
  'boss:AI一秒生出來這三十句廣告金句文筆都超工整客戶說以後文案全交AI我們只要當潤稿小弟能服氣嗎': './public/audio/voices/role_creative_ch6_line.mp3',
  'boss:通路商說進了他們RMN系統版面都要套公版黃紅特價框美感完全不給留白全部妥協嗎': './public/audio/voices/role_creative_ch7_line.mp3',
  'boss:演算法系統自動測試後把你那支品牌故事線全砍掉只保留會點購買的三秒白底價格閃燈版要喊停嗎': './public/audio/voices/role_creative_ch8_line.mp3',
  'boss:當2026的人們都叫AI照成分價格表幫挑飲料我們還需要把設計和品牌文化做這麼有靈魂嗎': './public/audio/voices/role_creative_ch9_line.mp3',
  'boss:高層想用漂亮的專享貴賓動態價介面包裝差別抬價引擎叫我們三天後出美編稿做不做': './public/audio/voices/role_creative_ch10_line.mp3',
  'boss:老闆看到報告寫歸因轉換八倍開心到不行要把品牌電視和戶外看板預算全砍來加碼這套工具我們拆穿嗎': './public/audio/voices/role_media_ch1_line.mp3',
  'boss:大客戶準備自己去媒體原廠開帳戶自操我們手上的媒體採購量一掉就斷炊了這堂課還要教嗎': './public/audio/voices/role_media_ch2_line.mp3',
  'boss:總部剛把下季預算全砍半所有競品也全躲進關鍵字與導購收割了我們排期還要留品牌版位嗎': './public/audio/voices/role_media_ch3_line.mp3',
  'boss:第三方Cookie快死透了我們這包跨裝置黑盒比對名單精準率九成五每月租只要二十萬匯入投放吧': './public/audio/voices/role_media_ch4_line.mp3',
  'boss:同業全部在狂買ESG相關頻道版位害單價漲了三倍我們還要跟進搶同一個議題關鍵字嗎': './public/audio/voices/role_media_ch5_line.mp3',
  'boss:AI幫系統一分鐘換了三十組圖片文案跑完全部點擊都黏在同一水平沒拉出贏家要把創意費砍半交給系統洗嗎': './public/audio/voices/role_media_ch6_line.mp3',
  'boss:我們平台內建站內曝光直結收銀結帳歸因報表保證數字漂亮零落差還不趕快把外部品牌廣告費全移進來': './public/audio/voices/role_media_ch7_line.mp3',
  'boss:放手讓全自動機器學習打仗吧現在ROAS天天破新高人工設排除受眾只會綁死機器賺錢': './public/audio/voices/role_media_ch8_line.mp3',
  'boss:明年用戶全問AI買哪個了我們乾脆把大曝光砍光預算全拿去搶AI搜尋推薦權重跟低價商品庫不就好了': './public/audio/voices/role_media_ch9_line.mp3',
  'boss:那段對老主顧加價15%的黑箱權重就是我們毛利漂亮的秘密下季媒體模型已經對齊這份帳本了關掉會整盤下修你關嗎': './public/audio/voices/role_media_ch10_line.mp3',
  'boss:阿嬤早安我們剛買新歸因報表能算出每塊錢功勞明年直接把市場門口大招牌拆掉省預算好不好': './public/audio/voices/role_grandma_ch1_line.mp3',
  'boss:阿嬤怎麼辦我們客戶把行銷招數學完就要自己接手不付我們操作費了以後不要教他們好不好': './public/audio/voices/role_grandma_ch2_line.mp3',
  'boss:阿嬤最近下雨客人少一半大家都在講把外面大招牌熄燈拿去賣廢鐵省錢只剩叫賣大聲公就好對嗎': './public/audio/voices/role_grandma_ch3_line.mp3',
  'boss:阿嬤只要跟我們買這套鏡頭點名機哪個客人家住幾樓愛吃什麼肉我們都幫你偷記起來追蹤一輩子喔': './public/audio/voices/role_grandma_ch4_line.mp3',
  'boss:阿嬤明明大家新聞上都喊支持永續我這把有機菜多貼一張大口號賣兩倍價錢居然一把都賣不掉大家騙人嗎': './public/audio/voices/role_grandma_ch5_line.mp3',
  'boss:阿嬤客戶嫌拍真正煮飯拍戲太花時間要用AI電腦一分鐘產三十支假煮菜短片頂替預算砍半你要去現場拆台嗎': './public/audio/voices/role_grandma_ch6_line.mp3',
  'boss:阿嬤這個超級商場能從攤前路過算到櫃台結帳報表數字完美得不得了全部廣告費都交給房東算好不好': './public/audio/voices/role_grandma_ch7_line.mp3',
  'boss:阿嬤這台自動精準機厲害吧它發現對著熟悉張媽媽與李伯伯狂吼成交率最高我們把對面馬路招牌喊停只專攻熟客吧': './public/audio/voices/role_grandma_ch8_line.mp3',
  'boss:阿嬤以後機器人幫大家看價格和營養表自動下單了我們先花錢打點機器人讓它寫推薦第一名還是先做讓人流連忘返的口碑': './public/audio/voices/role_grandma_ch9_line.mp3',
  'boss:阿嬤您看這台全自動電子秤就是靠偵測老主顧心甘情願不比價才多偷加價一成五替集團撐起業績難道要全拆掉嗎': './public/audio/voices/role_grandma_ch10_line.mp3'
};

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.bgmFilter = null;
    this.bgmMaster = null;
    this.muted = false;
    this.voiceEnabled = true;
    this.lang = 'zh';
    this.speaking = false;
    this.cutscenePlaying = false;
    this.activeVoiceRole = '';
    this.activeAudio = null;
    this._audioToken = 0;
    this._speechDelayTimer = null;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.stationIndex = 0;
    this.onVoiceChange = null;
    this._noiseBuffer = null;
  }

  setLang(lang) {
    const next = lang === 'en' || lang === 'ja' ? lang : 'zh';
    if (this.lang !== next) {
      this.lang = next;
      this.stopSpeech();
    }
  }

  _ensureCtx() {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.bgmFilter = this.ctx.createBiquadFilter();
      this.bgmFilter.type = 'lowpass';
      this.bgmFilter.frequency.setValueAtTime(BGM_FILTER_HZ.normal, this.ctx.currentTime);
      this.bgmFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);
      this.bgmMaster = this.ctx.createGain();
      this.bgmMaster.gain.setValueAtTime(BGM_MIX_LEVELS.normal, this.ctx.currentTime);
      this.bgmFilter.connect(this.bgmMaster);
      this.bgmMaster.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  _updateBgmDucking() {
    if (!this.ctx || !this.bgmMaster) return;
    const now = this.ctx.currentTime;
    let targetGain = BGM_MIX_LEVELS.normal;
    let targetHz = BGM_FILTER_HZ.normal;
    if (this.muted) {
      targetGain = 0.0001;
      targetHz = BGM_FILTER_HZ.cutscene;
    } else if (this.cutscenePlaying) {
      targetGain = BGM_MIX_LEVELS.cutscene;
      targetHz = BGM_FILTER_HZ.cutscene;
    } else if (this.speaking) {
      targetGain = BGM_MIX_LEVELS.speaking;
      targetHz = BGM_FILTER_HZ.speaking;
    }

    const rampSec = this.muted ? 0.03 : (this.cutscenePlaying || this.speaking ? 0.05 : 0.5);
    this.bgmMaster.gain.cancelScheduledValues(now);
    this.bgmMaster.gain.setValueAtTime(this.bgmMaster.gain.value, now);
    this.bgmMaster.gain.linearRampToValueAtTime(targetGain, now + rampSec);
    if (this.bgmFilter) {
      this.bgmFilter.frequency.cancelScheduledValues(now);
      this.bgmFilter.frequency.setValueAtTime(this.bgmFilter.frequency.value, now);
      this.bgmFilter.frequency.exponentialRampToValueAtTime(Math.max(120, targetHz), now + rampSec);
    }
  }

  setCutscenePlaying(active) {
    const next = Boolean(active);
    if (next && !this.cutscenePlaying) {
      this.cutscenePlaying = true;
      this.stopSpeech();
    } else {
      this.cutscenePlaying = next;
    }
    this._updateBgmDucking();
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.muted) {
      this.stopBGM();
      this.stopSpeech();
    } else {
      this._updateBgmDucking();
    }
  }

  setVoiceEnabled(enabled) {
    this.voiceEnabled = Boolean(enabled);
    if (!this.voiceEnabled) this.stopSpeech();
  }

  toggleVoice() {
    this.setVoiceEnabled(!this.voiceEnabled);
    return this.voiceEnabled;
  }

  getCurrentStation() {
    return RADIO_STATIONS[this.stationIndex % RADIO_STATIONS.length];
  }

  setStation(idx) {
    this.stationIndex = ((idx % RADIO_STATIONS.length) + RADIO_STATIONS.length) % RADIO_STATIONS.length;
    if (this.bgmTimer) {
      this.stopBGM();
      this.startBGM();
    }
    return this.getCurrentStation();
  }

  nextStation() {
    this.playClick();
    return this.setStation(this.stationIndex + 1);
  }

  _tone(freq, duration = 0.12, type = 'triangle', gainPeak = 0.12, delay = 0, targetNode = null) {
    const ctx = this._ensureCtx();
    if (!ctx || !freq) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(targetNode || ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.025);
  }

  _kick(delay = 0, targetNode = null) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(125, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.11);
    gain.gain.setValueAtTime(0.072, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
    osc.connect(gain);
    gain.connect(targetNode || this.bgmFilter || this.bgmMaster || ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  _hihat(delay = 0, targetNode = null) {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    if (!this._noiseBuffer) {
      const len = Math.floor(ctx.sampleRate * 0.045);
      this._noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = this._noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    }
    const now = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6200, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.016, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(targetNode || this.bgmFilter || this.bgmMaster || ctx.destination);
    src.start(now);
  }

  playClick() {
    this._tone(640, 0.06, 'sine', 0.055, 0);
  }

  playLinePing() {
    this._tone(880, 0.09, 'sine', 0.075, 0);
    this._tone(1174.66, 0.14, 'sine', 0.065, 0.075);
  }

  playScooterHorn() {
    this._tone(420, 0.08, 'sawtooth', 0.06, 0);
    this._tone(440, 0.09, 'sawtooth', 0.06, 0.11);
  }

  playAutopilotChime() {
    // 2026 Tesla FSD Autopilot 雙聲提示音
    this._tone(587.33, 0.09, 'sine', 0.07, 0);
    this._tone(880.0, 0.18, 'sine', 0.075, 0.085);
  }

  playStampImpact() {
    // 宮廟金印「衡斷破局」厚實蓋章震音＋銅鐘泛音
    this._kick(0);
    this._tone(196, 0.14, 'triangle', 0.08, 0.01);
    this._tone(523.25, 0.34, 'sine', 0.06, 0.05);
  }

  playTatungCooker() {
    this._tone(150, 0.05, 'square', 0.065, 0);
    this._tone(523.25, 0.1, 'triangle', 0.055, 0.045);
    this._tone(659.25, 0.11, 'triangle', 0.055, 0.105);
    this._tone(783.99, 0.14, 'triangle', 0.06, 0.16);
  }

  playWantedSiren() {
    const ctx = this._ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.linearRampToValueAtTime(860, now + 0.18);
    osc.frequency.linearRampToValueAtTime(520, now + 0.36);
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.44);
  }

  playMissionPassed() {
    const notes = [392.0, 493.88, 587.33, 783.99];
    notes.forEach((n, idx) => {
      this._tone(n, 0.28, 'triangle', 0.07, idx * 0.09);
    });
  }

  playPickup(good = true) {
    if (good) {
      this._tone(659.25, 0.09, 'sine', 0.065, 0);
      this._tone(987.77, 0.14, 'sine', 0.06, 0.06);
    } else {
      this._tone(210, 0.16, 'sawtooth', 0.065, 0);
      this._tone(145, 0.22, 'sawtooth', 0.06, 0.08);
    }
  }

  startBGM() {
    if (this.muted || this.bgmTimer || typeof window === 'undefined') return;
    const station = this.getCurrentStation();
    this.bgmTimer = setInterval(() => {
      if (this.muted) return;
      const st = this.getCurrentStation();
      const step = this.bgmStep % st.bass.length;
      const dest = this.bgmFilter || this.bgmMaster || this.ctx?.destination;

      const bassFreq = st.bass[step];
      if (bassFreq) this._tone(bassFreq, 0.2, 'triangle', 0.036, 0, dest);

      const leadFreq = st.lead[step];
      if (leadFreq) this._tone(leadFreq, 0.15, st.id === 'lofi' ? 'sine' : 'sawtooth', 0.012, 0.02, dest);

      if (step === 0) {
        st.pad.forEach((pf) => this._tone(pf, 0.65, 'sine', 0.011, 0, dest));
      }

      if (step % 2 === 0) this._kick(0, dest);
      if (step % 2 === 1) this._hihat(0, dest);

      this.bgmStep += 1;
    }, station.tempoMs);
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  _localizeClipUrl(zhUrl) {
    if (!zhUrl) return null;
    if (this.lang === 'zh') return zhUrl;
    const clean = String(zhUrl);
    const prefix = './public/audio/';
    if (clean.startsWith(`${prefix}${this.lang}/`)) return clean;
    if (clean.startsWith(prefix)) {
      return `${prefix}${this.lang}/${clean.slice(prefix.length)}`;
    }
    return clean;
  }

  resolveClipById(clipId) {
    if (!clipId) return null;
    const raw = String(clipId).trim();
    if (!raw) return null;
    if (raw.startsWith('./public/audio/')) {
      return this._localizeClipUrl(raw);
    }
    const langPrefix = this.lang === 'zh' ? '' : `${this.lang}/`;
    if (raw.startsWith('grandma:')) {
      const name = raw.slice('grandma:'.length);
      return name ? `./public/audio/${langPrefix}grandma/${name}.mp3` : null;
    }
    if (raw.startsWith('voice:')) {
      const name = raw.slice('voice:'.length);
      return name ? `./public/audio/${langPrefix}voices/${name}.mp3` : null;
    }
    return null;
  }

  resolveGrandmaClip(text, clipId = null) {
    const byId = this.resolveClipById(clipId);
    if (byId) return byId;
    const zhUrl = GRANDMA_VOICE_CLIPS[normalizeGrandmaVoiceKey(text)] || null;
    return this._localizeClipUrl(zhUrl);
  }

  resolveVoiceClip(text, roleKey = 'narrator', clipId = null) {
    const byId = this.resolveClipById(clipId);
    if (byId) return byId;
    if (roleKey === 'grandma') return this.resolveGrandmaClip(text, clipId);
    const norm = normalizeVoiceKey(text);
    const zhUrl = CHARACTER_VOICE_CLIPS[`${roleKey}:${norm}`] || null;
    return this._localizeClipUrl(zhUrl);
  }

  _clearSpeechState() {
    if (this.speaking || this.activeVoiceRole) {
      this.speaking = false;
      this.activeVoiceRole = '';
      this._updateBgmDucking();
      if (typeof this.onVoiceChange === 'function') this.onVoiceChange(false, '');
    }
  }

  stopSpeech() {
    this._audioToken += 1;
    if (this._speechDelayTimer) {
      clearTimeout(this._speechDelayTimer);
      this._speechDelayTimer = null;
    }
    if (this.activeAudio) {
      try {
        this.activeAudio.onended = null;
        this.activeAudio.onerror = null;
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch {}
      this.activeAudio = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this._clearSpeechState();
  }

  _playClipFile(clipUrl, _clean, _roleKey, token) {
    const audio = new Audio(clipUrl);
    audio.preload = 'auto';
    audio.volume = 1.0;
    this.activeAudio = audio;

    audio.onended = () => {
      if (token !== this._audioToken) return;
      this.activeAudio = null;
      this._clearSpeechState();
    };
    audio.onerror = () => {
      if (token !== this._audioToken) return;
      this.activeAudio = null;
      this._clearSpeechState();
    };

    try {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          if (token !== this._audioToken) return;
          this.activeAudio = null;
          this._clearSpeechState();
        });
      }
      return true;
    } catch {
      this.activeAudio = null;
      this._clearSpeechState();
      return false;
    }
  }

  speak(text, roleKey = 'narrator', forceManual = false, clipId = null) {
    if (!text || this.muted) return false;
    if (!forceManual && !this.voiceEnabled) return false;
    if (this.cutscenePlaying && !forceManual) return false;

    const clean = String(text)
      .replace(/\uFE0F/g, '')
      .replace(/[📞🔊👵🍲📩⚡🎯🎬🛵🚗⭐🔥🧠🎙☎]/g, '')
      .trim();
    if (!clean) return false;

    this.stopSpeech();

    const clipUrl = this.resolveVoiceClip(clean, roleKey, clipId);
    if (!clipUrl) {
      // 僅播放工作室 Google Gemini TTS 錄音檔，絕不降級為瀏覽器預設女聲 TTS 呢喃
      if (roleKey === 'grandma') {
        this.playTatungCooker();
      }
      return false;
    }

    if (roleKey === 'grandma') {
      this.playTatungCooker();
    }

    if (typeof Audio !== 'undefined') {
      const token = ++this._audioToken;
      this.speaking = true;
      this.activeVoiceRole = roleKey;
      this._updateBgmDucking();
      if (typeof this.onVoiceChange === 'function') this.onVoiceChange(true, roleKey);

      if (roleKey === 'grandma') {
        this._speechDelayTimer = setTimeout(() => {
          if (token !== this._audioToken) return;
          this._speechDelayTimer = null;
          this._playClipFile(clipUrl, clean, roleKey, token);
        }, 190);
        return true;
      }
      if (this._playClipFile(clipUrl, clean, roleKey, token)) {
        return true;
      }
    }

    return false;
  }
}

export const soundFX = new SoundEngine();
export default soundFX;
