# Grand Theft Agency｜電通台灣一日風雲（《決策智慧》2018–2026 生活情境遊戲）

將電通台灣（Dentsu Taiwan）2018 至 2026 共 **9 本《決策智慧》（Intelligent Decision）年鑑**，濃縮為 **GTA 6 台灣霓虹街頭風格 × 廣告代理商的一天（08:30 AM – 11:45 PM 十個時段任務）** 生活情境決策遊戲。

## 核心玩法與特色
- **電通台灣 4 大職能 ＋ 隱藏第 5 角色**：
  - 業務領航總監（Account Director）— 拆彈外交
  - 品牌策略與洞察師（Strategic Planner）— People Model 讀心術
  - 創意與內容總監（Creative Director）— 品味否決權
  - 媒體採購與數據獵人（Media & Data Lead）— 抓鬼雷達
  - 隱藏第 5 角色：**滿級皇太后・台灣阿嬤顧問（Grandma Master）**（輸入秘技 `AMA666` 或點選平安符解鎖）
- **彩蛋「阿嬤模組（Grandma Mod）」三大機制**：
  1. 秘技 `AMA666` 召喚 ＋ 菜市場經濟學九本年鑑神翻譯
  2. 5 星 CFO 通緝 / 爆肝「大同電鍋滷肉飯」強制消星補滿血救援 ＋ Ch6 內湖攝影棚「回到阿嬤家的廚房」現場來電
  3. 60fps Canvas 街頭串場小遊戲《阿嬤買菜電動車：直衝信義區》
- **GTA 6 台灣化 HUD**：5 星通緝值、台北 GPS 雷達小地圖、LINE 99+ 手機（Boss 急訊 / People Model 25 歲 Lisa & 35 歲 Cindy 數位分身）、6 種決策小互動與 Web Audio 台味音效合成。

## 多平台多代理開發架構
- **Spec & Task Graph**：`/prd-taskmaster`（`.taskmaster/docs/prd.md`、`tasks.json`）
- **Narrative & Role Design**：Claude Code 產出 `src/story-data.js`
- **Character & Taipei Scene Art**：ChatGPT `gpt-image` 2.6 高清手繪 GTA 6 台灣人風格轉 WebP（`public/images/*.webp`）
- **Video Cutscenes**：Codex 呼叫已串接之 Higgsfield（`seedance_2_5`）生成 `intro-taipei.mp4`、`boardroom-push.mp4`、`grandma-rescue.mp4`（`public/video/*.mp4`）
- **Unity CLI Companion**：以 `/Users/lewis/.unity/bin/unity` 診斷並建立 `unity-companion/` Unity 6 C# 對應控制腳本

## 指令與驗證
```bash
npm test          # 執行狀態機與阿嬤模組自動化單元測試
npm run build     # 建置 dist/ 靜態站台與 dist/gta-dentsu-taiwan-standalone.html
npm run check     # 嚴格稽核資源完整性，確認零 PDF / InDesign 外洩
npm run serve     # 本地啟動預覽伺服器 (port 4321)
```

## 部署
- **GitHub Pages**：推送 `main` 分支自動觸發 `.github/workflows/deploy.yml` 發佈 `dist/`
- **Netlify**：內建 `netlify.toml`（`npm run build && npm run check` 發佈 `dist`）
