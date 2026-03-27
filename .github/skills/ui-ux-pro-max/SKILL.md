---
name: ui-ux-pro-max
description: |
  This skill should be used when the user wants to "設計 UI", "做 landing page",
  "建立 dashboard", "UI/UX 設計", "配色方案", "字體選擇", "design system",
  "Build a landing page", "Create a dashboard", "Choose style", "Review UI",
  or requests any UI/UX design, creation, review, or improvement work.
---

# UI/UX Pro Max — Design Intelligence Skill

為 Web 和 Mobile 應用提供專業 UI/UX 設計智慧。包含 67 種風格、161 組配色方案、57 組字體搭配、99 條 UX 準則、25 種圖表類型，覆蓋 13 種技術棧。內建可搜尋的資料庫及優先級推薦引擎。

## 前置條件

需要安裝 Python 3.x：

```powershell
python3 --version
# 或
python --version
```

若未安裝：

```powershell
winget install Python.Python.3.12
```

---

## 觸發條件

當使用者輸入包含以下任一情境時，啟動此 Skill：

| 場景                   | 觸發範例                                       | 起始步驟                           |
| ---------------------- | ---------------------------------------------- | ---------------------------------- |
| **新專案 / 頁面**      | "做一個 landing page"、"Build a dashboard"     | Step 1 → Step 2 (設計系統)         |
| **新元件**             | "Create a pricing card"、"加一個 modal"        | Step 3 (domain search)             |
| **選擇風格/配色/字體** | "什麼風格適合 fintech?"、"推薦配色"            | Step 2 (設計系統)                  |
| **審查現有 UI**        | "Review this page for UX issues"、"檢查無障礙" | Pre-Delivery Checklist             |
| **修復 UI 問題**       | "Button hover is broken"、"Layout shifts"      | Common Rules 相關章節              |
| **改善 / 優化**        | "改善手機體驗"、"Make this faster"             | Step 3 (domain: ux)                |
| **暗色模式**           | "Add dark mode support"                        | Step 3 (domain: style "dark mode") |
| **圖表 / 資料視覺化**  | "加一個分析圖表"                               | Step 3 (domain: chart)             |
| **技術棧最佳實踐**     | "React 效能優化"、"SwiftUI navigation"         | Step 4 (stack search)              |

---

## 使用流程

### Step 1: 分析使用者需求

從使用者請求中提取關鍵資訊：

- **產品類型**：SaaS、電商、作品集、儀表板、Landing Page 等
- **風格關鍵字**：極簡、活潑、專業、優雅、暗色模式等
- **產業別**：醫療、金融科技、遊戲、教育等
- **技術棧**：React、Vue、Next.js，預設為 `html-tailwind`

### Step 2: 產生設計系統（必要）

**務必先用 `--design-system`** 取得完整的推薦方案與推理結果：

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

此指令會：

1. 平行搜尋 5 個領域（product、style、color、landing、typography）
2. 套用 `ui-reasoning.csv` 的推理規則選出最佳匹配
3. 回傳完整設計系統：pattern、style、colors、typography、effects
4. 包含應避免的「反模式」

**範例：**

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness service" --design-system -p "Serenity Spa"
```

### Step 2b: 持久化設計系統（Master + Overrides 模式）

若要跨 Session 保留設計系統，加上 `--persist`：

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name"
```

產出：

- `design-system/MASTER.md` — 全域設計規格（Single Source of Truth）
- `design-system/pages/` — 頁面層級覆寫規則

**含頁面覆寫：**

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name" --page "dashboard"
```

**分層檢索邏輯：**

1. 建構特定頁面時，先查 `design-system/pages/<page-name>.md`
2. 若頁面檔存在，其規則**覆寫** Master 檔
3. 若不存在，僅使用 `design-system/MASTER.md`

### Step 3: 補充細部搜尋（視需要）

取得設計系統後，用 domain search 取得更多細節：

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]
```

| 需求         | Domain       | 範例                                    |
| ------------ | ------------ | --------------------------------------- |
| 更多風格選項 | `style`      | `--domain style "glassmorphism dark"`   |
| 圖表推薦     | `chart`      | `--domain chart "real-time dashboard"`  |
| UX 最佳實踐  | `ux`         | `--domain ux "animation accessibility"` |
| 替代字體     | `typography` | `--domain typography "elegant luxury"`  |
| Landing 結構 | `landing`    | `--domain landing "hero social-proof"`  |

### Step 4: 技術棧指引（預設: html-tailwind）

取得特定技術棧的實作最佳實踐：

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack html-tailwind
```

可用技術棧：`html-tailwind`、`react`、`nextjs`、`vue`、`svelte`、`swiftui`、`react-native`、`flutter`、`shadcn`、`jetpack-compose`

---

## 搜尋參考

### 可用 Domain

| Domain       | 用途                   | 關鍵字範例                                      |
| ------------ | ---------------------- | ----------------------------------------------- |
| `product`    | 產品類型推薦           | SaaS, e-commerce, portfolio, healthcare, beauty |
| `style`      | UI 風格、色彩、特效    | glassmorphism, minimalism, dark mode, brutalism |
| `typography` | 字體搭配、Google Fonts | elegant, playful, professional, modern          |
| `color`      | 依產品類型的配色方案   | saas, ecommerce, healthcare, beauty, fintech    |
| `landing`    | 頁面結構、CTA 策略     | hero, hero-centric, testimonial, pricing        |
| `chart`      | 圖表類型、函式庫推薦   | trend, comparison, timeline, funnel, pie        |
| `ux`         | 最佳實踐、反模式       | animation, accessibility, z-index, loading      |
| `react`      | React/Next.js 效能     | waterfall, bundle, suspense, memo, rerender     |
| `web`        | 網頁介面指引           | aria, focus, keyboard, semantic, virtualize     |
| `prompt`     | AI Prompt、CSS 關鍵字  | (style name)                                    |

### 可用技術棧

| 技術棧            | 重點                                   |
| ----------------- | -------------------------------------- |
| `html-tailwind`   | Tailwind 工具類、響應式、a11y（預設）  |
| `react`           | State, hooks, performance, patterns    |
| `nextjs`          | SSR, routing, images, API routes       |
| `vue`             | Composition API, Pinia, Vue Router     |
| `svelte`          | Runes, stores, SvelteKit               |
| `swiftui`         | Views, State, Navigation, Animation    |
| `react-native`    | Components, Navigation, Lists          |
| `flutter`         | Widgets, State, Layout, Theming        |
| `shadcn`          | shadcn/ui components, theming, forms   |
| `jetpack-compose` | Composables, Modifiers, State Hoisting |

---

## 範例工作流程

**使用者請求：** "幫我做一個專業護膚服務的 landing page"

### Step 1: 分析需求

- 產品類型：Beauty/Spa 服務
- 風格關鍵字：elegant, professional, soft
- 產業別：美容 / 健康
- 技術棧：html-tailwind（預設）

### Step 2: 產生設計系統

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness service elegant" --design-system -p "Serenity Spa"
```

### Step 3: 補充搜尋

```bash
# UX 動畫與無障礙指引
python3 skills/ui-ux-pro-max/scripts/search.py "animation accessibility" --domain ux

# 替代字體方案
python3 skills/ui-ux-pro-max/scripts/search.py "elegant luxury serif" --domain typography
```

### Step 4: 技術棧指引

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "layout responsive form" --stack html-tailwind
```

**然後：** 綜合設計系統 + 細部搜尋結果，實作 UI 設計。

---

## 輸出格式

```bash
# ASCII 框格（預設）— 適合終端機顯示
python3 skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system

# Markdown — 適合文件
python3 skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system -f markdown
```

---

## 專業 UI 常見規則

以下是經常被忽略、但會讓 UI 顯得不夠專業的問題：

### 圖示與視覺元素

| 規則                | 正確做法                                         | 避免                        |
| ------------------- | ------------------------------------------------ | --------------------------- |
| **禁用 Emoji 圖示** | 使用 SVG 圖示（Heroicons, Lucide, Simple Icons） | 用 🎨 🚀 ⚙️ 當 UI 圖示      |
| **穩定 Hover 狀態** | 使用 color/opacity 過渡效果                      | 使用 scale 變形造成版面位移 |
| **正確品牌 Logo**   | 從 Simple Icons 取得官方 SVG                     | 猜測或使用錯誤 logo 路徑    |
| **一致圖示尺寸**    | 固定 viewBox (24x24) 搭配 w-6 h-6                | 隨機混用不同圖示大小        |

### 互動與游標

| 規則               | 正確做法                                     | 避免                        |
| ------------------ | -------------------------------------------- | --------------------------- |
| **Cursor pointer** | 所有可點擊/hoverable 卡片加 `cursor-pointer` | 互動元素留預設游標          |
| **Hover 回饋**     | 提供視覺回饋（color, shadow, border）        | 互動元素無任何指示          |
| **平滑過渡**       | 使用 `transition-colors duration-200`        | 瞬間狀態切換或過慢 (>500ms) |

### 明暗色模式對比

| 規則                   | 正確做法                        | 避免                            |
| ---------------------- | ------------------------------- | ------------------------------- |
| **Glass 卡片亮色模式** | 用 `bg-white/80` 或更高透明度   | 用 `bg-white/10`（太透明）      |
| **文字對比亮色**       | 用 `#0F172A` (slate-900) 做內文 | 用 `#94A3B8` (slate-400) 做內文 |
| **輔助文字亮色**       | 至少用 `#475569` (slate-600)    | 用 gray-400 或更淺              |
| **邊框可見性**         | 亮色模式用 `border-gray-200`    | 用 `border-white/10`（不可見）  |

### 佈局與間距

| 規則             | 正確做法                          | 避免                        |
| ---------------- | --------------------------------- | --------------------------- |
| **浮動導覽列**   | 加 `top-4 left-4 right-4` 間距    | 黏到 `top-0 left-0 right-0` |
| **內容區域留白** | 預留固定導覽列高度                | 內容藏在固定元素後面        |
| **一致最大寬度** | 統一用 `max-w-6xl` 或 `max-w-7xl` | 混用不同容器寬度            |

---

## 交付前檢查清單

交付 UI 程式碼前，請驗證以下項目：

### 視覺品質

- [ ] 未使用 Emoji 當圖示（改用 SVG）
- [ ] 所有圖示來自一致的圖示集（Heroicons/Lucide）
- [ ] 品牌 Logo 正確（已從 Simple Icons 驗證）
- [ ] Hover 狀態不造成版面位移
- [ ] 直接使用主題色彩（bg-primary），非 var() 包裝

### 互動

- [ ] 所有可點擊元素皆有 `cursor-pointer`
- [ ] Hover 提供清楚的視覺回饋
- [ ] 過渡動畫平滑（150-300ms）
- [ ] 鍵盤導覽的 Focus 狀態可見

### 明暗模式

- [ ] 亮色模式文字對比足夠（最低 4.5:1）
- [ ] Glass/透明元素在亮色模式下可見
- [ ] 兩種模式下邊框皆可見
- [ ] 交付前測試過兩種模式

### 佈局

- [ ] 浮動元素與邊緣有適當間距
- [ ] 無內容被固定導覽列遮擋
- [ ] 在 375px、768px、1024px、1440px 皆響應正常
- [ ] 手機無水平捲軸

### 無障礙

- [ ] 所有圖片有 alt text
- [ ] 表單輸入有 label
- [ ] 顏色不是唯一的指示方式
- [ ] 已考慮 `prefers-reduced-motion`

---

## 查詢技巧

1. **關鍵字要具體** — "healthcare SaaS dashboard" 優於 "app"
2. **多次搜尋** — 不同關鍵字會揭示不同面向
3. **組合 Domain** — Style + Typography + Color = 完整設計系統
4. **必查 UX** — 搜尋 "animation", "z-index", "accessibility" 避免常見問題
5. **指定技術棧** — 取得特定實作最佳實踐
6. **迭代搜尋** — 第一次搜尋不匹配就換關鍵字
