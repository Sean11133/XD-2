# APMManager 詳解

## 目錄

- [config.yaml 設定](#configyaml-設定)
  - [設定欄位說明](#設定欄位說明)
  - [環境差異](#環境差異)
- [初始化](#初始化)
- [API 方法參考](#api-方法參考)
- [三種使用模式](#三種使用模式)
  - [模式一：手動控制（官方推薦）](#模式一手動控制官方推薦)
  - [模式二：Context Manager](#模式二context-manager)
  - [模式三：Decorator（@apm.capture）](#模式三decoratorapmcapture)
- [完整範例](#完整範例)
  - [ETL 排程任務](#etl-排程任務)
  - [使用 with 語法的 ETL](#使用-with-語法的-etl)
  - [Kafka Listener 監控](#kafka-listener-監控)
- [其他方法](#其他方法)
  - [add_label - 加入自訂標籤](#add_label-加入自訂標籤)
  - [capture_error_message - 捕捉自訂錯誤訊息](#capture_error_message-捕捉自訂錯誤訊息)
  - [get_version / get_import_string - 靜態工具方法](#get_version-get_import_string-靜態工具方法)
- [最佳實務](#最佳實務)
  - [1. 確保 Transaction 完整性](#1-確保-transaction-完整性)
  - [2. 有意義的 Transaction 結果](#2-有意義的-transaction-結果)
  - [3. 確保例外被捕獲](#3-確保例外被捕獲)
- [常見問題](#常見問題)
  - [Q1：APM 資料未出現在 Dashboard](#q1apm-資料未出現在-dashboard)
  - [Q2：缺少 apm_name 參數錯誤](#q2缺少-apm_name-參數錯誤)
  - [Q3：Transaction 未正確結束](#q3transaction-未正確結束)

本文件詳細說明 wecpy 框架中 APMManager（Application Performance Monitoring）的使用方式。

## config.yaml 設定

```yaml
Apm:
  apmserver:
    enabled: true
    server_url: http://ctpilotapm:8200
```

### 設定欄位說明

| 欄位 | 說明 | 必要 |
|-----|------|-----|
| enabled | 是否啟用 APM | ✅ |
| server_url | APM Server 位址 | ✅ |

### 環境差異

```yaml
# PILOT 環境
Apm:
  apmserver:
    enabled: true
    server_url: http://ctpilotapm:8200

# PROD 環境
Apm:
  apmserver:
    enabled: true
    server_url: http://ctprodapm:8200
```

## 初始化

**重要**：APMManager **必須**傳入 `apm_name` 參數。APMManager 採用 **Singleton 模式**（透過 `__new__` 實作），同一個 `apm_name` 只會建立一個實例。

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.apm_manager.apm_manager import APMManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

# 初始化 - 必須傳入 apm_name
apm = APMManager("apmserver")

# Singleton 模式：相同 apm_name 會回傳同一實例
apm1 = APMManager("apmserver")
apm2 = APMManager("apmserver")
assert apm1 is apm2  # True
```

## API 方法參考

| 方法 | 說明 |
|-----|------|
| `__init__(apm_name)` | 初始化（Singleton，同一 apm_name 只建立一個實例） |
| `__enter__()` / `__exit__()` | Context Manager 支援 |
| `begin_transaction(transaction_name=None)` | 開始一個 APM transaction |
| `end_transaction(result="")` | 結束目前 transaction，帶結果標籤 |
| `capture_exception(exc_info=None, handled=True, **kwargs)` | 捕捉例外並上報 |
| `capture_error_message(message=None, param_message=None, **kwargs)` | 捕捉自訂錯誤訊息（不需要 exception） |
| `add_label(**kwargs)` | 在 transaction 中加入自訂標籤 |
| `capture(transaction_name=None)` | 裝飾器模式，自動包裝 function 為 transaction |
| `get_version(package_name) → str` | 靜態方法，取得指定套件版本 |
| `get_import_string(cls) → str` | 靜態方法，取得類別的 import 路徑字串 |

## 三種使用模式

### 模式一：手動控制（官方推薦）

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.apm_manager.apm_manager import APMManager

apm = APMManager("apmserver")

# 開始事務
apm.begin_transaction()

try:
    # 業務邏輯
    process_data()
    
    # 成功結束
    apm.end_transaction("success")
    
except Exception as e:
    log.error(f"Error: {e}")
    # 記錄例外
    apm.capture_exception()
    # 失敗結束
    apm.end_transaction("error")
    raise
```

### 模式二：Context Manager

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.apm_manager.apm_manager import APMManager

# 使用 with 語法
with APMManager("apmserver") as apm:
    apm.begin_transaction()
    
    # 業務邏輯
    process_data()
    
    # 自動處理結束
```

### 模式三：Decorator（@apm.capture）

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.apm_manager.apm_manager import APMManager

apm = APMManager("apmserver")

@apm.capture()
def my_function():
    """整個函式會被追蹤"""
    pass

@apm.capture("custom_span_name")
def another_function():
    """使用自訂名稱追蹤"""
    pass
```

## 完整範例

### ETL 排程任務

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.apm_manager.apm_manager import APMManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def main():
    """ETL 排程任務，帶 APM 監控"""
    apm = APMManager("apmserver")
    apm.begin_transaction()
    
    try:
        log.info("ETL 任務開始")
        
        # 執行 ETL
        from department_salary_etl import DepartmentSalaryETL
        etl = DepartmentSalaryETL("2024")
        etl.run()
        
        log.info("ETL 任務完成")
        apm.end_transaction("success")
        
    except Exception as e:
        log.error(f"ETL 任務失敗: {e}")
        apm.capture_exception()
        apm.end_transaction("error")
        raise

if __name__ == "__main__":
    main()
```

### 使用 with 語法的 ETL

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.apm_manager.apm_manager import APMManager

if __name__ == "__main__":
    with APMManager("apmserver") as apm:
        apm.begin_transaction()
        
        from department_salary_etl import DepartmentSalaryETL
        etl = DepartmentSalaryETL("2024")
        etl.run()
```

### Kafka Listener 監控

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.kafka_manager.base_kafka_listener import BaseKafkaListener
from wecpy.apm_manager.apm_manager import APMManager
from wecpy.log_manager import LogManager
import json

log = LogManager.get_logger()

class MonitoredListener(BaseKafkaListener):
    
    def __init__(self, config_name: str):
        super().__init__(config_name, callback=self.on_message_received)
        self.apm = APMManager("apmserver")
    
    def on_message_received(self, message: str):
        self.apm.begin_transaction()
        
        try:
            data = json.loads(message)
            log.info("收到訊息", "kafka_receive")
            
            # 業務邏輯
            self.process_business(data)
            
            log.info("處理完成", "kafka_complete")
            self.apm.end_transaction("success")
            
        except Exception as e:
            log.error(f"處理失敗: {e}")
            self.apm.capture_exception()
            self.apm.end_transaction("error")
    
    def process_business(self, data: dict):
        """業務邏輯"""
        pass

if __name__ == "__main__":
    listener = MonitoredListener("eda")
    listener.start()
    
    try:
        input("Press Enter to stop...")
    finally:
        listener.stop()
```

## 其他方法

### add_label - 加入自訂標籤

在 transaction 中加入自訂標籤，可用於在 APM Dashboard 中搜尋和分類。

```python
apm = APMManager("apmserver")
apm.begin_transaction()

# 加入自訂標籤（key=value 形式）
apm.add_label(system="IRS", module="ETL", lot_id="LOT001")

# 業務邏輯
process_data()

apm.end_transaction("success")
```

### capture_error_message - 捕捉自訂錯誤訊息

不需要實際 exception，直接記錄錯誤訊息到 APM。適用於業務邏輯判斷的錯誤。

```python
apm = APMManager("apmserver")
apm.begin_transaction()

result = validate_data(data)
if not result.is_valid:
    # 不是 exception，但仍需記錄到 APM
    apm.capture_error_message(
        message=f"資料驗證失敗: {result.error}",
        param_message="資料驗證失敗: %s"
    )

apm.end_transaction("validation_failed")
```

### get_version / get_import_string - 靜態工具方法

```python
from wecpy.apm_manager.apm_manager import APMManager

# 取得指定套件的版本
version = APMManager.get_version("wecpy")
print(version)  # e.g., "1.2.3"

# 取得類別的 import 路徑字串
import_str = APMManager.get_import_string(APMManager)
print(import_str)  # e.g., "wecpy.apm_manager.apm_manager.APMManager"
```

## 最佳實務

### 1. 確保 Transaction 完整性
```python
apm.begin_transaction()
try:
    # 業務邏輯
    pass
    apm.end_transaction("success")
except Exception:
    apm.capture_exception()
    apm.end_transaction("error")
    raise
```

### 2. 有意義的 Transaction 結果
```python
# ✅ 好的結果標籤
apm.end_transaction("success")
apm.end_transaction("error")
apm.end_transaction("timeout")
apm.end_transaction("validation_failed")

# ❌ 不好的結果標籤
apm.end_transaction("done")
apm.end_transaction("1")
```

### 3. 確保例外被捕獲
```python
try:
    result = might_fail()
except Exception:
    apm.capture_exception()  # 確保例外被記錄
    raise
```

## 常見問題

### Q1：APM 資料未出現在 Dashboard
```
原因：可能是 enabled=false 或網路問題
解決：
1. 確認 Apm.apmserver.enabled = true
2. 確認 server_url 正確
3. 確認網路可連通 APM Server
4. 確認有呼叫 begin_transaction() 和 end_transaction()
5. 檢查應用程式日誌是否有 APM 相關錯誤
```

### Q2：缺少 apm_name 參數錯誤
```
原因：APMManager 初始化時未傳入 apm_name
解決：
# ❌ 錯誤
apm = APMManager()

# ✅ 正確
apm = APMManager("apmserver")
```

### Q3：Transaction 未正確結束
```
原因：未呼叫 end_transaction() 或例外未處理
解決：
1. 確保所有路徑都有呼叫 end_transaction()
2. 使用 try-finally 確保結束
3. 或使用 with 語法自動處理
```
