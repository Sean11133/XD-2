---
applyTo: "**/*.py"
---

# iEDA Data Fetcher — Python 使用指引

> **服務說明**：見 [overview.md](../overview.md)  
> **前置需求**：需先安裝 `wecpy` 與 `ieda-datafetcher`，並完成 wecpy ConfigManager 初始化

---

## 必要 Import 順序

```python
# 步驟 1：wecpy ConfigManager 必須最先連續兩行
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

# 步驟 2：wecpy 其他元件
from wecpy.data_fetcher import FetcherFactory
from wecpy.log_manager import LogManager

# 步驟 3：EDA 模組（安裝後才可 import）
from ieda_datafetcher.parquet_util import ParquetUtil
from ieda_datafetcher.duckdb_util import DuckDBUtil

log = LogManager.get_logger()
```

---

## 標準使用模式（以 LqcSummary 為例）

```python
import pandas as pd
from typing import List

def get_lqc_summary(lots: List[str]) -> pd.DataFrame:
    from ieda_datafetcher.lqc_summary_pb2 import LqcSummaryFilter
    from ieda_datafetcher.lqc_summary_pb2_grpc import LqcSummaryFetcherStub

    # 1. 建立客戶端
    client = FetcherFactory.create_client(LqcSummaryFetcherStub)

    # 2. 設定 Filter
    f = LqcSummaryFilter()
    f.lots.extend(lots)
    # 或以時間範圍查詢：
    # f.startDt = "2025-09-01 00:00:00"
    # f.endDt   = "2025-09-01 03:00:00"
    # f.productGroups.extend(["GAA108"])

    # 3. gRPC 串流 → Parquet（with 確保資源自動釋放）
    with ParquetUtil() as pu:
        pu.write_grpc_stream_to_parquet(
            tid="LQC_SUMMARY",
            table_name="lqc_summary",
            grpc_stream=client.GetLqcSummaryList(f)
        )

    # 4. Parquet → DataFrame（支援 SQL 查詢）
    duck = DuckDBUtil()
    df = duck.query_to_dataframe("LQC_SUMMARY", "SELECT * FROM #lqc_summary#")

    log.info(f"取得 {len(df)} 筆 LQC Summary 資料")
    return df
```

---

## 各 Fetcher 的方法命名規則

| Fetcher Stub            | 方法名稱            | Filter 類型        |
| ----------------------- | ------------------- | ------------------ |
| `LqcSummaryFetcherStub` | `GetLqcSummaryList` | `LqcSummaryFilter` |
| `CpSummaryFetcherStub`  | `GetCpSummaryList`  | `CpSummaryFilter`  |
| `DefSummaryFetcherStub` | `GetDefSummaryList` | `DefSummaryFilter` |
| `WatSummaryFetcherStub` | `GetWatSummaryList` | `WatSummaryFilter` |

> 規律：`Get{DataType}List`，對應 `{DataType}Filter`

---

## DuckDBUtil 查詢語法

```python
duck = DuckDBUtil()

# 查全部
df = duck.query_to_dataframe("TID", "SELECT * FROM #table_name#")

# 條件查詢
df = duck.query_to_dataframe("TID",
    "SELECT lot_id, wafer_id, value FROM #lqc_summary# WHERE value > 0.5")
```

> `#table_name#` 為 ParquetUtil 寫入時指定的 `table_name`，用 `#` 括起

---

## 錯誤處理

```python
from grpc import RpcError

try:
    df = get_lqc_summary(lots)
except RpcError as e:
    log.error(f"gRPC 錯誤: {e.code()} — {e.details()}")
    raise
except ImportError as e:
    log.error(f"未安裝 ieda_datafetcher: {e}")
    raise
```

---

## 禁止事項

- **禁止**在 `ConfigManager` 初始化前 import `ieda_datafetcher`
- **禁止**省略 context manager，必須使用 `with ParquetUtil() as pu:` 確保資源釋放
- **禁止**捏造不存在的 FetcherStub 或 Filter 類型，必須查套件確認
