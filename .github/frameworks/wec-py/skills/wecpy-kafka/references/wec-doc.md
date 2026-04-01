# WecDoc 使用指南

本文件詳細說明 wecpy 框架中 WecDoc 資料傳輸物件的使用方式。

## 概述

WecDoc 是 wecpy 中跨元件傳輸資料的標準物件，用於 Kafka 訊息的封裝與傳輸。

## Import 路徑

```python
from wecpy.baselibrary.wec_doc import WecDoc
```

## 基本使用

### 建立 WecDoc

```python
from wecpy.baselibrary.wec_doc import WecDoc

# 建立空的 WecDoc
doc = WecDoc()
```

### 新增欄位

WecDoc 支援多種資料類型：

```python
doc = WecDoc()

# 字串類型
doc.add_as_string("LotID", "LOT001")
doc.add_as_string("Status", "COMPLETE")
doc.add_as_string("EQPID", "EKOXED02")

# 整數類型
doc.add_as_integer("WaferQty", 25)
doc.add_as_integer("StepCount", 10)

# 浮點數類型（單精度）
doc.add_as_float("ProcessTime", 61.5)
doc.add_as_float("Temperature", 25.3)

# 浮點數類型（雙精度）
doc.add_as_double("DoubleValue", 123.456789)
doc.add_as_double("Precision", 0.000001)
```

### 轉換為 XML 字串

```python
doc = WecDoc()
doc.add_as_string("LotID", "LOT001")
doc.add_as_integer("WaferQty", 25)

# 轉換為 XML 字串
xml_str = doc.to_xml_string()
print(xml_str)
```

## 完整範例

### 發送訊息

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.baselibrary.wec_transport import WecTransport
from wecpy.baselibrary.wec_doc import WecDoc
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def send_process_event():
    """發送製程事件"""
    transport = WecTransport("transport")
    
    # 建立 WecDoc
    doc = WecDoc()
    doc.add_as_string("LotID", "LOT001")
    doc.add_as_string("EQPID", "EKOXED02")
    doc.add_as_string("Status", "COMPLETE")
    doc.add_as_integer("WaferQty", 25)
    doc.add_as_float("ProcessTime", 61.5)
    doc.add_as_double("Yield", 98.765432)
    
    # 發送
    transport.send(doc)
    log.info("訊息已發送")

if __name__ == "__main__":
    send_process_event()
```

### 批次發送

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.baselibrary.wec_transport import WecTransport
from wecpy.baselibrary.wec_doc import WecDoc
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def send_batch():
    """批次發送訊息"""
    transport = WecTransport("transport")
    
    for i in range(10000):
        doc = WecDoc()
        doc.add_as_string("LotID", f"LOT{i:05d}")
        doc.add_as_string("EQPID", "EKOXED02")
        doc.add_as_integer("WaferQty", 25)
        doc.add_as_float("ProcessTime", 61.5)
        doc.add_as_double("Sequence", float(i))
        
        transport.send(doc)
    
    log.info(f"已發送 10000 筆訊息")

if __name__ == "__main__":
    send_batch()
```

## WecEnvelope 搭配使用

在 WecApplication 中，訊息會包裝在 WecEnvelope 中：

```python
from wecpy.baselibrary.wec_application import WecApplication
from wecpy.baselibrary.wec_doc import WecDoc
from wecpy.baselibrary.wec_envelope import WecEnvelope

class MyApp(WecApplication):
    def __init__(self, name):
        super().__init__(name, self.on_message_received)
    
    def on_message_received(self, send_subject: str, reply_subject, 
                            envelope: WecEnvelope) -> WecDoc:
        # 從 envelope 取出 WecDoc
        doc = envelope.extract_document()
        
        # 取得 XML 內容
        xml_content = doc.to_xml_string()
        print(xml_content)
        
        # 建立回覆
        result = WecDoc()
        result.add_as_string("result", "success")
        return result
```

## 資料類型對照

| WecDoc 方法 | Python 類型 | 說明 |
|------------|-------------|------|
| `add_as_string(key, value)` | str | 字串 |
| `add_as_integer(key, value)` | int | 整數（32-bit） |
| `add_as_long(key, value)` | int | 長整數（64-bit） |
| `add_as_short(key, value)` | int | 短整數（16-bit） |
| `add_as_float(key, value)` | float | 單精度浮點數 |
| `add_as_double(key, value)` | float | 雙精度浮點數 |
| `add_as_boolean(key, value)` | bool | 布林值 |
| `add_as_byte(key, value)` | int | 位元組（0-255） |
| `add(key, value)` | any | 自動推斷類型 |

## 最佳實務

### 1. 使用有意義的欄位名稱
```python
# ✅ 好的命名
doc.add_as_string("LotID", "LOT001")
doc.add_as_string("EquipmentID", "EKOXED02")

# ❌ 不好的命名
doc.add_as_string("id", "LOT001")
doc.add_as_string("eq", "EKOXED02")
```

### 2. 選擇適當的資料類型
```python
# ✅ 整數用 add_as_integer
doc.add_as_integer("WaferQty", 25)

# ✅ 需要精確計算用 add_as_double
doc.add_as_double("Yield", 98.765432)

# ❌ 不要用字串存數字
doc.add_as_string("WaferQty", "25")  # 避免
```

### 3. 統一欄位命名規範
```python
# 建議使用 PascalCase 或 snake_case，整個專案一致
doc.add_as_string("LotID", "LOT001")      # PascalCase
doc.add_as_string("lot_id", "LOT001")     # snake_case
```

## 常見問題

### Q1：如何解析收到的 WecDoc？
```python
# 從 WecEnvelope 取出
doc = envelope.extract_document()
xml_str = doc.to_xml_string()

# 可以使用 XML parser 進一步解析
import xml.etree.ElementTree as ET
root = ET.fromstring(xml_str)
```

### Q2：欄位值為 None 時如何處理？
```python
# 檢查並處理 None
value = data.get("field")
if value is not None:
    doc.add_as_string("Field", str(value))
```

### Q3：如何傳送複雜結構？
```python
# 可以使用 JSON 字串
import json

complex_data = {
    "lot_id": "LOT001",
    "wafers": [1, 2, 3, 4, 5]
}

doc = WecDoc()
doc.add_as_string("Data", json.dumps(complex_data))
```
