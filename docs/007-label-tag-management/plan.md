# plan.md — 007-label-tag-management

> **需求編號**: 007
> **需求簡述**: 標籤管理 — LabelFactory / TagMediator / Command
> **建立日期**: 2026-04-01
> **狀態**: 待審核
> **對應設計文件**: [FRD.md](./FRD.md)

---

## 執行說明

- 本計畫依據 [FRD.md](./FRD.md) 設計，所有 Task 可由 `@dev` 逐步執行
- Task 以層級由內而外排列：Domain → Infrastructure → Service → Command → Test → UI
- P1 Task（T-07、T-12）可於 P0 Task 全數完成後視需求執行

---

## Task 清單

### T-01：建立 Label 實體

| 欄位         | 內容   |
| ------------ | ------ |
| **架構層**   | Domain |
| **優先級**   | P0     |
| **前置依賴** | 無     |
| **複雜度**   | 低     |
| **設定檔**   | 無     |

**詳細描述**：

在 `src/domain/labels/` 建立 `Label.ts`，定義不可變 Entity：

```typescript
// src/domain/labels/Label.ts
export class Label {
  constructor(
    public readonly id: string, // UUID v4
    public readonly name: string, // 顯示名稱（已 trim）
    public readonly color: string, // HEX 色碼，如 "#FF6B6B"
    public readonly description: string,
    public readonly createdAt: Date,
  ) {}
}
```

建立 `src/domain/labels/index.ts` 匯出 `Label`。

**測試範圍**：基本屬性賦值（簡單 value 驗證，包含在 T-08）

---

### T-02：建立 ITagRepository 介面（Domain Port）

| 欄位         | 內容                     |
| ------------ | ------------------------ |
| **架構層**   | Domain（Port Interface） |
| **優先級**   | P0                       |
| **前置依賴** | T-01                     |
| **複雜度**   | 低                       |
| **設定檔**   | 無                       |

**詳細描述**：

在 `src/domain/labels/ITagRepository.ts` 定義 Port Interface：

```typescript
// src/domain/labels/ITagRepository.ts
export interface ITagRepository {
  attach(nodeId: string, labelId: string): void;
  detach(nodeId: string, labelId: string): void;
  getLabelIdsByNode(nodeId: string): ReadonlySet<string>;
  getNodeIdsByLabel(labelId: string): ReadonlySet<string>;
}
```

更新 `src/domain/labels/index.ts` 匯出 `ITagRepository`。

---

### T-03：建立 LabelFactory（Flyweight Pattern）

| 欄位         | 內容                                      |
| ------------ | ----------------------------------------- |
| **架構層**   | Domain（Domain Service / Flyweight Pool） |
| **優先級**   | P0                                        |
| **前置依賴** | T-01                                      |
| **複雜度**   | 中                                        |
| **設定檔**   | 無                                        |

**詳細描述**：

在 `src/domain/labels/LabelFactory.ts` 建立 Flyweight Pool：

> **Flyweight 要點**：Label 建立後透過 `Object.freeze()` 凍結，成為嚴格 immutable 的共享物件。

```typescript
// src/domain/labels/LabelFactory.ts
import { Label } from "./Label";

// 色盤：10 色循環自動分配
const COLOR_PALETTE = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
];

export class LabelFactory {
  private readonly _registry = new Map<string, Label>();

  private _normalizeKey(name: string): string {
    return name.trim().toLowerCase();
  }

  private _nextColor(): string {
    return COLOR_PALETTE[this._registry.size % COLOR_PALETTE.length];
  }

  getOrCreate(
    name: string,
    options?: { color?: string; description?: string },
  ): Label {
    const key = this._normalizeKey(name);
    if (this._registry.has(key)) {
      return this._registry.get(key)!;
    }
    const label = Object.freeze(
      new Label(
        crypto.randomUUID(),
        name.trim(),
        options?.color ?? this._nextColor(),
        options?.description ?? "",
        new Date(),
      ),
    );
    this._registry.set(key, label);
    return label;
  }

  findByName(name: string): Label | undefined {
    return this._registry.get(this._normalizeKey(name));
  }

  getAll(): readonly Label[] {
    return [...this._registry.values()].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }
}

/** 模組層級單例（non-class Singleton，可測試替換）*/
export const labelFactory = new LabelFactory();
```

更新 `src/domain/labels/index.ts` 匯出 `LabelFactory` 與 `labelFactory`。
更新 `src/domain/index.ts` 新增 label 相關匯出。

---

### T-04：建立 InMemoryTagRepository

| 欄位         | 內容           |
| ------------ | -------------- |
| **架構層**   | Infrastructure |
| **優先級**   | P0             |
| **前置依賴** | T-02           |
| **複雜度**   | 中             |
| **設定檔**   | 無             |

**詳細描述**：

在 `src/services/repositories/InMemoryTagRepository.ts` 建立：

```typescript
// src/services/repositories/InMemoryTagRepository.ts
import type { ITagRepository } from "../../domain/labels/ITagRepository";

export class InMemoryTagRepository implements ITagRepository {
  private readonly _nodeToLabels = new Map<string, Set<string>>();
  private readonly _labelToNodes = new Map<string, Set<string>>();

  attach(nodeId: string, labelId: string): void {
    if (!this._nodeToLabels.has(nodeId))
      this._nodeToLabels.set(nodeId, new Set());
    if (!this._labelToNodes.has(labelId))
      this._labelToNodes.set(labelId, new Set());
    this._nodeToLabels.get(nodeId)!.add(labelId);
    this._labelToNodes.get(labelId)!.add(nodeId);
  }

  detach(nodeId: string, labelId: string): void {
    this._nodeToLabels.get(nodeId)?.delete(labelId);
    this._labelToNodes.get(labelId)?.delete(nodeId);
  }

  getLabelIdsByNode(nodeId: string): ReadonlySet<string> {
    return this._nodeToLabels.get(nodeId) ?? new Set();
  }

  getNodeIdsByLabel(labelId: string): ReadonlySet<string> {
    return this._labelToNodes.get(labelId) ?? new Set();
  }
}
```

建立 `src/services/repositories/index.ts` 匯出 `InMemoryTagRepository`。

---

### T-05：建立 TagMediator

| 欄位         | 內容                   |
| ------------ | ---------------------- |
| **架構層**   | Service（Application） |
| **優先級**   | P0                     |
| **前置依賴** | T-02、T-03、T-04       |
| **複雜度**   | 中                     |
| **設定檔**   | 無                     |

**詳細描述**：

在 `src/services/TagMediator.ts` 建立 Mediator：

```typescript
// src/services/TagMediator.ts
import type { FileSystemNode } from "../domain/FileSystemNode";
import type { Label } from "../domain/labels/Label";
import type { ITagRepository } from "../domain/labels/ITagRepository";
import type { LabelFactory } from "../domain/labels/LabelFactory";
import { InMemoryTagRepository } from "./repositories/InMemoryTagRepository";
import { labelFactory } from "../domain/labels/LabelFactory";

export class TagMediator {
  constructor(
    private readonly _repo: ITagRepository = new InMemoryTagRepository(),
    private readonly _factory: LabelFactory = labelFactory,
  ) {}

  attach(node: FileSystemNode, label: Label): void {
    this._repo.attach(node.name, label.id);
  }

  detach(node: FileSystemNode, label: Label): void {
    this._repo.detach(node.name, label.id);
  }

  getLabelsOf(node: FileSystemNode): Label[] {
    const labelIds = this._repo.getLabelIdsByNode(node.name);
    return this._factory.getAll().filter((l) => labelIds.has(l.id));
  }

  getNodesOf(label: Label, allNodes: FileSystemNode[]): FileSystemNode[] {
    const nodeIds = this._repo.getNodeIdsByLabel(label.id);
    return allNodes.filter((n) => nodeIds.has(n.name));
  }
}

/** 模組層級單例（可測試時傳入自訂 repo）*/
export const tagMediator = new TagMediator();
```

---

### T-06：建立 LabelTagCommand

| 欄位         | 內容                             |
| ------------ | -------------------------------- |
| **架構層**   | Service（Application / Command） |
| **優先級**   | P0                               |
| **前置依賴** | T-05                             |
| **複雜度**   | 低                               |
| **設定檔**   | 無                               |

**詳細描述**：

在 `src/services/commands/LabelTagCommand.ts` 建立：

```typescript
// src/services/commands/LabelTagCommand.ts
import type { ICommand } from "../../domain/commands/ICommand";
import type { FileSystemNode } from "../../domain/FileSystemNode";
import type { Label } from "../../domain/labels/Label";
import type { TagMediator } from "../TagMediator";

export class LabelTagCommand implements ICommand {
  readonly description: string;

  constructor(
    private readonly _node: FileSystemNode,
    private readonly _label: Label,
    private readonly _mediator: TagMediator,
  ) {
    this.description = `貼標籤：${_label.name} → ${_node.name}`;
  }

  execute(): void {
    this._mediator.attach(this._node, this._label);
  }

  undo(): void {
    this._mediator.detach(this._node, this._label);
  }
}
```

更新 `src/services/commands/index.ts` 新增 `LabelTagCommand` 匯出。

---

### T-07：建立 RemoveLabelCommand（P1）

| 欄位         | 內容                             |
| ------------ | -------------------------------- |
| **架構層**   | Service（Application / Command） |
| **優先級**   | P1                               |
| **前置依賴** | T-05                             |
| **複雜度**   | 低                               |
| **設定檔**   | 無                               |

**詳細描述**：

在 `src/services/commands/RemoveLabelCommand.ts` 建立（與 `LabelTagCommand` 鏡像設計）：

```typescript
// src/services/commands/RemoveLabelCommand.ts
import type { ICommand } from "../../domain/commands/ICommand";
import type { FileSystemNode } from "../../domain/FileSystemNode";
import type { Label } from "../../domain/labels/Label";
import type { TagMediator } from "../TagMediator";

export class RemoveLabelCommand implements ICommand {
  readonly description: string;

  constructor(
    private readonly _node: FileSystemNode,
    private readonly _label: Label,
    private readonly _mediator: TagMediator,
  ) {
    this.description = `移除標籤：${_label.name} ← ${_node.name}`;
  }

  execute(): void {
    this._mediator.detach(this._node, this._label);
  }

  undo(): void {
    this._mediator.attach(this._node, this._label);
  }
}
```

更新 `src/services/commands/index.ts` 新增 `RemoveLabelCommand` 匯出。

---

### T-08：建立 Domain 單元測試（Label + LabelFactory）

| 欄位         | 內容       |
| ------------ | ---------- |
| **架構層**   | Test       |
| **優先級**   | P0         |
| **前置依賴** | T-01、T-03 |
| **複雜度**   | 中         |
| **設定檔**   | 無         |

**詳細描述**：

建立 `tests/domain/labels/LabelFactory.test.ts`（主要測試）：

測試案例清單：

1. `getOrCreate` — 首次建立 Label，回傳正確屬性（id、name、color、createdAt）
2. `getOrCreate` — 相同名稱第二次呼叫，回傳相同物件參考（`===` 為 true）
3. `getOrCreate` — 名稱 trim 正規化（" 重要 " 等同 "重要"）
4. `getOrCreate` — 大小寫不區分（"重要" 與 "重要" 相同；英文 "Work" vs "work"）
5. `getOrCreate` — 自訂 color 使用傳入值，不覆蓋已存在 Label
6. `getAll` — 依 createdAt 排序回傳所有 Label
7. `findByName` — 找不到時回傳 `undefined`
8. 色盤循環驗證 — 第 11 個 Label 回到第 1 個顏色

建立 `tests/domain/labels/Label.test.ts`（基本屬性驗證，3 個測試即可）

---

### T-09：建立 InMemoryTagRepository 單元測試

| 欄位         | 內容 |
| ------------ | ---- |
| **架構層**   | Test |
| **優先級**   | P0   |
| **前置依賴** | T-04 |
| **複雜度**   | 中   |
| **設定檔**   | 無   |

**詳細描述**：

建立 `tests/services/repositories/InMemoryTagRepository.test.ts`：

測試案例清單：

1. `attach` — 新增關係後，`getLabelIdsByNode` 包含 labelId
2. `attach` — 新增關係後，`getNodeIdsByLabel` 包含 nodeId
3. `attach` — 重複 attach 相同組合（idempotent），不重複儲存
4. `detach` — 移除後，`getLabelIdsByNode` 不再包含 labelId
5. `detach` — 移除後，`getNodeIdsByLabel` 不再包含 nodeId
6. `detach` — 移除不存在的關係不拋出錯誤
7. `getLabelIdsByNode` — 無關係的節點回傳空 Set
8. `getNodeIdsByLabel` — 無關係的標籤回傳空 Set
9. 多對多驗證 — 1 個節點掛 3 個標籤；1 個標籤掛 2 個節點

---

### T-10：建立 TagMediator 單元測試

| 欄位         | 內容 |
| ------------ | ---- |
| **架構層**   | Test |
| **優先級**   | P0   |
| **前置依賴** | T-05 |
| **複雜度**   | 中   |
| **設定檔**   | 無   |

**詳細描述**：

建立 `tests/services/TagMediator.test.ts`：

> 使用測試用的 `InMemoryTagRepository` 與 `LabelFactory` 實例，避免污染模組層級單例。

測試案例清單：

1. `attach` + `getLabelsOf` — attach 後查詢，回傳正確 Label 清單
2. `attach` — 重複呼叫不重複（idempotent）
3. `detach` + `getLabelsOf` — detach 後查詢，Label 已移除
4. `getLabelsOf` — 未 attach 的節點回傳空陣列
5. `getNodesOf` — 回傳所有掛有該標籤的節點
6. `getNodesOf` — 無節點的標籤回傳空陣列

---

### T-11：建立 Command 單元測試

| 欄位         | 內容       |
| ------------ | ---------- |
| **架構層**   | Test       |
| **優先級**   | P0         |
| **前置依賴** | T-06、T-07 |
| **複雜度**   | 中         |
| **設定檔**   | 無         |

**詳細描述**：

建立 `tests/services/commands/LabelTagCommand.test.ts`：

測試案例清單（LabelTagCommand）：

1. `execute` — 呼叫後，`mediator.getLabelsOf(node)` 包含 label
2. `undo` — execute 後 undo，label 被移除
3. `undo` 後 `execute`（redo）— label 重新出現
4. `description` 格式正確（"貼標籤：重要 → report.docx"）

建立 `tests/services/commands/RemoveLabelCommand.test.ts`：

測試案例清單（RemoveLabelCommand）：

1. `execute` — 呼叫後，`mediator.getLabelsOf(node)` 不含 label
2. `undo` — execute 後 undo，label 重新出現
3. `description` 格式正確

---

### T-12：UI 展示 — 節點旁顯示標籤色塊（P1）

| 欄位         | 內容         |
| ------------ | ------------ |
| **架構層**   | Presentation |
| **優先級**   | P1           |
| **前置依賴** | T-05         |
| **複雜度**   | 中           |
| **設定檔**   | 無           |

**詳細描述**：

**T-12a：FileTreeView — 節點旁顯示標籤色塊（read-only）**

修改 `src/components/FileTreeView.tsx`（或 `TreeNodeItem.tsx`，視元件分割結構而定）：

- 接收 `tagMediator` 作為 prop
- 每個節點渲染 `tagMediator.getLabelsOf(node)` 的色塊（`<span>` HEX 背景色，Label.name 為 title tooltip）
- Label 色塊寬度 10px × 10px，圓角，間距 2px，並排於節點名稱右側

**T-12b：ToolbarPanel — 貼標籤動作（使用 `window.prompt` 暫代輸入 UI）**

修改 `src/components/ToolbarPanel.tsx`：

- 新增「🏷️ 貼標籤」按鈕，僅在有選取節點時啟用（disabled 邏輯同其他按鈕）
- 點擊後用 `window.prompt("標籤名稱：")` 取得輸入
- 呼叫 `labelFactory.getOrCreate(input)` 取得 Label，建立 `LabelTagCommand` 並執行

> ⚠️ `window.prompt` 為暫行方案，正式 UI 輸入框留待後續 Sprint 處理

---

## 測試策略

### 單元測試覆蓋目標

| 模組                                     | 目標覆蓋率 | 測試框架 |
| ---------------------------------------- | ---------- | -------- |
| `LabelFactory`                           | ≥ 95%      | Vitest   |
| `InMemoryTagRepository`                  | ≥ 95%      | Vitest   |
| `TagMediator`                            | ≥ 90%      | Vitest   |
| `LabelTagCommand` / `RemoveLabelCommand` | ≥ 90%      | Vitest   |

### 測試隔離原則

- 每個 test file 建立**獨立的** `LabelFactory` 實例與 `InMemoryTagRepository` 實例
- **不使用模組層級單例**（`labelFactory`、`tagMediator`）於測試中，避免測試間狀態污染
- `TagMediator` 測試透過建構子注入 mock repo 與 factory

### 整合驗證（手動）

- 完成 T-06 後：在 `App.tsx` 中手動建立 `LabelTagCommand` 並執行，確認 `CommandInvoker` Undo/Redo 正常
- 完成 T-12 後：視覺確認節點旁色塊顯示與消失（貼標籤 + Undo）

---

## 執行順序建議

```
T-01 → T-02 → T-03 → T-08（Domain 測試）
         ↓
        T-04 → T-09（Repository 測試）
         ↓
        T-05 → T-10（Mediator 測試）
         ↓
      T-06 → T-07 → T-11（Command 測試）
         ↓
        T-12（UI，P1）
```

**最小可驗收集合（P0）**：T-01 → T-02 → T-03 → T-04 → T-05 → T-06 → T-08 → T-09 → T-10 → T-11

---

## 部署架構

本功能為純前端實作，無後端、無新環境變數、無 Docker 變更。

| 項目          | 說明                                         |
| ------------- | -------------------------------------------- |
| 建置指令      | `npm run build`（現有，不變）                |
| 測試指令      | `npm run test`（現有，不變）                 |
| 新增 npm 套件 | 無（`crypto.randomUUID()` 為瀏覽器原生 API） |
