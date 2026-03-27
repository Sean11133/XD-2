---
name: wecpy-data-fetcher
description: >-
  This skill should be used when the user asks about "FetcherFactory create_client gRPC streaming",
  "ifdc_datafetcher RawDataFetcher LotRunFetcher", "ieda_datafetcher LqcSummaryFetcher CpSummaryFetcher WatSummaryFetcher",
  "ParquetUtil DuckDBUtil write_grpc_stream_to_parquet", "protobuf_to_dataframe Converter",
  "FDC 資料擷取", "EDA 製程資料查詢", "APP_FETCHER_URL APP_IFDC_DATAFETCHER_URL APP_IEDA_DATAFETCHER_URL",
  or needs to query FDC/EDA manufacturing data via wecpy Data Fetcher gRPC streaming.
  (wecpy v1.11.1)
---

# wecpy-data-fetcher

## 首要原則 — 使用 wecpy，不要重造輪子

> **AI 在實作時，必須優先調用 wecpy 已提供的方法，嚴禁自行重新實作 wecpy 已涵蓋的功能。**

- **禁止**自行建立 gRPC channel 連線 Data Fetcher → 使用 `FetcherFactory.create_client(stub_cls)`
- **禁止**自行用 `grpc.insecure_channel()` 連線 → 使用 `FetcherFactory`（已內建 SSL/認證/端點解析）
- **禁止**自行寫 protobuf ↔ DataFrame 轉換 → 使用 `Converter.protobuf_to_dataframe()` 或 `ParquetUtil` + `DuckDBUtil`
- **禁止**自行用 `requests` 呼叫 Data Fetcher REST endpoint → Data Fetcher 僅提供 gRPC 介面
- **禁止**hardcode gRPC 端點 URL → 使用 `APP_*_URL` 環境變數或 IMX_ENV 預設

如果需求可以被本 skill 列出的 API 滿足，就必須使用該 API。只有在 wecpy 確實不提供對應功能時，才能自行實作。

## 適用情境

- 從 FDC（Fault Detection & Classification）系統擷取機台感測器資料
- 從 EDA（Engineering Data Analysis）系統擷取 CP/WAT/LQC/缺陷等品質資料
- 大量資料 gRPC 串流接收與批次處理
- 使用 ParquetUtil + DuckDBUtil 高效處理串流資料
- 取代傳統 EDWM + IMPALA + SQL 的資料存取方式

## 設計模式

| 模組           | 模式           | 註記                                            |
| -------------- | -------------- | ----------------------------------------------- |
| FetcherFactory | Factory Method | 透過 `create_client(stub_cls)` 建立 gRPC 客戶端 |
| ParquetUtil    | Adapter        | gRPC streaming → Parquet 檔案轉接               |
| DuckDBUtil     | Adapter        | Parquet → DataFrame 查詢轉接                    |
| Converter      | Static Utility | protobuf → Pandas DataFrame 直接轉換            |

## Data Fetcher 核心概念

Data Fetcher 由三個部份組成：

1. **`<SomeData>Fetcher`** — 資料來源 Fetcher（類似 SQL 的 Table）
2. **`<SomeData>Filter`** — 查詢條件 Filter（類似 SQL 的 WHERE）
3. **`<SomeData>Result`** — 查詢結果，可用迴圈逐批處理

## 選型決策

| 場景                   | 資料量   | 推薦方式                            |
| ---------------------- | -------- | ----------------------------------- |
| 小量資料、快速取用     | < 10,000 | `Converter.protobuf_to_dataframe()` |
| 大量資料、串流處理     | > 10,000 | `ParquetUtil` + `DuckDBUtil`        |
| 需要 SQL 二次查詢/聚合 | 任意     | `ParquetUtil` + `DuckDBUtil`        |
| 指定資料中心           | 任意     | `Location.KH` / `Location.TC`       |

## API Surface (Anti-Hallucination)

### FetcherFactory (wecpy)

```python
from wecpy.data_fetcher import FetcherFactory
```

- `FetcherFactory.create_client(stub_cls) -> stub` — 建立 gRPC 客戶端
- `FetcherFactory.create_client(stub_cls, data_center=Location.KH) -> stub` — 指定資料中心

### Location (wecpy)

```python
from wecpy.data_fetcher.location import Location
```

- `Location.KH` — 高雄資料中心
- `Location.TC` — 台中資料中心

### Converter (wecpy)

```python
from wecpy.utility.converter import Converter
```

- `Converter.protobuf_to_dataframe(protobuf_obj) -> pd.DataFrame` — protobuf 物件 → DataFrame

### ParquetUtil (ieda_datafetcher)

```python
from ieda_datafetcher.parquet_util import ParquetUtil
```

- `ParquetUtil()` — 建立實例
- `pu.write_grpc_stream_to_parquet(tid, table_name, grpc_stream)` — gRPC 串流寫入 Parquet
- `pu.close()` — 釋放資源（必須呼叫）

### DuckDBUtil (ieda_datafetcher)

```python
from ieda_datafetcher.duckdb_util import DuckDBUtil
```

- `DuckDBUtil()` — 建立實例
- `duck_util.query_to_dataframe(tid, sql) -> pd.DataFrame` — 查詢 Parquet 資料為 DataFrame
- SQL 中的表名使用 `#table_name#` 語法引用 ParquetUtil 寫入的表

## 可用的 Fetcher Stub 與 Filter

### iFDC Data Fetcher（FDC 資料）

```bash
pip install --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple \
    --trusted-host=10.18.20.121:8081 ifdc-datafetcher
```

| Fetcher Stub         | Filter             | 說明               |
| -------------------- | ------------------ | ------------------ |
| `RawDataFetcherStub` | `RecipeStepFilter` | 機台感測器原始資料 |
| `LotRunFetcherStub`  | `LotRunFilter`     | 批號執行資料       |

**RecipeStepFilter 欄位：**

- `filter.eqpId` — 機台 ID
- `filter.chambers.extend([...])` — Chamber 清單
- `filter.parameters.extend([...])` — 參數清單
- `filter.dateRanges.extend([DateRange()])` — 日期區間清單

**DateRange 欄位：**

- `dateRange.start` — 起始時間（格式 `"2025-06-01 17:00:00"`）
- `dateRange.end` — 結束時間

### iEDA Data Fetcher（EDA 資料）

```bash
pip install --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple \
    --trusted-host=10.18.20.121:8081 ieda-datafetcher
```

#### 通用資料 (Common)

| Fetcher Stub             | 說明         |
| ------------------------ | ------------ |
| `CmnChipFetcherStub`     | 晶片資料     |
| `CmnLotFetcherStub`      | 批號資料     |
| `CmnLotWaferFetcherStub` | 批號晶圓資料 |
| `CmnProductFetcherStub`  | 產品資料     |
| `CmnShotFetcherStub`     | 曝光點資料   |
| `CmnWaferFetcherStub`    | 晶圓資料     |

#### CP 測試資料 (Circuit Probing)

| Fetcher Stub              | 說明                |
| ------------------------- | ------------------- |
| `CpChipDcFetcherStub`     | CP 晶片 DC 參數資料 |
| `CpChipRacFetcherStub`    | CP 晶片 RAC 資料    |
| `CpSummaryFetcherStub`    | CP 摘要資料         |
| `CpSummaryCprFetcherStub` | CP 摘要 CPR 資料    |
| `CpSummaryDcFetcherStub`  | CP 摘要 DC 資料     |
| `CpSummaryFrcFetcherStub` | CP 摘要 FRC 資料    |
| `CpWaferFetcherStub`      | CP 晶圓資料         |

#### 缺陷分析 (Defect)

| Fetcher Stub                 | 說明             |
| ---------------------------- | ---------------- |
| `DefSummaryFetcherStub`      | 缺陷摘要資料     |
| `DefSummaryClassFetcherStub` | 缺陷分類摘要資料 |
| `DefWaferFetcherStub`        | 缺陷晶圓資料     |

#### LQC (Lot Quality Control)

| Fetcher Stub            | 說明           |
| ----------------------- | -------------- |
| `LqcParamFetcherStub`   | LQC 參數資料   |
| `LqcSummaryFetcherStub` | LQC 摘要資料   |
| `LqcSiteFetcherStub`    | LQC 測試點資料 |
| `LqcRegionFetcherStub`  | LQC 區域資料   |

#### WAT (Wafer Acceptance Test)

| Fetcher Stub            | 說明           |
| ----------------------- | -------------- |
| `WatParamFetcherStub`   | WAT 參數資料   |
| `WatRegionFetcherStub`  | WAT 區域資料   |
| `WatSiteFetcherStub`    | WAT 測試點資料 |
| `WatSummaryFetcherStub` | WAT 摘要資料   |

#### 其他

| Fetcher Stub             | 說明               |
| ------------------------ | ------------------ |
| `WipEqpEventFetcherStub` | 在製品設備事件資料 |

## 環境變數

| 變數                       | 用途                            | 新增版本 |
| -------------------------- | ------------------------------- | -------- |
| `APP_FETCHER_URL`          | 指定 DataFetcher 預設 gRPC 端點 | v1.11.1  |
| `APP_IFDC_DATAFETCHER_URL` | 指定 IFDC DataFetcher 端點      | v1.11.1  |
| `APP_IEDA_DATAFETCHER_URL` | 指定 IEDA DataFetcher 端點      | v1.11.1  |

**URL 解析層級**: 明確傳入 URL > `APP_{package}_URL` > `APP_FETCHER_URL` > IMX_ENV 預設

## 強制初始化順序

```python
# 步驟 1：ConfigManager 必須最先（不可分離）
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

# 步驟 2：wecpy 模組
from wecpy.log_manager import LogManager
from wecpy.data_fetcher import FetcherFactory

# 步驟 3：Data Fetcher 套件（必須先 pip install）
from ieda_datafetcher.parquet_util import ParquetUtil
from ieda_datafetcher.duckdb_util import DuckDBUtil
from ieda_datafetcher.lqc_summary_pb2 import LqcSummaryFilter
from ieda_datafetcher.lqc_summary_pb2_grpc import LqcSummaryFetcherStub

# 步驟 4：初始化日誌
log = LogManager.get_logger()
```

## 範例

### FDC：使用 Converter 直接轉換（小量資料）

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.log_manager import LogManager
from wecpy.data_fetcher import FetcherFactory
from wecpy.data_fetcher.location import Location
from wecpy.utility.converter import Converter

from ifdc_datafetcher.rawdata_pb2_grpc import RawDataFetcherStub
from ifdc_datafetcher.rawdata_pb2 import RecipeStepFilter, DateRange

log = LogManager.get_logger()

# 建立 Fetcher（指定高雄資料中心）
fetcher = FetcherFactory.create_client(RawDataFetcherStub, data_center=Location.KH)

# 建立 Filter
filter = RecipeStepFilter()
filter.eqpId = "EKPLYA01"
filter.chambers.extend(["EKPLYA01_PM3"])
filter.parameters.extend(["GAS_6_O2_1000"])

date_range = DateRange()
date_range.start = "2025-06-01 17:00:00"
date_range.end = "2025-06-01 18:00:00"
filter.dateRanges.extend([date_range])

# 取得資料（串流分批）
response = fetcher.GetRawDataByFilter(filter)
for result in response:
    df = Converter.protobuf_to_dataframe(result.data)
    log.info(f"收到 {len(df)} 筆資料", log_key="fdc_batch_received")
```

### EDA：使用 ParquetUtil + DuckDBUtil（大量資料）

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.log_manager import LogManager
from wecpy.data_fetcher import FetcherFactory

from ieda_datafetcher.parquet_util import ParquetUtil
from ieda_datafetcher.duckdb_util import DuckDBUtil
from ieda_datafetcher.lqc_summary_pb2 import LqcSummaryFilter
from ieda_datafetcher.lqc_summary_pb2_grpc import LqcSummaryFetcherStub

log = LogManager.get_logger()

# 建立 Fetcher
client = FetcherFactory.create_client(LqcSummaryFetcherStub)

# 建立 Filter
filter = LqcSummaryFilter()
filter.startDt = "2025-09-01 00:00:00"
filter.endDt = "2025-09-01 03:00:00"
filter.productGroups.extend(["GAA108"])

# 取得 gRPC 串流
response_stream = client.GetLqcSummaryList(filter)

# 串流寫入 Parquet
pu = ParquetUtil()
try:
    pu.write_grpc_stream_to_parquet(
        tid="LQC_SUMMARY",
        table_name="lqc_summary",
        grpc_stream=response_stream
    )
    log.info("gRPC 串流資料已寫入 Parquet", log_key="parquet_write_done")
finally:
    pu.close()

# DuckDB 查詢為 DataFrame
duck_util = DuckDBUtil()
df = duck_util.query_to_dataframe(
    "LQC_SUMMARY",
    "SELECT * FROM #lqc_summary#"
)
log.info(f"取得 {len(df)} 筆 LQC Summary 資料", log_key="lqc_fetch_done")
```

### 錯誤處理模式

```python
import grpc
from grpc import RpcError

def safe_fetch(stub_cls, filter_obj, method_name):
    """安全的 Data Fetcher 呼叫，含完整錯誤處理"""
    try:
        client = FetcherFactory.create_client(stub_cls)
        method = getattr(client, method_name)
        return method(filter_obj)

    except RpcError as e:
        if e.code() == grpc.StatusCode.UNAUTHENTICATED:
            log.error("未通過認證，請先申請 Data Fetcher 權限",
                      log_key="fetcher_auth_error")
        elif e.code() == grpc.StatusCode.PERMISSION_DENIED:
            log.error("權限不足，請確認已申請對應資料存取權限",
                      log_key="fetcher_perm_error")
        else:
            log.error(f"gRPC 錯誤: {e.code()}, {e.details()}",
                      log_key="fetcher_grpc_error")
        raise

    except Exception as e:
        log.error(f"Data Fetcher 發生未預期錯誤: {str(e)}",
                  log_key="fetcher_unexpected_error")
        raise
```

## 權限申請

若未申請 Data Fetcher 權限，執行時會出現：

- **Unauthenticated**: `Access denied. Authentication is required.`
- **PermissionDenied**: `Access denied. You do not have permission to access.`

請先完成對應權限申請再進行使用。

## 常見幻覺與禁止事項

- **不存在 `FetcherFactory.get_client_pool()`** — 每次呼叫 `create_client()` 即可
- 不存在 `FetcherFactory.connect()` 或 `FetcherFactory.close()`
- 不存在 `ParquetUtil.read_parquet()` — 讀取請用 `DuckDBUtil.query_to_dataframe()`
- 不存在 `DuckDBUtil.execute()` — 正確為 `query_to_dataframe()`
- 不存在 `DataFetcher.fetch()` — 必須透過具體 Stub 的方法呼叫（如 `GetRawDataByFilter`）
- 不存在 `Location.DEFAULT` — 不指定 `data_center` 時使用 ENV 預設
- **不要自行用 `grpc.insecure_channel()` 建立連線** — `FetcherFactory` 已封裝完整連線管理
- **iFDC 套件名為 `ifdc_datafetcher`**（底線），安裝名為 `ifdc-datafetcher`（連字號）
- **iEDA 套件名為 `ieda_datafetcher`**（底線），安裝名為 `ieda-datafetcher`（連字號）
- DuckDBUtil SQL 中引用 ParquetUtil 表名時必須用 `#table_name#` 語法，不可用一般字串
