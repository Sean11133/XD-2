---
name: wecpy-refactor
description: >
  Invoke when refactoring legacy projects to wecpy framework or converting POC/prototype/MVP to production OOP architecture.
  Covers: Architecture audit, characterization tests, slice-by-slice refactoring (Strangler Fig),
  Model/DAO/Service layering, wecpy component integration order, notebook→project conversion.
  Keywords: 重構、舊專案、改架構、migrate、legacy、技術債、code modernization、POC 轉正式、
  prototype 上線、MVP 改架構、script 整理、notebook 轉專案、散亂 script、OOP 架構、架構盤點。
  Excludes single-component usage (DB→wecpy-database, FDC→wecpy-fdc, etc.) — this skill is for whole-project restructuring.
---

# wecpy 專案重構遷移技能

將既有 Python 專案（包含 POC / prototype / 散亂 script）以漸進式方式重構遷移至 wecpy 框架標準 OOP 架構。

> **核心原則**：先保住行為，再改架構，最後優化效能。每一步都可驗證、可回退。

## 建議搭配的工作流程 Skill

重構是高風險操作，建議搭配以下 skill 確保品質：

| 時機 | 觸發 Skill | 目的 |
|------|-----------|------|
| **開始重構前** | `brainstorming` | 討論重構範圍、策略選擇、目標架構確認 |
| **Phase 1 盤點完成後** | `writing-plans` | 將盤點結果轉成可執行的重構計畫，拆成小步驟 |
| **每個 slice 重構後** | `verification-before-completion` | 跑測試、確認行為不變，有證據才往下一步 |
| **重構完一輪後** | `requesting-code-review` | 請 code reviewer 檢查有無遺漏或回歸問題 |

> 這不是必須的流程，但重構工作量大時，這些 skill 能幫你降低風險、避免一次改太多。

## 適用情境

- 舊 AI/ML 專案要套用 wecpy 框架
- **POC / prototype / MVP 要轉成正式架構**（Jupyter notebook → 標準專案、single script → OOP 分層）
- 散亂的 script 要整理成標準專案結構
- 既有系統要導入 wecpy 的 ConfigManager、LogManager、DatabaseManager 等標準元件
- 架構混亂需要重整（God file、高耦合、無分層）
- 效能瓶頸需要量測與優化

## ⚠️ Agent 使用邊界

### 適合交給 Agent 做

- 掃描專案結構、畫依賴圖、找 code smell
- 產出架構盤點報告與重構計畫
- 補 characterization test / golden test
- 抽 interface、拆 function、搬 module
- 將 print → LogManager、raw config → ConfigManager 等標準化替換
- 加 profiling / benchmark code
- 小步重構後解釋差異

### 不要讓 Agent 直接做

- 一次改整個架構（必須 slice-by-slice）
- 沒有測試就大量搬移 / rename
- 同時做架構重構 + 效能優化
- 碰關鍵業務規則但沒有 golden test
- 決定目標架構（Agent 提案，人決策）

---

## POC / Prototype 專案的特殊處理

POC 專案和舊系統的重構有不同的挑戰。如果專案符合以下特徵，優先使用這個流程：

### POC 專案特徵辨識

- 單一 `.py` 檔案或少數 script（沒有目錄結構）
- Jupyter notebook (`.ipynb`) 作為主要開發環境
- 硬編碼路徑、credentials、magic numbers
- 沒有任何測試
- 沒有 config 檔案（設定散落在 code 裡）
- 大量 `print()` debug，沒有 logging
- 所有邏輯混在一起（資料取得 + 業務邏輯 + 輸出 全部在同一個函式/cell）

### POC 重構策略（由簡到繁）

POC 重構比舊系統簡單，因為通常 code 量較少、沒有歷史包袱。建議用 **策略 A（先建基礎設施）**：

```
Step 1: 建立 wecpy 標準專案結構（目錄骨架 + config.yaml + .env）
Step 2: 如果是 notebook → 先轉成 .py 檔（提取 cell 為函式）
Step 3: 識別程式碼中的三種職責：資料存取 / 業務邏輯 / 輸出
Step 4: 按 OOP 分層拆到 models/ + daos/ + services/
Step 5: main.py 組裝 DAO → Service → 執行
Step 6: 替換 wecpy 元件（ConfigManager → LogManager → DB → ...）
Step 7: 補基本測試
```

### Notebook 轉 .py 的注意事項

- 每個 notebook cell 通常對應一個函式或一個步驟
- 全域變數 → 函式參數或 class attribute
- `display()` / `plt.show()` → 依需求決定保留或移除
- notebook 的「上面跑過的 cell 結果」隱含依賴 → 轉成明確的函式呼叫鏈

---

## Phase 0：目標架構確認

所有重構的最終目標是符合 wecpy 標準專案結構。完整目錄結構參見 [assets/project-structure.txt](assets/project-structure.txt)。結構依 `app_type` 有所差異：

### Schedule 排程任務

```
<project_root>/
├── PROD/config.yaml          # 正式環境設定
├── PILOT/config.yaml         # 測試環境設定
├── .env                      # 環境變數
├── requirements.txt          # 相依套件
├── main.py                   # 進入點（ConfigManager 初始化 + 組裝 + 執行）
├── models/                   # 資料模型（SQLAlchemy Model + dataclass）
├── daos/                     # 資料存取層（封裝 DB/API/FTP/S3/DataFetcher）
├── services/                 # 業務邏輯層（純邏輯，不直接用 wecpy Manager）
├── utils/                    # 共用工具
├── tests/                    # 測試（*_test.py）
│   ├── golden/               # Characterization tests
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
└── log/                      # 日誌輸出
```

### Listener 事件驅動

```
<project_root>/
├── ...                       # 同上 + 以下額外目錄
├── listeners/                # Kafka Listener（繼承 BaseKafkaListener，只管收訊息）
└── handlers/                 # 事件處理器（解析訊息格式 → 路由到 service）
```

### Web API 服務

```
<project_root>/
├── ...                       # 同上 + 以下額外目錄
└── controllers/              # 請求處理（WecApplication callback → 呼叫 service）
```

### 分層依賴方向（嚴格遵守）

```
main.py → services → daos → models
               ↑ 禁止反向依賴
```

- `models/`：純資料定義，不依賴任何其他層
- `daos/`：封裝所有 I/O，使用 wecpy Manager，只依賴 models
- `services/`：純業務邏輯，透過 DAO 操作資料，**不直接使用 wecpy Manager**
- `main.py`：組裝層，建立 DAO → 注入 Service → 執行

> **詳細的 OOP class 設計規範、各層 class 範例、以及三種 app_type 的完整程式碼範例**，請參閱 [OOP 架構設計指南](references/oop-architecture.md)。

### wecpy 元件對應表（重構替換目標）

| 舊專案常見寫法 | 替換為 wecpy 元件 | 所需 Skill |
|--------------|-----------------|-----------|
| `print()` / 自訂 logger | `LogManager` | wecpy-core |
| 硬編碼設定 / 自製 config loader | `ConfigManager` + config.yaml | wecpy-core |
| 原生 cx_Oracle / SQLAlchemy | `OracleManager` / `TrinoManager` | wecpy-database |
| requests / urllib | `ApiClientManager` | wecpy-io |
| paramiko / ftplib | `FTPManager` | wecpy-io |
| boto3 直連 S3 | `S3BucketManager` | wecpy-io |
| smtplib 寄信 | `NotificationManger` | wecpy-io |
| kafka-python | `BaseKafkaListener` / `WecTransport` | wecpy-kafka |
| 自製 APM / 無監控 | `APMManager` + `COPManager` | wecpy-monitoring |
| EDWM + IMPALA SQL 取 FDC/EDA 資料 | `FetcherFactory` + DataFetcher | wecpy-datafetcher |

### ⚡ wecpy Skill 自動觸發規則

重構過程中，遇到以下情境時，**必須讀取對應的 wecpy skill** 以取得正確的實作方式。不要自己猜用法，skill 裡有完整的 API 規範和範例。

| 觸發條件（在舊 code 中發現） | 要讀取的 Skill | 要做的事 |
|---------------------------|--------------|---------|
| `print()` / `logging.getLogger` / 任何自製 logger | **wecpy-core** | 讀取 skill 中的 LogManager 章節，照規範替換 |
| 硬編碼 config / `json.load('config.json')` / 自製 config parser | **wecpy-core** | 讀取 skill 中的 ConfigManager 章節，建立 config.yaml |
| `cx_Oracle` / `sqlalchemy.create_engine` / raw SQL 連線 | **wecpy-database** | 讀取 skill 取得 OracleManager/TrinoManager 正確用法 |
| `requests.get()` / `urllib` / HTTP 呼叫 | **wecpy-io** | 讀取 skill 取得 ApiClientManager 用法 |
| `paramiko` / `ftplib` / FTP 操作 | **wecpy-io** | 讀取 skill 取得 FTPManager 用法 |
| `boto3` / S3 操作 | **wecpy-io** | 讀取 skill 取得 S3BucketManager 用法 |
| `smtplib` / 寄信功能 | **wecpy-io** | 讀取 skill 取得 NotificationManger 用法 |
| `kafka-python` / Kafka consumer/producer | **wecpy-kafka** | 讀取 skill 取得 BaseKafkaListener/WecTransport 用法 |
| 無監控 / 自製 APM | **wecpy-monitoring** | 讀取 skill 取得 APMManager/COPManager 用法 |
| EDWM SQL 取 FDC/EDA 資料 | **wecpy-datafetcher** | 讀取 skill 取得 FetcherFactory 用法 |

> **為什麼要讀 skill 而不是直接改？** 每個 wecpy Manager 都有特定的 config.yaml 格式、初始化順序、必要參數。直接猜測容易出錯（例如 ConfigManager 必須在第一行初始化、APMManager 需要傳 `apm_name`、S3BucketManager 必須傳 `cluster` + `bucket_name`）。讀取 skill 能確保用法正確。

---

## Phase 1：架構盤點（不動 Code）

> **Prompt 範本**：「請先不要改 code，先分析這個專案的架構，產出盤點報告。」

### 盤點清單

Agent 應產出以下分析報告（可使用 [盤點報告模板](assets/refactor-checklist.md) 作為格式參考）：

1. **專案結構總覽**：目錄樹、檔案數量、程式碼行數
2. **進入點識別**：main.py / __main__.py / 排程腳本 / API entry
3. **核心流程追蹤**：列出 3-5 條主要業務 flow 的呼叫鏈
4. **依賴方向分析**：哪些模組依賴哪些、有無 circular dependency
5. **wecpy 差距分析**（Gap Analysis）：
   - 已經用了哪些 wecpy 元件
   - 哪些還在用舊寫法，需要替換
   - 缺少哪些標準結構（config.yaml、models/、daos/ 等）
6. **風險區域標示**：God file、高耦合區、無測試覆蓋區
7. **重構優先順序建議**：先動哪些模組最安全、ROI 最高

### ⚡ 驗證迴圈

Agent 產出盤點報告後，**你必須 review**：
- Agent 是否正確理解了業務流程？
- 有沒有漏掉 runtime dynamic dispatch 或 config-driven routing？
- 依賴圖是否正確？

標註錯誤，讓 Agent 修正後才進入下一階段。

---

## Phase 2：建立保護網

> **Prompt 範本**：「針對最核心的 N 條 use case，設計 characterization tests，先固定目前行為，不要改邏輯。」

### 測試層次（按優先順序）

#### 第一層：Characterization Test（最優先）

固定舊系統「目前的行為」，不管對不對，先記錄下來。

```python
# tests/golden/test_xxx_flow.py
"""
Characterization Test：固定 XXX 流程的現有行為。
目的不是驗證正確性，而是確保重構後行為不變。
"""

def test_xxx_flow_golden_output():
    """記錄目前的 input → output 對應"""
    input_data = load_fixture("xxx_input.json")
    
    # 呼叫舊系統的函式
    result = old_xxx_function(input_data)
    
    # 固定目前的輸出作為 golden file
    expected = load_golden("xxx_expected_output.json")
    assert result == expected, (
        f"行為已改變！\n"
        f"Expected: {expected}\n"
        f"Got: {result}"
    )
```

適用場景：
- 還看不懂全部邏輯
- 業務規則複雜
- 舊 code 很難直接 unit test

#### 第二層：核心業務邏輯 Unit Test

準備拆某個模組時，再補該模組的 unit test：
- 資料驗證邏輯
- Feature engineering / transformation
- 規則引擎 / 閾值判斷
- 計算邏輯

#### 第三層：Integration Test

針對 I/O 邊界：
- DB query 正確性
- API response schema
- 檔案讀寫 / S3 操作
- Kafka 訊息格式

---

## Phase 3：切片式重構（Slice-by-Slice）

> **Prompt 範本**：「以 [X flow] 為範圍，將 [具體目標] 從 [來源] 中抽離，保留原本行為。只動 [X 目錄] 下的檔案，不要改 public interface 的 signature。先提出變更計畫，再逐步修改。」

### Class 設計決策

每個 slice 重構時，需要決定 class 怎麼分配到各層。參閱 [OOP 架構設計指南](references/oop-architecture.md) 的規範：

- 舊 code 裡直接操作 DB 的邏輯 → 拆成 DAO class
- 舊 code 裡的業務判斷 → 拆成 Service class（透過 DAO 注入）
- 舊 code 裡的資料結構 → 拆成 Model（SQLAlchemy）或 dataclass
- Service 不直接使用 wecpy Manager（為了可測試性）
- main.py 負責組裝所有 DAO → 注入 Service → 執行

### 重構順序策略

#### 策略 A：先建基礎設施（推薦起手式）

先把 wecpy 骨架建好，再逐步搬業務邏輯：

```
Step 1: 建立 config.yaml（PILOT/PROD）
Step 2: main.py 加入 ConfigManager 初始化
Step 3: 全專案 print() → LogManager
Step 4: 硬編碼設定 → ConfigManager 讀取
Step 5: 建立 models/ 目錄，定義 SQLAlchemy Model
Step 6: 原生 DB 操作 → OracleManager/TrinoManager
```

這些替換相對安全，因為只是換 infrastructure，不動業務邏輯。

#### 策略 B：沿著業務流程切

挑一條完整 flow（API → Service → DB），從頭到尾重構：

1. Agent 分析該 flow 的呼叫鏈
2. 標出 domain logic / infra logic / glue code
3. 先抽 interface（daos/ 層）
4. 再搬業務邏輯到 services/ 層
5. 跑 characterization test 驗證行為不變

#### 策略 C：Strangler Fig Pattern

舊架構太亂時，不要硬改：

1. 新架構在旁邊建起來（wecpy 標準結構）
2. 新 module 用 wecpy 元件實作
3. 舊流程逐步切換到新 module
4. 舊 module 確認無人呼叫後移除
5. 每個 slice 是一個可獨立 revert 的 commit/PR

### 每個 Slice 的 Checklist

- [ ] 變更範圍明確（列出要動的檔案）
- [ ] Characterization test 存在且通過
- [ ] 重構後所有測試通過
- [ ] 行為沒有偷偷改變
- [ ] 可以獨立 revert（一個 commit/PR）
- [ ] Config / 環境變數沒有 breaking change

---

## Phase 4：wecpy 元件整合

> **重要**：具體的 wecpy Manager 用法（API、config.yaml 格式、初始化方式）不要自己猜，**必須讀取對應的 wecpy skill** 取得正確實作方式。參閱上方「wecpy Skill 自動觸發規則」表格。

### 整合順序（依安全性排序）

依照以下順序整合 wecpy 元件，因為前面的步驟不涉及業務邏輯變更，風險最低：

```
Step 1: ConfigManager（讀取 wecpy-core skill）
        → 建立 config.yaml（PILOT/PROD）
        → main.py 加入 ConfigManager 初始化（必須第一行）
        → 硬編碼設定 → ConfigManager 讀取

Step 2: LogManager（讀取 wecpy-core skill）
        → 全專案 print() / logging.getLogger → LogManager
        → 提示：先 grep 全專案 `print(` 和 `logging.getLogger`，列出清單再逐一替換

Step 3: Database 層（讀取 wecpy-database skill）
        → 原生 DB 連線 → OracleManager / TrinoManager
        → 建立 SQLAlchemy Model（參考 wecpy-database 的 model-patterns.md）
        → 封裝成 DAO class（參考 references/oop-architecture.md）

Step 4: I/O 層（讀取 wecpy-io skill）
        → requests/urllib → ApiClientManager
        → paramiko/ftplib → FTPManager
        → boto3 → S3BucketManager
        → smtplib → NotificationManger

Step 5: Kafka（若有，讀取 wecpy-kafka skill）
        → kafka-python → BaseKafkaListener / WecTransport

Step 6: 監控（讀取 wecpy-monitoring skill）
        → 加入 APMManager transaction tracing
        → 加入 COPManager metrics
```

### OOP 分層重構

在整合 wecpy 元件的同時，依照 OOP 架構重新組織 code：

1. 資料結構 → **models/** （SQLAlchemy Model + dataclass）
2. I/O 操作 → **daos/**（封裝 wecpy Manager）
3. 業務邏輯 → **services/**（純邏輯，透過 DAO 注入）
4. 組裝 → **main.py**（建立 DAO → 注入 Service → 執行）

詳細的 class 設計規範、DAO/Service 範例、DI 模式、以及三種 app_type 的完整程式碼範例，參閱 [OOP 架構設計指南](references/oop-architecture.md)。

---

## Phase 5：效能優化（架構穩定後才做）

> **Prompt 範本**：「不要先優化，先幫我加 profiling，找出最耗時的函式、I/O、查詢，提出最值得先做的 3 個優化點。」

### 步驟

1. **量測先行**：用 APMManager transaction tracing 或 cProfile + py-spy 找 hot path
2. **識別瓶頸類型**：CPU / I/O / DB / Network / Memory
3. **只改 hottest path**：不要全面優化
4. **Before/After benchmark**：每次優化都要有數據對比
5. **常見 wecpy 相關優化**：
   - EDWM SQL → DataFetcher（gRPC，10x 加速）
   - 逐筆 DB insert → `oracle.insert(df, Model)` 批次寫入
   - 同步 API 呼叫 → 評估是否可非同步

### 常見錯誤

- 還沒量測就優化
- 看到 code 醜就以為它慢
- 架構重構和效能優化同時做，無法區分影響

---

## Exit Criteria（何時算完成）

每一輪重構的完成條件：

- [ ] 所有 characterization test 通過
- [ ] 專案結構符合 wecpy 標準
- [ ] ConfigManager / LogManager 已全面導入
- [ ] 無 print()、無硬編碼設定
- [ ] DB 操作已遷移到 wecpy Manager
- [ ] 有基本的 APM / COP 監控
- [ ] config.yaml 有 PILOT / PROD 兩套
- [ ] 可獨立部署與運行

---

## 詳細參考

重構過程中需要查閱具體用法時，讀取對應的資源：

| 需求 | 參考 Skill / Reference | 何時讀取 |
|------|----------------------|---------|
| OOP 分層設計、class 規範、DI 模式 | [OOP 架構設計指南](references/oop-architecture.md) | Phase 3 拆 class 時 |
| ConfigManager / LogManager / 專案結構 | wecpy-core | Phase 4 Step 1-2 |
| Oracle / Trino / SQL Server | wecpy-database | 發現 DB 操作時 |
| FTP / S3 / Email / API 呼叫 | wecpy-io | 發現 I/O 操作時 |
| Kafka Listener / Producer | wecpy-kafka | 發現 Kafka 操作時 |
| APM / COP / Elasticsearch | wecpy-monitoring | Phase 4 Step 6 |
| FDC / EDA Data Fetcher（低階） | wecpy-datafetcher | 發現 EDWM SQL 取 FDC 資料時 |
| FDC Data Fetcher（高階 YAML 驅動） | wecpy-fdc | 使用者提到 FdcClient 時 |
