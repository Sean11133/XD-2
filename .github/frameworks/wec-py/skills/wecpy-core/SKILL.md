---
name: wecpy-core
description: >-
  This skill should be used when the user asks about "ConfigManager 初始化", "config.yaml 讀取",
  "LogManager 日誌記錄 tid", "OracleManager TrinoManager SQLServerManager 資料庫查詢",
  "WecEncryption 加解密", "JwtHelper JWT 解析", "IMXAppContext 取得使用者 get_current_user",
  "GrpcAuthClientInterceptor gRPC 認證", "IMXUserContext SSL 憑證", "Converter protobuf 轉換",
  "BaseModel WebApiInputTemplate WebApiOutputTemplate", "環境變數 IMX_ENV",
  or needs wecpy core modules for configuration, logging, database access, encryption, or authentication.
  (wecpy v1.11.1)
---

# wecpy-core

## 首要原則 — 使用 wecpy，不要重造輪子

> **AI 在實作時，必須優先調用 wecpy 已提供的方法，嚴禁自行重新實作 wecpy 已涵蓋的功能。**

- **禁止**自行實作 YAML/config 讀取邏輯 → 使用 `ConfigManager`
- **禁止**自行設定 Python logging → 使用 `LogManager.get_logger()`
- **禁止**自行建立 DB 連線（cx_Oracle / pyodbc / trino.dbapi）→ 使用 `OracleManager` / `SQLServerManager` / `TrinoManager`
- **禁止**自行實作 AES 加解密 → 使用 `WecEncryption.get_instance()`
- **禁止**自行解析 JWT token → 使用 `JwtHelper.parse_jwt_token()`
- **禁止**自行用 `getpass.getuser()` 取得使用者 → 使用 `IMXAppContext.get_current_user()`
- **禁止**自行用 `requests.get()` 抓 SSL 憑證 → 使用 `IMXUserContext.get_ssl_certificate()`
- **禁止**自行寫 protobuf ↔ datetime 轉換 → 使用 `Converter`

如果需求可以被本 skill 列出的 API 滿足，就必須使用該 API。只有在 wecpy 確實不提供對應功能時，才能自行實作。

## 適用情境

- 專案啟動與設定初始化（config.yaml）
- 日誌管理與追蹤欄位（tid）
- Oracle/Trino/SQL Server 資料庫存取
- 加解密、JWT 解析、gRPC 驗證
- 取得目前執行使用者
- SSL 憑證與 gRPC 連線憑據
- protobuf ↔ datetime/DataFrame 轉換
- 共用模型（BaseModel、WebApiInputTemplate、WebApiOutputTemplate）

## 設計模式

| 模組            | 模式                    | 註記                                        |
| --------------- | ----------------------- | ------------------------------------------- |
| ConfigManager   | Singleton               | 初始化後全局可用                            |
| LogManager      | Singleton + contextvars | tid 隔離輯輯不影響主程式                    |
| DatabaseManager | Abstract Factory        | OracleManager/TrinoManager/SQLServerManager |
| Security        | Utility (Singleton)     | WecEncryption 經由 get_instance() 取得      |
| IMXAppContext   | Static Utility          | 快取 / 目前使用者                           |
| IMXUserContext  | Static Utility          | SSL 憑證 / gRPC credentials                 |
| Converter       | Static Utility          | protobuf ↔ Python 型別轉換                  |

## 強制初始化順序

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.log_manager import LogManager
log = LogManager.get_logger()
```

## API Surface (Anti-Hallucination)

### ConfigManager

- `ConfigManager(config_path: str)`
- `ConfigManager.get_config_dict() -> dict`
- `ConfigManager.root_path() -> str`
- `ConfigManager.get_exe_env() -> str`
- `ConfigManager.get_path(key: str) -> str`
- `ConfigManager.get_config_file_path() -> str`
- `ConfigManager.general` → `GeneralConfig` (system, app, app_type, section)
- `ConfigManager.ENV` → `ENV` 物件，包含所有 IMX*\* / APP*\* 環境變數屬性

### LogManager

- `LogManager.get_logger() -> CustomLogger`
- `LogManager.set_tid(tid: str)`
- `LogManager.log_config`
- Logger methods: `.debug()`, `.info()`, `.warning()`, `.error()`, `.critical()`, `.exception()`

### DatabaseManager

- `OracleManager(name: str)`
- `TrinoManager(name: str)`
- `SQLServerManager(name: str)`
- Shared methods: `query_data(sql, params=None)`, `query_dataframe(sql, params=None)`, `execute_sql(sql, params=None)`, `insert()`, `truncate()`, `delete_all()`
- 注意: 1.7.0+ 支援 prepare statement，使用 `:param` 樣式传入 `params` dict

### Security

- `WecEncryption.get_instance() -> WecEncryption`
- `WecEncryption.encrypt(plain_text: str) -> str`
- `WecEncryption.decrypt(cipher_text: str) -> str`
- `WecEncryption.encrypt_to_byte_array(plain_text: str) -> bytes`
- `WecEncryption.decrypt_byte_array(cipher_bytes: bytes) -> str`
- `JwtHelper.parse_jwt_token(token: str) -> dict`
- `GrpcAuthClientInterceptor`

### IMXAppContext

```python
from wecpy.imx_app_context import IMXAppContext
```

- `IMXAppContext.get_current_user() -> str` — 取得目前執行使用者（優先 ENV → fallback OS user）
- `IMXAppContext.set_cache(key, value, ttl)` — 寫入 Redis 快取（透過 gRPC）
- `IMXAppContext.get_cache(key, cls) -> T` — 讀取 Redis 快取
- `IMXAppContext.remove_cache(key)` — 移除快取

### IMXUserContext

```python
from wecpy.imx_user_context import IMXUserContext
```

- `IMXUserContext.get_ssl_certificate(cert_url=None) -> bytes` — 取得 SSL 憑證（每日快取）
- `IMXUserContext.get_ssl_channel_credentials(file=None) -> grpc.ChannelCredentials` — 取得 gRPC SSL 憑據

### Converter

```python
from wecpy.utility.converter import Converter
```

- `Converter.to_utc_timestamp_from_datetime(dt) -> Timestamp` — datetime → gRPC Timestamp
- `Converter.to_utc_timestamp(year, month, day, hour=0, minute=0, second=0) -> Timestamp`
- `Converter.to_utc_datetime_from_datetime(dt) -> datetime` — 轉為 UTC datetime
- `Converter.to_utc_datetime(year, month, day, hour=0, minute=0, second=0) -> datetime`
- `Converter.utc_timestamp_to_datetime(pb2_timestamp) -> datetime` — gRPC Timestamp → datetime
- `Converter.protobuf_to_dataframe(protobuf_obj) -> pd.DataFrame` — protobuf → Pandas DataFrame

### 共用模型 (wecpy.shared)

- `BaseModel` — `to_dict()`, `debug_log()`, `debug_print()`
- `WebApiInputTemplate` — Web API 輸入範本
- `WebApiOutputTemplate` — Web API 輸出範本
- `User` — `from_dict()`, `to_dict()`
- `TemplateBase` — 範本基底類別

## 環境變數

| 變數                | 用途                                  | 新增版本 |
| ------------------- | ------------------------------------- | -------- |
| `IMX_ENV`           | `PILOT` / `PROD` 切換                 | -        |
| `IMX_SYSTEM`        | 系統名稱                              | -        |
| `IMX_APP`           | 應用名稱                              | -        |
| `IMX_UDB_ID`        | 資料庫帳號                            | -        |
| `IMX_UDB_PWD`       | 資料庫密碼                            | -        |
| `IMX_DAG_ID`        | Airflow DAG ID                        | -        |
| `IMX_APP_OWNER`     | 應用擁有者                            | -        |
| `IMX_APP_ID`        | 應用 ID                               | -        |
| `APP_RECORDER_URL`  | 指定 ELK Recorder 端點                | v1.11.1  |
| `APP_STORER_URL`    | 指定 S3 Storer 端點                   | v1.11.1  |
| `APP_CACHER_URL`    | 指定 Redis Cacher 端點                | v1.11.1  |
| `APP_FETCHER_URL`   | 指定 SAP/EDWM/iMX Portal Fetcher 端點 | v1.11.1  |
| `APP_{Service}_URL` | 指定任意 iMX Service 端點             | v1.11.1  |

**URL 解析層級**: 明確傳入 URL > ENV var > IMX_ENV 預設（PILOT → `pilot-imx:443`, PROD → `imx-infra:443`）

## config.yaml 範例

```yaml
General:
  system: "{IMX_SYSTEM}"
  app: "{IMX_APP}"
  app_type: "Schedule"
  section: "mk22"

Log:
  version: 1
  formatters:
    format1:
      format: "[%(asctime)s.%(msecs)03d] %(levelname)s %(tid)s - %(message)s"
  handlers:
    console:
      class: logging.StreamHandler
      formatter: format1
  root:
    handlers: [console]
    level: INFO

Database:
  oracle_main:
    db_type: oracle
    host: "db-host"
    port: 1521
    service_name: "ORCLCDB"
    username: "{IMX_UDB_ID}"
    password: "{IMX_UDB_PWD}"
```

## 常見幻覺與禁止事項

- 不存在 `AesHelper`（正確類別名為 `WecEncryption`）
- 不存在 `ConfigManager.load_env()`
- 不存在 `ConfigManager.reload()`
- 不存在 `LogManager.create_logger()`
- 不存在 `LogManager.set_level()`
- 不存在 `OracleManager.query_one()`
- 不存在 `DatabaseManager.bulk_insert()`
- 不存在 `JwtHelper.validate_and_decode()`
- 不存在 `IMXAppContext.get_user()` — 正確為 `get_current_user()`
- 不存在 `IMXUserContext.get_certificate()` — 正確為 `get_ssl_certificate()`
- 不存在 `Converter.to_dict()` — 正確為 `protobuf_to_dataframe()` 或 `_get_properties()`
- 不允許在 SQL 中用 f-string 串接參數
