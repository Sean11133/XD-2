# spec.md — 006-command-strategy-pattern

> **需求編號**: 006  
> **需求簡述**: 管理操作 Command Pattern + Sort Strategy + Singleton Clipboard + Undo/Redo  
> **建立日期**: 2026-03-30  
> **狀態**: 待審核

---

## 1. 背景與問題陳述

### 背景

目前系統僅支援「瀏覽」與「匯出」兩種操作。使用者無法對檔案樹中的節點進行複製、貼上、刪除、重新排序等管理動作。更重要的是，缺乏可逆操作（Undo/Redo），使用者一旦誤刪或誤操作，無法還原。

### 核心問題

| 問題                       | 影響                         |
| -------------------------- | ---------------------------- |
| 無法複製 / 貼上 / 刪除節點 | 使用者無法管理檔案樹結構     |
| 無排序功能                 | 大型目錄內容難以快速定位     |
| 操作無法撤銷               | 誤操作無法還原，使用者信心低 |
| 操作邏輯散落在 UI 元件中   | 難以擴充新操作、難以測試     |

---

## 2. 使用者故事（User Stories）

### US-01：複製節點

**As** 使用者  
**I want** 在檔案樹中選取一個節點後，點擊工具列的「複製」按鈕，將節點記錄到剪貼簿  
**So that** 我可以在稍後將節點副本貼到其他目錄

#### 驗收標準（Given-When-Then）

**情境 A：成功複製**

- **Given** 使用者已選取一個節點（檔案或目錄）
- **When** 點擊工具列「複製」按鈕
- **Then** Clipboard（Singleton）儲存該節點的參考；樹狀態不變；「複製」動作**不**加入 Undo 堆疊

**情境 B：未選取節點時**

- **Given** 目前沒有選取任何節點
- **When** 使用者看到工具列
- **Then** 「複製」按鈕為 disabled 狀態，無法點擊

**優先級**: P1

---

### US-02：貼上節點

**As** 使用者  
**I want** 選取一個目錄後，點擊「貼上」按鈕，將剪貼簿中的節點副本插入該目錄  
**So that** 我可以快速在不同目錄間複製節點

#### 驗收標準（Given-When-Then）

**情境 A：成功貼上**

- **Given** Clipboard 中有節點 + 目前選取的節點是 Directory
- **When** 點擊「貼上」
- **Then** 目標目錄下新增來源節點的 deep copy（相同名稱）；PasteCommand 加入 Undo 堆疊；執行新操作後清空 Redo 堆疊

**情境 B：Undo 貼上**

- **Given** 上一個操作是「貼上」
- **When** 點擊「Undo」
- **Then** 剛貼入的節點從目標目錄中移除，樹狀態回到貼上前

**情境 C：貼上按鈕 disabled**

- **Given** Clipboard 為空，或目前選取的不是 Directory
- **When** 使用者看到工具列
- **Then** 「貼上」按鈕為 disabled

**優先級**: P0

---

### US-03：刪除節點

**As** 使用者  
**I want** 選取一個節點後，點擊「刪除」按鈕，將其從父目錄移除  
**So that** 我可以清理不需要的檔案或資料夾

#### 驗收標準（Given-When-Then）

**情境 A：成功刪除**

- **Given** 使用者已選取一個節點（且該節點有父目錄）
- **When** 點擊「刪除」
- **Then** 節點從父目錄的 children 中移除；DeleteCommand 加入 Undo 堆疊；Redo 堆疊清空

**情境 B：Undo 刪除**

- **Given** 上一個操作是「刪除」
- **When** 點擊「Undo」
- **Then** 節點回到原父目錄的**原始位置**（依原始 index 插入）；樹狀態回到刪除前

**情境 C：刪除按鈕 disabled**

- **Given** 沒有選取節點
- **When** 使用者看到工具列
- **Then** 「刪除」按鈕為 disabled

**優先級**: P0

---

### US-04：排序子節點

**As** 使用者  
**I want** 選取一個目錄後，透過工具列的排序按鈕（附策略下拉選單）排序其子節點  
**So that** 我可以用不同維度整理目錄內容

#### 驗收標準（Given-When-Then）

**情境 A：依名稱排序**

- **Given** 使用者選取一個 Directory，並選擇「依名稱 A→Z」
- **When** 點擊「排序」
- **Then** 該目錄的 children 依名稱升冪重新排列；SortCommand 加入 Undo 堆疊

**情境 B：依大小排序**

- **Given** 使用者選擇「依大小 小→大」
- **When** 點擊「排序」
- **Then** children 依 fileSize 升冪排列（Directory 的 size 以 0 計）

**情境 C：依類型排序**

- **Given** 使用者選擇「依類型 資料夾優先」
- **When** 點擊「排序」
- **Then** Directory 節點排在所有 File 節點之前，同類型內部維持原順序

**情境 D：依日期排序（新→舊）**

- **Given** 使用者選擇「依日期 新→舊」
- **When** 點擊「排序」
- **Then** children 依 lastModified 降冪排列

**情境 E：Undo 排序**

- **Given** 上一個操作是「排序」
- **When** 點擊「Undo」
- **Then** 目錄的 children 恢復到排序前的原始順序

**情境 F：排序按鈕 disabled**

- **Given** 沒有選取節點，或選取的是 File（非 Directory）
- **When** 使用者看到工具列
- **Then** 「排序」按鈕為 disabled

**優先級**: P1

---

### US-05：Undo（撤銷上一個操作）

**As** 使用者  
**I want** 點擊「Undo」按鈕，撤銷上一個可逆操作  
**So that** 我可以安全試驗操作，不怕誤操作

#### 驗收標準（Given-When-Then）

**情境 A：成功 Undo**

- **Given** Undo 堆疊中有至少一個 Command
- **When** 點擊「Undo」
- **Then** 最後一個 Command 的 `undo()` 被呼叫；該 Command 移入 Redo 堆疊；支援無限層撤銷

**情境 B：Undo 堆疊為空**

- **Given** 尚未執行任何可逆操作
- **When** 使用者看到工具列
- **Then** 「Undo」按鈕為 disabled

**優先級**: P0

---

### US-06：Redo（重做上一個撤銷操作）

**As** 使用者  
**I want** 點擊「Redo」按鈕，重做上一個被撤銷的操作  
**So that** 我可以恢復剛才撤銷的結果

#### 驗收標準（Given-When-Then）

**情境 A：成功 Redo**

- **Given** Redo 堆疊中有至少一個 Command
- **When** 點擊「Redo」
- **Then** 最後撤銷的 Command 的 `execute()` 再次被呼叫；該 Command 移回 Undo 堆疊

**情境 B：Redo 後執行新操作**

- **Given** Redo 堆疊中有項目
- **When** 使用者執行任何新操作（Paste / Delete / Sort）
- **Then** Redo 堆疊清空（標準 Command Pattern 行為）

**情境 C：Redo 堆疊為空**

- **Given** 沒有任何撤銷過的操作
- **When** 使用者看到工具列
- **Then** 「Redo」按鈕為 disabled

**優先級**: P0

---

## 3. 功能需求摘要

| 功能 | 入口                  | 可 Undo | 操作對象            |
| ---- | --------------------- | ------- | ------------------- |
| 複製 | 工具列按鈕            | ❌      | 任何 FileSystemNode |
| 貼上 | 工具列按鈕            | ✅      | 目標：Directory     |
| 刪除 | 工具列按鈕            | ✅      | 任何 FileSystemNode |
| 排序 | 工具列按鈕 + 策略下拉 | ✅      | 目標：Directory     |
| Undo | 工具列按鈕            | —       | CommandInvoker      |
| Redo | 工具列按鈕            | —       | CommandInvoker      |

---

## 4. 排序策略規格

| 策略   | 方向選項                     | 比較依據                             |
| ------ | ---------------------------- | ------------------------------------ |
| 依名稱 | A→Z（升冪）/ Z→A（降冪）     | `node.name`（字母順序）              |
| 依大小 | 小→大（升冪）/ 大→小（降冪） | `node.fileSize`（Directory 以 0 計） |
| 依類型 | 資料夾優先 / 檔案優先        | `node instanceof Directory`          |
| 依日期 | 新→舊（降冪）/ 舊→新（升冪） | `node.lastModified`                  |

---

## 5. 設計模式對應

| 模式          | 元件（規劃）                                                                                    | 說明                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Command**   | `ICommand`、`PasteCommand`、`DeleteCommand`、`SortCommand`、`CopyCommand`                       | 封裝操作，統一 `execute()` / `undo()` 介面                  |
| **Strategy**  | `ISortStrategy`、`NameSortStrategy`、`SizeSortStrategy`、`TypeSortStrategy`、`DateSortStrategy` | 排序演算法可在執行期替換，不改動 SortCommand                |
| **Singleton** | `Clipboard`                                                                                     | 全應用共用唯一剪貼簿實例                                    |
| **Invoker**   | `CommandInvoker`                                                                                | 管理 undoStack / redoStack，提供 execute / undo / redo 方法 |

---

## 6. 非功能需求

- 所有操作執行後，UI 應立即重新渲染最新的樹狀態
- Clipboard 使用 Singleton 模式，整個應用程式共用一個實例
- Undo / Redo 支援**無限層**，不設上限
- Sort Strategy 可透過注入替換，不需修改 SortCommand

---

## 7. 範疇外（Out of Scope）

| 項目                        | 說明                               |
| --------------------------- | ---------------------------------- |
| 剪下（Cut）操作             | 本次只實作複製+貼上，不做剪下      |
| 多選操作                    | 一次只操作一個節點                 |
| 節點重新命名                | 不在本需求範圍內                   |
| Undo/Redo 跨 Session 持久化 | 堆疊不需儲存到 localStorage        |
| 貼上時同名衝突處理          | 允許同名節點並存（不做重命名提示） |

---

## 8. 開放問題（Open Issues）

| #     | 問題                                                                                          | 狀態               |
| ----- | --------------------------------------------------------------------------------------------- | ------------------ |
| OI-01 | `FileSystemNode` 上是否已有 `fileSize` 與 `lastModified` 屬性？若無，需在架構階段討論補充方式 | 待 @architect 確認 |
| OI-02 | 排序時，Directory 的 `fileSize` 以 0 計算，還是以遞迴子節點大小加總？                         | 待 @architect 決定 |
