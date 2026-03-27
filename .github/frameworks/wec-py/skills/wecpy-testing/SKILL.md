---
name: wecpy-testing
description: >-
  This skill should be used when the user asks about "wecpy 單元測試 pytest", "mock ConfigManager",
  "mock OracleManager TrinoManager SQLServerManager", "mock BaseKafkaListener on_message",
  "mock S3BucketManager FTPManager", "BaseETL 測試 purge extract transform load",
  "mock FetcherFactory create_client gRPC stub", "mock ElasticsearchManager search",
  "pytest fixture DI 依賴注入", "整合測試 integration test",
  or needs to write unit tests or integration tests for wecpy applications.
  (wecpy v1.11.1)
---

# wecpy-testing

## 首要原則 — 測試 wecpy 應用程式

> **測試時，應替換（mock）wecpy Manager 而非重新實作或跳過框架功能。**

- **禁止**在測試中真實連線資料庫 → mock `OracleManager` / `TrinoManager` / `SQLServerManager`
- **禁止**在測試中真實送 Kafka 訊息 → mock `KafkaTransportImpl` / `BaseKafkaListener`
- **禁止**在測試中真實連 S3 / FTP → mock `S3BucketManager` / `FTPManager`
- **禁止**在測試中真實呼叫 DataFetcher gRPC → mock `FetcherFactory.create_client()` 的回傳
- **禁止**在測試中跳過 `ConfigManager` 初始化 → 使用測試專用 config.yaml

## 適用情境

- wecpy 應用程式的單元測試
- DAO / Service 層的隔離測試
- BaseETL 子類別的流程測試
- Kafka listener 訊息處理測試
- 整合測試的 fixture 設計

## 設計原則

| 原則               | 說明                                      |
| ------------------ | ----------------------------------------- |
| 依賴注入 (DI)      | Manager 透過建構元注入，測試時替換為 mock |
| 測試隔離           | 每個測試案例獨立，不共享狀態              |
| 測試金字塔         | 單元測試 > 整合測試 > E2E 測試            |
| Arrange-Act-Assert | 統一測試結構：準備 → 執行 → 驗證          |

## 測試專案結構

```
<project_root>/
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # 共用 fixture（pytest）
│   ├── PILOT/config.yaml    # 測試專用設定
│   ├── dao_test.py          # DAO 層測試
│   ├── service_test.py      # Service 層測試
│   └── etl_test.py          # ETL 流程測試
```

## 測試 Fixture 模式

### ConfigManager 測試初始化

```python
# tests/conftest.py
import os
import pytest

@pytest.fixture(autouse=True)
def setup_config():
    """確保測試環境使用 PILOT 設定"""
    os.environ['IMX_ENV'] = 'PILOT'
    from wecpy.config_manager import ConfigManager
    ConfigManager('config.yaml')
    yield
```

### 測試專用 config.yaml

```yaml
# tests/PILOT/config.yaml
General:
  system: "TEST_SYSTEM"
  app: "TEST_APP"
  app_type: "Schedule"
  section: "MK22"

Log:
  version: 1
  formatters:
    format1:
      format: "[%(asctime)s] %(levelname)s %(tid)s - %(message)s"
  handlers:
    console:
      class: logging.StreamHandler
      formatter: format1
  root:
    handlers: [console]
    level: DEBUG

Database:
  test_oracle:
    type: oracle
    host: "test-db"
    port: 1521
    username: "test_user"
    password: "test_pass"
    service: "TESTDB"
```

## Mock 模式 (Anti-Hallucination)

### DatabaseManager Mock

```python
from unittest.mock import MagicMock, patch

def test_dao_query():
    """測試 DAO 的查詢邏輯"""
    # Arrange
    mock_db = MagicMock()
    mock_db.query_data.return_value = [
        {"id": "001", "name": "Test Order"}
    ]

    dao = OrderDAO(db=mock_db)

    # Act
    result = dao.find_by_id("001")

    # Assert
    assert result is not None
    assert result["id"] == "001"
    mock_db.query_data.assert_called_once()
    # 驗證 SQL 使用參數化查詢
    call_args = mock_db.query_data.call_args
    assert ":id" in call_args[0][0]  # SQL 包含 :id 參數
```

### ApiClientManager Mock

```python
from unittest.mock import MagicMock, patch

def test_service_api_call():
    """測試 Service 層的 API 呼叫"""
    # Arrange
    mock_client = MagicMock()
    mock_client.get.return_value = MagicMock(
        status_code=200,
        json=lambda: {"data": [{"id": 1}]}
    )

    with patch('wecpy.api_client_manager.ApiClientManager', return_value=mock_client):
        service = MyService()
        result = service.fetch_data()

    # Assert
    assert len(result) == 1
    mock_client.get.assert_called_once()
```

### BaseKafkaListener Mock

```python
from unittest.mock import MagicMock

def test_kafka_listener_on_message():
    """測試 Kafka listener 的訊息處理"""
    # Arrange
    listener = MyKafkaListener(name="test", callback=None)

    mock_message = MagicMock()
    mock_message.value.return_value = b'<WecDoc>...</WecDoc>'

    # Act
    listener.on_message(mock_message)

    # Assert — 驗證處理後的業務邏輯結果
```

### S3BucketManager Mock

```python
from unittest.mock import MagicMock, patch

def test_upload_to_s3():
    """測試 S3 上傳邏輯"""
    mock_s3 = MagicMock()
    mock_s3.put_object.return_value = None
    mock_s3.is_object_exist.return_value = True

    service = FileUploadService(s3=mock_s3)
    service.upload("test.csv", b"content")

    mock_s3.put_object.assert_called_once()
```

### FetcherFactory Mock

```python
from unittest.mock import MagicMock, patch

def test_data_fetcher():
    """測試 DataFetcher 資料擷取邏輯"""
    # Arrange：模擬 gRPC 串流回應
    mock_result = MagicMock()
    mock_result.data = [MagicMock(lot="LOT001", value=99.5)]

    mock_client = MagicMock()
    mock_client.GetLqcSummaryList.return_value = iter([mock_result])

    with patch('wecpy.data_fetcher.FetcherFactory.create_client', return_value=mock_client):
        df = fetch_lqc_data(["LOT001"])

    # Assert
    assert len(df) > 0
    mock_client.GetLqcSummaryList.assert_called_once()
```

### BaseETL 測試

```python
from unittest.mock import MagicMock, call

class TestMyETL:
    """測試 ETL 子類別"""

    def test_etl_lifecycle(self):
        """驗證 ETL 生命週期正確執行"""
        etl = MyETL()
        etl._db = MagicMock()  # mock 資料庫

        # 模擬 extract 回傳
        etl._db.query_dataframe.return_value = mock_dataframe()

        etl.run()

        # 驗證 lifecycle 順序
        # purge → extract → transform → load 皆被呼叫

    def test_etl_purge(self):
        """單獨測試 purge 階段"""
        etl = MyETL()
        etl._db = MagicMock()

        etl.purge()

        etl._db.execute_sql.assert_called_once()

    def test_etl_transform(self):
        """測試 transform 業務邏輯"""
        etl = MyETL()
        raw_data = mock_dataframe()

        result = etl.transform(raw_data)

        assert "new_column" in result.columns
```

### NotificationManger Mock

```python
from unittest.mock import MagicMock, patch

def test_alarm_notification():
    """測試告警通知邏輯"""
    with patch('wecpy.notification_manger.NotificationManger') as MockNotif:
        mock_notif = MockNotif.return_value
        mock_notif.send_alarm.return_value = None

        service = AlertService()
        service.send_error_alert("Something failed")

        mock_notif.send_alarm.assert_called_once()
```

### ElasticsearchManager Mock

```python
from unittest.mock import MagicMock

def test_elasticsearch_query():
    """測試 Elasticsearch 查詢邏輯"""
    mock_es = MagicMock()
    mock_response = MagicMock()
    mock_response.total.value = 5
    mock_response.hits = [MagicMock(data={"field": "value"})]
    mock_es.search.return_value = mock_response

    service = SearchService(es=mock_es)
    results = service.search_logs("error")

    assert len(results) == 1
    mock_es.add_must.assert_called()
    mock_es.search.assert_called_once()
```

## DI（依賴注入）模式

```python
# daos/order_dao.py — 可測試設計
class OrderDAO:
    def __init__(self, db):
        """透過建構元注入 DatabaseManager"""
        self._db = db

    def find_by_id(self, order_id: str) -> dict | None:
        rows = self._db.query_data(
            "SELECT * FROM orders WHERE id = :id",
            params={"id": order_id}
        )
        return rows[0] if rows else None

# services/order_service.py — 依賴 DAO 介面
class OrderService:
    def __init__(self, dao: OrderDAO, log):
        self._dao = dao
        self._log = log

    def process(self, order_id: str):
        order = self._dao.find_by_id(order_id)
        if not order:
            self._log.warning(f"Order not found: {order_id}",
                              log_key="order_not_found")
            return
        # 業務邏輯
```

**對應測試：**

```python
def test_order_service_process():
    mock_dao = MagicMock()
    mock_dao.find_by_id.return_value = {"id": "001", "status": "pending"}
    mock_log = MagicMock()

    service = OrderService(dao=mock_dao, log=mock_log)
    service.process("001")

    mock_dao.find_by_id.assert_called_once_with("001")
    mock_log.warning.assert_not_called()
```

## 測試命名規範

| 項目     | 規範                       | 範例                    |
| -------- | -------------------------- | ----------------------- |
| 測試檔案 | `*_test.py`                | `order_dao_test.py`     |
| 測試類別 | `Test<TargetClass>`        | `TestOrderDAO`          |
| 測試方法 | `test_<method>_<scenario>` | `test_find_by_id_found` |
| Fixture  | 描述性命名                 | `mock_database`         |

## 常見幻覺與禁止事項

- 不存在 `ConfigManager.mock()` — 使用測試專用 config.yaml 正常初始化
- 不存在 `LogManager.disable()` — mock logger 或使用低 level 設定
- 不存在 `OracleManager.in_memory()` — mock `query_data` / `execute_sql` 回傳
- 不存在 `BaseKafkaListener.simulate()` — 直接呼叫 `on_message()` 並傳入 mock message
- 不存在 `BaseETL.dry_run()` — 分別測試各階段，或 mock I/O 後呼叫 `run()`
- 不要在測試中真實連線外部服務（DB、Kafka、S3、gRPC）— 一律 mock
- 不要跳過 `ConfigManager` 初始化 — 測試也需要正確配置才能 import 其他 wecpy 模組
