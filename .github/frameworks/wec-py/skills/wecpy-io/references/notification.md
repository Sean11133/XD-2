# NotificationManger 詳解

## 目錄

- [config.yaml 設定](#configyaml-設定)
  - [設定欄位說明](#設定欄位說明)
- [初始化](#初始化)
- [發送郵件](#發送郵件)
  - [完整郵件發送流程](#完整郵件發送流程)
- [郵件模板](#郵件模板)
  - [基本模板格式](#基本模板格式)
  - [模板變數說明](#模板變數說明)
- [工具方法](#工具方法)
  - [dataframe_to_html_table](#dataframe_to_html_table)
  - [image_to_base64](#image_to_base64)
  - [create_mail_body](#create_mail_body)
- [發送告警](#發送告警)
  - [send_alarm](#send_alarm)
  - [send_alarm_to_receivers](#send_alarm_to_receivers)
- [完整範例](#完整範例)
  - [排程報表郵件](#排程報表郵件)
- [方法參考](#方法參考)
- [最佳實務](#最佳實務)
  - [1. 檢查啟用狀態](#1-檢查啟用狀態)
  - [2. 使用模板](#2-使用模板)
  - [3. 錯誤處理](#3-錯誤處理)
- [常見問題](#常見問題)
  - [Q1：郵件未發送](#q1郵件未發送)
  - [Q2：收件人未收到郵件](#q2收件人未收到郵件)
  - [Q3：圖片未顯示](#q3圖片未顯示)

本文件詳細說明 wecpy 框架中 NotificationManger（通知服務）的使用方式。

## config.yaml 設定

```yaml
Notification:
  pilot:
    enabled: true
    server_url: http://10.18.20.42:8032
```

### 設定欄位說明

| 欄位 | 說明 | 必要 |
|-----|------|-----|
| enabled | 是否啟用通知服務 | ✅ |
| server_url | 通知服務伺服器位址 | ✅ |

## 初始化

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.notification_manger.notification_manger import NotificationManger

# 使用 config.yaml 中定義的通知服務名稱
notifier = NotificationManger("pilot")
```

## 發送郵件

### 完整郵件發送流程

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.notification_manger.notification_manger import NotificationManger
from wecpy.log_manager import LogManager
import pandas as pd

log = LogManager.get_logger()

def send_report_mail():
    """發送報表郵件 - 完整範例"""
    
    # 1. 準備資料
    data_dict = [
        {"Name": "Alice", "Age": 30, "Country": "USA", "Profession": "Engineer"},
        {"Name": "Bob", "Age": 25, "Country": "Canada", "Profession": "Designer"},
        {"Name": "Charlie", "Age": 35, "Country": "UK", "Profession": "Manager"}
    ]
    df = pd.DataFrame(data_dict)
    
    # 2. 初始化通知管理器
    notifier = NotificationManger("pilot")
    
    # 3. 將 DataFrame 轉換為 HTML 表格
    table = notifier.dataframe_to_html_table(df)
    
    # 4. 將圖片轉換為 base64（可選）
    base64_image = notifier.image_to_base64("./report.png")
    
    # 5. 使用模板建立郵件內容
    mail_body = notifier.create_mail_body(
        "./template.html",       # 模板檔案路徑
        title="WECPY 報表",      # 模板變數：標題
        message="這是報表內容說明。",  # 模板變數：訊息
        table=table,             # 模板變數：表格
        image_base64=base64_image  # 模板變數：圖片
    )
    
    # 6. 發送郵件
    result = notifier.send_mail(
        member=["UserID1", "UserID2"],  # 收件人 User ID 清單
        dept=[],                         # 部門代碼清單（可選）
        subject="每日報表",              # 郵件主旨
        mail_body=mail_body              # 郵件內容（HTML）
    )

    log.info(f"發送結果: {result}")

if __name__ == "__main__":
    send_report_mail()
```

## 郵件模板

### 基本模板格式

建立 `template.html` 檔案：

```html
<h1>{title}</h1>
<p>{message}</p>

{table}
<br>
<img src="data:image/png;base64,{image_base64}">
```

### 模板變數說明

| 變數 | 說明 | 範例 |
|-----|------|------|
| `{title}` | 郵件標題 | "每日報表" |
| `{message}` | 訊息內容 | "這是報表說明" |
| `{table}` | HTML 表格 | dataframe_to_html_table 的輸出 |
| `{image_base64}` | Base64 圖片 | image_to_base64 的輸出 |

## 工具方法

### dataframe_to_html_table

將 DataFrame 轉換為 HTML 表格：

```python
import pandas as pd

df = pd.DataFrame([
    {"Name": "Alice", "Score": 95},
    {"Name": "Bob", "Score": 87}
])

notifier = NotificationManger("pilot")
table_html = notifier.dataframe_to_html_table(df)
```

### image_to_base64

將圖片轉換為 Base64 字串：

```python
notifier = NotificationManger("pilot")
base64_str = notifier.image_to_base64("./chart.png")
```

### create_mail_body

使用模板建立郵件內容：

```python
mail_body = notifier.create_mail_body(
    "./template.html",
    title="標題",
    message="內容",
    table=table_html,
    image_base64=base64_str
)
```

## 發送告警

告警（Alarm）與郵件不同，告警透過告警服務派送，郵件透過郵件服務派送。

### AlarmMessage 模型

透過告警規則自動派送給對應接收者：

```python
from wecpy.notification_manger.model.alarm_message import AlarmMessage

# AlarmMessage 構造方式：
alarm = AlarmMessage(
    event_source="EQP_MONITOR",     # 告警來源（系統識別用）
    event_name="EQP_ABNORMAL",      # 告警事件名稱
    fields={                         # 告警附帶資料（dict）
        "eqp_id": "EAPLYB04",
        "status": "ABNORMAL",
        "detail": "溫度超標 350°C"
    }
)
```

| 參數 | 型別 | 說明 |
|-----|------|------|
| `event_source` | `str` | 告警來源識別（例如系統名、模組名） |
| `event_name` | `str` | 告警事件名稱 |
| `fields` | `dict` | 告警附帶的鍵值對資料 |

### AlarmMessageDirectly 模型

直接指定收件人發送告警：

```python
from wecpy.notification_manger.model.alarm_message_directly import AlarmMessageDirectly

# AlarmMessageDirectly 構造方式：
alarm = AlarmMessageDirectly(
    source="EQP_MONITOR",            # 告警來源
    name="EQP_ABNORMAL",             # 告警名稱
    title="設備異常告警",              # 告警標題
    member_list=["UserID1", "UserID2"],  # 收件人 User ID 清單
    dept_list=["DEPT001"],            # 部門清單
    body="設備 EAPLYB04 溫度超標"      # 告警內容
)
```

| 參數 | 型別 | 說明 |
|-----|------|------|
| `source` | `str` | 告警來源識別 |
| `name` | `str` | 告警名稱 |
| `title` | `str` | 告警標題 |
| `member_list` | `list` | 收件人 User ID 清單 |
| `dept_list` | `list` | 部門代碼清單 |
| `body` | `str` | 告警內容描述 |

### send_alarm — 透過告警規則派送

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.notification_manger.notification_manger import NotificationManger
from wecpy.notification_manger.model.alarm_message import AlarmMessage
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

notifier = NotificationManger("pilot")

# 建立告警訊息
alarm = AlarmMessage(
    event_source="EQP_MONITOR",
    event_name="EQP_ABNORMAL",
    fields={
        "eqp_id": "EAPLYB04",
        "status": "ABNORMAL",
        "detail": "溫度超標 350°C"
    }
)

# 發送告警（由告警服務依規則派送）
result = notifier.send_alarm(alarm)
log.info(f"告警發送結果: {result}")
```

### send_alarm_to_receivers — 直接指定收件人

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.notification_manger.notification_manger import NotificationManger
from wecpy.notification_manger.model.alarm_message_directly import AlarmMessageDirectly
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

notifier = NotificationManger("pilot")

# 建立直接告警訊息
alarm = AlarmMessageDirectly(
    source="EQP_MONITOR",
    name="EQP_ABNORMAL",
    title="設備異常告警",
    member_list=["Engineer1", "Engineer2"],
    dept_list=[],
    body="設備 EAPLYB04 溫度超標 350°C，請立即處理。"
)

# 發送給指定收件人
result = notifier.send_alarm_to_receivers(alarm)
log.info(f"直接告警發送結果: {result}")
```

## 完整範例

### 排程報表郵件

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.notification_manger.notification_manger import NotificationManger
from wecpy.database_manager.oracle_manager import OracleManager
from wecpy.log_manager import LogManager
import pandas as pd
from datetime import datetime

log = LogManager.get_logger()

def send_daily_report():
    """發送每日報表"""
    
    try:
        # 查詢資料
        oracle = OracleManager("TRAINDB")
        df = oracle.query_dataframe("""
            SELECT DEPARTMENT_ID, COUNT(*) AS COUNT, SUM(SALARY) AS TOTAL_SALARY
            FROM EMPLOYEES
            GROUP BY DEPARTMENT_ID
            ORDER BY DEPARTMENT_ID
        """)
        
        log.info(f"查詢到 {len(df)} 筆資料")
        
        # 建立郵件
        notifier = NotificationManger("pilot")
        table = notifier.dataframe_to_html_table(df)
        
        mail_body = notifier.create_mail_body(
            "./template.html",
            title=f"每日部門統計報表 - {datetime.now().strftime('%Y-%m-%d')}",
            message="以下是各部門員工統計資料：",
            table=table,
            image_base64=""
        )
        
        # 發送
        result = notifier.send_mail(
            member=["Manager1", "Manager2"],
            dept=[],
            subject=f"每日報表 - {datetime.now().strftime('%Y-%m-%d')}",
            mail_body=mail_body
        )
        
        log.info(f"郵件發送結果: {result}")
        
    except Exception as e:
        log.error(f"報表發送失敗: {e}")

if __name__ == "__main__":
    send_daily_report()
```

## 方法參考

| 方法 | 說明 | 回傳值 |
|-----|------|--------|
| `send_mail(member, dept, subject, mail_body)` | 發送郵件 | `dict` |
| `send_alarm(alarm_message: AlarmMessage)` | 發送告警 | `dict` |
| `send_alarm_to_receivers(alarm_message_directly: AlarmMessageDirectly)` | 直接發送告警給指定收件人 | `dict` |
| `create_mail_body(template_path, **kwargs)` | 使用模板建立郵件內容 | `str` |
| `image_to_base64(image_path)` | 將圖片轉換為 Base64 字串 | `str` |
| `dataframe_to_html_table(df, border=1, justify='center')` | 將 DataFrame 轉換為 HTML 表格 | `str` |

## 最佳實務

### 1. 檢查啟用狀態
```yaml
# config.yaml
Notification:
  pilot:
    enabled: true  # 確保啟用
```

### 2. 使用模板
```python
# 將 HTML 模板存為獨立檔案
mail_body = notifier.create_mail_body(
    "./templates/report_template.html",
    **variables
)
```

### 3. 錯誤處理
```python
try:
    result = notifier.send_mail(...)
    if not result:
        log.warning("郵件發送可能失敗")
except Exception as e:
    log.error(f"郵件發送錯誤: {e}")
```

## 常見問題

### Q1：郵件未發送
```
原因：enabled 為 false 或 server_url 錯誤
解決：
1. 確認 Notification.xxx.enabled = true
2. 確認 server_url 正確
3. 確認網路可連通
```

### Q2：收件人未收到郵件
```
原因：收件人 ID 錯誤
解決：
1. 確認 member 中的 User ID 正確
2. 確認 User ID 有對應的 email
```

### Q3：圖片未顯示
```
原因：Base64 編碼問題
解決：
1. 確認圖片檔案存在
2. 確認圖片格式正確（PNG, JPG）
3. 檢查模板中的 img 標籤格式
```
