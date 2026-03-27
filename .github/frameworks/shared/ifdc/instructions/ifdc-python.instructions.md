---
applyTo: "**/*.py"
---

# iFDC Data Fetcher — Python 使用指引

> **服務說明**：見 [overview.md](../overview.md)  
> **前置需求**：需先安裝 `wecpy` 與 `ifdc-datafetcher`，並完成 wecpy ConfigManager 初始化

---

## 必要 Import 順序

```python
# 步驟 1：wecpy ConfigManager 必須最先連續兩行
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

# 步驟 2：wecpy 其他元件
from wecpy.data_fetcher import FetcherFactory
from wecpy.data_fetcher.location import Location
from wecpy.log_manager import LogManager

# 步驟 3：FDC 模組（安裝後才可 import）
from ifdc_datafetcher.rawdata_pb2_grpc import RawDataFetcherStub
from ifdc_datafetcher.rawdata_pb2 import RecipeStepFilter, DateRange
from wecpy.utility.converter import Converter  # Protobuf → DataFrame 轉換工具

log = LogManager.get_logger()
```

---

## 標準使用模式

```python
def get_fdc_rawdata(eqp_id: str, chambers: list[str], parameters: list[str],
                    start: str, end: str) -> None:
    # 1. 建立 Fetcher（指定資料中心：KH / TN）
    fetcher = FetcherFactory.create_client(RawDataFetcherStub, data_center=Location.KH)

    # 2. 設定 Filter（取代 SQL WHERE）
    f = RecipeStepFilter()
    f.eqpId = eqp_id
    f.chambers.extend(chambers)
    f.parameters.extend(parameters)

    date_range = DateRange()
    date_range.start = start   # "YYYY-MM-DD HH:MM:SS"
    date_range.end = end
    f.dateRanges.extend([date_range])

    # 3. 串流取得資料，逐批處理
    for result in fetcher.GetRawDataByFilter(f):
        _process_batch(result)

def _process_batch(result) -> None:
    df = Converter.protobuf_to_dataframe(result.data)
    log.info(f"取得 {len(df)} 筆原始數據")
    # ... 業務邏輯
```

---

## 可用資料中心

| 常數          | 代表         |
| ------------- | ------------ |
| `Location.KH` | 高雄資料中心 |
| `Location.TN` | 台南資料中心 |

---

## 錯誤處理

```python
from grpc import RpcError

try:
    for result in fetcher.GetRawDataByFilter(f):
        _process_batch(result)
except RpcError as e:
    log.error(f"gRPC 錯誤: {e.code()} — {e.details()}")
    raise
```

---

## 禁止事項

- **禁止**在 `ConfigManager` 初始化前 import `ifdc_datafetcher`
- **禁止**在未安裝套件時直接 import（會 ImportError）
- **禁止**忽略 gRPC 例外（權限錯誤需明確回報）
