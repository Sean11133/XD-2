# 需求規格書（Spec）

---

## 1. 專案基本資訊

| 欄位         | 內容                                                  |
| ------------ | ----------------------------------------------------- |
| 專案名稱     | FileManagement — Template Method Exporter 重構        |
| 版本號       | v1.0.0                                                |
| 負責人（PM） | —                                                     |
| 建立日期     | 2026-03-27                                            |
| 最後更新     | 2026-03-27                                            |
| 審核狀態     | [x] 待審核 &ensp; [ ] 已通過 &ensp; [ ] 需修改        |

---

## 2. 背景與目標

### 2.1 業務背景

現有系統已透過 **Visitor Pattern** 實作 `FileSystemXmlExporter`，可將檔案系統樹匯出為 XML 格式。  
客戶後來確認其系統需要 **JSON 格式**；AI 部門則另外提出 **Markdown 格式**需求。

在新增匯出格式的過程中，工程師觀察到每種格式都需要處理相同的橫切關注點：
- **字元脫逸（Escape）**：不同格式有各自的保留字元（XML 的 `&<>`、JSON 的 `\"`、Markdown 的 `` ` * _ `` 等）
- **縮排管理（Indentation）**：遞迴走訪時需追蹤層級，以產生正確的縮排

若每個 Exporter 各自重複實作以上邏輯，將造成散彈式修改（Shotgun Surgery），違反 DRY 原則。

### 2.2 專案目標

1. 以 **Template Method Pattern** 定義 `BaseExporterTemplate` 抽象基類，統一封裝「走訪骨架（遞迴）、字元脫逸、縮排管理」等重複邏輯。
2. 開放特定 Hook 方法（`escape`、`formatNode`、`formatDirectoryOpen`、`formatDirectoryClose` 等）供子類別實作，使子類別只需關注格式細節。
3. 完成 `JSONExporter` 與 `MarkdownExporter` 兩個 Concrete Exporter。
4. 將現有 `FileSystemXmlExporter` 重構為繼承 `BaseExporterTemplate`，確保三個 Exporter 的架構一致 `[待確認：如客戶希望保留原始 XmlExporter 不動，可跳過此項]`。

### 2.3 成功指標（KPI）

| 指標名稱                         | 目標值         | 衡量方式                                           | 評估時間點   |
| -------------------------------- | -------------- | -------------------------------------------------- | ------------ |
| 重複字元脫逸邏輯消除             | 0 行重複       | Code Review 確認各 Exporter 無自行實作 escape 邏輯 | 開發完成時   |
| 單元測試覆蓋率                   | ≥ 90%          | Vitest coverage report                             | CI 通過時    |
| 新增第 4 種 Exporter 所需修改量  | 僅新增 1 個檔案 | Code Review                                        | 架構審核時   |

---

## 3. 利害關係人

| 角色          | 姓名 | 職責                           |
| ------------- | ---- | ------------------------------ |
| 客戶系統整合  | —    | 需要 JSON 格式匯出             |
| AI 部門       | —    | 需要 Markdown 格式匯出         |
| 開發工程師    | —    | 設計 BaseExporterTemplate 架構 |

---

## 4. 功能需求

### 4.1 功能清單總覽

| 編號  | 功能名稱                             | 優先級 | 狀態  |
| ----- | ------------------------------------ | ------ | ----- |
| F-001 | 定義 BaseExporterTemplate 抽象基類   | P0     | Draft |
| F-002 | 實作 JSONExporter                    | P0     | Draft |
| F-003 | 實作 MarkdownExporter                | P0     | Draft |
| F-004 | 重構 FileSystemXmlExporter（繼承基類） | P1   | Draft |

### 4.2 User Story 詳述

---

#### US-001：定義 BaseExporterTemplate

| 欄位     | 內容                                                 |
| -------- | ---------------------------------------------------- |
| 編號     | US-001                                               |
| 標題     | 以 Template Method 封裝匯出骨架                      |
| 對應功能 | F-001                                                |
| 優先級   | P0                                                   |

**描述**

- **角色**：作為開發工程師
- **需求**：我想要一個實作 `IFileSystemVisitor` 的抽象基類 `BaseExporterTemplate`，它在 `visit*` 骨架方法中處理字元脫逸與縮排，並呼叫子類別的 Hook 方法
- **目的**：以便新增匯出格式時，只需繼承基類並實作格式相關的 Hook，無需重複撰寫遞迴走訪與脫逸邏輯

**驗收標準（Acceptance Criteria）**

1. **Given** `BaseExporterTemplate` 存在，**When** 子類別繼承它，**Then** 子類別只需實作以下 Hook：`escape(value: string): string`、`formatLeafNode(...): string`、`formatDirectoryOpen(...): string`、`formatDirectoryClose(...): string`、`getHeader(): string`（可選）。
2. **Given** 字元脫逸，**When** 任一 `visit*` 方法被呼叫，**Then** `node.name` 與其他字串屬性均通過 `this.escape()` 處理後再交給格式化 Hook。
3. **Given** 縮排管理，**When** 進入 `visitDirectory` 時，**Then** `_indentLevel` 自動遞增；離開時自動遞減；`indent()` 工具方法以 `_indentLevel × 2 空格` 產生縮排字串。
4. **Given** `BaseExporterTemplate`，**When** 呼叫 `getResult()`，**Then** 回傳已組裝完畢的完整字串。

**附註/限制**

- `BaseExporterTemplate` 為 TypeScript **抽象類別（abstract class）**，不可直接實例化。
- 繼續實作 `IFileSystemVisitor` 介面，保持與現有 `accept()` 機制的相容性。

---

#### US-002：實作 JSONExporter

| 欄位     | 內容                                 |
| -------- | ------------------------------------ |
| 編號     | US-002                               |
| 標題     | 將檔案系統樹匯出為 JSON 格式         |
| 對應功能 | F-002                                |
| 優先級   | P0                                   |

**描述**

- **角色**：作為客戶系統整合工程師
- **需求**：我想要呼叫 `exportToJson(root)` 取得代表整棵樹的 JSON 字串
- **目的**：以便將結果直接串接至客戶的 JSON-based 系統

**驗收標準（Acceptance Criteria）**

1. **Given** 一個含子節點的 `Directory` 根節點，**When** 呼叫 `exportToJson(root)`，**Then** 回傳符合 JSON 規格的字串，子節點以 `children` 陣列巢狀呈現。
2. **Given** 檔名含雙引號（如 `my"file.txt`），**When** 匯出，**Then** 輸出中該字元已被 `\"` 正確脫逸。
3. **Given** `JSONExporter` 繼承 `BaseExporterTemplate`，**When** 實作，**Then** 類別本身不包含任何縮排計算或 escape 迴圈，只實作 Hook 方法。

**附註/限制**

- 輸出格式：pretty-print JSON（含縮排），而非 minified。
- JSON 中每個節點至少包含：`type`、`name`、`sizeKB`；根據節點類型附加 `children`（Directory）或特有屬性（如 `pageCount`、`width/height`、`encoding`）。

---

#### US-003：實作 MarkdownExporter

| 欄位     | 內容                                           |
| -------- | ---------------------------------------------- |
| 編號     | US-003                                         |
| 標題     | 將檔案系統樹匯出為 Markdown 縮排列表格式       |
| 對應功能 | F-003                                          |
| 優先級   | P0                                             |

**描述**

- **角色**：作為 AI 部門工程師
- **需求**：我想要呼叫 `exportToMarkdown(root)` 取得以縮排列表呈現的 Markdown 字串
- **目的**：以便將檔案樹結構嵌入 Markdown 文件或 LLM Prompt

**驗收標準（Acceptance Criteria）**

1. **Given** 一個具層次結構的 `Directory` 根節點，**When** 呼叫 `exportToMarkdown(root)`，**Then** 輸出以 `- ` 開頭的縮排列表，每層縮排為 2 個空格。
2. **Given** 檔名含 Markdown 保留字元（如 `` ` ``、`*`、`_`、`[`、`]`），**When** 匯出，**Then** 保留字元已加 `\` 前綴脫逸。
3. **Given** `MarkdownExporter` 繼承 `BaseExporterTemplate`，**When** 實作，**Then** 類別本身不包含縮排計算邏輯，只實作 Hook 方法。

**附註/限制**

- 格式範例：
  ```
  - 📁 MyDocuments (120 KB)
    - 📄 report.docx (45 KB)
    - 🖼️ photo.png (60 KB)
    - 📁 SubFolder (15 KB)
      - 📝 notes.txt (15 KB)
  ```
- `[待確認：Emoji 圖示是否需要？若客戶環境不支援 Unicode，可改為純文字標示型別]`

---

#### US-004：重構 FileSystemXmlExporter（可選）

| 欄位     | 內容                                                  |
| -------- | ----------------------------------------------------- |
| 編號     | US-004                                                |
| 標題     | 將現有 XmlExporter 改為繼承 BaseExporterTemplate      |
| 對應功能 | F-004                                                 |
| 優先級   | P1                                                    |

**描述**

- **角色**：作為開發工程師
- **需求**：我想要 `FileSystemXmlExporter` 也繼承 `BaseExporterTemplate`，實作 XML 版本的 Hook
- **目的**：以便所有三個 Exporter 共用同一架構，降低未來維護成本

**驗收標準（Acceptance Criteria）**

1. **Given** 重構後的 `FileSystemXmlExporter`，**When** 執行既有的 `FileSystemXmlExporter.test.ts`，**Then** 全數測試通過（行為不退化）。
2. **Given** 重構後，**When** Code Review，**Then** `escapeXml` 函式由基類 `escape()` Hook 取代，不再獨立定義。

---

## 5. 非功能需求

| 編號   | 類型       | 描述                                                         | 量化指標                      |
| ------ | ---------- | ------------------------------------------------------------ | ----------------------------- |
| NFR-01 | 可維護性   | 新增第 4 種 Exporter 只需新增 1 個檔案，不修改基類或 Domain | Code Review 確認               |
| NFR-02 | 測試覆蓋率 | 新增程式碼的單元測試覆蓋率                                   | ≥ 90%（Vitest coverage）      |
| NFR-03 | 相容性     | 現有 `exportToXml()` 函式簽名不變                            | 既有測試全數通過               |

---

## 6. In Scope / Out of Scope

### In Scope

- `BaseExporterTemplate` 抽象基類（TypeScript abstract class，實作 `IFileSystemVisitor`）
- `JSONExporter`（繼承 `BaseExporterTemplate`）
- `MarkdownExporter`（繼承 `BaseExporterTemplate`）
- `FileSystemXmlExporter` 重構為繼承 `BaseExporterTemplate`（P1，可選）
- 對應的單元測試

### Out of Scope

- 新增 Domain 節點類型（`Directory`、`TextFile`、`WordDocument`、`ImageFile` 不變）
- UI / 前端整合（只產出字串，不進行渲染）
- 非同步匯出或串流輸出
- 實際的 API endpoint 建立

---

## 7. 技術棧

| 層次     | 技術                          | 備注                           |
| -------- | ----------------------------- | ------------------------------ |
| 語言     | TypeScript 5.x                | 現有專案語言                   |
| 框架     | React + Vite（前端，不涉及）  | Exporter 為純 Service 層邏輯   |
| 測試     | Vitest                        | 現有測試框架                   |
| 設計模式 | Template Method + Visitor     | Visitor 已實作，本次疊加 Template Method |

---

## 8. 相依關係與風險

| 風險                                         | 機率 | 衝擊 | 緩解方式                                      |
| -------------------------------------------- | ---- | ---- | --------------------------------------------- |
| Markdown Emoji 在目標環境不支援              | 中   | 低   | `[待確認]` 提供純文字 fallback 選項           |
| XML 重構造成既有測試失敗                     | 低   | 中   | P1 優先級，可獨立 PR；先確保既有測試全綠      |
| JSON pretty-print 縮排層級與基類縮排衝突     | 低   | 低   | JSON 子類別自行管理 JSON 字串建構，縮排僅用於走訪層級同步 |
