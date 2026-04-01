---
name: wecpy-core
description: >
  Invoke for wecpy project initialization, ConfigManager, LogManager, or any foundational framework question.
  Covers: ConfigManager (config.yaml loading, env auto-switch, General/Log/custom blocks),
  LogManager (get_logger, set_tid, log_key), project structure, environment variables (IMX_ENV/IMX_SYSTEM/IMX_APP),
  SecurityService (JWT/AES), DataCacheManager (gRPC cache with TTL), BaseETL, IMXAppContext, Converter utilities.
  Keywords: wecpy、IMX 框架、ConfigManager、LogManager、config.yaml、專案初始化、環境變數、
  PILOT/PROD、wecpy 入門、wecpy 教學、wecpy 怎麼用、logging、log 設定、SecurityService、DataCacheManager。
  Excludes DB→wecpy-database, Kafka→wecpy-kafka, FTP/S3/API→wecpy-io, APM/COP/ES→wecpy-monitoring,
  FDC→wecpy-fdc/wecpy-datafetcher.
---

# wecpy 核心技能

wecpy 是 Winbond Electronics Corporation 內部專用的 Python 企業應用框架，提供統一的組態管理、日誌、資料庫、訊息佇列、監控等企業級功能。

## 環境需求

- **Python 版本**：3.10 ~ 3.14
- **安裝來源**：內部 Nexus 私有倉庫

```bash
pip install --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple \
    --trusted-host=10.18.20.121 wecpy
```

## ⚠️ 強制初始化規範

這是 wecpy 框架最重要的規則，**必須嚴格遵守**：

```python
# ✅ 正確：ConfigManager 的 import 和初始化必須連續兩行
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

# 之後才能匯入其他 wecpy 元件
from wecpy.log_manager import LogManager
log = LogManager.get_logger()
```

```python
# ❌ 錯誤：中間插入其他程式碼
from wecpy.config_manager import ConfigManager
import os  # 禁止！
ConfigManager('config.yaml')
```

```python
# ❌ 錯誤：先匯入其他 wecpy 模組
from wecpy.log_manager import LogManager  # 禁止！
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')
```

## 專案標準結構

```
<workspace>/
├── PROD/
│   └── config.yaml         # 正式環境設定
├── PILOT/
│   └── config.yaml         # 測試環境設定
├── .env                    # 環境變數（勿納入版控）
├── .gitignore              # Git 排除設定
├── requirements.txt        # 相依套件清單
├── main.py                 # 主程式進入點
├── log/                    # 日誌輸出目錄
└── src/                    # 程式碼目錄
    ├── __init__.py
    ├── models/             # SQLAlchemy 資料模型
    │   └── __init__.py
    ├── daos/               # 資料存取物件
    │   └── __init__.py
    ├── services/           # 業務邏輯層
    │   └── __init__.py
    └── tests/              # 測試檔案（*_test.py）
        └── __init__.py
```

## config.yaml 基礎格式

每個 wecpy 專案**必須**包含 `General` 和 `Log` 區塊：

```yaml
General:
  system: "{IMX_SYSTEM}"           # 系統代碼，從環境變數讀取
  app: "{IMX_APP}"                 # 應用程式代碼
  app_type: Schedule               # Schedule | Listener | Web
  section: MK10                    # 部門代碼

Log:
  version: 1
  formatters:
    format1:
      format: "[%(asctime)s.%(msecs)03d] {%(system)s %(app)s %(filename)s: %(funcName)s:%(lineno)d} %(levelname)s %(tid)s - %(message)s"
      datefmt: '%Y-%m-%d %H:%M:%S'
  handlers:
    console:
      class: logging.StreamHandler
      formatter: format1
      stream: ext://sys.stdout
    file:
      class: logging.handlers.RotatingFileHandler
      formatter: format1
      filename: log/app.log
      maxBytes: 10000000
      backupCount: 5
  root:
    handlers: [console, file]
    level: INFO                    # PILOT 用 DEBUG，PROD 用 INFO
```

## 環境變數規範

| 變數名稱 | 說明 | 範例 |
|---------|------|------|
| `IMX_ENV` | 執行環境 | PILOT, PROD |
| `IMX_SYSTEM` | 系統代碼 | IRS, IANALYSIS |
| `IMX_APP` | 應用程式代碼 | MODEL_MONITOR |
| `IMX_APP_TYPE` | 應用類型 | Schedule, Listener, Web |
| `IMX_APP_OWNER` | 負責人 User ID | - |

資料庫認證變數：
- `IMX_UDB_ID` / `IMX_UDB_PWD`：Oracle
- `IMX_EDWML2_ID` / `IMX_EDWML2_PWD`：Trino
- 其他：依 config.yaml 中 `{變數名}` 定義

## ConfigManager 使用

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

# 取得 General 設定
print(ConfigManager.general.system)      # 系統代碼
print(ConfigManager.general.app)         # 應用程式代碼
print(ConfigManager.general.app_type)    # 應用類型

# 取得環境變數
print(ConfigManager.ENV.IMX_ENV)         # PILOT 或 PROD

# 取得共享路徑
file_path = ConfigManager.get_path(
    ConfigManager.ENV.IMX_WECTINFO02_HOST,
    "MK20/MK22/data.csv"
)
```

## LogManager 使用

```python
from wecpy.log_manager import LogManager
log = LogManager.get_logger()

# 基本日誌
log.info("應用程式啟動")
log.debug("除錯訊息")
log.warning("警告訊息")
log.error("錯誤訊息")

# 帶 log_key 的日誌（便於 APM 追蹤）
log.info("處理完成", "process_complete")
log.error(f"處理失敗: {error}", "process_error")
```

**禁止事項**：
- ❌ 禁止使用 `print()`，一律用 `log.info/debug/error`
- ❌ 禁止在 ConfigManager 初始化前使用 LogManager

## 核心模組速查表

| 功能領域 | 元件 | 說明 |
|---------|------|------|
| 安全性 | JwtHelper, AesHelper, SecurityService | JWT 解析、AES 加解密、使用者安全上下文 |
| SSL 憑證 | IMXUserContext | SSL 憑證取得與快取（每日更新）、gRPC 安全通道建立 |
| 分散式快取 | DataCacheManager | 透過 gRPC 連線遠端快取服務，支援 TTL 和命名空間 |
| ETL 基礎 | BaseETL | ETL 抽象基類（purge → extract → transform → load） |
| 應用程式上下文 | IMXAppContext | 快取存取、當前使用者識別 |
| 轉換工具 | Converter | Protobuf/Timestamp 轉換、DataFrame 轉換 |
| ConfigManager 工具 | get_config_dict, get_exe_env, root_path | 載入任意 YAML/JSON、取得環境、取得根路徑 |

## wecpy 元件速查表

| 功能領域 | 元件 | 技能 | 觸發關鍵字 |
|---------|------|------|-----------|
| 資料庫 | OracleManager, TrinoManager, SQLServerManager | wecpy-database | Oracle, Trino, SQL Server, 資料庫查詢 |
| 訊息佇列 | BaseKafkaListener, WecTransport, WecApplication | wecpy-kafka | Kafka, 訊息, Listener, Producer |
| 監控 | APMManager, COPManager, ElasticsearchManager | wecpy-monitoring | APM, 效能監控, COP 指標, ES |
| 檔案通訊 | FTPManager, S3BucketManager, NotificationManger, ApiClientManager | wecpy-io | FTP, S3, 通知, API 呼叫 |
| 工廠資料 | FetcherFactory + ifdc/ieda_datafetcher | wecpy-datafetcher | FDC, EDA, Data Fetcher, 工廠資料 |

## 詳細參考文件

- [專案初始化完整指南](references/project-init.md) — 當使用者要建立新 wecpy 專案、產生完整專案目錄結構時閱讀
- [ConfigManager 詳細說明](references/config-manager.md) — 當使用者需要進階 config.yaml 設定、動態取值、路徑管理時閱讀
- [LogManager 詳細說明](references/log-manager.md) — 當使用者需要自訂日誌格式、多 handler、log rotation 設定時閱讀
- [環境變數完整清單](references/env-variables.md) — 當使用者詢問特定環境變數名稱、用途或設定方式時閱讀
- [Security 模組（JwtHelper, AesHelper, SecurityService）](references/security.md) — 當使用者需要 JWT 解析、AES 加解密、安全上下文時閱讀
- [DataCacheManager（分散式快取）](references/data-cache.md) — 當使用者需要 gRPC 遠端快取、TTL 設定、命名空間管理時閱讀
- [BaseETL（ETL 基礎抽象類）](references/base-etl.md) — 當使用者需要建立 ETL 流程、繼承 BaseETL 抽象類時閱讀
- [IMXAppContext / IMXUserContext（應用程式/使用者上下文）](references/app-context.md) — 當使用者需要存取快取或取得當前使用者資訊時閱讀
- [Converter（Protobuf/時間戳轉換工具）](references/converter.md) — 當使用者需要 Protobuf 轉 DataFrame 或時間戳轉換時閱讀

## 資源檔案

- [基礎 config.yaml 模板](assets/base-config.yaml)
- [main.py 程式模板](assets/main-template.py)
- [.gitignore 模板](assets/gitignore-template.txt)
- [requirements.txt 模板](assets/requirements-template.txt)
- [.env 範例](assets/env-template.txt)
