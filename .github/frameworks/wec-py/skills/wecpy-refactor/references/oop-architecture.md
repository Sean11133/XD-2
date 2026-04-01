# OOP 架構設計指南

wecpy 框架標準 OOP 分層架構規範。本文件定義 Model / DAO / Service / Main 四層的設計原則、class 規範、與依賴注入模式。

## 目錄

1. [分層架構總覽](#分層架構總覽)
2. [Model 層](#model-層)
3. [DAO 層](#dao-層)
4. [Service 層](#service-層)
5. [Main.py 組裝模式](#mainpy-組裝模式)
6. [Error Handling](#error-handling)
7. [完整範例：Schedule 排程任務](#完整範例schedule-排程任務)
8. [完整範例：Listener 事件驅動](#完整範例listener-事件驅動)
9. [完整範例：Web API 服務](#完整範例web-api-服務)

---

## 分層架構總覽

```
main.py          組裝層：建立 DAO → 注入 Service → 執行
  ↓
services/        業務邏輯層：純邏輯，不直接使用 wecpy Manager
  ↓
daos/            資料存取層：封裝所有 I/O（DB、API、FTP、S3、DataFetcher）
  ↓
models/          資料模型層：純資料定義，零依賴
```

### 核心規則

| 規則 | 說明 | 原因 |
|------|------|------|
| **單向依賴** | `main → service → dao → model`，禁止反向 | 避免 circular dependency，保持各層可獨立替換 |
| **Service 不碰 wecpy Manager** | Service 只透過 DAO 操作資料 | Service 可以被 unit test，不需 mock wecpy 元件 |
| **DAO 封裝所有 I/O** | DB query、API call、file I/O 全部在 DAO 裡 | I/O 邏輯集中管理，換 data source 只改 DAO |
| **Model 零依賴** | 不 import 任何業務邏輯或 wecpy 元件 | 純資料結構，任何層都可以安全使用 |
| **Main.py 只組裝不做事** | 不寫業務邏輯，只負責 DI 組裝 + 執行進入點 | 職責清晰，組裝邏輯一目了然 |

---

## Model 層

Model 層定義資料結構，分兩類：

### SQLAlchemy Model（對應 DB Table）

用於 `OracleManager.insert()` / `OracleManager.truncate()` 等操作。定義規範詳見 **wecpy-database skill** 的 `references/model-patterns.md`。

```python
# models/lot_summary.py
from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class LotSummary(Base):
    __tablename__ = 'LOT_SUMMARY'

    LOT_ID = Column('LOT_ID', String(30), primary_key=True)
    YIELD_RATE = Column('YIELD_RATE', Float)
    CREATE_USER = Column('CREATE_USER', String(50))
    CREATE_TIME = Column('CREATE_TIME', DateTime, default=datetime.now)
    UPDATE_USER = Column('UPDATE_USER', String(50))
    UPDATE_TIME = Column('UPDATE_TIME', DateTime, onupdate=datetime.now)
```

### Dataclass（非 DB 資料結構）

用於 Service 之間傳遞的資料物件、API response、中間運算結果。

```python
# models/analysis_result.py
from dataclasses import dataclass, field
from typing import Optional
import pandas as pd

@dataclass
class AnalysisResult:
    """分析結果，Service 之間傳遞用。"""
    lot_id: str
    yield_rate: float
    is_abnormal: bool
    detail_df: pd.DataFrame = field(default_factory=pd.DataFrame)
    error_message: Optional[str] = None

    @property
    def is_success(self) -> bool:
        return self.error_message is None
```

### 何時用哪個

| 情境 | 用 SQLAlchemy Model | 用 dataclass |
|------|-------------------|-------------|
| 對應 DB table 做 CRUD | ✅ | |
| Service 之間傳資料 | | ✅ |
| API response 結構 | | ✅ |
| ETL 中間結果 | | ✅ |
| 需要 ORM insert/truncate | ✅ | |

---

## DAO 層

DAO（Data Access Object）封裝所有 I/O 操作。每個 DAO 聚焦一個 data source 或一組相關的資料操作。

### 設計原則

- 一個 DAO class 對應一個 data source（一張 table、一個 API endpoint、一個 S3 bucket）
- 方法名稱反映業務語意（`get_lot_yield()`），不要暴露底層實作（~~`execute_sql()`~~）
- 回傳 DataFrame 或 Model 物件，不要回傳 raw cursor 或 raw response
- wecpy Manager 在 `__init__` 中建立，外部不需要知道用了什麼 Manager

### DAO 範例

```python
# daos/lot_dao.py
from typing import Optional
import pandas as pd
from wecpy.database_manager.oracle_manager import OracleManager
from models.lot_summary import LotSummary

class LotDao:
    """Lot 相關資料存取。封裝 OracleManager。"""

    def __init__(self, db_name: str = "TRAINDB"):
        self._oracle = OracleManager(db_name)

    def get_lot_yield(self, lot_ids: list[str]) -> pd.DataFrame:
        """依 Lot ID 查詢 yield 資料。"""
        placeholders = ", ".join([f":id{i}" for i in range(len(lot_ids))])
        params = {f"id{i}": lid for i, lid in enumerate(lot_ids)}
        return self._oracle.query_dataframe(
            f"SELECT LOT_ID, YIELD_RATE FROM LOT_SUMMARY WHERE LOT_ID IN ({placeholders})",
            params=params
        )

    def save_summary(self, df: pd.DataFrame) -> None:
        """寫入分析結果到 LOT_SUMMARY table。"""
        self._oracle.insert(df, LotSummary)

    def get_recent_lots(self, days: int = 7) -> pd.DataFrame:
        """取得最近 N 天的 lot 資料。"""
        return self._oracle.query_dataframe(
            "SELECT * FROM LOT_SUMMARY WHERE CREATE_TIME >= SYSDATE - :days",
            params={"days": days}
        )
```

### DAO 用於非 DB 來源

DAO 不限於 DB，任何 I/O 都該封裝在 DAO 層：

```python
# daos/report_storage_dao.py
from wecpy.io_manager.s3_bucket_manager import S3BucketManager

class ReportStorageDao:
    """報表檔案存取。封裝 S3BucketManager。"""

    def __init__(self, cluster: str = "CIMS3", bucket: str = "reports"):
        self._cluster = cluster
        self._bucket = bucket

    def upload_report(self, file_path: str, s3_key: str) -> None:
        with S3BucketManager(self._cluster, self._bucket) as s3:
            s3_obj = s3.read(s3_key)
            s3_obj.load_binary(file_path)

    def download_report(self, s3_key: str, local_path: str) -> str:
        with S3BucketManager(self._cluster, self._bucket) as s3:
            return s3.read(s3_key).save_to(local_path)
```

```python
# daos/external_api_dao.py
from wecpy.io_manager.api_client_manager import ApiClientManager

class ExternalApiDao:
    """外部 API 呼叫。封裝 ApiClientManager。"""

    def __init__(self, api_name: str = "DataService"):
        self._api = ApiClientManager(api_name)

    def get_equipment_status(self, eqp_id: str) -> dict:
        self._api.add_field("eqp_id", eqp_id)
        return self._api.get()
```

---

## Service 層

Service 包含所有業務邏輯。Service 不知道資料從哪來（DB？API？S3？），只透過 DAO 取得和儲存資料。

### 設計原則

- **不直接使用 wecpy Manager**（OracleManager、FTPManager 等）。理由：
  - Service 可以被 unit test，只需 mock DAO
  - 資料來源更換時 Service 不用改
  - 業務邏輯和 infrastructure 邏輯清楚分離
- 透過 constructor 注入 DAO（依賴注入）
- 方法反映業務行為（`analyze_lot_yield()`），不是技術操作
- 可以使用 LogManager（logging 不算 I/O）

### Service 範例

```python
# services/yield_analysis_service.py
from wecpy.log_manager import LogManager
from daos.lot_dao import LotDao
from models.analysis_result import AnalysisResult

log = LogManager.get_logger()

class YieldAnalysisService:
    """Lot yield 分析業務邏輯。"""

    YIELD_THRESHOLD = 0.85  # 良率低於此值為異常

    def __init__(self, lot_dao: LotDao):
        self._lot_dao = lot_dao

    def analyze_lots(self, lot_ids: list[str]) -> list[AnalysisResult]:
        """分析指定 lot 的 yield，標記異常。"""
        df = self._lot_dao.get_lot_yield(lot_ids)
        results = []
        for _, row in df.iterrows():
            is_abnormal = row['YIELD_RATE'] < self.YIELD_THRESHOLD
            result = AnalysisResult(
                lot_id=row['LOT_ID'],
                yield_rate=row['YIELD_RATE'],
                is_abnormal=is_abnormal
            )
            if is_abnormal:
                log.warning(
                    f"Lot {row['LOT_ID']} yield {row['YIELD_RATE']:.2%} below threshold",
                    "yield_abnormal"
                )
            results.append(result)
        return results

    def save_analysis(self, results: list[AnalysisResult]) -> None:
        """儲存分析結果。"""
        import pandas as pd
        df = pd.DataFrame([
            {"LOT_ID": r.lot_id, "YIELD_RATE": r.yield_rate}
            for r in results
        ])
        self._lot_dao.save_summary(df)
        log.info(f"Saved {len(results)} analysis results", "save_complete")
```

### 何時允許 Service 直接用 wecpy 元件

唯一的例外是 **LogManager**，因為 logging 是橫切關注點（cross-cutting concern），不算 I/O。

```python
# ✅ OK — LogManager 可直接在 Service 使用
from wecpy.log_manager import LogManager
log = LogManager.get_logger()

# ❌ 禁止 — Service 不該直接用 OracleManager
from wecpy.database_manager.oracle_manager import OracleManager  # 不要這樣做
```

---

## Main.py 組裝模式

main.py 是「組裝工廠」：建立 DAO → 注入 Service → 執行。不寫業務邏輯。

### 基本模式（所有 app_type 通用）

```python
# main.py — 組裝層
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.log_manager import LogManager

# DAO imports
from daos.lot_dao import LotDao
from daos.report_storage_dao import ReportStorageDao

# Service imports
from services.yield_analysis_service import YieldAnalysisService
from services.report_service import ReportService

log = LogManager.get_logger()

def main() -> None:
    log.info("Application startup", "app_start")

    # --- 組裝 DAO ---
    lot_dao = LotDao("TRAINDB")
    report_dao = ReportStorageDao("CIMS3", "reports")

    # --- 組裝 Service（注入 DAO）---
    yield_service = YieldAnalysisService(lot_dao)
    report_service = ReportService(lot_dao, report_dao)

    # --- 執行業務流程 ---
    try:
        results = yield_service.analyze_lots(["LOT001", "LOT002"])
        yield_service.save_analysis(results)
        report_service.generate_daily_report()
        log.info("Application completed", "app_complete")
    except Exception as e:
        log.error(f"Application failed: {e}", "app_error")
        raise

if __name__ == "__main__":
    main()
```

### 組裝順序

```
1. ConfigManager('config.yaml')     ← 必須第一行
2. import LogManager                ← 必須緊接在後
3. import DAOs                      ← 資料存取層
4. import Services                  ← 業務邏輯層
5. 建立 DAO 實例                     ← 傳入 config 參數
6. 建立 Service 實例（注入 DAO）      ← DI 發生的地方
7. 呼叫 Service 方法執行業務          ← 實際工作
```

---

## Error Handling

### 自定義 Exception 層級

```python
# models/exceptions.py

class AppError(Exception):
    """應用層基礎 exception。所有自定義 exception 繼承此 class。"""
    def __init__(self, message: str, error_code: str = "UNKNOWN"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)

class DataNotFoundError(AppError):
    """查無資料。"""
    def __init__(self, entity: str, criteria: str):
        super().__init__(
            f"{entity} not found: {criteria}",
            error_code="DATA_NOT_FOUND"
        )

class DataValidationError(AppError):
    """資料驗證失敗。"""
    def __init__(self, field: str, reason: str):
        super().__init__(
            f"Validation failed on '{field}': {reason}",
            error_code="VALIDATION_ERROR"
        )

class ExternalServiceError(AppError):
    """外部服務呼叫失敗（DB、API、FTP 等）。"""
    def __init__(self, service: str, detail: str):
        super().__init__(
            f"External service '{service}' error: {detail}",
            error_code="EXTERNAL_ERROR"
        )
```

### 各層的 Error Handling 職責

| 層 | 職責 | 範例 |
|---|------|------|
| **DAO** | 捕捉 I/O exception → 轉成 AppError 子類別 | `cx_Oracle.DatabaseError` → `ExternalServiceError` |
| **Service** | 驗證業務規則 → 拋出 `DataValidationError` | 良率超出合理範圍 |
| **Main** | 捕捉最頂層 exception → log + 決定是否退出 | `except AppError as e: log.error(...)` |

```python
# DAO 層：轉換底層 exception
class LotDao:
    def get_lot_yield(self, lot_ids: list[str]) -> pd.DataFrame:
        try:
            return self._oracle.query_dataframe(...)
        except Exception as e:
            raise ExternalServiceError("TRAINDB", str(e)) from e
```

---

## 完整範例：Schedule 排程任務

最常見的 app_type。定時執行資料處理任務。

```
project-root/
├── PROD/config.yaml
├── PILOT/config.yaml
├── .env
├── requirements.txt
├── main.py
├── models/
│   ├── __init__.py
│   ├── lot_summary.py          # SQLAlchemy Model
│   ├── analysis_result.py      # dataclass
│   └── exceptions.py           # 自定義 exception
├── daos/
│   ├── __init__.py
│   └── lot_dao.py              # 封裝 OracleManager
├── services/
│   ├── __init__.py
│   └── yield_analysis_service.py
├── tests/
│   ├── golden/
│   ├── unit/
│   │   └── test_yield_analysis.py
│   └── integration/
└── log/
```

```python
# main.py — Schedule app_type 完整範例
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.log_manager import LogManager
from wecpy.apm_manager.apm_manager import APMManager

from daos.lot_dao import LotDao
from services.yield_analysis_service import YieldAnalysisService
from models.exceptions import AppError

log = LogManager.get_logger()

def main() -> None:
    apm = APMManager("apmserver")
    apm.begin_transaction()

    try:
        # 組裝
        lot_dao = LotDao("TRAINDB")
        service = YieldAnalysisService(lot_dao)

        # 執行
        results = service.analyze_lots(["LOT001", "LOT002", "LOT003"])
        abnormal = [r for r in results if r.is_abnormal]

        if abnormal:
            log.warning(f"Found {len(abnormal)} abnormal lots", "abnormal_detected")

        service.save_analysis(results)
        apm.end_transaction("success")

    except AppError as e:
        log.error(f"Business error: {e.message} [{e.error_code}]", "biz_error")
        apm.end_transaction("business_error")
        raise
    except Exception as e:
        log.error(f"Unexpected error: {e}", "sys_error")
        apm.capture_exception()
        apm.end_transaction("system_error")
        raise

if __name__ == "__main__":
    main()
```

---

## 完整範例：Listener 事件驅動

Kafka 訊息觸發的事件處理。Listener 只管「收訊息」，Handler 負責「解析 + 路由到 Service」。

```
project-root/
├── ...                           # 基礎結構同 Schedule
├── listeners/
│   ├── __init__.py
│   └── lot_event_listener.py     # 繼承 BaseKafkaListener
├── handlers/
│   ├── __init__.py
│   └── lot_event_handler.py      # 解析訊息 → 呼叫 Service
├── models/
├── daos/
└── services/
```

```python
# listeners/lot_event_listener.py
from wecpy.kafka_manager.base_kafka_listener import BaseKafkaListener
from wecpy.log_manager import LogManager
from handlers.lot_event_handler import LotEventHandler

log = LogManager.get_logger()

class LotEventListener(BaseKafkaListener):
    """監聽 Lot 事件訊息。只管收，不管處理。"""

    def __init__(self, handler: LotEventHandler):
        super().__init__()
        self._handler = handler

    def on_message_received(self, wec_doc):
        log.info(f"Received lot event", "msg_received")
        self._handler.handle(wec_doc)
```

```python
# handlers/lot_event_handler.py
from wecpy.log_manager import LogManager
from services.yield_analysis_service import YieldAnalysisService

log = LogManager.get_logger()

class LotEventHandler:
    """解析 Lot 事件訊息，路由到對應的 Service。"""

    def __init__(self, yield_service: YieldAnalysisService):
        self._yield_service = yield_service

    def handle(self, wec_doc) -> None:
        event_type = wec_doc.get_string("event_type")
        lot_id = wec_doc.get_string("lot_id")

        if event_type == "LOT_END":
            results = self._yield_service.analyze_lots([lot_id])
            self._yield_service.save_analysis(results)
            log.info(f"Processed LOT_END for {lot_id}", "lot_end_processed")
        else:
            log.warning(f"Unknown event type: {event_type}", "unknown_event")
```

```python
# main.py — Listener app_type 組裝
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.log_manager import LogManager

from daos.lot_dao import LotDao
from services.yield_analysis_service import YieldAnalysisService
from handlers.lot_event_handler import LotEventHandler
from listeners.lot_event_listener import LotEventListener

log = LogManager.get_logger()

def main() -> None:
    # 組裝
    lot_dao = LotDao("TRAINDB")
    service = YieldAnalysisService(lot_dao)
    handler = LotEventHandler(service)
    listener = LotEventListener(handler)

    # 啟動（blocking call）
    log.info("Starting Lot Event Listener", "listener_start")
    listener.start()

if __name__ == "__main__":
    main()
```

---

## 完整範例：Web API 服務

WecApplication 處理 request-reply 模式。Controller 負責解析 request → 呼叫 Service → 組裝 response。

```
project-root/
├── ...                           # 基礎結構同 Schedule
├── controllers/
│   ├── __init__.py
│   └── yield_controller.py       # 繼承 WecApplication
├── models/
├── daos/
└── services/
```

```python
# controllers/yield_controller.py
from wecpy.kafka_manager.wec_application import WecApplication
from wecpy.kafka_manager.wec_doc import WecDoc
from wecpy.log_manager import LogManager
from services.yield_analysis_service import YieldAnalysisService
from models.exceptions import AppError

log = LogManager.get_logger()

class YieldController(WecApplication):
    """處理 yield 查詢請求。"""

    def __init__(self, yield_service: YieldAnalysisService):
        super().__init__()
        self._yield_service = yield_service

    def on_message_received(self, request_doc) -> WecDoc:
        lot_id = request_doc.get_string("lot_id")
        log.info(f"Yield query for {lot_id}", "yield_query")

        try:
            results = self._yield_service.analyze_lots([lot_id])
            response = WecDoc()
            response.add_as_string("status", "success")
            response.add_as_float("yield_rate", results[0].yield_rate)
            response.add_as_string("is_abnormal", str(results[0].is_abnormal))
            return response
        except AppError as e:
            error_response = WecDoc()
            error_response.add_as_string("status", "error")
            error_response.add_as_string("error_code", e.error_code)
            error_response.add_as_string("message", e.message)
            return error_response
```

```python
# main.py — Web API app_type 組裝
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.log_manager import LogManager

from daos.lot_dao import LotDao
from services.yield_analysis_service import YieldAnalysisService
from controllers.yield_controller import YieldController

log = LogManager.get_logger()

def main() -> None:
    # 組裝
    lot_dao = LotDao("TRAINDB")
    service = YieldAnalysisService(lot_dao)
    controller = YieldController(service)

    # 啟動
    log.info("Starting Yield API Service", "api_start")
    controller.start()

if __name__ == "__main__":
    main()
```
