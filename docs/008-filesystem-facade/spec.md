# spec.md — FileSystemFacade

> **需求工作區**：`docs/008-filesystem-facade/`
> **建立日期**：2026-04-01
> **需求狀態**：待架構審核

---

## 1. 背景與目標

目前 `App.tsx`（Explorer UI）直接依賴多個模式實體類別：
`CommandInvoker`、`Clipboard`、`CopyCommand`、`PasteCommand`、`DeleteCommand`、
`SortCommand`、`LabelTagCommand`、`RemoveLabelCommand`、`tagMediator`、`labelFactory`。

這造成：

- UI 層必須了解 Command 物件的建構細節（需知道「哪個命令需要哪些參數」）
- 標籤操作散落於 6 個不同的 import 來源
- 換個 UI 開發者必須重新理解所有模式細節

**目標**：引入 **Facade Pattern**，以 `FileSystemFacade` 統一暴露所有操作介面，
讓 UI 層只依賴 Facade 與 Domain 型別（`Label`、`FileSystemNode` 等 type-only import）。

---

## 2. 利害關係人

| 角色          | 說明                                    |
| ------------- | --------------------------------------- |
| UI 開發者     | `App.tsx` 的維護者，主要受益方          |
| 未來 Owner    | 接手此專案的開發者，Facade 降低入門門檻 |
| Domain 設計者 | Facade 不改動 Domain 層，向後相容       |

---

## 3. User Stories

### US-01 — 檔案操作透過 Facade 執行

**作為** UI 開發者，
**我希望** 呼叫 `facade.copy(node)`、`facade.paste(targetDir)`、`facade.delete(node, parent)`，
**以便** 不需要知道 `CopyCommand`、`PasteCommand`、`DeleteCommand`、`Clipboard` 的存在。

**驗收標準：**

```
Given  使用者選取一個節點並點擊「複製」
When   UI 呼叫 facade.copy(node)
Then   節點被複製到剪貼簿，canPaste 變為 true

Given  使用者選取一個目錄並點擊「貼上」
When   UI 呼叫 facade.paste(targetDir)
Then   節點被貼入目標目錄，facade.paste 回傳 { pastedName, renamed } 描述

Given  使用者選取一個節點並點擊「刪除」
When   UI 呼叫 facade.delete(node, parent)
Then   節點從父目錄移除
```

---

### US-02 — 排序透過 Facade 執行

**作為** UI 開發者，
**我希望** 呼叫 `facade.sort(dir, strategy)`，
**以便** 不需要知道 `SortCommand` 的存在。

**驗收標準：**

```
Given  使用者選取一個目錄並選擇排序策略
When   UI 呼叫 facade.sort(dir, strategy)
Then   目錄子節點依指定策略排序
```

---

### US-03 — Undo / Redo 透過 Facade 執行

**作為** UI 開發者，
**我希望** 呼叫 `facade.undo()` / `facade.redo()`，查詢 `facade.canUndo` / `facade.canRedo`，
**以便** 不需要知道 `CommandInvoker` 的存在。

**驗收標準：**

```
Given  使用者執行了一次複製操作（歷程有 1 筆）
When   UI 呼叫 facade.undo()
Then   操作被還原，facade.canUndo = false

Given  facade.canUndo = true
When   UI 讀取 facade.undoDescription
Then   回傳最後一次命令的描述文字
```

---

### US-04 — 標籤操作透過 Facade 執行

**作為** UI 開發者，
**我希望** 呼叫 `facade.tagLabel(node, label)`、`facade.removeLabel(node, label)`、
`facade.createLabel(name, node?)`、`facade.getNodeLabels(node)`、`facade.getAllLabels()`，
**以便** 不需要知道 `LabelTagCommand`、`RemoveLabelCommand`、`tagMediator`、`labelFactory` 的存在。

**驗收標準：**

```
Given  使用者選取節點並選擇一個既有標籤
When   UI 呼叫 facade.tagLabel(node, label)
Then   標籤被掛到節點上，facade.getNodeLabels(node) 包含該標籤

Given  使用者輸入新標籤名稱並有選取節點
When   UI 呼叫 facade.createLabel("重要", node)
Then   新標籤建立並自動貼到節點，操作可被 undo

Given  使用者呼叫 facade.getAllLabels()
When   Facade Pool 有 3 個標籤
Then   回傳長度為 3 的 Label[] 陣列
```

---

### US-05 — UI 不再直接依賴模式類別

**作為** 未來 Owner，
**我希望** `App.tsx` 中的 import 只剩下 Facade 與 domain type，
**以便** 不需要閱讀任何 Command / Mediator / Factory 原始碼即可維護 UI。

**驗收標準：**

```
Given  檢閱 App.tsx 的 import 區段
When   統計直接 import Command / Invoker / Clipboard / tagMediator / labelFactory 的行數
Then   結果為 0
```

---

## 4. 功能需求

| ID    | 描述                                                                                                                  | 優先級 |
| ----- | --------------------------------------------------------------------------------------------------------------------- | ------ |
| FR-01 | `FileSystemFacade` 封裝 `CommandInvoker` 與 `Clipboard` 實例（建構子注入，可覆寫供測試）                              | P0     |
| FR-02 | `facade.copy(node: FileSystemNode): void` — 複製節點至剪貼簿                                                          | P0     |
| FR-03 | `facade.paste(targetDir: Directory): PasteResult` — 貼上並回傳 `{ pastedName, renamed }`                              | P0     |
| FR-04 | `facade.delete(node: FileSystemNode, parent: Directory): void` — 刪除節點                                             | P0     |
| FR-05 | `facade.sort(dir: Directory, strategy: ISortStrategy): void` — 排序目錄                                               | P0     |
| FR-06 | `facade.undo(): void` / `facade.redo(): void`                                                                         | P0     |
| FR-07 | `facade.canUndo: boolean` / `facade.canRedo: boolean` / `facade.canPaste(targetDir: FileSystemNode \| null): boolean` | P0     |
| FR-08 | `facade.undoDescription: string \| undefined` / `facade.redoDescription: string \| undefined`                         | P0     |
| FR-09 | `facade.tagLabel(node, label): void` — 貼標籤（透過 LabelTagCommand + CommandInvoker）                                | P0     |
| FR-10 | `facade.removeLabel(node, label): void` — 移除標籤（透過 RemoveLabelCommand）                                         | P0     |
| FR-11 | `facade.createLabel(name: string, node?: FileSystemNode): Label` — 建立標籤，可選擇性貼上                             | P0     |
| FR-12 | `facade.getNodeLabels(node): Label[]` — 查詢節點標籤列表                                                              | P0     |
| FR-13 | `facade.getAllLabels(): readonly Label[]` — 查詢所有標籤                                                              | P0     |
| FR-14 | App.tsx 不再直接 import 任何 `*Command`、`CommandInvoker`、`Clipboard`、`tagMediator`、`labelFactory`                 | P0     |

---

## 5. 非功能需求

| ID     | 描述                                                                                                             | 量化指標                                               |
| ------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| NFR-01 | `FileSystemFacade` 為純 TypeScript 類別，不依賴 React（可在 Vitest 中直接 new 並測試）                           | 測試不需要 React TestBed / jsdom                       |
| NFR-02 | Facade 採用 Constructor Injection（DIP）：CommandInvoker / Clipboard / TagMediator / LabelFactory 皆可由外部注入 | 測試可傳入 mock/spy 不依賴 module 單例                 |
| NFR-03 | App.tsx 中 Command / Pattern 相關 import 行數從現有（≥8 行）降至 0 行                                            | Import 行數 = 0                                        |
| NFR-04 | 不改動 Domain 層任何現有類別                                                                                     | 無 Domain 檔案的 diff                                  |
| NFR-05 | 所有指令操作（含標籤）仍透過 CommandInvoker.execute() 進入歷程，Undo/Redo 保持完整                               | 現有 LabelTagCommand / RemoveLabelCommand 測試全數通過 |

---

## 6. In Scope / Out of Scope

### In Scope

- `src/services/FileSystemFacade.ts`（新增）
- `src/App.tsx`（重構：移除直接依賴）
- `tests/services/FileSystemFacade.test.ts`（新增）

### Out of Scope

- 匯出功能（exportToXml / exportToJson / exportToMarkdown）不納入 Facade
- 搜尋功能（performSearch / buildMatchedPathsWithProgress）不納入 Facade
- Observer / Dashboard / Log 相關邏輯不納入 Facade
- React 狀態管理（treeVersion / labelVersion / setState）不納入 Facade
- Domain 層任何類別（不修改）

---

## 7. 技術棧

- **語言**：TypeScript 5.x（strict mode）
- **框架**：React 18 + Vite（僅 App.tsx 修改）
- **測試**：Vitest 3.x
- **放置位置**：`src/services/FileSystemFacade.ts`（Service 層，不進 Domain 層）

---

## 8. 備注

- `FileSystemFacade` 在 `App.tsx` 以 `useMemo(() => new FileSystemFacade(), [])` 持有
- `treeVersion` / `labelVersion` 狀態更新仍由 App 負責，Facade 不持有 React state
- Facade 的 module 層級單例（`export const fileSystemFacade`）可保留供跨頁使用；測試時以 `new FileSystemFacade(mockInvoker, ...)` 建立隔離實例
