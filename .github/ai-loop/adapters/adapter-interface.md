# Adapter Interface — Framework Adapter 介面規範

> 設計模式：Strategy Pattern
> 所有 Framework Adapter 必須實作此介面定義的 9 個方法（7 個核心必須 + 2 個整合測試選用）。

## 介面定義

```typescript
// 概念介面定義（非 TypeScript 程式碼，僅供 AI Agent 理解）
interface FrameworkAdapter {
  getFrameworkName(): string;
  getLintCommand(): AdapterCommand;
  getTestCommand(): AdapterCommand;
  getBuildCommand(): AdapterCommand; // 不需要時回傳 NullCommand
  getInstructionsPath(): string;
  getReviewDimensions(): ReviewDimension[];
  parseErrorOutput(rawOutput: string): ParsedError[];
  getIntegrationTestCommand(): AdapterCommand; // Phase D 使用；不支援時回傳 NullCommand
  getIntegrationTestSetupCommand(): AdapterCommand; // Phase D 首次設定；不需要時回傳 NullCommand
}

interface AdapterCommand {
  command: string;
  args: string[];
  cwd?: string; // 相對於 project root，預設為 "."
  failOnNonZeroExit: boolean;
  noop?: boolean; // true = Null Object，Orchestrator 直接跳過此步驟
}

// Null Object Pattern — 取代裸 null，語義更明確
const NullCommand: AdapterCommand = {
  command: "",
  args: [],
  failOnNonZeroExit: false,
  noop: true,
};

interface ReviewDimension {
  id: string; // D0, D1, D2... （D0 保留給 spec_hash）
  name: string;
  description: string;
  severity_if_violated: "HIGH" | "MEDIUM" | "LOW";
  checklist: string[]; // 每項 Review 的具體問題
}

interface ParsedError {
  error_id: string; // 格式：{tool}-{rule}-{slug}-line{N}
  severity: "BLOCK" | "WARN";
  tool: string;
  message: string;
  file?: string;
  line?: number;
}
```

---

## 方法規範

### `getFrameworkName()`

返回框架名稱，用於 LoopState 的 `framework` 欄位。

| 框架                            | 返回值          |
| ------------------------------- | --------------- |
| Angular + WEC Component Library | `"angular-wec"` |
| .NET 8                          | `"dotnet"`      |
| Python 3.10+                    | `"python"`      |

---

### `getLintCommand()`

- **目的**：靜態程式碼分析，Fast-Fail 機制的第一道門
- **失敗行為**：Lint 失敗 → `result=FAIL` → 直接返回 Developer Phase（跳過 Test + Review）
- **輸出**：原始 stdout/stderr 傳給 `parseErrorOutput()`

---

### `getBuildCommand()`

- **目的**：編譯確認，Fast-Fail 機制的第二道門
- **不需要時**：語言不需要編譯步驟時（如 Python）返回 `NullCommand`，Orchestrator 跳過此步驟
- **失敗行為**：Build 失敗 → `result=FAIL` → 返回 Developer Phase

---

### `getTestCommand()`

- **目的**：執行測試套件，取得 PASS/FAIL + 覆蓋率
- **失敗行為**：Test 失敗 → 最多 Heal 3 次 → 仍 FAIL → `result=FAIL`

---

### `getInstructionsPath()`

- **目的**：告知 Developer Phase 需要載入哪個 instructions 文件
- **格式**：相對於 repo 根目錄的路徑
- **範例**：`".github/instructions/angular.instructions.md"`

---

### `getReviewDimensions()`

- **目的**：提供 Reviewer Phase 的框架特有審查維度（D1–D5）
- **D0 保留**：D0 = spec_hash 驗證，由 Orchestrator 統一處理
- **通用維度**：A（SOLID）、B（DDD）、C（Security）、D（Clean Arch）由 Reviewer 統一執行
- **框架維度**：D1–D5 由各 Adapter 定義

---

### `getIntegrationTestCommand()`

- **目的**：提供 Phase D（Integration Tester）的整合測試執行指令
- **不支援時**：若框架不支援整合測試或尚未設定時返回 `NullCommand`，Phase D 會標記為 SKIPPED
- **各框架實作**：
  - `angular-wec` → `npx playwright test --reporter json`
  - `dotnet` → `dotnet test --filter Category=Integration`
  - `python` → `pytest tests/integration -v --tb=short`

---

### `getIntegrationTestSetupCommand()`

- **目的**：提供 Phase D 首次執行前的環境設定指令（安裝瀏覽器、建立測試專案等）
- **不需要時**：若不需要額外設定步驟返回 `NullCommand`
- **各框架實作**：
  - `angular-wec` → `npx playwright install --with-deps chromium`
  - `dotnet` → `NullCommand`（無需額外安裝，NuGet restore 已包含）
  - `python` → `null`（依賴由使用者手動安裝）
- **觸發條件**：僅在 `project-profile.yaml` 的 `existing_tests.integration.already_configured = false` 時執行

---

### `parseErrorOutput(rawOutput)`

- **目的**：將各框架工具的原始輸出轉換為統一的 `ParsedError[]` 格式
- **error_id 生成規則**：
  - `{tool}` = 工具名稱（小寫）
  - `{rule}` = 規則代碼或錯誤類型（kebab-case）
  - `{slug}` = 檔案名稱（無副檔名，kebab-case）
  - `line{N}` = 行號（無 line 資訊時用 `line0`）
  - **範例**：`eslint-no-any-user-list-component-line42`

---

## 實作清單

| Adapter      | 實作位置                        |
| ------------ | ------------------------------- |
| Angular WEC  | `ai-loop/adapters/angular-wec/` |
| .NET 8       | `ai-loop/adapters/dotnet/`      |
| Python 3.10+ | `ai-loop/adapters/python/`      |

---

## 設計備註：介面隔離原則（ISP）

目前 `FrameworkAdapter` 共 9 個方法，認知負擔可接受。若未來因新增需求（如 E2E Screenshot、Performance Benchmark 等）導致方法數超過 **12 個**，建議拆分為：

```typescript
// 核心介面 — 所有 Adapter 必須實作
interface CoreAdapter {
  getFrameworkName(): string;
  getLintCommand(): AdapterCommand;
  getTestCommand(): AdapterCommand;
  getBuildCommand(): AdapterCommand;
  getInstructionsPath(): string;
  getReviewDimensions(): ReviewDimension[];
  parseErrorOutput(rawOutput: string): ParsedError[];
}

// 整合測試介面 — 支援 Phase D 的 Adapter 實作
interface IntegrationTestAdapter {
  getIntegrationTestCommand(): AdapterCommand;
  getIntegrationTestSetupCommand(): AdapterCommand;
}

// 完整 Adapter = 兩者組合
type FrameworkAdapter = CoreAdapter & IntegrationTestAdapter;
```

**拆分時機**：方法數 > 12 且出現 Adapter 需要實作 3 個以上 `NullCommand` 的情況。
