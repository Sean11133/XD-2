# FDC 進階參考

## FdcConfig 驗證規則

`FdcConfig.from_yaml(path)` 解析 YAML 時會執行完整驗證：

### 頂層驗證
- `location` 必須是 `"kh"` 或 `"ct"`
- `cycle_number` 必須是正整數（預設 1）
- 至少一個資料類型區塊（`raw_data`、`raw_statistic`、`run_data`）
- 每個區塊必須是 list 格式

### 查詢區塊驗證
- `eqp_id` 為必填
- `date_ranges` 為必填
- `date_ranges` 中的 `start` 和 `end` 都是必填
- 時間格式必須為 `YYYY-MM-DD HH:MM:SS`
- `start` 必須早於 `end`
- `recipe_steps` 僅限 `raw_data` 和 `raw_statistic`
- `windows` 在 v1 版本不支援（會拋出 ValueError）

### 資料結構

```python
from ml.core.fdc.config import FdcConfig, FetcherQuery, DateRange

@dataclass
class FdcConfig:
    location: str                   # "kh" 或 "ct"
    output_dir: str                 # 輸出目錄
    cycle_number: int               # Cycle 編號（預設 1）
    queries: list[FetcherQuery]     # 查詢條件列表

@dataclass
class FetcherQuery:
    data_type: FdcDataType          # RAW_DATA / RAW_STATISTIC / RUN_DATA
    eqp_id: str | None
    chambers: list[str]
    parameters: list[str]
    svids: list[str]
    recipes: list[str]
    products: list[str]
    mes_steps: list[str]
    date_ranges: list[DateRange]
    recipe_steps: list[str]

@dataclass
class DateRange:
    start: str                      # "YYYY-MM-DD HH:MM:SS"
    end: str
```

---

## FdcStore 查詢引擎

FdcStore 使用 **DuckDB in-memory** 連線，對本地 Parquet 檔案建立 SQL views。

### 運作機制

1. 初始化時建立 DuckDB 連線，接收 `cycle_number` 參數
2. 第一次查詢時 **Lazy 建立 view**：`CREATE OR REPLACE VIEW raw_data AS SELECT * FROM read_parquet('path/*.parquet')`
3. `fetch()` 完成後自動 refresh views
4. `query(sql)` 會自動偵測 SQL 中的資料類型名稱並建立對應 view

### cycle_number 篩選

`get_raw_data()` 和 `get_raw_statistic()` 會自動加上 `WHERE "cycleNumber" = ?` 條件，使用 `FdcConfig.cycle_number`（預設 1）。

- 只影響 `raw_data` 和 `raw_statistic`，`run_data` 不含 cycleNumber 欄位
- 使用 `query(sql)` 原生 SQL 時不會自動篩選，需自行加條件

```python
# get_raw_data 自動篩選 cycleNumber = cycle_number
df = client.get_raw_data(eqp_id="CMP_SDS_MEGA")

# query() 不會自動篩選，需自行加條件
df = client.query("""
    SELECT * FROM raw_data
    WHERE "cycleNumber" = 1 AND "eqpId" = 'CMP_SDS_MEGA'
""")
```

### 欄位名稱映射

Python API 的篩選參數名稱（snake_case）會映射到 Parquet 欄位名稱（camelCase）：

| Python 參數 | Parquet 欄位 |
|-------------|-------------|
| `eqp_id` | `eqpId` |
| `chamber` | `chamber` |
| `parameter` | `parameter` |
| `lot` | `lotId` |
| `product` | `product` |

### 時間篩選語意

時間篩選使用**重疊語意**（overlap semantics）：
- `start_time`：`runEndTime >= start_time`（Run 結束時間在指定起始之後）
- `end_time`：`runStartTime <= end_time`（Run 開始時間在指定結束之前）

這樣可以找到任何與指定時間範圍有重疊的 Run。

### ⚠️ 重疊 Parquet 不會自動去重

View 使用 `SELECT * FROM read_parquet('path/*.parquet')` 合併目錄下所有檔案，**沒有 DISTINCT**。`get_data()` 和 `query()` 也不會自動去重。

**正常情況下不會重疊**：Parquet 檔名是確定性生成的（eqp_id + chambers + 時間範圍 + hash），相同查詢條件 → 同檔名 → fetch 時 skip。

**什麼時候會重疊**：手動修改 `fdc_config.yaml` 的時間範圍讓它產生交叉，就可能出現重複資料。

**處理方式**：在查詢時自行加 `DISTINCT`：

```python
# 有重疊風險時，用 DISTINCT 去重
df = client.query("""
    SELECT DISTINCT * FROM raw_data
    WHERE "eqpId" = 'CMP_SDS_MEGA'
""")
```

### 自訂 SQL 範例

```python
# 聚合分析
df = client.query("""
    SELECT eqpId, chamber, parameter,
           COUNT(*) as cnt,
           AVG(CAST(value AS DOUBLE)) as avg_value
    FROM raw_data
    GROUP BY eqpId, chamber, parameter
""")

# 跨資料類型 JOIN
df = client.query("""
    SELECT r.eqpId, r.runId, r.parameter, r.value,
           s.mean, s.stdev
    FROM raw_data r
    JOIN raw_statistic s ON r.runId = s.runId AND r.parameter = s.parameter
""")
```

---

## ManifestManager 檔案追蹤

ManifestManager 在 `<output_dir>/.manifests/manifest.json` 記錄所有已擷取的 Parquet 檔案 metadata。

### ParquetFileInfo 結構

```python
@dataclass
class ParquetFileInfo:
    path: str            # 相對路徑（如 "raw_data/EQUIP--CH1--20250901T000000--20250902T000000--a1b2c3d4.parquet"）
    data_type: str       # 資料類型
    eqp_id: str | None   # 設備 ID
    query: dict          # 查詢條件
    fetched_at: str      # 擷取時間（ISO 8601 UTC）
    row_count: int       # 資料筆數
    file_size_mb: float  # 檔案大小（MB）
```

### 自動同步

`list_files()` 呼叫時會自動清理已刪除檔案的 manifest 記錄。

### Parquet 檔名格式

檔名由查詢條件決定性生成：
- 格式：`{eqp_id}--{chambers}--{start}--{end}--{hash8}.parquet`

hash8 為查詢條件（parameters, svids, recipes 等）的 SHA256 前 8 碼，確保不同篩選條件產生不同檔名。

---

## 平行擷取與 Retry 機制

### 平行擷取

`fetch()` 使用 `ThreadPoolExecutor` 平行執行 gRPC 請求：

```python
# 預設 4 個 workers
result = client.fetch()

# 增加 workers 加速
result = client.fetch(max_workers=8)
```

每個查詢條件 × 每個 date_range 會產生一個獨立的 fetch task。

### Retry 機制

每個 fetch task 使用 `tenacity` 自動重試：
- **最多重試 3 次**
- **指數退避**：第 1 次等 2 秒，第 2 次等 4 秒，最多 10 秒
- 重試前會記錄 WARNING 日誌
- 3 次都失敗後記入 `FetchResult.failures`

### 串流寫入

gRPC 回應是 streaming 的，每個 chunk 直接寫入 Parquet row group，記憶體使用量維持在單一 chunk 大小（~32 MB protobuf）。寫入過程中使用 `.parquet.tmp` 暫存檔，成功後才 rename 為正式檔名。

---

## 錯誤處理

### FetchFailure 詳情

```python
result = client.fetch()
for failure in result.failures:
    print(f"類型: {failure.data_type}")
    print(f"標籤: {failure.label}")    # 如 "EQUIP_ID, 2025-09-01 ~ 2025-09-02"
    print(f"錯誤: {failure.error}")
```

### 常見錯誤

| 錯誤 | 原因 | 解決 |
|------|------|------|
| `RuntimeError: ConfigManager not initialized` | 未初始化 ConfigManager | 在 FdcClient 前加 `ConfigManager('config.yaml')` |
| `RuntimeError: No config loaded` | 用 `data_dir` 模式呼叫 `fetch()` | 改用 `config_path` 模式 |
| `FileNotFoundError: Config file not found` | YAML 檔路徑錯誤 | 確認 fdc_config.yaml 路徑 |
| `ValueError: 'location' must be 'kh' or 'ct'` | location 設定錯誤 | 改為 kh 或 ct |
| `grpc._channel._InactiveRpcError` | gRPC 連線失敗 | 確認網路環境和認證 |
| `OSError: [Errno 13] Permission denied` | 寫入目錄無權限 | 確認 output_dir 權限 |

---

## 版本相依性

ml.core v2.0.1 **嚴格鎖定**相依版本：

| 套件 | 鎖定版本 |
|------|---------|
| ml-core | 2.0.1.dev0 |
| wecpy | 1.11.1 |
| ifdc-datafetcher | 1.0.5 |

### 重要注意事項

1. **必須使用 `pip install ml-core[fdc]`** 安裝，讓它自動配對正確版本
2. **不要單獨升級** wecpy 或 ifdc-datafetcher，會造成版本衝突
3. 版本不一致會導致 `ImportError` 或 runtime 異常
4. 如需升級，應統一升級 ml-core 並讓它拉取對應版本的相依套件

### 確認版本

```bash
pip show ml-core wecpy ifdc-datafetcher
```
