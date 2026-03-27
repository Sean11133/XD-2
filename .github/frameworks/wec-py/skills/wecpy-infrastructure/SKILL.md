---
name: wecpy-infrastructure
description: >-
  This skill should be used when the user asks about "S3BucketManager 物件儲存 MinIO 上傳下載", "presigned URL get_object put_object",
  "FTPManager FTP SFTP 檔案傳輸 upload download", "APMManager Elastic APM transaction trace",
  "COPManager Prometheus metrics counter gauge histogram", "gRPC Storer 5GB 上限",
  or needs wecpy infrastructure integration for object storage, file transfer, APM tracing, or Prometheus metrics.
  (wecpy v1.11.1)
---

# wecpy-infrastructure

## 首要原則 — 使用 wecpy，不要重造輪子

> **AI 在實作時，必須優先調用 wecpy 已提供的方法，嚴禁自行重新實作 wecpy 已涵蓋的功能。**

- **禁止**自行用 `boto3` / `minio` SDK 操作 S3 → 使用 `S3BucketManager`（已透過 gRPC Storer 封裝，支援 5GB）
- **禁止**自行用 `ftplib` / `paramiko` 連線 FTP/SFTP → 使用 `FTPManager`
- **禁止**自行初始化 Elastic APM agent → 使用 `APMManager`
- **禁止**自行用 `prometheus_client` 建立 metrics → 使用 `COPManager`
- **禁止**自行產生 presigned URL → 使用 `S3BucketManager.generate_presigned_url_with_expiration()`

如果需求可以被本 skill 列出的 API 滿足，就必須使用該 API。只有在 wecpy 確實不提供對應功能時，才能自行實作。

## 適用情境

- 檔案傳輸與批次交換
- 物件儲存讀寫
- 交易追蹤與例外上報
- Prometheus 指標輸出

## 設計模式

| 模組            | 模式      | 註記                       |
| --------------- | --------- | -------------------------- |
| S3BucketManager | Facade    | 封裝 MinIO/S3 完整生命週期 |
| FTPManager      | Adapter   | Protocol 扣 FTP/SFTP       |
| APMManager      | Proxy     | 透透明上報 Elastic APM     |
| COPManager      | Decorator | 註入 Prometheus metrics    |

## API Surface (Anti-Hallucination)

### FTPManager

- `FTPManager(name: str)`
- `ftp_config` — 取得 FTP 設定物件
- `list_directory(path)`
- `upload_file(local_path, remote_path)`
- `download_file(remote_path, local_path)`
- `delete_file(remote_path)`
- `disconnect()`
- `Protocol.FTP`, `Protocol.SFTP` — config `type` 欄位內容

### S3BucketManager (v1.11.1: 展開至 5GB gRPC 上限)

- `S3BucketManager(config_name: str)` (supports context manager)

**核心 CRUD**

- `get_object(key) -> S3Object`
- `get_object_binary(key) -> bytes`
- `put_object(s3_object: S3Object)`
- `delete_object(key)`
- `delete_folder(prefix)` — 刪除整個資料夾

**複製 / 移動**

- `copy_object(src_key, dst_key)`
- `move_object(src_key, dst_key)`
- `copy_folder(src_prefix, dst_prefix)`
- `move_folder(src_prefix, dst_prefix)`
- `copy_object_to_another_bucket(src_key, dst_bucket, dst_key)`
- `copy_folder_to_another_bucket(src_prefix, dst_bucket, dst_prefix)`

**查詢 / 專案管理**

- `get_all_objects_list(prefix: str = '') -> list[str]`
- `is_object_exist(key) -> bool`
- `change_bucket(config_name: str)`
- `save_object_to_localfile(key, local_path)`

**存取控制**

- `generate_presigned_url_with_expiration(key, expiration_seconds) -> str`
- `generate_url_without_expiration(key) -> str`
- `add_bucket_policy_for_permanent_access(prefix)`
- `update_bucket_policy_for_permanent_access(prefix)`

**S3Object**

- `S3Object.load_binary()`, `S3Object.save_to_local_path(path)`, `S3Object.add_metadata(key, value)`

**環境變數 (v1.11.1 新增)**

- `APP_STORER_URL` — 指定 Storer gRPC 端點，覆蓋 IMX_ENV 預設

### APMManager

- `begin_transaction(name, trans_type)`
- `end_transaction(name, result)`
- `capture_exception()`
- `capture_error_message(message)`

### COPManager

- `counter(name, description)`
- `gauge(name, description)`
- `histogram(name, description)`
- `summary(name, description)`
- `add_label(key, value)`
- `get_labels() -> dict`
- `reset_counter(name)`

## 常見幻覺與禁止事項

- 不存在 `FTPManager.sync_directory()`
- **不存在 `S3BucketManager.list_objects_v2()`**（正確用法為 `get_all_objects_list()`）
- 不存在 `APMManager.trace_function()`
- 不存在 `COPManager.push_gateway()`
