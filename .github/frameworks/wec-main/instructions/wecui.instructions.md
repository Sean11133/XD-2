---
applyTo: "**/*.ts, **/*.html, **/*.scss, **/*.css"
---

# Copilot Instructions – Global Project Rules

This repository contains multiple Angular libraries and applications.  
When generating or completing code, **always follow these global rules**.

---

## 🔑 General Principles

1. **Framework**
   - **WEC Framework**: 企業級 Angular 17+ 微前端應用程式
   - **Architecture**: Native Federation 多庫架構
   - Use Angular best practices and follow Angular Style Guide (https://angular.dev/style-guide)
   - Prefer **Reactive Forms** over Template-driven Forms
   - 整合 Nebular Theme 與 WEC Layout System

2. **Components**
   - **Use `wec-components` library** instead of writing raw HTML elements
     - Example: `<wec-button-group>` instead of `<button>` groups
     - Example: `<wec-form-item>` for standardized form layouts
     - Example: `<wec-check-list>` instead of custom lists
   - **For cards with grouped input controls**, use `<wec-field-group>` instead of wrapping inputs with `<div>`
   - All custom UI components must be prefixed with **`wec-`**
   - **⚠️ Important**: Some components are deprecated and will be removed in 2027:
     - `wec-button-group` → Use `nb-button-group` or custom button groups
     - `wec-combo-box` → Use `nb-select` or `@ng-select/ng-select`

3. **Services / Core Logic**
   - **Use `wec-core` library** for reusable services and utilities
   - All services must extend `DataService` base class
   - Avoid duplicating utility functions; always import from `wec-core`

4. **State Management**
   - **Angular 17**: Use RxJS BehaviorSubject or service properties
   - **Angular 19+**: Prefer Angular Signals (`signal()`, `computed()`, `effect()`)
   - Use Angular Services and RxJS for state handling

5. **File Structure**
   - Keep libraries modular:
     - `projects/wec-components/` → UI Components
     - `projects/wec-core/` → Core logic, utilities, services
   - Main application code stays in `/src/`

---

## 📐 標準頁面版型

- **前端頁面開發前，MUST 先選擇標準版型骨架**：
  - `.github/instructions/angular-page-layouts.instructions.md` — 5 種標準企業頁面版型
  - 版型 A：Master-Detail 列表頁（CRUD 查詢頁）
  - 版型 B：表單頁（新增/編輯）
  - 版型 C：列表+側邊明細（雙欄 Master-Detail）
  - 版型 D：Tab 分頁設定頁
  - 版型 E：Dashboard 儀表板

- **@dev 進入 Developer Phase 實作前端頁面時**：
  1. MUST 讀取 `instructions/angular-page-layouts.instructions.md` 選擇對應版型
  2. MUST 讀取 `instructions/angular-comp-practices.instructions.md` 遵循 UI 最佳實踐
  3. 根據 plan.md 的 Section 6.5 UI 版面配置選取版型
  4. 先建立頁面骨架 HTML，再填入業務元件
  5. 若任務涉及建立新頁面 → MUST 讀取 `skills/wec-page-scaffold/SKILL.md` 取得版型骨架生成流程
  6. 若任務涉及 Dialog / Modal → MUST 讀取 `skills/wec-dialog-pattern/SKILL.md` 取得彈窗開發模式

- **元件選型與樣式系統參考**：
  - `.github/frameworks/wec-main/instructions/wec-component-selection.instructions.md` — 元件選型指南
  - `.github/frameworks/wec-main/instructions/wec-styling-system.instructions.md` — 樣式系統（Layout/Nebular 外觀/文字/表單/Icon）

---

## 🎨 UI Library (wec-components)

- **All UI components are documented in:**
  - `.github/frameworks/wec-main/instructions/wec-components.instructions.md` - Complete component API reference
  - `.github/frameworks/wec-main/instructions/wec-component-selection.instructions.md` - Component selection guide

- **Component Usage Priority:**
  1. **First Priority**: Use `@wec/components` enterprise components
  2. **Second Priority**: Use Nebular UI components for basic elements
  3. **Last Resort**: Custom HTML elements

- **Key WEC Components:**
  - `<wec-form-item>` - Standardized form layouts
    - **labelWidth 屬性**: 當使用多個 wec-form-item 時，應根據所有 label 文字的最大寬度統一設定 labelWidth，避免使用預設值造成過寬
    - 範例: 如果表單中最長的 label 是 "Employee Name" (約 120px)，所有 wec-form-item 都應設定相同的 labelWidth
  - `<wec-check-list>` - Rich list with search, sort, pagination
  - `<wec-multi-select>` - Multi-selection dropdowns
  - `<wec-date-picker>` - Date/time selection components
  - `<wec-transfer-list>` - Transfer/shuttle box components
  - `<wec-split-pane>` - Resizable split panels
  - `<wec-tab-bar>` - Tab navigation components

- **wec-form-item Best Practices:**

  ```html
  <!-- ✅ 正確：統一設定 labelWidth，以最長 label 為準 -->
  <wec-form-item label="姓名" labelWidth="100px">
    <input nbInput name="name" [(ngModel)]="user.name" type="text" />
  </wec-form-item>
  <wec-form-item label="電子郵件地址" labelWidth="100px">
    <input nbInput name="email" [(ngModel)]="user.email" type="email" />
  </wec-form-item>
  <wec-form-item label="電話" labelWidth="100px">
    <input nbInput name="phone" [(ngModel)]="user.phone" type="tel" />
  </wec-form-item>

  <!-- ❌ 錯誤：使用預設 labelWidth，造成不必要的寬度浪費 -->
  <wec-form-item label="姓名">
    <input nbInput name="name" [(ngModel)]="user.name" type="text" />
  </wec-form-item>
  <wec-form-item label="電子郵件地址">
    <input nbInput name="email" [(ngModel)]="user.email" type="email" />
  </wec-form-item>

  <!-- ❌ 錯誤：每個 wec-form-item 使用不同的 labelWidth -->
  <wec-form-item label="姓名" labelWidth="60px">
    <input nbInput name="name" [(ngModel)]="user.name" type="text" />
  </wec-form-item>
  <wec-form-item label="電子郵件地址" labelWidth="120px">
    <input nbInput name="email" [(ngModel)]="user.email" type="email" />
  </wec-form-item>
  ```

- **AG-Grid Integration:**
  - **Always use `class="ag-theme-balham"`** for consistent theme styling
  - **Use `AgGridOptions` from `@wec/components`** instead of raw ag-grid options
  - **Define all configurations in `gridOptions`** for better maintainability
  - **Complete implementation guide**: See `.github/instructions/wec-components.instructions.md` for detailed AG-Grid examples
  - Use WEC-provided cell renderers and editors for enhanced functionality:
    - `textEditor`, `selectEditor`, `booleanEditor` for cell editing
    - `linkRenderer`, `actionRenderer` for interactive cell rendering
    - Built-in column types: `NUMBER`, `DATE` for automatic formatting
  - **Framework Features:**
    - Auto column sizing with `autoSizeAllColumns: true`
    - Multi-row selection with `rowSelection: { mode: 'multiRow' }`
    - Append row capability with `allowAppendRow: true`
    - Context menu customization with `suppressExport` option

**Copilot should:**

- Always suggest `<wec-*>` components instead of raw HTML tags
- Reference component examples from `.github/instructions/wec-components.instructions.md`
- Follow input/output API defined in `.github/instructions/wec-components.instructions.md`
- **For AG-Grid implementation**: Use the detailed examples in `.github/instructions/wec-components.instructions.md`

---

## ⚙️ Core Library (wec-core)

- **All reusable logic is documented in:**
  - `.github/instructions/wec-core.instructions.md` - Service and utility API reference
  - `.github/instructions/wec-core.instructions.md` - Implementation examples

- **Key Services Pattern:**
  ```typescript
  export class YourService extends DataService {
    protected get app() {
      return AppConfig.get("app");
    }
  }
  ```

**Copilot should:**

- Use `DataService` base class for all custom services
- Use utilities from `wec-core` instead of writing custom helpers
- Reference service examples from `.github/instructions/wec-core.instructions.md`

---

## 🛠 Modern Angular Standards

### Control Flow (Required)

**Angular v20 deprecates structural directives. Use new control flow syntax:**

```html
<!-- ✅ Use new syntax -->
@if (condition) {
<div>Content</div>
} @for (item of items; track item.id) {
<div>{{item}}</div>
} @switch (value) { @case ('A') {
<div>Case A</div>
} @default {
<div>Default</div>
} }
```

### Layout System

> WEC Layout classes (`fx-row`, `fx-column`, spacing), nb-card 配置 → 參見 `.github/frameworks/wec-main/instructions/wec-styling-system.instructions.md`

### Styling Guidelines

> Typography classes, text colors, Nebular 外觀覆寫, inline style 移除規則 → 參見 `.github/frameworks/wec-main/instructions/wec-styling-system.instructions.md`

### Form Binding & Model Binding (Required)

**表單資料封裝規範（Required）**

- 建立 UI component 時，若有表單資料綁定，**必須使用 class** 作為 Model（不可用 interface）。
- 若表單資料封裝的 class 類別名以 `Form` 結尾，檔案名稱以 `.form.ts` 結尾，目錄放在相關的 services 底下，（角色為service 送出 request 的封裝物件）。
- **查詢功能表單**：Model 類別需繼承 `PersistentBean` 以具備記錄能力。
  - 初始載入：呼叫 `load()`
  - 查詢時：呼叫 `save()`

**Always include `name` attribute for form controls to ensure proper model binding:**

```html
<!-- ✅ Correct: Always include name attribute -->
<input
  nbInput
  type="text"
  name="userName"
  [(ngModel)]="formData.userName"
  placeholder="Enter username"
/>

<nb-select
  name="department"
  [(ngModel)]="formData.department"
  placeholder="Select department"
>
  <nb-option value="IT">IT Department</nb-option>
  <nb-option value="HR">HR Department</nb-option>
</nb-select>

<!-- ✅ For WEC form items -->
<wec-form-item label="Employee Name" required>
  <input nbInput name="employeeName" [(ngModel)]="employee.name" type="text" />
</wec-form-item>

<!-- ❌ Wrong: Missing name attribute -->
<input nbInput [(ngModel)]="formData.userName" placeholder="Enter username" />
<nb-select [(ngModel)]="formData.department"></nb-select>
```

**Form Binding Best Practices:**

- **Always add `name` attribute**: Essential for proper form validation and model binding
- **Use descriptive names**: `name="employeeName"` not `name="input1"`
- **Match model structure**: If model is `user.profile.email`, use `name="userProfileEmail"`
- **Reactive Forms preferred**: Use `FormControl`, `FormGroup` with `formControlName`
- **Template-driven forms**: Always include `name` attribute with `[(ngModel)]`

**Nebular Component Binding (Required):**

**使用 Nebular 組件的原生綁定方式，避免使用 [(ngModel)] 可能造成的衝突：**

```html
<!-- ✅ 正確：使用 Nebular 原生綁定 -->
<nb-checkbox [(checked)]="agreedToTerms">我同意服務條款</nb-checkbox>
<nb-radio-group [(value)]="selectedOption">
  <nb-radio value="option1">選項 1</nb-radio>
  <nb-radio value="option2">選項 2</nb-radio>
</nb-radio-group>
<nb-select [(selected)]="selectedCountry" placeholder="選擇國家">
  <nb-option value="TW">台灣</nb-option>
  <nb-option value="US">美國</nb-option>
</nb-select>

<!-- ❌ 錯誤：使用 [(ngModel)] 可能造成衝突 -->
<nb-checkbox [(ngModel)]="agreedToTerms" name="terms"
  >我同意服務條款</nb-checkbox
>
<nb-radio-group [(ngModel)]="selectedOption" name="option">
  <nb-radio value="option1">選項 1</nb-radio>
</nb-radio-group>
<nb-select [(ngModel)]="selectedCountry" name="country">
  <nb-option value="TW">台灣</nb-option>
</nb-select>
```

**Nebular 組件綁定對照表：**

- `nb-checkbox` → 使用 `[(checked)]` 代替 `[(ngModel)]`
- `nb-radio-group` → 使用 `[(value)]` 代替 `[(ngModel)]`
- `nb-select` → 使用 `[(selected)]` 代替 `[(ngModel)]`
- `nb-toggle` → 使用 `[(checked)]` 代替 `[(ngModel)]`

**注意事項：**

- Nebular 組件使用原生綁定時**不需要** `name` 屬性
- 如果在 Reactive Forms 中使用，仍應使用 `formControlName`
- 原生綁定可避免 value accessor 相關錯誤（如 NG01203）

**⚠️ Critical FormGroup Requirement (NG01050 Error Prevention):**

**Every `formControlName` directive MUST be used within a parent `[formGroup]` directive:**

```html
<!-- ❌ WRONG: This will cause NG01050 error -->
<input nbInput formControlName="userName" placeholder="Username" />

<!-- ✅ CORRECT: Always wrap formControlName in [formGroup] -->
<form [formGroup]="formGroup">
  <input nbInput formControlName="userName" placeholder="Username" />
</form>

<!-- ✅ Or with div wrapper -->
<div [formGroup]="formGroup">
  <wec-form-item label="User Name" required>
    <input nbInput formControlName="userName" type="text" />
  </wec-form-item>
</div>
```

**Component Class Requirements:**

```typescript
// ✅ Always create FormGroup instance in component
export class MyComponent {
  formGroup = this.fb.group({
    userName: ["", [Validators.required]],
    email: ["", [Validators.required, Validators.email]],
  });

  constructor(private fb: FormBuilder) {}
}
```

**每個 interface 或 class 都必須是一個獨立的 .ts 檔，類似 Java 那樣的檔案方式**

**NG01050 Error Details:**

- **Error Message**: "formControlName must be used with a parent formGroup directive"
- **Root Cause**: Using `formControlName` without wrapping it in `[formGroup]` directive
- **Solution**: Always ensure `formControlName` has a parent element with `[formGroup]="yourFormGroup"`
- **Common Mistake**: Forgetting to add `[formGroup]` when converting from template-driven to reactive forms

```typescript
// ✅ Reactive Forms (Preferred)
formGroup = this.fb.group({
  userName: ["", [Validators.required]],
  email: ["", [Validators.required, Validators.email]],
  department: [""],
});
```

````html
<!-- ✅ Reactive Forms Template -->
```html
<!-- ✅ Reactive Forms Template -->
<form [formGroup]="formGroup">
  <input nbInput formControlName="userName" placeholder="Username">
  <input nbInput formControlName="email" type="email" placeholder="Email">
  <nb-select formControlName="department" placeholder="Department">
</form>
````

### AG-Grid Implementation

> 完整 `AgGridOptions` 設定、欄位類型 (`NUMBER`/`DATE`)、cell editor/renderer 範例 → 參見 `.github/frameworks/wec-main/instructions/wec-components.instructions.md`

---

## 🛠 Coding Conventions

- **TypeScript Strict Mode** is enforced
- Always type variables and function return values explicitly
- Prefer `async/await` over raw Promise `.then()` chains
- Use `JSDoc` comments for public APIs in libraries
- Follow WEC naming conventions:
  - Components: `wec-component-name`
  - Directives: `wecDirectiveName`
  - Services: `YourService extends DataService`
  - **Form Control Names**: Use camelCase, descriptive names matching model structure
    - ✅ `name="employeeName"` for `employee.name`
    - ✅ `name="userProfileEmail"` for `user.profile.email`
    - ❌ `name="input1"` or missing name attribute

### Form Validation & Error Handling

```typescript
// ✅ Standard validation patterns
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[\+]?[\d\s\-\(\)]+$/;

formGroup = this.fb.group({
  email: ["", [Validators.required, Validators.pattern(emailPattern)]],
  phone: ["", [Validators.pattern(phonePattern)]],
  birthDate: ["", [Validators.required, this.dateValidator]],
});
```

```html
<!-- ✅ Error message display -->
<wec-form-item label="Email" required>
  <input
    nbInput
    name="email"
    formControlName="email"
    type="email"
    placeholder="user@example.com"
  />
  @if (formGroup.get('email')?.invalid && formGroup.get('email')?.touched) {
  <div class="error-message">請輸入有效的電子郵件地址</div>
  }
</wec-form-item>
```

---

## 📁 Architecture Guidelines

### Microfrontend Structure

```
wec-main/          # Shell application (loads remote modules)
wec-core/          # Core library (git submodule)
wec-components/    # UI component library (git submodule)
```

### Module Federation

- Uses `@angular-architects/native-federation`
- Remote modules loaded from `imxFeatures`
- Configuration: `federation.config.js`, `assets/app-config.json`

### Authentication & Security

- Use `AuthService` for SSO and form authentication
- Use `AuthGuard` for route protection
- Manage user state with `UserContext`

---

## ✅ Summary

- **Global rules live here** (`.github/copilot-instructions.md`)
- **Component usage rules** → `.github/instructions/wec-components.instructions.md`
- **Service usage rules** → `.github/instructions/wec-core.instructions.md`
- **Examples are the source of truth** for correct usage
- **Always check component examples** before writing custom solutions

---

## 🚀 Quick Start for Copilot

1. **For UI needs**: Check `.github/instructions/wec-components.instructions.md` first
2. **For service needs**: Check `.github/instructions/wec-core.instructions.md` first
3. **Use modern Angular**: New control flow, WEC layout classes, standalone components
4. **Follow deprecation warnings**: Avoid deprecated components, migrate to alternatives

### 🔔 Common Reminders

- **Always add `name` attribute** to form controls when using `[(ngModel)]`
- **Nebular components binding**: 使用原生綁定方式（`[(checked)]`, `[(value)]`, `[(selected)]`）而非 `[(ngModel)]`
- **Prefer Reactive Forms** over Template-driven forms for complex scenarios
- **Use WEC Components first** before falling back to Nebular or native HTML
- **wec-form-item labelWidth**: 統一設定所有 label 的最大寬度，避免使用預設值造成過寬
- **Layout spacing**: 使用父元素的 WEC spacing classes（`tiny`, `small`, `medium`, `large`），避免在子元素使用 `margin-top` 等 CSS
- **Include proper error handling** in all service calls
- **Save/Delete success messages**: 成功後用 `SystemModule.publish(SystemEvents.Notify,...)` 推送訊息，不用 `div` 顯示
- **Follow TypeScript strict mode** - explicit types for all variables and returns
- **Remove inline styles** from user-provided HTML - use WEC Framework classes instead
- **Avoid custom CSS/SCSS** when framework provides equivalent styling options
- **For AG-Grid**: Always use `class="ag-theme-balham"` and `AgGridOptions` from `@wec/components` (see `.github/instructions/wec-components.instructions.md`)
- **AG-Grid configurations**: Define all settings in `gridOptions` for better maintainability

### 🚫 Common Mistakes to Avoid

````html
<!-- ❌ Missing name attribute -->
<input nbInput [(ngModel)]="user.name" />

<!-- ❌ Using [(ngModel)] with Nebular components instead of native binding -->
<nb-checkbox [(ngModel)]="agreed" name="agreed">同意</nb-checkbox>
<nb-radio-group [(ngModel)]="option" name="option">
  <nb-radio value="1">選項 1</nb-radio>
</nb-radio-group>
<nb-select [(ngModel)]="country" name="country">
  <nb-option value="TW">台灣</nb-option>
</nb-select>

<!-- ❌ Save/Delete success message shown in div instead of SystemModule.Nofity -->
<div class="text-hint">儲存成功</div>

<!-- ❌ NG01050: formControlName without parent [formGroup] -->
<wec-form-item label="User Name">
  <input nbInput formControlName="userName" type="text" />
</wec-form-item>

<!-- ❌ Inline styles from user-provided HTML -->
<div style="flex: 0 0 28px; margin-bottom: 16px; color: red;">
  <span style="font-weight: bold; background: #f0f0f0;">Content</span>
</div>

<!-- ❌ Using deprecated components -->
<wec-button-group>
  <wec-combo-box>
    <!-- ❌ Old structural directives -->
    <div *ngIf="condition">
      <div *ngFor="let item of items">
        <!-- ❌ Angular Flex Layout (deprecated) -->
        <div fxLayout="row" fxLayoutAlign="center center"></div>
      </div></div></wec-combo-box
></wec-button-group>

<!-- ❌ Custom CSS when framework classes exist -->
<div class="custom-flex-container">
  <span class="custom-text-red custom-bold">Content</span>
</div>

> AG-Grid 與樣式誤用詳細說明 → 參見
`.github/frameworks/wec-main/instructions/wec-components.instructions.md` 與
`.github/frameworks/wec-main/instructions/wec-styling-system.instructions.md`
--- ## 🎨 UX Design Guidelines ### Selection Controls > Radio / Checkbox /
Toggle / Select 選擇時機與決策樹 → 參見
`.github/frameworks/wec-main/instructions/wec-component-selection.instructions.md`
--- ### Data Visualization (Required)
**遵循資料視覺化最佳實踐，提升資料可讀性與洞察力：** #### 1. 選擇正確的圖表類型
**比較數值：** - **Bar Chart (橫條圖)**: 比較不同類別的數值（推薦用於長標籤） -
**Column Chart (直條圖)**: 比較不同時間點或類別的數值 - **Grouped Bar/Column**:
比較多個系列的數值 **顯示趨勢：** - **Line Chart (折線圖)**: 顯示時間序列趨勢 -
**Area Chart (面積圖)**: 強調數量變化的累積效果 - **Sparkline (迷你圖)**:
在有限空間內顯示趨勢 **顯示比例：** - **Pie Chart (圓餅圖)**:
顯示整體的組成部分（**限制 5 個以內**） - **Donut Chart (甜甜圈圖)**:
類似圓餅圖，中心可放置總計 - **Stacked Bar (堆疊橫條)**: 顯示部分與整體的關係
**顯示關聯：** - **Scatter Plot (散點圖)**: 顯示兩個變數的關聯 - **Bubble Chart
(泡泡圖)**: 顯示三個維度的關聯 #### 2. AG-Grid 資料表格設計原則 **欄位設計：**
```typescript // ✅ 正確：合理的欄位寬度與對齊 columnDefs = [ { headerName:
"產品名稱", field: "productName", minWidth: 200, flex: 1, // 彈性寬度 cellStyle:
{ textAlign: "left" }, }, { headerName: "數量", field: "quantity", type:
"NUMBER", width: 100, cellStyle: { textAlign: "right" }, // 數字右對齊 }, {
headerName: "金額", field: "amount", type: "NUMBER", valueFormatter: (params) =>
`$${params.value.toLocaleString()}`, width: 120, cellStyle: { textAlign: "right"
}, }, { headerName: "狀態", field: "status", width: 100, cellRenderer: (params)
=> { const statusClass = params.value === "active" ? "text-success" :
"text-warning"; return `<span class="${statusClass}">${params.value}</span>`; },
}, ];
````

**分頁與效能：**

```typescript
// ✅ 正確：大量資料使用分頁
gridOptions = new AgGridOptions({
  pagination: true,
  paginationPageSize: 50,
  paginationPageSizeSelector: [20, 50, 100, 200],
  cacheBlockSize: 50, // 伺服器端分頁
});

// ❌ 錯誤：一次載入 10000+ 筆資料
rowData = await this.loadAllData(); // 可能造成效能問題
```

#### 3. 顏色使用原則

**狀態顏色一致性：**

```html
<!-- ✅ 正確：使用語意化狀態顏色 -->
<span class="text-success">成功</span>
<span class="text-warning">警告</span>
<span class="text-danger">錯誤</span>
<span class="text-info">資訊</span>
<span class="text-primary">主要</span>

<!-- ❌ 錯誤：自定義顏色，無語意 -->
<span style="color: #00d68f;">完成</span>
<span style="color: #ffaa00;">處理中</span>
```

**圖表顏色配置：**

```typescript
// ✅ 正確：使用 Nebular 主題色彩
const chartColors = {
  primary: "var(--nb-color-primary-500)",
  success: "var(--nb-color-success-500)",
  warning: "var(--nb-color-warning-500)",
  danger: "var(--nb-color-danger-500)",
  info: "var(--nb-color-info-500)",
};

// ECharts 配置
echartOptions = {
  color: [
    chartColors.primary,
    chartColors.success,
    chartColors.info,
    chartColors.warning,
    chartColors.danger,
  ],
  // ... 其他配置
};
```

#### 4. 數據標籤與提示

**顯示關鍵數據：**

```html
<!-- ✅ 正確：使用 nb-tooltip 顯示詳細資訊 -->
<div [nbTooltip]="tooltipContent">
  <span class="h3">1,234</span>
  <span class="caption text-hint">使用者數量</span>
</div>
<ng-template #tooltipContent>
  <div>本月新增: 123</div>
  <div>較上月: +15%</div>
</ng-template>

<!-- ✅ 正確：AG-Grid 使用 valueFormatter -->
{ headerName: '成長率', field: 'growthRate', valueFormatter: params =>
`${(params.value * 100).toFixed(1)}%`, cellStyle: params => ({ color:
params.value > 0 ? 'var(--nb-color-success-500)' : 'var(--nb-color-danger-500)'
}) }
```

#### 5. 響應式設計

**行動裝置優化：**

```html
<!-- ✅ 正確：行動裝置隱藏次要欄位 -->
<ag-grid-angular
  class="ag-theme-balham"
  [gridOptions]="gridOptions"
  [columnDefs]="responsiveColumns"
>
</ag-grid-angular>
```

```typescript
// TypeScript
responsiveColumns = [
  { headerName: "產品", field: "product", minWidth: 150 },
  { headerName: "價格", field: "price", width: 100 },
  {
    headerName: "說明",
    field: "description",
    hide: window.innerWidth < 768, // 行動裝置隱藏
  },
  {
    headerName: "庫存",
    field: "stock",
    hide: window.innerWidth < 576,
  },
];
```

#### 6. 空狀態與載入狀態

**空資料處理：**

```html
<!-- ✅ 正確：友善的空狀態提示 -->
@if (data.length === 0) {
<nb-card>
  <nb-card-body class="fx-column center middle" style="min-height: 400px;">
    <nb-icon
      icon="inbox-outline"
      status="basic"
      style="font-size: 64px;"
    ></nb-icon>
    <h5 class="h5 text-hint">目前沒有資料</h5>
    <p class="paragraph-2 text-hint">請新增資料或調整篩選條件</p>
    <button nbButton status="primary" (click)="addNew()">新增資料</button>
  </nb-card-body>
</nb-card>
}

<!-- ✅ 正確：載入狀態 -->
@if (loading) {
<div class="fx-row center middle" style="min-height: 300px;">
  <nb-spinner size="large" status="primary"></nb-spinner>
</div>
}
```

#### 7. 資料視覺化決策樹

```
需要展示什麼？
│
├─ 比較數值 → Bar/Column Chart
│
├─ 顯示趨勢 → Line/Area Chart
│
├─ 顯示比例 → Pie/Donut Chart (≤5 項)
│
├─ 顯示明細 → AG-Grid Table
│
├─ 顯示關聯 → Scatter/Bubble Chart
│
└─ 多維度分析 → 使用篩選器 + 多圖表組合
```

---

### UX Best Practices Summary

**✅ 應該做的：**

1. **選擇控制項**：根據選項數量和選擇方式選擇正確的控制項
2. **資料視覺化**：根據資料類型選擇最適合的圖表
3. **一致性**：整個系統使用相同的設計模式
4. **回饋**：提供即時的視覺回饋和狀態指示
5. **可訪問性**：確保所有控制項可鍵盤操作和螢幕閱讀器友善

**❌ 應該避免的：**

1. **過度設計**：不要為了美觀犧牲功能性
2. **不當控制項**：不要用下拉選單顯示 2-3 個選項
3. **資訊過載**：不要在單一圖表中塞入太多資料
4. **缺乏層級**：確保重要資訊優先顯示
5. **忽略行動裝置**：確保所有介面在小螢幕上可用
