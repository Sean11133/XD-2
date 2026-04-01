---
name: wecpy-kafka
description: >
  Invoke for ANY wecpy Kafka messaging operation.
  Covers: BaseKafkaListener (consumer/callback), WecTransport (producer/send/send_request/subscribe/unsubscribe/destroy),
  WecApplication (bidirectional Request-Reply), WecDoc (string/integer/long/short/float/double/boolean/byte), WecEnvelope.
  Keywords: Kafka、訊息、消費/生產、Listener、Producer、Consumer、topic、subscribe、訂閱、send_request、Request-Reply、
  WecDoc、WecApplication、WecTransport、message queue、MQ、事件監聽、即時處理。
  Excludes HTTP/FTP/S3→wecpy-io, DB→wecpy-database, APM/COP→wecpy-monitoring.
---

# wecpy Kafka 訊息佇列技能

本技能提供 wecpy 框架的 Kafka 訊息處理指南，支援消費者、生產者、雙向通訊三種模式。

> **前置條件**：請先閱讀 `wecpy-core` 技能了解 ConfigManager 初始化規範。

## 支援的 Kafka 元件

| 元件 | 用途 | 使用模式 |
|-----|------|---------|
| `BaseKafkaListener` | Kafka 消費者（Consumer） | 繼承 + callback |
| `WecTransport` | Kafka 生產者（Producer） | 直接實例化 |
| `WecApplication` | 雙向通訊（Request-Reply） | 繼承 + callback |

## 快速開始

### 1. config.yaml 設定

```yaml
# BaseKafkaListener 使用
Kafka:
  eda:
    topic: 'CTPILOT1-TEST-KAFKA'
    group.id: 'CTPILOT1-TEST-KAFKA'
    bootstrap.servers: fpkafka1:9092,fpkafka2:9092,fpkafka3:9092
    session.timeout.ms: 60000

# WecTransport / WecApplication 使用
WecApp:
  transport:
    message_type: Kafka
    topic: 'CTPILOT1-TEST-KAFKA'
    bootstrap.servers: fpkafka1:9092,fpkafka2:9092,fpkafka3:9092
    retries: 0
    linger.ms: 1
    message.max.bytes: 1000012
    inbox.port.range: 50000-50100

  app:
    message_type: Kafka
    thread_count: 10
    always_reply: True
    site: CTPILOT1
    topic: 'CTPILOT1-TEST-KAFKA'
    group.id: 'CTPILOT1-TEST-KAFKA-APP'
    bootstrap.servers: fpkafka1:9092,fpkafka2:9092,fpkafka3:9092
    session.timeout.ms: 60000
    inbox.port.range: 10000-10200
```

### 2. 消費者（BaseKafkaListener）- Callback 模式

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.kafka_manager.base_kafka_listener import BaseKafkaListener
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

class MyKafkaListener(BaseKafkaListener):
    """自訂 Kafka 消費者 - 使用 callback 模式"""
    
    def __init__(self, name):
        super().__init__(name, callback=self.on_message_received)
    
    def on_message_received(self, message: str):
        """處理接收到的訊息"""
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
    log.info('啟動 Kafka Listener')
    listener = MyKafkaListener("eda")
    listener.start()
    
    try:
        input("Press Enter to stop...")
    except Exception as e:
        log.error(f'Error: {e}')
    finally:
        listener.stop()
```

### 3. 生產者（WecTransport）

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.baselibrary.wec_transport import WecTransport
from wecpy.baselibrary.wec_doc import WecDoc
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def main():
    try:
        # 建立傳輸物件（使用 config.yaml 中的 transport 設定）
        transport = WecTransport("transport")
        
        # 建立訊息
        doc = WecDoc()
        doc.add_as_string("LotID", "LOT001")
        doc.add_as_string("EQPID", "EKOXED02")
        doc.add_as_integer("WaferQty", 25)
        doc.add_as_float("ProcessTime", 61.5)
        
        # 發送訊息
        transport.send(doc)
        log.info("訊息已發送")
        
    except Exception as e:
        log.error(f"發送失敗: {e}")

if __name__ == "__main__":
    main()
```

### 4. 雙向通訊（WecApplication）

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.baselibrary.wec_application import WecApplication
from wecpy.baselibrary.wec_doc import WecDoc
from wecpy.baselibrary.wec_envelope import WecEnvelope
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

class MyWecApp(WecApplication):
    """自訂雙向通訊應用"""
    
    def __init__(self, name):
        super().__init__(name, self.on_message_received)
    
    def on_message_received(self, send_subject: str, reply_subject, 
                            envelope: WecEnvelope) -> WecDoc:
        """處理請求並回覆"""
        result = WecDoc()
        try:
            # 從 envelope 取出文件
            doc = envelope.extract_document()
            log.info(f"收到請求: {doc.to_xml_string()}")
            
            # 處理業務邏輯
            result.add_as_string("result", "success")
            
        except Exception as e:
            log.error(f"處理失敗: {e}")
            result.add_as_string("result", "fail")
        
        return result

if __name__ == "__main__":
    app = MyWecApp("app")
    app.start()
```

## WecDoc 資料傳輸物件

WecDoc 是 wecpy 中跨元件傳輸資料的標準物件：

```python
from wecpy.baselibrary.wec_doc import WecDoc

# 建立 WecDoc
doc = WecDoc()

# 設定不同類型的值
doc.add_as_string("LotID", "LOT001")
doc.add_as_string("Status", "COMPLETE")
doc.add_as_integer("WaferQty", 25)        # 32-bit 整數
doc.add_as_long("Sequence", 1234567890)    # 64-bit 長整數
doc.add_as_short("Priority", 1)            # 16-bit 短整數
doc.add_as_float("ProcessTime", 61.5)      # 單精度浮點
doc.add_as_double("Yield", 98.765432)      # 雙精度浮點
doc.add_as_boolean("IsComplete", True)     # 布林值
doc.add_as_byte("FlagByte", 255)           # 位元組

# 轉換為 XML 字串
xml_str = doc.to_xml_string()
print(xml_str)
```

## 應用類型對應

| app_type | 使用元件 | 說明 |
|----------|---------|------|
| Listener | BaseKafkaListener | 監聽 Kafka 訊息 |
| Schedule | WecTransport | 排程發送訊息 |
| Web | WecApplication | API + 訊息處理 |

## 詳細參考文件

- [BaseKafkaListener 詳解](references/listener.md) — 當使用者需要 Kafka 消費者進階設定（多執行緒、offset 管理、錯誤處理、graceful shutdown）時閱讀
- [WecTransport 詳解](references/producer.md) — 當使用者需要 Kafka 生產者進階設定（批次發送、訊息序列化、delivery 確認）時閱讀
- [WecApplication 詳解](references/application.md) — 當使用者需要雙向通訊（Request-Reply）模式、WecEnvelope 處理時閱讀
- [WecDoc 使用指南](references/wec-doc.md) — 當使用者需要 WecDoc 完整 API（資料型別、XML 轉換、巢狀結構）時閱讀

## 資源檔案

- [Kafka config.yaml 模板](assets/kafka-config.yaml)

## 常見問題

### Q1：連線失敗
```
檢查項目：
1. bootstrap.servers 是否正確
2. 網路是否可連通 Kafka brokers
3. 確認 Kafka cluster 狀態正常
```

### Q2：訊息未收到
```
檢查項目：
1. topic 名稱是否正確
2. group.id 是否與其他消費者衝突
3. 確認訊息已發送到正確的 topic
```

### Q3：訊息處理失敗
```
檢查項目：
1. callback 方法是否有例外
2. 訊息格式是否正確
3. 檢查日誌中的錯誤訊息
```
