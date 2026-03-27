# FDC / EDA Data Fetcher 使用指南（Pointer）

> ⚠️ **本文件已移轉至 `shared/` 統一管理** ⚠️
>
> FDC 與 EDA Data Fetcher 同時支援 Python 與 C#，已移至跨語言共享目錄：
>
> ```
> frameworks/shared/
> ├── ifdc/
> │   ├── overview.md
> ├── instructions/ifdc-python.instructions.md
> │   └── instructions/ifdc-csharp.instructions.md
> └── ieda/
>     ├── overview.md
>     ├── instructions/ieda-python.instructions.md
>     └── instructions/ieda-csharp.instructions.md
> ```

---

<!-- 以下保留原始內容供過渡期參照，維護請至 shared/ -->

本頁描述 **Data Fetcher** 的概念與使用方式，並提供 Python 與 C# 的安裝與程式碼範例。

---

## 什麼是 Data Fetcher

**Data Fetcher** 是由 **A0IM** 所提供的新一代工廠資料存取方式。  
您可以透過 **Python** 或 **C#** 呼叫 Data Fetcher 提供的 API 來取得資料。

### 特點

- 解決大量資料存取效能問題，提供更簡易的使用方式
- 不再需要撰寫 SQL 語法
- 取代 **EDWM + IMPALA + SQL** 的方式
- 取值速度可提升 **10 倍以上**
- 支援大資料傳輸不中斷，更有效掌握網路與記憶體用量

### 可用資料

目前 **A0IM** 提供：

- **FDC Data Fetcher**
- **EDA Data Fetcher**

### 負責單位

- **FDC Data Fetcher 為 MK22**
- **EDA Data Fetcher 為 MK23**

---

## 使用情境

- 需要存取 **FDC / EDA 工廠巨量資料** 以進行分析
- 開發者使用 **Python** 或 **C#**
- 若為 **JMP / Power BI** 使用者，目前無法直接整合，可先透過 Python 匯出 Excel，再進行後續分析

---

## 開始使用

### Python 套件安裝

```bash
# 必裝
pip install --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple     --trusted-host=10.18.20.121:8081 wecpy

# FDC (視需要)
pip install --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple     --trusted-host=10.18.20.121:8081 ifdc-datafetcher

# EDA (視需要)
pip install --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple     --trusted-host=10.18.20.121:8081 ieda-datafetcher
```

### C# 套件安裝

```csharp
// 必裝
nuget install iMX.Core

// FDC (視需要)
nuget install iFDC.DataFetcher

// EDA (視需要)
nuget install iEDA.DataFetcher
```

---

## Data Fetcher 的概念

Data Fetcher 由三個部份組成：

1. **`<SomeData>Fetcher`**  
   建立資料來源的 Fetcher（類似 SQL 的 Table）。  
   例如：`RawDataFetcher` 或 `LotRunFetcher`

2. **`<SomeData>Filter`**  
   建立 Filter 並指定條件（類似 SQL 的 WHERE）。  
   例如：`eqpId`, `LOT ID`

3. **`<SomeData>Result`**  
   使用 `Fetcher.<Get>` 方法，帶入 Filter，取得資料結果。  
   可用迴圈逐批處理。

---

## Python 程式碼範例

```python
# 安裝 wecpy 後才能 import
from wecpy.data_fetcher import FetcherFactory
from wecpy.data_fetcher.location import Location
from wecpy.utility.converter import Converter

# 安裝 ifdc_datafetcher 後才能 import
from ifdc_datafetcher.rawdata_pb2_grpc import RawDataFetcherStub
from ifdc_datafetcher.rawdata_pb2 import RecipeStepFilter, DateRange
from google.protobuf.timestamp_pb2 import Timestamp
from datetime import datetime, timezone

# 1. 建立 Fetcher (此例為 RawDataFetcher, 指定高雄資料中心)
fetcher = FetcherFactory.create_client(RawDataFetcherStub, data_center=Location.KH)

# 2. 建立過濾器 Filter，設定條件
filter = RecipeStepFilter()

# 設定條件：機台、Chamber、Parameter
filter.eqpId = "EKPLYA01"
filter.chambers.extend(["EKPLYA01_PM3"])
filter.parameters.extend(["GAS_6_O2_1000"])

# 設定條件：日期區間
dateRange = DateRange()
dateRange.start = "2025-06-01 17:00:00"
dateRange.end = "2025-06-01 18:00:00"
filter.dateRanges.extend([dateRange])

# 3. 取得資料，並以 filter 當參數
response = fetcher.GetRawDataByFilter(filter)

# 分批處理資料
for result in response:
    on_received(result)

# 處理每批回傳結果
def on_received(result):
    batch_size = len(result.data)
    print(f"Received batch: {batch_size} records")
    # 轉換成 pandas dataframe
    pd = Converter.protobuf_to_dataframe(result.data)
```

---

## 權限申請

若未申請 Data Fetcher 權限，執行時會出現以下錯誤：

- **Unauthenticated**  
  `Access denied. Authentication is required.`

- **PermissionDenied**  
  `Access denied. You do not have permission to access.`

請先完成權限申請再進行使用。

---
