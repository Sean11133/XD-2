---
name: wecpy-messaging
description: >-
  This skill should be used when the user asks about "Kafka consumer 消費 topic 監聴", "BaseKafkaListener on_message",
  "KafkaTransportImpl send 傳送訊息", "KafkaTransport request-response inbox",
  "WecApplication 多 listener 生命週期 start stop", "WecDoc XML payload to_xml_string",
  "NotificationManger send_alarm 告警", "send_mail 寄信", "WecException error_code",
  or needs wecpy Kafka messaging, event-driven, or notification capabilities.
  (wecpy v1.11.1)
---

# wecpy-messaging

## 首要原則 — 使用 wecpy，不要重造輪子

> **AI 在實作時，必須優先調用 wecpy 已提供的方法，嚴禁自行重新實作 wecpy 已涵蓋的功能。**

- **禁止**自行用 `kafka-python` / `confluent_kafka` 建立 consumer → 使用 `BaseKafkaListener` 或 `WecApplication`
- **禁止**自行用 `kafka-python` 建立 producer 發送訊息 → 使用 `KafkaTransportImpl.send()` / `TransportFactory`
- **禁止**自行建構 XML payload → 使用 `WecDoc` 的 `add_as_*()` / `to_xml_string()`
- **禁止**自行用 `smtplib` 發送郵件或告警 → 使用 `NotificationManger.send_mail()` / `send_alarm()`
- **禁止**自行管理 Kafka consumer group 生命週期 → 使用 `WecApplication.start()` / `stop()`
- **禁止**自行實作 request-response 模式 → 使用 `KafkaTransportImpl.send_request()`

如果需求可以被本 skill 列出的 API 滿足，就必須使用該 API。只有在 wecpy 確實不提供對應功能時，才能自行實作。

## 適用情境

- 監聽 Kafka topic 並處理訊息
- 需要 request-response inbox 模式
- 建立事件驅動應用程式
- 處理 WecDoc XML payload
- 發送告警或通知郵件

## Kafka 選型決策

1. 單純消費 + callback: 使用 `BaseKafkaListener`
2. 需要 WecDoc 封裝或 request-response: 使用 `KafkaTransport`
3. 需要多 listener 與應用生命週期管理: 使用 `WecApplication`

## 設計模式

| 模組              | 模式            | 註記                       |
| ----------------- | --------------- | -------------------------- |
| BaseKafkaListener | Template Method | 子類實作 on_message()      |
| WecApplication    | Composite       | 多 listener 生命週期管理   |
| KafkaTransport    | Facade          | 封裝 send/request-response |
| WecDoc            | Value Object    | XML payload 封裝           |

## API Surface (Anti-Hallucination)

### BaseKafkaListener

- `BaseKafkaListener(name, callback)`
- `consume()` — 開始消費迴圈
- `start()` — 啟動 listener
- `stop()` — 停止 listener
- `cleanup()` — 釋放資源
- `on_message(message)` — 子類覆寫: 處理單一訊息

### KafkaTransportImpl

- `send(wec_doc)`
- `send_request(wec_doc, timeout)`
- `subscribe(topic)`, `unsubscribe(topic)`
- `join_group()`, `leave_group()`
- `set_message_callback(callback)`
- `lazy_init()`

### TransportFactory

- `create_transport() -> KafkaTransportImpl`
- `open()`, `close()`

### MessageFactory

- `create_message() -> WecDoc`
- `set_message_type(msg_type: str)`

### WecApplication

- `IWecApplication.start()`, `IWecApplication.stop()`
- `WecApplicationBase` — 基礎實作
- `WecApplicationCommandListener.command_received(command)` — 子類覆寫
- `KafkaExceptionOptions` (1.9.1+) — 配置 Kafka 例外處理行為

### WecDoc

**Add 系列**

- `add_as_string(key, value)`, `add_as_integer(key, value)`, `add_as_float(key, value)`, `add_as_double(key, value)`
- `add_as_boolean(key, value)`, `add_as_byte(key, value)`, `add_as_long(key, value)`, `add_as_short(key, value)`
- `add(key, value)` — 通用 add

**Get 系列**

- `get(key)` — 取得原始屬性
- `get_as_string(key)`, `get_as_integer(key)`, `get_as_float(key)`, `get_as_double(key)`
- `get_as_boolean(key)`, `get_as_byte(key)`, `get_as_bytes(key)`, `get_as_document(key)`
- `get_as_string_array(key)`, `get_as_integer_array(key)`, `get_as_float_array(key)`

**物件處理**

- `contains(key) -> bool`
- `remove(key)`
- `get_field_names() -> list[str]`
- `get_message() -> str`
- `to_message() -> bytes`
- `to_xml_string()`, `convert_from_xml(xml_str)`
- `get_message_size() -> int`

### NotificationManger — 注意：套件名為官方 typo

```python
from wecpy.notification_manger import NotificationManger  # typo 為官方套件名
```

- `send_alarm()`
- `send_alarm_to_receivers()`
- `send_mail()`
- `create_mail_body()`
- `dataframe_to_html_table()`
- `image_to_base64(image_path: str) -> str`

### KafkaMessage / IMessage 介面

```python
from wecpy.baselibrary.kafka_message import KafkaMessage
from wecpy.baselibrary.imessage import IMessage
```

`KafkaMessage` 實作 `IMessage` 介面，提供與 `WecDoc` 類似的 add/get 系列：

- `add(key, value)`, `add_as_string(key, value)`, `add_as_integer(key, value)` 等
- `get(key)`, `get_as_bytes(key)`, `get_field_names()`, `get_num_fields()`
- `get_reply_subject()`, `set_reply_subject()`, `get_send_subject()`, `set_send_subject()`
- `contains(key)`, `remove(key)`, `reset()`
- `load_xml_string(xml_str)`, `to_xml_string()`

### WecException

```python
from wecpy.baselibrary.wec_exception import WecException
```

- `WecException(message, error_code)`
- `get_error_code() -> str`

### ActionType

```python
from wecpy.baselibrary.action_type import ActionType
```

常用值: `Query`, `Error`, `Other`, `NONE`, `SetEnable`, `SetDisable`, `SystemInfo`,
`EnableLogTrace`, `DisableLogTrace`, `EnableEmailException`, `DisableEmailException` 等

### WecAppConfig

```python
# 透過 config.yaml WecApp 區段自動載入
```

- `message_type`, `site`, `thread_count`, `always_reply`, `send_reply_retry_count`

## 常見幻覺與禁止事項

- 不存在 `BaseKafkaListener.start_background()`
- 不存在 `KafkaTransport.publish_json()`
- 不存在 `WecDoc.to_json()`
- 不存在 `WecDoc.to_dict()` — 正確為 `to_xml_string()` 或 `get_message()`
- 不存在 `NotificationManager.send_slack()`（注意: 類名為 `NotificationManger`，套件也是 `notification_manger`）
- 不存在 `KafkaMessage.to_json()` — 正確為 `to_xml_string()`
- 不存在 `WecApplication.run()` — 正確為 `start()` / `stop()`
- 不存在 `MessageFactory.create_kafka_message()` — 正確為 `create_message()`
