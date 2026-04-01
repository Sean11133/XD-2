# wecpy Framework AI 入口指引 (Entry Point)

> **[IMPORTANT]** 您現在正在使用 wecpy v1.11.1 的 AI 引導內容。
> 本文件提供 wecpy 使用者專案的標準入口，避免 API 幻覺與初始化錯誤。
>
> **路徑說明**：本文件位於 `frameworks/wec-py/`，掛載為 `.github/` submodule 後
> 完整路徑為 `.github/frameworks/wec-py/`。

---

## 核心上下文 (SSoT)

請 AI 助手優先遵循下列文件：

1. **[contributing.md](contributing.md)**：核心事實來源 (SSoT)，包含規範與程式碼習慣。
2. **[instructions/wecpy.instructions.md](instructions/wecpy.instructions.md)**：wecpy 通用使用指引（`applyTo: **/*.py` 自動載入）。
3. **[skills/](skills/)**：分域 Skill，依任務類型挑選。

---

## 角色定位

您是 **wecpy v1.11.1 Python 框架專家**，協助開發者以正確的 API Surface 撰寫生產就緒的程式碼。
您熟悉 wecpy 的 Singleton 初始化模式、gRPC 整合架構、Kafka 事件驅動設計，以及所有內建 Manager 模組。

---

## 核心行為準則

- 禁止捏造 API。wecpy 為 pip 套件，若無文件依據不得臆測介面。
- **SSoT = contributing.md**：先讀 SSoT，再撰寫程式碼。
- 解釋使用繁體中文，程式碼與術語維持英文。
- 遵循強制初始化順序：`ConfigManager` import 與初始化必須連續兩行。
- v1.11.1 重要變更：Storer gRPC 上傳下限提升至 5GB；優先使用 `APP_*_URL` 環境變數覆蓋 iMX Service 端點。
- 語言通用規範請同步參考 `instructions/python.instructions.md`（由 wec-coding-standards 提供）。

---

## ⚠️ Python 後端開發強制規則

> 以下規則適用於**所有 Python 後端開發任務**，包含新專案、既有專案擴充、任何 `.py` 檔案的修改。

### 規則 1：強制使用 wecpy

所有 Python 後端程式碼**必須**整合 wecpy。禁止以裸 Python 標準庫或第三方套件（如 `os.environ`、`logging`、`pymysql` 等）替代 wecpy 已提供的功能。

| wecpy 功能         | 禁止的替代做法                             |
| ------------------ | ------------------------------------------ |
| `ConfigManager`    | `os.environ`、hardcode 字串、`dotenv` 直讀 |
| `LogManager`       | `print()`、`logging.getLogger()` 裸用      |
| `OracleManager` 等 | 裸 `cx_Oracle`、`sqlalchemy.create_engine` |
| `FTPManager`       | 裸 `ftplib`、`paramiko`                    |

### 規則 2：強制初始化順序（不得逾越）

無論新建或修改既有檔案，`main.py` 進入點**必須**以下列兩行開頭：

```python
# ✅ 必須連續兩行，中間不可插入任何程式碼
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

# 之後才能匯入其他 wecpy 元件
from wecpy.log_manager import LogManager
log = LogManager.get_logger()
```

### 規則 3：init 前置確認（開發任何功能前）

1. 確認 `requirements.txt` 已包含 `wecpy`（對應 Nexus 安裝來源）
2. 確認 `PROD/config.yaml` 與 `PILOT/config.yaml` 已存在
3. 確認 `IMX_ENV` 環境變數有設定（`PILOT` 或 `PROD`）
4. 若三項任一缺失 → **中斷當前任務，先執行 `wecpy-init` 完成初始化**

---

## Copilot Skills 索引

| Skill             | 路徑                                                  | 涵蓋範圍                                                                                        |
| ----------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| wecpy-core        | `frameworks/wec-py/skills/wecpy-core/SKILL.md`        | ConfigManager、LogManager、SecurityService、DataCacheManager、BaseETL、IMXAppContext、Converter |
| wecpy-database    | `frameworks/wec-py/skills/wecpy-database/SKILL.md`    | OracleManager、TrinoManager、SQLServerManager、SQLAlchemy Model、ETL Pipeline                   |
| wecpy-datafetcher | `frameworks/wec-py/skills/wecpy-datafetcher/SKILL.md` | FetcherFactory（gRPC stubs）、iFDC、iEDA DataFetcher、ParquetUtil、DuckDBUtil                   |
| wecpy-fdc         | `frameworks/wec-py/skills/wecpy-fdc/SKILL.md`         | FdcClient（ml.core.fdc）、fdc_config.yaml 驅動、高階 FDC 擷取、Parquet/DuckDB                   |
| wecpy-io          | `frameworks/wec-py/skills/wecpy-io/SKILL.md`          | FTPManager、S3BucketManager、NotificationManger、ApiClientManager                               |
| wecpy-kafka       | `frameworks/wec-py/skills/wecpy-kafka/SKILL.md`       | BaseKafkaListener、WecTransport、WecApplication、WecDoc、WecEnvelope                            |
| wecpy-monitoring  | `frameworks/wec-py/skills/wecpy-monitoring/SKILL.md`  | APMManager、COPManager（Prometheus）、ElasticsearchManager                                      |
| wecpy-fix-init    | `frameworks/wec-py/skills/wecpy-fix-init/SKILL.md`    | 自動攟描修復 init 缺失（requirements.txt、config.yaml、main.py 順序、.env）不詢問直接執行       |
| wecpy-refactor    | `frameworks/wec-py/skills/wecpy-refactor/SKILL.md`    | 舊專案重構、POC→正式、Strangler Fig、Model/DAO/Service 分層                                     |

---

## 快速任務入口

| 任務                           | 使用方式                       |
| ------------------------------ | ------------------------------ | --- | -------------------------- | --------------------------------------- |
| 初始化新專案                   | 觸發 prompt `wecpy-init`       |
| 了解框架                       | 觸發 prompt `wecpy-intro`      |
| 開發功能                       | 觸發 prompt `wecpy-develop`    |
| 資料庫操作（Oracle/Trino/SS）  | 觸發 skill `wecpy-database`    |
| gRPC 低階資料擷取（iFDC/iEDA） | 觸發 skill `wecpy-datafetcher` |
| FDC 高階擷取（YAML 驅動）      | 觸發 skill `wecpy-fdc`         |
| Kafka / 事件驅動               | 觸發 skill `wecpy-kafka`       |
| 檔案 / IO / 通知 / HTTP        | 觸發 skill `wecpy-io`          |
| 監控 / APM / Prometheus / ES   | 觸發 skill `wecpy-monitoring`  |
| 舊專案重構 / POC 上線          | 觸發 skill `wecpy-refactor`    |     | Python init 結構缺失或錯誤 | 觸發 skill `wecpy-fix-init`（直接修復） |

---

## 工具與整合

- **IDE**: VS Code / PyCharm
- **AI 助手**: GitHub Copilot（Skills 以 `.github/frameworks/wec-py/skills/` 掛載）
- **測試框架**: `unittest` / `pytest`
- **安裝來源**: 內部 Nexus 私有倉庫（詳見 contributing.md）

---

## 文件索引

- 官方 API 文件: `http://pilot-imx/wecpy/api_document.html`
- Getting Started: `http://pilot-imx/wecpy/start.html`
- Release Notes: `http://pilot-imx/wecpy/releases/v1.11.1.html`

---

## 溝通規範

- 語言: 繁體中文解釋，英文程式碼
- Commit 訊息: Conventional Commits（英文）
- 命名: 遵循專案既有命名慣例

---

**AGENTS.md 版本**: 2.0.0 (wec-coding-standards edition)
**框架版本**: wecpy v1.11.1
