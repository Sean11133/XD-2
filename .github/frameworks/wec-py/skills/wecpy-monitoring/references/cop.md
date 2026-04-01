# COPManager 詳解

## 目錄

- [config.yaml 設定](#configyaml-設定)
  - [設定欄位說明](#設定欄位說明)
- [初始化](#初始化)
- [API 方法參考](#api-方法參考)
- [指標類型](#指標類型)
- [基本使用](#基本使用)
  - [Counter（計數器）](#counter計數器)
  - [Gauge（儀表）](#gauge儀表)
  - [Histogram（直方圖）](#histogram直方圖)
  - [Summary（摘要）](#summary摘要)
  - [add_label / get_labels - 標籤管理](#add_label-get_labels-標籤管理)
  - [reset_counter - 重設計數器](#reset_counter-重設計數器)
- [完整範例](#完整範例)
  - [排程任務監控](#排程任務監控)
  - [ETL 任務監控](#etl-任務監控)
- [指標命名規範](#指標命名規範)
  - [建議的命名格式](#建議的命名格式)
  - [命名建議](#命名建議)
- [最佳實務](#最佳實務)
  - [1. 使用一致的命名](#1-使用一致的命名)
  - [2. 記錄關鍵事件](#2-記錄關鍵事件)
  - [3. 錯誤處理](#3-錯誤處理)
- [常見問題](#常見問題)
  - [Q1：缺少 cop_name 參數](#q1缺少-cop_name-參數)
  - [Q2：指標未顯示在 Dashboard](#q2指標未顯示在-dashboard)
  - [Q3：指標名稱不合法](#q3指標名稱不合法)

本文件詳細說明 wecpy 框架中 COPManager（COP 指標上報）的使用方式。

## config.yaml 設定

```yaml
COP:
  COPServer:
    host: "http://fppushgateway"
```

### 設定欄位說明

| 欄位 | 說明 | 必要 |
|-----|------|-----|
| host | Pushgateway 位址 | ✅ |

## 初始化

**重要**：COPManager **必須**傳入 `cop_name` 參數，另可選擇性傳入 `metric_name` 和 `labels`。

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.cop_manager import COPManager

# 基本初始化 - 只傳 cop_name
cop = COPManager("COPServer")

# 進階初始化 - 帶預設 metric_name 和 labels
cop = COPManager("COPServer", metric_name="myapp_requests", labels={"system": "IRS", "env": "PROD"})
```

## API 方法參考

| 方法 | 說明 |
|-----|------|
| `__init__(cop_name, metric_name=None, labels=None)` | 初始化，可選帶預設 metric 名稱和標籤 |
| `add_label(key, value)` | 加入自訂標籤（key-value 對） |
| `get_labels() → Dict[str, str]` | 取得目前所有標籤 |
| `counter(metric_name, value=1, labels=None)` | 計數器（預設增加 1） |
| `reset_counter()` | 重設計數器歸零 |
| `gauge(metric_name, value, labels=None)` | 儀表值設定 |
| `histogram(metric_name, value, labels=None)` | 直方圖觀測值 |
| `summary(metric_name, value, labels=None)` | 摘要觀測值 |

## 指標類型

COPManager 支援四種 Prometheus 指標類型：

| 類型 | 說明 | 使用場景 |
|-----|------|---------|
| Counter | 計數器（只增不減） | 請求次數、錯誤次數 |
| Gauge | 儀表（可增可減） | 佇列長度、記憶體使用量 |
| Histogram | 直方圖（分佈統計） | 回應時間分佈 |
| Summary | 摘要（百分位數） | 延遲百分位數 |

## 基本使用

### Counter（計數器）

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.cop_manager import COPManager

cop = COPManager("COPServer")

# 計數器 - 預設增加 1
cop.counter("customized_Report_Schedule_Counter")

# 指定增加值
cop.counter("customized_Report_Schedule_Counter", value=5)

# 帶標籤的計數器
cop.counter("customized_Report_Schedule_Counter", labels={"system": "IRS", "env": "PROD"})

# 也可以多次呼叫累加
cop.counter("customized_Report_Schedule_Counter")
cop.counter("customized_Report_Schedule_Counter")
```

### Gauge（儀表）

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.cop_manager import COPManager

cop = COPManager("COPServer")

# 設定儀表值
cop.gauge("queue_size", 42)

# 帶標籤
cop.gauge("queue_size", 42, labels={"queue": "high_priority"})
```

### Histogram（直方圖）

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.cop_manager import COPManager

cop = COPManager("COPServer")

# 記錄直方圖觀測值
cop.histogram("process_duration", 1.25)

# 帶標籤
cop.histogram("process_duration", 1.25, labels={"step": "extract"})
```

### Summary（摘要）

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.cop_manager import COPManager

cop = COPManager("COPServer")

# 記錄摘要觀測值
cop.summary("response_time", 0.35)

# 帶標籤
cop.summary("response_time", 0.35, labels={"endpoint": "/api/data"})
```

### add_label / get_labels - 標籤管理

```python
cop = COPManager("COPServer")

# 逐一加入標籤
cop.add_label("system", "IRS")
cop.add_label("env", "PROD")

# 取得目前所有標籤
labels = cop.get_labels()
print(labels)  # {"system": "IRS", "env": "PROD"}
```

### reset_counter - 重設計數器

```python
cop = COPManager("COPServer")

cop.counter("batch_count")
cop.counter("batch_count")
cop.counter("batch_count")

# 重設計數器歸零
cop.reset_counter()
```

## 完整範例

### 排程任務監控

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.cop_manager import COPManager
from wecpy.log_manager import LogManager
import time

log = LogManager.get_logger()

def main():
    """排程任務，帶 COP 監控"""
    cop = COPManager("COPServer")
    
    start_time = time.time()
    
    try:
        log.info("排程任務開始")
        
        # 記錄執行次數
        cop.counter("customized_Report_Schedule_Counter")
        
        # 業務邏輯
        process_data()
        
        # 記錄成功次數
        cop.counter("customized_Report_Schedule_Success")
        
        log.info("排程任務完成")
        
    except Exception as e:
        # 記錄失敗次數
        cop.counter("customized_Report_Schedule_Error")
        log.error(f"排程任務失敗: {e}")
        raise
    
    finally:
        # 記錄執行時間
        duration = time.time() - start_time
        log.info(f"執行時間: {duration:.2f} 秒")

def process_data():
    """業務邏輯"""
    pass

if __name__ == "__main__":
    main()
```

### ETL 任務監控

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.cop_manager import COPManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def etl_with_metrics():
    """ETL 任務，帶指標監控"""
    cop = COPManager("COPServer")
    
    # 記錄 ETL 執行次數
    cop.counter("etl_execution_count")
    
    try:
        # Extract
        log.info("Extract 階段")
        cop.counter("etl_extract_count")
        
        # Transform
        log.info("Transform 階段")
        cop.counter("etl_transform_count")
        
        # Load
        log.info("Load 階段")
        cop.counter("etl_load_count")
        
        # 記錄成功
        cop.counter("etl_success_count")
        
    except Exception as e:
        cop.counter("etl_error_count")
        raise

if __name__ == "__main__":
    etl_with_metrics()
```

## 指標命名規範

### 建議的命名格式

```python
# 格式：{系統}_{應用}_{指標類型}_{動作}
cop.counter("irs_model_monitor_schedule_execution")
cop.counter("irs_model_monitor_schedule_success")
cop.counter("irs_model_monitor_schedule_error")
```

### 命名建議

```python
# ✅ 好的命名
cop.counter("customized_Report_Schedule_Counter")
cop.counter("irs_model_monitor_execution_count")
cop.counter("etl_process_success_count")

# ❌ 不好的命名
cop.counter("counter1")
cop.counter("c")
cop.counter("my-counter")  # 避免使用連字號
```

## 最佳實務

### 1. 使用一致的命名
```python
# 同一應用的指標使用一致的前綴
cop.counter("myapp_request_total")
cop.counter("myapp_error_total")
cop.counter("myapp_success_total")
```

### 2. 記錄關鍵事件
```python
def process():
    cop = COPManager("COPServer")
    
    # 記錄開始
    cop.counter("process_start_total")
    
    try:
        # 業務邏輯
        result = do_something()
        
        # 記錄成功
        cop.counter("process_success_total")
        
    except Exception as e:
        # 記錄失敗
        cop.counter("process_error_total")
        raise
```

### 3. 錯誤處理
```python
try:
    cop = COPManager("COPServer")
    cop.counter("my_metric")
except Exception as e:
    log.error(f"COP 上報失敗: {e}")
    # 不影響主要業務邏輯
```

## 常見問題

### Q1：缺少 cop_name 參數
```
原因：COPManager 初始化時未傳入 cop_name
解決：
# ❌ 錯誤
cop = COPManager()

# ✅ 正確
cop = COPManager("COPServer")
# 或帶預設 metric_name 和 labels
cop = COPManager("COPServer", metric_name="myapp_metric", labels={"env": "PROD"})
```

### Q2：指標未顯示在 Dashboard
```
原因：Pushgateway 連線問題或指標名稱問題
解決：
1. 確認 COP.COPServer.host 正確
2. 確認 Pushgateway 服務正常
3. 確認指標名稱符合 Prometheus 規範
4. 檢查網路連通性
```

### Q3：指標名稱不合法
```
原因：指標名稱包含不允許的字元
解決：
1. 只使用英文字母、數字、底線
2. 不要使用連字號 -
3. 不要以數字開頭
4. 避免使用保留字
```
