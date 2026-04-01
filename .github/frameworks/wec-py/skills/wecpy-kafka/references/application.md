# WecApplication 詳解

本文件詳細說明 wecpy 框架中 WecApplication（雙向通訊）的使用方式。WecApplication 結合了消費者和生產者功能，支援 Request-Reply 模式。

## config.yaml 設定

```yaml
WecApp:
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

### 設定欄位說明

| 欄位 | 說明 | 必要 |
|-----|------|-----|
| message_type | 訊息類型，固定為 `Kafka` | ✅ |
| thread_count | 處理執行緒數量 | ✅ |
| always_reply | 是否總是回覆 | ⚠️ |
| site | 站點代碼 | ✅ |
| topic | Kafka Topic | ✅ |
| group.id | 消費者群組 ID | ✅ |
| bootstrap.servers | Kafka Broker 位址清單 | ✅ |
| session.timeout.ms | Session 逾時時間 | ⚠️ |
| inbox.port.range | 收件埠範圍 | ⚠️ |

## 基本使用

### 繼承 + Callback 模式

WecApplication 採用繼承模式，必須實作 callback 函式：

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
        # name 為 config.yaml 中 WecApp 區塊下的設定名稱（如 "app"）
        super().__init__(name, self.on_message_received)
    
    def on_message_received(self, send_subject: str, reply_subject, 
                            envelope: WecEnvelope) -> WecDoc:
        """
        處理請求並回覆
        
        Args:
            send_subject: 發送主題
            reply_subject: 回覆主題
            envelope: WecEnvelope 封包
            
        Returns:
            WecDoc: 回覆訊息
        """
        result = WecDoc()
        try:
            # 從 envelope 取出文件
            doc = envelope.extract_document()
            log.info(f"收到訊息: {doc.to_xml_string()}")
            
            # 處理業務邏輯
            self.process_request(doc)
            
            result.add_as_string("result", "success")
            
        except Exception as e:
            log.error(f"處理失敗: {e}")
            result.add_as_string("result", "fail")
        
        return result
    
    def process_request(self, doc: WecDoc):
        """業務邏輯處理"""
        # TODO: 實作業務邏輯
        pass

if __name__ == "__main__":
    app = MyWecApp("app")
    app.start()
```

## WecEnvelope 封包處理

WecEnvelope 是訊息的封包容器，包含完整的訊息資訊：

```python
def on_message_received(self, send_subject: str, reply_subject, 
                        envelope: WecEnvelope) -> WecDoc:
    # 從 envelope 取出文件
    doc = envelope.extract_document()
    
    # 取得 XML 字串
    xml_content = doc.to_xml_string()
    log.info(f"收到訊息: {xml_content}")
    
    # 處理並回覆
    result = WecDoc()
    result.add_as_string("result", "success")
    return result
```

## 整合資料庫

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.baselibrary.wec_application import WecApplication
from wecpy.baselibrary.wec_doc import WecDoc
from wecpy.baselibrary.wec_envelope import WecEnvelope
from wecpy.database_manager.oracle_manager import OracleManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

class DatabaseWecApp(WecApplication):
    """整合資料庫的雙向通訊應用"""
    
    def __init__(self, name):
        super().__init__(name, self.on_message_received)
        self.oracle = OracleManager("TRAINDB")
    
    def on_message_received(self, send_subject: str, reply_subject, 
                            envelope: WecEnvelope) -> WecDoc:
        result = WecDoc()
        try:
            doc = envelope.extract_document()
            log.info(f"收到請求: {doc.to_xml_string()}")
            
            # 查詢資料庫
            df = self.oracle.query_dataframe(
                "SELECT * FROM LOT_INFO WHERE LOT_ID = :lot_id",
                params={"lot_id": "LOT001"}
            )
            
            if len(df) > 0:
                result.add_as_string("result", "success")
                result.add_as_string("status", df.iloc[0]["STATUS"])
            else:
                result.add_as_string("result", "not_found")
            
        except Exception as e:
            log.error(f"處理失敗: {e}")
            result.add_as_string("result", "fail")
            result.add_as_string("error", str(e))
        
        return result

if __name__ == "__main__":
    app = DatabaseWecApp("app")
    app.start()
```

## 整合 APM 監控

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.baselibrary.wec_application import WecApplication
from wecpy.baselibrary.wec_doc import WecDoc
from wecpy.baselibrary.wec_envelope import WecEnvelope
from wecpy.apm_manager.apm_manager import APMManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

class MonitoredWecApp(WecApplication):
    """帶 APM 監控的雙向通訊應用"""
    
    def __init__(self, name):
        super().__init__(name, self.on_message_received)
        self.apm = APMManager("apmserver")
    
    def on_message_received(self, send_subject: str, reply_subject, 
                            envelope: WecEnvelope) -> WecDoc:
        result = WecDoc()
        
        self.apm.begin_transaction()
        try:
            doc = envelope.extract_document()
            log.info("收到請求", "wecapp_request")
            
            # 處理業務邏輯
            self.process_business(doc)
            
            result.add_as_string("result", "success")
            self.apm.end_transaction("success")
            
        except Exception as e:
            log.error(f"處理失敗: {e}", "wecapp_error")
            self.apm.capture_exception()
            self.apm.end_transaction("error")
            result.add_as_string("result", "fail")
        
        return result
    
    def process_business(self, doc: WecDoc):
        """處理業務邏輯"""
        pass

if __name__ == "__main__":
    app = MonitoredWecApp("app")
    app.start()
```

## 最佳實務

### 1. 標準化回覆格式
```python
def create_success_reply(data: dict = None) -> WecDoc:
    """建立成功回覆"""
    reply = WecDoc()
    reply.add_as_string("result", "success")
    if data:
        for key, value in data.items():
            reply.add_as_string(key, str(value))
    return reply

def create_error_reply(error_msg: str) -> WecDoc:
    """建立錯誤回覆"""
    reply = WecDoc()
    reply.add_as_string("result", "fail")
    reply.add_as_string("error", error_msg)
    return reply
```

### 2. 請求驗證
```python
def validate_request(doc: WecDoc, required_fields: list) -> bool:
    """驗證請求欄位"""
    xml_content = doc.to_xml_string()
    for field in required_fields:
        if field not in xml_content:
            return False
    return True
```

## 常見問題

### Q1：回覆未送達
```
原因：回覆 Topic 設定錯誤或網路問題
解決：
1. 確認 always_reply 設定
2. 檢查回覆 Topic 設定
3. 確認網路連通性
```

### Q2：處理執行緒不足
```
原因：thread_count 設定過小
解決：
1. 增加 thread_count 設定
2. 優化處理邏輯減少處理時間
3. 考慮水平擴展
```

### Q3：請求排隊過長
```
原因：處理速度跟不上請求速度
解決：
1. 增加 thread_count
2. 優化業務邏輯
3. 使用非同步處理
```
