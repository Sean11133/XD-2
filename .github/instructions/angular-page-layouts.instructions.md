---
description: "使用時機: 前端頁面開發時選擇標準頁面版型骨架，確保版面一致性與專業度"
applyTo: "**/*.{html,ts}"
---

# 標準頁面版型骨架

> 本文件定義 5 種 WEC 企業後台常見頁面版型。
> @dev 開發前端頁面時，**MUST** 先從以下版型選擇最接近的骨架再開始實作。
> @architect 設計 plan.md 時，**MUST** 在 Section 6.5 為每個頁面指定採用的版型。

---

## 版型總覽

| 版型  | 名稱                 | 典型場景           |
| ----- | -------------------- | ------------------ |
| **A** | Master-Detail 列表頁 | CRUD 列表、查詢頁  |
| **B** | 表單頁               | 新增/編輯表單      |
| **C** | 列表+側邊明細        | Master-Detail 雙欄 |
| **D** | Tab 分頁設定頁       | 系統設定、多區段   |
| **E** | Dashboard 儀表板     | 概覽、KPI          |

---

## 版型 A：Master-Detail 列表頁

**場景**：CRUD 列表、查詢頁、資料管理

**結構**：查詢條件區 → 操作列 → AG-Grid 列表（fx-fill 撐滿）

```html
<!-- 版型 A：Master-Detail 列表頁 -->
<div class="fx-column full-size medium">
  <!-- 查詢條件區 -->
  <wec-field-group groupTitle="查詢條件" fxLayout="row" fxLayoutGap="medium">
    <wec-form-item label="日期" labelWidth="80px">
      <wec-datetime [(date)]="query.date"></wec-datetime>
    </wec-form-item>
    <wec-form-item label="狀態" labelWidth="80px">
      <nb-select [(selected)]="query.status" class="cleanable">
        <nb-option value="">全部</nb-option>
        <nb-option value="active">啟用</nb-option>
        <nb-option value="inactive">停用</nb-option>
      </nb-select>
    </wec-form-item>
  </wec-field-group>

  <!-- 操作列 -->
  <div class="fx-row space-between middle">
    <div class="fx-row small">
      <button nbButton status="primary" (click)="onSearch()">查詢</button>
      <button nbButton status="basic" (click)="onReset()">清除</button>
    </div>
    <div class="fx-row small">
      <button nbButton status="info" (click)="onAdd()">新增</button>
    </div>
  </div>

  <!-- AG-Grid 列表（撐滿剩餘高度） -->
  <ag-grid-angular class="ag-theme-balham fx-fill" [gridOptions]="gridOptions">
  </ag-grid-angular>
</div>
```

**關鍵規則**：

- 查詢條件區用 `wec-field-group` 包裹，`fxLayout="row"` 橫向排列
- 所有 `wec-form-item` 設定統一的 `labelWidth`（以最長 label 為準）
- AG-Grid 使用 `fx-fill` 撐滿可用高度，使用 `AgGridOptions` 初始化
- 操作按鈕區左側查詢/清除、右側新增/匯出（`space-between`）

**❌ 常見錯誤**：

```html
<!-- ❌ 查詢條件用 div 而非 wec-field-group -->
<div class="search-area"><label>日期</label><input /></div>

<!-- ❌ AG-Grid 未使用 fx-fill 導致高度不足 -->
<ag-grid-angular
  class="ag-theme-balham"
  style="height: 400px;"
></ag-grid-angular>

<!-- ❌ 按鈕沒有用 fx-row 排列，間距用 margin -->
<button style="margin-right: 8px;">查詢</button>
<button>新增</button>
```

---

## 版型 B：表單頁

**場景**：新增/編輯表單、詳細資料編輯

**結構**：nb-card 包裹表單 → wec-field-group 分組 → 按鈕 footer 靠右

```html
<!-- 版型 B：表單頁 -->
<nb-card class="full-size">
  <nb-card-header>
    <h5>新增項目</h5>
  </nb-card-header>

  <nb-card-body class="fx-column medium">
    <!-- 基本資料分組 -->
    <wec-field-group groupTitle="基本資料">
      <div class="gd-column fr-2 medium">
        <wec-form-item
          label="名稱"
          labelWidth="100px"
          [control]="form.controls.name"
          [required]="true"
        >
          <input nbInput formControlName="name" />
        </wec-form-item>
        <wec-form-item
          label="代碼"
          labelWidth="100px"
          [control]="form.controls.code"
          [required]="true"
        >
          <input nbInput formControlName="code" />
        </wec-form-item>
        <wec-form-item label="說明" labelWidth="100px">
          <input nbInput formControlName="description" />
        </wec-form-item>
        <wec-form-item label="狀態" labelWidth="100px">
          <nb-toggle [(checked)]="isActive">啟用</nb-toggle>
        </wec-form-item>
      </div>
    </wec-field-group>

    <!-- 進階設定分組 -->
    <wec-field-group groupTitle="進階設定" [collapsible]="true">
      <div class="gd-column fr-2 medium">
        <!-- 進階欄位 -->
      </div>
    </wec-field-group>
  </nb-card-body>

  <!-- 按鈕 footer 靠右 -->
  <nb-card-footer class="fx-row end medium">
    <button nbButton status="basic" (click)="onCancel()">取消</button>
    <button nbButton status="primary" (click)="onSave()">儲存</button>
  </nb-card-footer>
</nb-card>
```

**關鍵規則**：

- 整頁用 `nb-card` 包裹，header 放標題、body 放表單、footer 放按鈕
- 欄位用 `gd-column fr-2`（或 `fr-3`）做多欄排列
- 分組區塊用 `wec-field-group`，次要區塊可設 `[collapsible]="true"`
- `labelWidth` 統一以同一 field-group 內最長 label 為準
- footer 按鈕靠右（`fx-row end`），取消在前、確認在後

**❌ 常見錯誤**：

```html
<!-- ❌ 表單直接堆疊不分組 -->
<div>
  <label>名稱</label><input /> <label>代碼</label><input /> <label>說明</label
  ><input />
</div>

<!-- ❌ 按鈕靠左或使用 inline style 對齊 -->
<div style="text-align: right;">
  <button>儲存</button>
</div>

<!-- ❌ 每個欄位不同的 labelWidth -->
<wec-form-item label="名" labelWidth="40px">...</wec-form-item>
<wec-form-item label="電子郵件地址" labelWidth="140px">...</wec-form-item>
```

---

## 版型 C：列表+側邊明細

**場景**：Master-Detail 雙欄、左側列表右側明細

**結構**：split-pane 左列表右明細

```html
<!-- 版型 C：列表+側邊明細 -->
<div class="fx-row full-size">
  <!-- 左側列表 -->
  <as-split direction="horizontal" unit="percent">
    <as-split-area [size]="40">
      <div class="fx-column full-size medium">
        <!-- 搜尋列 -->
        <div class="fx-row middle small">
          <input
            nbInput
            placeholder="搜尋..."
            class="fx-fill light-input"
            [(ngModel)]="filterKeyword"
            name="filter"
          />
          <button nbButton status="info" size="small" (click)="onAdd()">
            <nb-icon icon="plus-outline"></nb-icon>
          </button>
        </div>

        <!-- 列表 -->
        <wec-check-list
          [dataProvider]="items"
          [selectedItems]="selectedItems"
          (selectedItemsChange)="onSelect($event)"
        >
        </wec-check-list>
      </div>
    </as-split-area>

    <!-- 右側明細 -->
    <as-split-area [size]="60">
      <wec-split-indicator></wec-split-indicator>
      <div class="fx-column full-size medium">
        @if (selectedItem) {
        <!-- 明細內容：採版型 B 的表單結構 -->
        <wec-field-group groupTitle="詳細資料">
          <div class="gd-column fr-2 medium">
            <wec-form-item label="名稱" labelWidth="80px">
              <input nbInput [(ngModel)]="selectedItem.name" name="name" />
            </wec-form-item>
          </div>
        </wec-field-group>
        } @else {
        <div class="fx-column center middle fx-fill">
          <span class="text-hint">請從左側選擇項目</span>
        </div>
        }
      </div>
    </as-split-area>
  </as-split>
</div>
```

**關鍵規則**：

- 使用 `angular-split`（`as-split`）做分割，而非自建 flex 分割
- 搭配 `wec-split-indicator` 提供收合功能
- 左側列表佔 40%，右側明細佔 60%（可拖曳調整）
- 右側需處理「尚未選取」的空資料狀態
- 右側明細內部可復用版型 B 的表單結構

**❌ 常見錯誤**：

```html
<!-- ❌ 用 fx-row 硬分兩欄且無法拖曳調整 -->
<div class="fx-row">
  <div style="width: 40%;">列表</div>
  <div style="width: 60%;">明細</div>
</div>

<!-- ❌ 右側不處理空狀態 -->
<div class="detail">
  {{ selectedItem.name }}
  <!-- selectedItem 可能為 null -->
</div>
```

---

## 版型 D：Tab 分頁設定頁

**場景**：系統設定、多區段設定、Profile 頁面

**結構**：nb-tabset（light-tabs 外觀）包裹多個 nb-tab

```html
<!-- 版型 D：Tab 分頁設定頁 -->
<nb-card class="full-size">
  <nb-card-header>
    <h5>系統設定</h5>
  </nb-card-header>

  <nb-card-body>
    <nb-tabset class="light-tabs">
      <!-- Tab 1：一般設定 -->
      <nb-tab tabTitle="一般設定">
        <div class="fx-column medium">
          <wec-field-group groupTitle="基本參數">
            <div class="gd-column fr-2 medium">
              <wec-form-item label="系統名稱" labelWidth="100px">
                <input nbInput [(ngModel)]="settings.name" name="name" />
              </wec-form-item>
              <wec-form-item label="逾時(秒)" labelWidth="100px">
                <input
                  nbInput
                  type="number"
                  [(ngModel)]="settings.timeout"
                  name="timeout"
                />
              </wec-form-item>
            </div>
          </wec-field-group>
        </div>
      </nb-tab>

      <!-- Tab 2：通知設定 -->
      <nb-tab tabTitle="通知設定">
        <div class="fx-column medium">
          <wec-field-group groupTitle="郵件通知">
            <nb-toggle [(checked)]="settings.emailEnabled"
              >啟用郵件通知</nb-toggle
            >
          </wec-field-group>
        </div>
      </nb-tab>

      <!-- Tab 3：權限設定 -->
      <nb-tab tabTitle="權限設定">
        <div class="fx-column medium">
          <!-- 權限內容 -->
        </div>
      </nb-tab>
    </nb-tabset>
  </nb-card-body>

  <nb-card-footer class="fx-row end medium">
    <button nbButton status="basic" (click)="onCancel()">取消</button>
    <button nbButton status="primary" (click)="onSave()">儲存</button>
  </nb-card-footer>
</nb-card>
```

**關鍵規則**：

- 外層用 `nb-card` 包裹，`nb-tabset` 放在 `nb-card-body` 內
- 使用 `light-tabs` 外觀以保持卡片內的視覺輕量
- 每個 tab 內部用 `fx-column medium` 做垂直排列
- 共用的儲存/取消按鈕放在 `nb-card-footer`（不在各 tab 內）
- tab 數量建議 2-5 個，過多考慮左側導覽（版型 C 變形）

**❌ 常見錯誤**：

```html
<!-- ❌ 沒用 light-tabs 外觀，tab 視覺過重 -->
<nb-tabset>
  <nb-tab tabTitle="設定">...</nb-tab>
</nb-tabset>

<!-- ❌ 每個 tab 各放一組儲存按鈕 -->
<nb-tab tabTitle="一般">
  <button>儲存一般設定</button>
</nb-tab>
<nb-tab tabTitle="通知">
  <button>儲存通知設定</button>
</nb-tab>
```

---

## 版型 E：Dashboard 儀表板

**場景**：概覽頁、KPI 指標、報表總覽

**結構**：上方 KPI 卡片列 → 下方圖表+表格區

```html
<!-- 版型 E：Dashboard 儀表板 -->
<div class="fx-column full-size medium">
  <!-- KPI 卡片列 -->
  <div class="fx-row medium">
    <nb-card class="fx-fill">
      <nb-card-body class="fx-column center middle">
        <span class="text-hint">總數</span>
        <h3 class="text-primary">{{ kpi.total }}</h3>
      </nb-card-body>
    </nb-card>
    <nb-card class="fx-fill">
      <nb-card-body class="fx-column center middle">
        <span class="text-hint">進行中</span>
        <h3 class="text-info">{{ kpi.inProgress }}</h3>
      </nb-card-body>
    </nb-card>
    <nb-card class="fx-fill">
      <nb-card-body class="fx-column center middle">
        <span class="text-hint">已完成</span>
        <h3 class="text-success">{{ kpi.completed }}</h3>
      </nb-card-body>
    </nb-card>
    <nb-card class="fx-fill">
      <nb-card-body class="fx-column center middle">
        <span class="text-hint">異常</span>
        <h3 class="text-danger">{{ kpi.error }}</h3>
      </nb-card-body>
    </nb-card>
  </div>

  <!-- 圖表 + 表格區 -->
  <div class="fx-row medium fx-fill">
    <!-- 圖表區 -->
    <nb-card class="fx-fill">
      <nb-card-header><h5>趨勢圖</h5></nb-card-header>
      <nb-card-body>
        <!-- ag-charts 或 echarts -->
      </nb-card-body>
    </nb-card>

    <!-- 表格/摘要區 -->
    <nb-card class="fx-fill">
      <nb-card-header><h5>近期活動</h5></nb-card-header>
      <nb-card-body>
        <ag-grid-angular
          class="ag-theme-balham fx-fill"
          [gridOptions]="recentGridOptions"
        >
        </ag-grid-angular>
      </nb-card-body>
    </nb-card>
  </div>
</div>
```

**關鍵規則**：

- KPI 卡片用 `fx-row` + `fx-fill` 均分，`nb-card` 包裹
- KPI 值用 `h3` + 狀態顏色（`text-primary`、`text-success`、`text-danger`）
- KPI 標籤用 `text-hint`
- 下方圖表/表格用 `fx-row` 並排、`fx-fill` 撐滿
- Dashboard 不需要 footer 按鈕列

**❌ 常見錯誤**：

```html
<!-- ❌ KPI 用 div + inline style 排列 -->
<div style="display: flex; gap: 16px;">
  <div style="flex: 1; background: #f0f0f0; padding: 16px;">
    <span>總數</span><b>100</b>
  </div>
</div>

<!-- ❌ KPI 數字沒有語義顏色區分 -->
<h3>100</h3>
<h3>50</h3>
<h3>30</h3>
<h3>5</h3>
```

---

## 版型選擇決策

```
需要開發什麼類型的頁面？
│
├─ 有資料列表 + 查詢條件？
│   │
│   ├─ 列表右側即時顯示明細？ → 版型 C（列表+側邊明細）
│   └─ 查詢→列表→點選進詳細頁？ → 版型 A（Master-Detail 列表頁）
│
├─ 純表單（新增/編輯/檢視）？ → 版型 B（表單頁）
│
├─ 多個設定區段？ → 版型 D（Tab 分頁設定頁）
│
└─ 概覽 / KPI / 報表？ → 版型 E（Dashboard 儀表板）
```

---

## 版型組合

實際頁面可能需要組合多個版型：

| 組合          | 說明                                      |
| ------------- | ----------------------------------------- |
| A + B         | 列表頁點選後跳轉到表單頁（最常見的 CRUD） |
| A + Dialog(B) | 列表頁點選後彈出 Dialog 編輯（輕量 CRUD） |
| C + D         | 左側樹狀分類、右側 Tab 分頁設定           |
| E + A         | 上方 Dashboard、下方切換到列表明細        |

---

## 間距與尺寸參考

| 項目               | 建議值                                        |
| ------------------ | --------------------------------------------- |
| 頁面外層間距       | `medium`（1rem）                              |
| 查詢條件區欄位間距 | `medium`（1rem）                              |
| 表單欄位間距       | `medium`（1rem）                              |
| 按鈕間距           | `small`（0.75rem）                            |
| KPI 卡片間距       | `medium`（1rem）                              |
| labelWidth         | 以同區塊最長 label 為準，通常 80px-120px      |
| 表單欄數           | 2 欄（`fr-2`）最常見，寬螢幕可 3 欄（`fr-3`） |
