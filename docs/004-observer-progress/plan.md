# 執行計畫（Plan）

> **對應設計文件**：`docs/004-observer-progress/FRD.md`
> **對應需求規格**：`docs/004-observer-progress/spec.md`
> **版本**：v1.0.0 | **建立日期**：2026-03-30

---

## 工作拆解（Task Breakdown）

### 依賴關係總覽

```
T-01（Domain 介面）
  └── T-02（ProgressSubjectImpl）── T-05（BaseExporterTemplate 整合）
  └── T-03（ConsoleObserver）    ─┐
  └── T-04（DashboardObserver）  ─┤── T-08（App.tsx 整合）
                                  ├── T-06（ProgressBar 元件）
                                  └── T-07（LogPanel 元件）
T-09（單元測試）── 依賴 T-01~T-05
T-10（整合測試）── 依賴 T-01~T-08
```

---

### T-01：定義 Observer Domain 介面與值物件

| 欄位            | 內容   |
| --------------- | ------ |
| **架構層**      | Domain |
| **複雜度**      | 低     |
| **前置依賴**    | 無     |
| **配置/設定檔** | 無     |

**詳細描述**

在 `src/domain/observer/` 目錄下建立以下 4 個純 TypeScript 介面/型別檔案（不引用任何框架）：

**1. `ProgressEvent.ts`**

```typescript
export interface ProgressEvent {
  readonly phase: "export" | "scan";
  readonly operationName: string;
  readonly current: number;
  readonly total: number;
  readonly percentage: number; // Math.round(current / total * 100)
  readonly message: string;
  readonly timestamp: Date;
}
```

**2. `LogEntry.ts`**

```typescript
export interface LogEntry {
  readonly level: "INFO" | "SUCCESS" | "WARNING";
  readonly message: string;
  readonly timestamp: Date;
}
```

**3. `IProgressObserver.ts`**

```typescript
import type { ProgressEvent } from "./ProgressEvent";
export interface IProgressObserver {
  onProgress(event: ProgressEvent): void;
}
```

**4. `IProgressSubject.ts`**

```typescript
import type { IProgressObserver } from "./IProgressObserver";
import type { ProgressEvent } from "./ProgressEvent";
export interface IProgressSubject {
  subscribe(observer: IProgressObserver): void;
  unsubscribe(observer: IProgressObserver): void;
  notify(event: ProgressEvent): void;
}
```

**5. `index.ts`（barrel export）**

```typescript
export type { ProgressEvent } from "./ProgressEvent";
export type { LogEntry } from "./LogEntry";
export type { IProgressObserver } from "./IProgressObserver";
export type { IProgressSubject } from "./IProgressSubject";
```

**驗收條件**：TypeScript 編譯無錯誤；不含任何 React/DOM import。

---

### T-02：實作 ProgressSubjectImpl

| 欄位            | 內容                 |
| --------------- | -------------------- |
| **架構層**      | Application/Services |
| **複雜度**      | 低                   |
| **前置依賴**    | T-01                 |
| **配置/設定檔** | 無                   |

**詳細描述**

建立 `src/services/observers/ProgressSubjectImpl.ts`：

```typescript
import type { IProgressSubject } from "../../domain/observer/IProgressSubject";
import type { IProgressObserver } from "../../domain/observer/IProgressObserver";
import type { ProgressEvent } from "../../domain/observer/ProgressEvent";

export class ProgressSubjectImpl implements IProgressSubject {
  private readonly _observers: IProgressObserver[] = [];

  subscribe(observer: IProgressObserver): void {
    if (!this._observers.includes(observer)) {
      this._observers.push(observer);
    }
  }

  unsubscribe(observer: IProgressObserver): void {
    const idx = this._observers.indexOf(observer);
    if (idx !== -1) this._observers.splice(idx, 1);
  }

  notify(event: ProgressEvent): void {
    for (const obs of this._observers) {
      obs.onProgress(event);
    }
  }
}
```

同步建立 `src/services/observers/index.ts` barrel：

```typescript
export { ProgressSubjectImpl } from "./ProgressSubjectImpl";
export { ConsoleObserver } from "./ConsoleObserver"; // T-03 後補
export { DashboardObserver } from "./DashboardObserver"; // T-04 後補
```

**驗收條件**：subscribe 防重複；unsubscribe 找不到時不拋例外；notify 依訂閱順序呼叫。

---

### T-03：實作 ConsoleObserver

| 欄位            | 內容                 |
| --------------- | -------------------- |
| **架構層**      | Application/Services |
| **複雜度**      | 低                   |
| **前置依賴**    | T-01                 |
| **配置/設定檔** | 無                   |

**詳細描述**

建立 `src/services/observers/ConsoleObserver.ts`：

```typescript
import type { IProgressObserver } from "../../domain/observer/IProgressObserver";
import type { ProgressEvent } from "../../domain/observer/ProgressEvent";
import type { LogEntry } from "../../domain/observer/LogEntry";

export class ConsoleObserver implements IProgressObserver {
  constructor(private readonly _onLog: (entry: LogEntry) => void) {}

  onProgress(event: ProgressEvent): void {
    const level: LogEntry["level"] =
      event.percentage === 100 ? "SUCCESS" : "INFO";

    const message =
      event.percentage === 0
        ? `${event.operationName} 開始，共 ${event.total} 個節點`
        : event.percentage === 100
          ? `${event.operationName} 完成 ✓`
          : `[${event.percentage}%] ${event.message}`;

    this._onLog({
      level,
      message,
      timestamp: event.timestamp,
    });
  }
}
```

**驗收條件**：

- `percentage === 0` → `level: 'INFO'`，message 包含「開始」與節點總數
- `percentage === 100` → `level: 'SUCCESS'`，message 包含「完成」
- `_onLog` callback 被呼叫次數等於 `onProgress` 呼叫次數
- 不含任何 React import

---

### T-04：實作 DashboardObserver

| 欄位            | 內容                 |
| --------------- | -------------------- |
| **架構層**      | Application/Services |
| **複雜度**      | 低                   |
| **前置依賴**    | T-01                 |
| **配置/設定檔** | 無                   |

**詳細描述**

建立 `src/services/observers/DashboardObserver.ts`：

```typescript
import type { IProgressObserver } from "../../domain/observer/IProgressObserver";
import type { ProgressEvent } from "../../domain/observer/ProgressEvent";

export class DashboardObserver implements IProgressObserver {
  constructor(
    private readonly _onUpdate: (percentage: number, isDone: boolean) => void,
  ) {}

  onProgress(event: ProgressEvent): void {
    this._onUpdate(event.percentage, event.percentage === 100);
  }
}
```

**驗收條件**：

- `percentage < 100` → `isDone: false`
- `percentage === 100` → `isDone: true`
- `_onUpdate` 每次 `onProgress()` 被呼叫時都執行
- 不含任何 React import

---

### T-05：修改 BaseExporterTemplate — 整合 Subject

| 欄位            | 內容                 |
| --------------- | -------------------- |
| **架構層**      | Application/Services |
| **複雜度**      | 中                   |
| **前置依賴**    | T-01、T-02           |
| **配置/設定檔** | 無                   |

**詳細描述**

修改 `src/services/exporters/BaseExporterTemplate.ts`：

**Step 1：在類別中新增 Subject 相關欄位與方法**

在現有欄位後新增三個 protected 欄位：

```typescript
protected _subject: IProgressSubject | null = null;
protected _totalNodes = 0;
protected _currentNode = 0;
protected _operationName = '';
```

新增 `setProgressSubject()` 方法（不影響既有 abstract 方法）：

```typescript
setProgressSubject(
  subject: IProgressSubject,
  totalNodes: number,
  operationName: string
): void {
  this._subject = subject;
  this._totalNodes = totalNodes;
  this._operationName = operationName;
  this._currentNode = 0;
}
```

新增 protected `_notifyProgress()` helper：

```typescript
protected _notifyProgress(message: string): void {
  if (!this._subject || this._totalNodes === 0) return;
  this._currentNode++;
  const percentage = Math.round(this._currentNode / this._totalNodes * 100);
  this._subject.notify({
    phase: 'export',
    operationName: this._operationName,
    current: this._currentNode,
    total: this._totalNodes,
    percentage,
    message,
    timestamp: new Date(),
  });
}
```

新增 protected `_notifyStart()` helper（percentage=0 的開始事件）：

```typescript
protected _notifyStart(): void {
  if (!this._subject) return;
  this._subject.notify({
    phase: 'export',
    operationName: this._operationName,
    current: 0,
    total: this._totalNodes,
    percentage: 0,
    message: `開始匯出，共 ${this._totalNodes} 個節點`,
    timestamp: new Date(),
  });
}
```

**Step 2：在 `visitDirectory`、`visitWordDocument`、`visitImageFile`、`visitTextFile` 末尾各呼叫一次 `_notifyProgress()`**

```typescript
visitDirectory(node: Directory): void {
  // ... 現有邏輯不變 ...
  this._notifyProgress(`目錄：${node.name}`);  // ← 新增，加在 _lines.push(renderDirClose) 之後
}

visitWordDocument(node: WordDocument): void {
  // ... 現有邏輯不變 ...
  this._notifyProgress(`文件：${node.fileName}`);  // ← 新增
}

visitImageFile(node: ImageFile): void {
  // ... 現有邏輯不變 ...
  this._notifyProgress(`圖片：${node.fileName}`);  // ← 新增
}

visitTextFile(node: TextFile): void {
  // ... 現有邏輯不變 ...
  this._notifyProgress(`文字檔：${node.fileName}`);  // ← 新增
}
```

**Step 3：修改便利函式接受可選 subject 參數**

修改 `src/services/exporters/JSONExporter.ts`：

```typescript
// 新增工具函式（放於同檔案頂層或移至 utils/）
function countNodes(dir: Directory): number {
  let count = 1;
  for (const child of dir.getChildren()) {
    count += child.isDirectory() ? countNodes(child as Directory) : 1;
  }
  return count;
}

// 修改 exportToJson（可選第二參數，向後相容）
export function exportToJson(
  root: Directory,
  subject?: IProgressSubject,
): string {
  const exporter = new JSONExporter();
  if (subject) {
    exporter.setProgressSubject(subject, countNodes(root), "JSONExporter");
    exporter._notifyStart(); // ← _notifyStart 改為 public 或另行設計
  }
  root.accept(exporter);
  return exporter.getResult();
}
```

> ⚠️ `_notifyStart()` 需改為 `public notifyStart(): void` 供外部呼叫，或另由便利函式在 `accept()` 前直接呼叫 `subject.notify({...0%})` — 後者可保持 `_notifyStart` 為 protected。

同樣修改 `MarkdownExporter.ts` 的 `exportToMarkdown` 與 `FileSystemXmlExporter.ts` 的 `exportToXml`。

**驗收條件**：

- 現有所有測試（`BaseExporterTemplate.test.ts`、`JSONExporter.test.ts`、`MarkdownExporter.test.ts`、`FileSystemXmlExporter.test.ts`）**零修改且全數通過**
- 傳入 subject 時，每個節點各觸發一次 `notify()`
- 不傳 subject 時，`_notifyProgress()` 為 no-op，不拋例外

---

### T-06：建立 ProgressBar React 元件

| 欄位            | 內容             |
| --------------- | ---------------- |
| **架構層**      | Presentation     |
| **複雜度**      | 低               |
| **前置依賴**    | 無（可並行開發） |
| **配置/設定檔** | 無               |

**詳細描述**

建立 `src/components/ProgressBar.tsx`：

```typescript
interface ProgressBarProps {
  percentage: number; // 0–100
  isDone: boolean; // true → 綠色，2s 後隱藏
  operationName?: string; // 顯示文字，如 "正在匯出 JSON..."
}
```

**UI 規格**（使用既有 Tailwind）：

- 外容器：僅在 `percentage > 0 || isDone` 時顯示（`isDone && percentage === 100` 後 2 秒自動隱藏，使用 `setTimeout` + local state）
- 進度條軌道：`h-2 rounded-full bg-gray-200`
- 進度條填充：`h-full rounded-full transition-all duration-300 ease-in-out`
  - 進行中：`bg-blue-500`，width = `${percentage}%`
  - 完成：`bg-green-500`，width = `100%`
- 文字標籤：`text-sm text-gray-600`，顯示 `operationName` + `percentage%`

使用 `useEffect` 監聽 `isDone`，`isDone === true` 後延遲 2000ms 設定 `visible = false` 隱藏元件。

**驗收條件**：

- `percentage=0, isDone=false` → 元件不顯示
- `percentage=50, isDone=false` → 藍色進度條寬 50%
- `percentage=100, isDone=true` → 綠色，2s 後隱藏

---

### T-07：建立 LogPanel React 元件

| 欄位            | 內容                         |
| --------------- | ---------------------------- |
| **架構層**      | Presentation                 |
| **複雜度**      | 低                           |
| **前置依賴**    | T-01（需引用 LogEntry 型別） |
| **配置/設定檔** | 無                           |

**詳細描述**

建立 `src/components/LogPanel.tsx`：

```typescript
import type { LogEntry } from "../domain/observer";

interface LogPanelProps {
  logs: LogEntry[];
  onClear: () => void;
  maxLogs?: number; // 預設 500
}
```

**UI 規格**（使用既有 Tailwind）：

- 外容器：`border rounded-lg bg-white shadow-sm`，最大高度 `max-h-48 overflow-y-auto`
- 標題列：`LogPanel` 標籤 + 右側「清除日誌」按鈕
- 日誌行：
  - `INFO` → `text-gray-600`，時間戳格式 `HH:mm:ss`
  - `SUCCESS` → `text-green-600 font-medium`
  - `WARNING` → `text-yellow-600`
- 每行格式：`HH:mm:ss [LEVEL] message`
- Log 自動捲動至最新：使用 `useRef` + `useEffect` 在 `logs` 變更時 `scrollIntoView`
- 超過 `maxLogs` 時：在 render 前 `slice(-maxLogs)` 截斷（DOMへの不必要な渲染減少）

**XSS 防護**：訊息文字純用 `{entry.message}` JSX 渲染，React 自動 escape，禁止 `dangerouslySetInnerHTML`。

**驗收條件**：

- 清空按鈕觸發 `onClear` prop
- 新增 log 後自動捲動至底部
- `logs` 為空時顯示「暫無日誌」提示文字

---

### T-08：修改 App.tsx — 整合 Subject、Observer 與 UI 元件

| 欄位            | 內容                               |
| --------------- | ---------------------------------- |
| **架構層**      | Presentation                       |
| **複雜度**      | 中                                 |
| **前置依賴**    | T-02、T-03、T-04、T-05、T-06、T-07 |
| **配置/設定檔** | 無                                 |

**詳細描述**

修改 `src/App.tsx`，完成以下整合：

**Step 1：新增 state**

```typescript
const [logs, setLogs] = useState<LogEntry[]>([]);
const [progressPct, setProgressPct] = useState(0);
const [progressDone, setProgressDone] = useState(false);
const [progressOp, setProgressOp] = useState("");
```

**Step 2：重構匯出 handlers，加入 Observer wiring**

每個 handler 遵循相同模式：

```typescript
const handleExportJson = () => {
  // 1. 重置狀態
  setProgressPct(0);
  setProgressDone(false);
  setProgressOp("正在匯出 JSON...");

  // 2. 建立 Subject + Observers（callback 注入 setState）
  const subject = new ProgressSubjectImpl();
  const consoleObs = new ConsoleObserver((entry) =>
    setLogs((prev) => [...prev.slice(-(maxLogs - 1)), entry]),
  );
  const dashObs = new DashboardObserver((pct, done) => {
    setProgressPct(pct);
    setProgressDone(done);
  });
  subject.subscribe(consoleObs);
  subject.subscribe(dashObs);

  // 3. 觸發匯出（同步，React batching 在此之後 flush）
  const json = exportToJson(root, subject);

  // 4. Cleanup
  subject.unsubscribe(consoleObs);
  subject.unsubscribe(dashObs);

  // 5. 觸發下載（不變）
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  // ... 下載邏輯 ...
};
```

**Step 3：在 JSX 中加入新元件**

```tsx
{
  /* 在 Toolbar 下方 */
}
<ProgressBar
  percentage={progressPct}
  isDone={progressDone}
  operationName={progressOp}
/>;

{
  /* 在 FileTreeView 下方 */
}
<LogPanel logs={logs} onClear={() => setLogs([])} />;
```

> ⚠️ 注意排序：ProgressBar 在 Toolbar 與 FileTreeView 之間；LogPanel 在頁面最底部。

**驗收條件**：

- 點擊任意匯出按鈕，ProgressBar 出現
- 操作完成後 LogPanel 顯示所有日誌（包含 INFO 與 SUCCESS）
- 2 秒後 ProgressBar 自動隱藏
- 點擊「清除日誌」→ LogPanel 清空

---

### T-09：補充單元測試

| 欄位            | 內容                         |
| --------------- | ---------------------------- |
| **架構層**      | Test                         |
| **複雜度**      | 中                           |
| **前置依賴**    | T-01、T-02、T-03、T-04、T-05 |
| **配置/設定檔** | 無                           |

**新增測試檔案**

**1. `tests/services/observers/ProgressSubjectImpl.test.ts`**

- subscribe 防重複
- unsubscribe 不存在的 observer 不拋例外
- notify 呼叫所有已訂閱 observer
- unsubscribe 後不再呼叫

**2. `tests/services/observers/ConsoleObserver.test.ts`**

- `percentage === 0` → INFO + 包含開始訊息
- `percentage === 50` → INFO
- `percentage === 100` → SUCCESS + 包含完成訊息
- callback 呼叫次數等於 onProgress 次數

**3. `tests/services/observers/DashboardObserver.test.ts`**

- `percentage < 100` → `isDone: false`
- `percentage === 100` → `isDone: true`
- callback 接收到正確的 percentage 值

**4. 修改 `tests/services/exporters/BaseExporterTemplate.test.ts`**（或 JSONExporter.test.ts）

- 新增「傳入 subject 時，每個節點各觸發一次 notify（使用 mock observer）」
- 新增「不傳 subject 時，匯出結果與原來相同」
- 確認現有所有測試**仍然通過（無任何修改）**

**驗收條件**：`vitest run` 全數通過，coverage > 90%（新增程式碼部分）

---

### T-10：整合測試與 UI 驗收

| 欄位            | 內容      |
| --------------- | --------- |
| **架構層**      | Test      |
| **複雜度**      | 中        |
| **前置依賴**    | T-01~T-08 |
| **配置/設定檔** | 無        |

**詳細描述**

**1. `tests/components/ProgressBar.test.tsx`**

- `percentage=0` → 不渲染（hidden）
- `percentage=50` → 藍色，寬 50%
- `percentage=100, isDone=true` → 綠色，2s 後隱藏（使用 `vi.useFakeTimers`）

**2. `tests/components/LogPanel.test.tsx`**

- renders 日誌列表
- 清除按鈕呼叫 onClear
- INFO/SUCCESS/WARNING 各自對應正確顏色 className
- 空 logs 顯示「暫無日誌」

**3. `tests/integration/exporterWithObserver.test.ts`（新增）**

- Given JSONExporter + ProgressSubjectImpl + ConsoleObserver
- When `exportToJson(root, subject)` 執行
- Then onProgress 呼叫次數 === countNodes(root) + 1（含開始事件）
- Last event: `percentage === 100`
- 回傳 JSON 字串可被 `JSON.parse()` 解析（原有行為不退化）

---

## 測試策略

| 層級     | 工具                     | 目標覆蓋率        | 重點                                   |
| -------- | ------------------------ | ----------------- | -------------------------------------- |
| 單元測試 | Vitest                   | ≥ 90%（新程式碼） | Observer/Subject 各自獨立可測          |
| 元件測試 | Vitest + Testing Library | ≥ 80%             | ProgressBar / LogPanel UI 行為         |
| 整合測試 | Vitest                   | 核心流程 100%     | Exporter → Subject → Observer 完整鏈路 |
| 回歸測試 | 現有全部測試（不修改）   | 100% pass         | 向後相容驗證                           |

---

## 部署架構

本專案為純前端 React SPA（Client-Side Rendered），無後端服務，Builder 為 Vite。

```
Local Dev:  vite dev      → http://localhost:5173
Production: vite build    → dist/ 靜態檔案（可部署至 Nginx / Vercel / GitHub Pages）
```

---

## 執行順序建議

由於 T-03（ConsoleObserver）與 T-04（DashboardObserver）對 T-01 的依賴是**只讀型別依賴**，可與 T-02、T-06 並行開發：

| 批次    | Tasks                      | 說明                                                      |
| ------- | -------------------------- | --------------------------------------------------------- |
| Batch 1 | **T-01**                   | 先確立介面合約（Domain 層），兩人可各自分工後續           |
| Batch 2 | **T-02、T-03、T-04、T-06** | 可並行（通知端 T-02、接收端 T-03/T-04、UI T-06 各自獨立） |
| Batch 3 | **T-05、T-07**             | T-05 需等 T-02 完成；T-07 需等 T-01 完成                  |
| Batch 4 | **T-08**                   | 整合層，依賴所有前序 Tasks                                |
| Batch 5 | **T-09、T-10**             | 測試層，依賴所有實作 Tasks                                |
