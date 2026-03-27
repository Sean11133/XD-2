---
description: "使用時機: 在 Angular 檔案中遵循元件選型、匯入路徑、樣式策略、版面設計與互動回饋最佳實踐"
applyTo: "**/*.{ts,html,scss}"
---

# Angular 元件與 UI 最佳實踐

## 匯入規則（強制）

- wec-components 一律使用 `import { ... } from '@wec/components'`。
- wec-core 一律使用 `import { ... } from '@wec/core'`。
- 禁止直接引用內部路徑（例如 `projects/wec-components/src/...`、`projects/wec-core/src/...`）。
- 若產生了內部路徑匯入，視為不合格，必須重寫。

## 元件與能力選型

- UI / 互動能力優先順序: Nebular -> Angular CDK -> wec-components -> 才考慮新建。
- Nebular 優先涵蓋常見 UI 元件（如 `nb-tag`、`nb-badge`、`nb-toggle`、`nb-select` 等），即使 catalog 未列出，也應優先使用 Nebular 原生元件，不要自建語意相同的 HTML + CSS。
- 核心能力優先使用 @wec/core（使用者資訊、權限角色、系統事件、基底能力）。
- wec-components 元件選型時，優先參考 `.github/frameworks/wec-main/instructions/wec-component-selection.instructions.md` 的「全元件選型快查表」，不要只看元件名稱臆測用途。
- wec-core 能力選型時，優先參考 `projects/wec-core/docs/catalog.md` 的「能力選型指南」，不要只憑名稱臆測要用哪個 service / model / base view / event。
- 若需求是 overlay、drag-drop、portal、a11y、focus 管理、虛擬捲動等基礎互動能力，應先評估 Angular CDK，不要直接新建一套。
- Nebular 元件若已提供專屬資料綁定屬性（如 `nb-select` 的 `[(selected)]`、`nb-toggle` 的 `[(checked)]`、`nb-radio-group` 的 `[(value)]`），優先使用該屬性，不使用 `[(ngModel)]`。`ngModel` 僅用於原生 HTML 元素（`<input>`、`<textarea>`、`<select>`）或無專屬綁定屬性的元件。
- 若需求是外觀要求（例如 tab 樣式、radio 樣式、card 樣式），優先查 `.github/frameworks/wec-main/instructions/wec-styling-system.instructions.md` 的 Nebular 外觀覆寫能力，不要自創語意相近的 class。

### 選型細則

- 單選需求若選項 10 個以下，優先使用 `nb-radio-group`（如 `chip` 外觀）平鋪選項，不優先使用 `nb-select` 下拉。
- 單選/多選需求若選項超過 10 個，優先使用 `ng-select`、`multi-select` 或可搜尋元件。
- 表格、欄位排序/篩選、批次選取、資料表操作，優先使用 ag-grid。初始化 ag-grid 時，優先使用 `@wec/components` 提供的 `AgGridOptions`，不要直接從 ag-grid 官方 `GridOptions` 起手。
- 圖表選型：`ag-charts`（與 ag-grid 整合、互動性強）或 `e-charts`（海量資料、客製能力強），應先詢問使用者資料量大不大再決定。
- 屬性面板、表單或設定畫面中的分群區塊，優先使用 `wec-field-group`（`groupTitle` 設定標題），不要自建分群容器。
- 表單欄位若需「標籤 + 控制項」排列，優先使用 `wec-form-item`（搭配 `label`、`labelWidth`），不要自建排列 class。
- 表單欄位外觀優先使用 `.github/frameworks/wec-main/instructions/wec-styling-system.instructions.md` 已列出的表單樣式能力（如 `light-input`, `light-select`, `plain-disabled`, `input-modified`）。

## 樣式規則

- **核心原則**：本專案已透過 Nebular 元件庫與 wec-components utility class 覆蓋絕大部分 UI 外觀需求。生成程式碼時，預設不新增任何 SCSS class、`::ng-deep`、或 inline style。若需自訂樣式，幾乎只有 `width` / `height` 需要手動指定，其餘外觀一律從既有元件屬性或 utility class 組合取得。違反此規則的產出視為不合格。
- **Nebular 元件屬性優先於 CSS**：Nebular 元件已提供的外觀屬性（如 button 的 `shape="round"`、`status`、`size`、`appearance`、`ghost`），一律使用屬性控制，絕對不用自訂 CSS 去覆蓋或模擬。
- **禁止擅自縮小元件尺寸**：不得在 `input`、`nb-select`、`button`、`nb-radio`、`nb-toggle` 等元件上指定 `size="small"` 或 `fieldSize="small"`，除非使用者明確要求。本專案為桌機 Admin 工具，預設元件尺寸就是正確尺寸。
- **Nebular CSS Variable 語義層優先**：需要引用顏色時，必須使用 Nebular theme 提供的**語義變數**（如 `--border-basic-color-3`、`--background-basic-color-1`、`--text-basic-color`、`--divider-color`），不可直接使用調色盤變數（如 `--color-basic-300`）。語義變數查閱路徑：`src/themes/` 下各主題 SCSS 的 mapping。
- 新增 HTML / SCSS class 前，必須先以 `.github/frameworks/wec-main/instructions/wec-styling-system.instructions.md` 比對是否已有可直接套用的 utility class、文字樣式或 Nebular 外觀。
- wec-components 元件與 utility class 名稱、selector 與 Input/Output 屬性名稱以 `.github/frameworks/wec-main/instructions/wec-components.instructions.md` 為準。
- wec-core 能力名稱、事件契約與責任邊界以 `projects/wec-core/docs/catalog.md` 為準。
- 若文件未列出，不可臆測，需先確認再使用。
- 客製樣式採最小增量原則，避免覆寫整套既有規則。
- 避免使用 inline style 設定可重用的樣式（如 `style="padding: 0"`）；應收斂成 component SCSS class 或套用既有 utility class。
- **禁止重複宣告 Nebular 或 wec-components 元件已內建的 CSS 屬性**（如 `nb-card` 的 `display: flex`、`nb-card-body` 的 `flex: 1` / `overflow`）。只在確認原生樣式確實不足時，才以最小幅度覆寫，並附加註解說明原因。

## 版面與間距

- 本專案以桌機優先（desktop-first）為設計基準，不以手機版動線為預設起點。
- Admin CRUD 頁面優先依「查詢條件區 -> 操作列 -> 資料列表 -> 明細/編輯區」安排，優先採橫向分區，避免預設單欄直向堆疊。
- 同一頁面採一致的區塊節奏與間距尺度，表單區塊維持一致欄位密度。
- 間距優先由父容器統一控制（如 `gap`、padding），避免子容器各自設定 `margin`。子容器僅在必要且明確的例外情境下使用 `margin`，並需局部註解原因。

## 文字與可讀性

- 標題層級需清楚，避免跳層與語意混亂。
- 按鈕與提示文案使用明確動詞，避免模糊詞。
- 重要操作（刪除、覆寫）需有清楚風險提示。
- 文字長度過長時提供截斷或換行策略，避免版面破裂。
- 文字樣式優先使用 `.github/frameworks/wec-main/instructions/wec-styling-system.instructions.md` 已列出的文字 utility class（如 `text-hint`, `text-bold`, `text-*-badge`, `text-truncated`），不要自建 typography class。
- 絕對禁止使用 inline style 來自訂文字外觀與顏色。一律使用 Nebular 原生 typography 類別（如 `h1`~`h6`, `subtitle-1`, `subtitle-2`, `paragraph`, `label`, `caption`）搭配 `text-hint`, `text-basic` 等語義顏色。
- 文字樣式選擇應符合資訊層級：頁面標題、區塊標題、欄位標籤、提示文字、狀態標記要分開處理。

## 互動與回饋

- 每個可點擊元素需有明確 hover/focus/active 狀態。
- 提交、載入、完成、失敗都要有可見回饋。阻塞型操作需顯示 loading 或 busy 狀態。
- 危險操作需二次確認，且預設焦點不放在危險按鈕。
- Create / Update / Delete 成功後，優先使用 `SystemModule.publish(SystemEvents.Notify, { status: 'success', message })` 提供系統通知。

## 狀態設計

- 至少考慮四種狀態: 初始、載入中、空資料、錯誤。
- 空資料狀態需包含引導文案與下一步操作。
- 錯誤訊息需可理解且可行動，不只顯示代碼。
- 頁面上的查詢條件、表單資料、可持久化狀態，優先封裝成具名 class，不要散落為多個 component 成員變數。
- 需要跨重新整理或重進頁面保留的 query 條件，優先繼承 `PersistentBean`，初始化時 `load()`、查詢後 `save()`。

## Dialog 實作規範

- Dialog 內容容器優先使用 `nb-card`，不要自行拼裝一套 panel 容器。
- Dialog component 必須從 `@wec/components` 匯入 `dialogAnimation`，並於 component metadata 的 `animations` 註冊，容器元素套用 `@dialogAnimation`。
- Dialog 必須提供拖曳能力，優先使用 `cdkDrag`，並以 `.cdk-overlay-pane` 作為 `cdkDragRootElement`。
- Dialog 標題列必須作為唯一拖曳把手，於 `nb-card-header` 使用 `cdkDragHandle`，並以 `cursor: move;` 提示可拖曳；card body、footer 與內容區不可成為拖曳熱區。
- 若需限制拖曳範圍，優先使用 `cdkDragBoundary="body"`，不要手寫座標邏輯。
- 需要可縮放時，優先直接在 `nb-card` 上使用 `style="resize: both;"` 與必要的 overflow 控制。
- Dialog 若可縮放，應以容器 resize 為主，需同時考慮內容捲動與最小可用尺寸。
- 建議骨架如下：

```html
<nb-card
  @dialogAnimation
  style="resize: both;"
  cdkDrag
  cdkDragRootElement=".cdk-overlay-pane"
  cdkDragBoundary="body"
>
  <nb-card-header
    class="fx-row space-between middle medium"
    style="cursor: move;"
    cdkDragHandle
  >
    <span>Dialog</span>
    <nb-actions size="small">
      <nb-action icon="close-outline" (click)="onClose()"></nb-action>
    </nb-actions>
  </nb-card-header>
  <nb-card-body class="fx-column start medium"></nb-card-body>
</nb-card>
```

## 可近用性

- 元件與操作區需有足夠可點擊區域，避免誤觸。
- 表單控制項需有對應標籤或可辨識名稱。
- 鍵盤操作路徑需可完成主要流程。
- 顏色不作為唯一訊息來源，必要時補充文字或圖示。

## 正反例

```ts
// 正確
import { WecDateTimeComponent } from "@wec/components";
import { UserContext, SystemEvents } from "@wec/core";

// 錯誤
// import { WecDateTimeComponent } from 'projects/wec-components/src/lib/wec/components/date-time';
// import { UserContext } from 'projects/wec-core/src/lib/wec/core/model/user-context';
```

```html
<!-- 間距由父容器控制 -->
<section class="fx-row start middle medium">
  <div>子元件 A</div>
  <div>子元件 B</div>
</section>

<!-- Nebular 外觀用已驗證名稱 -->
<nb-tabset class="light-tabs">
  <nb-tab tabTitle="基本資料"></nb-tab>
  <nb-tab tabTitle="權限"></nb-tab>
</nb-tabset>

<nb-radio-group class="chip fx-row small">
  <nb-radio status="primary" value="enabled">啟用</nb-radio>
  <nb-radio status="primary" value="disabled">停用</nb-radio>
</nb-radio-group>
```
