---
agent: agent
---

## 何時使用此流程

此流程適用於：

- WEC UI Framework 已完成初始化
- 使用者直接說「幫我建立個前端系統」或「建立一個 WEC 前端系統」
- 需要建立新的業務系統模組
- 準備開始實際的系統開發工作

## 常見觸發語

以下說法都應直接進入本流程：

- 幫我建立個前端系統
- 建立一個 WEC 前端系統
- 幫我建立新 system
- 幫我新增系統模組
- 幫我跑 ng generate library 並完成 app-config

## 不適用情境

以下情境不應繼續使用本流程：

- 尚未完成環境初始化、fork、clone 或依賴安裝：先改用 `wecui-install.prompt.md`
- 已有 system，現在只是要新增 menu / page：改用 `wecui-develop.prompt.md`
- 只是要建立 CRUD service、Reactive Form 或 AG Grid：改用對應 skill
- 需要後端 API、資料庫、CI/CD、完整部署規劃：超出本 prompt 範圍，應另行處理

## 前置條件

- 已完成 WEC UI Framework 初始化（wecui-install.prompt.md）
- 本地開發環境已就緒
- 已獲得系統名稱和場別資訊

# WEC Framework 系統建立流程

---

## 任務目標

基於 WEC Framework 微前端架構建立一個可運作的前端系統模組，完成 library、module、app.config、app-config.json 與 public-api 的初始化。

**標準互動起手式**：

若使用者尚未提供完整資訊，必須先詢問：

- 系統名稱（英文，需要與 iMX Portal AppName 一致）
- 系統場別（0: 共用系統, 1: 台中廠系統, 2: 高雄廠系統, 3: 測試場系統）

## 範圍界線

此 prompt 的責任只包含前端 system bootstrap：

- 建立 Angular library
- 註冊 `SystemModule`
- 更新 shell 設定與 system config
- 驗證 system 首頁可被載入

此 prompt 不負責：

- 新增 menu 與功能頁
- CRUD service 或 API 封裝
- Reactive Forms 或 AG Grid 細節實作
- 後端 API、資料庫、CI/CD 或部署腳本設計

## 具體需求

### 1. 專案初始化

- 使用 Angular 17+ 與 Native Federation 微前端架構
- 整合 wec-core 和 wec-components 函式庫
- 設定多環境配置 (pilot/production)
- 建立 Git 版本控制與 submodule 管理

### 1.1 WEC Framework 系統建立標準流程

**IMPORTANT**: 首先詢問使用者系統名稱，然後根據使用者輸入的系統名稱動態生成以下程式碼。

**使用者輸入要求：**

- 請提供系統名稱（英文，需要與 iMX Portal 的 AppName 一致）
- 請提供系統場別（0: 共用系統, 1: 台中廠系統, 2: 高雄廠系統, 3: 測試場系統）

**注意：** 系統名稱縮寫將自動使用系統名稱的全小寫形式作為 prefix

**步驟 1：建立系統函式庫**

```bash
ng generate library "{系統名稱}" --prefix={系統名稱小寫} --standalone=false
```

**步驟 2：移除 tsconfig.json 中自動產生的路徑**

移除 `tsconfig.json` 中 `compilerOptions.paths` 裡自動新增的系統路徑：

```jsonc
// 移除以下內容
"{系統名稱}": [
  "./dist/{系統名稱}"
]
```

**步驟 3：修改系統模組檔案**
修改 `projects/{系統名稱}/src/lib/{系統名稱}.module.ts`：

```typescript
import { Injector, NgModule } from '@angular/core';
import { WecComponentsModule } from '@wec/components';
import { SystemModule } from '@wec/core';
import { {PascalCase系統名稱}Component } from './{系統名稱}.component';

@NgModule({
  declarations: [
    {PascalCase系統名稱}Component
  ],
  imports: [
    WecComponentsModule
  ],
  exports: [
    {PascalCase系統名稱}Component
  ]
})
export class {PascalCase系統名稱}Module extends SystemModule {
  // 指定你的系統名稱
  // 此名稱務必等同後端你在 iMX Portal 建立的系統名稱。如此才可將後端 config 檔匹配至前端
  name = '{系統名稱}';

  constructor(private injector: Injector) {
    super();
  }

  init() {
    // 設定 View 的名稱與實作元件
    // 這裡的名稱務必要與後端 iMX Portal Security 設的 Menu.href 一致，如此才可與 Menu 掛勾
    this.setView('home', {PascalCase系統名稱}Component);

    // 設定首頁
    // this.setHomePage({
    //   title: 'Home',
    //   icon: 'home-outline',
    //   link: '/layout/WecPage/{系統名稱}/home',
    //   home: true
    // });
  }
}
```

**步驟 4：更新 app.config.ts**
在 `src/app/app.config.ts` 中註冊新系統模組：

```typescript
// 在檔案開頭加入系統模組的導入
import { {PascalCase系統名稱}Module } from 'projects/{系統名稱}/src/public-api';

// 在 importProvidersFrom 中加入系統模組
providers: [
  importProvidersFrom(
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    WecCoreModule,
    WecComponentsModule,
    AgGridModule,
    NbThemeModule.forRoot({ name: 'next-light' }),
    OverlayModule,
    {PascalCase系統名稱}Module
  ),
  // ...其他 providers
]
```

**步驟 5：配置 app-config.json**
更新 `src/assets/app-config.json` 設定檔：

```json
{
  "app": "{系統名稱}",
  "location": {系統場別},
  "securityUrl": "http://pilot-imx/sc/api/"
}
```

**步驟 6：更新 public-api.ts**
修改 `projects/{系統名稱}/src/public-api.ts`：

```typescript
export * from "./lib/{系統名稱}.module";
```

**步驟 7：啟動開發伺服器並測試系統**
執行以下指令啟動開發伺服器：

```bash
ng serve
```

然後開啟瀏覽器並瀏覽：

```
http://localhost:4200/#/
```

⚠️ **重要**: WEC Framework 使用內部路由系統,URL 路徑必須包含 `#` 符號

驗證系統是否成功載入並能正常運作。

**命名規則說明：**

- `{系統名稱}`: 使用者輸入的系統名稱（kebab-case）
- `{系統名稱小寫}`: 系統名稱的全小寫形式（用於 prefix）
- `{系統場別}`: 使用者選擇的系統場別（0: 共用系統, 1: 台中廠系統, 2: 高雄廠系統, 3: 測試場系統）
- `{PascalCase系統名稱}`: 將系統名稱轉換為 PascalCase（例如：user-management → UserManagement）

**重要注意事項：**

- 系統名稱必須與後端 iMX Portal 中的系統名稱一致
- Menu.href 必須與 setView() 中的名稱一致
- 確保所有路由路徑的一致性

### 2. 前端開發約束

- **UI 元件規範**：
  - 使用 Nebular 主題框架
  - 採用 WEC Layout 系統進行排版（fx-row、fx-column）
  - 避免使用已棄用的 Angular Flex Layout
  - 使用新的 Angular 17+ 控制流程語法（@if、@for、@switch）
  - 避免使用已棄用的 wec-button-group、wec-combo-box

- **組件開發**：
  - 所有組件使用 `wec-` 前綴
  - 實作 ControlValueAccessor 介面
  - 支援 Nebular 主題的 status、size 屬性
  - 使用 Angular Signals 進行狀態管理

### 3. 後續實作提醒

- 後續若要新增 menu / page，改用 `wecui-develop.prompt.md`
- 後續若要建立 CRUD service，改用 `wec-service-dataservice-crud` skill
- 後續若要建立表單或清單頁，改用對應 skills

### 4. 配置管理

- 更新 `app-config.json`
- 對齊 `AppConfig` 需要的 system 名稱與 location
- 確保 shell 可載入新 system module

## 技術約束

### 必須使用的技術棧

- Angular 17+
- @angular-architects/native-federation
- Nebular Theme Framework
- AG Grid Enterprise
- RxJS
- TypeScript
- SCSS

### 禁止使用的技術

- Angular Flex Layout（已棄用）
- 結構指令 *ngIf、*ngFor、\*ngSwitch（已棄用）
- wec-button-group、wec-combo-box（將於 2027 年移除）

### 開發規範

- 使用 ESLint 進行程式碼檢查
- 遵循 Angular 風格指南
- 實作單元測試（Karma + ChromeHeadless）
- 使用 Git 子模組管理共享函式庫

## 成功標準

### 功能完整性

1. ✅ 系統能夠成功啟動並載入微前端模組
2. ✅ 使用者可以通過 SSO 登入系統
3. ✅ 所有頁面都能正確套用 Nebular 主題
4. ✅ 資料能夠透過 API 正確載入和顯示
5. ✅ 支援多環境部署（pilot/production）

### 程式碼品質

1. ✅ 所有組件都使用新的控制流程語法
2. ✅ 版面配置使用 WEC Layout 系統
3. ✅ 遵循 DataService 服務模式
4. ✅ 通過 ESLint 程式碼檢查
5. ✅ system module 結構清楚且可被後續功能擴充

### 完成定義

1. ✅ 新 system 可被 shell 載入
2. ✅ `#/` 可進入 system 首頁 view
3. ✅ `app.config.ts`、`app-config.json`、`public-api.ts` 已同步
4. ✅ 後續可安全交給 menu / page / service 類 skill 接續實作

## 交付物清單

### 程式碼交付

- [ ] 新 system library
- [ ] system module
- [ ] shell 註冊設定
- [ ] 基本 system config

請根據以上規範建立 system bootstrap，完成後再交由後續 prompt / skills 繼續擴充功能。
