---
name: wecpy-fix-init
description: >
  Invoke when a Python project is missing wecpy initialization structure — AI executes directly without asking.
  Covers: scanning project for missing wecpy prerequisites, creating PROD/config.yaml, PILOT/config.yaml,
  requirements.txt (with wecpy), main.py (correct ConfigManager init order), .env template, log/ directory.
  Fixes: ConfigManager not first two lines, wecpy missing from requirements.txt, config.yaml absent,
  IMX_ENV/IMX_SYSTEM/IMX_APP not set, print()/logging used instead of LogManager.
  Keywords: wecpy 初始化、缺少 config.yaml、requirements 沒有 wecpy、main.py 初始化錯誤、
  ConfigManager 沒有連續兩行、缺少 PILOT PROD 目錄、wecpy not installed、init 前置結構缺失、
  wecpy 環境未設定、自動修復 wecpy 專案。
  Always execute autonomously — do NOT ask the user what to fix, scan and fix everything.
  Excludes new full project setup→use wecpy-core references/project-init.md instead.
---

# wecpy 初始化結構修復技能

> **執行模式：自動掃描 + 直接修復，不詢問、不等待確認。**
> 掃描發現什麼缺失就補什麼，補完後回報修復清單。

---

## 掃描清單（Checklist）

執行此 Skill 時，依序掃描以下 **6 個項目**，記錄每項結果（✅ 正常 / ❌ 缺失或錯誤）：

| #   | 掃描項目                      | 正常條件                                                                                                                   |
| --- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | `requirements.txt` 含 `wecpy` | 檔案存在且有 `wecpy` 這一行                                                                                                |
| 2   | `PROD/config.yaml` 存在       | 檔案存在且含 `General` + `Log` 區塊                                                                                        |
| 3   | `PILOT/config.yaml` 存在      | 檔案存在且含 `General` + `Log` 區塊                                                                                        |
| 4   | `main.py` 初始化順序正確      | 第一段可執行程式碼為連續兩行 `from wecpy.config_manager import ConfigManager` + `ConfigManager('config.yaml')`，中間無插入 |
| 5   | `.env` 含必要環境變數         | 檔案存在且含 `IMX_ENV`、`IMX_SYSTEM`、`IMX_APP`                                                                            |
| 6   | `config.yaml` 識別資訊已填入  | `General.app`、`General.system`、`General.app_type`、`General.section` 均非佔位符（非 `MY_APP` / `MY_SYSTEM` 等範本值）    |

> **項目 6 若為佔位符**：不阻擋修復流程，但修復完成後必須在回報中以 ⚠️ 標示，提示使用者填入實際值。

---

## 修復步驟

### Fix 1 — requirements.txt 缺少 wecpy

**若 `requirements.txt` 不存在 → 建立：**

```txt
# wecpy 框架核心套件（必要）
# 私有套件庫來源：http://10.18.20.121:8081/repository/wec-pypi/simple
wecpy

# 依需求加入其他套件
# ifdc-datafetcher    # FDC 資料擷取
# ieda-datafetcher    # EDA 資料擷取
```

**若 `requirements.txt` 存在但無 `wecpy` → 在檔案頂部插入：**

```txt
# wecpy 框架核心套件（必要）
wecpy
```

---

### Fix 2 & 3 — config.yaml 雙環境缺失

對 `PROD/config.yaml` 與 `PILOT/config.yaml` 各自判斷：

- 目錄不存在 → 建立目錄
- 檔案不存在 → 使用下方模板建立
- 檔案存在但缺 `General` 或 `Log` 區塊 → 在檔案頂部插入缺失區塊

**`PILOT/config.yaml` 模板（Log level = DEBUG）：**

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
      datefmt: "%Y-%m-%d %H:%M:%S"
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

**`PROD/config.yaml` 模板（Log level = INFO，其餘相同）：**

將上方 `level: DEBUG` 改為 `level: INFO`，其餘結構完全相同。

---

### Fix 4 — main.py 初始化順序錯誤

**情況 A：`main.py` 不存在 → 建立標準模板：**

```python
# -*- coding: utf-8 -*-
import sys

# =============================================================================
# 步驟 1：初始化 ConfigManager（必須最先執行，不可分離）
# =============================================================================
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

# =============================================================================
# 步驟 2：匯入其他 wecpy 元件
# =============================================================================
from wecpy.log_manager import LogManager

log = LogManager.get_logger()


def main() -> None:
    log.info("應用程式啟動")
    # TODO: 實作業務邏輯


if __name__ == "__main__":
    main()
```

**情況 B：`main.py` 存在，但 ConfigManager 初始化不在前兩行 → 在第一行可執行程式碼前插入：**

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')
```

並移除檔案中其他位置的 ConfigManager import（避免重複）。

**禁止情況（找到需修正）：**

```python
# ❌ 中間插入了其他程式碼
from wecpy.config_manager import ConfigManager
import os               # 禁止
ConfigManager('config.yaml')

# ❌ 先 import 其他 wecpy 元件
from wecpy.log_manager import LogManager   # 禁止
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')
```

---

### Fix 5 — .env 缺少必要環境變數

**若 `.env` 不存在 → 建立：**

```dotenv
# wecpy 執行環境設定
# 切換 PILOT（測試）或 PROD（正式）
IMX_ENV=PILOT

# 系統與應用程式識別碼（填入實際值）
IMX_SYSTEM=YOUR_SYSTEM
IMX_APP=YOUR_APP
IMX_APP_TYPE=Schedule

# iMX Service 端點覆蓋（可選，不填則使用框架預設值）
# APP_RECORDER_URL=
# APP_STORER_URL=
# APP_CACHER_URL=
# APP_FETCHER_URL=
# APP_IFDC_DATAFETCHER_URL=
# APP_IEDA_DATAFETCHER_URL=
```

**若 `.env` 存在但缺少某變數 → 在檔案尾端追加缺失的變數行。**

---

### 額外修復 — log/ 目錄不存在

若 `log/` 目錄不存在 → 建立目錄並新增 `log/.gitkeep`。

---

## 修復完成後回報格式

```
### wecpy Init 修復完成

| 項目 | 狀態 | 動作 |
|------|------|------|
| requirements.txt | ✅ | 新增 wecpy |
| PILOT/config.yaml | ✅ | 建立檔案 |
| PROD/config.yaml | ✅ | 建立檔案 |
| main.py | ✅ | 修正 ConfigManager 初始化順序 |
| .env | ✅ | 建立檔案（請填入 IMX_SYSTEM / IMX_APP） |
| log/ | ✅ | 建立目錄 |

> ⚠️ 請確認 `.env` 中的 `IMX_SYSTEM` 與 `IMX_APP` 填入正確的識別碼後再執行。
```

---

## 注意事項

- **不修改既有業務邏輯**：只補結構性缺失，不動 `src/` 下的服務/模型/DAO 程式碼
- **幂等操作**：重複執行不會破壞已正確的設定
- **`.env` 不納入版控**：確認 `.gitignore` 含 `.env`，若無則追加一行
