# 前端開發基礎規範（建議標準）

> **適用範圍**：CIM 智慧製造中心所有前端專案  
> **最後更新**：2026-03

---

## 目錄

1. [規範目的](#一規範目的)
2. [前端框架與技術選型原則](#二前端框架與技術選型原則)
3. [前端 AI 開發規範（Web 為核心）](#三前端-ai-開發規範web-為核心)
4. [CIM 系統前端設計核心方向](#四cim-系統前端設計核心方向)
5. [前端開發基礎建議標準（總結）](#五前端開發基礎建議標準總結)

---

## 一、規範目的

為因應前端技術快速演進及 AI 輔助開發趨勢，並提升系統開發彈性與長期可維護性，本中心將移除特定前端框架限制，改以「基礎設計原則 + 使用情境導向」作為前端開發的核心規範，確保系統一致性、可讀性與可擴充性。

---

## 二、前端框架與技術選型原則

### 2.1 框架使用原則（取消 Angular 限制）

- 正式移除「前端開發僅能使用 Angular / wec-main UI Framework」之限制
- 不再建議或強制僅使用 Angular（Angular 17+）
- 前端可依系統需求選擇合適技術，例如：
  - Angular
  - React
  - Vue
  - 原生 Web（HTML / CSS / JavaScript）
  - 其他成熟、主流的前端框架

### 2.2 技術選型基本要求

不論使用何種前端框架，必須符合以下基本原則：

- 採用主流、長期維護中的技術
- 具備清楚的專案結構與模組化設計
- 易於後續人員維護與交接
- 不應過度依賴個人習慣或非主流套件

> 📌 重點不是「用什麼框架」，而是「是否符合 CIM 系統長期維運需求」

---

## 三、前端 AI 開發規範（Web 為核心）

### 3.1 AI 輔助開發原則

- 允許並鼓勵使用 AI 工具（如 Copilot、ChatGPT 等）輔助前端開發
- AI 產出之程式碼需：
  - 經人工理解與檢視
  - 符合本中心前端基礎規範
  - 不可直接複製未知來源、無法說明邏輯的程式碼

### 3.2 Web First 設計原則

- 所有系統開發以「Web 使用情境」為主
- 設計順序應為：
  1. 桌機 / Web 瀏覽器操作體驗（主要）
  2. RWD / 行動裝置（輔助）

### 3.3 RWD 使用定位

- RWD 為加分項目，非所有系統的第一優先
- 需視實際使用場景評估：
  - 若系統主要於產線、辦公室電腦使用 → Web 為主
  - 若有行動巡檢、平板需求 → 再強化 RWD

---

## 四、CIM 系統前端設計核心方向

### 4.1 系統型態定位

CIM 智慧製造中心的前端系統，主要屬於：

- 資訊呈現型
- 製造數據分析型
- 流程管理型系統

因此前端設計應以以下內容為核心：

### 4.2 圖表與資料視覺化（Charts / Dashboard）

前端畫面應優先考量：

- 趨勢圖
- 即時 / 歷史數據圖表
- KPI / Dashboard 顯示

圖表需：

- 清楚、可讀
- 不過度裝飾
- 適合長時間觀看

#### 優先推薦套件：AG Charts

> ✅ **首選：[AG Charts](https://charts.ag-grid.com/)（不限前端框架，支援 Angular / React / Vue / 原生 JS）**

| 版本       | 說明                                                                     | 預設使用 |
| ---------- | ------------------------------------------------------------------------ | -------- |
| Community  | 免費開源，涵蓋常用圖表類型（折線、長條、圓餅、散點、面積圖等），無需授權 | ✅ 預設  |
| Enterprise | 進階功能（財務圖、組合圖、動畫、context menu、資料下鑽等），需商業授權   | 需授權   |

**選用理由：**

- 與 AG Grid 原生整合，可直接在 Grid 內嵌圖表（Integrated Charts）
- 支援互動式操作（zoom、tooltip、crosshair）
- API 一致，跨框架使用方式相同，降低切換框架成本
- 資料量極大（> 100 萬筆）或高度客製化需求，可評估改用 Apache ECharts

**各框架安裝：**

```
Angular : npm install ag-charts-angular ag-charts-community
React   : npm install ag-charts-react ag-charts-community
Vue     : npm install ag-charts-vue3 ag-charts-community
原生 JS : npm install ag-charts-community
```

> 🔑 **若需 AG Charts Enterprise 授權，請聯絡 `MK22 HYCHENG5` 詢問授權事宜。**

### 4.3 表格導向設計（Table First）

- 多數系統畫面應以表格為主要資訊載體
- 表格需支援：
  - 分頁
  - 排序
  - 篩選
  - 明確欄位命名
- 避免過度客製、難以維護的表格實作方式

#### 優先推薦套件：AG Grid

> ✅ **首選：[AG Grid](https://www.ag-grid.com/)（不限前端框架，支援 Angular / React / Vue / 原生 JS）**

| 版本       | 說明                                                                                                  | 預設使用 |
| ---------- | ----------------------------------------------------------------------------------------------------- | -------- |
| Community  | 免費開源，支援排序、篩選、分頁、虛擬捲動、欄位調整、CSV 匯出等核心功能，完全滿足大多數 CIM 系統需求   | ✅ 預設  |
| Enterprise | 進階功能（資料分組、Pivot、Server-side Row Model、Excel 匯出、圖表整合、Row Grouping 等），需商業授權 | 需授權   |

**選用理由：**

- 效能優異，支援百萬筆資料虛擬捲動（Virtual Scrolling），不需額外分頁優化
- 開箱即用的排序 / 篩選 / 欄位 resize / 固定欄，無需自行實作
- 跨框架 API 一致，降低人員切換框架的學習成本
- Community 版本即可滿足本中心絕大多數使用情境

**各框架安裝：**

```
Angular : npm install ag-grid-angular ag-grid-community
React   : npm install ag-grid-react ag-grid-community
Vue     : npm install ag-grid-vue3 ag-grid-community
原生 JS : npm install ag-grid-community
```

> 🔑 **若需 AG Grid Enterprise 授權，請聯絡 `MK22 HYCHENG5` 詢問授權事宜。**

### 4.4 CRUD 表單與流程畫面

前端畫面設計應符合以下常見流程：

- 查詢（Search）
- 新增（Create）
- 編輯（Update）
- 刪除（Delete）
- 狀態切換 / 流程節點顯示

設計原則：

- 表單欄位清楚、直覺
- 操作流程簡單、不冗長
- 明確的成功 / 失敗回饋訊息

---

## 五、前端開發基礎建議標準（總結）

- ✅ 不限制框架，但限制混亂與不可維護性
- ✅ 以 Web 為主，RWD 為輔
- ✅ 以圖表、表格、CRUD 流程為設計核心
- ✅ 表格優先使用 AG Grid Community；需進階功能（Excel 匯出、Pivot、Server-side）聯絡 MK22 HYCHENG5 取得 Enterprise 授權
- ✅ 圖表優先使用 AG Charts Community；需進階功能（財務圖、動畫、下鑽）聯絡 MK22 HYCHENG5 取得 Enterprise 授權
- ✅ 技術選型需考量團隊與長期維運
- ✅ AI 是工具，不是替代思考
