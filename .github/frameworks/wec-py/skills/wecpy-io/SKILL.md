---
name: wecpy-io
description: >
  Invoke for ANY wecpy file transfer, object storage, notification, or HTTP/REST operation.
  Covers: FTPManager (FTP/SFTP upload/download), S3BucketManager (S3/CIMS3 put/get/copy/delete/presigned URLs/timed links),
  NotificationManger (send_mail email, send_alarm equipment alerts), ApiClientManager (GET/POST/PUT/DELETE/PATCH, timeout, retry).
  Keywords: 上傳、下載、SFTP、S3 bucket、CIMS3、presigned URL、有時效下載連結、send_alarm、告警、alarm、寄信、email、REST API、PATCH、PUT、DELETE、timeout、retry、config.yaml FTP/ObjectStorage/Notification/APIClient 設定。
  Excludes Kafka→wecpy-kafka, DB→wecpy-database, gRPC→wecpy-datafetcher, APM/COP→wecpy-monitoring.
---

# wecpy 檔案與通訊技能

本技能提供 wecpy 框架的檔案傳輸與通訊指南，支援 FTP/SFTP、S3 物件儲存、通知服務、API 呼叫。

> **前置條件**：請先閱讀 `wecpy-core` 技能了解 ConfigManager 初始化規範。

## 支援的 IO 元件

| 元件 | 用途 | 主要功能 |
|-----|------|---------|
| `FTPManager` | 檔案傳輸 | FTP/SFTP 上傳、下載、刪除（回傳 FTPResponse） |
| `S3BucketManager` | 物件儲存 | S3 儲存、讀取、刪除、Policy 管理 |
| `NotificationManger` | 通知服務 | Email、Alarm |
| `ApiClientManager` | API 呼叫 | HTTP GET/POST/PUT/DELETE/PATCH |

## 快速開始

### 1. config.yaml 設定

```yaml
# FTP 設定
FTP:
  sys_sch_ftp:
    type: ftp
    host: 10.18.30.164
    port: 21
    username: "{ftp_username}"
    password: "{ftp_password}"
  sys_sch_sftp:
    type: sftp
    host: 10.18.30.164
    port: 22
    username: "{ftp_username}"
    password: "{ftp_password}"

# S3 設定
ObjectStorage:
  ObjectStorageServer:
    endpoint_url: http://pilotcims3:10444
    security_id: YOUR_ACCESS_KEY
    security_key: YOUR_SECRET_KEY

# 通知設定
Notification:
  pilot:
    enabled: true
    server_url: http://10.18.20.42:8032

# API Client 設定
APIClient:
  imxportal:
    base_url: "http://10.18.20.56:8050"
    timeout: 10
    retry: 3
    wec_pat: "{wec_pat}"
  ctifdc:
    base_url: "http://ctifdc"
    timeout: 10
    retry: 3
```

### 2. FTP/SFTP 使用

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.ftp_manager import FTPManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def main():
    try:
        ftp = FTPManager("sys_sch_ftp")

        # 所有方法回傳 FTPResponse（含 success、data 屬性）
        # 列出目錄
        result = ftp.list_directory("/remote/path")
        log.info(f"目錄內容: {result.data}")

        # 上傳檔案
        result = ftp.upload_file("/local/file.csv", "/remote/file.csv")
        log.info(f"上傳: {result.success}")

        # 下載檔案
        result = ftp.download_file("/remote/file.csv", "/local/file.csv")
        log.info(f"下載: {result.success}")

        # 刪除檔案
        result = ftp.delete_file("/remote/file.csv")
        log.info(f"刪除: {result.success}")

        # 關閉連線
        ftp.disconnect()

    except Exception as e:
        log.error(f"FTP 操作失敗: {e}")

if __name__ == "__main__":
    main()
```

### 3. S3 物件儲存使用

S3BucketManager **必須**傳入 cluster 和 bucket_name 兩個參數：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.object_storage_manager import S3BucketManager
from wecpy.object_storage_manager.oss_manager import S3Object
from wecpy.log_manager import LogManager

def put_object():
    """上傳物件到 S3"""
    cluster = "ObjectStorageServer"
    bucket_name = "imx-temp"
    
    # Context Manager 模式（必須傳入 cluster 和 bucket_name）
    with S3BucketManager(cluster, bucket_name) as s3:
        # 建立 S3Object
        object_key = "2024-07/data.jpg"
        s3object = S3Object(object_key)
        
        # 載入檔案內容
        s3object.load_binary("/local/path/data.jpg")
        
        # 新增 metadata
        s3object.add_metadata("location", "local")
        
        # 上傳
        s3.put_object(s3object)

log = LogManager.get_logger()

def generate_url():
    """設定永久存取權限"""
    cluster = "ObjectStorageServer"
    bucket_name = "imx-temp"

    with S3BucketManager(cluster, bucket_name) as s3:
        folder = "2024-07"
        s3.add_bucket_policy_for_permanent_access(folder)
        log.info(f"已設定永久存取: {folder}")

if __name__ == "__main__":
    put_object()
    generate_url()
```

### 4. 通知服務使用

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.notification_manger.notification_manger import NotificationManger
from wecpy.log_manager import LogManager
import pandas as pd

log = LogManager.get_logger()

def send_report_mail():
    """發送報表郵件"""
    # 準備資料
    data_dict = [
        {"Name": "Alice", "Age": 30, "Country": "USA"},
        {"Name": "Bob", "Age": 25, "Country": "Canada"},
    ]
    df = pd.DataFrame(data_dict)
    
    # 初始化通知管理器
    notifier = NotificationManger("pilot")
    
    # 將 DataFrame 轉換為 HTML 表格
    table = notifier.dataframe_to_html_table(df)
    
    # 將圖片轉換為 base64
    base64_image = notifier.image_to_base64("./report.png")
    
    # 使用模板建立郵件內容
    mail_body = notifier.create_mail_body(
        "./template.html",
        title="報表標題",
        message="這是報表內容說明。",
        table=table,
        image_base64=base64_image
    )
    
    # 發送郵件
    result = notifier.send_mail(
        member=["UserID1", "UserID2"],  # 收件人 User ID
        dept=[],                         # 部門
        subject="每日報表",
        mail_body=mail_body
    )

    log.info(f"發送結果: {result}")

if __name__ == "__main__":
    send_report_mail()
```

### 5. API 呼叫使用

ApiClientManager 使用 `add_field()` 方法添加請求參數，支援 GET/POST/PUT/DELETE/PATCH：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.api_client_manager import ApiClientManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def get_request():
    """GET 請求範例"""
    api = ApiClientManager("ctifdc")

    # 使用 add_field 添加參數
    api.add_field("eqpIdList", "EAPLYB04")
    api.add_field("chamberList", "EAPLYB04_CA,C2,C3")

    # 發送 GET 請求
    response = api.get("/dataapi/ECRP/Svid")
    log.info(f"回應: {response.text}")

def post_request():
    """POST 請求範例"""
    api = ApiClientManager("ctifdc")

    # 使用 add_field 添加參數（可以是列表）
    api.add_field("eqpIdList", ["EAPLYB04"])
    api.add_field("chamberList", ["EAPLYB04_CA", "C2", "C3"])

    # 發送 POST 請求
    response = api.post("/dataapi/ECRP/Svid")
    log.info(f"回應: {response.text}")

if __name__ == "__main__":
    get_request()
    post_request()
```

## 詳細參考文件

- [FTPManager 詳解](references/ftp.md) — 當使用者需要 FTP/SFTP 進階操作（目錄遍歷、批次傳輸、FTPResponse 處理、錯誤重試）時閱讀
- [S3BucketManager 詳解](references/object-storage.md) — 當使用者需要 S3 進階操作（S3Object 操作、metadata、bucket policy、永久存取 URL）時閱讀
- [NotificationManger 詳解](references/notification.md) — 當使用者需要郵件模板客製化、HTML 表格、圖片嵌入、Alarm 通知時閱讀
- [ApiClientManager 詳解](references/api-client.md) — 當使用者需要 REST API 進階操作（PUT/DELETE/PATCH、認證 token、retry 設定、response 處理）時閱讀

## 資源檔案

- [IO config.yaml 模板](assets/io-config.yaml)
- [通知郵件 HTML 模板](assets/notification-template.html)

## 常見問題

### Q1：FTP 連線失敗
```
檢查項目：
1. host/port 是否正確
2. 環境變數 ftp_username/ftp_password 是否設定
3. 網路是否可連通
4. FTP 類型（ftp/sftp）是否正確
```

### Q2：S3 操作失敗
```
檢查項目：
1. 是否有傳入 cluster 和 bucket_name 兩個參數
2. endpoint_url 是否正確
3. security_id/security_key 是否正確
4. bucket 是否存在
```

### Q3：通知發送失敗
```
檢查項目：
1. Notification.xxx.enabled 是否為 true
2. server_url 是否正確
3. 收件者 User ID 是否正確
4. 郵件模板是否存在
```

### Q4：API 呼叫失敗
```
檢查項目：
1. base_url 是否正確
2. timeout 設定是否足夠
3. 使用 add_field 添加參數是否正確
4. API endpoint 路徑是否正確
```
