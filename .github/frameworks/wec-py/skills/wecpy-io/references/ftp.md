# FTPManager 詳解

## 目錄

- [config.yaml 設定](#configyaml-設定)
  - [設定欄位說明](#設定欄位說明)
  - [環境變數](#環境變數)
- [初始化](#初始化)
- [基本操作](#基本操作)
  - [列出目錄](#列出目錄)
  - [上傳檔案](#上傳檔案)
  - [下載檔案](#下載檔案)
  - [刪除檔案](#刪除檔案)
- [完整範例](#完整範例)
  - [FTP 檔案操作](#ftp-檔案操作)
  - [SFTP 檔案操作](#sftp-檔案操作)
- [方法摘要](#方法摘要)
- [最佳實務](#最佳實務)
  - [1. 確保關閉連線](#1-確保關閉連線)
  - [2. 檢查操作結果](#2-檢查操作結果)
  - [3. 錯誤處理](#3-錯誤處理)
  - [3. 使用環境變數存放密碼](#3-使用環境變數存放密碼)
- [常見問題](#常見問題)
  - [Q1：連線失敗](#q1連線失敗)
  - [Q2：上傳失敗](#q2上傳失敗)
  - [Q3：下載失敗](#q3下載失敗)

本文件詳細說明 wecpy 框架中 FTPManager（FTP/SFTP 檔案傳輸）的使用方式。

## config.yaml 設定

```yaml
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
```

### 設定欄位說明

| 欄位 | 說明 | 必要 |
|-----|------|-----|
| type | 連線類型（ftp 或 sftp） | ✅ |
| host | FTP 伺服器位址 | ✅ |
| port | 連接埠（FTP: 21, SFTP: 22） | ✅ |
| username | 使用者名稱（建議用環境變數） | ✅ |
| password | 密碼（建議用環境變數） | ✅ |

### 環境變數

```bash
# .env
ftp_username=your_ftp_username
ftp_password=your_ftp_password
```

## 初始化

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.ftp_manager import FTPManager

# 使用 config.yaml 中定義的連線名稱
ftp = FTPManager("sys_sch_ftp")
```

## 基本操作

### 列出目錄

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.ftp_manager import FTPManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def main():
    try:
        ftp = FTPManager("sys_sch_ftp")

        # 列出目錄內容（回傳 FTPResponse）
        result = ftp.list_directory("/remote/path")
        log.info(f"目錄內容: {result.data}")

        ftp.disconnect()

    except Exception as e:
        log.error(f"操作失敗: {e}")

if __name__ == "__main__":
    main()
```

### 上傳檔案

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.ftp_manager import FTPManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def upload():
    try:
        ftp = FTPManager("sys_sch_ftp")

        # 上傳檔案（回傳 FTPResponse）
        result = ftp.upload_file(
            "/local/path/file.csv",
            "/remote/path/file.csv"
        )

        log.info(f"上傳結果: {result.success}")
        ftp.disconnect()

    except Exception as e:
        log.error(f"上傳失敗: {e}")

if __name__ == "__main__":
    upload()
```

### 下載檔案

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.ftp_manager import FTPManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def download():
    try:
        ftp = FTPManager("sys_sch_ftp")

        # 下載檔案（回傳 FTPResponse）
        result = ftp.download_file(
            "/remote/path/file.csv",
            "/local/path/file.csv"
        )

        log.info(f"下載結果: {result.success}")
        ftp.disconnect()

    except Exception as e:
        log.error(f"下載失敗: {e}")

if __name__ == "__main__":
    download()
```

### 刪除檔案

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.ftp_manager import FTPManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def delete():
    try:
        ftp = FTPManager("sys_sch_ftp")

        # 刪除遠端檔案（回傳 FTPResponse）
        result = ftp.delete_file("/remote/path/file.csv")

        log.info(f"刪除結果: {result.success}")
        ftp.disconnect()

    except Exception as e:
        log.error(f"刪除失敗: {e}")

if __name__ == "__main__":
    delete()
```

## 完整範例

### FTP 檔案操作

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.ftp_manager import FTPManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def ftp_operations():
    """FTP 檔案操作完整範例"""
    try:
        ftp = FTPManager("sys_sch_ftp")
        
        remote_dir = "/ischeduling_ap/sys_sch/central_backend/pf_doc"
        
        # 列出目錄（回傳 FTPResponse）
        result = ftp.list_directory(remote_dir)
        log.info(f"目錄內容: {result.data}")
        
        # 上傳檔案
        local_file = "/local/data/report.html"
        remote_file = f"{remote_dir}/report.html"
        result = ftp.upload_file(local_file, remote_file)
        log.info(f"已上傳: {remote_file}, 成功: {result.success}")
        
        # 下載檔案
        download_path = "/local/download/report.html"
        result = ftp.download_file(remote_file, download_path)
        log.info(f"已下載到: {download_path}, 成功: {result.success}")
        
        # 刪除檔案
        result = ftp.delete_file(remote_file)
        log.info(f"已刪除: {remote_file}, 成功: {result.success}")
        
        # 關閉連線
        ftp.disconnect()
        log.info("FTP 連線已關閉")
        
    except Exception as e:
        log.error(f"FTP 操作失敗: {e}")

if __name__ == "__main__":
    ftp_operations()
```

### SFTP 檔案操作

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.ftp_manager import FTPManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def sftp_operations():
    """SFTP 檔案操作範例"""
    try:
        # 使用 SFTP 設定
        sftp = FTPManager("sys_sch_sftp")
        
        # 上傳（回傳 FTPResponse）
        result = sftp.upload_file("/local/file.csv", "/remote/file.csv")
        log.info(f"SFTP 上傳: {result.success}")
        
        # 下載
        result = sftp.download_file("/remote/file.csv", "/local/download.csv")
        log.info(f"SFTP 下載: {result.success}")
        
        sftp.disconnect()
        
    except Exception as e:
        log.error(f"SFTP 操作失敗: {e}")

if __name__ == "__main__":
    sftp_operations()
```

## 方法摘要

所有方法回傳 `FTPResponse` 物件。

> **FTPResponse 屬性**：
> - `success` (`bool`)：操作是否成功
> - `data` (`str`)：回傳資料或訊息

| 方法 | 說明 | 參數 | 回傳值 |
|-----|------|------|--------|
| `__init__(ftp_config)` | 初始化，ftp_config 對應 `ConfigManager.ftp_list[ftp_config]` | 設定名稱 | - |
| `list_directory(remote_directory)` | 列出目錄內容 | 遠端目錄路徑 | `FTPResponse` |
| `upload_file(local_file_path, remote_file_path)` | 上傳檔案 | 本地路徑, 遠端路徑 | `FTPResponse` |
| `download_file(remote_file_path, local_file_path)` | 下載檔案 | 遠端路徑, 本地路徑 | `FTPResponse` |
| `delete_file(remote_file_path)` | 刪除檔案 | 遠端檔案路徑 | `FTPResponse` |
| `disconnect()` | 關閉連線 | 無 | `FTPResponse` |

## 最佳實務

### 1. 確保關閉連線
```python
try:
    ftp = FTPManager("sys_sch_ftp")
    # 操作
finally:
    ftp.disconnect()
```

### 2. 檢查操作結果
```python
result = ftp.upload_file(local_path, remote_path)
if result.success:
    log.info(f"上傳成功: {result.data}")
else:
    log.error(f"上傳失敗: {result.data}")
```

### 3. 錯誤處理
```python
try:
    result = ftp.upload_file(local_path, remote_path)
    if not result.success:
        log.error(f"上傳失敗: {result.data}")
except Exception as e:
    log.error(f"上傳異常: {e}")
    raise
```

### 3. 使用環境變數存放密碼
```yaml
# config.yaml
FTP:
  my_ftp:
    username: "{ftp_username}"  # 使用環境變數
    password: "{ftp_password}"
```

## 常見問題

### Q1：連線失敗
```
原因：主機位址、埠號或認證錯誤
解決：
1. 確認 host 和 port 正確
2. 確認環境變數 ftp_username/ftp_password 已設定
3. 確認網路可連通
4. 確認 type（ftp/sftp）正確
```

### Q2：上傳失敗
```
原因：權限不足或路徑不存在
解決：
1. 確認遠端目錄存在
2. 確認帳號有寫入權限
3. 確認本地檔案存在
```

### Q3：下載失敗
```
原因：檔案不存在或權限不足
解決：
1. 確認遠端檔案存在
2. 確認帳號有讀取權限
3. 確認本地目錄存在且有寫入權限
```
