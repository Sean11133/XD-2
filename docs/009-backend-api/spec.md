# 需求規格書 — 檔案管理系統後端 API

| 欄位         | 內容                                           |
| ------------ | ---------------------------------------------- |
| 專案名稱     | 檔案管理系統後端 API                           |
| 版本號       | v1.0.0                                         |
| 負責人（PM） | Copilot @pm                                    |
| 建立日期     | 2026-04-01                                     |
| 最後更新     | 2026-04-01                                     |
| 審核狀態     | [x] 待審核 &ensp; [ ] 已通過 &ensp; [ ] 需修改 |

---

## 1. 背景與目標

### 1.1 業務背景

現有的檔案管理系統（File Management System）是一套純前端 React + TypeScript 應用程式，所有資料（檔案樹結構、Directory/File 節點、Label 標籤）均存放於瀏覽器記憶體中。每次重新整理頁面，資料即消失，不具備持久化能力，無法支援真正的生產環境使用。

### 1.2 專案目標

1. 建立以 **Python + FastAPI + wecpy** 實作的後端 REST API 服務，將所有業務資料持久化至 **SQLite** 資料庫。
2. 重構前端 React 應用程式，移除 in-memory 資料來源，改為呼叫後端 API（透過 `FileSystemFacade` 統一管理 API 呼叫邏輯）。
3. 確保前後端整合後，現有所有使用者操作（檔案 CRUD、標籤管理）的行為保持一致。

### 1.3 成功指標（KPI）

| 指標名稱                   | 目標值                      | 衡量方式                | 評估時間點  |
| -------------------------- | --------------------------- | ----------------------- | ----------- |
| API 單一端點回應時間       | P95 ≤ 200ms                 | pytest benchmark 測量   | CI 每次執行 |
| 前端頁面重新整理後資料保留 | 100%                        | E2E 手動測試            | 驗收當天    |
| 後端測試覆蓋率             | ≥ 80%                       | pytest-cov 報告         | 開發完成後  |
| API 錯誤處理覆蓋           | 所有 4xx/5xx 有標準回應格式 | Postman collection 驗證 | 驗收當天    |

---

## 2. 利害關係人

| 角色   | 職責                    |
| ------ | ----------------------- |
| 開發者 | 後端 API 實作、前端整合 |
| 架構師 | 技術選型確認、架構審核  |
| 使用者 | 使用前端操作檔案與標籤  |

---

## 3. 技術棧確認

| 層次          | 技術                                                  |
| ------------- | ----------------------------------------------------- |
| 後端語言      | Python 3.10+                                          |
| Web 框架      | FastAPI                                               |
| 企業函式庫    | wecpy（ConfigManager、LogManager）                    |
| 資料庫        | SQLite → 透過 SQLAlchemy ORM                          |
| 測試框架      | pytest 7.x + pytest-mock + httpx（async 測試）        |
| 前端          | React 18 + TypeScript（既有，調整整合層）             |
| 前端 API 呼叫 | `fetch` / `axios`（透過 `FileSystemFacade` 統一管理） |

---

## 4. 功能需求

### 4.1 功能清單總覽

| 編號  | 功能名稱                          | 優先級 | 狀態  |
| ----- | --------------------------------- | ------ | ----- |
| F-001 | 初始化檔案樹資料 API              | P0     | Draft |
| F-002 | 目錄節點 CRUD API                 | P0     | Draft |
| F-003 | 檔案節點 CRUD API                 | P0     | Draft |
| F-004 | 標籤（Label）CRUD API             | P0     | Draft |
| F-005 | 節點標籤關聯管理 API              | P0     | Draft |
| F-006 | 前端 FileSystemFacade 整合改造    | P0     | Draft |
| F-007 | 錯誤處理與統一回應格式            | P0     | Draft |
| F-008 | 後端設定檔（wecpy ConfigManager） | P1     | Draft |

### 4.2 User Story 詳述

---

#### US-001：取得完整檔案樹

| 欄位     | 內容           |
| -------- | -------------- |
| 編號     | US-001         |
| 標題     | 取得完整檔案樹 |
| 對應功能 | F-001          |
| 優先級   | P0             |

**描述**

- **角色**：作為前端應用程式
- **需求**：我想要在啟動時透過 API 取得完整的檔案樹結構
- **目的**：以便顯示初始的 FileTreeView，資料不再 hardcode 於前端

**驗收標準**

1. **Given** 後端資料庫有預設資料，**When** 前端呼叫 `GET /api/nodes/tree`，**Then** 回傳包含所有節點（Directory / File）的巢狀 JSON，包含 `id`、`type`、`name`、`sizeKB`（File）、`createdAt`（File）、`children`（Directory）。
2. **Given** 資料庫為空，**When** 呼叫 `GET /api/nodes/tree`，**Then** 回傳空陣列 `[]`，HTTP 200。
3. **Given** 後端服務異常，**When** 前端呼叫失敗，**Then** 顯示錯誤提示（非白畫面崩潰）。

**附註**

- 節點類型 `type` 為 `"directory"` / `"text_file"` / `"word_document"` / `"image_file"`。
- 回傳格式為遞迴巢狀結構，根節點為根 Directory 的 `children` 陣列。

---

#### US-002：新增 / 刪除目錄

| 欄位     | 內容               |
| -------- | ------------------ |
| 編號     | US-002             |
| 標題     | 新增與刪除目錄節點 |
| 對應功能 | F-002              |
| 優先級   | P0                 |

**描述**

- **角色**：作為使用者
- **需求**：我想要透過 UI 建立新資料夾，或刪除現有資料夾
- **目的**：以便管理檔案樹的目錄結構，且重整頁面後不會消失

**驗收標準**

1. **Given** 使用者選取某 Directory，**When** 執行「新增子目錄」（`POST /api/nodes/directory`），**Then** 新目錄出現在父目錄的 children 中，資料庫已持久化。
2. **Given** 使用者選取某 Directory，**When** 執行刪除（`DELETE /api/nodes/{id}`），**Then** 該節點及所有子節點從資料庫移除，回傳 HTTP 204。
3. **Given** 刪除不存在的節點，**When** 呼叫 `DELETE /api/nodes/{id}`，**Then** 回傳 HTTP 404 與錯誤訊息。

---

#### US-003：複製 / 貼上節點

| 欄位     | 內容                   |
| -------- | ---------------------- |
| 編號     | US-003                 |
| 標題     | 複製貼上節點至目標目錄 |
| 對應功能 | F-002, F-003           |
| 優先級   | P0                     |

**描述**

- **角色**：作為使用者
- **需求**：我想要複製一個節點（File 或 Directory）並貼上至目標目錄
- **目的**：以便快速建立相似的節點，不需重複輸入

**驗收標準**

1. **Given** 使用者複製節點後選取目標 Directory，**When** 執行貼上（`POST /api/nodes/{sourceId}/copy?targetDirId={id}`），**Then** 目標目錄下新增深複製的節點（包含所有子節點），若名稱衝突則自動加上 `_copy` 後綴，回傳新建節點的 ID 與最終名稱。
2. **Given** 複製一個 Directory（含子節點），**When** 貼上，**Then** 所有子節點也一起複製（遞迴深複製）。

---

#### US-004：排序目錄的子節點

| 欄位     | 內容             |
| -------- | ---------------- |
| 編號     | US-004           |
| 標題     | 對目錄子節點排序 |
| 對應功能 | F-002            |
| 優先級   | P0               |

**描述**

- **角色**：作為使用者
- **需求**：我想要對某個 Directory 的子節點依名稱或大小排序
- **目的**：以便在大量節點時快速找到目標

**驗收標準**

1. **Given** 目錄下有多個子節點，**When** 呼叫 `PATCH /api/nodes/{dirId}/sort?strategy=name_asc`，**Then** 資料庫中該目錄的子節點順序更新，回傳排序後的子節點清單。
2. 支援策略：`name_asc`、`name_desc`、`size_asc`、`size_desc`。

---

#### US-005：標籤 CRUD

| 欄位     | 內容                 |
| -------- | -------------------- |
| 編號     | US-005               |
| 標題     | 建立、查詢、刪除標籤 |
| 對應功能 | F-004                |
| 優先級   | P0                   |

**描述**

- **角色**：作為使用者
- **需求**：我想要建立自訂標籤（名稱 + 顏色）並列出所有標籤
- **目的**：以便標記特定節點，便於分類與搜尋

**驗收標準**

1. **Given** 使用者輸入標籤名稱與顏色，**When** 呼叫 `POST /api/labels`，**Then** 新標籤存入資料庫並回傳含 `id`、`name`、`color`、`description`、`createdAt` 的物件。
2. **Given** 已有多個標籤，**When** 呼叫 `GET /api/labels`，**Then** 回傳所有標籤陣列。
3. **Given** 同名標籤已存在，**When** 再次建立同名標籤，**Then** 回傳既有標籤（Flyweight 語義，不重複建立），HTTP 200。
4. **Given** 標籤有節點關聯，**When** 刪除標籤，**Then** 一併移除所有節點的該標籤關聯，HTTP 204。

---

#### US-006：節點標籤關聯管理

| 欄位     | 內容                 |
| -------- | -------------------- |
| 編號     | US-006               |
| 標題     | 為節點新增或移除標籤 |
| 對應功能 | F-005                |
| 優先級   | P0                   |

**描述**

- **角色**：作為使用者
- **需求**：我想要為特定節點（File 或 Directory）貼上標籤，或移除已貼的標籤
- **目的**：以便在 LabelPanel 中管理各節點的標籤狀態

**驗收標準**

1. **Given** 節點存在且標籤存在，**When** 呼叫 `POST /api/nodes/{nodeId}/labels/{labelId}`，**Then** 關聯記錄存入資料庫，HTTP 201。
2. **Given** 關聯已存在，**When** 重複新增，**Then** 幂等，HTTP 200（不建立重複記錄）。
3. **Given** 節點有標籤，**When** 呼叫 `DELETE /api/nodes/{nodeId}/labels/{labelId}`，**Then** 關聯移除，HTTP 204。
4. **Given** 節點存在，**When** 呼叫 `GET /api/nodes/{nodeId}/labels`，**Then** 回傳該節點的所有標籤陣列。

---

#### US-007：前端整合 — 資料來源改為 API

| 欄位     | 內容                               |
| -------- | ---------------------------------- |
| 編號     | US-007                             |
| 標題     | 前端移除 in-memory，改呼叫後端 API |
| 對應功能 | F-006                              |
| 優先級   | P0                                 |

**描述**

- **角色**：作為開發者
- **需求**：前端 `FileSystemFacade` 改為非同步 API 呼叫，移除 `sampleData.ts` 作為初始資料來源
- **目的**：以便前後端真正整合，資料跨越頁面重整得以保存

**驗收標準**

1. **Given** 後端服務啟動，**When** 使用者開啟前端，**Then** 頁面顯示的檔案樹來自後端 API，非 hardcoded `sampleData.ts`。
2. **Given** 使用者執行任何 CRUD 操作，**When** 重新整理頁面，**Then** 操作結果保留（持久化成功）。
3. **Given** 後端服務未啟動，**When** 使用者開啟前端，**Then** 顯示明確的錯誤訊息（「無法連接到伺服器」），不崩潰。

**附註**

- `FileSystemFacade` 的公共介面（方法簽名）保持不變，僅內部改為 `async/await` + fetch 呼叫。
- Undo/Redo 歷程維持前端記憶體狀態（不持久化），頁面重整後清空。

---

## 5. 非功能需求

### 5.1 效能需求

| 項目     | 需求描述                                              |
| -------- | ----------------------------------------------------- |
| 回應時間 | 單一節點 CRUD API P95 ≤ 200ms（本機 SQLite）          |
| 樹狀查詢 | `GET /api/nodes/tree`（≤ 500 節點）P95 ≤ 300ms        |
| 並發     | 支援 10 個並發請求，不產生資料競爭（SQLite WAL mode） |

### 5.2 安全需求

| 項目     | 需求描述                                                       |
| -------- | -------------------------------------------------------------- |
| 輸入驗證 | 所有 API 輸入透過 Pydantic Schema 驗證，拒絕無效型別與超長字串 |
| SQL 注入 | 使用 SQLAlchemy ORM 參數化查詢，禁止裸 SQL 字串拼接            |
| 跨域設定 | FastAPI CORS 僅允許前端開發伺服器 `http://localhost:5173`      |
| 敏感設定 | DB 路徑、CORS origin 透過 wecpy ConfigManager 管理，不硬編碼   |

### 5.3 可維護性需求

| 項目       | 需求描述                                               |
| ---------- | ------------------------------------------------------ |
| 測試覆蓋率 | 後端 pytest 覆蓋率 ≥ 80%                               |
| 分層架構   | Router → Service → Repository（DAO）→ SQLAlchemy Model |
| 日誌       | wecpy LogManager 記錄所有 API 請求與錯誤               |
| 設定管理   | `PROD/config.yaml` + `PILOT/config.yaml` 雙環境支援    |

### 5.4 相容性需求

| 項目     | 需求描述                                   |
| -------- | ------------------------------------------ |
| 瀏覽器   | 與前端現有需求相同（Chrome 120+）          |
| 作業系統 | Windows（開發環境），Linux（部署可行即可） |
| Python   | 3.10+                                      |

---

## 6. 範圍界定

### 6.1 In Scope（本次實作範圍）

- 後端 FastAPI 專案初始化（wecpy + SQLite + SQLAlchemy）
- 檔案樹節點 API：`GET /api/nodes/tree`、`POST /api/nodes/directory`、`POST /api/nodes/file`、`DELETE /api/nodes/{id}`、`POST /api/nodes/{id}/copy`、`PATCH /api/nodes/{dirId}/sort`
- 標籤 API：`GET /api/labels`、`POST /api/labels`、`DELETE /api/labels/{id}`
- 節點標籤關聯 API：`GET /api/nodes/{nodeId}/labels`、`POST /api/nodes/{nodeId}/labels/{labelId}`、`DELETE /api/nodes/{nodeId}/labels/{labelId}`
- 統一錯誤回應格式（`{ "error": "...", "code": "..." }`）
- 前端 `FileSystemFacade` 改為非同步 API 呼叫
- 前端移除 `sampleData.ts` 硬編碼初始資料
- 後端 pytest 單元測試 + 整合測試
- 後端 Seed 資料腳本（對應現有 `sampleData.ts` 的初始資料）

### 6.2 Out of Scope（本次不包含）

- 使用者認證 / 登入機制（無 JWT / Session）
- 檔案實際二進位內容的上傳 / 下載（本系統為虛擬節點，無真實檔案 I/O）
- Undo/Redo 歷程持久化（維持前端記憶體狀態）
- 即時同步（WebSocket）
- PostgreSQL / MySQL 遷移（可未來擴展）
- 前端 E2E 自動化測試（Cypress / Playwright）
- 部署至正式環境（Docker / CI/CD）— 此為另一需求

---

## 7. 系統架構概覽（供 Architect 參考）

```
frontend/                         backend/
React + TypeScript                Python FastAPI + wecpy
  └── FileSystemFacade (async)
        │  HTTP/JSON
        ▼
  FastAPI Routers
    ├── /api/nodes
    └── /api/labels
        │
  Service Layer
    ├── NodeService
    └── LabelService
        │
  Repository Layer
    ├── NodeRepository
    └── LabelRepository
        │
  SQLAlchemy ORM
        │
  SQLite (.db file)
```

**目錄結構（後端）**：

```
backend/
├── PROD/config.yaml
├── PILOT/config.yaml
├── app/
│   ├── main.py                  # FastAPI app 入口
│   ├── database.py              # SQLAlchemy engine + session
│   ├── models/                  # ORM Models
│   │   ├── node.py               # NodeModel（多型）
│   │   └── label.py              # LabelModel + NodeLabelModel
│   ├── schemas/                 # Pydantic Schemas（Request/Response）
│   │   ├── node.py
│   │   └── label.py
│   ├── repositories/            # DAO 層
│   │   ├── node_repository.py
│   │   └── label_repository.py
│   ├── services/                # 業務邏輯層
│   │   ├── node_service.py
│   │   └── label_service.py
│   └── routers/                 # FastAPI Router
│       ├── nodes.py
│       └── labels.py
├── seed.py                      # 初始化 sampleData 對應的 Seed 腳本
├── requirements.txt
└── tests/
    ├── unit/
    └── integration/
```

---

## 8. 資料模型（ERD 概念）

```
NodeRecord
├── id         TEXT PK（UUID）
├── type       TEXT（directory/text_file/word_document/image_file）
├── name       TEXT
├── parent_id  TEXT FK → NodeRecord.id（nullable，根節點為 NULL）
├── sort_order INTEGER（子節點在父目錄中的排序）
├── size_kb    REAL（File 類型才有值）
└── created_at DATETIME（File 類型才有值）

LabelRecord
├── id          TEXT PK（UUID）
├── name        TEXT UNIQUE
├── color       TEXT
├── description TEXT
└── created_at  DATETIME

NodeLabelRecord（關聯表）
├── node_id    TEXT FK → NodeRecord.id
└── label_id   TEXT FK → LabelRecord.id
```

---

## 9. API 快速參考

| Method | Path                                    | 說明               |
| ------ | --------------------------------------- | ------------------ |
| GET    | `/api/nodes/tree`                       | 取得完整檔案樹     |
| POST   | `/api/nodes/directory`                  | 新增目錄           |
| POST   | `/api/nodes/file`                       | 新增檔案節點       |
| DELETE | `/api/nodes/{id}`                       | 刪除節點（遞迴）   |
| POST   | `/api/nodes/{id}/copy?targetDirId={id}` | 複製節點至目標目錄 |
| PATCH  | `/api/nodes/{dirId}/sort`               | 排序目錄子節點     |
| GET    | `/api/labels`                           | 取得所有標籤       |
| POST   | `/api/labels`                           | 建立標籤           |
| DELETE | `/api/labels/{id}`                      | 刪除標籤           |
| GET    | `/api/nodes/{nodeId}/labels`            | 取得節點的所有標籤 |
| POST   | `/api/nodes/{nodeId}/labels/{labelId}`  | 為節點貼上標籤     |
| DELETE | `/api/nodes/{nodeId}/labels/{labelId}`  | 移除節點的標籤     |

---

_品質自檢：_

- [x] 每個 User Story 都有 Given-When-Then 驗收標準
- [x] 功能需求都有優先級標注（P0/P1）
- [x] 非功能需求有量化指標
- [x] In Scope / Out of Scope 已明確劃分
- [x] 技術棧已確認（Python 3.10+ / FastAPI / wecpy / SQLite）
- [x] 資料模型（ERD）已定義
- [x] API 端點清單已列出
