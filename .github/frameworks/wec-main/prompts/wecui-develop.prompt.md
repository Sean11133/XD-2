---
agent: agent
---

# WEC Framework 系統選單建立標準化流程

## 何時使用此流程

此流程適用於：

- 已有既存 system，現在要新增可被 menu 進入的新功能頁
- 需要同時建立 component、service、`setView()` 與 `setCustomLocalMenu()`
- 需要把新 page 正式掛到既有 system module 裡

## 不適用情境

以下情境不應優先使用本流程：

- 只是要設計或優化 AG Grid 欄位與 renderer：改用 `wec-aggrid-page` skill
- 只是要抽離 API 呼叫到 `DataService` service：改用 `wec-service-dataservice-crud` skill
- 只是要把表單改成 Reactive Forms：改用 `wec-reactive-form-pattern` skill
- 只是要建立 Dialog 元件（表單/確認/訊息型）：改用 `wec-dialog-pattern` skill
- 還沒建立 system：先改用 `wecui-init.prompt.md`

## 任務目標

基於 WEC Framework 微前端架構，在現有系統中新增功能選單，建立一個完整的選單開發流程。

**重要提醒**: 請參考 `copilot-instructions.md`、`instructions/wec-components.instructions.md` 與 `instructions/wec-core.instructions.md`，了解 WEC Framework 的技術規範和元件使用原則。

## 範圍界線

此 prompt 專注在 menu / page onboarding：

- 建立 page component
- 建立對應 service 骨架
- 註冊 `setView()` 與本地 menu

若使用者只要求其中一部分，應優先切換到對應 skill，而不是硬套整套流程。

## 具體需求

### 1. 選單建立前置作業

**IMPORTANT**: 首先詢問使用者以下資訊，然後根據使用者輸入動態生成程式碼。

**使用者輸入要求：**

- 請提供系統名稱（英文，例如：cim-system, user-management）
- 請提供選單名稱（英文，kebab-case 格式，例如：first-menu, user-list）
- 請提供選單顯示名稱（中文或英文，例如：第一層選單、使用者清單）
- 請提供父選單名稱（如果是子選單的話，例如：classification）

### 2. 標準化選單建立流程

**步驟 1：建立選單元件和服務**

使用 Angular CLI 指令建立新的 standalone 選單元件和對應的服務：

```bash
# 建立選單元件 (standalone)
ng generate component system/views/{選單名稱} --project={系統名稱} --standalone

# 建立對應的服務
ng generate service system/services/{選單名稱} --project={系統名稱}
```

**步驟 2：建立選單服務**

修改 `projects/{系統名稱}/src/lib/system/services/{選單名稱}.service.ts`：

```typescript
import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { DataService, AppConfig } from '@wec/core';

@Injectable({
  providedIn: 'root'
})
export class {PascalCase選單名稱}Service extends DataService {

  constructor(injector: Injector) {
    super(injector);
  }

  protected get app(): string {
    return AppConfig.get('app');
  }

  /**
   * 載入資料
   */
  loadData(searchParams?: any): Observable<any[]> {
    return this.post('api/{選單名稱}', searchParams, true);
  }

  /**
   * 建立新項目
   */
  createItem(data: any): Observable<any> {
    return this.post('api/{選單名稱}/create', data, true);
  }

  /**
   * 更新項目
   */
  updateItem(id: string, data: any): Observable<any> {
    return this.post(`api/{選單名稱}/${id}`, data, true);
  }

  /**
   * 刪除項目
   */
  deleteItem(id: string): Observable<any> {
    return this.post(`api/{選單名稱}/${id}/delete`, { id }, true);
  }

  /**
   * 取得單一項目詳細資料
   */
  getItemById(id: string): Observable<any> {
    return this.post(`api/{選單名稱}/${id}`, { id }, true);
  }
}
```

**步驟 3：修改系統模組檔案**

修改 `projects/{系統名稱}/src/lib/{系統名稱}.module.ts`：

```typescript
import { Injector, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WecComponentsModule } from '@wec/components';
import { SystemModule } from '@wec/core';
import { AgGridModule } from 'ag-grid-angular';
import { {PascalCase系統名稱}Component } from './{系統名稱}.component';
import { {PascalCase選單名稱}Component } from './system/views/{選單名稱}/{選單名稱}.component';

@NgModule({
  declarations: [
    {PascalCase系統名稱}Component
  ],
  imports: [
    WecComponentsModule,
    FormsModule,
    AgGridModule,
    {PascalCase選單名稱}Component  // standalone 元件加入 imports
  ],
  exports: [
    {PascalCase系統名稱}Component
  ]
})
export class {PascalCase系統名稱}Module extends SystemModule {
  name = '{系統名稱}';

  constructor(private injector: Injector) {
    super();
  }

  init() {
    // 設定首頁 View
    this.setView('home', {PascalCase系統名稱}Component);

    // 新增選單 View
    this.setView('{選單名稱}', {PascalCase選單名稱}Component);

    // 設定首頁
    this.setHomePage({
      title: 'Home',
      icon: 'home-outline',
      link: '/layout/WecPage/{系統名稱}/home',
      home: true
    });

    // 設定自訂本地選單
    this.setCustomLocalMenu([
      {
        title: '{選單顯示名稱}',
        icon: 'list-outline',
        link: '/layout/WecPage/{系統名稱}/{選單名稱}'
      }
    ]);
  }
}
```

**步驟 3.5：選擇頁面版型骨架**

在設計範本前，MUST 根據頁面需求選擇標準版型：

1. 讀取 `instructions/angular-page-layouts.instructions.md` 確認 5 種標準版型（A–E）
2. 讀取 `skills/wec-page-scaffold/SKILL.md` 取得完整版型選擇與骨架生成流程
3. 根據 plan.md Section 6.5 或頁面性質選擇版型，先建骨架再填入業務元件

**步驟 4：設計選單元件範本**

**IMPORTANT**: 根據使用者提供的需求來設計選單元件範本。請根據以下方式理解使用者需求：

1. **文字描述**: 理解功能需求和畫面布局說明
2. **截圖或設計稿**: 分析視覺設計和元件配置
3. **HTML 程式碼**: 直接使用或參考提供的程式碼結構
4. **功能清單**: 根據功能需求選擇適當的 WEC 元件

**設計原則** (參考 `copilot-instructions.md` 與 `instructions/wec-components.instructions.md`):

- **元件優先順序**: 一般 UI 優先使用 WEC Components，其次使用 Nebular UI，最後才使用原生 HTML
- **資料表格**: 清單、維護頁或大量資料展示優先使用 AG-Grid Enterprise
- **佈局系統**: 使用 WEC Layout Classes (`fx-row`, `fx-column`, `fx-fill`)
- **控制流程**: 使用新的 Angular 控制流語法 (`@if`, `@for`, `@switch`)
- **響應式設計**: 適配不同螢幕尺寸

**根據使用者需求動態生成** `projects/{系統名稱}/src/lib/system/views/{選單名稱}/{選單名稱}.component.html`

**步驟 5：實作選單元件邏輯**

**基本元件架構** - 修改 `projects/{系統名稱}/src/lib/system/views/{選單名稱}/{選單名稱}.component.ts`：

```typescript
import { Component, OnInit, OnDestroy, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, BehaviorSubject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { ContentView } from '@wec/core';
import { WecComponentsModule } from '@wec/components';
import { {PascalCase選單名稱}Service } from '../../services/{選單名稱}.service';

@Component({
  selector: 'app-{選單名稱}',
  templateUrl: './{選單名稱}.component.html',
  styleUrls: ['./{選單名稱}.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    WecComponentsModule
    // 根據需求動態添加其他模組，例如：
    // AgGridModule (如果需要表格功能)
  ]
})
export class {PascalCase選單名稱}Component extends ContentView implements OnInit, OnDestroy {

  title = '{選單顯示名稱}';

  // 基本狀態管理
  private dataSubject = new BehaviorSubject<any[]>([]);
  public readonly data$ = this.dataSubject.asObservable();
  private destroy$ = new Subject<void>();

  constructor(
    injector: Injector,
    private {選單名稱}Service: {PascalCase選單名稱}Service
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 載入資料
   */
  loadData(searchParams?: any): void {
    this.{選單名稱}Service.loadData(searchParams)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('載入資料失敗:', error);
          return of([]);
        })
      )
      .subscribe((data: any[]) => {
        this.dataSubject.next(data || []);
      });
  }

  /**
   * 重新載入資料
   */
  onRefresh(): void {
    this.loadData();
  }
}
```

**如果需要表格功能**，請額外添加以下內容：

```typescript
// 額外 import
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { AgGridModule } from 'ag-grid-angular';
import { AgGridOptions } from '@wec/components';

// 在 imports 中添加
AgGridModule

// 額外屬性
rowData: any[] = [];
columnDefs: ColDef[] = [
  // 根據實際需求定義欄位
  { field: 'id', headerName: 'ID', width: 100, sortable: true, filter: true },
  { field: 'name', headerName: '名稱', flex: 1, sortable: true, filter: true }
];

gridOptions = new AgGridOptions(
  {
    columnDefs: this.columnDefs,
    rowSelection: { mode: 'singleRow' },
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true
    },
    popupParent: document.body,
    domLayout: 'autoHeight'
  },
  {
    autoSizeAllColumns: true,
    suppressExport: true
  }
);

private gridApi!: GridApi;

// 額外方法
onGridReady(params: GridReadyEvent): void {
  this.gridApi = params.api;
}

// 在 loadData 的 subscribe 中更新 rowData
.subscribe((data: any[]) => {
  this.dataSubject.next(data || []);
  this.rowData = data || []; // 添加這行
});
```

**根據使用者需求動態實作其他功能**，例如：

- 搜尋功能
- 篩選功能
- 分頁功能
- 表單處理
- 資料驗證

## 開發原則

### 核心規範 (參考 `copilot-instructions.md`、`instructions/wec-components.instructions.md` 與 `instructions/wec-core.instructions.md`)

1. **服務繼承**: 所有自定義服務必須繼承 `DataService`
2. **元件架構**: 使用 standalone 元件，繼承 `ContentView`
3. **路由系統**: 使用 WEC Framework 內部路由 (`setView()`)，禁用 Angular Router
4. **元件優先順序**: 一般 UI 優先使用 WEC Components，其次使用 Nebular UI；資料表格優先使用 AG-Grid Enterprise
5. **控制流程**: 使用新的 Angular 控制流語法 (`@if`, `@for`, `@switch`)
6. **佈局系統**: 使用 WEC Layout Classes (`fx-row`, `fx-column`, `fx-fill`)

### 自動化執行限制

**⚠️ 重要限制**:

- **禁止自動執行** `npm start`、`npm run build`、`ng serve` 等驗證命令
- **禁止自動執行** 任何會啟動開發伺服器或建置程序的指令
- 只能生成程式碼，不可自動驗證或測試運行結果
- 完成後僅提示使用者手動執行 `ng s` 並檢查 `http://localhost:4200/#/`

### 檢查清單

**程式碼品質:**

- [ ] 元件繼承 `ContentView`
- [ ] 服務繼承 `DataService`
- [ ] 使用 standalone 元件架構
- [ ] 正確實作 `OnInit` 和 `OnDestroy`
- [ ] 使用 `takeUntil` 模式管理訂閱
- [ ] AG Grid 使用 `AgGridOptions`
- [ ] 使用新控制流語法 (`@if`, `@for`)
- [ ] 使用 WEC Layout 系統

**功能完整性:**

- [ ] 模組正確使用 `setView()` 註冊元件
- [ ] 選單路徑與後端設定一致
- [ ] 服務類別與 API 端點對應
- [ ] 資料載入、搜尋功能正常
- [ ] 錯誤處理機制完整

**禁止使用:**

- [ ] 未使用 Angular 原生路由 (RouterModule, Routes)
- [ ] 未使用已棄用技術 (Angular Flex Layout, 結構指令)
- [ ] 未使用棄用元件 (wec-combo-box, wec-button-group)

## 命名規則說明

- `{系統名稱}`: 使用者輸入的系統名稱（kebab-case）
- `{選單名稱}`: 使用者輸入的選單名稱（kebab-case）
- `{PascalCase系統名稱}`: 系統名稱轉換為 PascalCase
- `{PascalCase選單名稱}`: 選單名稱轉換為 PascalCase
- `{選單顯示名稱}`: 使用者提供的選單顯示名稱

請根據以上標準化流程建立選單，確保符合 WEC Framework 規範。

## 📋 完成後驗證步驟

**重要提醒**: 完成所有程式碼生成後，**不要自動執行** `npm start`、`npm run build` 或其他驗證命令。

### 手動驗證指示

完成選單建立後，請提示使用者：

```
✅ 選單程式碼已生成完成！

🔧 請手動驗證結果：
1. 執行指令：ng s 或 ng serve
2. 開啟瀏覽器訪問：http://localhost:4200/#/
3. 確認新選單是否正確顯示在系統中
4. 測試選單功能是否正常運作

⚠️ 注意: WEC Framework 使用 Hash-based routing，URL 必須包含 # 符號

若有任何問題，請檢查 Console 錯誤訊息或詢問進一步協助。
```

### 驗證重點

- [ ] 選單項目出現在側邊欄
- [ ] 點擊選單能正確導航到對應頁面
- [ ] 元件正確載入和顯示
- [ ] 資料服務呼叫正常
- [ ] 沒有 Console 錯誤訊息
