# spec.md — 007-label-tag-management

> **需求編號**: 007
> **需求簡述**: 標籤管理 — LabelFactory 唯一性、TagMediator 多對多、LabelTagCommand 貼標籤
> **建立日期**: 2026-04-01
> **狀態**: 待審核

---

## 1. 背景與問題陳述

### 背景

現有系統以「目錄樹（Composite Pattern）」作為唯一的分類方式，但目錄分類有天生限制：

- 每個節點只能屬於一個父目錄（單一繼承路徑）
- 跨階層歸類需搬移節點，破壞既有結構
- 無法針對同一檔案記錄多個語意維度（如：同時是「重要」、「待審核」、「Q2 專案」）

「標籤（Label）」是比目錄更靈活的分類機制：多對多、跨階層、具唯一語意。
本需求引入 Label 領域物件並搭配三個設計模式封裝其管理邏輯。

### 設計模式組合

| 模式                 | 類別              | 職責                                        |
| -------------------- | ----------------- | ------------------------------------------- |
| Flyweight / Registry | `LabelFactory`    | 保證相同名稱的 Label 共享同一實體（唯一性） |
| Mediator             | `TagMediator`     | 集中管理 Label ↔ FileSystemNode 多對多關係  |
| Command              | `LabelTagCommand` | 封裝「貼標籤」動作，支援 Undo/Redo          |

### 後端預留設計

目前為 pure in-memory 實作，但 `TagMediator` 將依賴 `ITagRepository` 介面，
未來後端就緒時僅需替換實作，不改動業務邏輯。

---

## 2. 利害關係人

| 角色   | 關注點                                          |
| ------ | ----------------------------------------------- |
| 使用者 | 能對檔案/目錄貼上標籤、移除標籤、查詢有哪些標籤 |
| 開發者 | 可維護、可測試、未來可無縫換後端                |
| 架構師 | 符合 SOLID，不污染 Domain Layer                 |

---

## 3. 使用者故事（User Stories）

### US-01：建立 / 取得標籤（LabelFactory）

**As** 使用者  
**I want** 透過標籤名稱取得或建立 Label 實體  
**So that** 相同名稱的標籤在系統中永遠是同一個物件，避免重複與不一致

#### 驗收標準（Given-When-Then）

**情境 A：首次建立標籤**

- **Given** 系統中尚無名稱為 "重要" 的 Label
- **When** 呼叫 `LabelFactory.getOrCreate("重要")`
- **Then** 建立一個新 Label（id = uuid、name = "重要"、color = 系統自動分配預設色、createdAt = 當前時間戳）並快取；回傳同一物件

**情境 B：相同名稱第二次取得**

- **Given** 名稱 "重要" 的 Label 已存在於快取
- **When** 再次呼叫 `LabelFactory.getOrCreate("重要")`
- **Then** 回傳與上次**完全相同參考**的物件（`===` 比較為 true）；不建立新 Label

**情境 C：名稱正規化**

- **Given** 使用者輸入 " 重要 "（含前後空白）
- **When** 呼叫 `LabelFactory.getOrCreate("  重要  ")`
- **Then** trim 後視為 "重要"，回傳已存在的 Label（與情境 B 相同物件）

**情境 D：列出所有標籤**

- **Given** 已建立多個 Label
- **When** 呼叫 `LabelFactory.getAll()`
- **Then** 回傳所有 Label 的陣列，依 `createdAt` 排序

**優先級**: P0

---

### US-02：查詢標籤關係（TagMediator）

**As** 使用者  
**I want** 查詢某節點掛了哪些標籤，以及某標籤掛在哪些節點上  
**So that** 可以從兩個方向瀏覽標籤與檔案的關聯

#### 驗收標準（Given-When-Then）

**情境 A：取得節點的所有標籤**

- **Given** 節點 "report.docx" 已被貼上 "重要" 與 "待審核" 兩個標籤
- **When** 呼叫 `TagMediator.getLabelsOf(node)`
- **Then** 回傳 `[Label("重要"), Label("待審核")]` 陣列

**情境 B：取得標籤掛載的所有節點**

- **Given** 標籤 "重要" 已貼在 "report.docx" 與 "budget.xlsx" 兩個節點
- **When** 呼叫 `TagMediator.getNodesOf(label)`
- **Then** 回傳包含兩個節點的陣列

**情境 C：尚無標籤的節點**

- **Given** 節點 "empty.txt" 從未貼過標籤
- **When** 呼叫 `TagMediator.getLabelsOf(node)`
- **Then** 回傳空陣列 `[]`，不拋出錯誤

**優先級**: P0

---

### US-03：貼標籤（LabelTagCommand — execute）

**As** 使用者  
**I want** 對選取的節點貼上一個標籤  
**So that** 之後可透過標籤篩選找到這個節點

#### 驗收標準（Given-When-Then）

**情境 A：成功貼標籤**

- **Given** 使用者已選取節點且選擇了一個 Label（例如 "重要"）
- **When** `CommandInvoker.execute(new LabelTagCommand(node, label, tagMediator))`
- **Then** `TagMediator.getLabelsOf(node)` 包含 "重要"；命令加入 undoStack

**情境 B：重複貼同一標籤**

- **Given** 節點已有標籤 "重要"
- **When** 再次執行 `LabelTagCommand` 貼 "重要"
- **Then** 靜默忽略（idempotent），不重複建立關係；不拋出錯誤

**優先級**: P0

---

### US-04：撤銷貼標籤（LabelTagCommand — undo）

**As** 使用者  
**I want** 撤銷最近一次貼標籤的動作  
**So that** 不小心貼錯標籤時可以快速還原

#### 驗收標準（Given-When-Then）

**情境 A：成功 Undo**

- **Given** 已執行 `LabelTagCommand`（節點 "report.docx" 貼上 "重要"）
- **When** `CommandInvoker.undo()`
- **Then** "重要" 從 "report.docx" 的標籤列表中移除；節點其餘標籤不受影響

**情境 B：Undo 後 Redo**

- **Given** 已 Undo 上述貼標籤動作
- **When** `CommandInvoker.redo()`
- **Then** "重要" 重新出現在 "report.docx" 的標籤列表中

**優先級**: P0

---

### US-05：移除標籤（RemoveLabelCommand）

**As** 使用者  
**I want** 主動移除節點上的某個標籤  
**So that** 標籤分類可以修正

#### 驗收標準（Given-When-Then）

**情境 A：成功移除**

- **Given** 節點 "report.docx" 已有標籤 "重要"
- **When** `CommandInvoker.execute(new RemoveLabelCommand(node, label, tagMediator))`
- **Then** "重要" 不再出現在 `getLabelsOf(node)` 結果中；命令加入 undoStack

**情境 B：Undo 移除（還原標籤）**

- **Given** 已執行 RemoveLabelCommand 移除 "重要"
- **When** `CommandInvoker.undo()`
- **Then** "重要" 重新出現在節點的標籤列表中

**優先級**: P1

---

## 4. 功能需求

### FR-01：Label 實體設計（P0）

Label 物件包含以下欄位（考量未來後端資料表需求）：

```
Label {
  id: string          // UUID v4，全域唯一識別碼（對應後端主鍵）
  name: string        // 顯示名稱，使用者可見；唯一鍵（case-insensitive + trim）
  color: string       // HEX 色碼（如 "#FF5733"），用於 UI 色塊顯示
  description: string // 可選說明文字（預設空字串）
  createdAt: Date     // 建立時間戳（對應後端 created_at 欄位）
}
```

> **後端資料表預覽（供未來整合參考）**：
> `labels(id UUID PK, name VARCHAR(100) UNIQUE, color CHAR(7), description TEXT, created_at TIMESTAMP)`

### FR-02：LabelFactory 規格（P0）

- 使用 **Registry Pattern**：內部維護 `Map<string, Label>`，key = `name.trim().toLowerCase()`
- 提供 `getOrCreate(name: string, options?: { color?: string; description?: string }): Label`
- 提供 `getAll(): readonly Label[]`（依 createdAt asc 排序）
- 提供 `findByName(name: string): Label | undefined`
- LabelFactory 為模組層級單例（export 的 instance），不使用 Singleton class 反模式

### FR-03：ITagRepository 介面（P0）

```typescript
interface ITagRepository {
  attach(nodeId: string, labelId: string): void;
  detach(nodeId: string, labelId: string): void;
  getLabelIdsByNode(nodeId: string): ReadonlySet<string>;
  getNodeIdsByLabel(labelId: string): ReadonlySet<string>;
}
```

> 此介面為後端替換預留點。in-memory 實作命名為 `InMemoryTagRepository`。

### FR-04：TagMediator 規格（P0）

- 依賴注入 `ITagRepository`（預設使用 `InMemoryTagRepository`）
- 提供 `attach(node: FileSystemNode, label: Label): void`
- 提供 `detach(node: FileSystemNode, label: Label): void`
- 提供 `getLabelsOf(node: FileSystemNode): Label[]`（透過 LabelFactory 查找）
- 提供 `getNodesOf(label: Label, allNodes: FileSystemNode[]): FileSystemNode[]`
- `attach` 為 idempotent（重複呼叫不報錯）

> **節點識別鍵**：使用節點的 `name` 屬性（現有 `FileSystemNode.name`）作為 nodeId。
> [待確認：若未來節點需要全域唯一 ID，可在 FileSystemNode 加入 `id` 欄位；本次不做此異動]

### FR-05：LabelTagCommand 規格（P0）

- 實作 `ICommand`（`execute`, `undo`, `description`）
- 建構子：`(node: FileSystemNode, label: Label, mediator: TagMediator)`
- `execute()` → `mediator.attach(node, label)`
- `undo()` → `mediator.detach(node, label)`
- `description` → `"貼標籤：${label.name} → ${node.name}"`

### FR-06：RemoveLabelCommand 規格（P1）

- 建構子同 `LabelTagCommand`
- `execute()` → `mediator.detach(node, label)`
- `undo()` → `mediator.attach(node, label)`
- `description` → `"移除標籤：${label.name} ← ${node.name}"`

---

## 5. 非功能需求

| 需求                | 指標                                                           |
| ------------------- | -------------------------------------------------------------- |
| 唯一性保證          | 同名 Label 在同一執行期間內 `===` 比較必須為 `true` (100%)     |
| 記憶體效率          | LabelFactory 快取大小 ≤ 1000 個 Label 不需額外優化             |
| 測試覆蓋率          | 新增類別單元測試覆蓋率 ≥ 90%                                   |
| 後端可替換性        | 替換 `ITagRepository` 實作無需修改 `TagMediator` 及 Command 層 |
| TypeScript 型別安全 | 禁止使用 `any`；所有公開方法完整型別標注                       |

---

## 6. In Scope / Out of Scope

### ✅ In Scope

- `Label` 實體類別
- `LabelFactory`（Registry Pattern）
- `ITagRepository` 介面 + `InMemoryTagRepository` 實作
- `TagMediator`（依賴 `ITagRepository`）
- `LabelTagCommand`（ICommand，Undo = detach）
- `RemoveLabelCommand`（ICommand，Undo = attach）
- 對應單元測試
- UI 展示層（在節點旁顯示標籤色塊）—— **初版可為 read-only 展示**

### ❌ Out of Scope

- 標籤的持久化 / 序列化至 XML 或 JSON（留待後端整合時處理）
- UI 的標籤管理頁面（建立、刪除、重命名標籤）
- 標籤搜尋 / 批次貼標籤
- `FileSystemNode` 加入全域唯一 `id` 欄位（技術債，留待後端整合）
- 標籤顏色讓使用者自訂（本次使用自動分配色盤）

---

## 7. 技術棧

| 層級     | 技術                                             |
| -------- | ------------------------------------------------ |
| 語言     | TypeScript 5.x（strict mode）                    |
| 前端框架 | React 18 + Vite                                  |
| 測試框架 | Vitest + Testing Library                         |
| 設計模式 | Flyweight/Registry + Mediator + Command          |
| 介面定義 | `ITagRepository`（Repository Pattern，後端預留） |

---

## 8. 相依關係

| 相依項目         | 說明                                                       |
| ---------------- | ---------------------------------------------------------- |
| `FileSystemNode` | TagMediator / Command 操作的目標物件                       |
| `ICommand`       | `LabelTagCommand` / `RemoveLabelCommand` 須實作            |
| `CommandInvoker` | 現有 Undo/Redo 引擎，直接沿用                              |
| `LabelFactory`   | `TagMediator.getLabelsOf()` 需透過 factory 查找 Label 物件 |
