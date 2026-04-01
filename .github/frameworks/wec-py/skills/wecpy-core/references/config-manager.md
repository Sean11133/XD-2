# ConfigManager 詳細說明

ConfigManager 是 wecpy 框架的核心元件，負責載入組態檔案並管理環境變數。

## 初始化規範

### 強制規則

ConfigManager 的 `import` 和初始化**必須**是連續的兩行程式碼：

```python
# ✅ 正確
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

# ❌ 錯誤：中間有其他程式碼
from wecpy.config_manager import ConfigManager
import os  # 禁止！
ConfigManager('config.yaml')
```

### 初始化順序

所有其他 wecpy 模組必須在 ConfigManager 初始化**之後**才能匯入：

```python
# ✅ 正確順序
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.log_manager import LogManager
from wecpy.database_manager.oracle_manager import OracleManager
from wecpy.kafka_manager.base_kafka_listener import BaseKafkaListener
```

```python
# ❌ 錯誤順序
from wecpy.log_manager import LogManager  # 禁止！
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')
```

## 組態檔案載入機制

### 環境自動切換

ConfigManager 會根據 `IMX_ENV` 環境變數自動載入對應目錄的設定檔：

| IMX_ENV 值 | 載入路徑 |
|-----------|---------|
| PILOT | `./PILOT/config.yaml` |
| PROD | `./PROD/config.yaml` |
| （未設定） | 預設 PILOT |

```python
# 假設 IMX_ENV=PILOT
ConfigManager('config.yaml')  # 實際載入 ./PILOT/config.yaml
```

### 環境變數替換

config.yaml 中使用 `{變數名}` 語法會自動替換為對應的環境變數：

```yaml
# config.yaml
Database:
  TRAINDB:
    username: "{IMX_TRAINDB_ID}"
    password: "{IMX_TRAINDB_PWD}"
```

```bash
# .env
IMX_TRAINDB_ID=scott
IMX_TRAINDB_PWD=tiger
```

實際載入後：
```yaml
Database:
  TRAINDB:
    username: "scott"
    password: "tiger"
```

## 存取 General 區塊

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

# 取得 General 設定
general = ConfigManager.general

print(general.system)      # 系統代碼
print(general.app)         # 應用程式代碼
print(general.app_type)    # 應用類型：Schedule, Listener, Web
print(general.section)     # 部門代碼
```

### General 區塊必要欄位

```yaml
General:
  system: "{IMX_SYSTEM}"     # 必要：系統代碼
  app: "{IMX_APP}"           # 必要：應用程式代碼
  app_type: Schedule         # 必要：Schedule | Listener | Web
  section: MK10              # 必要：部門代碼
```

## 存取環境變數

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

# 透過 ENV 存取環境變數
env = ConfigManager.ENV

print(env.IMX_ENV)              # PILOT 或 PROD
print(env.IMX_SYSTEM)           # 系統代碼
print(env.IMX_APP)              # 應用程式代碼
print(env.IMX_APP_TYPE)         # 應用類型
print(env.IMX_APP_OWNER)        # 負責人 User ID

# 資料庫相關
print(env.IMX_UDB_ID)           # Oracle 使用者
print(env.IMX_UDB_PWD)          # Oracle 密碼
print(env.IMX_EDWML2_ID)        # Trino 使用者
print(env.IMX_EDWML2_PWD)       # Trino 密碼
```

## 存取共享路徑

使用 `get_path()` 方法建構共享檔案路徑：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')
import os

# 取得共享路徑
file_path = ConfigManager.get_path(
    ConfigManager.ENV.IMX_WECTINFO02_HOST,
    "MK20/MK22/department_salary_2024.csv"
)

folder_path = ConfigManager.get_path(
    ConfigManager.ENV.IMX_WECTINFO02_HOST,
    "MK20/MK22"
)

# 檢查檔案是否存在
if os.path.exists(file_path):
    print(f"檔案存在: {file_path}")

if os.path.exists(folder_path):
    print(f"目錄存在: {folder_path}")
```

## 存取自訂區塊

除了 General 和 Log，config.yaml 可包含其他自訂區塊：

```yaml
# config.yaml
General:
  system: "{IMX_SYSTEM}"
  app: "{IMX_APP}"
  app_type: Schedule
  section: MK10

CustomSettings:
  batch_size: 1000
  timeout: 30
  enabled: true
```

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

# 存取自訂區塊（依實際 wecpy 版本支援的方式）
# 通常其他 Manager 會自動讀取對應區塊
# 例如 DatabaseManager 讀取 Database 區塊
```

## config.yaml 完整範例

```yaml
General:
  system: "{IMX_SYSTEM}"
  app: "{IMX_APP}"
  app_type: Schedule
  section: MK10

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
      maxBytes: 10000000
      backupCount: 5
  root:
    handlers: [console, file]
    level: INFO

# 以下區塊依需求加入

Database:
  TRAINDB:
    type: oracle
    host: 10.18.20.35
    port: 1531
    username: "{IMX_TRAINDB_ID}"
    password: "{IMX_TRAINDB_PWD}"
    service: TRAINDB

Kafka:
  eda:
    topic: 'CTPILOT1-TEST-KAFKA'
    group.id: 'CTPILOT1-TEST-KAFKA'
    bootstrap.servers: fpkafka1:9092,fpkafka2:9092
    session.timeout.ms: 60000

Apm:
  apmserver:
    enabled: true
    server_url: http://ctpilotapm:8200
```

## 靜態工具方法

ConfigManager 提供幾個靜態方法，可在初始化前後使用：

### get_config_dict — 載入設定檔為 dict

```python
from wecpy.config_manager import ConfigManager

# 載入任意 YAML 或 JSON 設定檔為 dict（不需要先初始化 ConfigManager）
config = ConfigManager.get_config_dict("/path/to/custom_config.yaml")
print(config)  # {'key': 'value', ...}
```

### get_exe_env — 取得當前執行環境

```python
from wecpy.config_manager import ConfigManager

env = ConfigManager.get_exe_env()
print(env)  # "PILOT" 或 "PROD"
```

### root_path — 取得應用程式根路徑

```python
from wecpy.config_manager import ConfigManager

root = ConfigManager.root_path()
print(root)  # "/home/user/projects/my-app"
```

### get_config_file_path — 解析設定檔完整路徑

```python
from wecpy.config_manager import ConfigManager

# 根據 IMX_ENV 解析實際載入的設定檔路徑
path = ConfigManager.get_config_file_path("config.yaml")
print(path)  # "./PILOT/config.yaml" 或 "./PROD/config.yaml"
```

## 最佳實務

### 1. 環境分離
- PILOT 和 PROD 的 config.yaml 應分開維護
- 敏感資訊使用環境變數，不要硬編碼

### 2. 環境變數命名
- 使用 `IMX_` 前綴：框架內建變數
- 使用 `APP_` 前綴：應用程式自訂變數

### 3. 版本控制
- config.yaml 可以納入版控（使用環境變數取代敏感值）
- .env 檔案**絕對不可**納入版控

### 4. 驗證設定
```python
# 在主程式開頭驗證必要設定
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

required_vars = ['IMX_SYSTEM', 'IMX_APP', 'IMX_ENV']
for var in required_vars:
    if not getattr(ConfigManager.ENV, var, None):
        raise ValueError(f"必要環境變數未設定: {var}")
```

## 常見錯誤

### FileNotFoundError: config.yaml
```
原因：找不到 ./PILOT/config.yaml 或 ./PROD/config.yaml
解決：
1. 確認 IMX_ENV 環境變數已設定（PILOT 或 PROD）
2. 確認對應目錄存在 config.yaml
3. 確認工作目錄正確
```

### KeyError: 環境變數未設定
```
原因：config.yaml 中的 {變數名} 找不到對應環境變數
解決：
1. 確認 .env 檔案包含該變數
2. 確認變數名稱拼寫正確
3. 重新載入 .env（可能需要重啟終端機）
```

### AttributeError: 'NoneType' object has no attribute 'xxx'
```
原因：ConfigManager 尚未初始化就存取屬性
解決：確認 ConfigManager('config.yaml') 已在存取屬性前執行
```
