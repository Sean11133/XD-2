# S3BucketManager 詳解

## 目錄

- [config.yaml 設定](#configyaml-設定)
  - [設定欄位說明](#設定欄位說明)
- [初始化](#初始化)
- [S3Object 物件](#s3object-物件)
- [上傳物件](#上傳物件)
  - [使用 S3Object 上傳](#使用-s3object-上傳)
- [永久存取權限設定](#永久存取權限設定)
  - [新增永久存取 Policy](#新增永久存取-policy)
- [完整範例](#完整範例)
  - [上傳並產生 URL](#上傳並產生-url)
  - [批次上傳](#批次上傳)
- [其他操作](#其他操作)
  - [切換 Bucket](#切換-bucket)
  - [列出物件](#列出物件)
  - [取得物件二進位資料](#取得物件二進位資料)
  - [檢查物件是否存在](#檢查物件是否存在)
  - [刪除物件](#刪除物件)
- [方法參考](#方法參考)
- [最佳實務](#最佳實務)
  - [1. 使用有意義的 object_key](#1-使用有意義的-object_key)
  - [2. 添加 Metadata](#2-添加-metadata)
  - [3. 錯誤處理](#3-錯誤處理)
- [常見問題](#常見問題)
  - [Q1：缺少參數錯誤](#q1缺少參數錯誤)
  - [Q2：連線失敗](#q2連線失敗)
  - [Q3：認證失敗](#q3認證失敗)
  - [Q4：Bucket 不存在](#q4bucket-不存在)

本文件詳細說明 wecpy 框架中 S3BucketManager（S3 物件儲存）的使用方式。

## config.yaml 設定

```yaml
ObjectStorage:
  ObjectStorageServer:
    endpoint_url: http://pilotcims3:10444
    security_id: YOUR_ACCESS_KEY
    security_key: YOUR_SECRET_KEY
```

### 設定欄位說明

| 欄位 | 說明 | 必要 |
|-----|------|-----|
| endpoint_url | S3 相容服務端點 | ✅ |
| security_id | Access Key ID | ✅ |
| security_key | Secret Access Key | ✅ |

## 初始化

**重要**：S3BucketManager **必須**傳入 cluster 和 bucket_name 兩個參數。

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.object_storage_manager import S3BucketManager

cluster = "ObjectStorageServer"
bucket_name = "imx-temp"

# 使用 Context Manager（推薦）
with S3BucketManager(cluster, bucket_name) as s3:
    # 操作 S3
    pass
```

## S3Object 物件

S3Object 用於封裝要上傳的物件：

```python
from wecpy.object_storage_manager.oss_manager import S3Object

# 建立 S3Object
object_key = "folder/subfolder/file.jpg"
s3object = S3Object(object_key)

# 載入本地檔案內容
s3object.load_binary("/local/path/file.jpg")

# 新增 metadata
s3object.add_metadata("system", "IRS")
s3object.add_metadata("location", "local")
```

## 上傳物件

### 使用 S3Object 上傳

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.object_storage_manager import S3BucketManager
from wecpy.object_storage_manager.oss_manager import S3Object
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def put_object():
    """上傳物件到 S3"""
    cluster = "ObjectStorageServer"
    bucket_name = "imx-temp"

    with S3BucketManager(cluster, bucket_name) as s3:
        # 設定物件路徑
        folder_name = "2024-07"
        file_name = "report.jpg"
        object_key = f"{folder_name}/{file_name}"

        # 建立 S3Object
        s3object = S3Object(object_key)

        # 載入檔案內容
        s3object.load_binary("/local/path/report.jpg")

        # 新增 metadata
        s3object.add_metadata("system", "IRS")
        s3object.add_metadata("upload_time", "2024-07-01")

        # 上傳
        s3.put_object(s3object)

        log.info(f"已上傳: {object_key}")

if __name__ == "__main__":
    put_object()
```

## 永久存取權限設定

### 新增永久存取 Policy

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.object_storage_manager import S3BucketManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def set_permanent_access():
    """設定資料夾永久存取權限"""
    cluster = "ObjectStorageServer"
    bucket_name = "imx-temp"

    with S3BucketManager(cluster, bucket_name) as s3:
        folder = "2024-07"

        # 新增永久存取 Policy
        result = s3.add_bucket_policy_for_permanent_access(folder)
        log.info(f"新增 Policy 結果: {result}")

        # 更新永久存取 Policy
        result = s3.update_bucket_policy_for_permanent_access(folder)
        log.info(f"更新 Policy 結果: {result}")

if __name__ == "__main__":
    set_permanent_access()
```

## 完整範例

### 上傳並產生 URL

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.object_storage_manager import S3BucketManager
from wecpy.object_storage_manager.oss_manager import S3Object
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def upload_and_get_url(local_file: str, object_key: str) -> str:
    """
    上傳檔案並取得 URL
    
    Args:
        local_file: 本地檔案路徑
        object_key: S3 物件路徑
        
    Returns:
        str: 物件 URL
    """
    cluster = "ObjectStorageServer"
    bucket_name = "imx-temp"
    
    with S3BucketManager(cluster, bucket_name) as s3:
        # 建立並上傳物件
        s3object = S3Object(object_key)
        s3object.load_binary(local_file)
        s3object.add_metadata("system", ConfigManager.general.system)
        
        s3.put_object(s3object)
        log.info(f"已上傳: {object_key}")
        
        # 設定永久存取權限
        folder = object_key.split("/")[0]
        s3.add_bucket_policy_for_permanent_access(folder)
        log.info(f"已設定永久存取: {folder}")

if __name__ == "__main__":
    upload_and_get_url(
        "/local/path/report.jpg",
        "2024-07/reports/report.jpg"
    )
```

### 批次上傳

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.object_storage_manager import S3BucketManager
from wecpy.object_storage_manager.oss_manager import S3Object
from wecpy.log_manager import LogManager
import os

log = LogManager.get_logger()

def batch_upload(local_dir: str, s3_prefix: str):
    """
    批次上傳目錄中的檔案
    
    Args:
        local_dir: 本地目錄路徑
        s3_prefix: S3 路徑前綴
    """
    cluster = "ObjectStorageServer"
    bucket_name = "imx-temp"
    
    with S3BucketManager(cluster, bucket_name) as s3:
        for filename in os.listdir(local_dir):
            local_path = os.path.join(local_dir, filename)
            
            if os.path.isfile(local_path):
                object_key = f"{s3_prefix}/{filename}"
                
                s3object = S3Object(object_key)
                s3object.load_binary(local_path)
                
                s3.put_object(s3object)
                log.info(f"已上傳: {object_key}")

if __name__ == "__main__":
    batch_upload("/local/data", "2024-07/batch")
```

## 其他操作

### 切換 Bucket

```python
with S3BucketManager(cluster, bucket_name) as s3:
    # 切換到其他 Bucket
    s3.change_bucket("another-bucket")
```

### 列出物件

```python
with S3BucketManager(cluster, bucket_name) as s3:
    # 列出所有物件
    all_objects = s3.get_all_objects_list()

    # 列出指定資料夾的物件
    folder_objects = s3.get_all_objects_list(folder_name="2024-07")
```

### 取得物件二進位資料

```python
with S3BucketManager(cluster, bucket_name) as s3:
    result = s3.get_object_binary("2024-07/report.jpg")
    if result:
        log.info("取得物件成功")
```

### 檢查物件是否存在

```python
with S3BucketManager(cluster, bucket_name) as s3:
    exists = s3.is_object_exist("2024-07/report.jpg")
    if exists:
        log.info("物件存在")
```

### 刪除物件

```python
with S3BucketManager(cluster, bucket_name) as s3:
    result = s3.delete_object("2024-07/report.jpg")
    log.info(f"刪除結果: {result}")
```

### 刪除資料夾

```python
with S3BucketManager(cluster, bucket_name) as s3:
    result = s3.delete_folder("2024-07/old-data")
    log.info(f"刪除資料夾結果: {result}")
```

### 取得物件（S3Object）

```python
with S3BucketManager(cluster, bucket_name) as s3:
    s3object = s3.get_object("2024-07/report.jpg")
    # s3object.object_key, s3object.binary, s3object.metadata
```

### 儲存物件到本地檔案

```python
with S3BucketManager(cluster, bucket_name) as s3:
    result = s3.save_object_to_localfile("2024-07/report.jpg", "/local/path/report.jpg")
    log.info(f"儲存結果: {result}")
```

## 複製與搬移操作

### 同 Bucket 內複製/搬移

```python
with S3BucketManager(cluster, bucket_name) as s3:
    # 複製單一物件
    s3.copy_object("source/file.csv", "dest/file.csv")

    # 複製整個資料夾
    s3.copy_folder("source/folder", "dest/folder")

    # 搬移單一物件（複製後刪除原始）
    s3.move_object("source/file.csv", "dest/file.csv")

    # 搬移整個資料夾
    s3.move_folder("source/folder", "dest/folder")
```

### 跨 Bucket 複製

```python
with S3BucketManager(cluster, "bucket-A") as s3:
    # 複製單一物件到另一個 Bucket
    s3.copy_object_to_another_bucket(
        "reports/2026/file.csv",     # 來源 object_key
        "bucket-B",                   # 目標 bucket
        "archive/file.csv"            # 目標 object_key
    )

    # 複製整個資料夾到另一個 Bucket
    s3.copy_folder_to_another_bucket(
        "reports/2026",               # 來源資料夾
        "bucket-B",                   # 目標 bucket
        "archive"                     # 目標資料夾
    )
```

## URL 產生

### 帶到期時間的預簽名 URL

```python
with S3BucketManager(cluster, bucket_name) as s3:
    url = s3.generate_presigned_url_with_expiration("2024-07/report.jpg", expiration_hours=24)
    log.info(f"預簽名 URL（24 小時有效）: {url}")
```

### 永久存取 URL（不過期）

```python
with S3BucketManager(cluster, bucket_name) as s3:
    url = s3.generate_url_without_expiration("2024-07/report.jpg")
    log.info(f"永久 URL: {url}")
```

## 方法參考

| 方法 | 說明 | 回傳值 |
|-----|------|--------|
| `__init__(cluster, bucket_name)` | 初始化，cluster 對應 `ConfigManager.object_storage_list[cluster]` | - |
| Context Manager (`__enter__`/`__exit__`) | 支援 `with` 語法自動管理連線 | - |
| **基礎操作** | | |
| `put_object(s3object)` | 上傳 S3Object 物件 | `bool` |
| `get_object(object_key)` | 取得 S3Object 物件（含 binary + metadata） | `S3Object` |
| `get_object_binary(object_key)` | 取得物件二進位資料 | `dict` 或 `None` |
| `save_object_to_localfile(object_key, local_path)` | 下載物件並儲存到本地檔案 | `dict` |
| `get_all_objects_list(folder_name=None)` | 列出所有物件，可依資料夾篩選 | `list` |
| `is_object_exist(object_key)` | 檢查物件是否存在 | `bool` |
| `change_bucket(bucket_name)` | 切換目前 Bucket | - |
| **刪除操作** | | |
| `delete_object(object_key)` | 刪除單一物件 | `bool` |
| `delete_folder(folder_name)` | 刪除整個資料夾 | `bool` |
| **複製操作** | | |
| `copy_object(src_object, des_object)` | 同 Bucket 內複製物件 | `bool` |
| `copy_folder(src_url, des_url)` | 同 Bucket 內複製資料夾 | `bool` |
| `copy_object_to_another_bucket(src_object, des_bucket, des_object)` | 跨 Bucket 複製物件 | `bool` |
| `copy_folder_to_another_bucket(src_url, des_bucket, des_url)` | 跨 Bucket 複製資料夾 | `bool` |
| **搬移操作** | | |
| `move_object(src_object, des_object)` | 同 Bucket 內搬移物件 | `bool` |
| `move_folder(src_folder, des_folder)` | 同 Bucket 內搬移資料夾 | `bool` |
| **URL 產生** | | |
| `generate_presigned_url_with_expiration(object_key, expiration_hours)` | 產生帶到期時間的預簽名 URL | `str` |
| `generate_url_without_expiration(object_key)` | 產生永久存取 URL | `str` |
| **Policy 管理** | | |
| `add_bucket_policy_for_permanent_access(foldername)` | 新增資料夾永久存取 Policy | `bool` |
| `update_bucket_policy_for_permanent_access(foldername)` | 更新資料夾永久存取 Policy | `bool` |

## 最佳實務

### 1. 使用有意義的 object_key
```python
# ✅ 好的命名
object_key = "2024-07/reports/daily_report.jpg"
object_key = "IRS/model_monitor/metrics.json"

# ❌ 不好的命名
object_key = "file1.jpg"
object_key = "data"
```

### 2. 添加 Metadata
```python
s3object.add_metadata("system", "IRS")
s3object.add_metadata("app", "MODEL_MONITOR")
s3object.add_metadata("upload_date", "2024-07-01")
```

### 3. 錯誤處理
```python
try:
    with S3BucketManager(cluster, bucket_name) as s3:
        s3.put_object(s3object)
except Exception as e:
    log.error(f"S3 上傳失敗: {e}")
```

## 常見問題

### Q1：缺少參數錯誤
```
原因：S3BucketManager 初始化時缺少參數
解決：
# ❌ 錯誤 - 缺少參數
with S3BucketManager("bucket_name") as s3:

# ✅ 正確 - 傳入 cluster 和 bucket_name
with S3BucketManager("ObjectStorageServer", "bucket_name") as s3:
```

### Q2：連線失敗
```
原因：endpoint_url 錯誤或網路問題
解決：
1. 確認 endpoint_url 正確
2. 確認網路可連通
3. 確認 S3 服務正常
```

### Q3：認證失敗
```
原因：security_id 或 security_key 錯誤
解決：
1. 確認 security_id 正確
2. 確認 security_key 正確
3. 確認帳號有權限存取 bucket
```

### Q4：Bucket 不存在
```
原因：bucket_name 錯誤或 bucket 未建立
解決：
1. 確認 bucket 名稱正確
2. 確認 bucket 已建立
3. 確認帳號有權限存取
```
