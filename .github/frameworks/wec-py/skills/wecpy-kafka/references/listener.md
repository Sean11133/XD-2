# BaseKafkaListener 詳解


## 目錄

- [config.yaml 設定](#configyaml-設定)
  - [設定欄位說明](#設定欄位說明)
  - [進階設定](#進階設定)
- [基本使用](#基本使用)
  - [繼承 + Callback 模式（官方推薦）](#繼承--callback-模式官方推薦)
- [訊息處理模式](#訊息處理模式)
  - [處理 JSON 訊息](#處理-json-訊息)
  - [分離訊息處理類別](#分離訊息處理類別)
- [整合資料庫](#整合資料庫)
- [整合 APM 監控](#整合-apm-監控)
- [最佳實務](#最佳實務)
  - [1. 錯誤處理](#1-錯誤處理)
  - [2. 冪等處理](#2-冪等處理)
  - [3. 日誌記錄](#3-日誌記錄)
- [常見問題](#常見問題)
  - [Q1：Consumer lag 過高](#q1consumer-lag-過高)
  - [Q2：重複處理訊息](#q2重複處理訊息)
  - [Q3：連線中斷](#q3連線中斷)

本文件詳細說明 wecpy 框架中 BaseKafkaListener（Kafka 消費者）的使用方式。

## config.yaml 設定

```yaml
Kafka:
  eda:
    topic: 'CTPILOT1-TEST-KAFKA'
    group.id: 'CTPILOT1-TEST-KAFKA'
    bootstrap.servers: fpkafka1:9092,fpkafka2:9092,fpkafka3:9092
    session.timeout.ms: 60000
```

### 設定欄位說明

| 欄位 | 說明 | 必要 |
|-----|------|-----|
| topic | 訂閱的 Kafka Topic | ✅ |
| group.id | 消費者群組 ID | ✅ |
| bootstrap.servers | Kafka Broker 位址清單 | ✅ |
| session.timeout.ms | Session 逾時時間（毫秒） | ⚠️ |

### 進階設定

```yaml
Kafka:
  eda:
    topic: 'CTPILOT1-TEST-KAFKA'
    group.id: 'CTPILOT1-TEST-KAFKA'
    bootstrap.servers: fpkafka1:9092,fpkafka2:9092,fpkafka3:9092
    session.timeout.ms: 60000
    auto.offset.reset: earliest    # earliest | latest
    enable.auto.commit: true
    max.poll.records: 500
```

## 基本使用

### 繼承 + Callback 模式（官方推薦）

BaseKafkaListener 採用繼承 + callback 模式：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.kafka_manager.base_kafka_listener import BaseKafkaListener
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

class MyKafkaListener(BaseKafkaListener):
    """自訂 Kafka 消費者 - 使用 callback 模式"""
    
    def __init__(self, name):
        # name 為 config.yaml 中 Kafka 區塊下的設定名稱（如 "eda"）
        super().__init__(name, callback=self.on_message_received)
    
    def on_message_received(self, message: str):
        """
        處理接收到的訊息
        
        Args:
            message: 接收到的訊息字串
        """
        try:
            log.info(f"收到訊息: {message}", "kafka_receive")
            
            # 業務邏輯處理
            self.process_message(message)
            
            log.info("訊息處理完成", "kafka_complete")
            
        except Exception as e:
            log.error(f"訊息處理失敗: {e}", "kafka_error")
    
    def process_message(self, message: str):
        """業務邏輯處理"""
        # TODO: 實作業務邏輯
        pass

if __name__ == "__main__":
    log.info("啟動 Kafka Listener")
    
    listener = MyKafkaListener("eda")  # 使用 config.yaml 中的 "eda" 設定
    listener.start()
    
    try:
        input("Press Enter to stop...")
    except Exception as e:
        log.error(f"Error: {e}")
    finally:
        listener.stop()
```

## 訊息處理模式

### 處理 JSON 訊息

```python
import json

class JsonKafkaListener(BaseKafkaListener):
    
    def __init__(self, name):
        super().__init__(name, callback=self.on_message_received)
    
    def on_message_received(self, message: str):
        try:
            # 解析 JSON 訊息
            data = json.loads(message)
            
            lot_id = data.get("lot_id")
            status = data.get("status")
            
            log.info(f"處理批號: {lot_id}, 狀態: {status}")
            
            # 依狀態處理
            if status == "COMPLETE":
                self.handle_complete(data)
            elif status == "ERROR":
                self.handle_error(data)
            
        except json.JSONDecodeError as e:
            log.error(f"JSON 解析失敗: {e}")
        except Exception as e:
            log.error(f"處理失敗: {e}")
    
    def handle_complete(self, data):
        """處理完成狀態"""
        pass
    
    def handle_error(self, data):
        """處理錯誤狀態"""
        pass
```

### 分離訊息處理類別

建議將訊息處理邏輯分離到獨立的類別：

```python
# message_process.py
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

class MessageProcess:
    """訊息處理類別"""
    
    def do_message(self, message: str):
        """處理訊息"""
        log.info(f"Processing message: {message}")
    
    def do_process(self, message: str):
        """執行業務邏輯"""
        # TODO: 實作業務邏輯
        pass
```

```python
# main.py
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.kafka_manager.base_kafka_listener import BaseKafkaListener
from wecpy.log_manager import LogManager
from message_process import MessageProcess

log = LogManager.get_logger()

class MyKafkaListener(BaseKafkaListener):
    def __init__(self, name):
        super().__init__(name, callback=self.on_message_received)
    
    def on_message_received(self, message: str):
        try:
            log.info(f"Received message: {message}")
            
            # 使用獨立的處理類別
            message_process = MessageProcess()
            message_process.do_message(message)
            message_process.do_process(message)
            
        except Exception as e:
            log.error(f"Error processing message: {e}")

if __name__ == "__main__":
    log.info("Hello World")
    
    listener = MyKafkaListener("eda")
    listener.start()
    
    try:
        input("Press Enter to stop...")
    except Exception as e:
        log.error(f"Error: {e}")
        raise e
    finally:
        listener.stop()
```

## 整合資料庫

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.kafka_manager.base_kafka_listener import BaseKafkaListener
from wecpy.database_manager.oracle_manager import OracleManager
from wecpy.log_manager import LogManager
import json

log = LogManager.get_logger()

class DatabaseKafkaListener(BaseKafkaListener):
    """整合資料庫的 Kafka 消費者"""
    
    def __init__(self, name: str):
        super().__init__(name, callback=self.on_message_received)
        # 初始化資料庫連線
        self.oracle = OracleManager("TRAINDB")
    
    def on_message_received(self, message: str):
        try:
            data = json.loads(message)
            
            # 查詢相關資料
            df = self.oracle.query_dataframe(
                "SELECT * FROM PROCESS_DATA WHERE LOT_ID = :lot_id",
                params={"lot_id": data["lot_id"]}
            )
            
            if len(df) > 0:
                log.info(f"找到 {len(df)} 筆相關資料")
                self.process_with_db_data(data, df)
            else:
                log.warning(f"找不到批號 {data['lot_id']} 的資料")
            
        except Exception as e:
            log.error(f"處理失敗: {e}")
    
    def process_with_db_data(self, kafka_data, db_data):
        """整合 Kafka 訊息和資料庫資料進行處理"""
        pass

if __name__ == "__main__":
    listener = DatabaseKafkaListener("eda")
    listener.start()
    
    try:
        input("Press Enter to stop...")
    finally:
        listener.stop()
```

## 整合 APM 監控

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.kafka_manager.base_kafka_listener import BaseKafkaListener
from wecpy.apm_manager.apm_manager import APMManager
from wecpy.log_manager import LogManager
import json

log = LogManager.get_logger()

class MonitoredKafkaListener(BaseKafkaListener):
    """帶 APM 監控的 Kafka 消費者"""
    
    def __init__(self, name: str):
        super().__init__(name, callback=self.on_message_received)
        self.apm = APMManager("apmserver")
    
    def on_message_received(self, message: str):
        # 開始 APM 事務
        self.apm.begin_transaction()
        
        try:
            data = json.loads(message)
            log.info(f"收到訊息", "kafka_receive")
            
            # 處理業務邏輯
            self.process_business(data)
            
            log.info("處理完成", "kafka_complete")
            self.apm.end_transaction("success")
            
        except Exception as e:
            log.error(f"處理失敗: {e}", "kafka_error")
            self.apm.capture_exception()
            self.apm.end_transaction("error")
    
    def process_business(self, data: dict):
        """業務邏輯"""
        pass

if __name__ == "__main__":
    listener = MonitoredKafkaListener("eda")
    listener.start()
    
    try:
        input("Press Enter to stop...")
    finally:
        listener.stop()
```

## 最佳實務

### 1. 錯誤處理
```python
def on_message_received(self, message: str):
    try:
        # 處理邏輯
        pass
    except json.JSONDecodeError:
        log.error("訊息格式錯誤，跳過此訊息")
        # 不重新拋出，避免重複處理壞訊息
    except BusinessException as e:
        log.error(f"業務邏輯錯誤: {e}")
        # 可選擇是否重新拋出
    except Exception as e:
        log.error(f"未預期錯誤: {e}")
```

### 2. 冪等處理
```python
def on_message_received(self, message: str):
    data = json.loads(message)
    message_id = data.get("message_id")
    
    # 檢查是否已處理過
    if self.is_processed(message_id):
        log.info(f"訊息 {message_id} 已處理，跳過")
        return
    
    # 處理訊息
    self.process(data)
    
    # 標記為已處理
    self.mark_processed(message_id)
```

### 3. 日誌記錄
```python
def on_message_received(self, message: str):
    log.info("開始處理訊息", "process_start")
    # ...
    log.info("訊息處理完成", "process_complete")
```

## 常見問題

### Q1：Consumer lag 過高
```
原因：處理速度跟不上訊息產生速度
解決：
1. 優化 callback 處理邏輯
2. 增加消費者數量（同一 group.id）
3. 調整 max.poll.records
```

### Q2：重複處理訊息
```
原因：enable.auto.commit 設定或處理失敗
解決：
1. 實作冪等處理
2. 使用訊息 ID 去重
3. 檢查 auto.commit 設定
```

### Q3：連線中斷
```
原因：Kafka broker 不可用或網路問題
解決：
1. 確認 bootstrap.servers 正確
2. 調整 session.timeout.ms
3. 確認網路連通性
```
