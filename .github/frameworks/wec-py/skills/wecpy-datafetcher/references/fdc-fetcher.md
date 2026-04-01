# iFDC Data Fetcher 詳解

本文件詳細說明 `ifdc-datafetcher` 套件提供的所有 Fetcher 使用方式。

## 目錄

- [概述](#概述)
- [FetcherFactory.create_client() 完整簽名](#fetcherfactorycreate_client-完整簽名)
- [Location 列舉](#location-列舉)
- [Converter 工具方法](#converter-工具方法)
- [標準初始化順序](#標準初始化順序)
- [支援的 Fetcher 總覽](#支援的-fetcher-總覽)
- [共通使用模式](#共通使用模式)
  - [串流處理（5 個串流 Fetcher 通用）](#串流處理5-個串流-fetcher-通用)
  - [非串流處理（Svid、EqpModel）](#非串流處理svideqpmodel)
  - [兩種查詢模式](#兩種查詢模式)
  - [DateRange 與 Wafer 共通類別](#daterange-與-wafer-共通類別)
- [各 Fetcher 詳解](#各-fetcher-詳解)
  - [1. RawDataFetcherStub](#1-rawdatafetcherstub)
  - [2. UVADataFetcherStub](#2-uvadatafetcherstub)
  - [3. RunDataFetcherStub](#3-rundatafetcherstub)
  - [4. LotRunFetcherStub](#4-lotrunfetcherstub)
  - [5. LotDataFetcherStub](#5-lotdatafetcherstub)
  - [6. SvidFetcherStub](#6-svidfetcherstub)
  - [7. EqpModelFetcherStub](#7-eqpmodelfetcherstub)
- [錯誤處理](#錯誤處理)
- [常見問題](#常見問題)
  - [Q1：權限不足](#q1權限不足)
  - [Q2：連線逾時](#q2連線逾時)
  - [Q3：無資料回傳](#q3無資料回傳)
  - [Q4：LotData 的 ParameterFilter 找不到 chambers 欄位](#q4lotdata-的-parameterfilter-找不到-chambers-欄位)
  - [Q5：EqpModelFetcher 沒有 GetEqpModelByFilter 方法](#q5eqpmodelfetcher-沒有-geteqpmodelbyfilter-方法)


## 概述

iFDC Data Fetcher 用於擷取 FDC（Fault Detection and Classification）製程資料，基於 gRPC 協定提供高效能的資料存取。套件共提供 **7 個 Fetcher**、**8 個方法**。

**負責單位**：MK22

**安裝**：

```bash
pip install --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple \
    --trusted-host=10.18.20.121:8081 ifdc-datafetcher
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

## Converter 工具方法

```python
from wecpy.utility.converter import Converter

# Timestamp 轉換方法
Converter.to_utc_timestamp_from_datetime(dt: datetime) → Timestamp
Converter.to_utc_timestamp(year, month, day, hour=0, minute=0, second=0) → Timestamp
Converter.to_utc_datetime_from_datetime(dt: datetime) → datetime
Converter.to_utc_datetime(year, month, day, hour=0, minute=0, second=0) → datetime
Converter.utc_timestamp_to_datetime(pb2_timestamp) → datetime

# DataFrame 轉換
Converter.protobuf_to_dataframe(protobuf_obj: Message) → pd.DataFrame
```

## 標準初始化順序

所有 Fetcher 使用前都需要執行以下初始化：

```python
# 1. ConfigManager 初始化（必須最先執行）
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

# 2. wecpy 核心模組
from wecpy.data_fetcher import FetcherFactory
from wecpy.data_fetcher.location import Location
from wecpy.utility.converter import Converter
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

# 3. 匯入所需的 Fetcher（依需求選擇）
from ifdc_datafetcher.<module>_pb2_grpc import <Fetcher>Stub
from ifdc_datafetcher.<module>_pb2 import <Filter>, DateRange
```

## 支援的 Fetcher 總覽

| Fetcher | Import 模組 | Filter 類別 | 方法 | 串流 |
|---------|------------|------------|------|------|
| `RawDataFetcherStub` | `rawdata_pb2_grpc` / `rawdata_pb2` | `RecipeStepFilter` | `GetRawDataByFilter` | Yes |
| `RawDataFetcherStub` | （同上） | `RecipeStepFilter` | `GetRawStatisticByFilter` | Yes |
| `UVADataFetcherStub` | `uvadata_pb2_grpc` / `uvadata_pb2` | `RecipeStepFilter` | `GetUVADataByFilter` | Yes |
| `RunDataFetcherStub` | `rundata_pb2_grpc` / `rundata_pb2` | `ParameterFilter` | `GetRunDataByFilter` | Yes |
| `LotRunFetcherStub` | `lotrun_pb2_grpc` / `lotrun_pb2` | `RequestFilter` | `GetLotRunByFilter` | Yes |
| `LotDataFetcherStub` | `lotdata_pb2_grpc` / `lotdata_pb2` | `ParameterFilter` | `GetLotDataByFilter` | Yes |
| `SvidFetcherStub` | `svid_pb2_grpc` / `svid_pb2` | `SvidFilter` | `GetSvidByFilter` | **No** |
| `EqpModelFetcherStub` | `eqpmodel_pb2_grpc` / `eqpmodel_pb2` | `EqpFilter` | `GetEqpChamber` | **No** |

**Filter 家族說明**：

| Filter 類別 | 使用者 | 特色欄位 |
|------------|--------|---------|
| `RecipeStepFilter` | RawData、UVA | 最完整：含 chambers、parameters、svids、recipeSteps/windows |
| `ParameterFilter` | RunData、LotData | 中等：含 parameters、svids。RunData 版多了 chambers、wafers |
| `RequestFilter` | LotRun | 最精簡：無 chambers、parameters、svids |
| `SvidFilter` | Svid | 特殊：含 dataType（RAW/UVA/RSM/LSM），查詢 SVID 元資料 |
| `EqpFilter` | EqpModel | 特殊：含 module、toolType，查詢機台元資料，支援萬用字元 |

## 共通使用模式

### 串流處理（5 個串流 Fetcher 通用）

以 RawData 為基本 pattern 示範完整流程：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.data_fetcher import FetcherFactory
from wecpy.data_fetcher.location import Location
from wecpy.utility.converter import Converter
from wecpy.log_manager import LogManager

from ifdc_datafetcher.rawdata_pb2_grpc import RawDataFetcherStub
from ifdc_datafetcher.rawdata_pb2 import RecipeStepFilter, DateRange

import pandas as pd

log = LogManager.get_logger()

# 1. 建立 Fetcher（指定資料中心）
fetcher = FetcherFactory.create_client(RawDataFetcherStub, data_center=Location.KH)

# 2. 建立 Filter
filter = RecipeStepFilter()
filter.eqpId = "EKPLYA01"
filter.chambers.extend(["EKPLYA01_PM3"])
filter.parameters.extend(["GAS_6_O2_1000"])

dateRange = DateRange()
dateRange.start = "2025-06-01 17:00:00"
dateRange.end = "2025-06-01 18:00:00"
filter.dateRanges.extend([dateRange])

# 3. 執行查詢（串流回傳）
response = fetcher.GetRawDataByFilter(filter)

# 4. 分批處理串流資料
all_data = []
for result in response:
    batch_size = len(result.data)
    log.info(f"收到批次: {batch_size} 筆")
    df = Converter.protobuf_to_dataframe(result.data)
    all_data.append(df)

final_df = pd.concat(all_data, ignore_index=True) if all_data else pd.DataFrame()
log.info(f"總共取得 {len(final_df)} 筆資料")
```

> **其他串流 Fetcher**（UVA、RunData、LotRun、LotData）的處理方式完全相同，
> 差異僅在 import 路徑、Filter 類別和方法名稱，見各 Fetcher 詳解。

### 非串流處理（Svid、EqpModel）

非串流 Fetcher 直接回傳結果，**不需要 for loop**：

```python
# 非串流：直接取得 response.data
response = fetcher.GetSvidByFilter(filter)
df = Converter.protobuf_to_dataframe(response.data)
```

### 兩種查詢模式

串流 Fetcher 的 Filter 支援兩種互斥的查詢模式：

| 模式 | 必填欄位 | 適用情境 |
|------|---------|---------|
| **機台 + 時間範圍** | `eqpId` + `dateRanges` | 依機台和時間區間查詢 |
| **批號查詢** | `lots` | 依 Lot ID 查詢 |

```python
# 模式 1：機台 + 時間範圍
filter.eqpId = "EKPLYA01"
dateRange = DateRange()
dateRange.start = "2025-06-01 17:00:00"
dateRange.end = "2025-06-01 18:00:00"
filter.dateRanges.extend([dateRange])

# 模式 2：批號查詢
filter.lots.extend(["65015D300", "65015D301"])
```

> 兩種模式擇一使用，不可同時指定。

### DateRange 與 Wafer 共通類別

多個 Filter 共用以下類別：

**DateRange**（時間格式：`yyyy-MM-dd HH:mm:ss`）：

| 欄位 | 類型 | 說明 |
|------|------|------|
| `start` | string | 起始時間 |
| `end` | string | 結束時間 |

**Wafer**：

| 欄位 | 類型 | 說明 |
|------|------|------|
| `lot` | string | 批號（例：65015D300） |
| `slot` | int32 | 插槽編號（例：1, 2, 3, 24, 25） |

## 各 Fetcher 詳解

---

### 1. RawDataFetcherStub

擷取 FDC 原始製程資料，提供兩個方法：RawData（含 Point/Value 原始波形）和 RawStatistic（僅統計值）。

**Import**：

```python
from ifdc_datafetcher.rawdata_pb2_grpc import RawDataFetcherStub
from ifdc_datafetcher.rawdata_pb2 import RecipeStepFilter, DateRange
```

**方法**：

| 方法 | 說明 | 資料量 |
|------|------|-------|
| `GetRawDataByFilter` | 原始資料（含 Point/Value 波形） | 較大，查詢較慢 |
| `GetRawStatisticByFilter` | 統計資料（Mean/Stdev/Max/Min） | 較小，查詢較快 |

**Filter：`RecipeStepFilter`**

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `eqpId` | string | 擇一 ★ | 機台 ID |
| `dateRanges` | DateRange | 擇一 ★ | 時間範圍（與 eqpId 搭配） |
| `lots` | string[] | 擇一 ★ | 批號清單（與 eqpId+dateRanges 擇一） |
| `chambers` | string[] | 選填 | Chamber 清單 |
| `recipes` | string[] | 選填 | Recipe 清單 |
| `products` | string[] | 選填 | 產品清單（支援尾端萬用字元，如 EAG080*） |
| `mesSteps` | string[] | 選填 | MES 步驟清單 |
| `parameters` | string[] | 選填 | 製程參數清單 |
| `svids` | string[] | 選填 | SVID 清單 |
| `recipeSteps` | string[] | 選填 | Recipe Step 清單 |
| `wafers` | Wafer[] | 選填 | Wafer 清單 |

> ★ 必須提供 `eqpId` + `dateRanges` 或 `lots` 其中一組。

**Response：`RawData`（GetRawDataByFilter）**

| 欄位 | 類型 | 說明 |
|------|------|------|
| `eqpId` | string | 機台 ID |
| `chamber` | string | Chamber |
| `runId` | int32 | Run ID |
| `svid` | string | Sensor Value ID |
| `parameter` | string | 參數名稱 |
| `recipe` | string | Recipe |
| `recipeStep` | string | Recipe Step |
| `cycleNumber` | int32 | Cycle 編號 |
| `point` | string? | Point 清單（波形 X 軸） |
| `value` | string? | Value 清單（波形 Y 軸） |
| `firstPoint` | double? | 第一個 Point |
| `pointCount` | int32 | 資料點數 |
| `mean` | double? | 平均值 |
| `stdev` | double? | 標準差 |
| `max` | double? | 最大值 |
| `min` | double? | 最小值 |
| `runStartTime` | string | Run 開始時間 |
| `runEndTime` | string | Run 結束時間 |
| `lotId` | string | 批號 |
| `product` | string | 產品 |
| `step` | string | 製程步驟 |
| `carrier` | string | 載具 ID |
| `ppId` | string | Process Program ID |
| `lotType` | string | 批號類型 |
| `tech` | string | 技術 |
| `trackInTime` | string? | Track-in 時間 |
| `stepCode` | string | Step Code |
| `loadPort` | string | Load Port |
| `ppidGroup` | string | PPID Group |
| `badRun` | string | Bad Run 指標 |
| `abnormal` | int32 | 異常指標 |
| `toolState` | string | 機台狀態 |
| `chamberState` | string | Chamber 狀態 |
| `processTime` | double | 加工時間 |
| `stepCount` | int32 | Step 數 |
| `distStepCount` | int32 | Distinct Step 數 |
| `quality` | double | FDC 資料品質 |
| `workCenter` | string | Work Center |
| `eaJobId` | string | EA Job ID |
| `aliasId` | string | Alias ID（Lot + slotNo） |
| `waferId` | string | Wafer ID（T-7 Code） |
| `slotNo` | string | Slot 編號 |

**Response：`RawStatistic`（GetRawStatisticByFilter）**

與 RawData 結構相似，主要差異：
- **無** `point`、`value` 欄位（不含波形資料）
- **有** `mean`、`stdev`、`max`、`min` 統計欄位
- 欄位命名略有不同：`carrier` → `carrierId`、`tech` → `techCd`、`loadPort` → `portId`

**程式碼範例**：

```python
# GetRawDataByFilter（串流）
response = fetcher.GetRawDataByFilter(filter)
for result in response:
    df = Converter.protobuf_to_dataframe(result.data)

# GetRawStatisticByFilter（串流，同一個 filter）
response = fetcher.GetRawStatisticByFilter(filter)
for result in response:
    df = Converter.protobuf_to_dataframe(result.data)
```

---

### 2. UVADataFetcherStub

擷取 UVA（Univariate Analysis）分析資料，包含 window、statistic、value 等 UVA 特有欄位。

**Import**：

```python
from ifdc_datafetcher.uvadata_pb2_grpc import UVADataFetcherStub
from ifdc_datafetcher.uvadata_pb2 import RecipeStepFilter, DateRange
```

**方法**：`GetUVADataByFilter`（串流）

**Filter：`RecipeStepFilter`**

與 RawData 的 RecipeStepFilter 相同，但 `recipeSteps` 替換為 `windows`：

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `eqpId` | string | 擇一 ★ | 機台 ID |
| `dateRanges` | DateRange | 擇一 ★ | 時間範圍 |
| `lots` | string[] | 擇一 ★ | 批號清單 |
| `chambers` | string[] | 選填 | Chamber 清單 |
| `recipes` | string[] | 選填 | Recipe 清單 |
| `products` | string[] | 選填 | 產品清單（支援尾端萬用字元） |
| `mesSteps` | string[] | 選填 | MES 步驟清單 |
| `parameters` | string[] | 選填 | 參數清單 |
| `svids` | string[] | 選填 | SVID 清單 |
| `windows` | string[] | 選填 | UVA Window 清單（取代 recipeSteps） |
| `wafers` | Wafer[] | 選填 | Wafer 清單 |

**Response：`UvaData`**

與 RawData 共用多數 Run 資訊欄位，UVA 特有欄位：

| 欄位 | 類型 | 說明 |
|------|------|------|
| `window` | string | UVA Window 名稱 |
| `statistic` | string | UVA Statistic 名稱 |
| `value` | double? | UVA 分析值 |
| `status` | string | 資料狀態 |
| `seqId` | double | 序列 ID |
| `collectionName` | string | Collection 名稱 |
| `collectionKey` | int32 | Collection Key |
| `contextGroup` | string | Context Group |

UVA 特有 **SPC 控制限欄位**（品質分析用）：

| 欄位 | 類型 | 說明 |
|------|------|------|
| `upperCritical` | double? | 上臨界限 |
| `upperOutlier` | double? | 上異常限 |
| `upperWarning` | double? | 上警告限 |
| `lowerCritical` | double? | 下臨界限 |
| `lowerOutlier` | double? | 下異常限 |
| `lowerWarning` | double? | 下警告限 |
| `limitType` | string? | 限值類型 |
| `target` | double? | 目標值 |

> 其餘欄位（eqpId、chamber、runId、svid、parameter、recipe、recipeStep、lotId、product、step 等 Run 資訊）與 RawData 相同。

**程式碼片段**：

```python
from ifdc_datafetcher.uvadata_pb2_grpc import UVADataFetcherStub
from ifdc_datafetcher.uvadata_pb2 import RecipeStepFilter, DateRange

fetcher = FetcherFactory.create_client(UVADataFetcherStub, data_center=Location.KH)

filter = RecipeStepFilter()
filter.eqpId = "EKPLYA01"
filter.chambers.extend(["EKPLYA01_PM3"])
filter.parameters.extend(["GAS_6_O2_1000"])

dateRange = DateRange()
dateRange.start = "2025-06-01 17:00:00"
dateRange.end = "2025-06-01 18:00:00"
filter.dateRanges.extend([dateRange])

response = fetcher.GetUVADataByFilter(filter)
for result in response:
    df = Converter.protobuf_to_dataframe(result.data)
```

---

### 3. RunDataFetcherStub

擷取 Run 層級的彙總資料，每筆記錄代表一個 Run 中單一參數的統計值。包含 OOS/OOC 指標。

**Import**：

```python
from ifdc_datafetcher.rundata_pb2_grpc import RunDataFetcherStub
from ifdc_datafetcher.rundata_pb2 import ParameterFilter, DateRange
```

**方法**：`GetRunDataByFilter`（串流）

**Filter：`ParameterFilter`（RunData 版）**

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `eqpId` | string | 擇一 ★ | 機台 ID |
| `dateRanges` | DateRange | 擇一 ★ | 時間範圍 |
| `lots` | string[] | 擇一 ★ | 批號清單 |
| `chambers` | string[] | 選填 | Chamber 清單 |
| `recipes` | string[] | 選填 | Recipe 清單 |
| `products` | string[] | 選填 | 產品清單（支援尾端萬用字元） |
| `mesSteps` | string[] | 選填 | MES 步驟清單 |
| `parameters` | string[] | 選填 | 參數清單 |
| `svids` | string[] | 選填 | SVID 清單 |
| `wafers` | Wafer[] | 選填 | Wafer 清單 |

**Response：`RunData`**

RunData 特有欄位：

| 欄位 | 類型 | 說明 |
|------|------|------|
| `oos` | string | Out of Specification 指標 |
| `ooc` | string | Out of Control 指標 |
| `svidIndex` | int32 | SVID 索引 |
| `value` | double? | Run 統計值 |

> 其餘欄位（eqpId、chamber、runId、svid、parameter、recipe、lotId、product、step 等 Run 資訊）與 RawData 相同。

**程式碼片段**：

```python
from ifdc_datafetcher.rundata_pb2_grpc import RunDataFetcherStub
from ifdc_datafetcher.rundata_pb2 import ParameterFilter, DateRange

fetcher = FetcherFactory.create_client(RunDataFetcherStub, data_center=Location.KH)

filter = ParameterFilter()
filter.eqpId = "EKPLYA01"
filter.chambers.extend(["EKPLYA01_PM3"])
filter.parameters.extend(["GAS_6_O2_1000"])

dateRange = DateRange()
dateRange.start = "2025-06-01 17:00:00"
dateRange.end = "2025-06-01 18:00:00"
filter.dateRanges.extend([dateRange])

response = fetcher.GetRunDataByFilter(filter)
for result in response:
    df = Converter.protobuf_to_dataframe(result.data)
```

---

### 4. LotRunFetcherStub

擷取 Lot-Run 對應關係，查詢特定機台或批號的 Run 記錄。Filter 最精簡，不支援 chamber/parameter/svid 篩選。

**Import**：

```python
from ifdc_datafetcher.lotrun_pb2_grpc import LotRunFetcherStub
from ifdc_datafetcher.lotrun_pb2 import RequestFilter, DateRange
```

**方法**：`GetLotRunByFilter`（串流）

**Filter：`RequestFilter`**

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `eqpId` | string | 擇一 ★ | 機台 ID |
| `dateRanges` | DateRange | 擇一 ★ | 時間範圍 |
| `lots` | string[] | 擇一 ★ | 批號清單 |
| `recipes` | string[] | 選填 | Recipe 清單 |
| `products` | string[] | 選填 | 產品清單（支援尾端萬用字元） |
| `mesSteps` | string[] | 選填 | MES 步驟清單 |
| `wafers` | Wafer[] | 選填 | Wafer 清單 |

> **注意**：RequestFilter 不支援 `chambers`、`parameters`、`svids` 欄位。

**Response：`LotRun`**

| 欄位 | 類型 | 說明 |
|------|------|------|
| `eqpId` | string | 機台 ID |
| `chamber` | string | Chamber |
| `runId` | int32 | Run ID |
| `recipe` | string | Recipe |
| `startTime` | string | Run 開始時間 |
| `endTime` | string | Run 結束時間 |
| `lotId` | string | 批號 |
| `product` | string | 產品 |
| `step` | string | 製程步驟 |
| `carrier` | string | 載具 ID |
| `ppId` | string | Process Program ID |
| `lotType` | string | 批號類型 |
| `tech` | string | 技術 |
| `trackInTime` | string | Track-in 時間 |
| `stepCode` | string | Step Code |
| `loadPort` | string | Load Port |
| `ppidGroup` | string | PPID Group |
| `badRun` | string | Bad Run 指標 |
| `abnormal` | int32 | 異常指標 |
| `toolState` | string | 機台狀態 |
| `chamberState` | string | Chamber 狀態 |
| `processTime` | double | 加工時間 |
| `stepCount` | int32 | Step 數 |
| `distStepCount` | int32 | Distinct Step 數 |
| `quality` | double | 品質值 |
| `workCenter` | string | Work Center |
| `eaJobId` | string | EA Job ID |
| `aliasId` | string | Alias ID（Lot + slotNo） |
| `waferId` | string | Wafer ID（T-7 Code） |
| `slotNo` | string | Slot 編號 |

**程式碼片段**：

```python
from ifdc_datafetcher.lotrun_pb2_grpc import LotRunFetcherStub
from ifdc_datafetcher.lotrun_pb2 import RequestFilter, DateRange

fetcher = FetcherFactory.create_client(LotRunFetcherStub, data_center=Location.KH)

filter = RequestFilter()
filter.eqpId = "EKPLYA01"
filter.recipes.extend(["RECIPE_001"])

dateRange = DateRange()
dateRange.start = "2025-06-01 17:00:00"
dateRange.end = "2025-06-01 18:00:00"
filter.dateRanges.extend([dateRange])

response = fetcher.GetLotRunByFilter(filter)
for result in response:
    df = Converter.protobuf_to_dataframe(result.data)
```

---

### 5. LotDataFetcherStub

擷取 Lot 層級的彙總資料。與 RunData 類似但彙總層級不同，包含 OOS/OOC 指標。

**Import**：

```python
from ifdc_datafetcher.lotdata_pb2_grpc import LotDataFetcherStub
from ifdc_datafetcher.lotdata_pb2 import ParameterFilter, DateRange
```

**方法**：`GetLotDataByFilter`（串流）

**Filter：`ParameterFilter`（LotData 版）**

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `eqpId` | string | 擇一 ★ | 機台 ID |
| `dateRanges` | DateRange | 擇一 ★ | 時間範圍 |
| `lots` | string[] | 擇一 ★ | 批號清單 |
| `recipes` | string[] | 選填 | Recipe 清單 |
| `products` | string[] | 選填 | 產品清單（支援尾端萬用字元） |
| `mesSteps` | string[] | 選填 | MES 步驟清單 |
| `parameters` | string[] | 選填 | 參數清單 |
| `svids` | string[] | 選填 | SVID 清單 |

> **注意**：LotData 版 ParameterFilter **不支援** `chambers` 和 `wafers` 欄位（與 RunData 版不同）。

**Response：`LotData`**

| 欄位 | 類型 | 說明 |
|------|------|------|
| `eqpId` | string | 機台 ID |
| `lotIndex` | int32 | Lot 索引 |
| `queueIndex` | int32 | Queue 索引 |
| `badRun` | string | Bad Run 指標 |
| `toolState` | string | 機台狀態 |
| `svidIndex` | int32 | SVID 索引 |
| `svid` | string | Sensor Value ID |
| `parameter` | string | 參數名稱 |
| `value` | double? | Lot 彙總值 |
| `ooc` | string | Out of Control 指標 |
| `oos` | string | Out of Specification 指標 |
| `lotId` | string | 批號 |
| `step` | string | 製程步驟 |
| `ppId` | string | Process Program ID |
| `lotType` | string | 批號類型 |
| `product` | string | 產品 |
| `startTime` | string | 開始時間 |
| `endTime` | string | 結束時間 |

**程式碼片段**：

```python
from ifdc_datafetcher.lotdata_pb2_grpc import LotDataFetcherStub
from ifdc_datafetcher.lotdata_pb2 import ParameterFilter, DateRange

fetcher = FetcherFactory.create_client(LotDataFetcherStub, data_center=Location.KH)

filter = ParameterFilter()
filter.eqpId = "EKPLYA01"
filter.parameters.extend(["GAS_6_O2_1000"])

dateRange = DateRange()
dateRange.start = "2025-06-01 17:00:00"
dateRange.end = "2025-06-01 18:00:00"
filter.dateRanges.extend([dateRange])

response = fetcher.GetLotDataByFilter(filter)
for result in response:
    df = Converter.protobuf_to_dataframe(result.data)
```

---

### 6. SvidFetcherStub

查詢 SVID 元資料，用於了解機台上有哪些可用的 SVID/參數。**非串流**，直接回傳結果。

**Import**：

```python
from ifdc_datafetcher.svid_pb2_grpc import SvidFetcherStub
from ifdc_datafetcher.svid_pb2 import SvidFilter
```

**方法**：`GetSvidByFilter`（**非串流**）

**Filter：`SvidFilter`**

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `eqpId` | string | 擇一 ★ | 機台 ID |
| `parameters` | string[] | 擇一 ★ | 參數清單 |
| `dataType` | string | 選填 | 資料類型：`RAW`、`UVA`、`RSM`、`LSM` |
| `chambers` | string[] | 選填 | Chamber 清單 |
| `svids` | string[] | 選填 | SVID 清單 |

> ★ 必須提供 `eqpId` 或 `parameters` 其中一個。

**Response：`Svid`**

| 欄位 | 類型 | 說明 |
|------|------|------|
| `eqpId` | string | 機台 ID |
| `chamber` | string | Chamber |
| `svid` | string | Sensor Value ID |
| `parameter` | string | 參數名稱 / Group 名稱 |
| `dataType` | string | 資料類型（RAW/UVA/RSM/LSM） |
| `description` | string | SVID 說明 |
| `isVP` | bool | 是否為 VP |
| `svidIndex` | int32 | SVID 索引 |
| `createTime` | string | 建立時間 |
| `updateTime` | string | 最後更新時間 |
| `grade` | string? | SVID 等級（選填） |
| `behavior` | string? | SVID 行為分類（選填） |
| `classification` | string? | SVID 分類（選填） |
| `category` | string? | SVID 類別（選填） |
| `toolmatch` | string? | Tool Match 標記（選填） |

**完整範例**：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.data_fetcher import FetcherFactory
from wecpy.data_fetcher.location import Location
from wecpy.utility.converter import Converter
from wecpy.log_manager import LogManager

from ifdc_datafetcher.svid_pb2_grpc import SvidFetcherStub
from ifdc_datafetcher.svid_pb2 import SvidFilter

log = LogManager.get_logger()

# 建立 Fetcher
fetcher = FetcherFactory.create_client(SvidFetcherStub, data_center=Location.KH)

# 建立 Filter
filter = SvidFilter()
filter.eqpId = "EKPLYA01"
filter.dataType = "UVA"
filter.chambers.extend(["EKPLYA01_PM3"])

# 非串流：直接取得結果，不需要 for loop
response = fetcher.GetSvidByFilter(filter)
df = Converter.protobuf_to_dataframe(response.data)

log.info(f"取得 {len(df)} 筆 SVID 資料")
```

---

### 7. EqpModelFetcherStub

查詢機台/Chamber 元資料，用於了解系統中有哪些機台。**非串流**，直接回傳結果。不需要時間範圍。

**Import**：

```python
from ifdc_datafetcher.eqpmodel_pb2_grpc import EqpModelFetcherStub
from ifdc_datafetcher.eqpmodel_pb2 import EqpFilter
```

**方法**：

| 方法 | 說明 | 回傳 |
|-----|------|------|
| `GetEqpChamber(filter)` | 查詢機台 Chamber 元資料 | `EqpResult` → `EqpChamber[]` |
| `GetEqpChamberRecipe(filter)` | 查詢機台 Chamber Recipe 對照 | `ECRResult` → `Ecr[]` |

> 注意方法名稱是 `GetEqpChamber`，非 `GetEqpModelByFilter`。

**Filter：`EqpFilter`**

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `eqpId` | string | 選填 | 機台 ID（支援萬用字元，如 `EK*`） |
| `module` | string | 選填 | 模組名稱（如 LITHO、DIFF、ETCH） |
| `toolType` | string | 選填 | 機台類型 |
| `mesEqpId` | string | 選填 | MES 機台 ID（支援萬用字元） |
| `mesChamber` | string | 選填 | MES Chamber（支援萬用字元） |

> 所有欄位皆為選填，至少指定一個條件進行篩選。所有字串欄位支援萬用字元（`*`）。

**Response：`EqpChamber`**

| 欄位 | 類型 | 說明 |
|------|------|------|
| `eqpId` | string | 機台 ID |
| `chamber` | string | Chamber |
| `moduleName` | string | 模組名稱 |
| `dept` | string | 部門 |
| `vendor` | string | 供應商 |
| `toolType` | string | 機台類型 |
| `processType` | string | 製程類型 |
| `mesEqpId` | string | MES 機台 ID |
| `mesChamber` | string | MES Chamber |

**完整範例**：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.data_fetcher import FetcherFactory
from wecpy.data_fetcher.location import Location
from wecpy.utility.converter import Converter
from wecpy.log_manager import LogManager

from ifdc_datafetcher.eqpmodel_pb2_grpc import EqpModelFetcherStub
from ifdc_datafetcher.eqpmodel_pb2 import EqpFilter

log = LogManager.get_logger()

# 建立 Fetcher
fetcher = FetcherFactory.create_client(EqpModelFetcherStub, data_center=Location.KH)

# 建立 Filter（支援萬用字元）
filter = EqpFilter()
filter.eqpId = "EKPLYA01"
filter.module = "ETCH"
filter.toolType = "KIYO_FX"

# 非串流：直接取得結果，不需要 for loop
response = fetcher.GetEqpChamber(filter)
df = Converter.protobuf_to_dataframe(response.data)

log.info(f"取得 {len(df)} 筆機台資料")
```

### GetEqpChamberRecipe — 查詢機台 Recipe 對照

使用相同的 `EqpFilter`，但呼叫 `GetEqpChamberRecipe` 方法：

```python
from ifdc_datafetcher.eqpmodel_pb2_grpc import EqpModelFetcherStub
from ifdc_datafetcher.eqpmodel_pb2 import EqpFilter

fetcher = FetcherFactory.create_client(EqpModelFetcherStub, data_center=Location.KH)

filter = EqpFilter()
filter.eqpId = "EKPLYA01"

# 查詢 Recipe 對照
response = fetcher.GetEqpChamberRecipe(filter)
df = Converter.protobuf_to_dataframe(response.data)

log.info(f"取得 {len(df)} 筆 Recipe 對照資料")
```

**Response：`Ecr`（EqpChamberRecipe）**

| 欄位 | 類型 | 說明 |
|------|------|------|
| `eqpId` | string | 機台 ID |
| `chamber` | string | Chamber |
| `recipe` | string | Recipe 名稱 |
| `updateTime` | string | 最後更新時間 |

---

## 錯誤處理

```python
import grpc
from grpc import RpcError

def safe_fetch(fetcher, method_name, filter):
    """通用安全擷取函式"""
    try:
        method = getattr(fetcher, method_name)
        response = method(filter)

        # 串流 Fetcher
        all_data = []
        for result in response:
            df = Converter.protobuf_to_dataframe(result.data)
            all_data.append(df)

        return pd.concat(all_data, ignore_index=True) if all_data else pd.DataFrame()

    except RpcError as e:
        log.error(f"gRPC 錯誤: {e.code()}, {e.details()}")
        return None

    except ConnectionError as e:
        log.error(f"連線失敗: {e}")
        return None

    except Exception as e:
        log.error(f"未預期錯誤: {e}")
        return None
```

> 非串流 Fetcher（Svid、EqpModel）不需要 for loop，直接使用 `response.data`。

## 常見問題

### Q1：權限不足

```
錯誤：Access denied. You do not have permission to access.
解決：聯繫 MK22 申請 FDC Data Fetcher 權限
```

### Q2：連線逾時

```
原因：網路問題或資料量過大
解決：
1. 縮小時間範圍
2. 減少查詢的 parameters 數量
3. 確認網路連通性
```

### Q3：無資料回傳

```
原因：條件不符或資料不存在
解決：
1. 確認 eqpId 正確（可用 EqpModelFetcher 查詢）
2. 確認 chamber 名稱正確
3. 確認時間範圍內有資料
4. 使用 SvidFetcher 確認可用的參數
```

### Q4：LotData 的 ParameterFilter 找不到 chambers 欄位

```
原因：LotData 版 ParameterFilter 與 RunData 版不同，不支援 chambers 和 wafers
解決：LotData 僅支援 eqpId/dateRanges/lots/recipes/products/mesSteps/parameters/svids
```

### Q5：EqpModelFetcher 沒有 GetEqpModelByFilter 方法

```
原因：方法名稱為 GetEqpChamber，非 GetEqpModelByFilter
解決：使用 fetcher.GetEqpChamber(filter)
```
