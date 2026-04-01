# 資料工具整合範例

## 目錄

- [ETL 整合範例](#etl-整合範例)
  - [從 iEDA 擷取 → 分析 → 寫入 Oracle](#從-ieda-擷取-分析-寫入-oracle)
- [服務層整合](#服務層整合)
  - [IedaDataService 完整實作](#iedadataservice-完整實作)
- [效能優化建議](#效能優化建議)
  - [1. 批次處理](#1-批次處理)
  - [2. 快取機制](#2-快取機制)
- [注意事項](#注意事項)


本文件提供 ParquetUtil 和 DuckDBUtil 整合使用的完整範例。

## ETL 整合範例

### 從 iEDA 擷取 → 分析 → 寫入 Oracle

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.data_fetcher import FetcherFactory
from wecpy.database_manager.oracle_manager import OracleManager
from wecpy.log_manager import LogManager

from ieda_datafetcher.parquet_util import ParquetUtil
from ieda_datafetcher.duckdb_util import DuckDBUtil
from ieda_datafetcher.lqc_summary_pb2 import LqcSummaryFilter
from ieda_datafetcher.lqc_summary_pb2_grpc import LqcSummaryFetcherStub

from models.lqc_analysis import LqcAnalysis
from datetime import datetime
import pandas as pd

log = LogManager.get_logger()

def etl_lqc_analysis(start_dt: str, end_dt: str, product_groups: list):
    """
    LQC 資料 ETL 流程
    
    1. Extract: 從 iEDA 擷取 LQC Summary
    2. Transform: 使用 DuckDB 進行統計分析
    3. Load: 寫入 Oracle
    """
    log.info("=" * 60)
    log.info("LQC 分析 ETL 開始")
    log.info("=" * 60)
    
    # =========================================================================
    # Extract: 從 iEDA 擷取資料
    # =========================================================================
    log.info("Extract 階段開始")
    
    client = FetcherFactory.create_client(LqcSummaryFetcherStub)
    
    filter = LqcSummaryFilter()
    filter.startDt = start_dt
    filter.endDt = end_dt
    filter.productGroups.extend(product_groups)
    
    response_stream = client.GetLqcSummaryList(filter)
    
    # 寫入 Parquet
    pu = ParquetUtil()
    try:
        pu.write_grpc_stream_to_parquet(
            tid="LQC_ETL",
            table_name="lqc_raw",
            grpc_stream=response_stream
        )
        log.info("gRPC 串流已寫入 Parquet")
    finally:
        pu.close()
    
    log.info("Extract 階段完成")
    
    # =========================================================================
    # Transform: 使用 DuckDB 進行統計分析
    # =========================================================================
    log.info("Transform 階段開始")
    
    duck_util = DuckDBUtil()
    
    # 進行聚合分析
    analysis_df = duck_util.query_to_dataframe(
        "LQC_ETL",
        """
        SELECT 
            product_group,
            lot_id,
            COUNT(*) as measurement_count,
            AVG(value) as avg_value,
            MIN(value) as min_value,
            MAX(value) as max_value,
            STDDEV(value) as std_value
        FROM #lqc_raw#
        GROUP BY product_group, lot_id
        ORDER BY product_group, lot_id
        """
    )
    
    log.info(f"分析結果: {len(analysis_df)} 筆")
    
    # 添加 ETL 資訊
    now = datetime.now()
    analysis_df['ETL_TIME'] = now
    analysis_df['DATA_START'] = start_dt
    analysis_df['DATA_END'] = end_dt
    
    log.info("Transform 階段完成")
    
    # =========================================================================
    # Load: 寫入 Oracle
    # =========================================================================
    log.info("Load 階段開始")
    
    oracle = OracleManager("TRAINDB")
    
    # 清空目標表格
    oracle.truncate(LqcAnalysis)
    
    # 寫入分析結果
    oracle.insert(analysis_df, LqcAnalysis)
    
    log.info(f"已寫入 {len(analysis_df)} 筆分析結果")
    log.info("Load 階段完成")
    
    # =========================================================================
    # 驗證
    # =========================================================================
    result = oracle.query_dataframe("SELECT COUNT(*) as cnt FROM LQC_ANALYSIS")
    log.info(f"驗證: Oracle 中共 {result['cnt'].iloc[0]} 筆資料")
    
    log.info("=" * 60)
    log.info("LQC 分析 ETL 完成")
    log.info("=" * 60)
    
    return analysis_df

if __name__ == "__main__":
    df = etl_lqc_analysis(
        start_dt="2025-09-01 00:00:00",
        end_dt="2025-09-01 23:59:59",
        product_groups=["GAA108"]
    )
```

## 服務層整合

### IedaDataService 完整實作

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.data_fetcher import FetcherFactory
from wecpy.log_manager import LogManager

from ieda_datafetcher.parquet_util import ParquetUtil
from ieda_datafetcher.duckdb_util import DuckDBUtil

import pandas as pd
from typing import List, Optional
from datetime import datetime

class IedaDataService:
    """iEDA Data Fetcher 統一服務類別"""
    
    def __init__(self):
        self.log = LogManager.get_logger()
        self.log.info("IedaDataService 初始化")
    
    def _create_tid(self, prefix: str) -> str:
        """產生唯一的 tid"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{prefix}_{timestamp}"
    
    def _fetch_to_dataframe(self, fetcher_stub, filter_obj, 
                            method_name: str, table_name: str,
                            sql: str = None) -> pd.DataFrame:
        """通用資料擷取方法"""
        tid = self._create_tid(table_name.upper())
        
        try:
            # 建立 Fetcher
            client = FetcherFactory.create_client(fetcher_stub)
            
            # 呼叫 API
            method = getattr(client, method_name)
            response_stream = method(filter_obj)
            
            # 寫入 Parquet
            pu = ParquetUtil()
            try:
                pu.write_grpc_stream_to_parquet(
                    tid=tid,
                    table_name=table_name,
                    grpc_stream=response_stream
                )
            finally:
                pu.close()
            
            # 查詢資料
            duck_util = DuckDBUtil()
            query = sql if sql else f"SELECT * FROM #{table_name}#"
            df = duck_util.query_to_dataframe(tid, query)
            
            self.log.info(f"{table_name} 擷取完成: {len(df)} 筆")
            return df
            
        except Exception as e:
            self.log.error(f"{table_name} 擷取失敗: {e}")
            raise
    
    def get_lqc_summary(self, start_dt: str, end_dt: str,
                        product_groups: List[str],
                        custom_sql: str = None) -> pd.DataFrame:
        """取得 LQC Summary 資料"""
        from ieda_datafetcher.lqc_summary_pb2 import LqcSummaryFilter
        from ieda_datafetcher.lqc_summary_pb2_grpc import LqcSummaryFetcherStub
        
        filter_obj = LqcSummaryFilter()
        filter_obj.startDt = start_dt
        filter_obj.endDt = end_dt
        filter_obj.productGroups.extend(product_groups)
        
        return self._fetch_to_dataframe(
            LqcSummaryFetcherStub, filter_obj,
            "GetLqcSummaryList", "lqc_summary",
            custom_sql
        )
    
    def get_lqc_summary_stats(self, start_dt: str, end_dt: str,
                              product_groups: List[str]) -> pd.DataFrame:
        """取得 LQC Summary 統計資料"""
        custom_sql = """
            SELECT 
                product_group,
                COUNT(*) as total_count,
                AVG(value) as avg_value,
                STDDEV(value) as std_value
            FROM #lqc_summary#
            GROUP BY product_group
        """
        return self.get_lqc_summary(start_dt, end_dt, product_groups, custom_sql)
    
    def get_wat_summary(self, start_dt: str, end_dt: str,
                        lots: List[str]) -> pd.DataFrame:
        """取得 WAT Summary 資料"""
        from ieda_datafetcher.wat_summary_pb2 import WatSummaryFilter
        from ieda_datafetcher.wat_summary_pb2_grpc import WatSummaryFetcherStub
        
        filter_obj = WatSummaryFilter()
        filter_obj.startDt = start_dt
        filter_obj.endDt = end_dt
        filter_obj.lots.extend(lots)
        
        return self._fetch_to_dataframe(
            WatSummaryFetcherStub, filter_obj,
            "GetWatSummaryList", "wat_summary"
        )

# 使用範例
if __name__ == "__main__":
    service = IedaDataService()

    # 取得原始資料
    lqc_df = service.get_lqc_summary(
        start_dt="2025-09-01 00:00:00",
        end_dt="2025-09-01 03:00:00",
        product_groups=["GAA108"]
    )
    service.log.info(f"LQC Summary: {len(lqc_df)} 筆")

    # 取得統計資料
    stats_df = service.get_lqc_summary_stats(
        start_dt="2025-09-01 00:00:00",
        end_dt="2025-09-01 03:00:00",
        product_groups=["GAA108"]
    )
    service.log.info(f"LQC 統計: {len(stats_df)} 組")
    service.log.info(f"\n{stats_df}")
```

## 效能優化建議

### 1. 批次處理

```python
def fetch_in_batches(lots: List[str], batch_size: int = 100) -> pd.DataFrame:
    """分批擷取大量批號的資料"""
    all_data = []
    
    for i in range(0, len(lots), batch_size):
        batch_lots = lots[i:i + batch_size]
        log.info(f"處理批次 {i//batch_size + 1}: {len(batch_lots)} 筆批號")
        
        df = service.get_lqc_summary(
            start_dt="2025-09-01 00:00:00",
            end_dt="2025-09-01 23:59:59",
            lots=batch_lots
        )
        all_data.append(df)
    
    return pd.concat(all_data, ignore_index=True)
```

### 2. 快取機制

```python
import hashlib
import os
import pickle

class CachedIedaService:
    """帶快取的 iEDA 服務"""
    
    def __init__(self, cache_dir: str = "./cache"):
        self.service = IedaDataService()
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)
    
    def _get_cache_key(self, **kwargs) -> str:
        """產生快取鍵"""
        key_str = str(sorted(kwargs.items()))
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get_lqc_summary_cached(self, **kwargs) -> pd.DataFrame:
        """帶快取的 LQC Summary 擷取"""
        cache_key = self._get_cache_key(**kwargs)
        cache_file = os.path.join(self.cache_dir, f"{cache_key}.pkl")
        
        # 檢查快取
        if os.path.exists(cache_file):
            self.service.log.info(f"使用快取: {cache_key}")
            with open(cache_file, 'rb') as f:
                return pickle.load(f)
        
        # 擷取資料
        df = self.service.get_lqc_summary(**kwargs)
        
        # 儲存快取
        with open(cache_file, 'wb') as f:
            pickle.dump(df, f)
        
        return df
```

## 注意事項

1. **資源管理**：確保 ParquetUtil 使用 try-finally 釋放資源
2. **tid 一致性**：ParquetUtil 和 DuckDBUtil 的 tid 必須相同
3. **SQL 語法**：使用 `#table_name#` 參照表格
4. **錯誤處理**：妥善處理 gRPC 和網路例外
5. **效能考量**：大量資料建議分批處理
