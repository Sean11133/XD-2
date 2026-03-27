---
applyTo: "**/*.py"
---

# GitHub Copilot 指示 - wecpy 框架

## 優先指導原則

當為此儲存庫產生程式碼時：

1. **版本相容性**：總是檢測並遵循專案中使用的語言、框架和函式庫的確切版本
2. **程式碼庫模式**：掃描現有程式碼庫中確立的模式和標準
3. **架構一致性**：維護 wecpy 企業級框架的分層架構和確立的邊界
4. **程式碼品質**：在所有產生的程式碼中優先考慮可維護性、效能、安全性和可測試性
5. **wecpy 特定規範**：嚴格遵循 wecpy 框架的初始化順序和設計模式
6. **wecpy 套件使用規範**: 嚴格遵循參考官方文件後才提供建議
7. **SOLID 原則**：所有新增類別與模組必須符合 SOLID 五大原則
8. **設計模式**：優先採用 wecpy 框架既有模式；引入新模式前須確認與框架架構相容

## 外部整合服務

wecpy 框架已整合多種企業級服務，各有專屬 manager：

- **資料庫**：Oracle、Trino、SQL Server
- **訊息佇列**：Kafka (BaseKafkaListener、WecApplication、WecTransport)
- **檔案傳輸**：FTP、ObjectStorage(CIMS3)
- **搜尋引擎**：ElasticSearch
- **監控服務**：APM
- **企業整合**：COP、通知服務
- **資料處理**：Data Fetcher、Data Cache

## 重要參考範例

wecpy 框架官方範例文件：

- [官方 API 文件](http://pilot-imx/wecpy/api_document.html)
- [Release notes](http://pilot-imx/wecpy/releases/v1.11.1.html)
- [Sample Code Git](http://usergitlab/template/wecpy-sample-code/)

## 參考文件

- **支援團隊**：MK22
- **框架版本**：請參考 requirements.txt 中的版本規範（目前 v1.11.1）
- **開發環境**：Python 3.8-3.10，內部 Nexus 倉庫

## 技術版本檢測

產生程式碼前，掃描程式碼庫以識別：

### Python 版本需求

- **支援版本**：Python >=3.8 <=3.10
- **版本檢測**：檢查 requirements.txt、setup.py、pyproject.toml 中的版本限制
- **框架來源**：內部 Nexus 私有倉庫 (非公有套件)
- **絕不使用**超出檢測到版本的語言功能

### wecpy 框架版本

- **安裝來源**：`pip install --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple --trusted-host=10.18.20.121:8081 wecpy`
- **檢測方法**：掃描 requirements.txt 中的 wecpy 版本規範
- **相容性**：確保產生的程式碼與檢測到的 wecpy 版本相容

### 相依套件版本

- **檢查檔案**：requirements.txt、.env 檔案中的套件版本
- **相容性確保**：產生與這些特定版本相容的程式碼
- **禁止使用**檢測版本中不可用的 API 或功能

## 程式碼庫掃描指示

當內容檔案沒有提供特定指引時：

1. **識別相似檔案**：找到與正在修改或建立的檔案類似的檔案
2. **分析模式**：
   - 命名慣例
   - 程式碼組織
   - 錯誤處理
   - 日誌記錄方法
   - 文件風格
   - 測試模式

3. **遵循一致性模式**：採用程式碼庫中最一致的模式
4. **衝突處理**：當存在衝突模式時，優先選擇較新檔案或測試覆蓋率較高檔案中的模式
5. **模式限制**：絕不引入現有程式碼庫中未發現的模式

## wecpy 框架特定指引

### 強制初始化順序

```python
# 步驟 1：ConfigManager 必須最先匯入和初始化（不可分離）
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

# 步驟 2：其他 wecpy 元件才能匯入
from wecpy.log_manager import LogManager
log = LogManager.get_logger()
```

**關鍵限制**：

- ConfigManager 的 import 和初始化必須為連續的兩行程式碼
- 絕不在這兩行之間插入任何其他程式碼
- 所有其他 wecpy 模組必須在 ConfigManager 初始化之後匯入

### 專案結構模式

每個 wecpy 專案應遵循分層小層之間單向依賴：

```
<project_root>/
├── PROD/config.yaml        # 正式環境設定
├── PILOT/config.yaml       # 測試/驗證環境設定
├── .venv/                  # 專案虛擬環境
├── .env                    # 環境變數檔案
├── requirements.txt        # 相依套件清單
├── models/                 # 資料模型（Value Object / DTO）
├── daos/                   # 資料存取物件（Repository Pattern）
├── services/               # 業務邏輯（可選；業務密集時實作）
├── main.py                 # 主要應用程式進入點
├── tests/                  # 測試腳本（命名為 *_test.py）
└── .github/                # AI/CI/CD 設定
```

**層次責任與依賴規則**：

| 層次   | 目錄           | 責任                  | 對應設計模式        |
| ------ | -------------- | --------------------- | ------------------- |
| 入口層 | `main.py`      | 初始化、組裝單元      | —                   |
| 業務層 | `services/`    | 封裝業務流程          | Facade / Service    |
| 儲存層 | `daos/`        | 資料存取與映射        | Repository          |
| 模型層 | `models/`      | 資料結構              | Value Object / DTO  |
| 基礎層 | wecpy Managers | 框架經由 manager 提供 | Factory / Singleton |

- `models/` 不依賴 DAO，不依賴 Manager
- `daos/` 專用 wecpy DatabaseManager，**不包含業務邏輯**
- `services/`（若有）依賴 DAO 接口而非具體實作，便於測試替換
- `main.py` 僅負責初始化與組裝單元，不包含業務邏輯

### 組態檔案模式

遵循程式碼庫中現有的 YAML 組態格式。`PROD/` 與 `PILOT/` 結構完全相同，僅值不同。
憑證一律使用 `"{ENV_VAR}"` 佔位符注入，**禁止明文寫入**：

```yaml
General:
  app: MY_APP # 對應 IMX_APP 環境變數
  system: MY_SYSTEM # 對應 IMX_SYSTEM 環境變數
  app_type: Scheduler # 僅允許 Scheduler | Listener | Web
  section: MK22 # 必填：部門代碼

Database:
  # Oracle 範例
  mydb:
    type: oracle
    host: db-host.example.com
    port: 1521
    username: "{IMX_UDB_ID}"
    password: "{IMX_UDB_PWD}"
    service: MYSERVICE
  # Trino 範例
  edwml2:
    type: trino
    host: edwml2
    port: 18081
    catalog: udpdb
    username: "{IMX_EDWML2_ID}"
    password: "{IMX_EDWML2_PWD}"
  # SQL Server 範例
  portal:
    type: sqlserver
    host: sqlhost.example.com
    port: 1433
    username: "{IMX_SS_ID}"
    password: "{IMX_SS_PWD}"
    service: MyDB

Log:
  version: 1
  formatters:
    format1:
      format: "[%(asctime)s.%(msecs)03d] {%(system)s %(app)s %(filename)s: %(funcName)s:%(lineno)d} %(levelname)s %(tid)s - %(message)s"
      datefmt: "%Y-%m-%d %H:%M:%S"
  handlers:
    file:
      class: logging.handlers.RotatingFileHandler
      formatter: format1
      filename: log/app.log
      maxBytes: 20000000
      backupCount: 10
    console:
      class: logging.StreamHandler
      formatter: format1
      stream: ext://sys.stdout
  root:
    handlers: [file, console]
    level: DEBUG

# --- 以下為可選區塊，按需求加入 ---

Kafka: # Listener / Producer 才需要
  my_listener:
    topic: "MY-TOPIC"
    group.id: "MY-CONSUMER-GROUP"
    bootstrap.servers: kafka1:9092,kafka2:9092
    session.timeout.ms: 60000
    inbox.port.range: 50000-50100
  my_producer:
    topic: "MY-TOPIC"
    bootstrap.servers: kafka1:9092,kafka2:9092
    retries: 0
    linger.ms: 1

APIClient: # 呼叫外部 REST API 才需要
  service_name:
    base_url: "http://service-host:8080"
    timeout: 10
    retry: 3
    wec_pat: "token_env_key" # 或 headers: [{...}]

ObjectStorage: # 使用 MinIO/S3 才需要
  ObjectStorageServer:
    endpoint_url: "{OBJECT_STORAGE_URL}"
    security_id: "{OBJECT_STORAGE_ID}"
    security_key: "{OBJECT_STORAGE_KEY}"

COP: # Prometheus 監控才需要
  pilot:
    host: "http://cop-host:3001"
    section: "MK22"
```

> **注意**：未使用的區塊直接省略；每個環境的 config.yaml 都必須同步填寫。

### 環境變數模式

根據程式碼庫分析，支援以下環境變數：

**核心 IMX\_ 變數**

- `IMX_ENV`：執行環境（PILOT、PROD）
- `IMX_SYSTEM`：系統代碼
- `IMX_APP`：應用程式代碼
- `IMX_APP_TYPE`：應用程式類型
- `IMX_APP_OWNER`：USER ID
- `IMX_UDB_ID`/`IMX_UDB_PWD`：Oracle 資料庫認證
- `IMX_EDWML2_ID`/`IMX_EDWML2_PWD`：Trino 資料庫認證

**v1.11.1 新增服務端點變數**

| 環境變數                   | 用途                  |
| -------------------------- | --------------------- |
| `APP_RECORDER_URL`         | ELK Recorder 端點     |
| `APP_STORER_URL`           | S3 Storer 端點        |
| `APP_CACHER_URL`           | Redis Cacher 端點     |
| `APP_FETCHER_URL`          | DataFetcher 端點      |
| `APP_IFDC_DATAFETCHER_URL` | IFDC DataFetcher 端點 |
| `APP_IEDA_DATAFETCHER_URL` | IEDA DataFetcher 端點 |

**URL 解析層級**：明確傳入 URL > ENV var > IMX_ENV 預設（PILOT → `pilot-imx:443`， PROD → `imx-infra:443`）

變數命名規則：以 `IMX_` 開頭，或 `APP_` 開頭（如 `APP_START_DATE`）

## SOLID 原則指導

### S — Single Responsibility Principle

- 每個類別僅負責一件事：`*DAO` 僅負責資料存取，業務邏輯不入 DAO
- 每個函式僅做一件事；適當利用 `log_key` 標記操作目的

### O — Open/Closed Principle

- 新增 ETL 任務請繼承 `BaseETL` 而非修改現有實作
- 新增 Kafka handler 請覆寫 `on_message()`，不修改 `BaseKafkaListener`

### L — Liskov Substitution Principle

- 子類必須完整實作父類定義的所有抽象方法
- `BaseETL` 子類不得跳過 `purge → extract → transform → load` 中任一階段

### I — Interface Segregation Principle

- 設計細粒度接口，避免將不相關的行為合並到同一區塊
- **DAO 接口只暴露其層需要的方法**，不輸出內部完整对相象

### D — Dependency Inversion Principle

- Manager 透過建構元注入，便於單元測試時替換為模擬實作
- 分離業務邏輯與 wecpy manager，透過傳入參數而非直接內部建立

---

## wecpy 框架內建設計模式

wecpy 內各模組已採用以下模式，撰寫專案程式碼時應遵循同樣結構：

| 模組                 | 模式                         | 實際用法                                                     |
| -------------------- | ---------------------------- | ------------------------------------------------------------ |
| ConfigManager        | **Singleton**                | `ConfigManager('config.yaml')` 初始化後全局可用              |
| LogManager           | **Singleton + contextvars**  | tid 隔離邏輯不影響主程式                                     |
| DatabaseManager      | **Abstract Factory**         | `OracleManager` / `TrinoManager` / `SQLServerManager` 可互換 |
| WecEncryption        | **Singleton (get_instance)** | `WecEncryption.get_instance().encrypt()`                     |
| BaseKafkaListener    | **Template Method**          | 子類實作 `on_message()`，生命週期由父類控制                  |
| BaseETL              | **Template Method**          | `purge → extract → transform → load → run()`                 |
| KafkaTransportImpl   | **Facade**                   | 封裝 send / request-response 庫                              |
| ApiClientManager     | **Adapter**                  | 包裝 HTTP retry / tid propagation                            |
| ElasticsearchManager | **Builder**                  | 逐步組合 Query DSL，最後呼叫 `search()`                      |
| S3BucketManager      | **Facade**                   | 封裝 MinIO/S3 完整 CRUD 生命週期                             |
| WecDoc               | **Value Object**             | XML payload 封裝，不包含業務邏輯                             |
| COPManager           | **Decorator**                | 導入 Prometheus metrics 不侵入業務                           |

### 專案層次模式範例

```python
# Repository Pattern — DAO 層封裝資料存取
class OrderDAO:
    def __init__(self, db: OracleManager):
        self._db = db  # DI: 便於測試 mock

    def find_by_id(self, order_id: str) -> dict | None:
        rows = self._db.query_data(
            "SELECT * FROM orders WHERE id = :id",
            params={"id": order_id}
        )
        return rows[0] if rows else None


# Service Layer — 封裝業務邏輯，依賴接口而非實作
class OrderService:
    def __init__(self, dao: OrderDAO, log):
        self._dao = dao
        self._log = log

    def process(self, order_id: str) -> None:
        order = self._dao.find_by_id(order_id)
        if not order:
            self._log.warning(f"Order not found: {order_id}", log_key="order_not_found")
            return
        # 業務邏輯在此處理
```

---

## 程式碼品質標準

### 可維護性（SRP 對齊）

- 每個類別 / 函式持單一職責
- 遵循程式碼庫中明顯的命名和組織慣例
- 遵循既定模式以保持一致性
- 保持函式專注於單一職責
- 將函式複雜度和長度限制在與現有模式相符的範圍內

### 效能

- 遵循現有的記憶體和資源管理模式
- 符合現有處理計算密集操作的模式
- 遵循非同步操作的既定模式
- 與現有模式一致地應用快取
- 根據程式碼庫中明顯的模式進行最佳化

### 安全性

- 遵循現有的輸入驗證模式
- 應用程式碼庫中使用的相同清理技術
- 使用符合現有模式的參數化查詢（`:param` 樣式）
- 遵循既定的身份驗證和授權模式
- 根據現有模式處理敏感資料；會話結束後即時釋放 DB 連線

### 可測試性（DIP 對齊）

- **Manager 透過建構元注入**，測試時可替換為模擬實作
- 隐離業務邏輯與 I/O：業務邏輯主體可加載純粀資料進行單元測試
- 參考現有測試中使用的模擬方法
- 遵循既定的測試層離模式

## 文件需求

### 標準文件

- 遵循程式碼庫中發現的確切文件格式
- 符合現有註解的風格和完整性
- 以相同風格記錄參數、返回值和例外
- 遵循現有的使用範例模式
- 符合類別級文件風格和內容

## 測試方法

### 單元測試

- 符合現有單元測試的確切結構和風格
- 遵循測試類別和方法的相同命名慣例
- 使用現有測試中發現的相同斷言模式
- 應用程式碼庫中使用的相同模擬方法
- 遵循現有的測試隔離模式

### wecpy 測試特定模式

- **測試檔案命名**：`*_test.py`
- **執行環境**：必須在專案 .venv 虛擬環境下執行
- **初始化模式**：測試中也必須遵循 ConfigManager 初始化順序

```python
# 測試檔案標準初始化
import unittest
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')
from wecpy.log_manager import LogManager

class TestExample(unittest.TestCase):
    def setUp(self):
        self.log = LogManager.get_logger()

    # 測試方法...
```

## wecpy 特定技術指引

### 核心架構原則

- **Manager 模組化設計**：每個功能領域有專屬的 manager（需參考官方文件）
- **初始化順序**：ConfigManager 必須最先初始化，其他 manager 依序載入
- **資料傳遞**：跨元件使用 WecDoc 物件，一般元件間可使用標準 Python 物件
- **層次分離**：層不得反向依賴；`models` 不依賴 DAO，DAO 不包含業務邏輯
- **例外處理**：統一使用 wecpy 自訂例外（如 WecException）

### 基本使用模式

```python
# 標準初始化模式
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')
from wecpy.log_manager import LogManager
log = LogManager.get_logger()
```

## 實務範例與模式

### 標準專案初始化模式

```python
"""
wecpy 應用程式標準初始化模式
必須嚴格遵循此順序
"""
# 步驟 1：ConfigManager 必須最先執行（不可分離）
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

# 步驟 2：其他 wecpy 元件匯入
from wecpy.log_manager import LogManager
log = LogManager.get_logger()

# 步驟 3：應用程式邏輯
def main():
    try:
        log.info("應用程式啟動", log_key="startup")
        # TODO: 實作業務邏輯

    except Exception as e:
        log.error(f"應用程式錯誤: {str(e)}", log_key="error")
        raise

if __name__ == "__main__":
    main()
```

### ConfigManager 基本使用

```python
# 載入設定檔（必須連續兩行）
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

# 取得基本設定
general = ConfigManager.general
env = ConfigManager.ENV
print(env.IMX_ENV)      # PILOT 或 PROD
```

**註**：詳細的組態管理使用方式請參考 ConfigManager 專屬指示檔案。

## 一般最佳實務

### 程式碼組織原則

- 遵循程式碼庫中現有的命名慣例
- 符合類似檔案的程式碼組織模式
- 應用與現有模式一致的錯誤處理
- 遵循既定的測試方法
- 符合現有程式碼的日誌記錄模式

### 開發工作流程

- **虛擬環境**：必須在 .venv 環境下開發和執行
- **相依管理**：使用 requirements.txt，執行 `pip install -r requirements.txt`
- **測試執行**：測試檔案命名為 `*_test.py`，在 venv 下執行
- **組態管理**：依環境使用 PROD/config.yaml、PILOT/config.yaml
- **敏感資訊**：使用 .env 或環境變數，勿硬編於程式碼

### wecpy 開發規範

- 絕對遵循 ConfigManager 初始化順序
- 所有程式碼必須以標準 Python 文字格式提供
- 提供完整可執行的程式碼片段
- 優先考慮與現有程式碼的一致性
- 掃描程式碼庫後再產生任何程式碼
- 當需要有設定時，每個環境的config.yaml都必須填寫

**註**：具體各元件的詳細開發規範請參考對應的元件指示檔案。

## 版本控制指引

- 遵循程式碼庫中應用的版本控制模式
- 符合現有記錄變更的模式
- 遵循相同的標籤慣例
