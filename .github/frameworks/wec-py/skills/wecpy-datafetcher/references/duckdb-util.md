# DuckDBUtil 使用指南

本文件說明 iEDA Data Fetcher 中 DuckDBUtil 的使用方式。

## 概述

DuckDBUtil 是 iEDA Data Fetcher 提供的工具類別，用於使用 SQL 查詢 ParquetUtil 寫入的資料，並轉換為 pandas DataFrame。

## 匯入

```python
# 必須先安裝 ieda-datafetcher
from ieda_datafetcher.duckdb_util import DuckDBUtil
```

## 基本使用

### 查詢並轉換為 DataFrame

```python
from ieda_datafetcher.duckdb_util import DuckDBUtil

# 建立 DuckDBUtil 實例
duck_util = DuckDBUtil()

# 查詢資料（使用 #table_name# 語法參照表格）
df = duck_util.query_to_dataframe(
    "LQC_SUMMARY",                    # tid（與 ParquetUtil 寫入時相同）
    "SELECT * FROM #lqc_summary#"     # SQL 查詢（#table_name# 會被替換）
)

log.info(f"取得 {len(df)} 筆資料")
```

### 參數說明

| 參數 | 類型 | 說明 |
|-----|------|------|
| 第一個參數 | str | tid，必須與 ParquetUtil 寫入時的 tid 相同 |
| 第二個參數 | str | SQL 查詢語句，使用 `#table_name#` 參照表格 |

## SQL 查詢語法

### 表格參照

使用 `#table_name#` 語法參照 ParquetUtil 寫入的表格：

```python
# 基本查詢
df = duck_util.query_to_dataframe(
    "LQC_SUMMARY",
    "SELECT * FROM #lqc_summary#"
)

# 條件篩選
df = duck_util.query_to_dataframe(
    "LQC_SUMMARY",
    "SELECT * FROM #lqc_summary# WHERE product_group = 'GAA108'"
)

# 聚合查詢
df = duck_util.query_to_dataframe(
    "LQC_SUMMARY",
    """
    SELECT product_group, COUNT(*) as cnt, AVG(value) as avg_value
    FROM #lqc_summary#
    GROUP BY product_group
    """
)
```

### 常用 SQL 操作

```python
# 選擇特定欄位
df = duck_util.query_to_dataframe(
    "LQC_SUMMARY",
    "SELECT lot_id, wafer_id, value FROM #lqc_summary#"
)

# 排序
df = duck_util.query_to_dataframe(
    "LQC_SUMMARY",
    "SELECT * FROM #lqc_summary# ORDER BY create_time DESC"
)

# 限制筆數
df = duck_util.query_to_dataframe(
    "LQC_SUMMARY",
    "SELECT * FROM #lqc_summary# LIMIT 100"
)

# 多條件篩選
df = duck_util.query_to_dataframe(
    "LQC_SUMMARY",
    """
    SELECT * FROM #lqc_summary#
    WHERE product_group = 'GAA108'
      AND value > 0
      AND create_time >= '2025-09-01'
    """
)
```

## 完整範例

### 搭配 ParquetUtil 使用

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.data_fetcher import FetcherFactory
from wecpy.log_manager import LogManager

from ieda_datafetcher.parquet_util import ParquetUtil
from ieda_datafetcher.duckdb_util import DuckDBUtil
from ieda_datafetcher.lqc_summary_pb2 import LqcSummaryFilter
from ieda_datafetcher.lqc_summary_pb2_grpc import LqcSummaryFetcherStub

import pandas as pd

log = LogManager.get_logger()

def fetch_lqc_with_analysis():
    """擷取 LQC 資料並進行分析"""
    
    # 1. 建立 Fetcher 和 Filter
    client = FetcherFactory.create_client(LqcSummaryFetcherStub)
    
    filter = LqcSummaryFilter()
    filter.startDt = "2025-09-01 00:00:00"
    filter.endDt = "2025-09-01 23:59:59"
    filter.productGroups.extend(["GAA108"])
    
    # 2. 取得 gRPC 串流
    response_stream = client.GetLqcSummaryList(filter)
    
    # 3. 使用 ParquetUtil 寫入
    pu = ParquetUtil()
    try:
        pu.write_grpc_stream_to_parquet(
            tid="LQC_ANALYSIS",
            table_name="lqc_data",
            grpc_stream=response_stream
        )
        log.info("資料寫入完成")
    finally:
        pu.close()
    
    # 4. 使用 DuckDB 進行分析查詢
    duck_util = DuckDBUtil()
    
    # 取得所有資料
    all_data = duck_util.query_to_dataframe(
        "LQC_ANALYSIS",
        "SELECT * FROM #lqc_data#"
    )
    log.info(f"總資料筆數: {len(all_data)}")
    
    # 依產品群組統計
    summary = duck_util.query_to_dataframe(
        "LQC_ANALYSIS",
        """
        SELECT 
            product_group,
            COUNT(*) as total_count,
            AVG(value) as avg_value,
            MIN(value) as min_value,
            MAX(value) as max_value
        FROM #lqc_data#
        GROUP BY product_group
        ORDER BY total_count DESC
        """
    )
    log.info(f"產品群組統計: {len(summary)} 組")
    
    return all_data, summary

if __name__ == "__main__":
    data, summary = fetch_lqc_with_analysis()
    log.info("=== 原始資料 ===")
    log.info(f"\n{data.head()}")
    log.info("\n=== 統計摘要 ===")
    log.info(f"\n{summary}")
```

## 進階查詢

### 聯結查詢（多表格）

如果有多個表格，可以進行聯結：

```python
# 假設已寫入兩個表格
# pu.write_grpc_stream_to_parquet(tid="DATA", table_name="lqc_summary", ...)
# pu.write_grpc_stream_to_parquet(tid="DATA", table_name="lot_info", ...)

duck_util = DuckDBUtil()
df = duck_util.query_to_dataframe(
    "DATA",
    """
    SELECT a.*, b.lot_status
    FROM #lqc_summary# a
    LEFT JOIN #lot_info# b ON a.lot_id = b.lot_id
    """
)
```

### 視窗函數

```python
df = duck_util.query_to_dataframe(
    "LQC_ANALYSIS",
    """
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY lot_id ORDER BY create_time) as seq,
        AVG(value) OVER (PARTITION BY product_group) as group_avg
    FROM #lqc_data#
    """
)
```

## 最佳實務

### 1. tid 必須一致

```python
# ✅ 正確：ParquetUtil 和 DuckDBUtil 使用相同的 tid
pu.write_grpc_stream_to_parquet(tid="LQC_SUMMARY", table_name="lqc", ...)
duck_util.query_to_dataframe("LQC_SUMMARY", "SELECT * FROM #lqc#")

# ❌ 錯誤：tid 不一致
pu.write_grpc_stream_to_parquet(tid="LQC_SUMMARY", table_name="lqc", ...)
duck_util.query_to_dataframe("WRONG_TID", "SELECT * FROM #lqc#")  # 找不到資料
```

### 2. 表格名稱語法

```python
# ✅ 正確：使用 #table_name# 語法
"SELECT * FROM #lqc_summary#"

# ❌ 錯誤：直接使用表格名稱
"SELECT * FROM lqc_summary"
```

### 3. 先寫入再查詢

```python
# ✅ 正確順序
# 1. ParquetUtil 寫入
# 2. DuckDBUtil 查詢

# ❌ 錯誤：未寫入就查詢
duck_util.query_to_dataframe("TID", "SELECT * FROM #table#")  # 找不到資料
```

## 常見問題

### Q1：查詢無資料
```
原因：tid 不一致或未執行 ParquetUtil 寫入
解決：
1. 確認 tid 與 ParquetUtil 寫入時相同
2. 確認 ParquetUtil 已成功寫入
3. 確認表格名稱正確（#table_name#）
```

### Q2：SQL 語法錯誤
```
原因：SQL 語法不正確
解決：
1. 確認使用 #table_name# 語法參照表格
2. 確認 SQL 語法符合 DuckDB 規範
3. 檢查欄位名稱是否正確
```

### Q3：記憶體不足
```
原因：查詢結果過大
解決：
1. 使用 LIMIT 限制筆數
2. 只選擇需要的欄位
3. 使用 WHERE 條件篩選
```
