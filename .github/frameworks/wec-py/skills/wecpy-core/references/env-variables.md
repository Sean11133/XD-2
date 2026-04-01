# 環境變數完整清單


## 目錄

- [核心環境變數](#核心環境變數)
  - [框架必要變數](#框架必要變數)
  - [應用類型說明](#應用類型說明)
- [資料庫相關變數](#資料庫相關變數)
  - [Oracle 資料庫](#oracle-資料庫)
  - [Trino 資料庫](#trino-資料庫)
  - [SQL Server 資料庫](#sql-server-資料庫)
- [檔案路徑變數](#檔案路徑變數)
- [FTP/SFTP 相關變數](#ftpsftp-相關變數)
- [API 相關變數](#api-相關變數)
- [自訂變數規範](#自訂變數規範)
  - [命名規則](#命名規則)
  - [自訂變數範例](#自訂變數範例)
- [.env 檔案範例](#env-檔案範例)
  - [最小設定（必要變數）](#最小設定必要變數)
  - [完整設定（含資料庫）](#完整設定含資料庫)
- [在 config.yaml 中使用](#在-configyaml-中使用)
- [環境變數載入方式](#環境變數載入方式)
  - [方法一：.env 檔案（建議）](#方法一env-檔案建議)
  - [方法二：系統環境變數](#方法二系統環境變數)
  - [方法三：啟動時指定](#方法三啟動時指定)
- [安全性注意事項](#安全性注意事項)
  - [禁止事項](#禁止事項)
  - [.gitignore 設定](#gitignore-設定)
  - [建議作法](#建議作法)
- [常見問題](#常見問題)
  - [Q1：環境變數未生效](#q1環境變數未生效)
  - [Q2：config.yaml 中 {變數名} 未替換](#q2configyaml-中-變數名-未替換)
  - [Q3：PILOT 和 PROD 環境混淆](#q3pilot-和-prod-環境混淆)

wecpy 框架使用環境變數來管理敏感資訊和環境設定。本文件列出所有支援的環境變數及其用途。

## 核心環境變數

### 框架必要變數

| 變數名稱 | 說明 | 必要 | 範例 |
|---------|------|-----|------|
| `IMX_ENV` | 執行環境 | ✅ | PILOT, PROD |
| `IMX_SYSTEM` | 系統代碼 | ✅ | IRS, IANALYSIS, ISIR |
| `IMX_APP` | 應用程式代碼 | ✅ | MODEL_MONITOR, DATA_ETL |
| `IMX_APP_TYPE` | 應用類型 | ✅ | Schedule, Listener, Web |
| `IMX_APP_OWNER` | 負責人 User ID | ⚠️ | YourUserID |

### 應用類型說明

| app_type | 說明 | 使用場景 |
|----------|------|---------|
| Schedule | 排程任務 | 定時執行的 ETL、報表產生 |
| Listener | 監聽服務 | Kafka Consumer、事件處理 |
| Web | Web 服務 | API Server、Web 應用 |

## 資料庫相關變數

### Oracle 資料庫

| 變數名稱 | 說明 | 用途 |
|---------|------|------|
| `IMX_UDB_ID` | Oracle 使用者名稱 | 通用 Oracle 連線 |
| `IMX_UDB_PWD` | Oracle 密碼 | 通用 Oracle 連線 |
| `IMX_TRAINDB_ID` | TRAINDB 使用者名稱 | 訓練/測試資料庫 |
| `IMX_TRAINDB_PWD` | TRAINDB 密碼 | 訓練/測試資料庫 |

### Trino 資料庫

| 變數名稱 | 說明 | 用途 |
|---------|------|------|
| `IMX_EDWML2_ID` | Trino 使用者名稱 | EDWML2 資料倉儲 |
| `IMX_EDWML2_PWD` | Trino 密碼 | EDWML2 資料倉儲 |

### SQL Server 資料庫

| 變數名稱 | 說明 | 用途 |
|---------|------|------|
| `IMX_ID` | SQL Server 使用者名稱 | 通用 SQL Server 連線 |
| `IMX_PWD` | SQL Server 密碼 | 通用 SQL Server 連線 |

## 檔案路徑變數

| 變數名稱 | 說明 | 用途 |
|---------|------|------|
| `IMX_WECTINFO02_HOST` | 共享檔案伺服器位址 | 檔案共享路徑 |

使用方式：
```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

file_path = ConfigManager.get_path(
    ConfigManager.ENV.IMX_WECTINFO02_HOST,
    "MK20/MK22/data.csv"
)
```

## FTP/SFTP 相關變數

| 變數名稱 | 說明 | 用途 |
|---------|------|------|
| `ftp_username` | FTP 使用者名稱 | FTP 檔案傳輸 |
| `ftp_password` | FTP 密碼 | FTP 檔案傳輸 |

## API 相關變數

| 變數名稱 | 說明 | 用途 |
|---------|------|------|
| `wec_pat` | WEC Personal Access Token | API 認證 |

## 自訂變數規範

### 命名規則

| 前綴 | 用途 | 範例 |
|-----|------|------|
| `IMX_` | 框架內建/跨系統共用 | `IMX_SYSTEM`, `IMX_ENV` |
| `APP_` | 應用程式自訂 | `APP_START_DATE`, `APP_BATCH_SIZE` |

### 自訂變數範例

```bash
# .env
APP_START_DATE=2024-01-01
APP_BATCH_SIZE=1000
APP_DEBUG_MODE=true
APP_KAFKA_TOPIC=MY_CUSTOM_TOPIC
```

```yaml
# config.yaml
CustomSettings:
  start_date: "{APP_START_DATE}"
  batch_size: "{APP_BATCH_SIZE}"
  debug_mode: "{APP_DEBUG_MODE}"
```

## .env 檔案範例

### 最小設定（必要變數）

```bash
# wecpy 框架必要變數
IMX_ENV=PILOT
IMX_SYSTEM=IRS
IMX_APP=MODEL_MONITOR
IMX_APP_TYPE=Schedule
IMX_APP_OWNER=YourUserID
```

### 完整設定（含資料庫）

```bash
# ===========================================
# wecpy 框架必要變數
# ===========================================
IMX_ENV=PILOT
IMX_SYSTEM=IRS
IMX_APP=MODEL_MONITOR
IMX_APP_TYPE=Schedule
IMX_APP_OWNER=YourUserID

# ===========================================
# Oracle 資料庫
# ===========================================
IMX_UDB_ID=oracle_user
IMX_UDB_PWD=oracle_password
IMX_TRAINDB_ID=traindb_user
IMX_TRAINDB_PWD=traindb_password

# ===========================================
# Trino 資料庫
# ===========================================
IMX_EDWML2_ID=trino_user
IMX_EDWML2_PWD=trino_password

# ===========================================
# SQL Server 資料庫
# ===========================================
IMX_ID=sqlserver_user
IMX_PWD=sqlserver_password

# ===========================================
# FTP/SFTP
# ===========================================
ftp_username=ftp_user
ftp_password=ftp_password

# ===========================================
# API
# ===========================================
wec_pat=your_personal_access_token

# ===========================================
# 共享路徑
# ===========================================
IMX_WECTINFO02_HOST=//fileserver/share

# ===========================================
# 應用程式自訂變數
# ===========================================
APP_START_DATE=2024-01-01
APP_BATCH_SIZE=1000
```

## 在 config.yaml 中使用

環境變數在 config.yaml 中使用 `{變數名}` 語法：

```yaml
General:
  system: "{IMX_SYSTEM}"
  app: "{IMX_APP}"
  app_type: "{IMX_APP_TYPE}"
  section: MK10

Database:
  TRAINDB:
    type: oracle
    host: 10.18.20.35
    port: 1531
    username: "{IMX_TRAINDB_ID}"
    password: "{IMX_TRAINDB_PWD}"
    service: TRAINDB

  edwml2:
    type: trino
    host: edwml2
    port: 18081
    catalog: udpdb
    username: "{IMX_EDWML2_ID}"
    password: "{IMX_EDWML2_PWD}"

FTP:
  sys_sch_ftp:
    type: ftp
    host: 10.18.30.164
    port: 21
    username: "{ftp_username}"
    password: "{ftp_password}"

APIClient:
  report:
    base_url: "http://report/api"
    timeout: 30
    retry: 3
    wec_pat: "{wec_pat}"
```

## 環境變數載入方式

### 方法一：.env 檔案（建議）

wecpy 框架**內建 dotenv 支援**，會自動載入專案根目錄的 `.env` 檔案，無需額外安裝 `python-dotenv` 套件。

建立 `.env` 檔案，wecpy 會自動載入：

```bash
# .env
IMX_ENV=PILOT
IMX_SYSTEM=IRS
```

### 方法二：系統環境變數

```bash
# Linux/Mac
export IMX_ENV=PILOT
export IMX_SYSTEM=IRS

# Windows
set IMX_ENV=PILOT
set IMX_SYSTEM=IRS
```

### 方法三：啟動時指定

```bash
# Linux/Mac
IMX_ENV=PILOT IMX_SYSTEM=IRS python main.py

# Windows PowerShell
$env:IMX_ENV="PILOT"; $env:IMX_SYSTEM="IRS"; python main.py
```

## 安全性注意事項

### 禁止事項

1. **禁止**將 .env 納入版本控制
2. **禁止**在程式碼中硬編碼密碼
3. **禁止**在日誌中記錄敏感變數值

### .gitignore 設定

```gitignore
# 環境變數檔案 - 包含敏感資訊
.env
.env.*
*.env
```

### 建議作法

1. 使用 `.env.example` 作為範本（不含實際密碼）
2. 正式環境使用 CI/CD 的 Secret 管理
3. 定期更換密碼

## 常見問題

### Q1：環境變數未生效
```
原因：
1. .env 檔案未建立
2. 變數名稱拼寫錯誤
3. 未重新載入環境（某些終端機需要重開）

解決：
1. 確認 .env 檔案存在於專案根目錄
2. 確認變數名稱完全相同（大小寫敏感）
3. 重新開啟終端機或執行 source .env
```

### Q2：config.yaml 中 {變數名} 未替換
```
原因：對應的環境變數未設定

解決：
1. 確認 .env 包含該變數
2. 確認變數名稱與 {} 中完全相同
```

### Q3：PILOT 和 PROD 環境混淆
```
原因：IMX_ENV 設定錯誤

解決：
1. 確認 IMX_ENV 值為 PILOT 或 PROD（大寫）
2. 確認載入正確的 .env 檔案
```
