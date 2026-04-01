---
name: wecpy-fdc
description: >
  Invoke for high-level FDC data fetching using ml.core.fdc FdcClient (YAML-driven).
  Covers: FdcClient (fetch/query), fdc_config.yaml (raw_data/raw_statistic/run_data), FdcConfig, FetchResult,
  FdcDataType, FdcStore (DuckDB views), ManifestManager, ParquetFileInfo, cycle_number filtering.
  Auto-handles gRPC connection, Parquet write, DuckDB query, parallel fetch, retry.
  Keywords: FdcClient、ml.core.fdc、fdc_config.yaml、FDC 高階 API、YAML 設定驅動、撈 FDC 資料、
  raw_data、raw_statistic、run_data、Parquet、DuckDB、FdcConfig、FetchResult、ml-core[fdc]。
  Excludes low-level gRPC stubs→wecpy-datafetcher, DB queries→wecpy-database.
  觸發情境：FdcClient、ml.core.fdc、fdc_config.yaml、FDC 高階 API、FDC YAML 設定、
  建立 FDC 專案、FDC 怎麼用、撈 FDC 資料（高階）、ml-core fdc、用 YAML 撈 FDC、
  FDC Parquet 查詢、FDC DuckDB、FdcConfig、FetchResult、FdcDataType。
  注意：若使用者想用低階 FetcherFactory + gRPC stubs 直接擷取，應改用 wecpy-datafetcher 技能。
  當使用者想用 FdcClient 或 ml.core.fdc 擷取工廠資料時，務必使用此技能。
---

# wecpy FDC 高階資料擷取技能

ml.core.fdc 是基於 wecpy 框架的高階 FDC（Factory Data Collection）資料擷取套件。它封裝了 gRPC 連線、Parquet 寫入、DuckDB 查詢等底層操作，提供簡潔的 `FdcClient` API。

> **與 wecpy-datafetcher 的差異**：wecpy-datafetcher 處理低階 FetcherFactory + gRPC stubs；本技能使用 `ml.core.fdc.FdcClient`，透過 YAML 設定檔一站完成擷取與查詢。

| 比較 | wecpy-datafetcher（低階） | ml.core.fdc（本技能） |
|------|--------------------------|----------------------|
| 使用方式 | 寫 Python gRPC 程式碼 | YAML 設定檔驅動 |
| Parquet 儲存 | 需自己用 ParquetUtil | 自動存 Parquet + Manifest 追蹤 |
| 查詢 | 需自己用 DuckDBUtil | 內建 get_raw_data() / query() |
| 平行擷取 | 需自己寫 | 內建 ThreadPoolExecutor |
| 重試 | 需自己寫 | 內建 tenacity retry（3 次） |
| 資料類型 | 7 個 Fetcher | 3 個（raw_data, raw_statistic, run_data） |

---

## 安裝

```bash
pip install --no-cache-dir \
    --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple \
    --trusted-host=10.18.20.121 \
    ml-core[fdc]==2.0.1.dev0
```

此指令會一併安裝 `wecpy`、`ifdc_datafetcher`、`pyarrow`、`duckdb` 等相依套件。

---

## 互動式問答流程

建立 FDC 專案時，**必須依序詢問使用者以下問題**（使用 ask_user 工具）：

### 問題 1：廠區位置

```
choices: ["kh（高雄廠）", "ct（中科廠）"]
question: 你的廠區位置是哪一個？
```

### 問題 2：資料類型

```
choices: ["raw_data（原始感測數據）", "raw_statistic（統計數據）", "run_data（Run 級別數據）", "多種都要（請說明）"]
question: 你要撈哪種 FDC 資料類型？
```

### 問題 3：查詢參數

```
allow_freeform: true
question: 請提供以下資訊（可以先用範例值，之後再改）：
1. eqp_id（設備 ID，例如 EKPLYA01）— 必填
2. 時間範圍（例如 2025-09-01 00:00:00 ~ 2025-09-02 00:00:00）— 必填
3. 其他篩選條件（可選：chambers, parameters, recipes, products 等，沒有就留空）
```

### 問題 4：後續處理

```
choices: ["fetch 完就查詢並印出前幾筆資料", "fetch 完就好，不用查詢", "fetch + 查詢 + 匯出 CSV"]
question: fetch 資料後要做什麼後續處理？
```

---

## 專案結構

```
<workspace>/
├── PILOT/config.yaml       # PILOT 環境 wecpy 設定（Log level: DEBUG）
├── PROD/config.yaml        # PROD 環境 wecpy 設定（Log level: INFO）
├── config.yaml             # 當前環境 wecpy 設定（通常為 PILOT 的副本）
├── fdc_config.yaml         # FDC 資料擷取設定
├── .env                    # 環境變數
├── main.py                 # 主程式
├── requirements.txt        # 套件相依
├── log/                    # 日誌目錄
└── fdc_output/             # FDC 資料輸出（Parquet 檔案）
    ├── raw_data/
    ├── raw_statistic/
    ├── run_data/
    └── .manifests/          # Manifest 追蹤檔
        └── manifest.json
```

---

## fdc_config.yaml 格式

```yaml
location: ct                    # ct（中科廠）或 kh（高雄廠）
output_dir: ./fdc_output        # 可選，預設依廠區
cycle_number: 1                 # 可選，預設 1。查詢 raw_data / raw_statistic 時
                                # 會自動篩選 cycleNumber = cycle_number

raw_data:
  - eqp_id: CMP_SDS_MEGA       # 設備 ID（必填）
    chambers:                    # 可選
      - CBOXIDS3
    recipes: []                  # 可選
    parameters: []               # 可選
    svids: []                    # 可選
    products: []                 # 可選
    mes_steps: []                # 可選
    recipe_steps: []             # 可選（僅 raw_data / raw_statistic）

    date_ranges:                 # 時間範圍（必填，需搭配 eqp_id）
      - start: "2025-09-01 00:00:00"
        end: "2025-09-02 00:00:00"
```

### 設定規則

| 規則 | 說明 |
|------|------|
| `eqp_id` 必填 | 每個查詢區塊都必須指定設備 ID |
| `date_ranges` 必填 | 每個查詢區塊都必須指定時間範圍 |
| 時間格式 | `YYYY-MM-DD HH:MM:SS` |
| `start` < `end` | start 必須早於 end |
| `recipe_steps` 限制 | 僅限 `raw_data` 和 `raw_statistic`，`run_data` 不支援 |
| `windows` 不支援 | v1 版本不支援（保留給未來 uva_data） |
| `cycle_number` | 正整數，預設 1。查詢 raw_data / raw_statistic 時自動篩選 `cycleNumber` 欄位 |
| 每個資料類型可多組 | 同一類型下可設多組查詢條件 |

### output_dir 注意事項

預設值為網路路徑：
- ct → `//10.6.11.53/phm_project_tc_fab`
- kh → `//10.6.11.53/phm_project_kh_fab`

**開發環境建議**覆寫為本地路徑（如 `./fdc_output`），避免網路存取問題。

---

## FdcClient API

### 模式 1：擷取 + 查詢（從 YAML 設定）

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from ml.core.fdc import FdcClient, FdcDataType

with FdcClient(config_path="fdc_config.yaml") as client:
    # 擷取資料
    result = client.fetch(data_types=[FdcDataType.RAW_DATA])
    print(f"成功: {result.succeeded}, 失敗: {result.failed}")

    # 查詢
    df = client.get_raw_data(eqp_id="CMP_SDS_MEGA", chamber="CBOXIDS3")
    print(df.head())
```

### 模式 2：純查詢（已有 Parquet 資料）

```python
with FdcClient(data_dir="./fdc_output") as client:
    df = client.get_raw_data(eqp_id="CMP_SDS_MEGA")
    df = client.query("SELECT * FROM raw_data WHERE eqpId = 'CMP_SDS_MEGA'")
```

> **注意**：模式 2 不需要 ConfigManager 初始化，適合純分析場景。

### 查詢方法

| 方法 | 資料類型 |
|------|----------|
| `get_raw_data(**filters)` | raw_data |
| `get_raw_statistic(**filters)` | raw_statistic |
| `get_run_data(**filters)` | run_data |
| `query(sql)` | 任意（原生 DuckDB SQL） |
| `list_files(data_type, eqp_id)` | 列出已擷取的 Parquet 檔案 |
| `close()` | 關閉 DuckDB 連線 |

### 篩選參數

| 參數 | 型別 | 對應 Parquet 欄位 |
|------|------|-------------------|
| `eqp_id` | str / list[str] | eqpId |
| `chamber` | str / list[str] | chamber |
| `parameter` | str / list[str] | parameter |
| `lot` | str / list[str] | lotId |
| `product` | str / list[str] | product |
| `start_time` | str | runEndTime >= start（重疊語意） |
| `end_time` | str | runStartTime <= end（重疊語意） |

### FetchResult 結果物件

```python
result = client.fetch()
result.succeeded   # 成功擷取數
result.empty       # 查詢無資料數
result.skipped     # 檔案已存在跳過數
result.failed      # 失敗數
result.failures    # list[FetchFailure] — 失敗詳情
result.files       # dict[str, list[Path]] — 擷取的檔案路徑
```

### Skip 行為

`fetch()` 會**自動跳過已存在的 Parquet 檔**。如果需要重新擷取：
1. 刪除對應的 Parquet 檔案
2. 重新執行 `fetch()`

```python
# 只擷取特定資料類型
result = client.fetch(data_types=["raw_data"])

# 平行擷取（預設 4 個 workers）
result = client.fetch(max_workers=8)
```

---

## 認證機制

FdcClient 的 gRPC 連線**不需要手動提供帳密**。認證流程是自動的：

1. `ConfigManager` 初始化後，框架透過 IMX Security Service 自動取得 Token
2. `FetcherFactory` 建立 gRPC channel 時自動注入 Bearer Token
3. 程式必須在**可連到 IMX Security Service 的網路環境**中執行

> 如果遇到認證錯誤，通常是網路環境問題，而非程式碼問題。確認你在可存取 IMX 服務的網路內。

---

## 常見問題

### Q: gRPC 連線逾時

時間範圍太大會導致資料量過大而逾時。**建議每次時間範圍不超過 7 天**。可以拆成多組 date_ranges：

```yaml
raw_data:
  - eqp_id: EQUIPMENT_ID
    date_ranges:
      - start: "2025-09-01 00:00:00"
        end: "2025-09-07 00:00:00"
      - start: "2025-09-07 00:00:00"
        end: "2025-09-14 00:00:00"
```

### Q: RuntimeError: ConfigManager not initialized

使用模式 1（fetch）前必須初始化 ConfigManager：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')  # 必須在 FdcClient 之前
```

如果只是查詢已有資料，使用模式 2（`data_dir`）不需要 ConfigManager。

### Q: Parquet schema 不一致

不同時間擷取的資料可能有欄位差異（例如新增欄位）。如果 DuckDB 查詢報錯，刪除舊的 Parquet 檔重新擷取。

### Q: 如何查看已擷取的檔案清單

```python
files = client.list_files(data_type="raw_data", eqp_id="CMP_SDS_MEGA")
for f in files:
    print(f"{f.path} — {f.row_count} rows, {f.file_size_mb} MB")
```

### Q: 如何匯出查詢結果為 CSV

```python
df = client.get_raw_data(eqp_id="CMP_SDS_MEGA")
df.to_csv("output.csv", index=False)
```

---

## 詳細參考文件

| 文件 | 內容 |
|------|------|
| [fdc-advanced.md](references/fdc-advanced.md) | FdcConfig 驗證、DuckDB 機制、Manifest 追蹤、平行擷取、retry、版本相依性 — 當使用者遇到進階問題（config 驗證失敗、Manifest 衝突、效能調優、版本升級）時閱讀 |

## 範本檔案

| 檔案 | 用途 |
|------|------|
| [fdc_config.yaml](assets/fdc_config.yaml) | FDC 擷取設定模板 |
| [config.yaml](assets/config.yaml) | wecpy ConfigManager 設定模板 |
| [main-template.py](assets/main-template.py) | 主程式範本 |
