---
name: wecpy-datafetcher
description: >
  Invoke for low-level semiconductor factory data fetching via gRPC stubs (FetcherFactory).
  Covers: iFDC (RawData/RawStatistic/UVA/RunData/LotRun/LotData/SVID/EqpModel),
  iEDA (LQC/WAT/CP/Defect/Lot/Wafer), ParquetUtil (gRPC→Parquet), DuckDBUtil (local SQL on Parquet).
  Keywords: FetcherFactory、gRPC stubs、iFDC、iEDA、半導體、製程參數、品質分析、UVA、RunData、
  LotRun、LotData、SVID、EqpModel、機台查詢、OOS、OOC、WAT、CP、Defect、LQC、晶圓、Parquet、DuckDB。
  Excludes high-level FdcClient→wecpy-fdc, DB queries→wecpy-database.
  WAT、CP、Defect、LQC、ifdc_datafetcher、ieda_datafetcher、ParquetUtil、DuckDBUtil。
  當使用者提到 FetcherFactory、gRPC stubs、低階資料擷取、iEDA、半導體製造資料、或需要直接呼叫 iFDC/iEDA 服務時，務必使用此技能。
  注意：若使用者提到 FdcClient、ml.core.fdc 或 fdc_config.yaml，應改用 wecpy-fdc 技能。
---

# wecpy 工廠資料擷取技能

本技能提供 wecpy 框架的工廠資料擷取指南，支援 FDC（製程資料）和 EDA（設備/品質資料）的高效能擷取。

> **前置條件**：請先閱讀 `wecpy-core` 技能了解 ConfigManager 初始化規範。

## Data Fetcher 概述

**Data Fetcher** 是由 A0IM 提供的新一代工廠資料存取方式，特點：

- 解決大量資料存取效能問題，取值速度可提升 **10 倍以上**
- 基於 **gRPC 協定**，不需要撰寫 SQL 語法
- 取代 EDWM + IMPALA + SQL 的傳統方式
- 支援大資料傳輸不中斷，有效掌握網路與記憶體用量

## 支援的 Data Fetcher

| 套件 | 用途 | 負責單位 | 資料類型 |
|-----|------|---------|---------|
| `ifdc-datafetcher` | FDC 製程資料 | MK22 | RawData, RawStatistic, UVAData, RunData, LotRun, LotData, Svid, EqpModel |
| `ieda-datafetcher` | EDA 品質/設備資料 | MK23 | LQC, WAT, CP, Defect 等 |

### 輔助工具

| 工具 | 來源 | 用途 |
|-----|------|------|
| `ParquetUtil` | ieda_datafetcher | gRPC 串流轉 Parquet 檔案 |
| `DuckDBUtil` | ieda_datafetcher | 本地 SQL 查詢 DataFrame |

## 安裝

```bash
# 必裝：wecpy 核心
pip install --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple \
    --trusted-host=10.18.20.121:8081 wecpy

# FDC Data Fetcher（視需要）
pip install --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple \
    --trusted-host=10.18.20.121:8081 ifdc-datafetcher

# EDA Data Fetcher（視需要）
pip install --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple \
    --trusted-host=10.18.20.121:8081 ieda-datafetcher
```

## FetcherFactory.create_client() 完整簽名

```python
from wecpy.data_fetcher import FetcherFactory

@staticmethod
def create_client(cls: Type[T], url: str = None, channel: grpc.Channel = None, data_center=None) → T:
    """
    建立 gRPC client 實例。
    Args:
        cls: Fetcher Stub 類別（例：RawDataFetcherStub）
        url: gRPC 端點 URL（選填）
        channel: 現有 gRPC channel（選填）
        data_center: 資料中心識別碼（選填，例：Location.KH）
    """
```

## Location 列舉

```python
from wecpy.data_fetcher.location import Location

class Location(Enum):
    KH = "kh"  # 高雄
    CT = "ct"  # 竹科
```

使用範例：

```python
# 指定高雄資料中心
fetcher = FetcherFactory.create_client(RawDataFetcherStub, data_center=Location.KH)

# 指定竹科資料中心
fetcher = FetcherFactory.create_client(RawDataFetcherStub, data_center=Location.CT)

# 不指定資料中心（使用預設）
fetcher = FetcherFactory.create_client(LqcSummaryFetcherStub)
```

## Data Fetcher 三層架構

Data Fetcher 由三個部份組成（類似 SQL 概念）：

| 元件 | 類比 SQL | 說明 |
|-----|---------|------|
| `<Data>FetcherStub` | Table | 建立資料來源的 Fetcher |
| `<Data>Filter` | WHERE | 建立 Filter 並指定條件 |
| `Result / Stream` | SELECT | 取得資料結果，可迴圈處理 |

## 快速開始：iFDC Data Fetcher

### FDC RawData 擷取

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.data_fetcher import FetcherFactory
from wecpy.data_fetcher.location import Location
from wecpy.utility.converter import Converter
from wecpy.log_manager import LogManager

# 安裝 ifdc_datafetcher 後才能 import
from ifdc_datafetcher.rawdata_pb2_grpc import RawDataFetcherStub
from ifdc_datafetcher.rawdata_pb2 import RecipeStepFilter, DateRange

log = LogManager.get_logger()

def get_fdc_rawdata():
    """取得 FDC RawData"""
    
    # 1. 建立 Fetcher（指定高雄資料中心）
    fetcher = FetcherFactory.create_client(RawDataFetcherStub, data_center=Location.KH)
    
    # 2. 建立 Filter 設定條件
    filter = RecipeStepFilter()
    filter.eqpId = "EKPLYA01"
    filter.chambers.extend(["EKPLYA01_PM3"])
    filter.parameters.extend(["GAS_6_O2_1000"])
    
    # 設定日期區間
    dateRange = DateRange()
    dateRange.start = "2025-06-01 17:00:00"
    dateRange.end = "2025-06-01 18:00:00"
    filter.dateRanges.extend([dateRange])
    
    # 3. 取得資料（串流回傳）
    response = fetcher.GetRawDataByFilter(filter)
    
    # 分批處理資料
    all_data = []
    for result in response:
        batch_size = len(result.data)
        log.info(f"收到批次: {batch_size} 筆")
        
        # 轉換成 DataFrame
        df = Converter.protobuf_to_dataframe(result.data)
        all_data.append(df)
    
    return pd.concat(all_data, ignore_index=True) if all_data else pd.DataFrame()

if __name__ == "__main__":
    df = get_fdc_rawdata()
    log.info(f"總共取得 {len(df)} 筆 FDC RawData")
```

## iFDC Fetcher 總覽

`ifdc-datafetcher` 提供 7 個 Fetcher、9 個方法：

| Fetcher | Filter | 方法 | 串流 | 用途 |
|---------|--------|------|------|------|
| `RawDataFetcherStub` | `RecipeStepFilter` | `GetRawDataByFilter` | Yes | 原始波形資料（Point/Value） |
| `RawDataFetcherStub` | `RecipeStepFilter` | `GetRawStatisticByFilter` | Yes | 統計資料（Mean/Stdev/Max/Min） |
| `UVADataFetcherStub` | `RecipeStepFilter` | `GetUVADataByFilter` | Yes | UVA 分析資料 |
| `RunDataFetcherStub` | `ParameterFilter` | `GetRunDataByFilter` | Yes | Run 層級彙總（含 OOS/OOC） |
| `LotRunFetcherStub` | `RequestFilter` | `GetLotRunByFilter` | Yes | Lot-Run 對應關係 |
| `LotDataFetcherStub` | `ParameterFilter` | `GetLotDataByFilter` | Yes | Lot 層級彙總（含 OOS/OOC） |
| `SvidFetcherStub` | `SvidFilter` | `GetSvidByFilter` | **No** | SVID/參數元資料查詢 |
| `EqpModelFetcherStub` | `EqpFilter` | `GetEqpChamber`, `GetEqpChamberRecipe` | **No** | 機台/Chamber 元資料、Recipe 對照查詢 |

> 串流 Fetcher 使用 `for result in response` 分批處理；非串流直接用 `response.data`。
> 詳細 Filter 欄位與 Response 欄位請參考 [iFDC Data Fetcher 詳解](references/fdc-fetcher.md)。

## 快速開始：iEDA Data Fetcher

### LQC Summary 資料擷取

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.data_fetcher import FetcherFactory
from wecpy.log_manager import LogManager

# 安裝 ieda_datafetcher 後才能 import
from ieda_datafetcher.parquet_util import ParquetUtil
from ieda_datafetcher.duckdb_util import DuckDBUtil
from ieda_datafetcher.lqc_summary_pb2 import LqcSummaryFilter
from ieda_datafetcher.lqc_summary_pb2_grpc import LqcSummaryFetcherStub

log = LogManager.get_logger()

def get_lqc_summary_data():
    """取得 LQC Summary 資料"""
    
    # 1. 建立 Fetcher
    client = FetcherFactory.create_client(LqcSummaryFetcherStub)
    
    # 2. 建立 Filter 設定條件
    filter = LqcSummaryFilter()
    filter.startDt = "2025-09-01 00:00:00"
    filter.endDt = "2025-09-01 03:00:00"
    filter.productGroups.extend(["GAA108"])
    
    # 3. 取得 gRPC 串流
    response_stream = client.GetLqcSummaryList(filter)
    
    # 4. 使用 ParquetUtil 寫入 Parquet 檔案
    pu = ParquetUtil()
    try:
        result = pu.write_grpc_stream_to_parquet(
            tid="LQC_SUMMARY",
            table_name="lqc_summary",
            grpc_stream=response_stream
        )
        log.info("gRPC 串流資料已寫入 Parquet 檔案")
    finally:
        pu.close()  # 確保資源釋放
    
    # 5. 使用 DuckDB 讀取為 DataFrame
    duck_util = DuckDBUtil()
    df = duck_util.query_to_dataframe("LQC_SUMMARY", "SELECT * FROM #lqc_summary#")
    
    log.info(f"取得 {len(df)} 筆 LQC Summary 資料")
    return df

if __name__ == "__main__":
    df = get_lqc_summary_data()
```

## iEDA 支援的資料類型

### 1. 通用資料 (Common Data)
| Fetcher | 說明 |
|---------|------|
| `CmnChipFetcher` | 晶片資料 |
| `CmnLotFetcher` | 批號資料 |
| `CmnLotWaferFetcher` | 批號晶圓資料 |
| `CmnProductFetcher` | 產品資料 |
| `CmnWaferFetcher` | 晶圓資料 |

### 2. LQC 資料 (Lot Quality Control)
| Fetcher | 說明 |
|---------|------|
| `LqcParamFetcher` | LQC 參數資料 |
| `LqcSummaryFetcher` | LQC 摘要資料 |
| `LqcSiteFetcher` | LQC 測試點資料 |
| `LqcRegionFetcher` | LQC 區域資料 |

### 3. WAT 資料 (Wafer Acceptance Test)
| Fetcher | 說明 |
|---------|------|
| `WatParamFetcher` | WAT 參數資料 |
| `WatSummaryFetcher` | WAT 摘要資料 |
| `WatSiteFetcher` | WAT 測試點資料 |
| `WatRegionFetcher` | WAT 區域資料 |

### 4. CP 資料 (Circuit Probing)
| Fetcher | 說明 |
|---------|------|
| `CpChipDcFetcher` | CP 晶片 DC 參數資料 |
| `CpSummaryFetcher` | CP 摘要資料 |
| `CpWaferFetcher` | CP 晶圓資料 |

### 5. Defect 資料
| Fetcher | 說明 |
|---------|------|
| `DefSummaryFetcher` | 缺陷摘要資料 |
| `DefSummaryClassFetcher` | 缺陷分類摘要 |
| `DefWaferFetcher` | 缺陷晶圓資料 |

## 詳細參考文件

- [iFDC Data Fetcher 詳解](references/fdc-fetcher.md) — 當使用者需要 FDC 各 Fetcher 的完整 Filter 欄位、Response 欄位、進階用法時閱讀
- [iEDA Data Fetcher 詳解](references/eda-fetcher.md) — 當使用者需要 EDA 各 Fetcher（LQC/WAT/CP/Defect/Common）的完整用法時閱讀
- [ParquetUtil 使用指南](references/parquet-util.md) — 當使用者需要 gRPC 串流轉 Parquet、檔案管理、Parquet 讀寫操作時閱讀
- [DuckDBUtil 使用指南](references/duckdb-util.md) — 當使用者需要本地 SQL 查詢 Parquet 資料、DuckDB 進階查詢語法時閱讀
- [資料工具整合範例](references/data-tools.md) — 當使用者需要 ParquetUtil + DuckDBUtil 整合使用、端到端資料處理流程時閱讀

## 資源檔案

- [DataFetcher config.yaml 模板](assets/datafetcher-config.yaml)

## 權限申請

若未申請 Data Fetcher 權限，執行時會出現以下錯誤：

| 錯誤類型 | 訊息 |
|---------|------|
| Unauthenticated | `Access denied. Authentication is required.` |
| PermissionDenied | `Access denied. You do not have permission to access.` |

請聯繫負責單位完成權限申請：
- **FDC Data Fetcher**：MK22
- **EDA Data Fetcher**：MK23

## 常見問題

### Q1：模組匯入失敗
```
原因：未安裝 ifdc-datafetcher 或 ieda-datafetcher
解決：
pip install --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple \
    --trusted-host=10.18.20.121:8081 ifdc-datafetcher
```

### Q2：gRPC 連線失敗
```
原因：網路問題或權限不足
解決：
1. 確認網路可連通 Data Fetcher 服務
2. 確認已申請 Data Fetcher 權限
3. 檢查日誌中的錯誤代碼
```

### Q3：查詢無資料
```
原因：條件設定問題或資料不存在
解決：
1. 確認 Filter 條件正確
2. 確認時間範圍內有資料
3. 確認 lot_id / equipment_id 存在
```
