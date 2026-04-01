# iEDA Data Fetcher 詳解

## 目錄

- [概述](#概述)
- [安裝](#安裝)
- [標準初始化順序](#標準初始化順序)
- [資料擷取流程](#資料擷取流程)
  - [完整範例：LQC Summary](#完整範例lqc-summary)
- [支援的 Fetcher 類型](#支援的-fetcher-類型)
  - [LQC (Lot Quality Control)](#lqc-lot-quality-control)
  - [WAT (Wafer Acceptance Test)](#wat-wafer-acceptance-test)
  - [CP (Circuit Probing)](#cp-circuit-probing)
  - [Defect](#defect)
  - [Common Data](#common-data)
- [Filter 常用屬性](#filter-常用屬性)
- [服務類別封裝](#服務類別封裝)
- [錯誤處理](#錯誤處理)
  - [gRPC 錯誤處理模式](#grpc-錯誤處理模式)
- [iFDC Fetcher 類型總覽](#ifdc-fetcher-類型總覽)
  - [Common Data](#common-data-1)
  - [CP Testing](#cp-testing)
  - [Defect](#defect-1)
  - [LQC](#lqc)
  - [WAT](#wat)
- [最佳實務](#最佳實務)
  - [1. 使用 batch processing 處理大量資料](#1-使用-batch-processing-處理大量資料)
  - [2. 善用 caching 避免重複查詢](#2-善用-caching-避免重複查詢)
  - [3. 使用 ParquetUtil 儲存中間結果](#3-使用-parquetutil-儲存中間結果)
  - [4. 使用 DuckDB 進行本地分析](#4-使用-duckdb-進行本地分析)
- [常見問題](#常見問題)
  - [Q1：權限不足](#q1權限不足)
  - [Q2：模組找不到](#q2模組找不到)
  - [Q3：Parquet 寫入失敗](#q3parquet-寫入失敗)
- [參考資源](#參考資源)


本文件詳細說明 wecpy 框架中 iEDA Data Fetcher（EDA 品質/設備資料擷取）的使用方式。

## 概述

iEDA Data Fetcher 用於擷取半導體製造品質資料，包含 LQC、WAT、CP、Defect 等多種資料類型，基於 gRPC 協定提供高效能資料存取。

**負責單位**：MK23  
**Python 版本**：3.10 ~ 3.14

## 安裝

```bash
pip install --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple \
    --trusted-host=10.18.20.121:8081 ieda-datafetcher
```

## 標準初始化順序

```python
# 步驟 1：ConfigManager 必須最先初始化
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

# 步驟 2：wecpy 核心模組
from wecpy.log_manager import LogManager
from wecpy.data_fetcher import FetcherFactory

# 步驟 3：iEDA 工具模組（安裝後才能匯入）
from ieda_datafetcher.parquet_util import ParquetUtil
from ieda_datafetcher.duckdb_util import DuckDBUtil

# 步驟 4：特定資料類型的 Fetcher 和 Filter
from ieda_datafetcher.lqc_summary_pb2 import LqcSummaryFilter
from ieda_datafetcher.lqc_summary_pb2_grpc import LqcSummaryFetcherStub

# 步驟 5：初始化日誌
log = LogManager.get_logger()
```

## 資料擷取流程

iEDA Data Fetcher 採用統一的資料擷取流程：

```
建立 Fetcher → 設定 Filter → 取得 gRPC Stream → ParquetUtil 寫入 → DuckDBUtil 查詢
```

### 完整範例：LQC Summary

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

def get_lqc_summary(start_dt: str, end_dt: str, product_groups: list) -> pd.DataFrame:
    """
    取得 LQC Summary 資料
    
    Args:
        start_dt: 開始時間 (YYYY-MM-DD HH:MM:SS)
        end_dt: 結束時間 (YYYY-MM-DD HH:MM:SS)
        product_groups: 產品群組清單
    
    Returns:
        pd.DataFrame: LQC Summary 資料
    """
    log.info("開始擷取 LQC Summary 資料")
    
    try:
        # 1. 建立 Fetcher
        client = FetcherFactory.create_client(LqcSummaryFetcherStub)
        
        # 2. 建立 Filter
        filter = LqcSummaryFilter()
        filter.startDt = start_dt
        filter.endDt = end_dt
        filter.productGroups.extend(product_groups)
        
        # 3. 取得 gRPC 串流
        response_stream = client.GetLqcSummaryList(filter)
        
        # 4. 使用 ParquetUtil 寫入 Parquet
        pu = ParquetUtil()
        try:
            result = pu.write_grpc_stream_to_parquet(
                tid="LQC_SUMMARY",
                table_name="lqc_summary",
                grpc_stream=response_stream
            )
            log.info("gRPC 串流已寫入 Parquet")
        finally:
            pu.close()
        
        # 5. 使用 DuckDB 讀取為 DataFrame
        duck_util = DuckDBUtil()
        df = duck_util.query_to_dataframe(
            "LQC_SUMMARY", 
            "SELECT * FROM #lqc_summary#"
        )
        
        log.info(f"LQC Summary 擷取完成: {len(df)} 筆")
        return df
        
    except Exception as e:
        log.error(f"LQC Summary 擷取失敗: {e}")
        raise

if __name__ == "__main__":
    df = get_lqc_summary(
        start_dt="2025-09-01 00:00:00",
        end_dt="2025-09-01 03:00:00",
        product_groups=["GAA108"]
    )
    log.info(f"取得 {len(df)} 筆資料")
```

## 支援的 Fetcher 類型

### LQC (Lot Quality Control)

| Fetcher Stub | Filter | 方法 | 說明 |
|--------------|--------|------|------|
| `LqcSummaryFetcherStub` | `LqcSummaryFilter` | `GetLqcSummaryList` | LQC 摘要 |
| `LqcParamFetcherStub` | `LqcParamFilter` | `GetLqcParamList` | LQC 參數 |
| `LqcSiteFetcherStub` | `LqcSiteFilter` | `GetLqcSiteList` | LQC 測試點 |
| `LqcRegionFetcherStub` | `LqcRegionFilter` | `GetLqcRegionList` | LQC 區域 |

### WAT (Wafer Acceptance Test)

| Fetcher Stub | Filter | 方法 | 說明 |
|--------------|--------|------|------|
| `WatSummaryFetcherStub` | `WatSummaryFilter` | `GetWatSummaryList` | WAT 摘要 |
| `WatParamFetcherStub` | `WatParamFilter` | `GetWatParamList` | WAT 參數 |
| `WatSiteFetcherStub` | `WatSiteFilter` | `GetWatSiteList` | WAT 測試點 |
| `WatRegionFetcherStub` | `WatRegionFilter` | `GetWatRegionList` | WAT 區域 |

### CP (Circuit Probing)

| Fetcher Stub | Filter | 方法 | 說明 |
|--------------|--------|------|------|
| `CpSummaryFetcherStub` | `CpSummaryFilter` | `GetCpSummaryList` | CP 摘要 |
| `CpChipDcFetcherStub` | `CpChipDcFilter` | `GetCpChipDcList` | CP 晶片 DC |
| `CpWaferFetcherStub` | `CpWaferFilter` | `GetCpWaferList` | CP 晶圓 |

### Defect

| Fetcher Stub | Filter | 方法 | 說明 |
|--------------|--------|------|------|
| `DefSummaryFetcherStub` | `DefSummaryFilter` | `GetDefSummaryList` | 缺陷摘要 |
| `DefWaferFetcherStub` | `DefWaferFilter` | `GetDefWaferList` | 缺陷晶圓 |

### Common Data

| Fetcher Stub | Filter | 方法 | 說明 |
|--------------|--------|------|------|
| `CmnLotFetcherStub` | `CmnLotFilter` | `GetCmnLotList` | 批號資料 |
| `CmnWaferFetcherStub` | `CmnWaferFilter` | `GetCmnWaferList` | 晶圓資料 |
| `CmnProductFetcherStub` | `CmnProductFilter` | `GetCmnProductList` | 產品資料 |

## Filter 常用屬性

不同 Filter 支援的屬性略有不同，常見屬性：

```python
# 時間範圍
filter.startDt = "2025-09-01 00:00:00"
filter.endDt = "2025-09-01 03:00:00"

# 批號清單
filter.lots.extend(["61465S300D0", "61465S300D1"])

# 產品群組
filter.productGroups.extend(["GAA108"])

# 設備
filter.eqpIds.extend(["EQ001", "EQ002"])
```

## 服務類別封裝

建議將 iEDA 操作封裝為服務類別：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.data_fetcher import FetcherFactory
from wecpy.log_manager import LogManager

from ieda_datafetcher.parquet_util import ParquetUtil
from ieda_datafetcher.duckdb_util import DuckDBUtil

import pandas as pd
from typing import List, Optional

class IedaDataService:
    """iEDA Data Fetcher 統一服務介面"""
    
    def __init__(self):
        self.log = LogManager.get_logger()
        self.log.info("iEDA Data Service 初始化完成")
    
    def _fetch_data(self, fetcher_stub, filter_obj, method_name: str, 
                    tid: str, table_name: str) -> pd.DataFrame:
        """通用資料擷取方法"""
        try:
            # 建立 Fetcher
            client = FetcherFactory.create_client(fetcher_stub)
            
            # 呼叫對應方法
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
            
            # 讀取為 DataFrame
            duck_util = DuckDBUtil()
            df = duck_util.query_to_dataframe(tid, f"SELECT * FROM #{table_name}#")
            
            self.log.info(f"{table_name} 擷取完成: {len(df)} 筆")
            return df
            
        except Exception as e:
            self.log.error(f"{table_name} 擷取失敗: {e}")
            raise
    
    def get_lqc_summary(self, start_dt: str, end_dt: str, 
                        product_groups: List[str]) -> pd.DataFrame:
        """取得 LQC Summary"""
        from ieda_datafetcher.lqc_summary_pb2 import LqcSummaryFilter
        from ieda_datafetcher.lqc_summary_pb2_grpc import LqcSummaryFetcherStub
        
        filter_obj = LqcSummaryFilter()
        filter_obj.startDt = start_dt
        filter_obj.endDt = end_dt
        filter_obj.productGroups.extend(product_groups)
        
        return self._fetch_data(
            LqcSummaryFetcherStub, filter_obj, 
            "GetLqcSummaryList", "LQC_SUMMARY", "lqc_summary"
        )
    
    def get_wat_summary(self, start_dt: str, end_dt: str,
                        lots: List[str]) -> pd.DataFrame:
        """取得 WAT Summary"""
        from ieda_datafetcher.wat_summary_pb2 import WatSummaryFilter
        from ieda_datafetcher.wat_summary_pb2_grpc import WatSummaryFetcherStub
        
        filter_obj = WatSummaryFilter()
        filter_obj.startDt = start_dt
        filter_obj.endDt = end_dt
        filter_obj.lots.extend(lots)
        
        return self._fetch_data(
            WatSummaryFetcherStub, filter_obj,
            "GetWatSummaryList", "WAT_SUMMARY", "wat_summary"
        )

# 使用範例
if __name__ == "__main__":
    service = IedaDataService()

    lqc_df = service.get_lqc_summary(
        start_dt="2025-09-01 00:00:00",
        end_dt="2025-09-01 03:00:00",
        product_groups=["GAA108"]
    )
    service.log.info(f"LQC Summary: {len(lqc_df)} 筆")
```

## 錯誤處理

### gRPC 錯誤處理模式

```python
import grpc
from grpc import RpcError

def safe_fetch(fetcher_stub, filter_obj, method_name):
    """安全的資料擷取"""
    try:
        client = FetcherFactory.create_client(fetcher_stub)
        method = getattr(client, method_name)
        return method(filter_obj)
        
    except RpcError as e:
        log.error(f"gRPC 錯誤: {e.code()} - {e.details()}")
        return None
        
    except ConnectionError as e:
        log.error(f"連線錯誤: {e}")
        return None
        
    except TimeoutError as e:
        log.error(f"逾時錯誤: {e}")
        return None
        
    except ImportError as e:
        log.error(f"模組匯入失敗，請確認已安裝 ieda_datafetcher: {e}")
        return None
        
    except Exception as e:
        log.error(f"未預期錯誤: {e}")
        return None
```

## iFDC Fetcher 類型總覽

iEDA 也可搭配 iFDC Data Fetcher 使用。以下為 iFDC 提供的完整 Fetcher 類型：

### Common Data

| Fetcher Stub | 說明 |
|--------------|------|
| `LotRunFetcherStub` | Lot-Run 對應關係 |
| `RunDataFetcherStub` | Run 層級彙總（含 OOS/OOC） |
| `EqpModelFetcherStub` | 機台/Chamber 元資料 |
| `SvidFetcherStub` | SVID/參數元資料 |
| `LotDataFetcherStub` | Lot 層級彙總（含 OOS/OOC） |
| `UVADataFetcherStub` | UVA 分析資料 |

### CP Testing

| Fetcher Stub | 說明 |
|--------------|------|
| `CpBinFetcherStub` | CP Bin 資料 |
| `CpBinWaferFetcherStub` | CP Bin 晶圓資料 |
| `CpDefectFetcherStub` | CP 缺陷資料 |
| `CpRawFetcherStub` | CP 原始資料 |
| `CpRawNstedFetcherStub` | CP 巢狀原始資料 |
| `CpSummaryFetcherStub` | CP 摘要資料 |
| `CpSummaryWaferFetcherStub` | CP 摘要晶圓資料 |

### Defect

| Fetcher Stub | 說明 |
|--------------|------|
| `DefectInlineFetcherStub` | Inline 缺陷資料 |
| `DefectRawFetcherStub` | 缺陷原始資料 |
| `DefectSummaryFetcherStub` | 缺陷摘要資料 |

### LQC

| Fetcher Stub | 說明 |
|--------------|------|
| `LqcDetailFetcherStub` | LQC 明細資料 |
| `LqcRawDataFetcherStub` | LQC 原始資料 |
| `LqcSummaryFetcherStub` | LQC 摘要資料 |
| `LqcSummaryWaferFetcherStub` | LQC 摘要晶圓資料 |

### WAT

| Fetcher Stub | 說明 |
|--------------|------|
| `WatRawDataFetcherStub` | WAT 原始資料 |
| `WatSummaryFetcherStub` | WAT 摘要資料 |
| `WatSummaryWaferFetcherStub` | WAT 摘要晶圓資料 |
| `WatParameterFetcherStub` | WAT 參數資料 |

## 最佳實務

### 1. 使用 batch processing 處理大量資料

將大量查詢分批處理，避免單次查詢過大導致逾時或記憶體不足：

```python
# 分批查詢多個產品群組
product_groups = ["GAA108", "GAA109", "GAA110"]
all_results = []

for pg in product_groups:
    df = service.get_lqc_summary(
        start_dt="2025-09-01 00:00:00",
        end_dt="2025-09-01 23:59:59",
        product_groups=[pg]
    )
    all_results.append(df)

combined_df = pd.concat(all_results, ignore_index=True)
```

### 2. 善用 caching 避免重複查詢

對於短時間內不會變動的資料（如元資料），快取查詢結果：

```python
import functools

@functools.lru_cache(maxsize=128)
def get_equipment_list(module: str) -> tuple:
    """快取機台清單查詢結果"""
    fetcher = FetcherFactory.create_client(EqpModelFetcherStub)
    filter = EqpFilter()
    filter.module = module
    response = fetcher.GetEqpChamber(filter)
    df = Converter.protobuf_to_dataframe(response.data)
    return tuple(df['eqpId'].unique())
```

### 3. 使用 ParquetUtil 儲存中間結果

大量資料先存成 Parquet 檔案，避免重複從 gRPC 擷取：

```python
pu = ParquetUtil()
try:
    pu.write_grpc_stream_to_parquet(
        tid="ANALYSIS_DATA",
        table_name="raw_data",
        grpc_stream=response_stream
    )
finally:
    pu.close()
```

### 4. 使用 DuckDB 進行本地分析

搭配 DuckDB 在本地端進行高效能 SQL 分析，減少對遠端服務的負擔：

```python
duck_util = DuckDBUtil()

# 進行聚合分析
summary = duck_util.query_to_dataframe(
    "ANALYSIS_DATA",
    """
    SELECT product_group, COUNT(*) as cnt, AVG(value) as avg_val
    FROM #raw_data#
    GROUP BY product_group
    ORDER BY cnt DESC
    """
)
```

## 常見問題

### Q1：權限不足
```
錯誤：Access denied. You do not have permission to access.
解決：聯繫 MK23 申請 EDA Data Fetcher 權限
```

### Q2：模組找不到
```
錯誤：ModuleNotFoundError: No module named 'ieda_datafetcher'
解決：安裝 ieda-datafetcher 套件
```

### Q3：Parquet 寫入失敗
```
原因：資源未正確釋放或磁碟空間不足
解決：
1. 確保使用 try-finally 釋放 ParquetUtil
2. 檢查磁碟空間
3. 檢查寫入權限
```

## 參考資源

- **官方文件**：https://ieda/docs/python/index.html
- **Getting Started**：https://ieda/docs/python/start.html
- **支援團隊**：MK23
