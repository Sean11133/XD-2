# Winbond WEC Framework - Angular 微前端架構專屬介紹

本提示詞專為 Winbond 內部 WEC Framework Angular 微前端應用程式設計，請依下列規範與重點進行介紹與說明：

## 任務目標

**核心目標**：提供 Winbond WEC Framework Angular 微前端架構的完整介紹與實用指南，使開發者能快速理解並正確使用此企業級框架。

**關鍵功能**：

- 自動提供 WEC Framework 的核心特色與微前端架構說明
- 詳細說明 Angular 17+ 開發規範與 Native Federation 設定
- 提供標準的服務模式與 UI 套件使用指南
- 強調企業級開發模式與最佳實踐
- 提供官方資源連結與進階學習路徑

**使用場景**：

- 新進前端開發者快速上手 WEC Framework
- 微前端專案初始化時的技術選型與架構設計參考
- Angular 程式碼 review 時的規範檢查依據
- 企業級前端開發技術文件撰寫與知識分享

## 何時使用此提示詞

此提示詞適用於：

- 需要快速理解 WEC Framework 架構、術語與開發規範
- 需要向新人或團隊說明 WEC 的標準開發方式
- 需要先做技術對齊，再決定後續要走哪個 prompt / skill

## 不適用情境

以下情境不應停留在此提示詞：

- 要開始安裝與初始化環境：改用 `wecui-install.prompt.md`
- 要建立新 system：改用 `wecui-init.prompt.md`
- 要新增 menu / page：改用 `wecui-develop.prompt.md`
- 要直接做表單、grid、service 實作：改用對應 skills

---

## WEC Framework 定位與特色

WEC Framework 是 Winbond Electronics Corporation 內部專用的企業級 Angular 17+ 微前端應用框架，聚焦於：

- Native Federation 多庫微前端架構
- 企業級 Angular 開發規範與模式
- 整合 Nebular Theme、AG-Grid Enterprise、WEC Layout System
- 統一的服務層與資料管理模式

## 核心架構組成

### 三層架構設計

```
wec-main/          # Shell application (載入遠端模組)
wec-core/          # Core library (服務與模型，git submodule or npm package)
wec-components/    # UI component library (UI 元件庫，git submodule or npm package)
```

### Module Federation 設定

- 使用 `@angular-architects/native-federation`
- Remote modules 從 `imxFeatures` 動態載入
- 設定檔：`federation.config.js`、`assets/app-config.json`
- 啟動流程：`main.ts` → 載入設定 → 動態模組

## Angular 版本支援與開發規範

### Angular 17 (當前版本)

- 預設 Standalone Components
- TypeScript Strict Mode 強型別約束
- Constructor injection 依賴注入
- RxJS BehaviorSubject 狀態管理
- 新的控制流語法：`@if`、`@for`、`@switch`

### Angular 19+ (未來升級)

- 支援 Angular Signals：`signal()`、`computed()`、`effect()`
- 支援 `inject()` 函式依賴注入
- 響應式狀態管理最佳化

## 核心服務模式

### DataService 基底類別

所有服務必須繼承 `DataService`：

```typescript
@Injectable({ providedIn: "root" })
export class YourService extends DataService {
  constructor(injector: Injector) {
    super(injector);
  }

  protected get app(): string {
    return AppConfig.get("app");
  }

  // 使用內建 post 方法進行 API 呼叫
  loadData(payload): Observable<any> {
    return this.post("api/endpoint", payload, true);
  }
}
```

### 狀態管理模式

```typescript
// Angular 17 版本
private dataSubject = new BehaviorSubject<Data[]>([]);
public readonly data$ = this.dataSubject.asObservable();

// Angular 19+ 版本
private dataSignal = signal<Data[]>([]);
public readonly data = this.dataSignal.asReadonly();
```

## UI 套件使用優先順序

### 資料表格首選：AG-Grid Enterprise

- 已購買授權，功能完整
- 適用於複雜資料表格、報表、大量資料處理
- 支援排序、篩選、分頁、匯出等企業級功能

### 企業專用元件：wec-components

- WEC 企業特定需求元件
- 符合 WEC 設計規範
- 一般 UI 需求的第一優先選擇

### 一般 UI 元件：Nebular

- 作為 WEC Components 以外的基礎 UI 補充
- 包含按鈕、卡片、輸入框、表單、模態視窗等
- 應在沒有對應 WEC 元件時再使用

### 版面配置：WEC Layout System

- 取代已棄用的 Angular Flex Layout
- 使用類別：`fx-row`、`fx-column`、`center`、`middle` 等
- 間距類別：`tiny`、`small`、`medium`、`large`、`giant`

## 開發與建置流程

### 開發環境

```bash
ng serve  # 本地開發環境
```

### 建置部署

```bash
npm run build:pilot  # Pilot 環境建置
npm run build:prod   # Production 環境建置
```

### 元件建立

```bash
ng generate component component-name --project {your-system-name} --standalone=true
```

## 專案檔案結構

```
projects/
├── {library-name}/src/lib/               # 函式庫
├── wec-components/src/lib/wec/components/ # UI 元件
├── wec-core/src/lib/wec/core/service/     # 服務
└── wec-core/src/lib/wec/core/model/       # 資料模型
```

## 安全與認證

- **AuthService**: 處理 SSO 與表單認證
- **AuthGuard**: 基於使用者權限的路由保護
- **UserContext**: 管理 sessionStorage 中的使用者狀態
- **AuthInterceptor & ErrorInterceptor**: 統一錯誤處理

## 最佳實踐重點

1. **必須使用 Standalone Components**
2. **新控制流語法取代結構化指令**
3. **AG-Grid 優先用於資料表格**
4. **一般 UI 優先使用 wec-components，再視需要補充 Nebular**
5. **繼承 DataService 進行 API 操作**
6. **使用 WEC Layout 進行版面配置**
7. **TypeScript 強型別約束**
8. **適當的錯誤處理與載入狀態管理**

## 重要提醒

- 開發時請考量微前端架構背景
- 確保適當的模組共享設定
- 遵循 WEC Framework 的企業級開發模式
- Angular 17 使用 RxJS 進行狀態管理
- Angular 19+ 可選擇使用 Angular Signals
- 充分利用已購買的 AG-Grid Enterprise 授權

---

## 參考資源

- [iMX Developer Guide 教學網站](http://pilot-imx/iMX-DG/#/)
- [Prototyping Tool - X builder](http://10.18.20.56:8402/u3/#/)
- [Angular 官方網站](https://angular.dev/)

---

## 自動執行指示

**當此提示詞被引用時，請自動執行以下動作：**

1. **提供 WEC Framework 架構簡介**：簡述微前端架構、Native Federation 與企業級優勢
2. **說明開發環境與工具鏈**：包含 Angular 17+ 要求、建置指令、依賴管理方式
3. **展示標準服務模式範例**：提供完整可執行的 DataService 繼承與狀態管理程式碼
4. **強調 UI 套件使用規範**：特別說明 AG-Grid Enterprise、Nebular、WEC Layout System 等重點
5. **提供實用建議**：依據使用者需求給出專案結構、最佳實踐建議

**使用此 prompt 時，請根據實際專案需求調整架構說明與範例程式碼。**

## 建議轉派

- 使用者問安裝：轉到 `wecui-install.prompt.md`
- 使用者問建立 system：轉到 `wecui-init.prompt.md`
- 使用者問建立 menu / page：轉到 `wecui-develop.prompt.md`
- 使用者問實作細節：轉到對應 skills
