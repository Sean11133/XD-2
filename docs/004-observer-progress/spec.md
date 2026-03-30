# 需求規格書（Spec）

---

## 1. 專案基本資訊

| 欄位         | 內容                                           |
| ------------ | ---------------------------------------------- |
| 專案名稱     | 雲端檔案管理系統 — 進度顯示與 Observer 整合    |
| 版本號       | v1.0.0                                         |
| 負責人（PM） | —                                              |
| 建立日期     | 2026-03-30                                     |
| 最後更新     | 2026-03-30                                     |
| 審核狀態     | [x] 待審核 &ensp; [ ] 已通過 &ensp; [ ] 需修改 |

---

## 2. 背景與目標

### 2.1 業務背景

現有的雲端檔案管理系統在執行匯出（JSON / Markdown / XML）或載入大量檔案節點時，
使用者介面完全無回饋，使用者不知道操作是否在進行或何時完成，
造成體驗不佳且常誤以為系統當機而重複觸發。

此外，通知端（進度發佈）與接收端（UI 更新、日誌）目前尚未解耦，
一旦未來新增更多觀察者（如通知後端 API、錄音日誌等），必須修改核心邏輯，違反 OCP。

### 2.2 專案目標

1. 導入 **Observer Pattern**，讓進度發佈端（Subject）與多個接收端（Observer）完全解耦，
   通知端與接收端各自可獨立開發，不互相阻塞進度。
2. 實作 `ConsoleObserver`，將操作日誌即時顯示於頁面內嵌的 **Log Panel**。
3. 實作 `DashboardObserver`，驅動頁面上的 **`<ProgressBar />`** 元件即時更新進度百分比。
4. Subject 整合至所有 Exporter（JSON / Markdown / XML）與「載入/掃描節點」流程。

### 2.3 成功指標（KPI）

| 指標名稱             | 目標值                   | 衡量方式                                    | 評估時間點 |
| -------------------- | ------------------------ | ------------------------------------------- | ---------- |
| 操作進度可見性       | 100% 操作有進度條        | 人工測試所有觸發情境                        | 開發完成後 |
| Observer 解耦程度    | 0 處直接相依             | Code Review：新增 Observer 無需修改 Subject | 審查時     |
| Log Panel 日誌完整度 | 每次操作 ≥ 3 條記錄      | 單元測試驗證 ConsoleObserver                | CI 執行時  |
| UI 進度條刷新頻率    | 每完成 1 個節點刷新 1 次 | 整合測試觀察 React state 更新               | 開發完成後 |

---

## 3. 利害關係人

| 角色   | 職責                              |
| ------ | --------------------------------- |
| 開發者 | 實作 Subject 介面與三個 Observer  |
| 使用者 | 透過 UI 觀察進度條與日誌面板      |
| 架構師 | 確認 Observer Pattern 的 OCP 遵循 |

---

## 4. 功能需求

### 4.1 功能清單總覽

| 編號  | 功能名稱                          | 優先級 | 狀態  |
| ----- | --------------------------------- | ------ | ----- |
| F-001 | IProgressSubject 介面定義         | P0     | Draft |
| F-002 | IProgressObserver 介面定義        | P0     | Draft |
| F-003 | ExporterProgressMixin 實作        | P0     | Draft |
| F-004 | ConsoleObserver — Log Panel 整合  | P0     | Draft |
| F-005 | DashboardObserver — ProgressBar   | P0     | Draft |
| F-006 | 匯出操作整合（JSON/Markdown/XML） | P0     | Draft |
| F-007 | 節點掃描/載入整合                 | P1     | Draft |

### 4.2 User Story 詳述

---

#### US-001：定義進度事件的介面合約（發佈端）

| 欄位     | 內容                            |
| -------- | ------------------------------- |
| 編號     | US-001                          |
| 標題     | 定義 Subject 介面，與接收端解耦 |
| 對應功能 | F-001、F-002                    |
| 優先級   | P0                              |

**描述**

- **角色**：作為開發者
- **需求**：我想要定義 `IProgressSubject` 與 `IProgressObserver` 兩個介面
- **目的**：以便通知端與接收端能各自獨立開發，不互相影響

**ProgressEvent 事件物件結構**

```typescript
interface ProgressEvent {
  phase: "scan" | "export"; // 操作階段
  operationName: string; // 如 "JSONExporter"、"節點掃描"
  current: number; // 已完成節點數
  total: number; // 總節點數
  percentage: number; // 0–100
  message: string; // 人類可讀訊息
  timestamp: Date;
}
```

**驗收標準（Acceptance Criteria）**

1. **Given** 介面定義完成，**When** 任何新的 Observer 實作 `IProgressObserver`，**Then** 不需要修改 Subject 或其他 Observer 的任何程式碼（OCP）。
2. **Given** `IProgressSubject` 定義完成，**When** Exporter 實作該介面，**Then** 可正確呼叫 `subscribe()`、`unsubscribe()`、`notify()` 三個方法。
3. **Given** `ProgressEvent` 事件，**When** `percentage` 值為 100，**Then** 代表操作已完成。

**附註/限制**

- 介面放置於 `src/domain/observer/` 目錄（Domain 層，不引用任何 React API）
- `ProgressEvent` 與框架無關，為純 TypeScript 型別

---

#### US-002：匯出操作發佈進度事件（Subject 實作）

| 欄位     | 內容                                      |
| -------- | ----------------------------------------- |
| 編號     | US-002                                    |
| 標題     | Exporter 執行時自動發佈每個節點的進度事件 |
| 對應功能 | F-003、F-006                              |
| 優先級   | P0                                        |

**描述**

- **角色**：作為開發者
- **需求**：我想要讓 `BaseExporterTemplate` 與 `FileSystemXmlExporter` 在走訪每個節點時發佈 `ProgressEvent`
- **目的**：以便所有訂閱的 Observer 都能得知目前進度

**驗收標準（Acceptance Criteria）**

1. **Given** 有 Observer 訂閱，**When** JSONExporter 執行匯出 10 個節點，**Then** Observer 的 `onProgress()` 被呼叫 ≥ 10 次，且最後一次 `percentage === 100`。
2. **Given** 沒有 Observer 訂閱，**When** 執行匯出，**Then** 程式正常執行，不拋出任何錯誤。
3. **Given** Exporter 完成匯出，**When** 呼叫 `unsubscribe()` 移除某 Observer，**Then** 後續匯出操作不再通知該 Observer。

**附註/限制**

- `BaseExporterTemplate` 的 Subject 邏輯應以 Mixin 或 Composition 方式注入，不修改 Template Method 骨架的呼叫順序
- 節點總數應在匯出開始前先行計算（走訪一次 Directory tree 取得 count）

---

#### US-003：ConsoleObserver 顯示日誌於 Log Panel

| 欄位     | 內容                                               |
| -------- | -------------------------------------------------- |
| 編號     | US-003                                             |
| 標題     | ConsoleObserver 將操作日誌即時顯示於頁面 Log Panel |
| 對應功能 | F-004                                              |
| 優先級   | P0                                                 |

**描述**

- **角色**：作為使用者
- **需求**：我想要在頁面底部看到操作日誌面板，顯示每個匯出/掃描步驟的文字記錄
- **目的**：以便我能追蹤操作細節，並在出現問題時快速定位

**Log Panel 顯示規格**

| 日誌等級 | 顏色 | 觸發時機               |
| -------- | ---- | ---------------------- |
| INFO     | 灰色 | 操作開始、每個節點完成 |
| SUCCESS  | 綠色 | 整體操作完成（100%）   |
| WARNING  | 黃色 | 節點跳過或警告情況     |

**驗收標準（Acceptance Criteria）**

1. **Given** 使用者點擊「匯出 JSON」，**When** 匯出開始，**Then** Log Panel 第一行顯示 `[INFO] JSONExporter 開始匯出，共 N 個節點`。
2. **Given** 匯出完成，**When** percentage === 100，**Then** Log Panel 追加一行 `[SUCCESS] 匯出完成`，文字顯示為綠色。
3. **Given** Log Panel 已有 ≥ 50 條記錄，**When** 新增一條，**Then** 面板自動滾動至最新一條。
4. **Given** Log Panel 存在，**When** 使用者點擊「清除日誌」按鈕，**Then** 面板內容清空。

**附註/限制**

- `ConsoleObserver` 本身不操作 DOM，透過 callback 將訊息推送給 React state（依賴注入，不違反 DIP）
- Log Panel 為獨立 React 元件 `<LogPanel />`，放置於 `src/components/LogPanel.tsx`

---

#### US-004：DashboardObserver 驅動進度條 UI

| 欄位     | 內容                                     |
| -------- | ---------------------------------------- |
| 編號     | US-004                                   |
| 標題     | DashboardObserver 即時更新頁面進度條狀態 |
| 對應功能 | F-005                                    |
| 優先級   | P0                                       |

**描述**

- **角色**：作為使用者
- **需求**：我想要在執行匯出或節點掃描時，頁面頂端顯示進度條，即時反映完成百分比
- **目的**：以便我知道操作仍在進行中，願意等待而不重複觸發

**ProgressBar UI 規格**

| 狀態   | 顏色 | 顯示條件                            |
| ------ | ---- | ----------------------------------- |
| 進行中 | 藍色 | 0% < percentage < 100%              |
| 完成   | 綠色 | percentage === 100，顯示 2 秒後隱藏 |
| 待機   | 隱藏 | 無操作進行中                        |

**驗收標準（Acceptance Criteria）**

1. **Given** 使用者點擊任一匯出按鈕，**When** 匯出開始，**Then** 頁面顯示藍色進度條，寬度從 0% 開始增加。
2. **Given** 匯出進行中，**When** 每個節點完成，**Then** 進度條寬度即時更新（不閃爍）。
3. **Given** 匯出完成，**When** percentage === 100，**Then** 進度條變為綠色，顯示「完成」文字，2 秒後自動隱藏。
4. **Given** 同時有兩個 Observer 訂閱同一個 Subject，**When** 匯出進行，**Then** ProgressBar 與 LogPanel 各自獨立更新，互不干擾。

**附註/限制**

- `DashboardObserver` 本身不操作 React state，透過 callback 注入（constructor 注入或 setter 注入）
- `<ProgressBar />` 為獨立 React 元件，放置於 `src/components/ProgressBar.tsx`
- 動畫使用 CSS transition，不依賴第三方動畫套件

---

#### US-005：節點掃描/載入時也發佈進度（次優先）

| 欄位     | 內容                     |
| -------- | ------------------------ |
| 編號     | US-005                   |
| 標題     | 載入檔案樹時顯示掃描進度 |
| 對應功能 | F-007                    |
| 優先級   | P1                       |

**描述**

- **角色**：作為使用者
- **需求**：我想要在系統初始化建立檔案樹時，也能看到掃描進度條
- **目的**：以便在大型目錄結構下，使用者知道系統正在載入而非卡頓

**驗收標準（Acceptance Criteria）**

1. **Given** 應用程式初始化，**When** `buildSampleTree()` 執行，**Then** 進度條與 Log Panel 同樣顯示掃描進度。
2. **Given** 掃描完成，**When** 所有節點建立完畢，**Then** 進度條顯示 100% 並隱藏。

**附註/限制**

- 此 Story 為 P1，可在 P0 全部完成後再實作
- `buildSampleTree()` 改為接受可選的 `IProgressSubject` 參數，預設為 `null`（向後相容）

---

## 5. 非功能需求

### 5.1 效能需求

| 項目              | 需求描述                                                                |
| ----------------- | ----------------------------------------------------------------------- |
| Observer 通知延遲 | 每次 `notify()` 執行時間 < 1ms（不阻塞主執行緒）                        |
| React re-render   | 每次 `onProgress()` 觸發一次 React state 更新，不 batching 外的額外渲染 |
| Log Panel 容量    | 最多顯示 500 條記錄，超出時自動清除最舊的 100 條                        |

### 5.2 可維護性需求

| 項目          | 需求描述                                                      |
| ------------- | ------------------------------------------------------------- |
| 新增 Observer | 新增一個 Observer 類別不需修改任何 Exporter 或 Subject 程式碼 |
| 移除 Observer | 呼叫 `unsubscribe()` 即可，不留記憶體洩漏                     |
| 介面向後相容  | 現有 Exporter 的公開 API（`export()` 方法）簽章不變           |

### 5.3 安全性需求

| 項目       | 需求描述                                             |
| ---------- | ---------------------------------------------------- |
| XSS 防護   | Log Panel 顯示的文字必須做 HTML escape，防止注入攻擊 |
| 記憶體管理 | 元件卸載時自動呼叫 `unsubscribe()`，避免 memory leak |

---

## 6. 技術棧

| 層次     | 技術                             |
| -------- | -------------------------------- |
| 前端框架 | React 18 + TypeScript（現有）    |
| 建置工具 | Vite（現有）                     |
| 測試框架 | Vitest + Testing Library（現有） |
| 樣式     | Tailwind CSS（現有）             |
| 設計模式 | Observer Pattern（新增）         |

---

## 7. 範圍界定（Scope）

### In Scope（本次包含）

- `IProgressObserver` 與 `IProgressSubject` 介面定義（Domain 層）
- `ProgressEvent` 事件型別定義
- `ExporterProgressMixin`：Subject 邏輯，composable 至 BaseExporterTemplate 與 FileSystemXmlExporter
- `ConsoleObserver`：實作 IProgressObserver，透過 callback 推送訊息至 Log Panel state
- `DashboardObserver`：實作 IProgressObserver，透過 callback 推送 percentage 至 ProgressBar state
- `<ProgressBar />` React 元件（新增）
- `<LogPanel />` React 元件（新增）
- `App.tsx` 整合：連接 Subject + Observer + UI 元件
- 單元測試：ConsoleObserver、DashboardObserver、ExporterProgressMixin

### Out of Scope（本次不包含）

- 後端 API 進度推送（WebSocket / SSE）
- 實際大檔案的非同步匯出（目前維持同步）
- Observer 的持久化（重整後不恢復日誌）
- 多語系（i18n）日誌訊息

---

## 8. 架構約束

1. **Domain 層純淨**：`IProgressObserver`、`IProgressSubject`、`ProgressEvent` 放於 `src/domain/observer/`，不得引用任何 React API。
2. **Observer 不依賴 React state**：所有 Observer 透過 constructor 注入的 callback 與 React 互動（DIP）。
3. **Exporter 向後相容**：現有的 `exportToJson(root)`、`exportToMarkdown(root)`、`exportToXml(root)` 函式簽名保持不變；進度功能透過選用的 Subject 參數擴充。
4. **禁止 Subject 直接 import Observer**：兩者只透過介面互動（DIP）。

---

## 9. 目錄規劃（參考）

```
src/
├── domain/
│   └── observer/               ← 新增（Domain 層，純 TypeScript）
│       ├── IProgressObserver.ts
│       ├── IProgressSubject.ts
│       ├── ProgressEvent.ts
│       └── index.ts
├── services/
│   ├── observers/              ← 新增（Application 層）
│   │   ├── ConsoleObserver.ts
│   │   └── DashboardObserver.ts
│   └── exporters/
│       └── BaseExporterTemplate.ts  ← 修改：整合 Subject mixin
├── components/
│   ├── ProgressBar.tsx         ← 新增
│   └── LogPanel.tsx            ← 新增
tests/
├── services/
│   └── observers/              ← 新增
│       ├── ConsoleObserver.test.ts
│       └── DashboardObserver.test.ts
```

---

> spec.md 已完成。下一步：輸入 `@architect 根據 docs/004-observer-progress/spec.md 設計架構`，在同一資料夾產出 FRD.md 與 plan.md。
