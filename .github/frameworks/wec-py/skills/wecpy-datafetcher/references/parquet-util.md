# ParquetUtil 使用指南

本文件說明 iEDA Data Fetcher 中 ParquetUtil 的使用方式。

## 概述

ParquetUtil 是 iEDA Data Fetcher 提供的工具類別，用於將 gRPC 串流資料寫入 Parquet 格式檔案，支援高效能的大量資料處理。

## 匯入

```python
# 必須先安裝 ieda-datafetcher
from ieda_datafetcher.parquet_util import ParquetUtil
```

## 基本使用

### 寫入 gRPC 串流

```python
from ieda_datafetcher.parquet_util import ParquetUtil

# 建立 ParquetUtil 實例
pu = ParquetUtil()

try:
    # 將 gRPC 串流寫入 Parquet
    result = pu.write_grpc_stream_to_parquet(
        tid="LQC_SUMMARY",           # 交易識別碼
        table_name="lqc_summary",    # 表格名稱
        grpc_stream=response_stream   # gRPC 串流
    )
    log.info("寫入完成")
finally:
    # 重要：確保資源釋放
    pu.close()
```

### 參數說明

| 參數 | 類型 | 說明 |
|-----|------|------|
| `tid` | str | 交易識別碼，用於識別資料來源 |
| `table_name` | str | 表格名稱，在 DuckDB 查詢時使用 |
| `grpc_stream` | Iterator | gRPC 串流回應物件 |

## 完整範例

### 搭配 FetcherFactory 使用

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.data_fetcher import FetcherFactory
from wecpy.log_manager import LogManager

from ieda_datafetcher.parquet_util import ParquetUtil
from ieda_datafetcher.duckdb_util import DuckDBUtil
from ieda_datafetcher.lqc_summary_pb2 import LqcSummaryFilter
from ieda_datafetcher.lqc_summary_pb2_grpc import LqcSummaryFetcherStub

log = LogManager.get_logger()

def fetch_and_convert():
    """擷取資料並轉換為 DataFrame"""
    
    # 建立 Fetcher 和 Filter
    client = FetcherFactory.create_client(LqcSummaryFetcherStub)
    
    filter = LqcSummaryFilter()
    filter.startDt = "2025-09-01 00:00:00"
    filter.endDt = "2025-09-01 03:00:00"
    filter.productGroups.extend(["GAA108"])
    
    # 取得 gRPC 串流
    response_stream = client.GetLqcSummaryList(filter)
    
    # 使用 ParquetUtil 寫入
    pu = ParquetUtil()
    try:
        result = pu.write_grpc_stream_to_parquet(
            tid="LQC_SUMMARY",
            table_name="lqc_summary",
            grpc_stream=response_stream
        )
        log.info("Parquet 寫入完成")
    finally:
        pu.close()
    
    # 使用 DuckDB 讀取
    duck_util = DuckDBUtil()
    df = duck_util.query_to_dataframe("LQC_SUMMARY", "SELECT * FROM #lqc_summary#")
    
    return df

if __name__ == "__main__":
    df = fetch_and_convert()
    log.info(f"取得 {len(df)} 筆資料")
```

## 最佳實務

### 1. 確保資源釋放

```python
# ✅ 正確：使用 try-finally
pu = ParquetUtil()
try:
    pu.write_grpc_stream_to_parquet(...)
finally:
    pu.close()

# ❌ 錯誤：未釋放資源
pu = ParquetUtil()
pu.write_grpc_stream_to_parquet(...)
# 忘記 close()
```

### 2. 使用有意義的識別碼

```python
# ✅ 好的命名
pu.write_grpc_stream_to_parquet(
    tid="LQC_SUMMARY_2025Q1",
    table_name="lqc_summary",
    ...
)

# ❌ 不好的命名
pu.write_grpc_stream_to_parquet(
    tid="data1",
    table_name="table1",
    ...
)
```

### 3. 錯誤處理

```python
pu = ParquetUtil()
try:
    result = pu.write_grpc_stream_to_parquet(
        tid="LQC_SUMMARY",
        table_name="lqc_summary",
        grpc_stream=response_stream
    )
except Exception as e:
    log.error(f"Parquet 寫入失敗: {e}")
    raise
finally:
    pu.close()
```

## 常見問題

### Q1：寫入失敗
```
原因：gRPC 串流錯誤或磁碟問題
解決：
1. 確認 gRPC 串流正常
2. 檢查磁碟空間
3. 確認寫入權限
```

### Q2：資源未釋放
```
原因：未呼叫 close() 方法
解決：使用 try-finally 確保資源釋放
```

### Q3：記憶體不足
```
原因：資料量過大
解決：
1. 縮小查詢範圍
2. 分批處理資料
```
