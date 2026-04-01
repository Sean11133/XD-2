# Converter 詳細說明

Converter 是 wecpy 框架的工具類別，提供時間戳轉換和 Protobuf 資料轉換功能。主要用於 gRPC 通訊中的 Protobuf Timestamp 處理，以及將 Protobuf 物件轉換為 Pandas DataFrame。

## 匯入路徑

```python
from wecpy.utility.converter import Converter
```

## 功能總覽

| 方法 | 用途 |
|-----|------|
| `to_utc_timestamp_from_datetime()` | datetime → Protobuf Timestamp |
| `to_utc_timestamp()` | 年月日時分秒 → Protobuf Timestamp |
| `to_utc_datetime_from_datetime()` | datetime → UTC datetime |
| `to_utc_datetime()` | 年月日時分秒 → UTC datetime |
| `utc_timestamp_to_datetime()` | Protobuf Timestamp → datetime |
| `protobuf_to_dataframe()` | Protobuf Message → DataFrame |

## 時間戳轉換

### datetime 轉 Protobuf Timestamp

將 Python datetime 物件轉換為 gRPC/Protobuf 使用的 Timestamp：

```python
from datetime import datetime
from wecpy.utility.converter import Converter

# 從 datetime 轉換
dt = datetime(2025, 1, 15, 10, 30, 0)
pb_timestamp = Converter.to_utc_timestamp_from_datetime(dt)
```

### 年月日直接轉 Protobuf Timestamp

不需先建立 datetime，直接使用年月日時分秒轉換：

```python
from wecpy.utility.converter import Converter

# 指定完整時間
pb_timestamp = Converter.to_utc_timestamp(2025, 1, 15, 10, 30, 0)

# 只指定日期（時分秒預設為 0）
pb_timestamp = Converter.to_utc_timestamp(2025, 1, 15)
```

### Protobuf Timestamp 轉 datetime

將 gRPC 回傳的 Protobuf Timestamp 轉回 Python datetime：

```python
from wecpy.utility.converter import Converter

# 從 gRPC 回應取得的 Protobuf Timestamp
pb_timestamp = grpc_response.update_time

# 轉換為 Python datetime
dt = Converter.utc_timestamp_to_datetime(pb_timestamp)
print(f"更新時間: {dt}")  # 2025-01-15 10:30:00
```

### UTC datetime 轉換

將本地時間轉換為 UTC datetime（不是 Protobuf Timestamp）：

```python
from datetime import datetime
from wecpy.utility.converter import Converter

# 從 datetime 轉換為 UTC
local_dt = datetime(2025, 1, 15, 18, 30, 0)  # 本地時間
utc_dt = Converter.to_utc_datetime_from_datetime(local_dt)

# 直接指定時間轉換為 UTC
utc_dt = Converter.to_utc_datetime(2025, 1, 15, 18, 30, 0)
```

## Protobuf 轉 DataFrame

將 gRPC 回傳的 Protobuf Message 物件轉換為 Pandas DataFrame，便於後續資料分析：

```python
import pandas as pd
from wecpy.utility.converter import Converter

# 從 gRPC 回應取得 Protobuf 物件
protobuf_response = grpc_stub.GetData(request)

# 轉換為 DataFrame
df = Converter.protobuf_to_dataframe(protobuf_response)
print(df.head())
print(f"欄位: {df.columns.tolist()}")
print(f"筆數: {len(df)}")
```

## 完整使用範例

### gRPC 資料擷取與轉換

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from datetime import datetime
from wecpy.utility.converter import Converter
from wecpy.log_manager import LogManager

log = LogManager.get_logger()


def fetch_lot_data(start_date: datetime, end_date: datetime):
    """從 gRPC 服務擷取批號資料"""
    
    # 將 datetime 轉換為 Protobuf Timestamp 作為 gRPC 請求參數
    start_ts = Converter.to_utc_timestamp_from_datetime(start_date)
    end_ts = Converter.to_utc_timestamp_from_datetime(end_date)
    
    # 建立 gRPC 請求
    request = LotDataRequest(
        start_time=start_ts,
        end_time=end_ts
    )
    
    # 呼叫 gRPC 服務
    response = grpc_stub.GetLotData(request)
    
    # 將 Protobuf 回應轉換為 DataFrame
    df = Converter.protobuf_to_dataframe(response)
    log.info(f"取得 {len(df)} 筆批號資料")
    
    # 處理時間欄位
    if 'update_time' in df.columns:
        df['update_time'] = df['update_time'].apply(
            Converter.utc_timestamp_to_datetime
        )
    
    return df
```

### 搭配 DataFetcher 使用

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from datetime import datetime
from wecpy.utility.converter import Converter
from wecpy.log_manager import LogManager

log = LogManager.get_logger()


def prepare_time_range():
    """準備 gRPC 查詢的時間範圍"""
    # 今天的 UTC Timestamp
    today_start = Converter.to_utc_timestamp(2025, 1, 15)
    today_end = Converter.to_utc_timestamp(2025, 1, 15, 23, 59, 59)
    
    return today_start, today_end


def process_grpc_timestamp(pb_timestamp):
    """處理 gRPC 回傳的 Timestamp"""
    dt = Converter.utc_timestamp_to_datetime(pb_timestamp)
    log.info(f"資料時間: {dt.strftime('%Y-%m-%d %H:%M:%S')}")
    return dt
```

## 最佳實務

### 1. 統一使用 Converter 進行時間轉換

```python
# ❌ 避免：自行處理 Protobuf Timestamp
from google.protobuf.timestamp_pb2 import Timestamp
ts = Timestamp()
ts.FromDatetime(dt)

# ✅ 正確：使用 Converter
from wecpy.utility.converter import Converter
ts = Converter.to_utc_timestamp_from_datetime(dt)
```

### 2. 處理 gRPC 回應時統一轉換

```python
# ✅ 正確：取得 gRPC 回應後立即轉換為 DataFrame
response = grpc_stub.GetData(request)
df = Converter.protobuf_to_dataframe(response)
# 之後使用 DataFrame 進行處理
```

### 3. 注意時區處理

```python
# ✅ 正確：明確使用 UTC 轉換
utc_dt = Converter.to_utc_datetime_from_datetime(local_dt)
# Converter 會自動處理時區轉換
```

## 常見問題

### Q1：Protobuf Timestamp 轉換後時間不正確

```
原因：時區轉換問題，本地時間與 UTC 有時差
解決：
1. 確認輸入的 datetime 是否帶有時區資訊
2. 使用 to_utc_datetime_from_datetime 明確轉換為 UTC
3. 確認 gRPC 服務端和客戶端使用相同的時區基準
```

### Q2：protobuf_to_dataframe 欄位名稱不正確

```
原因：Protobuf Message 定義的欄位名稱與預期不同
解決：
1. 檢查 .proto 檔案中的欄位定義
2. 轉換後使用 df.columns 確認欄位名稱
3. 必要時使用 df.rename(columns={...}) 重新命名
```

### Q3：ImportError: cannot import Converter

```
原因：wecpy 版本過舊，不包含 Converter
解決：更新 wecpy 到最新版本
pip install --upgrade --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple \
    --trusted-host=10.18.20.121 wecpy
```
