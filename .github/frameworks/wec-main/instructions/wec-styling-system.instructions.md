---
applyTo: "**/*.{html,scss,css}"
---

# WEC 樣式系統

> 本文件涵蓋 Layout Classes、Nebular 外觀覆寫、文字樣式、表單輸入樣式、Icon Packs。
> 元件 API 請參閱 `wec-components.instructions.md`。
> 元件選型請參閱 `wec-component-selection.instructions.md`。

## 基本原則

1. **預設不新增 SCSS / `::ng-deep` / inline style** — 已有能力足以覆蓋絕大部分需求
2. **禁止硬編碼顏色值** — 使用 Nebular 語義變數（如 `--border-basic-color-3`、`--text-basic-color`）
3. **禁止擅自縮小元件尺寸** — 不得指定 `size="small"` 除非使用者明確要求
4. **客製樣式採最小增量原則** — 幾乎只有 `width` / `height` 需要手動指定
5. **名稱以本文件為準** — 若未列出，不可臆測 class 名稱

---

## Utility Layout Classes

### Flex 容器

| Class       | 說明                    |
| ----------- | ----------------------- |
| `fx-row`    | 橫向排列（flex row）    |
| `fx-column` | 直向排列（flex column） |

### 對齊/分布（搭配 `fx-row` / `fx-column`）

| Class                                           | 說明       |
| ----------------------------------------------- | ---------- |
| `start`, `center`, `end`                        | 主軸對齊   |
| `top`, `middle`, `bottom`                       | 交叉軸對齊 |
| `space-between`, `space-around`, `space-evenly` | 分布方式   |
| `wrap`                                          | 允許換行   |

### Grid 容器

| Class           | 說明      |
| --------------- | --------- |
| `gd-column`     | Grid 容器 |
| `fr-2` ~ `fr-6` | 等分欄數  |
| `gd-auto`       | 自動欄寬  |

### 內容尺寸

| Class       | 說明           |
| ----------- | -------------- |
| `fx-auto`   | 自適應內容寬度 |
| `fx-fill`   | 撐滿剩餘空間   |
| `full-size` | 滿版尺寸       |

### 間距等級

| Class    | 值      | 說明     |
| -------- | ------- | -------- |
| `tiny`   | 0.5rem  | 最小間距 |
| `small`  | 0.75rem | 小間距   |
| `medium` | 1rem    | 標準間距 |
| `large`  | 1.25rem | 大間距   |
| `giant`  | 1.5rem  | 最大間距 |

**軸向間距**（只控制單軸）：

| X 軸       | Y 軸       |
| ---------- | ---------- |
| `tiny-x`   | `tiny-y`   |
| `small-x`  | `small-y`  |
| `medium-x` | `medium-y` |
| `large-x`  | `large-y`  |
| `giant-x`  | `giant-y`  |

### 使用範例

```html
<!-- 橫向排列、垂直置中、中等間距 -->
<section class="fx-row middle medium">
  <div>Left</div>
  <div>Right</div>
</section>

<!-- Grid 三等分 -->
<div class="gd-column fr-3">
  <div>Col 1</div>
  <div>Col 2</div>
  <div>Col 3</div>
</div>

<!-- 水平間距、垂直無間距 -->
<div class="fx-row medium-x">
  <div>A</div>
  <div>B</div>
</div>
```

---

## Nebular 外觀覆寫能力

> 以下能力不是新功能元件，而是針對 Nebular 既有元件提供的外觀覆寫。
> 若需求是「外觀要求」而非「功能要求」，應優先從本節選用已驗證的外觀名稱。

### Tab 樣式

| 外觀名稱     | 套用對象    | 使用時機                               | 避免時機             |
| ------------ | ----------- | -------------------------------------- | -------------------- |
| `light-tabs` | `nb-tabset` | 卡片內資訊分頁、設定頁籤、輕量視覺分隔 | 頁籤過多容易擁擠     |
| `round`      | `nb-tabset` | 少量主題切換、segmented control        | 頁籤數量多或標題很長 |
| `vertical`   | `nb-tabset` | 左右分區管理頁面                       | 內容區本身就狹窄     |

```html
<nb-tabset class="light-tabs">
  <nb-tab tabTitle="基本資料"></nb-tab>
  <nb-tab tabTitle="權限"></nb-tab>
</nb-tabset>
```

**常見搭配**：`light-tabs` + `nb-card`、`vertical` + CRUD 左右分區

### Radio Group 樣式

| 外觀名稱             | 使用時機                               | 避免時機             |
| -------------------- | -------------------------------------- | -------------------- |
| `chip`               | 少量條件切換、狀態篩選、快速切換按鈕群 | 選項很多或文字很長   |
| `tabs` / `underline` | 像頁籤切換的單選操作                   | 需要多行換列的選項群 |
| `list`               | 清單式單選、佔滿整欄的選項群           | 只有 2-3 個短選項    |
| `rectangle`          | 一般區塊式單選                         | —                    |
| `radio-rectangle`    | 帶框矩形單選                           | —                    |
| `radio-underline`    | 帶底線單選                             | —                    |

- 套用對象：`nb-radio-group`
- 可搭配 status：`primary`, `success`, `info`, `warning`, `danger`, `basic`, `control`
- 選項數建議：2-5 個直接使用；6-10 個文字短可用；>10 個改用 `ng-select`

```html
<nb-radio-group class="chip fx-row small">
  <nb-radio status="primary" value="A">選項 A</nb-radio>
  <nb-radio status="primary" value="B">選項 B</nb-radio>
</nb-radio-group>
```

**常見搭配**：`chip` + `fx-row small`、`list` + `fx-column`、`tabs` + 搜尋區模式切換

### Checkbox 樣式

| 外觀名稱 | 使用時機                             | 避免時機             |
| -------- | ------------------------------------ | -------------------- |
| `chip`   | 多選標籤、條件過濾、快速選擇少量項目 | 大量選項與長文案     |
| `list`   | 清單式多選、整列可點擊的選項群       | 極短且需水平密集排列 |

```html
<nb-checkbox class="chip" status="success">已啟用</nb-checkbox>
```

**常見搭配**：`chip` + `fx-row small wrap`、`list` + `fx-column`

### Select 樣式

| 外觀名稱         | 使用時機                   | 避免時機                   |
| ---------------- | -------------------------- | -------------------------- |
| `cleanable`      | 查詢條件可快速清空         | —                          |
| `light-select`   | 篩選列、工具列等輕量輸入區 | 需強調主要輸入的表單主區塊 |
| `input-modified` | 標示欄位值已變更           | 不應作為預設狀態           |

```html
<nb-select class="cleanable light-select" placeholder="請選擇"></nb-select>
```

### Card 樣式

| 外觀名稱      | 套用對象  | 使用時機                     | 避免時機                   |
| ------------- | --------- | ---------------------------- | -------------------------- |
| `card-button` | `nb-card` | 儀表板入口卡、可點擊摘要卡片 | 純靜態不可點擊的卡片       |
| `no-divider`  | `nb-card` | 工具卡、簡潔資訊卡           | 需要強烈視覺分區的複雜表單 |

```html
<nb-card class="card-button no-divider">
  <nb-card-header>可點擊卡片</nb-card-header>
  <nb-card-body>內容</nb-card-body>
</nb-card>
```

### Button 外觀

| 能力                 | 說明         | 使用時機                       | 避免時機             |
| -------------------- | ------------ | ------------------------------ | -------------------- |
| `shape-round`        | 圓形按鈕     | 純圖示按鈕、工具列 icon button | 需要文字說明的主操作 |
| `appearance-ghost`   | 幽靈按鈕     | 次要操作、低干擾操作           | —                    |
| `appearance-filled`  | 填充按鈕     | 主要操作                       | —                    |
| `appearance-hero`    | 高視覺強度   | 主要 CTA                       | 同區塊不宜多個 hero  |
| `floating-end-start` | 浮動定位左下 | 卡片角落浮動操作               | —                    |
| `floating-end-end`   | 浮動定位右下 | 卡片角落浮動操作               | —                    |

### 其他 Nebular 外觀覆寫

已驗證覆寫檔存在：`accordion`, `calendar`, `context-menu`, `icon`, `layout`, `list-item`, `menu`, `popover`, `progress-bar`, `sidebar`, `stepper`。

> ⚠️ 使用這些元件的特定外觀前，應先確認 catalog 已有對應條目，不可直接臆測 class 名稱。

### 外觀需求寫法建議

| ✅ 正確                            | ❌ 錯誤                        |
| ---------------------------------- | ------------------------------ |
| 用 `nb-radio-group` 的 `chip` 外觀 | 自訂一個像 chip 的 radio class |
| 用 `nb-tabset.light-tabs` 呈現頁籤 | 自己寫一套 tab 樣式            |
| 用 `nb-card.no-divider` 做工具卡片 | 自訂無分隔線的 card class      |

---

## 文字樣式

### 基本文字 class

| Class            | 用途                        | 使用時機                       |
| ---------------- | --------------------------- | ------------------------------ |
| `text-bold`      | 強調文字 (font-weight: 500) | 區塊內關鍵值、需快速掃描的資料 |
| `text-hint`      | 提示文字、次要說明          | 欄位說明、表格輔助資訊         |
| `text-disabled`  | 停用狀態顏色                | 不可操作狀態、失效資訊         |
| `text-link`      | 連結樣式（hover 虛線底線）  | 連結型操作文字                 |
| `text-paragraph` | 標準段落文字                | 一般敘述內容                   |

### 狀態顏色

| Class          | 用途     |
| -------------- | -------- |
| `text-primary` | 主要顏色 |
| `text-success` | 成功狀態 |
| `text-info`    | 資訊狀態 |
| `text-warning` | 警告狀態 |
| `text-danger`  | 危險狀態 |
| `text-basic`   | 基本顏色 |

### Badge / Filled / Shape 組合

**淺色徽章**：`text-{status} badge`（如 `text-success badge`）
**填充徽章**：`text-{status}-filled`（如 `text-success-filled`）
**外框形狀**：`rectangle`、`round`

```html
<!-- 成功狀態圓形徽章 -->
<span class="text-success badge round">啟用中</span>

<!-- 填充警告標籤 -->
<span class="text-warning-filled">需注意</span>

<!-- 矩形資訊徽章 -->
<span class="text-info rectangle">通知</span>
```

### 版面與截斷

| Class                                                 | 用途                                  |
| ----------------------------------------------------- | ------------------------------------- |
| `text-flex`                                           | flex 佈局中壓縮文字區塊               |
| `text-truncated`                                      | 搭配 `text-flex` 使用，單行截斷省略號 |
| `breadcrumbs`, `breadcrumbs-nav`, `breadcrumbs-arrow` | 麵包屑導覽                            |

```html
<div class="text-flex">
  <span class="text-truncated">超長文字會自動截斷並顯示省略號...</span>
</div>
```

### 文字避免事項

- `text-bold`：不應整段大量使用
- `text-disabled`：不應用來表示一般說明文字
- `text-truncated`：不適合重要內容且無其他完整資訊來源
- `text-*-filled`：只適合短標記，不適合大段文字

---

## 文字階層使用指南

| 層級             | 用途                | 使用時機                         |
| ---------------- | ------------------- | -------------------------------- |
| `h1` ~ `h4`      | 主頁面/大型區塊標題 | 已有一致下邊距                   |
| `h5`             | 次區塊標題          | 卡片區、表單區、面板區標題       |
| `h6`             | 較小區塊標題        | 輔助分組標題                     |
| `label`          | 欄位標籤            | 已有既定字色/字重/字級，直接使用 |
| `text-paragraph` | 一般敘述內文        | —                                |
| `text-hint`      | 次要說明/提示       | 欄位補充說明                     |

**規則**：

- 頁面主標題優先 `h2` 或 `h3`，避免過大
- 卡片/區塊標題優先 `h5`
- 區塊小節標題優先 `h6`
- 不要為了字變大濫用 `h1`/`h2`
- 不要把 `label` 當一般說明文字
- 不要把 badge 當段落文字

```html
<div class="fx-column tiny">
  <label for="projectName">專案名稱</label>
  <input id="projectName" nbInput />
  <span class="text-hint">請輸入對外顯示名稱</span>
</div>
```

---

## 表單輸入樣式

### Input / Select 外觀 class

| Class            | 說明                             | 使用時機                       | 避免時機                     |
| ---------------- | -------------------------------- | ------------------------------ | ---------------------------- |
| `light-input`    | 輕量 input（套用 thin-box 視覺） | 查詢條件列、工具列、高密度表單 | 需強調主欄位的長表單主編輯區 |
| `thin-box`       | 下底線型輸入外觀                 | 精簡查詢列                     | —                            |
| `input-modified` | 標示欄位值已變更                 | 編輯表單中提示已異動           | 不當預設樣式                 |
| `plain-disabled` | disabled 接近純文字呈現          | 唯讀檢視模式                   | 仍需強調互動性的 disabled    |
| `input-percent`  | 百分比欄位容器（自帶 %）         | 百分比輸入                     | —                            |
| `light-select`   | 輕量 select 外觀                 | 篩選列、工具列                 | —                            |
| `cleanable`      | select 可清除外觀                | 查詢條件                       | —                            |

### 尺寸與類型 class

| Class         | 用途             |
| ------------- | ---------------- |
| `date-field`  | 日期欄位寬度     |
| `time-field`  | 時間欄位寬度     |
| `range-field` | 區間欄位最小寬度 |

### 使用範例

```html
<!-- 查詢列：輕量 input + 輕量 select -->
<section class="fx-row middle small">
  <wec-form-item label="日期">
    <input nbInput class="date-field light-input" />
  </wec-form-item>
  <wec-form-item label="狀態">
    <nb-select class="light-select cleanable">
      <nb-option value="enabled">啟用</nb-option>
      <nb-option value="disabled">停用</nb-option>
    </nb-select>
  </wec-form-item>
</section>

<!-- 唯讀檢視 -->
<section class="plain-disabled">
  <wec-form-item label="唯讀欄位">
    <input nbInput disabled value="系統自動產生" />
  </wec-form-item>
</section>
```

---

## Icon Packs

> 使用方式：`<nb-icon icon="iconName" pack="packName"></nb-icon>`
> 不指定 `pack` 時預設使用 eva-icons（Nebular 內建）

### eva-icons（預設，不需指定 pack）

常用圖表 icon：`activity-outline`, `bar-chart-outline`, `bar-chart-2-outline`, `pie-chart-outline`, `trending-up-outline`, `trending-down-outline`, `grid-outline`, `layers-outline`, `globe-2-outline`, `flip-2-outline`, `radio-button-off-outline`

完整清單：[eva-icons](https://akveo.github.io/eva-icons/)

### `app-outline` pack

- 用途：應用程式功能圖示
- 可用 icon：`IMX`, `Alarm`, `ATS`, `BOM`, `CPR`, `EACS`, `EDA`, `EDWM`, `EFORM`, `EMSS`, `EPMS`, `FDC`, `FMCS`, `QRA`, `QMS`, `IIDS`, `IPQC`, `MAP`, `MES`, `OFFLINESPC`, `PARTS`, `R2R`, `REPORT`, `RMS`, `ROEE`, `UM`, `UPMS`, `VNC`, `VSC`, `WAT`, `WDMS`, `WPOS`, `AECC`, `YIDA`, `IIMS`, `IAPC`, `IEIS`, `LIAS`, `COP`, `HELP`, `WTMP`, `AIAS`, `LLM`

```html
<nb-icon icon="REPORT" pack="app-outline"></nb-icon>
```

### `imx` pack

- 用途：通用功能圖示
- 可用 icon：`acute`, `air`, `api`, `approval`, `barcode`, `bomb`, `borg`, `box`, `build`, `calculate`, `campaign`, `chat`, `compress`, `database`, `deceased`, `demography`, `destruction`, `diamond`, `domain`, `earthquake`, `ecg`, `eco`, `expand`, `experiment`, `extension`, `factory`, `feedback`, `flowchart`, `flowsheet`, `forklift`, `function`, `functions`, `gavel`, `hive`, `hourglass`, `interests`, `join`, `keep`, `key`, `landscape`, `memory`, `merge`, `movie`, `monitoring`, `psychiatry`, `radar`, `rainy`, `rebase`, `repartition`, `rocket`, `rule`, `savings`, `scale`, `school`, `siren`, `speed`, `straighten`, `stethoscope`, `timeline`, `tornato`, `traffic`, `transcribe`, `trolley`, `verified`, `villa`, `warehouse`, `webhook`

### `imx-outline` pack

- 用途：輪廓線條風格圖示
- 可用 icon：`automation`, `calendar`, `centralized`, `chemical`, `dashboard`, `database`, `equipment`, `flow`, `folder`, `foup`, `hold`, `inventory`, `layers`, `lot`, `material`, `overlay`, `printer`, `setting`, `stopwatch`, `target`, `users`, `wrench`, `EA`, `NPW`, `WIP`, `export`, `import`, `correlation`, `IISS`, `eda`, `vsc`

### `imx-fill` pack

- 用途：填充風格圖示
- 可用 icon：`folder`

### `imx-action-outline` pack

- 用途：動作類輪廓圖示
- 可用 icon：`database`, `export`, `import`, `owner`
