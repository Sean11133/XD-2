# FRD.md — 005-decorator-adapter

> **功能需求設計文件**  
> **對應 spec**: [spec.md](spec.md)  
> **建立日期**: 2026-03-30  
> **技術棧**: React 19 + TypeScript + Vite + Tailwind CSS 4 + Vitest

---

## 規範基線（Phase 0 載入清單）

| 類別 | 規範文件 | 關鍵約束 |
|------|---------|---------|
| 架構 | `standards/clean-architecture.md` | Domain 不可依賴 Application/Presentation；介面定義在 Domain/Application 層 |
| 設計原則 | `standards/solid-principles.md` | SRP：每個 Decorator 只負責一組關鍵字；OCP：新增關鍵字只需新增 Decorator 類別 |
| 設計模式 | `standards/design-patterns.md` | Decorator Pattern（結構型）：包裝物件新增行為；Adapter Pattern（結構型）：介面轉換 |
| DDD | `standards/ddd-guidelines.md` | LogEntry / DecoratedLogEntry 為 Value Object（不可變、無 ID）；ProgressEvent 為 Domain Event |
| 前端 | `standards/coding-standard-frontend.md` | 元件 Props 介面明確型別；不使用 `dangerouslySetInnerHTML`；emoji 為常數字串 |

---

## 1. 架構概述

### 1.1 整體設計思路

本需求在現有 **Observer Pattern（Subject + ConsoleObserver + DashboardObserver）** 之上，新增兩條「後處理」路徑：

- **Decorator 鏈**（日誌端）：`ConsoleObserver` 產出 `LogEntry` 之後，送入 `LogEntryDecoratorChain` 進行關鍵字比對，輸出帶有 `icon` + `styleHints` 的 `DecoratedLogEntry`，由 `LogPanel` 依據 styleHints 決定 CSS class。
- **Adapter 轉換**（儀表板端）：`DashboardObserver` 接收完整 `ProgressEvent`，透過 `ProgressEventAdapter.adapt()` 轉為 `DashboardPanelProps`，直接傳給全新 `DashboardPanel` 元件，`App.tsx` 無需手動拆解資料。

### 1.2 Clean Architecture 依賴方向

```
Presentation  →  Services  →  Domain
   LogPanel         DecoratorChain    ILogEntryDecorator
   DashboardPanel   Adapters          DecoratedLogEntry
   App.tsx          ConsoleObserver   ProgressEvent

Domain 層永遠不向外依賴 ✅
```

---

## 2. C4 Context Diagram

```mermaid
flowchart TB
    User(["👤 使用者"])
    App["⚛️ File Management System\n(React 19 + TypeScript)"]

    User -- "觸發匯出 / 搜尋\n查看日誌與進度" --> App
```

---

## 3. C4 Container Diagram

```mermaid
flowchart LR
    subgraph Browser["瀏覽器"]
        subgraph Presentation["Presentation Layer"]
            AppTsx["App.tsx\n- 整合 Subject + Observer\n- 傳遞 DecoratedLogEntry 給 LogPanel\n- 傳遞 DashboardPanelProps 給 DashboardPanel"]
            LogPanel["LogPanel.tsx\n接受 LogEntry | DecoratedLogEntry"]
            DashboardPanel["DashboardPanel.tsx（新）\n接受 DashboardPanelProps"]
            ProgressBar["ProgressBar.tsx\n（保留，不刪除）"]
        end

        subgraph Services["Services Layer"]
            ConsoleObs["ConsoleObserver\n（整合 DecoratorChain）"]
            DashboardObs["DashboardObserver\n（callback 升級）"]
            DecChain["LogEntryDecoratorChain\n+ 4 個 Decorator"]
            Adapter["ProgressEventAdapter\nadapt(event) → DashboardPanelProps"]
        end

        subgraph Domain["Domain Layer（純 TypeScript）"]
            IDecorator["ILogEntryDecorator\n（介面）"]
            DecoratedLE["DecoratedLogEntry\n（Value Object）"]
            StyleHint["StyleHint\n（Union Type）"]
            LogEntry["LogEntry\n（已存在）"]
            ProgressEvent["ProgressEvent\n（已存在，不修改）"]
        end
    end

    AppTsx --> ConsoleObs
    AppTsx --> DashboardObs
    AppTsx --> LogPanel
    AppTsx --> DashboardPanel
    ConsoleObs --> DecChain
    DecChain --> IDecorator
    DecChain --> DecoratedLE
    DashboardObs --> Adapter
    Adapter --> ProgressEvent
```

---

## 4. C4 Component Diagram（核心路徑）

```mermaid
flowchart TB
    subgraph "日誌端 Decorator 鏈"
        PE1["ProgressEvent"] -->|onProgress| ConsObs["ConsoleObserver"]
        ConsObs -->|產出 LogEntry| Chain["LogEntryDecoratorChain"]
        Chain -->|依序呼叫| SD["SuccessDecorator\n關鍵字：完成"]
        Chain -->|依序呼叫| WD["WarningDecorator\n關鍵字：警告、失敗"]
        Chain -->|依序呼叫| ScanD["ScanDecorator\n關鍵字：掃描、走訪"]
        Chain -->|依序呼叫| StartD["StartDecorator\n關鍵字：開始"]
        Chain -->|產出| DLE["DecoratedLogEntry\n{ icon, styleHints[], ...LogEntry }"]
        DLE --> LP["LogPanel\n依 styleHints 決定 CSS"]
    end

    subgraph "儀表板端 Adapter"
        PE2["ProgressEvent"] -->|onProgress| DashObs["DashboardObserver"]
        DashObs -->|呼叫| Adpt["ProgressEventAdapter.adapt()"]
        Adpt -->|產出| DPP["DashboardPanelProps\n{ operationName, percentage,\ncurrent, total, message,\nisDone, phase }"]
        DPP --> DP["DashboardPanel\n顯示完整進度資訊"]
    end
```

---

## 5. 領域建模（DDD）

### 5.1 Bounded Context

本需求屬於現有 `FileSystem` Bounded Context 的 **Observer Sub-domain** 擴充，不引入新的 Context 邊界。

### 5.2 Value Objects（新增）

#### `StyleHint`（Union Type）

```typescript
export type StyleHint =
  | 'bold'
  | 'italic'
  | 'color-green'
  | 'color-yellow'
  | 'color-blue'
  | 'color-gray';
```

- **不可變**：Union Type 天然不可變
- **無 ID**：樣式提示不需唯一識別

#### `DecoratedLogEntry`（擴充自 LogEntry）

```typescript
export interface DecoratedLogEntry extends LogEntry {
  readonly icon?: string;          // Unicode emoji 常數，如 "✅"
  readonly styleHints: StyleHint[]; // 可疊加的樣式描述陣列
}
```

- **不可變**：所有欄位 `readonly`
- **不引用任何框架**：純 TypeScript，Domain 層純淨 ✅

#### `DashboardPanelProps`（Adapter 輸出）

```typescript
export interface DashboardPanelProps {
  readonly operationName: string;
  readonly percentage: number;     // 0–100
  readonly current: number;
  readonly total: number;
  readonly message: string;
  readonly isDone: boolean;
  readonly phase: 'export' | 'scan';
}
```

> 注意：`DashboardPanelProps` 定義在 `src/domain/observer/` — 它是 Domain 值物件的 Projection，不是 React Props Type。元件 `DashboardPanel.tsx` 直接使用此型別。

### 5.3 Domain 介面（新增）

#### `ILogEntryDecorator`

```typescript
export interface ILogEntryDecorator {
  decorate(entry: LogEntry): DecoratedLogEntry;
}
```

---

## 6. Sequence Diagrams

### 6.1 日誌端序列（含 Decorator Chain）

```mermaid
sequenceDiagram
    participant App as App.tsx
    participant Subj as ProgressSubjectImpl
    participant ConsObs as ConsoleObserver
    participant Chain as LogEntryDecoratorChain
    participant Dec as SuccessDecorator（等）
    participant LP as LogPanel

    App->>Subj: notify(ProgressEvent)
    Subj->>ConsObs: onProgress(event)
    ConsObs->>ConsObs: 產出 LogEntry { level, message }
    ConsObs->>Chain: decorate(entry)
    Chain->>Dec: decorate(entry)（依序呼叫）
    Dec-->>Chain: DecoratedLogEntry（或 null=未命中）
    Chain-->>ConsObs: DecoratedLogEntry（合併 styleHints）
    ConsObs->>App: callback(DecoratedLogEntry)
    App->>LP: logs={[...DecoratedLogEntry]}
    LP->>LP: 依 styleHints 決定 className
```

### 6.2 儀表板端序列（含 Adapter）

```mermaid
sequenceDiagram
    participant App as App.tsx
    participant Subj as ProgressSubjectImpl
    participant DashObs as DashboardObserver
    participant Adapter as ProgressEventAdapter
    participant DP as DashboardPanel

    App->>Subj: notify(ProgressEvent)
    Subj->>DashObs: onProgress(event)
    DashObs->>Adapter: adapt(event)
    Adapter-->>DashObs: DashboardPanelProps
    DashObs->>App: callback(DashboardPanelProps)
    App->>DP: props={DashboardPanelProps}
    DP->>DP: 渲染進度條 + message + current/total
```

---

## 7. 設計模式決策（ADR）

### ADR-001：Decorator Pattern 在 Domain 層定義介面，Services 層實作

**決策**：`ILogEntryDecorator` 介面放在 `src/domain/observer/`；四個具體 Decorator + Chain 放在 `src/services/decorators/`。

**理由**：
- Domain 層定義「什麼是裝飾」（介面 + VO），Services 層定義「如何裝飾」（關鍵字邏輯）
- 符合 Clean Architecture 依賴規則：Services → Domain ✅
- 新增關鍵字只需新增一個 Decorator 類別，不修改任何現有程式碼（OCP ✅）

**依據規範**：`standards/clean-architecture.md §1.3`、`standards/design-patterns.md §Decorator`、`standards/solid-principles.md §OCP`

---

### ADR-002：Adapter Pattern 在 Services 層，靜態方法實作

**決策**：`ProgressEventAdapter` 為純靜態工具類（無狀態），提供 `adapt(event): DashboardPanelProps`。

**理由**：
- Adapter 無狀態，靜態方法可直接使用，無需實例化
- `DashboardObserver` callback 升級為 `(props: DashboardPanelProps) => void`，`App.tsx` 只需傳入 `(props) => setState(props)` 即可，無需手動解構 `ProgressEvent`（SRP ✅）

**依據規範**：`standards/design-patterns.md §Adapter`、`standards/solid-principles.md §SRP`

---

### ADR-003：Decorator Chain 優先級策略

**決策**：圖標以「第一個命中者為準」，按 SUCCESS > WARNING > SCAN > START 順序排列；styleHints 全部合併（concat，去重）。

**理由**：
- SUCCESS（完成）語意最強，優先顯示綠色 ✅
- styleHints 合併允許一條訊息同時是粗體（SUCCESS）+ 斜體（START），視覺更豐富

**依據規範**：spec.md §FR-03

---

### ADR-004：`DashboardPanel` 取代 `ProgressBar` 在 App.tsx 的使用

**決策**：`App.tsx` 改用 `DashboardPanel`；`ProgressBar` 元件保留（不刪除），可供未來其他場景使用。

**理由**：
- OCP：不破壞現有 `ProgressBar` 元件及其測試
- `DashboardPanel` 顯示更豐富的進度資訊，功能超集於 `ProgressBar`

**依據規範**：spec.md §Out of Scope、`standards/solid-principles.md §OCP`

---

## 8. 目錄結構（變更摘要）

```
file-management-system/src/
├── domain/observer/
│   ├── StyleHint.ts              ← 新增（Union Type VO）
│   ├── DecoratedLogEntry.ts      ← 新增（Value Object）
│   ├── DashboardPanelProps.ts    ← 新增（Adapter 目標介面）
│   ├── ILogEntryDecorator.ts     ← 新增（Decorator 介面）
│   └── index.ts                  ← 更新 barrel export
│
├── services/
│   ├── decorators/               ← 新目錄
│   │   ├── SuccessDecorator.ts
│   │   ├── WarningDecorator.ts
│   │   ├── ScanDecorator.ts
│   │   ├── StartDecorator.ts
│   │   ├── LogEntryDecoratorChain.ts
│   │   └── index.ts
│   ├── adapters/                 ← 新目錄
│   │   ├── ProgressEventAdapter.ts
│   │   └── index.ts
│   └── observers/
│       ├── ConsoleObserver.ts    ← 修改（整合 chain 參數）
│       └── DashboardObserver.ts  ← 修改（callback 升級）
│
└── components/
    └── DashboardPanel.tsx        ← 新增

file-management-system/tests/
├── services/decorators/          ← 新目錄
│   ├── SuccessDecorator.test.ts
│   ├── WarningDecorator.test.ts
│   ├── ScanDecorator.test.ts
│   ├── StartDecorator.test.ts
│   └── LogEntryDecoratorChain.test.ts
├── services/adapters/            ← 新目錄
│   └── ProgressEventAdapter.test.ts
└── components/
    └── DashboardPanel.test.tsx   ← 新增
```

---

## 9. UI 版面配置

### DashboardPanel 視覺設計

```
┌─────────────────────────────────────────────────────┐
│  ⚙️ 匯出 JSON  ·  掃描                              📊 7 / 14 │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░         48%          │
│  📄 掃描 requirements.docx                            │
└─────────────────────────────────────────────────────┘
```

欄位說明：
- 左上：phase 圖標 + operationName
- 右上：`current / total` 計數
- 中：進度條（藍色進行中 → 綠色完成）
- 左下：percentage 百分比
- 右下：目前 message

### LogPanel 樣式對應表

| styleHints 組合 | CSS 效果 |
|----------------|---------|
| `['color-green', 'bold']` | `text-emerald-600 font-bold` |
| `['color-yellow']` | `text-amber-500` |
| `['color-blue']` | `text-blue-600` |
| `['color-gray', 'italic']` | `text-slate-400 italic` |
| 無 styleHints（LEVEL fallback） | 現有的 LEVEL_CLASS 映射 |
