# plan.md — 005-decorator-adapter

> **執行計畫文件**  
> **對應設計**: [FRD.md](FRD.md)  
> **對應需求**: [spec.md](spec.md)  
> **建立日期**: 2026-03-30  
> **技術棧**: React 19 + TypeScript + Vite + Tailwind CSS 4 + Vitest

---

## 工作拆解（Task Breakdown）

### T-01：建立 Domain 層型別定義

**描述**：在 `src/domain/observer/` 新增四個純 TypeScript 型別定義檔案，不引用任何框架。

新增檔案：
- `StyleHint.ts`：`export type StyleHint = 'bold' | 'italic' | 'color-green' | 'color-yellow' | 'color-blue' | 'color-gray'`
- `DecoratedLogEntry.ts`：擴充 `LogEntry`，加入 `readonly icon?: string` 與 `readonly styleHints: StyleHint[]`
- `DashboardPanelProps.ts`：定義 `{ operationName, percentage, current, total, message, isDone, phase }`，全部 `readonly`
- `ILogEntryDecorator.ts`：介面 `decorate(entry: LogEntry): DecoratedLogEntry`
- 更新 `index.ts`：barrel export 以上所有型別

**架構層**：Domain  
**設定檔**：無  
**複雜度**：低  
**前置依賴**：無

---

### T-02：實作四個具體 Decorator 類別

**描述**：在 `src/services/decorators/` 建立 4 個 Decorator，各自實作 `ILogEntryDecorator`。

每個 Decorator 邏輯：
1. 檢查 `entry.message` 是否包含觸發關鍵字（`includes()`，不分大小寫）
2. 若命中：回傳新的 `DecoratedLogEntry`（spread `...entry`，附加 `icon` + `styleHints`）
3. 若未命中：回傳原始 `entry`（`styleHints: []`，無 `icon`），讓 Chain 知道未命中

具體類別：
```typescript
// SuccessDecorator.ts
keywords = ['完成']  →  icon = '✅', styleHints = ['color-green', 'bold']

// WarningDecorator.ts
keywords = ['警告', '失敗']  →  icon = '⚠️', styleHints = ['color-yellow']

// ScanDecorator.ts
keywords = ['掃描', '走訪']  →  icon = '🔍', styleHints = ['color-blue']

// StartDecorator.ts
keywords = ['開始']  →  icon = '▶', styleHints = ['color-gray', 'italic']
```

新增 `index.ts`：barrel export 四個類別

**架構層**：Services  
**設定檔**：無  
**複雜度**：低  
**前置依賴**：T-01

---

### T-03：實作 `LogEntryDecoratorChain`

**描述**：在 `src/services/decorators/LogEntryDecoratorChain.ts` 實作 Decorator 鏈。

```typescript
export class LogEntryDecoratorChain {
  constructor(private readonly _decorators: ILogEntryDecorator[]) {}

  decorate(entry: LogEntry): DecoratedLogEntry {
    let firstIcon: string | undefined = undefined;
    const allHints: StyleHint[] = [];

    for (const dec of this._decorators) {
      const result = dec.decorate(entry);
      // 有命中（有 icon 或 styleHints 非空）才計入
      if (result.icon !== undefined && firstIcon === undefined) {
        firstIcon = result.icon;
      }
      allHints.push(...result.styleHints);
    }

    // 去重 styleHints
    const uniqueHints = [...new Set(allHints)];

    return {
      ...entry,
      icon: firstIcon,
      styleHints: uniqueHints,
    };
  }
}
```

更新 `index.ts` 加入 `LogEntryDecoratorChain` export。

**架構層**：Services  
**設定檔**：無  
**複雜度**：中  
**前置依賴**：T-01, T-02

---

### T-04：實作 `ProgressEventAdapter`

**描述**：在 `src/services/adapters/ProgressEventAdapter.ts` 實作靜態 Adapter。

```typescript
import type { ProgressEvent } from '../../domain/observer/ProgressEvent';
import type { DashboardPanelProps } from '../../domain/observer/DashboardPanelProps';

export class ProgressEventAdapter {
  static adapt(event: ProgressEvent): DashboardPanelProps {
    return {
      operationName: event.operationName,
      percentage: event.percentage,
      current: event.current,
      total: event.total,
      message: event.message,
      isDone: event.percentage === 100,
      phase: event.phase,
    };
  }
}
```

新增 `src/services/adapters/index.ts` barrel export。

**架構層**：Services  
**設定檔**：無  
**複雜度**：低  
**前置依賴**：T-01

---

### T-05：升級 `ConsoleObserver` 整合 Decorator Chain

**描述**：修改 `src/services/observers/ConsoleObserver.ts`，constructor 加入選用參數 `chain?: LogEntryDecoratorChain`。

```typescript
constructor(
  private readonly _onLog: (entry: LogEntry | DecoratedLogEntry) => void,
  private readonly _chain?: LogEntryDecoratorChain,
) {}

onProgress(event: ProgressEvent): void {
  // 現有 LogEntry 產生邏輯不變
  const entry: LogEntry = { level, message, timestamp: event.timestamp };

  // 有 chain 時套用裝飾
  const output = this._chain ? this._chain.decorate(entry) : entry;
  this._onLog(output);
}
```

**向後相容**：不傳 chain 時行為完全不變，現有測試全數通過。

**架構層**：Services  
**設定檔**：無  
**複雜度**：低  
**前置依賴**：T-03

---

### T-06：升級 `DashboardObserver` callback 簽章

**描述**：修改 `src/services/observers/DashboardObserver.ts`，callback 由 `(percentage, isDone)` 改為 `(props: DashboardPanelProps) => void`。

```typescript
import { ProgressEventAdapter } from '../adapters/ProgressEventAdapter';
import type { DashboardPanelProps } from '../../domain/observer/DashboardPanelProps';

export class DashboardObserver implements IProgressObserver {
  constructor(
    private readonly _onUpdate: (props: DashboardPanelProps) => void,
  ) {}

  onProgress(event: ProgressEvent): void {
    this._onUpdate(ProgressEventAdapter.adapt(event));
  }
}
```

**架構層**：Services  
**設定檔**：無  
**複雜度**：低  
**前置依賴**：T-04

---

### T-07：建立 `DashboardPanel` React 元件

**描述**：新增 `src/components/DashboardPanel.tsx`。

Props 型別：直接使用 `DashboardPanelProps`（來自 Domain 層）。

視覺設計：
- 進行中：橘色 phase badge + 藍色進度條 + message + `current/total`
- 完成：綠色進度條 + ✅ 完成提示 + 2s 後自動隱藏（`setTimeout`，`useEffect` cleanup）
- 無操作（`percentage === 0 && !isDone`）：不渲染

重要：`operationName` / `message` 透過 React JSX 渲染，禁止 `dangerouslySetInnerHTML`（XSS ✅）

**架構層**：Presentation  
**設定檔**：無  
**複雜度**：中  
**前置依賴**：T-01

---

### T-08：升級 `LogPanel` 支援 `DecoratedLogEntry`

**描述**：修改 `src/components/LogPanel.tsx`。

prop 型別：`logs: Array<LogEntry | DecoratedLogEntry>`

在渲染每條日誌時：
1. 檢查 `'styleHints' in entry`（型別守衛）
2. 若有 `styleHints`，依下列映射決定 CSS class（多個 hint 可同時套用）：
   - `color-green` → `text-emerald-600`
   - `color-yellow` → `text-amber-500`
   - `color-blue` → `text-blue-600`
   - `color-gray` → `text-slate-400`
   - `bold` → `font-bold`
   - `italic` → `italic`
3. 若無 `styleHints`（純 `LogEntry`），使用現有 `LEVEL_CLASS` fallback
4. 若有 `icon`，在訊息前顯示圖標

**向後相容**：純 `LogEntry` 仍正常顯示，現有測試全數通過。

**架構層**：Presentation  
**設定檔**：無  
**複雜度**：中  
**前置依賴**：T-01

---

### T-09：更新 `App.tsx` 整合新元件與 Chain

**描述**：修改 `src/App.tsx`：

1. 建立預設 Decorator Chain（全域常數，避免每次 render 重建）：
   ```typescript
   const DEFAULT_CHAIN = new LogEntryDecoratorChain([
     new SuccessDecorator(),
     new WarningDecorator(),
     new ScanDecorator(),
     new StartDecorator(),
   ]);
   ```
2. `ConsoleObserver` 建構時傳入 `DEFAULT_CHAIN`
3. `DashboardObserver` callback 改為 `(props) => setDashboardProps(props)`
4. 新增 `dashboardProps` state（型別 `DashboardPanelProps | null`）
5. 將 `<ProgressBar>` 替換為 `<DashboardPanel>` 在 JSX 中

**架構層**：Presentation  
**設定檔**：無  
**複雜度**：中  
**前置依賴**：T-05, T-06, T-07, T-08

---

### T-10：單元測試（Decorators + Chain + Adapter）

**描述**：在 `tests/services/decorators/` + `tests/services/adapters/` 新增單元測試。

測試檔案清單：

| 檔案 | 測試重點 |
|------|---------|
| `SuccessDecorator.test.ts` | 含「完成」→ icon=✅, hints=[color-green,bold]；不含→ no icon |
| `WarningDecorator.test.ts` | 含「警告」→ ⚠️；含「失敗」→ ⚠️；不含→ no icon |
| `ScanDecorator.test.ts` | 含「掃描」→ 🔍；含「走訪」→ 🔍；不含→ no icon |
| `StartDecorator.test.ts` | 含「開始」→ ▶, hints=[color-gray,italic] |
| `LogEntryDecoratorChain.test.ts` | 無命中→ 空 icon+hints；單一命中→ 正確；疊加（「開始掃描」）→ hint 合併，icon 以優先級高者為準 |
| `ProgressEventAdapter.test.ts` | percentage=50→isDone:false；percentage=100→isDone:true；欄位映射正確 |

**架構層**：Test  
**設定檔**：無  
**複雜度**：低  
**前置依賴**：T-01, T-02, T-03, T-04

---

### T-11：元件測試（DashboardPanel + LogPanel 升級）

**描述**：新增 / 更新元件測試。

**`tests/components/DashboardPanel.test.tsx`（新增）**：
- `percentage=0, isDone=false` → 不渲染
- `percentage=50, isDone=false` → 顯示 operationName + current/total + message
- `isDone=true` → 2s 後隱藏（`vi.useFakeTimers()`）
- phase badge 顯示（export / scan）

**`tests/components/LogPanel.test.tsx`（更新）**：
- `DecoratedLogEntry` with `styleHints=['color-green','bold']` → 對應 CSS class 存在
- `DecoratedLogEntry` with `icon='✅'` → 圖標顯示
- 純 `LogEntry`（無 styleHints）→ 仍以 LEVEL_CLASS 顯示（向後相容）

**架構層**：Test  
**設定檔**：無  
**複雜度**：中  
**前置依賴**：T-07, T-08

---

## 測試策略

| 層級 | 工具 | 重點 |
|------|------|------|
| Domain VO | Vitest（純 TypeScript） | 型別守衛、readonly 不可變 |
| Services（Decorator/Adapter） | Vitest（純 TypeScript，無 DOM） | 關鍵字命中邏輯、Chain 疊加、Adapter 映射 |
| Components | Vitest + @testing-library/react（jsdom） | 視覺分支、auto-hide timer |
| 整合 | 現有 `exporterWithObserver.test.ts`（延伸）| Observer + Chain + Adapter 端到端 |

---

## 執行順序

```
T-01 → T-02, T-04（可並行）
T-02 → T-03
T-03 → T-05
T-04 → T-06
T-05, T-06, T-01 → T-07, T-08（可並行）
T-07, T-08 → T-09
T-01~T-04 → T-10（可提前並行）
T-07, T-08 → T-11
全部完成後 → @reviewer → @reporter
```

---

## 部署架構

本需求為純前端 React 應用，無後端變更，無新的環境設定檔需求。  
`npx vite build` 輸出靜態資源，部署方式與現有一致。
