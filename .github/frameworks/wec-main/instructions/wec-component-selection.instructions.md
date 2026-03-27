---
applyTo: "**/*.{ts,html}"
---

# WEC 元件選型指南

> 本文件是 AI 開發時的元件選型決策依據。若需查閱元件 API（selector / Input / Output），請參閱 `wec-components.instructions.md`。
> 若需查閱外觀 class 與樣式能力，請參閱 `wec-styling-system.instructions.md`。

## 基本原則

1. **優先順序**：Nebular → Angular CDK → wec-components → 才考慮新建
2. **匯入規則**：一律 `import { ... } from '@wec/components'`，禁止引用內部路徑
3. **AI 使用限制**：
   - 元件 selector 與 Input/Output 名稱以 `wec-components.instructions.md` 為準
   - 若需求中的屬性不在文件中，必須先註記「待確認」，不得臆測
   - 若本文件未列出某元件，視為「未知元件」

---

## 全元件選型快查表

| 元件               | 用途                                         | 優先場景                           | 不優先場景                                               |
| ------------------ | -------------------------------------------- | ---------------------------------- | -------------------------------------------------------- |
| `ag-grid`          | 表格資料呈現、排序篩選、cell renderer/editor | 資料清單、管理後台表格、大量資料   | 簡單兩三欄展示、無互動需求                               |
| `button-group`     | 一組互斥或相近按鈕操作                       | 狀態切換、模式切換、工具列群組     | 單一按鈕或操作不相關                                     |
| `category-tree`    | 樹狀分類瀏覽與選取                           | 分類階層、目錄導覽、展開收合結構   | 單層清單或平面分類                                       |
| `check-list`       | 清單選取、批次勾選、篩選拖曳選取             | 多選清單、批次處理名單             | 單一布林勾選                                             |
| `collapsible-pane` | 可收合/展開面板（四方向）                    | 側邊屬性面板、工具面板、輔助軸設定 | 完整抽屜覆蓋→用 `side-drawer`；分組摺疊→用 `field-group` |
| `color-picker`     | 顏色選取，支援 null/auto 狀態                | 圖表設定的字色/線條/series 顏色    | 顏色必填無需 null→用 `<input type="color">`              |
| `combo-box`        | 輸入 + 選項提示                              | 輸入過程需候選項目提示             | 純下拉或純文字輸入                                       |
| `date-time`        | 日期/時間/區間/月/季/週輸入                  | 查詢條件時間、表單日期欄位         | 非時間型欄位                                             |
| `directive`        | 補強元素行為（遮罩、tooltip 等）             | 輸入遮罩、選擇器輔助、DOM 行為補強 | 需求是完整視覺元件                                       |
| `display-shelf`    | 輪播或陳列式內容                             | 多卡片/縮圖展示                    | CRUD 清單或表格                                          |
| `field-group`      | 欄位分組、區塊標題、可收合區塊               | 查詢條件區、表單分組、設定區塊     | 一般容器無欄位語意                                       |
| `file-upload`      | 檔案上傳與顯示                               | 匯入附件、上傳文件、圖檔           | 只輸入檔案路徑字串                                       |
| `form-item`        | 欄位標籤、錯誤提示、排列包裝                 | CRUD 表單、查詢欄位                | 純展示非表單                                             |
| `goto-top`         | 回到頂部                                     | 長頁面、長清單                     | 短頁面無捲動                                             |
| `icon-input`       | 帶前後 icon 的輸入欄位                       | 搜尋欄、日期欄位、icon 提示輸入    | 一般文字輸入無需 icon                                    |
| `message-dialog`   | 訊息/確認/警告對話框                         | 使用者確認、錯誤通知、系統提醒     | 只需非阻塞 toast/notify                                  |
| `multi-select`     | 多選下拉與管理                               | 少量到中量多選條件、表單多選       | 需左右搬移→用 `transfer-list`                            |
| `ng-select`        | ng-select 項目模板補強                       | 補強 ng-select 顯示模板            | 需完整多選→用 `multi-select`                             |
| `rich-tooltip`     | 富文字 tooltip                               | 需比原生 tooltip 更豐富的說明      | 只有簡短 title 提示                                      |
| `select-eraser`    | select 可清除操作補強                        | 查詢條件可快速重置                 | 不允許清空的必填欄位                                     |
| `side-drawer`      | 側邊抽屜面板                                 | 屬性編輯、輔助資訊、右側工具面板   | 主內容需完整主畫面空間                                   |
| `split-button`     | 主操作 + 下拉次要操作                        | 一個主動作搭配少數延伸動作         | 所有操作同等重要或只有單一操作                           |
| `split-pane`       | 可拖曳調整的分割區塊                         | 左右/上下雙區塊可拖曳調整比例      | 靜態兩欄排版                                             |
| `switch-button`    | 開關切換按鈕                                 | 布林狀態切換、啟用/停用            | 多選或多狀態切換                                         |
| `tab-bar`          | 區塊內容切換                                 | 2~5 個內容切換、局部分頁           | 很多頁籤→優先 `nb-tabset`                                |
| `toggle-chip`      | Chip 風格切換元件                            | 少量狀態切換、標籤式布林切換       | 文案很長或選項很多                                       |
| `transfer-list`    | 兩欄搬移（待選/已選）                        | 權限配置、成員指派、左右名單搬移   | 單純多選條件→用 `multi-select`                           |
| `user-list`        | 使用者名單顯示                               | 使用者資訊、人員清單、指派成員     | 非使用者型資料清單                                       |
| `view-stack`       | 多視圖堆疊切換                               | 同區塊多 view 狀態切換             | 標準頁籤或路由即可解決                                   |

---

## 選型決策樹

### 選擇控制項決策

```
需要選擇選項？
│
├─ 是 → 可以選多個？
│      │
│      ├─ 否（單選）→ 選項數量？
│      │            │
│      │            ├─ ≤ 10 個（且文字短）→ nb-radio-group（可用 chip 外觀）
│      │            ├─ > 10 個 → ng-select / nb-select
│      │            └─ 2-5 個互斥 → nb-radio-group
│      │
│      └─ 是（多選）→ 選項數量？
│                   │
│                   ├─ < 7 個 → nb-checkbox 群組
│                   ├─ 7-50 個 → multi-select
│                   ├─ 需要搜尋/批次 → multi-select
│                   └─ 需要左右搬移語意 → transfer-list
│
└─ 否（開關）→ 立即生效？
             │
             ├─ 是 → nb-toggle
             └─ 否（需提交）→ nb-checkbox
```

### 資料展示決策

```
需要展示資料清單？
│
├─ 需要排序/篩選/欄位操作 → ag-grid（使用 AgGridOptions）
├─ 多選清單 + 批次勾選 → check-list
├─ 兩欄搬移指派 → transfer-list
├─ 卡片/縮圖輪播 → display-shelf
└─ 簡單幾項資料 → 一般 HTML 搭配 fx-row/fx-column
```

### 容器/面板決策

```
需要面板/容器？
│
├─ 欄位分組 + 標題 → field-group
├─ 可收合面板 → collapsible-pane
├─ 側邊抽屜 → side-drawer
├─ 可拖曳調整分割 → split-pane
├─ 內容切換 → tab-bar 或 nb-tabset
└─ 多視圖堆疊 → view-stack
```

---

## 選型對照（避免誤選）

| 需求               | 優先選擇                    | 不優先選擇                      | 原因                             |
| ------------------ | --------------------------- | ------------------------------- | -------------------------------- |
| 選項 > 10 個的單選 | `ng-select`                 | `nb-radio-group`                | radio 過長畫面、不利搜尋         |
| 選項 > 10 個的多選 | `multi-select`              | `nb-checkbox` 平鋪              | 大量選項應提供搜尋與批次操作     |
| 少量到中量多選     | `multi-select`              | `transfer-list`                 | 不需要左右搬移結構               |
| 左右名單搬移       | `transfer-list`             | `multi-select`                  | 需要雙欄搬移語意                 |
| 後台資料表         | `ag-grid` + `AgGridOptions` | HTML table / 官方 `GridOptions` | AgGridOptions 已封裝公司預設     |
| 頁面內少量內容切換 | `tab-bar` 或 `nb-tabset`    | 自建切換邏輯                    | 需要 Nebular 外觀→用 `nb-tabset` |
| 表單欄位包裝       | `form-item`                 | `div` + 自寫 label/error        | 統一樣式與驗證顯示               |
| 欄位分組/查詢區    | `field-group`               | 純版面容器                      | 提供分組標題與收合能力           |
| 可拖曳調整區塊     | `split-pane`                | 一般 `fx-row`                   | 需要拖曳調整比例功能             |

---

## 選型細則

### AG-Grid 初始化

- 優先使用 `new AgGridOptions(...)` 而非直接從 ag-grid 官方 `GridOptions` 起手
- `AgGridOptions` 已包裝公司內部常用預設與強化設定

### 圖表選型

- `ag-charts`：與 ag-grid 整合、互動性強
- `e-charts`：海量資料、客製能力強
- 應先詢問使用者資料量再決定

### Nebular 元件綁定

- Nebular 元件若已提供專屬綁定屬性（如 `nb-select` 的 `[(selected)]`、`nb-toggle` 的 `[(checked)]`），優先使用該屬性，不使用 `[(ngModel)]`
- `ngModel` 僅用於原生 HTML 元素（`<input>`、`<textarea>`、`<select>`）

### 外觀需求 vs 功能需求

- 若需求是「外觀要求」（tab 樣式、radio 樣式、card 樣式），查 `wec-styling-system.instructions.md` 的 Nebular 外觀覆寫能力
- 若需求是「功能要求」（新邏輯、新互動），查本文件的元件選型表
- 不要自行發明 class 名稱

---

## 模組匯入說明

### WecComponentsModule 已包含的 Nebular 模組

- `WecComponentsModule` 內部已 import 並 re-export 所有常用 Nebular 模組（`NbButtonModule`, `NbCardModule`, `NbIconModule`, `NbSelectModule`, `NbPopoverModule`, `NbAccordionModule`, `NbTabsetModule`, `NbToggleModule`, `NbRadioModule`, `NbCheckboxModule`, `NbInputModule`, `NbTooltipModule`, `NbContextMenuModule` 等）
- 下游專案只要 import `WecComponentsModule` 即可使用所有 Nebular 元件，**不需要**再另外 import 個別 Nebular 模組
