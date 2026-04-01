# WecTransport 詳解

本文件詳細說明 wecpy 框架中 WecTransport（Kafka 生產者）的使用方式。

## config.yaml 設定

```yaml
WecApp:
  transport:
    message_type: Kafka
    topic: 'CTPILOT1-TEST-KAFKA'
    bootstrap.servers: fpkafka1:9092,fpkafka2:9092,fpkafka3:9092
    retries: 0
    linger.ms: 1
    message.max.bytes: 1000012
    inbox.port.range: 50000-50100
```

### 設定欄位說明

| 欄位 | 說明 | 必要 |
|-----|------|-----|
| message_type | 訊息類型，固定為 `Kafka` | ✅ |
| topic | 發送的 Kafka Topic | ✅ |
| bootstrap.servers | Kafka Broker 位址清單 | ✅ |
| retries | 重試次數 | ⚠️ |
| linger.ms | 批次等待時間（毫秒） | ⚠️ |
| message.max.bytes | 最大訊息大小（bytes） | ⚠️ |
| inbox.port.range | 收件埠範圍 | ⚠️ |

## 基本使用

### 直接實例化

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.baselibrary.wec_transport import WecTransport
from wecpy.baselibrary.wec_doc import WecDoc
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def main():
    try:
        # 建立傳輸物件（傳入 config.yaml 中 WecApp 下的設定名稱）
        transport = WecTransport("transport")
        
        # 建立訊息
        doc = WecDoc()
        doc.add_as_string("LotID", "LOT001")
        doc.add_as_string("EQPID", "EKOXED02")
        doc.add_as_integer("WaferQty", 25)
        doc.add_as_float("ProcessTime", 61.5)
        doc.add_as_double("DoubleValue", 123.456)
        
        # 發送訊息
        transport.send(doc)
        log.info("訊息已發送", "kafka_send")
        
    except Exception as e:
        log.error(f"發送失敗: {e}")

if __name__ == "__main__":
    main()
```

## WecDoc 欄位類型

WecDoc 支援多種資料類型：

```python
from wecpy.baselibrary.wec_doc import WecDoc

doc = WecDoc()

# 字串
doc.add_as_string("LotID", "LOT001")

# 整數
doc.add_as_integer("WaferQty", 25)

# 浮點數（單精度）
doc.add_as_float("ProcessTime", 61.5)

# 浮點數（雙精度）
doc.add_as_double("DoubleValue", 123.456789)
```

## 批次發送

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.baselibrary.wec_transport import WecTransport
from wecpy.baselibrary.wec_doc import WecDoc
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def send_batch_messages():
    """批次發送訊息"""
    transport = WecTransport("transport")
    
    sent_count = 0
    failed_count = 0
    
    for i in range(100):
        try:
            doc = WecDoc()
            doc.add_as_string("LotID", f"LOT{i:03d}")
            doc.add_as_string("EQPID", "EKOXED02")
            doc.add_as_integer("WaferQty", 25)
            doc.add_as_float("ProcessTime", 61.5)
            doc.add_as_double("Sequence", float(i))
            
            transport.send(doc)
            sent_count += 1
            
        except Exception as e:
            log.error(f"發送失敗: {e}")
            failed_count += 1
    
    log.info(f"批次發送完成：成功 {sent_count}，失敗 {failed_count}")

if __name__ == "__main__":
    send_batch_messages()
```

## 整合資料庫

從資料庫查詢資料後發送到 Kafka：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.baselibrary.wec_transport import WecTransport
from wecpy.baselibrary.wec_doc import WecDoc
from wecpy.database_manager.oracle_manager import OracleManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def publish_pending_events():
    """發布待處理的事件"""
    oracle = OracleManager("TRAINDB")
    transport = WecTransport("transport")
    
    # 查詢待發送的事件
    df = oracle.query_dataframe("""
        SELECT LOT_ID, STEP_ID, STATUS, CREATE_TIME
        FROM PENDING_EVENTS
        WHERE SENT_FLAG = 'N'
        ORDER BY CREATE_TIME
    """)
    
    log.info(f"找到 {len(df)} 筆待發送事件")
    
    for _, row in df.iterrows():
        try:
            # 建立訊息
            doc = WecDoc()
            doc.add_as_string("LotID", row["LOT_ID"])
            doc.add_as_string("StepID", row["STEP_ID"])
            doc.add_as_string("Status", row["STATUS"])
            doc.add_as_string("CreateTime", str(row["CREATE_TIME"]))
            
            # 發送訊息
            transport.send(doc)
            
            # 更新發送標記
            oracle.execute_sql("""
                UPDATE PENDING_EVENTS 
                SET SENT_FLAG = 'Y', SENT_TIME = SYSDATE
                WHERE LOT_ID = :lot_id AND STEP_ID = :step_id
            """, params={"lot_id": row["LOT_ID"], "step_id": row["STEP_ID"]})
            
            log.info(f"已發送事件: {row['LOT_ID']}/{row['STEP_ID']}")
            
        except Exception as e:
            log.error(f"發送失敗: {row['LOT_ID']} - {e}")
    
    log.info("事件發布完成")

if __name__ == "__main__":
    publish_pending_events()
```

## Request-Reply 模式（同步等待回覆）

WecTransport 除了單向 `send()` 外，也支援 Request-Reply 模式：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.baselibrary.wec_transport import WecTransport
from wecpy.baselibrary.wec_doc import WecDoc
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def send_and_wait_reply():
    """發送請求並同步等待回覆"""
    transport = WecTransport("transport")

    doc = WecDoc()
    doc.add_as_string("LotID", "LOT001")
    doc.add_as_string("Action", "QUERY_STATUS")

    # send_request: 同步發送並等待回覆（timeout 秒）
    envelope = transport.send_request(
        doc=doc,
        send_subject="TARGET.SERVICE.TOPIC",
        timeout=30  # 等待 30 秒
    )

    if envelope:
        reply_doc = envelope.extract_document()
        log.info(f"收到回覆: {reply_doc.to_xml_string()}")
    else:
        log.error("等待回覆逾時")

if __name__ == "__main__":
    send_and_wait_reply()
```

### send_reply — 回覆已收到的請求

```python
# 在 message listener callback 中回覆
def on_message(transport, send_subject, reply_subject, envelope):
    reply_doc = WecDoc()
    reply_doc.add_as_string("result", "success")

    # 回覆給原始請求者
    transport.send_reply(
        doc=reply_doc,
        received_envelope=envelope
    )
```

## 動態訂閱與連線管理

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.baselibrary.wec_transport import WecTransport
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def dynamic_subscribe():
    """動態訂閱 topic 並接收訊息"""
    transport = WecTransport("transport")

    # 設定訊息接收 callback
    transport.set_message_listener(callback=my_message_handler)

    # 動態訂閱一個或多個 topic
    transport.subscribe("TOPIC.A", "TOPIC.B")
    log.info("已訂閱 TOPIC.A, TOPIC.B")

    try:
        input("Press Enter to stop...")
    finally:
        # 取消訂閱
        transport.unsubscribe("TOPIC.A")
        transport.unsubscribe("TOPIC.B")

        # 關閉連線（釋放資源）
        transport.destroy()
        log.info("已關閉連線")

def my_message_handler(transport, send_subject, reply_subject, envelope):
    """訊息接收 callback"""
    doc = envelope.extract_document()
    log.info(f"收到 [{send_subject}]: {doc.to_xml_string()}")
```

## WecTransport 方法參考

| 方法 | 說明 | 回傳值 |
|-----|------|--------|
| **發送** | | |
| `send(doc, send_subject, reply_subject, tid)` | 單向發送訊息 | - |
| `send_request(doc, send_subject, timeout=600, tid)` | 同步 Request-Reply（等待回覆） | `WecEnvelope` |
| `send_reply(doc, received_message, received_envelope, tid)` | 回覆已收到的請求 | - |
| **訂閱** | | |
| `subscribe(*subjects)` | 訂閱一個或多個 topic | - |
| `unsubscribe(subject)` | 取消訂閱 | - |
| `set_message_listener(callback)` | 設定訊息接收 callback | - |
| `create_inbox()` | 建立回覆收件匣 | - |
| **群組** | | |
| `join_group(subject, group_name, ...)` | 加入消費者群組 | - |
| `leave_group()` | 離開消費者群組 | - |
| `set_weight(weight)` | 設定 worker 權重 | - |
| **生命週期** | | |
| `destroy()` | 關閉連線並釋放資源 | - |
| **屬性** | | |
| `get_is_busy()` / `set_description(desc)` | 查詢忙碌狀態 / 設定描述 | `bool` / - |
| `get_document_type()` / `set_document_type(type)` | WecEnvelopeType（WecHeader/WecEncryption/WecSign/WecSignEncryption） | - |

## 整合 APM 監控

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.baselibrary.wec_transport import WecTransport
from wecpy.baselibrary.wec_doc import WecDoc
from wecpy.apm_manager.apm_manager import APMManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def send_with_apm():
    """帶 APM 監控的發送"""
    apm = APMManager("apmserver")
    apm.begin_transaction()
    
    try:
        transport = WecTransport("transport")
        
        doc = WecDoc()
        doc.add_as_string("LotID", "LOT001")
        doc.add_as_string("Status", "COMPLETE")
        
        transport.send(doc)
        log.info("訊息已發送", "kafka_send_success")
        
        apm.end_transaction("success")
        
    except Exception as e:
        log.error(f"發送失敗: {e}", "kafka_send_error")
        apm.capture_exception()
        apm.end_transaction("error")
        raise

if __name__ == "__main__":
    send_with_apm()
```

## 最佳實務

### 1. 錯誤處理與重試
```python
import time

def send_with_retry(transport, doc, max_retries=3):
    """帶重試機制的發送"""
    for attempt in range(max_retries):
        try:
            transport.send(doc)
            return True
        except Exception as e:
            log.warning(f"發送失敗（第 {attempt + 1} 次）: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # 指數退避
    
    log.error("發送失敗，已達最大重試次數")
    return False
```

### 2. 訊息追蹤
```python
import uuid

def send_tracked_message(transport, lot_id: str):
    """發送可追蹤的訊息"""
    message_id = str(uuid.uuid4())
    
    doc = WecDoc()
    doc.add_as_string("MessageID", message_id)
    doc.add_as_string("LotID", lot_id)
    
    transport.send(doc)
    log.info(f"訊息已發送，ID: {message_id}")
    
    return message_id
```

## 常見問題

### Q1：訊息發送逾時
```
原因：Kafka broker 不可用或網路問題
解決：
1. 確認 bootstrap.servers 正確
2. 檢查網路連通性
3. 增加 retries 設定
```

### Q2：訊息過大
```
原因：訊息超過 message.max.bytes 限制
解決：
1. 增加 message.max.bytes 設定
2. 壓縮訊息內容
3. 拆分大訊息
```

### Q3：發送後訊息遺失
```
原因：acks 設定或 broker 問題
解決：
1. 確認 Kafka broker 狀態
2. 實作發送確認機制
```
