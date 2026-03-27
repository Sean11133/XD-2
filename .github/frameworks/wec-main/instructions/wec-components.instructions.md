---
applyTo: "**/*.{ts,html}"
---

# WEC Components Library - Copilot Instructions

> 企業級 Angular UI 元件庫，基於 Angular 17+ 和 Nebular Theme 開發  
> 請始終優先使用這些元件而不是原始 HTML 元素

---

## 📋 目錄

- [廢棄元件警告](#廢棄元件警告)
- [元件分類](#元件分類)
  - [基本 UI 元件](#基本-ui-元件)
  - [表單元件](#表單元件)
  - [資料展示元件](#資料展示元件)
  - [日期時間元件](#日期時間元件)
  - [佈局元件](#佈局元件)
  - [對話框元件](#對話框元件)
  - [工具提示元件](#工具提示元件)
  - [AG Grid 擴展](#ag-grid-擴展)
- [指令 (Directives)](#指令-directives)
- [服務 (Services)](#服務-services)
- [類型定義](#類型定義)
- [使用原則](#使用原則)

---

## ⚠️ 廢棄元件警告

**以下元件將於 2027 年移除，請勿在新專案中使用：**

| 廢棄元件           | 推薦替代方案                          | 移除時程 |
| ------------------ | ------------------------------------- | -------- |
| `wec-button-group` | `nb-button-group` 或客製化按鈕群組    | 2027     |
| `wec-combo-box`    | `nb-select` 或 `@ng-select/ng-select` | 2027     |

⚠️ **請立即開始遷移現有程式碼，避免在新開發中使用這些元件！**

---

## 🎨 通用樣式系統

> 文字狀態顏色、徽章樣式、文字排版 → 參見 `.github/frameworks/wec-main/instructions/wec-styling-system.instructions.md`

---

## 📦 元件分類

### 基本 UI 元件

#### ⚠️ wec-button-group（已廢棄）

**此元件將於 2027 年移除，請使用 `nb-button-group` 替代**

#### wec-toggle-chip

切換式晶片元件，提供開關狀態視覺回饋。

**API:**

- `@Input() checked: boolean` - 選中狀態
- `@Input() disabled: boolean` - 禁用狀態
- `@Output() checkedChange: EventEmitter<boolean>` - 狀態變更事件

```html
<wec-toggle-chip [checked]="isSelected" (checkedChange)="onToggle($event)">
  選項標籤
</wec-toggle-chip>
```

#### wec-switch-button

開關按鈕元件，雙狀態切換功能。

**API:**

- `@Input() checked: boolean` - 選中狀態
- `@Input() disabled: boolean = false` - 禁用狀態
- `@Input() width: number = 0` - 按鈕寬度
- `@Input() selectedLabel: string = 'On'` - 選中狀態標籤
- `@Input() deselectedLabel: string = 'Off'` - 未選中狀態標籤
- `@Input() selectedStatus: NbComponentStatus = 'primary'` - 選中外觀
- `@Input() deselectedStatus: NbComponentStatus = 'primary'` - 未選中外觀
- `@Output() checkedChange: EventEmitter<boolean>` - 狀態變更事件

```html
<wec-switch-button
  [checked]="isEnabled"
  selectedLabel="啟用"
  deselectedLabel="停用"
  (checkedChange)="onSwitchChange($event)"
>
</wec-switch-button>
```

#### wec-split-button

分割按鈕元件，結合主要動作和下拉選單。

**API:**

- `@Input() status: NbComponentStatus = 'primary'` - 按鈕外觀樣式

```html
<wec-split-button status="primary">
  主要動作
  <!-- 下拉選單內容 -->
</wec-split-button>
```

#### wec-goto-top

回到頂部按鈕元件。

```html
<wec-goto-top></wec-goto-top>
```

---

### 表單元件

#### wec-form-item

表單項目包裝元件，提供統一的標籤和錯誤顯示。

**API:**

- `@Input() label: string = ' '` - 標籤文字
- `@Input() labelWidth: string = ''` - 標籤寬度
- `@Input() labelFontWeight: string = ''` - 標籤字體粗細
- `@Input() control: AbstractControlDirective` - 表單控制項
- `@Input() required: boolean` - 是否必填
- `@Input() min: number` - 最小值
- `@Input() max: number` - 最大值
- `@Input() requiredTrue: boolean` - 是否必須為 true

```html
<wec-form-item label="使用者名稱" required>
  <input nbInput formControlName="userName" />
</wec-form-item>
```

---

#### Nebular Checkbox 客製樣式

WEC Framework 為 Nebular Checkbox 提供額外的樣式類別，可呈現不同外觀。

**可用樣式類別：**

- `.list` - 清單項目樣式，帶 hover 效果，寬度填滿容器
- `.chip` - 晶片樣式，圓角背景，適合標籤選擇
- `.status-{status}` - 狀態顏色（primary, success, info, warning, danger）

**API (繼承自 nb-checkbox):**

- `@Input() checked: boolean` - 選中狀態
- `@Input() disabled: boolean` - 禁用狀態
- `@Input() status: NbComponentStatus` - 狀態樣式
- `@Output() checkedChange: EventEmitter<boolean>` - 狀態變更事件

**範例：**

```html
<!-- ✅ List 樣式 - 適合垂直清單 -->
<nb-checkbox class="list" [(checked)]="option1"> 選項一 </nb-checkbox>
<nb-checkbox class="list" [(checked)]="option2"> 選項二 </nb-checkbox>

<!-- ✅ List 樣式 + 狀態顏色 -->
<nb-checkbox class="list status-success" [(checked)]="isEnabled">
  啟用功能
</nb-checkbox>
<nb-checkbox class="list status-danger" [(checked)]="isDeleted">
  刪除項目
</nb-checkbox>

<!-- ✅ Chip 樣式 - 適合水平排列的標籤 -->
<div class="fx-row small">
  <nb-checkbox class="chip" [(checked)]="tag1">技術</nb-checkbox>
  <nb-checkbox class="chip" [(checked)]="tag2">設計</nb-checkbox>
  <nb-checkbox class="chip" [(checked)]="tag3">管理</nb-checkbox>
</div>

<!-- ✅ Chip 樣式 + 狀態顏色 -->
<div class="fx-row small">
  <nb-checkbox class="chip status-primary" [(checked)]="filter1"
    >已完成</nb-checkbox
  >
  <nb-checkbox class="chip status-warning" [(checked)]="filter2"
    >進行中</nb-checkbox
  >
  <nb-checkbox class="chip status-info" [(checked)]="filter3"
    >待處理</nb-checkbox
  >
</div>

<!-- ✅ 禁用狀態 -->
<nb-checkbox class="list" [checked]="true" [disabled]="true">
  已禁用的選項
</nb-checkbox>

<!-- ❌ 錯誤：不要混用 list 和 chip -->
<nb-checkbox class="list chip" [(checked)]="invalid">錯誤用法</nb-checkbox>

<!-- ❌ 錯誤：不要在標準 checkbox 上使用狀態類別 -->
<nb-checkbox class="status-primary" [(checked)]="invalid">
  需要搭配 list 或 chip 使用
</nb-checkbox>
```

**TypeScript 範例：**

```typescript
export class MyComponent {
  // List checkbox
  permissions = {
    read: true,
    write: false,
    delete: false,
  };

  // Chip checkbox
  selectedTags = {
    tech: true,
    design: false,
    management: true,
  };

  onPermissionChange(permission: string, checked: boolean): void {
    this.permissions[permission] = checked;
    console.log("Updated permissions:", this.permissions);
  }
}
```

**使用時機：**

- **List 樣式**：垂直清單、權限選擇、功能開關、項目篩選
- **Chip 樣式**：標籤選擇、分類篩選、水平排列的選項群組

---

#### Nebular Radio Group 客製樣式

WEC Framework 為 Nebular Radio Group 提供多種樣式類別，支援不同的視覺呈現方式。

**可用樣式類別：**

- `.rectangle` - 矩形按鈕樣式
- `.underline` - 底線樣式
- `.tabs` - 頁籤樣式（與 underline 類似）
- `.list` - 清單項目樣式，帶邊框和滾動
- `.chip` - 晶片樣式，圓角背景
- `.light-border` / `.border` - 搭配 list 使用，顯示邊框和滾動容器

**API (繼承自 nb-radio-group):**

- `@Input() value: any` - 選中的值
- `@Input() name: string` - Radio group 名稱
- `@Input() disabled: boolean` - 禁用狀態
- `@Output() valueChange: EventEmitter<any>` - 值變更事件

**範例：**

```html
<!-- ✅ Rectangle 樣式 - 矩形按鈕外觀 -->
<nb-radio-group class="rectangle" [(value)]="priority" name="priority">
  <nb-radio value="high" status="danger">高優先級</nb-radio>
  <nb-radio value="medium" status="warning">中優先級</nb-radio>
  <nb-radio value="low" status="success">低優先級</nb-radio>
</nb-radio-group>

<!-- ✅ Underline/Tabs 樣式 - 底線樣式，適合頁籤切換 -->
<nb-radio-group class="tabs" [(value)]="activeTab" name="tabs">
  <nb-radio value="overview" status="primary">概覽</nb-radio>
  <nb-radio value="details" status="primary">詳情</nb-radio>
  <nb-radio value="history" status="primary">歷史</nb-radio>
</nb-radio-group>

<!-- ✅ List 樣式 - 清單項目外觀 -->
<nb-radio-group class="list" [(value)]="selectedItem" name="items">
  <nb-radio value="item1" status="primary">項目一</nb-radio>
  <nb-radio value="item2" status="primary">項目二</nb-radio>
  <nb-radio value="item3" status="primary">項目三</nb-radio>
</nb-radio-group>

<!-- ✅ List 樣式 + 邊框容器 - 帶滾動的清單 -->
<nb-radio-group
  class="list light-border fx-column"
  [(value)]="selected"
  name="scrollList"
  style="height: 200px;"
>
  <nb-radio value="opt1" status="primary">選項 1</nb-radio>
  <nb-radio value="opt2" status="primary">選項 2</nb-radio>
  <nb-radio value="opt3" status="primary">選項 3</nb-radio>
  <nb-radio value="opt4" status="primary">選項 4</nb-radio>
  <nb-radio value="opt5" status="primary">選項 5</nb-radio>
  <nb-radio value="opt6" status="primary">選項 6</nb-radio>
</nb-radio-group>

<!-- ✅ Chip 樣式 - 晶片外觀，適合水平排列 -->
<nb-radio-group class="chip" [(value)]="category" name="category">
  <nb-radio value="tech" status="primary">技術</nb-radio>
  <nb-radio value="design" status="info">設計</nb-radio>
  <nb-radio value="business" status="success">商業</nb-radio>
</nb-radio-group>

<!-- ✅ 垂直排列 Rectangle 樣式 -->
<nb-radio-group
  class="rectangle fx-column"
  [(value)]="paymentMethod"
  name="payment"
>
  <nb-radio value="credit" status="primary">信用卡</nb-radio>
  <nb-radio value="paypal" status="primary">PayPal</nb-radio>
  <nb-radio value="bank" status="primary">銀行轉帳</nb-radio>
</nb-radio-group>

<!-- ✅ 禁用狀態 -->
<nb-radio-group
  class="rectangle"
  [value]="'option1'"
  [disabled]="true"
  name="disabled"
>
  <nb-radio value="option1" status="primary">已禁用的選項</nb-radio>
  <nb-radio value="option2" status="primary">也禁用</nb-radio>
</nb-radio-group>

<!-- ❌ 錯誤：不要混用多種樣式 -->
<nb-radio-group class="rectangle list" [(value)]="invalid">
  錯誤用法
</nb-radio-group>

<!-- ❌ 錯誤：list 樣式需要設定 status -->
<nb-radio-group class="list" [(value)]="value">
  <nb-radio value="1">缺少 status 屬性</nb-radio>
</nb-radio-group>
```

**TypeScript 範例：**

```typescript
export class MyComponent {
  // Rectangle style
  priority: "high" | "medium" | "low" = "medium";

  // Tabs/Underline style
  activeTab: "overview" | "details" | "history" = "overview";

  // List style
  selectedItem = "item1";

  // Chip style
  category: "tech" | "design" | "business" = "tech";

  // Payment method
  paymentMethod: "credit" | "paypal" | "bank" = "credit";

  onPriorityChange(value: string): void {
    console.log("Priority changed to:", value);
    // 根據優先級執行不同邏輯
  }

  onTabChange(tab: string): void {
    console.log("Active tab:", tab);
    // 載入對應頁籤內容
  }
}
```

**使用時機：**

- **Rectangle**：按鈕式選擇、優先級選擇、狀態選擇
- **Underline/Tabs**：頁籤切換、導航選單
- **List**：垂直清單選擇、帶滾動的長選項列表
- **Chip**：標籤分類、水平排列的類別選擇

**樣式比較表：**

| 樣式類別     | 外觀描述           | 適用場景             | 排列方向  |
| ------------ | ------------------ | -------------------- | --------- |
| `.rectangle` | 矩形按鈕，圓角背景 | 按鈕式選擇、狀態切換 | 水平/垂直 |
| `.underline` | 底線指示選中狀態   | 頁籤導航、內容切換   | 水平      |
| `.tabs`      | 同 underline       | 頁籤切換             | 水平      |
| `.list`      | 清單項目樣式       | 垂直選項列表、長清單 | 垂直      |
| `.chip`      | 晶片樣式，圓形背景 | 標籤選擇、分類篩選   | 水平      |

---

#### ⚠️ wec-combo-box（已廢棄）

**此元件將於 2027 年移除，請使用 `nb-select` 或 `@ng-select/ng-select` 替代**

多選下拉選單元件,基於 ng-select 擴展,提供多選功能、標籤顯示、Transfer List 整合等進階功能。

- Inputs:
  - `items: any[]` - 選項清單,預設為 []
  - `selected: any` - 選中的項目 (支援 ngModel 雙向綁定)
  - `bindValue: string` - 綁定值的屬性名稱
  - `bindLabel: string` - 顯示標籤的屬性名稱
  - `placeholder: string` - 提示文字,預設為 'Select items'
  - `appendTo: string` - 下拉選單附加到的元素,預設為 'body'
  - `disabled: boolean` - 禁用狀態,預設為 false
  - `showFooter: boolean` - 是否顯示 footer,預設為 false
  - `selectableGroup: boolean` - 群組是否可選,預設為 false (尚未實作)
  - `selectableGroupAsModel: boolean` - 群組作為模型,預設為 true (尚未實作)
  - `groupBy: string | function` - 群組分類屬性或函數 (尚未實作)
  - `groupValue: function` - 群組值處理函數 (尚未實作)
- Outputs:
  - `(selectedChange)` - 選擇變更事件 (推薦使用)
  - `(change)` - 變更事件 (已棄用,請使用 selectedChange)
  - `(blur)` - 失去焦點事件
  - `(focus)` - 獲得焦點事件
  - `(open)` - 開啟下拉選單事件
  - `(close)` - 關閉下拉選單事件
  - `(search)` - 搜尋事件 `{ term: string; items: any[] }`
  - `(clear)` - 清除所有選項事件
  - `(add)` - 新增項目事件
  - `(remove)` - 移除項目事件
  - `(scroll)` - 滾動事件 `{ start: number; end: number }`
  - `(scrollToEnd)` - 滾動到底部事件
- Example:

```html
<!-- 基本使用 -->
<wec-multi-select
  [items]="equipmentList"
  bindValue="id"
  bindLabel="name"
  placeholder="請選擇設備"
  [(selected)]="selectedEquipments"
  (selectedChange)="onSelectionChange($event)"
>
</wec-multi-select>

<!-- 使用 ngModel -->
<wec-multi-select
  [items]="options"
  bindValue="id"
  bindLabel="label"
  [(ngModel)]="selectedItems"
  placeholder="請選擇項目"
>
</wec-multi-select>

<!-- 禁用狀態 -->
<wec-multi-select
  [items]="items"
  bindValue="value"
  bindLabel="text"
  [disabled]="true"
  placeholder="已禁用"
>
</wec-multi-select>

<!-- 處理事件 -->
<wec-multi-select
  [items]="dataList"
  bindValue="id"
  bindLabel="name"
  [(selected)]="selectedData"
  (open)="onDropdownOpen()"
  (close)="onDropdownClose()"
  (search)="onSearch($event)"
  (scrollToEnd)="loadMoreItems()"
>
</wec-multi-select>
```

**資料格式範例:**

```typescript
equipmentList = [
  { id: "EQ001", name: "Equipment 1", type: "TypeA" },
  { id: "EQ002", name: "Equipment 2", type: "TypeB" },
  { id: "EQ003", name: "Equipment 3", type: "TypeA" },
];

selectedEquipments = ["EQ001", "EQ003"]; // 或物件陣列 (取決於 bindValue)
```

**特性說明:**

- 基於 ng-select,支援所有 ng-select 的核心功能
- 自動顯示已選標籤,空間不足時顯示 "X more..."
- 支援 Transfer List 彈出視窗進行批量選擇 (透過 "More" 按鈕)
- 智能調整標籤顯示數量,根據容器寬度動態計算
- 支援自訂 footer template (透過 `ng-footer-tmp`)
- 響應式設計,自動適應容器大小
- 支援 `ControlValueAccessor`,可與 Angular Forms 整合
- 支援虛擬滾動和延遲載入 (scrollToEnd 事件)

### 9. \<wec-icon-input>

圖示輸入框元件，在輸入框內嵌入按鈕或圖示。

- Example:

```html
<wec-icon-input>
  <input nbInput placeholder="搜尋..." />
  <button nbButton>
    <nb-icon icon="search-outline"></nb-icon>
  </button>
</wec-icon-input>
```

### 10. \<wec-file-upload>

檔案上傳元件，支援上傳進度顯示。

- Inputs:
  - `postName: string` - POST 參數名稱，預設為 'file'
  - `fileName: string` - 強制檔案名稱
  - `files: File[]` - 檔案清單，預設為 []
  - `percent: number` - 上傳進度百分比，預設為 0
  - `httpEvent: HttpEvent<{}>` - HTTP 事件
- Outputs:
  - `(percentChange)` - 上傳進度變更事件
- Example:

```html
<wec-file-upload
  [files]="selectedFiles"
  [percent]="uploadProgress"
  (percentChange)="onProgressChange($event)"
>
</wec-file-upload>
```

## 資料展示元件

### 11. \<wec-check-list>

可選清單元件，針對清單項目提供選取、刪除、篩選、排序、移動項目順序等功能，支援單選/複選模式、拖曳選擇、延遲載入等進階功能。本元件只提供管理清單功能，真正的清單項目 UI 要配合 `<wec-list-item>` 等子元件使用。

**特性:**

- 單選/複選模式切換
- 拖曳框選多個項目 (Drag Select)
- 關鍵字篩選 (支援正則表達式)
- 排序功能 (實作 NbSortable 介面)
- Lazy Loading 延遲載入清單項目
- 右鍵選單 (全選/取消全選)
- Shift 鍵連續選擇

**Inputs:**

- `dataProvider: any[]` - 清單資料來源 (必要設定)
- `selectedItems: any[]` - 選中的項目陣列
- `multiple: boolean` - 是否為複選模式，預設為 `true`
- `disabled: boolean` - 是否禁用
- `status: NbComponentStatus` - 外觀樣式，預設為 `'primary'`
- `enableContextMenu: boolean` - 啟用右鍵選單，預設為 `false`
- `suppressDragSelect: boolean` - 禁用拖曳選擇，預設為 `false`
- `filterKeyword: WecListKeyword` - 直接設定關鍵字進行篩選
- 繼承自 NbListComponent 的所有屬性

**Outputs:**

- `(listChange)` - 清單變更事件 (add/remove 時觸發)
- `(selectedItemsChange)` - 選中項目變更事件，返回完整物件陣列

**公開方法:**

- `change(checked: boolean | number, triggerEvent?: boolean)` - 改變所有項目選取狀態 (0: 不選、1: 全選、-1: 反相)
- `toggle(idx: number, triggerEvent?: boolean)` - 切換單一項目選取狀態
- `filter(keyword: string, prop?: string)` - 篩選清單項目
- `add(item: any | any[])` - 加入項目至清單
- `insert(item: any, toIndex: number)` - 插入項目至指定位置
- `move(fromIndex: number, toIndex: number)` - 移動項目順序
- `remove(idx: number)` - 移除單一項目
- `removeSelectedItems()` - 移除所有選中項目
- `lazyLoadNext(value: number)` - 載入下幾筆項目 (Lazy Loading)
- `ensureItemVisible(itemIndex: number)` - 確保項目可見 (自動滾動)
- `sort(sortRequest: NbSortRequest)` - 排序清單 (實作 NbSortable)
- `itemToLabel(item: any, field: string)` - 將項目轉為顯示文字

**唯讀屬性:**

- `hasItemSelected: boolean` - 是否有任何項目被選擇
- `selectedCount: number` - 被選擇的項目個數
- `selectedIndices: number[]` - 被選擇項目的索引位置陣列

**Example:**

```html
<!-- 基本使用 - 複選模式 -->
<wec-check-list
  [dataProvider]="items"
  (selectedItemsChange)="onSelectionChange($event)"
>
  @for (item of items; track item.id) {
  <wec-list-item [value]="item.id"> {{ item.name }} </wec-list-item>
  }
</wec-check-list>

<!-- 單選模式 + 禁用拖曳 -->
<wec-check-list
  [dataProvider]="items"
  [multiple]="false"
  [suppressDragSelect]="true"
  (selectedItemsChange)="onSelectionChange($event)"
>
  @for (item of items; track item.id) {
  <wec-list-item [value]="item.id"> {{ item.name }} </wec-list-item>
  }
</wec-check-list>

<!-- 啟用右鍵選單 + 自訂外觀 -->
<wec-check-list
  [dataProvider]="items"
  [enableContextMenu]="true"
  status="success"
  [(selectedItems)]="selectedItems"
>
  @for (item of items; track item.id) {
  <wec-list-item [value]="item.id"> {{ item.name }} </wec-list-item>
  }
</wec-check-list>
```

**TypeScript 使用範例:**

```typescript
export class MyComponent {
  items: Item[] = [
    { id: "1", name: "Item 1" },
    { id: "2", name: "Item 2" },
    { id: "3", name: "Item 3" },
  ];

  selectedItems: Item[] = [];

  onSelectionChange(selected: Item[]): void {
    this.selectedItems = selected;
    console.log(
      "Selected IDs:",
      selected.map((item) => item.id),
    );
  }

  // 程式化操作清單
  @ViewChild(WecCheckListComponent) checkList: WecCheckListComponent;

  selectAll(): void {
    this.checkList.change(true, true);
  }

  deselectAll(): void {
    this.checkList.change(false, true);
  }

  filterItems(keyword: string): void {
    this.checkList.filter(keyword, "name");
  }

  removeSelected(): void {
    const removed = this.checkList.removeSelectedItems();
    console.log("Removed:", removed);
  }
}
```

**重要提醒:**

- 必須設定 `[dataProvider]` 才能使用選取、篩選、排序等功能
- `(selectedItemsChange)` 事件返回的是完整物件陣列，不是 ID 陣列
- 子元件必須使用繼承自 `NbCheckboxComponent` 的元件 (如 `<wec-list-item>`)
- 不支援 `[items]`, `[(value)]`, `bindLabel`, `bindValue` 等屬性
- 拖曳選擇功能在 `multiple="true"` 且 `suppressDragSelect="false"` 時啟用
- Shift + Click 可連續選擇範圍內的項目

### 12. \<wec-list-item>

清單項目元件，繼承 NbCheckboxComponent 功能。

- Example:

```html
<wec-list-item [value]="item" [checked]="item.selected">
  {{ item.label }}
</wec-list-item>
```

### 13. \<wec-transfer-list>

穿梭框元件，支援雙向項目轉移。

- Inputs:
  - `optionalItems: any[]` - 待選清單項目
  - `selectedItems: any[]` - 已選清單項目
  - `optionalCaption: string` - 待選區塊標題，預設為 'Optional List'
  - `selectedCaption: string` - 已選區塊標題，預設為 'Selected List'
  - `optionalPrompt: string` - 待選區塊篩選提示
  - `selectedPrompt: string` - 已選區塊篩選提示
  - `columns: WecGridColumn[] | ColDef[]` - 欄位設定
- Example:

```html
<wec-transfer-list
  [optionalItems]="availableItems"
  [selectedItems]="chosenItems"
  optionalCaption="可選項目"
  selectedCaption="已選項目"
>
</wec-transfer-list>
```

### 14. \<wec-user-list>

使用者清單元件，專門用於顯示使用者資訊。

- Inputs:
  - `userlistTitle: string` - 清單標題，預設為 ''
  - `showTitle: boolean` - 是否顯示標題，預設為 false
  - `hasEditUsers: boolean` - 是否有編輯使用者功能，預設為 false
- Outputs:
  - `(editOwnerClick)` - 編輯擁有者點擊事件
- Example:

```html
<wec-user-list
  userlistTitle="系統使用者"
  [showTitle]="true"
  [hasEditUsers]="true"
  (editOwnerClick)="onEditOwner($event)"
>
</wec-user-list>
```

### 15. \<wec-category-tree>

分類樹元件,基於 AG Grid 實作的階層式資料展示元件,支援單選/多選、篩選、群組顯示等功能。

- Inputs:
  - `dataProvider: any[]` - 資料來源陣列
  - `labelField: string` - 顯示標籤的欄位名稱
  - `valueField: string` - 值欄位名稱
  - `groupField: string | string[]` - 群組欄位,可以是單一字串或陣列 (支援最多 2 層群組)
  - `selectionMode: 'single' | 'multiple'` - 選擇模式,預設為 'multiple'
  - `multiple: boolean | string` - 是否多選,預設為 true (可用於替代 selectionMode)
  - `placeholder: string` - 篩選框提示文字,預設為 'filter...'
  - `selected: any | any[]` - 選中的項目 (單選時為單一物件,多選時為陣列)
- Outputs:
  - `(selectedChange)` - 選中項目變更事件
  - `(itemClicked)` - 項目點擊事件
- Example:

```html
<!-- 基本使用 - 多選模式 -->
<wec-category-tree
  [dataProvider]="chamberList"
  labelField="name"
  valueField="id"
  [groupField]="['equipment', 'category']"
  [(selected)]="selectedChambers"
  (selectedChange)="onSelectionChange($event)"
>
</wec-category-tree>

<!-- 單選模式 -->
<wec-category-tree
  [dataProvider]="categoryData"
  labelField="name"
  valueField="id"
  groupField="category"
  selectionMode="single"
  [(selected)]="selectedItem"
  placeholder="搜尋分類..."
>
</wec-category-tree>

<!-- 使用 multiple 屬性 -->
<wec-category-tree
  [dataProvider]="items"
  labelField="label"
  [multiple]="false"
  [(selected)]="selectedValue"
>
</wec-category-tree>
```

**資料格式範例:**

```typescript
// 單層群組
chamberList = [
  { id: "C1", name: "Chamber 1", equipment: "EQ-001" },
  { id: "C2", name: "Chamber 2", equipment: "EQ-001" },
  { id: "C3", name: "Chamber 3", equipment: "EQ-002" },
];

// 雙層群組
chamberList = [
  { id: "C1", name: "Chamber 1", equipment: "EQ-001", category: "Type A" },
  { id: "C2", name: "Chamber 2", equipment: "EQ-001", category: "Type B" },
  { id: "C3", name: "Chamber 3", equipment: "EQ-002", category: "Type A" },
];
```

**特性說明:**

- 基於 AG Grid 的樹狀結構,性能優異
- 支援即時篩選 (使用正則表達式)
- 支援群組展開/收合 (預設展開第一層)
- 雙擊根節點可全部展開或收合
- 多選模式支援 checkbox 和拖曳選取
- 單選模式無 checkbox,點擊即選取
- 自動去除重複項目 (根據 labelField)
- 支援 `ngModel` 雙向綁定

### 16. \<wec-display-shelf>

展示架元件，支援輪播和縮放功能。

- Inputs:
  - `index: number | null` - 目前索引，預設為 null
  - `config: SwiperOptions` - Swiper 配置，預設為 {}
  - `disabled: boolean` - 禁用狀態，預設為 false
  - `performance: boolean` - 效能模式，預設為 false
- Outputs:
  - `(itemClick)` - 項目點擊事件
  - `(indexChange)` - 索引變更事件
- Example:

```html
<wec-display-shelf
  [index]="currentIndex"
  [config]="swiperConfig"
  (itemClick)="onItemClick($event)"
  (indexChange)="onIndexChange($event)"
>
</wec-display-shelf>
```

## 日期時間元件

### 17. \<wec-datetime>

日期時間選擇元件，整合日期和時間選擇功能，支援格式化輸入遮罩和彈出式選擇器。

**特性:**

- 整合日期和時間選擇
- 自動格式化輸入 (yyyy-MM-dd HH:mm 或 yyyy-MM-dd)
- 支援鍵盤輸入和滑鼠選擇
- 可選擇是否包含時間部分
- 支援最大/最小日期限制
- 支援允許空值選項
- 實作 ControlValueAccessor (支援 ngModel 和 Reactive Forms)

**Inputs:**

- `date: Date` - 選中的日期時間
- `withTime: boolean` - 是否包含時間選擇，預設為 `true`
- `allowEmpty: boolean` - 是否允許空值，預設為 `false`
- `max: Date` - 可選擇的最大日期
- `min: Date` - 可選擇的最小日期
- `disabled: boolean` - 是否禁用，預設為 `false`

**Outputs:**

- `(dateChange)` - 日期變更事件，返回 `Date` 物件

**Example:**

```html
<!-- 基本使用 - 日期 + 時間 -->
<wec-datetime
  [(date)]="selectedDateTime"
  (dateChange)="onDateTimeChange($event)"
></wec-datetime>

<!-- 僅日期選擇 (不含時間) -->
<wec-datetime [withTime]="false" [(date)]="selectedDate"></wec-datetime>

<!-- 設定日期範圍限制 -->
<wec-datetime
  [min]="minDate"
  [max]="maxDate"
  [(date)]="selectedDateTime"
></wec-datetime>

<!-- 使用 ngModel -->
<wec-datetime [(ngModel)]="myDateTime" [allowEmpty]="true"></wec-datetime>

<!-- 禁用狀態 -->
<wec-datetime [date]="displayDate" [disabled]="true"></wec-datetime>
```

**TypeScript 使用範例:**

```typescript
export class MyComponent {
  selectedDateTime: Date = new Date();
  selectedDate: Date = new Date();
  minDate: Date = new Date(2020, 0, 1);
  maxDate: Date = new Date(2030, 11, 31);

  onDateTimeChange(date: Date): void {
    console.log("Selected DateTime:", date);
  }
}
```

---

### 18. \<wec-datetime-range>

日期時間範圍選擇元件，支援起訖日期時間的選擇，提供連動模式、快速移動、單一或分離選擇器等進階功能。

**特性:**

- 起訖日期時間範圍選擇
- 支援連動模式 (linked mode) - 起訖日期同步移動
- 快速移動功能 (向前/向後移動範圍)
- 單一或分離選擇器模式
- 自動處理月份邊界和跨月範圍
- 支援僅日期或日期+時間模式
- 實作 ControlValueAccessor

**Inputs:**

- `range: NbCalendarRange<Date>` - 日期範圍物件 `{ start: Date, end: Date }`
- `startDate: Date` - 起始日期 (已棄用，建議使用 range)
- `endDate: Date` - 結束日期 (已棄用，建議使用 range)
- `withTime: boolean` - 是否包含時間選擇，預設為 `true`
- `picker: 'single' | 'separate'` - 選擇器模式，預設為 `'single'`
  - `'single'`: 起訖日期共用一個 picker
  - `'separate'`: 起訖日期各自使用一個 picker
- `linked: boolean` - 是否啟用連動模式，預設為 `false`
- `hoursAgo: number` - 設定為過去 N 小時的範圍 (自動計算起訖時間)
- `max: Date` - 可選擇的最大日期
- `min: Date` - 可選擇的最小日期
- `disabled: boolean` - 是否禁用，預設為 `false`

**Outputs:**

- `(rangeChange)` - 範圍變更事件，返回 `NbCalendarRange<Date>`
- `(startDateChange)` - 起始日期變更事件，返回 `Date`
- `(endDateChange)` - 結束日期變更事件，返回 `Date`

**Example:**

```html
<!-- 基本使用 - 日期時間範圍 -->
<wec-datetime-range
  [(range)]="dateTimeRange"
  (rangeChange)="onRangeChange($event)"
></wec-datetime-range>

<!-- 僅日期範圍 (不含時間) -->
<wec-datetime-range
  [withTime]="false"
  [(range)]="dateRange"
></wec-datetime-range>

<!-- 連動模式 - 起訖日期同步移動 -->
<wec-datetime-range
  [linked]="true"
  [(range)]="linkedRange"
></wec-datetime-range>

<!-- 分離選擇器模式 -->
<wec-datetime-range
  picker="separate"
  [(range)]="dateRange"
></wec-datetime-range>

<!-- 使用 hoursAgo 設定過去 24 小時 -->
<wec-datetime-range [hoursAgo]="24"></wec-datetime-range>

<!-- 使用舊版 API (startDate/endDate) -->
<wec-datetime-range
  [(startDate)]="startDateTime"
  [(endDate)]="endDateTime"
></wec-datetime-range>

<!-- 使用 ngModel -->
<wec-datetime-range
  [(ngModel)]="myRange"
  [disabled]="false"
></wec-datetime-range>
```

**TypeScript 使用範例:**

```typescript
import { NbCalendarRange } from "@nebular/theme";

export class MyComponent {
  // 推薦使用 range
  dateTimeRange: NbCalendarRange<Date> = {
    start: new Date(2025, 0, 1, 9, 0),
    end: new Date(2025, 0, 31, 18, 0),
  };

  dateRange: NbCalendarRange<Date> = {
    start: new Date(2025, 0, 1),
    end: new Date(2025, 0, 31),
  };

  // 或使用舊版 API
  startDateTime: Date = new Date(2025, 0, 1, 9, 0);
  endDateTime: Date = new Date(2025, 0, 31, 18, 0);

  onRangeChange(range: NbCalendarRange<Date>): void {
    console.log("Start:", range.start);
    console.log("End:", range.end);
    console.log("Duration (ms):", range.end.getTime() - range.start.getTime());
  }
}
```

**連動模式說明:**

- 當 `linked="true"` 時，移動起始日期會自動調整結束日期，保持範圍長度
- 支援月份首尾模式 (例如: 1/1 ~ 1/31)
- 支援跨月模式 (例如: 1/15 ~ 2/15)
- 提供快速移動按鈕，向前/向後移動整個範圍

---

### 19. \<wec-time>

時間選擇元件，專注於時分選擇，支援格式化輸入和彈出式時間選擇器。

**特性:**

- 時分選擇 (秒數自動設為 0)
- 自動格式化輸入 (HH:mm)
- 支援鍵盤輸入和滑鼠選擇
- 可選擇是否允許空值
- 支援自訂標籤
- 實作 ControlValueAccessor

**Inputs:**

- `date: Date` - 選中的時間 (使用 Date 物件，但只關注時分)
- `labelName: string` - 標籤名稱
- `allowEmpty: boolean` - 是否允許空值，預設為 `false`
- `disabled: boolean` - 是否禁用，預設為 `false`

**Outputs:**

- `(dateChange)` - 時間變更事件，返回 `Date` 物件

**Example:**

```html
<!-- 基本使用 -->
<wec-time
  [(date)]="selectedTime"
  (dateChange)="onTimeChange($event)"
></wec-time>

<!-- 帶標籤 -->
<wec-time labelName="開始時間" [(date)]="startTime"></wec-time>

<!-- 使用 ngModel -->
<wec-time [(ngModel)]="myTime" [allowEmpty]="true"></wec-time>

<!-- 禁用狀態 -->
<wec-time [date]="displayTime" [disabled]="true"></wec-time>
```

**TypeScript 使用範例:**

```typescript
export class MyComponent {
  selectedTime: Date = new Date();
  startTime: Date = new Date();

  constructor() {
    // 設定特定時間 (09:30)
    this.startTime.setHours(9, 30, 0, 0);
  }

  onTimeChange(time: Date): void {
    console.log("Selected Time:", time.getHours() + ":" + time.getMinutes());
  }

  // 取得時分字串
  getTimeString(date: Date): string {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }
}
```

---

### 20. 其他日期時間元件

WEC Components 還提供以下日期時間元件 (詳細文檔待補充):

- `<wec-date-picker>` - 基礎日期選擇器 (繼承 NbDatepickerComponent)
- `<wec-time-picker>` - 基礎時間選擇器
- `<wec-range-picker>` - 日期範圍選擇器
- `<wec-month-picker>` - 月份選擇器
- `<wec-quarter-picker>` - 季度選擇器
- `<wec-week-picker>` - 週次選擇器

**基本使用範例:**

```html
<!-- wec-date-picker -->
<input nbInput [nbDatepicker]="datePicker" />
<wec-date-picker #datePicker></wec-date-picker>
```

## 佈局元件

### 21. \<wec-split-pane>

分割面板元件，支援可調整大小的面板分割。

- Example:

```html
<wec-split-pane>
  <div>左側面板</div>
  <div>右側面板</div>
</wec-split-pane>
```

### 22. \<wec-split-indicator>

分割指示器元件，用於分割面板的控制點。

- Example:

```html
<wec-split-indicator></wec-split-indicator>
```

### 23. \<wec-tab-bar>

標籤列元件，提供頁面或內容區塊的切換。

- Outputs:
  - 標籤切換相關事件
- Example:

```html
<wec-tab-bar>
  <wec-tab-item title="標籤1">內容1</wec-tab-item>
  <wec-tab-item title="標籤2">內容2</wec-tab-item>
</wec-tab-bar>
```

---

#### Nebular Tabset 可調整外觀

WEC Framework 擴充 Nebular `nb-tabset` 樣式，提供多種外觀模式。

**可用樣式類別：**

- `.light-tabs` - 淺色卡片式標籤
- `.round` - 圓角膠囊式標籤
- `.vertical` - 垂直側欄式標籤

**範例：**

```html
<!-- ✅ 淺色卡片式標籤 -->
<nb-tabset class="light-tabs">
  <nb-tab tabTitle="概覽">內容 A</nb-tab>
  <nb-tab tabTitle="統計">內容 B</nb-tab>
  <nb-tab tabTitle="設定">內容 C</nb-tab>
</nb-tabset>

<!-- ✅ 圓角膠囊式標籤（適合置中切換） -->
<nb-tabset class="round">
  <nb-tab tabTitle="日">內容 Day</nb-tab>
  <nb-tab tabTitle="週">內容 Week</nb-tab>
  <nb-tab tabTitle="月">內容 Month</nb-tab>
</nb-tabset>

<!-- ✅ 垂直側欄式標籤 -->
<nb-tabset class="vertical">
  <nb-tab tabTitle="基本資料">內容 1</nb-tab>
  <nb-tab tabTitle="權限設定">內容 2</nb-tab>
  <nb-tab tabTitle="通知設定">內容 3</nb-tab>
</nb-tabset>
```

**參考建議：**

- 需要卡片式視覺時用 `.light-tabs`
- 需要置中、分段切換時用 `.round`
- 需要左側導航時用 `.vertical`
- 外觀樣式實作請參考 [projects/wec-components/src/lib/wec/styles/nebular/\_tab.overwrite.scss](projects/wec-components/src/lib/wec/styles/nebular/_tab.overwrite.scss)

### 24. \<wec-tab-item>

標籤項目元件，用於 wec-tab-bar 內部。

- Inputs:
  - `closable: boolean` - 是否可關閉，預設為 false
- Example:

```html
<wec-tab-item title="標籤名稱" [closable]="true"> 標籤內容 </wec-tab-item>
```

### 25. \<wec-view-stack>

視圖堆疊元件，用於多視圖管理。

- Example:

```html
<wec-view-stack>
  <div>視圖1</div>
  <div>視圖2</div>
</wec-view-stack>
```

### 26. \<wec-side-drawer>

側邊抽屜元件，提供側邊滑出面板功能。

- Inputs:
  - `drawerTitle: string` - 抽屜標題，預設為 ''
  - `global: boolean` - 是否為全域抽屜，預設為 false
  - `isOpen: boolean` - 是否開啟，預設為 false
  - `overlay: boolean` - 是否顯示遮罩，預設為 false
  - `movable: boolean` - 是否可移動，預設為 false
  - `size: string | number` - 抽屜大小
- Outputs:
  - `(close)` - 關閉事件
- Example:

```html
<wec-side-drawer
  drawerTitle="側邊選單"
  [isOpen]="drawerOpen"
  [overlay]="true"
  (close)="onDrawerClose()"
>
  <div>抽屜內容</div>
</wec-side-drawer>
```

### 27. \<wec-field-group>

欄位群組元件，提供表單欄位的群組化顯示。

- Inputs:
  - `collapsed: boolean` - 是否摺疊，預設為 false
  - `status: string` - 外觀狀態，預設為 ''
- Outputs:
  - `(open)` - 開啟事件
  - `(close)` - 關閉事件
  - `(legendClick)` - 圖例點擊事件
- Example:

```html
<wec-field-group
  [collapsed]="false"
  (open)="onGroupOpen()"
  (close)="onGroupClose()"
>
  <legend>群組標題</legend>
  <div>群組內容</div>
</wec-field-group>
```

**可調整外觀（樣式類別）：**

- `.border` - 外框線樣式
- `.divider` - 上方分隔線樣式
- `.background` - 有背景卡片樣式
- `.block` - 區塊背景樣式（可配合外層設定色系）
- `.collapsed` - 收合狀態
- `.status-{status}` - 狀態樣式（primary, success, info, warning, danger）

**範例：**

```html
<!-- ✅ 基本群組 + 外框 -->
<wec-field-group class="border" (legendClick)="onLegendClick()">
  <legend><span class="text">基本資料</span></legend>
  <div class="fx-column small">
    <wec-form-item label="姓名" required>
      <input nbInput formControlName="userName" />
    </wec-form-item>
    <wec-form-item label="Email" required>
      <input nbInput formControlName="email" type="email" />
    </wec-form-item>
  </div>
</wec-field-group>

<!-- ✅ 狀態外觀 + 填色標題 -->
<wec-field-group class="border status-primary">
  <legend><span class="text filled">權限設定</span></legend>
  <div class="fx-column small">
    <nb-checkbox class="list" [(checked)]="permissions.read">讀取</nb-checkbox>
    <nb-checkbox class="list" [(checked)]="permissions.write">寫入</nb-checkbox>
    <nb-checkbox class="list" [(checked)]="permissions.delete"
      >刪除</nb-checkbox
    >
  </div>
</wec-field-group>

<!-- ✅ 分隔線樣式（適合卡片內分組） -->
<wec-field-group class="divider">
  <legend><span class="text">通知設定</span></legend>
  <div class="fx-row small">
    <nb-checkbox class="chip" [(checked)]="notify.email">Email</nb-checkbox>
    <nb-checkbox class="chip" [(checked)]="notify.sms">SMS</nb-checkbox>
    <nb-checkbox class="chip" [(checked)]="notify.push">Push</nb-checkbox>
  </div>
</wec-field-group>

<!-- ✅ 背景樣式 + 區塊樣式 -->
<wec-field-group class="background block">
  <legend><span class="text">進階選項</span></legend>
  <div class="fx-column small">
    <wec-form-item label="開始時間">
      <wec-time [(date)]="startTime"></wec-time>
    </wec-form-item>
    <wec-form-item label="結束時間">
      <wec-time [(date)]="endTime"></wec-time>
    </wec-form-item>
  </div>
</wec-field-group>

<!-- ✅ 收合狀態（可用於初始收合） -->
<wec-field-group class="border collapsed" [collapsed]="true">
  <legend><span class="text">進階篩選</span></legend>
  <div class="fx-column small">
    <wec-form-item label="關鍵字">
      <input nbInput formControlName="keyword" />
    </wec-form-item>
  </div>
</wec-field-group>
```

**參考建議：**

- 卡片內若有可分群組的輸入控制項，優先使用 `wec-field-group`，避免用 `div` 自行包裝
- `legend` 內建議使用 `<span class="text">` 包住文字；若要有填色標題可加 `.filled`
- 搭配 `.border` 或 `.divider` 時可加 `status-{status}` 讓邊框與標題呈現狀態色
- 外觀樣式實作請參考 [projects/wec-components/src/lib/wec/components/field-group/field-group.component.scss](projects/wec-components/src/lib/wec/components/field-group/field-group.component.scss)

## 對話框元件

### 28. \<wec-message-dialog>

訊息對話框元件，用於顯示各種類型的訊息提示。

- Inputs:
  - `title: string` - 對話框標題，預設為 ''
  - `appOwner: string` - 應用程式擁有者，預設為 ''
  - `width: string` - 對話框寬度，預設為 '48rem'
  - `height: string` - 對話框高度，預設為 '27rem'
  - `status: '' | NbComponentStatus` - 狀態樣式，預設為 ''
  - `icon: string` - 圖示，預設為 ''
- Example:

```html
<wec-message-dialog
  title="確認訊息"
  width="32rem"
  height="20rem"
  status="warning"
  icon="alert-triangle-outline"
>
  <div>對話框內容</div>
</wec-message-dialog>
```

## 工具提示元件

### 29. \<wec-rich-tooltip>

豐富工具提示元件，支援 HTML 內容顯示。

- Example:

```html
<wec-rich-tooltip>
  <div>豐富的工具提示內容</div>
</wec-rich-tooltip>
```

### 30. [wecRichTooltip]

豐富工具提示指令，用於任何元素添加工具提示。

- Example:

```html
<button [wecRichTooltip]="tooltipContent">滑鼠懸停顯示提示</button>
```

## AG Grid 相關元件

### 31. AG Grid 擴展

包含多個 AG Grid 的自定義編輯器、渲染器和標題組件：

#### Cell Editors:

- `WecBooleanEditorComponent` - 布林值編輯器
- `WecDateEditorComponent` - 日期編輯器
- `WecNumberEditorComponent` - 數字編輯器

#### Cell Renderers:

- `WecActionRendererComponent` - 操作按鈕渲染器
- `WecLinkRendererComponent` - 連結渲染器

#### Header Components:

- `WecActionHeaderComponent` - 操作欄位標題

### AG Grid 實作指南 (Required)

**使用 WEC Framework 的 `AgGridOptions` 實現增強功能和一致的樣式：**

```html
<!-- ✅ 始終使用 ag-theme-balham 保持一致的樣式 -->
<ag-grid-angular
  class="ag-theme-balham"
  [gridOptions]="gridOptions"
  [rowData]="rowData"
  style="height: 400px; width: 100%;"
>
</ag-grid-angular>
```

```typescript
import { AgGridOptions } from "@wec/components";

export class DataGridComponent {
  // ✅ 使用 Framework 預設的 GridOptions 與 WEC 增強功能
  gridOptions = new AgGridOptions(
    {
      columnDefs: [
        // 使用 Framework 提供的 cellEditor 對應各欄位的編輯行為
        {
          headerName: "Text",
          field: "txt",
          editable: true,
          cellEditor: "textEditor", // WEC Framework cell editor
          cellEditorParams: {
            max: 100,
            transform: "uppercase",
          },
        },
        {
          headerName: "Number",
          field: "num",
          editable: true,
          type: "NUMBER", // Framework 提供的型別，會使用數值方式來篩選、對齊、數字編輯器
          cellEditorParams: {
            step: 0.1,
            min: 0,
            max: 100,
            scale: 1,
          },
        },
        {
          headerName: "Percent",
          field: "pct",
          type: "NUMBER",
          editable: true,
          cellEditorParams: {
            step: 0.1,
            min: 0,
            max: 100,
            scale: 100,
            format: "1.0-2",
          },
        },
        {
          headerName: "Boolean",
          field: "bool",
          editable: true,
          cellEditor: "booleanEditor",
          cellEditorParams: {
            items: [
              { value: 1, label: "Yes" },
              { value: 0, label: "No" },
            ],
          },
        },
        {
          headerName: "Select",
          field: "lst",
          editable: true,
          cellEditor: "selectEditor",
          cellEditorParams: {
            items: [
              { value: "Low", label: "Low" },
              { value: "Middle", label: "Middle" },
              { value: "High", label: "High" },
            ],
          },
        },
        {
          headerName: "Date",
          field: "dat",
          editable: true,
          type: "DATE",
          cellRendererParams: {
            format: "MMM-d",
          },
          cellEditorParams: {
            nullable: true,
          },
        },
        {
          headerName: "DateTime",
          field: "dtm",
          editable: true,
          type: "DATE",
          cellEditorParams: {
            withTime: true,
          },
        },
        {
          headerName: "Link",
          field: "link",
          cellRenderer: "linkRenderer", // Framework 提供的 Renderer
          filter: "regexpFilter", // Framework 提供的正則篩選
          cellRendererParams: {
            clicked: (rowData: any): void => {
              window.open(rowData.url, "_blank");
            },
            enabled: (rowData: any): boolean => rowData.url,
          },
        },
        {
          headerName: "Action",
          cellRenderer: "actionRenderer",
          cellRendererParams: {
            actions: [
              {
                icon: "undo",
                status: "primary",
                title: "reset",
                data: "undoCmd",
              },
              {
                icon: "close",
                status: "danger",
                title: "remove",
                data: "deleteCmd",
              },
            ],
            clicked: (rowData: any, action: any): void => {
              switch (action.data) {
                case "undoCmd":
                  this.gridHelper.rollback([rowData]);
                  break;
                case "deleteCmd":
                  this.gridHelper.remove([rowData]);
                  break;
                default:
                  break;
              }
            },
            // action 的狀態，若無需求，此方法可不宣告
            enabled: (rowData: any, action: any) => {
              if (action.data === "undoCmd") {
                return this.gridHelper
                  ? this.gridHelper.isDirty(rowData)
                  : false;
              }
              return true;
            },
          },
        },
      ],
      rowSelection: {
        mode: "multiRow",
      }, // 覆寫預設官方 gridOptions，指定可多筆選取，以實現多筆同步編輯
      popupParent: document.body, // 覆寫預設官方，讓 context menu 不因 grid 高度限制
      domLayout: "autoHeight",
    },
    {
      allowAppendRow: true, // 使用額外 iMX 自定義 options 屬性，允許新增資料時，例如當複製貼上時，如果下方列數不夠，自動新增之
      autoSizeAllColumns: true, // 自動調整所有欄寬
      suppressExport: true, // 右鍵選單不顯示 Export 功能
    },
  );

  rowData: any[] = [];
  gridHelper: any; // WEC Framework grid helper for data operations
}
```

**AG-Grid 最佳實踐：**

- **始終使用 `class="ag-theme-balham"`** 保持 WEC Framework 樣式一致性
- **在 `gridOptions` 中定義所有配置** 而非分散的 input 屬性
- **使用 `AgGridOptions` 建構子** 搭配 WEC Framework 增強功能作為第二個參數
- **優先使用 Framework cell editors/renderers**: `textEditor`, `selectEditor`, `linkRenderer`, `actionRenderer`
- **使用 Framework 欄位類型**: `NUMBER`, `DATE` 進行自動格式化與篩選
- **善用 WEC 自訂選項**: `allowAppendRow`, `autoSizeAllColumns`, `suppressExport`

## 指令 (Directives)

### 32. [wecFormControl]

表單控制指令，提供表單驗證和錯誤提示功能。

- Inputs:
  - `wecFormMessage: string | object` - 錯誤訊息
- Example:

```html
<input
  nbInput
  [wecFormControl]="controlName"
  [wecFormMessage]="errorMessages"
/>
```

### 33. [wecSelectEraser]

選擇清除指令，提供清除選擇內容的功能。

- Inputs:
  - `wecSelectEraser: string` - 清除目標
- Example:

### 33. [wecSelectEraser]

選擇清除指令，提供清除選擇內容的功能。

- Inputs:
  - `wecSelectEraser: string` - 清除目標
- Example:

```html
<button [wecSelectEraser]="targetSelector">清除選擇</button>
```

### 34. [wecSwiper]

輪播指令，將 Swiper 功能集成到任何元素。

- Inputs:
  - `disabled: boolean` - 禁用狀態，預設為 false
  - `performance: boolean` - 效能模式，預設為 false
- Outputs:
  - `(indexChange)` - 索引變更事件
- Example:

```html
<div [wecSwiper]="swiperConfig" (indexChange)="onSlideChange($event)">
  <div>滑片1</div>
  <div>滑片2</div>
</div>
```

### 35. [wecDateMask]、[wecTimeMask]

日期和時間輸入遮罩指令，提供格式化輸入功能。

- Example:

```html
<input nbInput wecDateMask placeholder="YYYY-MM-DD" />
<input nbInput wecTimeMask placeholder="HH:mm:ss" />
```

## 服務 (Services)

### 36. WecDateService

日期服務，提供日期計算和格式化功能。

- Methods:
  - `rollYear(dateString: string, step: number): string` - 年份滾動
  - `rollMonth(dateString: string, step: number): string` - 月份滾動

### 37. WecFullscreenService

全螢幕服務，管理全螢幕模式。

### 38. WecHtmlElementService

HTML 元素服務，提供 DOM 操作工具方法。

## 類型定義

### 37. 事件類型

```typescript
// 組合框事件
export type WecComboBoxEvent = {
  text: string;
  item: any;
};

// 我的最愛事件
export type WecFavoriteEvent = {
  flag: boolean;
  item: any;
};

// 清單關鍵字搜尋
export type WecListKeyword = {
  targets: any[];
  keyword: string;
};

// Transfer List 欄位
export type WecGridColumn = {
  label: string;
  dataField: string;
  width: string | number;
  filterable: boolean;
};
```

## 使用原則

1. **優先使用 WEC 元件**：所有 UI 需求都應優先考慮使用 WEC 元件庫中的元件。

2. **遵循命名規範**：所有 WEC 元件都使用 `wec-` 前綴，指令使用 `wec` 前綴。

3. **Standalone 架構**：所有元件都採用 Angular 17 的 standalone 架構。

4. **類型安全**：使用提供的 TypeScript 類型定義確保類型安全。

5. **主題整合**：元件完全整合 Nebular 主題系統，支援 IMX Light/Dark 和 Next Light/Dark 主題。

6. **效能優化**：所有元件都使用 `OnPush` 變更檢測策略以獲得最佳效能。
