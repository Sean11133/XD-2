# spec.md — 005-decorator-adapter

> **需求編號**: 005  
> **需求簡述**: 日誌樣式強化 Decorator + 儀表板 Adapter 介面轉換  
> **建立日期**: 2026-03-30  
> **狀態**: 待審核

---

## 1. 背景與問題陳述

### 背景

系統現有的 `LogPanel` 元件以固定三級別（INFO / SUCCESS / WARNING）顯示日誌，視覺區別有限，使用者容易漏看重要訊息。此外，現有 `ProgressBar` 元件僅接受 `{ percentage, isDone, operationName? }` 三個參數，無法直接承接 `ProgressEvent` 所含的豐富進度資訊（操作名稱、current/total、當前節點訊息等），須手動在 `App.tsx` 中拆解資料再傳入。

### 核心問題

| 問題                                        | 影響                                 |
| ------------------------------------------- | ------------------------------------ |
| 日誌訊息缺乏圖標與視覺差異                  | 使用者難以快速掃視重要事件           |
| `ProgressBar` 介面與 `ProgressEvent` 不相符 | `App.tsx` 承擔介面轉換責任，違反 SRP |

---

## 2. 使用者故事（User Stories）

### US-01：日誌關鍵字自動套用樣式（Decorator）

**As** 操作系統的使用者  
**I want** 日誌訊息依訊息內容自動套用對應的圖標、顏色、粗體  
**So that** 我能快速辨識「完成」、「警告」、「掃描中」等不同狀態

#### 驗收標準（Given-When-Then）

**情境 A：完成訊息**

- **Given** 日誌訊息包含關鍵字「完成」
- **When** LogPanel 渲染該條目
- **Then** 顯示 ✅ 圖標，文字為綠色粗體

**情境 B：警告 / 失敗訊息**

- **Given** 日誌訊息包含關鍵字「警告」或「失敗」
- **When** LogPanel 渲染該條目
- **Then** 顯示 ⚠️ 圖標，文字為黃色

**情境 C：掃描 / 走訪訊息**

- **Given** 日誌訊息包含關鍵字「掃描」或「走訪」
- **When** LogPanel 渲染該條目
- **Then** 顯示 🔍 圖標，文字為藍色

**情境 D：開始訊息**

- **Given** 日誌訊息包含關鍵字「開始」
- **When** LogPanel 渲染該條目
- **Then** 顯示 ▶ 圖標，文字為灰色斜體

**情境 E：Decorator 可疊加**

- **Given** 日誌訊息同時包含兩個關鍵字（如「開始掃描」含「開始」+「掃描」）
- **When** LogPanel 渲染該條目
- **Then** 多個 Decorator 依序疊加套用，圖標以優先級高者為準，樣式合併

**情境 F：無關鍵字命中**

- **Given** 日誌訊息不含任何定義關鍵字
- **When** LogPanel 渲染該條目
- **Then** 顯示預設樣式（以 level 決定顏色，無圖標）

**優先級**: P0

---

### US-02：儀表板元件顯示完整進度（Adapter）

**As** 執行匯出或搜尋的使用者  
**I want** 看到一個儀表板面板，同時顯示百分比進度條與目前處理中的節點名稱  
**So that** 我知道系統目前在做什麼、還有多久完成

#### 驗收標準（Given-When-Then）

**情境 A：正常進度顯示**

- **Given** 匯出 / 搜尋操作進行中
- **When** `ProgressEvent` 每次更新
- **Then** 儀表板顯示：
  - 操作名稱（operationName）
  - 百分比進度條（percentage）
  - 目前處理中的節點訊息（message）
  - `current / total` 節點計數

**情境 B：操作完成**

- **Given** 操作的最後一個 `ProgressEvent` percentage === 100
- **When** 儀表板接收到完成事件
- **Then** 儀表板顯示完成狀態，2 秒後自動隱藏

**情境 C：介面轉換（Adapter 核心）**

- **Given** `DashboardObserver` 目前推送 `(percentage, isDone)`
- **When** 儀表板元件需要 `ProgressEvent` 中更豐富的資訊
- **Then** Adapter 負責將 `ProgressEvent` 轉換為儀表板元件的 Props 介面，`App.tsx` 無需手動拆解資料

**情境 D：無操作時隱藏**

- **Given** 沒有進行中的操作
- **When** 頁面載入
- **Then** 儀表板元件不渲染（不佔版面空間）

**優先級**: P0

---

## 3. 功能需求（Functional Requirements）

### FR-01：Domain 層 `LogEntryDecorator` 介面（P0）

- 在 `src/domain/observer/` 新增 Decorator 介面 `ILogEntryDecorator`
- 介面定義：`decorate(entry: LogEntry): DecoratedLogEntry`
- `DecoratedLogEntry` 擴充 `LogEntry`，新增 `icon?: string` 與 `styleHints: StyleHint[]`
- `StyleHint` 為 `'bold' | 'italic' | 'color-green' | 'color-yellow' | 'color-blue' | 'color-gray'` 的 Union Type

### FR-02：具體 Decorator 實作（P0）

在 `src/services/decorators/` 建立四個具體 Decorator，每個針對特定關鍵字集合：

| Decorator 類別     | 觸發關鍵字         | 圖標 | StyleHint              |
| ------------------ | ------------------ | ---- | ---------------------- |
| `SuccessDecorator` | 「完成」           | ✅   | `color-green`, `bold`  |
| `WarningDecorator` | 「警告」、「失敗」 | ⚠️   | `color-yellow`         |
| `ScanDecorator`    | 「掃描」、「走訪」 | 🔍   | `color-blue`           |
| `StartDecorator`   | 「開始」           | ▶    | `color-gray`, `italic` |

### FR-03：Decorator 鏈（Chain）機制（P0）

- 新增 `LogEntryDecoratorChain`（`src/services/decorators/`）
- 接受 `ILogEntryDecorator[]`，依序呼叫每個 Decorator，合併 `styleHints`（concat），圖標以第一個命中者為準（優先級順序：SUCCESS > WARNING > SCAN > START）
- 無命中時回傳原始 `LogEntry`（無 icon，styleHints 以 level 決定）

### FR-04：`ConsoleObserver` 整合 Decorator Chain（P0）

- `ConsoleObserver` constructor 接受選用的 `chain?: LogEntryDecoratorChain`
- 若傳入 chain，在推送前先執行 `chain.decorate(entry)` 得到 `DecoratedLogEntry`
- 向後相容：不傳 chain 時行為與現有完全一致

### FR-05：全新 `DashboardPanel` 元件（P0）

- 路徑：`src/components/DashboardPanel.tsx`
- Props（由 Adapter 決定）：`DashboardPanelProps`（見 FR-06）
- 顯示內容：操作名稱、百分比進度條、message（目前節點）、`current / total`

### FR-06：`ProgressEventAdapter`（P0）

- 路徑：`src/services/adapters/ProgressEventAdapter.ts`
- 職責：將 `ProgressEvent` 轉換為 `DashboardPanelProps`
- `DashboardPanelProps` 定義：
  ```ts
  interface DashboardPanelProps {
    operationName: string;
    percentage: number;
    current: number;
    total: number;
    message: string;
    isDone: boolean;
    phase: "export" | "scan";
  }
  ```
- 提供靜態方法 `ProgressEventAdapter.adapt(event: ProgressEvent): DashboardPanelProps`

### FR-07：`DashboardObserver` 升級（P0）

- 更新 `DashboardObserver`，callback 改為 `(props: DashboardPanelProps) => void`
- App.tsx 使用 `ProgressEventAdapter.adapt()` 建構 callback，將 props 直接傳給 `DashboardPanel`

### FR-08：`LogPanel` 支援 `DecoratedLogEntry`（P0）

- `LogPanel` 的 `logs` prop 型別升級為 `Array<LogEntry | DecoratedLogEntry>`
- 渲染時檢查是否有 `icon`、`styleHints`，有則套用對應 CSS class
- 向後相容：純 `LogEntry` 仍以 level 決定樣式

---

## 4. 非功能需求（Non-Functional Requirements）

| 指標                 | 目標                                                             |
| -------------------- | ---------------------------------------------------------------- |
| Decorator 鏈執行時間 | < 1ms（同步、純字串比對）                                        |
| 介面向後相容         | ConsoleObserver 不傳 chain 時行為零變動                          |
| 測試覆蓋             | 每個 Decorator + Chain + Adapter 各自有單元測試                  |
| TypeScript 嚴格模式  | `tsc --noEmit` 零錯誤                                            |
| XSS 防護             | icon 字串為 Unicode emoji 常數，不使用 `dangerouslySetInnerHTML` |

---

## 5. 範圍（Scope）

### In Scope ✅

- Domain 層 `ILogEntryDecorator`、`DecoratedLogEntry`、`StyleHint` 型別定義
- 4 個具體 Decorator 實作（Success / Warning / Scan / Start）
- `LogEntryDecoratorChain` 合併機制
- `ProgressEventAdapter` 介面轉換
- 全新 `DashboardPanel` 元件
- `DashboardObserver` callback 簽章升級
- `LogPanel` 支援 `DecoratedLogEntry`
- 所有新增類別的單元測試

### Out of Scope ❌

- 修改 `ProgressEvent` Domain 值物件（不新增欄位）
- Decorator 關鍵字的動態設定（UI 設定介面）
- 多國語系（關鍵字目前只比對繁體中文）
- `ProgressBar` 元件（由新 `DashboardPanel` 取代其角色，但本身不刪除）

---

## 6. 設計模式對應

| 模式                  | 元件                                                         | 說明                                                                                         |
| --------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| **Decorator Pattern** | `ILogEntryDecorator` + 4 具體類別 + `LogEntryDecoratorChain` | Domain 層純邏輯，不依賴 React；可疊加、可擴充                                                |
| **Adapter Pattern**   | `ProgressEventAdapter`                                       | 將 `ProgressEvent`（既有介面）轉為 `DashboardPanelProps`（目標介面），`App.tsx` 無需手動拆解 |

---

## 7. 架構層對應（Clean Architecture）

```
src/
├── domain/observer/
│   ├── ILogEntryDecorator.ts    ← 新增（Domain 純介面）
│   ├── DecoratedLogEntry.ts     ← 新增（Domain VO 擴充）
│   └── index.ts                 ← 更新 barrel export
│
├── services/
│   ├── decorators/              ← 新增目錄（Services Layer）
│   │   ├── SuccessDecorator.ts
│   │   ├── WarningDecorator.ts
│   │   ├── ScanDecorator.ts
│   │   ├── StartDecorator.ts
│   │   ├── LogEntryDecoratorChain.ts
│   │   └── index.ts
│   └── adapters/                ← 新增目錄（Services Layer）
│       ├── ProgressEventAdapter.ts
│       └── index.ts
│
└── components/
    └── DashboardPanel.tsx       ← 新增（Presentation Layer）
```

---

## 8. 利害關係人

| 角色   | 關注點                                                     |
| ------ | ---------------------------------------------------------- |
| 使用者 | 日誌可讀性改善；操作進度透明化                             |
| 開發者 | Decorator / Adapter 介面符合 OCP，新增關鍵字不修改現有類別 |

---

## 9. 待確認事項

| 項目                                   | 說明                                                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Decorator 優先級順序                   | 本 spec 定義：SUCCESS > WARNING > SCAN > START；若實際需求不同請通知                                      |
| DashboardPanel 取代 ProgressBar 的位置 | 假設 DashboardPanel 放在 ProgressBar 原有的版面位置，ProgressBar 元件保留但 App.tsx 中改用 DashboardPanel |

---

⛔ **需求審核閘門**  
請主管 / PM 審核以上 spec，確認後請輸入 `@architect` 開始架構設計。
