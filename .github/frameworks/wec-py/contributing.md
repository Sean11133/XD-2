# 開發規範 (Contributing Guide)

> 本文件由 wecpy 套件提供，說明使用 wecpy v1.11.1 時的 AI 開發規範。
> 您可依專案需要擴充此文件。

---

## AI 助手使用規範

使用 GitHub Copilot 或其他 AI 工具時，三步必祭：

1. 先讀 `AGENTS.md`（專案根目錄）—取得 Skill 索引與核心準則
2. 依任務領域選讀對應 `.github/skills/*/SKILL.md`
3. 未出現在 Skill / API 文件中的介面，一律不使用（禁止捏造）

---

## 程式碼開發規則

- Logging: 統一使用 `LogManager`，禁止 `print`
- 設定值: 統一使用 `ConfigManager`，禁止 hardcode
- SQL: 使用 parameterized queries（`:param` 樣式），避免字串拼接
- 初始化: `ConfigManager` import + init 必須連續兩行，不可插入其他程式碼
- 環境: 使用 `PILOT`/`PROD` 與 `IMX_ENV` 控制設定

---

## 強制初始化順序（不得御）

```python
# 必須最先連續兩行
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')  # 「目錄/ENV/config.yaml」

# 其後才可 import 其他模組
from wecpy.log_manager import LogManager
log = LogManager.get_logger()

log.info("App started")
```

---

## 安裝與環境管理

**安裝來源**（內部 Nexus 私有倉庫）：

```bash
pip install \
  --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple \
  --trusted-host=10.18.20.121:8081 \
  wecpy
```

**環境切換機制**：

```
<project_root>/
|- PILOT/config.yaml   # 測試環境
|- PROD/config.yaml    # 正式環境
|- requirements.txt
`- main.py
```

`IMX_ENV` 設定為 `PILOT` 或 `PROD`，程式則讀取對應子目錄下的 config.yaml。

---

## v1.11.1 服務端點環境變數

設定以下 ENV 可覆蓋 iMX 服務預設端點：

| 環境變數                   | 對應服務                    |
| -------------------------- | --------------------------- |
| `APP_RECORDER_URL`         | ELK Recorder                |
| `APP_STORER_URL`           | S3 Storer                   |
| `APP_CACHER_URL`           | Redis Cacher                |
| `APP_FETCHER_URL`          | SAP/EDWM/iMX Portal Fetcher |
| `APP_IFDC_DATAFETCHER_URL` | IFDC DataFetcher            |
| `APP_IEDA_DATAFETCHER_URL` | IEDA DataFetcher            |

解析層級：明確傳入 URL > ENV var > IMX_ENV 預設。

---

## 建議工作流程

1. 先確認需求屬於哪個 Skill 領域
2. 依 Skill 提供的 API Surface 撰寫程式碼
3. 檢查是否符合初始化順序與環境設定
4. 補上必要的錯誤處理與 logging

---

## 文件索引

- 框架指令: `.github/frameworks/wec-py/instructions/wecpy.instructions.md`
- 核心模組: `.github/frameworks/wec-py/skills/wecpy-core/SKILL.md`
- 資料庫操作: `.github/frameworks/wec-py/skills/wecpy-database/SKILL.md`
- gRPC 低階資料擷取: `.github/frameworks/wec-py/skills/wecpy-datafetcher/SKILL.md`
- FDC 高階擷取: `.github/frameworks/wec-py/skills/wecpy-fdc/SKILL.md`
- 檔案與通訊: `.github/frameworks/wec-py/skills/wecpy-io/SKILL.md`
- Kafka / 訊息佇列: `.github/frameworks/wec-py/skills/wecpy-kafka/SKILL.md`
- 監控與可觀察性: `.github/frameworks/wec-py/skills/wecpy-monitoring/SKILL.md`
- 專案重構遷移: `.github/frameworks/wec-py/skills/wecpy-refactor/SKILL.md`
- init 結構自動修復: `.github/frameworks/wec-py/skills/wecpy-fix-init/SKILL.md`

---

**框架版本**: wecpy v1.11.1
