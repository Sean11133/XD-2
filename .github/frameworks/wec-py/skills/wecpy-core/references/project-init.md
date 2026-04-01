# wecpy 專案初始化完整指南


## 目錄

- [步驟一：建立專案目錄結構](#步驟一建立專案目錄結構)
- [步驟二：建立 requirements.txt](#步驟二建立-requirementstxt)
- [步驟三：建立 config.yaml](#步驟三建立-configyaml)
  - [PILOT/config.yaml（開發/測試環境）](#pilotconfigyaml開發測試環境)
  - [PROD/config.yaml（正式環境）](#prodconfigyaml正式環境)
- [步驟四：建立 .env 檔案](#步驟四建立-env-檔案)
- [步驟五：建立 main.py](#步驟五建立-mainpy)
- [步驟六：建立 .gitignore](#步驟六建立-gitignore)
- [步驟七：驗證專案設定](#步驟七驗證專案設定)
- [常見問題](#常見問題)
  - [Q1：ModuleNotFoundError: No module named 'wecpy'](#q1modulenotfounderror-no-module-named-wecpy)
  - [Q2：config.yaml 找不到](#q2configyaml-找不到)
  - [Q3：環境變數 {IMX_XXX} 未替換](#q3環境變數-imx_xxx-未替換)
  - [Q4：log 目錄不存在](#q4log-目錄不存在)
- [下一步](#下一步)

本文件提供從零開始建立 wecpy 專案的完整步驟。

## 步驟一：建立專案目錄結構

```bash
mkdir -p my_wecpy_project/{PROD,PILOT,log,src/{models,daos,services,tests}}
cd my_wecpy_project
touch src/__init__.py src/models/__init__.py src/daos/__init__.py src/services/__init__.py src/tests/__init__.py
```

完整目錄結構：

```
my_wecpy_project/
├── PROD/
│   └── config.yaml          # 正式環境設定
├── PILOT/
│   └── config.yaml          # 測試/開發環境設定
├── .env                     # 環境變數檔案
├── .gitignore               # Git 排除設定
├── requirements.txt         # 相依套件清單
├── main.py                  # 主程式進入點
├── log/                     # 日誌輸出目錄
│   └── .gitkeep
└── src/                     # 程式碼目錄
    ├── __init__.py
    ├── models/              # SQLAlchemy 資料模型
    │   └── __init__.py
    ├── daos/                # 資料存取物件
    │   └── __init__.py
    ├── services/            # 業務邏輯層
    │   └── __init__.py
    └── tests/               # 測試檔案
        └── __init__.py
```

## 步驟二：建立 requirements.txt

```txt
# wecpy 框架核心套件
# 私有套件庫來源：http://10.18.20.121:8081/repository/wec-pypi/simple
wecpy

# 依需求加入其他套件
# ifdc-datafetcher    # FDC 資料擷取
# ieda-datafetcher    # EDA 資料擷取
```

安裝相依套件：

```bash
pip install -r requirements.txt
```

## 步驟三：建立 config.yaml

### PILOT/config.yaml（開發/測試環境）

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
    level: DEBUG
```

### PROD/config.yaml（正式環境）

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
```

**環境差異**：
| 項目 | PILOT | PROD |
|------|-------|------|
| Log level | DEBUG | INFO |
| 資料庫 | 測試 DB | 正式 DB |
| 服務端點 | 測試環境 | 正式環境 |

## 步驟四：建立 .env 檔案

```bash
# wecpy 基本環境變數
IMX_ENV=PILOT
IMX_SYSTEM=YOUR_SYSTEM_CODE
IMX_APP=YOUR_APP_CODE
IMX_APP_TYPE=Schedule
IMX_APP_OWNER=YOUR_USER_ID

# 資料庫連線資訊
IMX_UDB_ID=oracle_username
IMX_UDB_PWD=oracle_password
IMX_EDWML2_ID=trino_username
IMX_EDWML2_PWD=trino_password
IMX_TRAINDB_ID=traindb_username
IMX_TRAINDB_PWD=traindb_password
```

**注意**：`.env` 檔案包含敏感資訊，**絕對不可**納入版本控制。

## 步驟五：建立 main.py

```python
# -*- coding: utf-8 -*-
"""
wecpy 應用程式主要進入點
遵循 wecpy 框架初始化規範
"""
import os
import sys

# ============================================
# 步驟 1：初始化 ConfigManager（必須最先執行）
# ============================================
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

# ============================================
# 步驟 2：初始化其他 wecpy 元件
# ============================================
from wecpy.log_manager import LogManager

# ============================================
# 步驟 3：匯入其他相依模組（從 src/ 目錄）
# ============================================
# from src.services.your_service import YourService
# from src.models.your_model import YourModel

log = LogManager.get_logger()


def main() -> None:
    """主程式函式"""
    try:
        log.info("應用程式啟動")
        log.info(f"執行環境：{ConfigManager.ENV.IMX_ENV}")
        log.info(f"系統代碼：{ConfigManager.general.system}")
        log.info(f"應用程式代碼：{ConfigManager.general.app}")
        
        # ========================================
        # TODO: 在這裡實作業務邏輯
        # ========================================
        
        log.info("應用程式執行完成")
        
    except Exception as e:
        log.error(f"應用程式執行失敗：{e}", "app_error")
        sys.exit(1)


if __name__ == "__main__":
    main()
```

## 步驟六：建立 .gitignore

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
dist/
*.egg-info/
.eggs/

# 虛擬環境
.venv/
venv/
ENV/

# 環境變數（敏感資訊）
.env

# 日誌檔案
log/
*.log

# IDE
.idea/
.vscode/
*.swp
*.swo

# wecpy 專案特定
*.pyc
.cache/

# 測試覆蓋率
htmlcov/
.coverage
.pytest_cache/
```

## 步驟七：驗證專案設定

執行主程式驗證設定正確：

```bash
# 確保虛擬環境已啟用
# 確保 .env 已設定
python main.py
```

預期輸出：

```
[2025-01-14 10:00:00.000] {YOUR_SYSTEM YOUR_APP main.py: main:15} INFO - 應用程式啟動
[2025-01-14 10:00:00.001] {YOUR_SYSTEM YOUR_APP main.py: main:16} INFO - 執行環境：PILOT
[2025-01-14 10:00:00.002] {YOUR_SYSTEM YOUR_APP main.py: main:17} INFO - 系統代碼：YOUR_SYSTEM_CODE
[2025-01-14 10:00:00.003] {YOUR_SYSTEM YOUR_APP main.py: main:18} INFO - 應用程式代碼：YOUR_APP_CODE
[2025-01-14 10:00:00.004] {YOUR_SYSTEM YOUR_APP main.py: main:24} INFO - 應用程式執行完成
```

## 常見問題

### Q1：ModuleNotFoundError: No module named 'wecpy'
**原因**：未安裝 wecpy
**解決**：
```bash
# 安裝 wecpy
pip install --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple \
    --trusted-host=10.18.20.121 wecpy
```

### Q2：config.yaml 找不到
**原因**：IMX_ENV 環境變數未設定
**解決**：
```bash
# 確認 .env 檔案存在且包含 IMX_ENV=PILOT
# 或手動設定環境變數
export IMX_ENV=PILOT  # Linux/Mac
set IMX_ENV=PILOT     # Windows
```

### Q3：環境變數 {IMX_XXX} 未替換
**原因**：對應的環境變數未設定
**解決**：確認 `.env` 檔案包含所有 config.yaml 中使用的 `{變數名}`

### Q4：log 目錄不存在
**原因**：程式無法建立日誌檔案
**解決**：
```bash
mkdir -p log
```

## 下一步

專案初始化完成後，依需求參考其他技能文件：

- 需要資料庫操作 → `wecpy-database`
- 需要 Kafka 訊息 → `wecpy-kafka`
- 需要監控整合 → `wecpy-monitoring`
- 需要檔案/通知 → `wecpy-io`
- 需要工廠資料 → `wecpy-datafetcher`
