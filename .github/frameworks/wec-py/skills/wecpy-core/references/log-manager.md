# LogManager 詳細說明

LogManager 是 wecpy 框架的日誌管理元件，提供統一的日誌記錄機制，支援 log rotation、TID 追蹤、log_key 標記等企業級功能。

## 初始化

LogManager **必須**在 ConfigManager 初始化之後才能使用：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.log_manager import LogManager
log = LogManager.get_logger()
```

## 基本使用

### 日誌層級

```python
log.debug("除錯訊息 - 僅在 DEBUG 層級輸出")
log.info("一般資訊 - 正常執行流程")
log.warning("警告訊息 - 需要注意但不影響執行")
log.error("錯誤訊息 - 執行失敗或異常")
log.critical("嚴重錯誤 - 系統層級問題")
```

### 日誌層級優先順序

```
DEBUG < INFO < WARNING < ERROR < CRITICAL
```

- 設定為 `DEBUG` 時，所有層級都會輸出
- 設定為 `INFO` 時，DEBUG 不會輸出
- 設定為 `ERROR` 時，DEBUG、INFO、WARNING 都不會輸出

### 環境建議

| 環境 | 建議層級 | 說明 |
|-----|---------|------|
| PILOT | DEBUG | 開發除錯用，輸出完整資訊 |
| PROD | INFO | 正式環境，減少日誌量 |

## 帶 log_key 的日誌

`log_key` 用於標記日誌類型，便於 APM 追蹤和日誌分析：

```python
# 基本用法
log.info("處理開始", "process_start")
log.info("處理完成", "process_complete")
log.error("處理失敗", "process_error")

# 建議的 log_key 命名規範
log.info("資料擷取完成", "data_extract_success")
log.info("資料轉換完成", "data_transform_success")
log.info("資料載入完成", "data_load_success")
log.error("資料庫連線失敗", "db_connection_error")
log.error("Kafka 訊息處理失敗", "kafka_process_error")
```

### log_key 命名建議

| 類別 | 範例 | 說明 |
|-----|------|------|
| 流程階段 | `process_start`, `process_complete` | 標記執行流程 |
| 成功/失敗 | `xxx_success`, `xxx_error` | 標記結果 |
| 元件名稱 | `db_xxx`, `kafka_xxx`, `api_xxx` | 標記元件 |
| 動作類型 | `xxx_extract`, `xxx_transform`, `xxx_load` | 標記 ETL 階段 |

## 格式化日誌訊息

```python
# 使用 f-string（推薦）
lot_id = "LOT123"
count = 100
log.info(f"處理批號 {lot_id}，共 {count} 筆")

# 使用 % 格式化
log.info("處理批號 %s，共 %d 筆", lot_id, count)

# 記錄例外資訊
try:
    risky_operation()
except Exception as e:
    log.error(f"操作失敗: {e}", "operation_error")
    # 如果需要完整 stack trace
    log.exception("操作失敗")
```

## Log 區塊設定

在 config.yaml 中設定日誌行為：

```yaml
Log:
  version: 1
  formatters:
    format1:
      format: "[%(asctime)s.%(msecs)03d] {%(system)s %(app)s %(filename)s: %(funcName)s:%(lineno)d} %(levelname)s %(tid)s - %(message)s"
      datefmt: '%Y-%m-%d %H:%M:%S'
  handlers:
    console:
      class: logging.StreamHandler
      formatter: format1
      stream: ext://sys.stdout
    file:
      class: logging.handlers.RotatingFileHandler
      formatter: format1
      filename: log/app.log
      maxBytes: 10000000    # 10MB
      backupCount: 5        # 保留 5 個備份
  root:
    handlers: [console, file]
    level: INFO
```

### 格式化參數說明

| 參數 | 說明 | 範例 |
|-----|------|------|
| `%(asctime)s` | 時間戳記 | 2025-01-14 10:30:45 |
| `%(msecs)03d` | 毫秒（3位數補零） | 123 |
| `%(system)s` | 系統代碼 | IRS |
| `%(app)s` | 應用程式代碼 | MODEL_MONITOR |
| `%(filename)s` | 檔案名稱 | main.py |
| `%(funcName)s` | 函式名稱 | main |
| `%(lineno)d` | 行號 | 25 |
| `%(levelname)s` | 日誌層級 | INFO |
| `%(tid)s` | 交易 ID（TID） | abc-123-def |
| `%(message)s` | 日誌訊息 | 應用程式啟動 |

### Handler 類型

#### Console Handler
```yaml
console:
  class: logging.StreamHandler
  formatter: format1
  stream: ext://sys.stdout
```

#### File Handler（支援 rotation）
```yaml
file:
  class: logging.handlers.RotatingFileHandler
  formatter: format1
  filename: log/app.log
  maxBytes: 10000000    # 單檔最大 10MB
  backupCount: 5        # 保留 app.log.1 ~ app.log.5
```

### root 設定

```yaml
root:
  handlers: [console, file]    # 同時輸出到 console 和 file
  level: INFO                  # 最低輸出層級
```

**注意**：root.handlers 只需列出要使用的 handler 名稱。

## TID（Transaction ID）追蹤

wecpy 的日誌格式包含 TID，用於追蹤同一交易的所有日誌：

```
[2025-01-14 10:30:45.123] {IRS MODEL_MONITOR main.py: process:50} INFO abc-123-def - 開始處理
[2025-01-14 10:30:45.456] {IRS MODEL_MONITOR main.py: process:55} INFO abc-123-def - 查詢資料庫
[2025-01-14 10:30:45.789] {IRS MODEL_MONITOR main.py: process:60} INFO abc-123-def - 處理完成
```

所有 `abc-123-def` 的日誌都屬於同一次交易，方便追蹤問題。

## 最佳實務

### 1. 禁止使用 print()

```python
# ❌ 禁止
print("處理開始")
print(f"結果: {result}")

# ✅ 正確
log.info("處理開始")
log.info(f"結果: {result}")
```

### 2. 適當的日誌層級

```python
# ❌ 過度使用 INFO
log.info("進入函式")
log.info("變數值: x=1")
log.info("離開函式")

# ✅ 正確分層
log.debug("進入函式")          # 開發時才需要
log.debug("變數值: x=1")       # 開發時才需要
log.info("處理完成，共 100 筆") # 重要里程碑
```

### 3. 有意義的日誌訊息

```python
# ❌ 無意義
log.info("done")
log.error("error")

# ✅ 有意義
log.info("批號 LOT123 處理完成，共處理 100 筆資料")
log.error(f"資料庫連線失敗: {error_message}")
```

### 4. 包含必要上下文

```python
# ❌ 缺少上下文
log.error("處理失敗")

# ✅ 包含上下文
log.error(f"批號 {lot_id} 處理失敗: {error}, 已處理 {processed}/{total} 筆",
          "process_error")
```

### 5. 敏感資訊處理

```python
# ❌ 記錄敏感資訊
log.info(f"用戶密碼: {password}")
log.info(f"API Key: {api_key}")

# ✅ 遮蔽敏感資訊
log.info(f"用戶: {username} 登入成功")
log.info(f"API 呼叫成功")
```

## 日誌輸出範例

```
[2025-01-14 10:30:45.123] {IRS MODEL_MONITOR main.py: main:15} INFO abc-123-def - 應用程式啟動
[2025-01-14 10:30:45.124] {IRS MODEL_MONITOR main.py: main:16} INFO abc-123-def - 執行環境：PILOT
[2025-01-14 10:30:45.125] {IRS MODEL_MONITOR main.py: main:17} INFO abc-123-def - 系統代碼：IRS
[2025-01-14 10:30:45.456] {IRS MODEL_MONITOR service.py: process:30} DEBUG abc-123-def - 查詢資料庫
[2025-01-14 10:30:45.789] {IRS MODEL_MONITOR service.py: process:35} INFO abc-123-def - 處理完成，共 100 筆
[2025-01-14 10:30:46.000] {IRS MODEL_MONITOR main.py: main:25} INFO abc-123-def - 應用程式執行完成
```

## 常見問題

### Q1：log 目錄不存在
```
錯誤：FileNotFoundError: [Errno 2] No such file or directory: 'log/app.log'
解決：mkdir -p log
```

### Q2：日誌層級設定無效
```
原因：config.yaml 中 level 拼寫錯誤或格式不對
解決：確認是 INFO、DEBUG、WARNING、ERROR（全大寫）
```

### Q3：日誌未輸出到檔案
```
原因：handlers 未包含 file
解決：確認 root.handlers 包含 [console, file]
```
