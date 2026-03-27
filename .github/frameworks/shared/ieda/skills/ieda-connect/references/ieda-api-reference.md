# iEDA Data Fetcher — API Reference

## 安裝

```bash
pip install ieda-datafetcher \
  --index-url http://10.18.20.121:8081/repository/wec-pypi/simple \
  --trusted-host 10.18.20.121:8081
```

---

## Fetcher 類型一覽

### Cmn（通用）

| Fetcher 類型      | Filter 類型      | 說明           |
| ----------------- | ---------------- | -------------- |
| `CmnProdFetcher`  | `CmnProdFilter`  | 產品基本資料   |
| `CmnLotFetcher`   | `CmnLotFilter`   | Lot 基本資料   |
| `CmnWaferFetcher` | `CmnWaferFilter` | Wafer 基本資料 |
| `CmnDieFetcher`   | `CmnDieFilter`   | Die 基本資料   |
| `CmnEqpFetcher`   | `CmnEqpFilter`   | 設備清單       |
| `CmnStepFetcher`  | `CmnStepFilter`  | 製程步驟清單   |

### CP（晶圓測試）

| Fetcher 類型       | Filter 類型       | 說明            |
| ------------------ | ----------------- | --------------- |
| `CpSummaryFetcher` | `CpSummaryFilter` | CP 測試彙總     |
| `CpItemFetcher`    | `CpItemFilter`    | CP 測試項目資料 |
| `CpSbinFetcher`    | `CpSbinFilter`    | CP Soft Bin     |
| `CpHbinFetcher`    | `CpHbinFilter`    | CP Hard Bin     |
| `CpWaferFetcher`   | `CpWaferFilter`   | CP Wafer 層級   |
| `CpDieFetcher`     | `CpDieFilter`     | CP Die 層級     |
| `CpSiteFetcher`    | `CpSiteFilter`    | CP Site 資料    |

### DEF（製程 Defect）

| Fetcher 類型        | Filter 類型        | 說明        |
| ------------------- | ------------------ | ----------- |
| `DefSummaryFetcher` | `DefSummaryFilter` | Defect 彙總 |
| `DefItemFetcher`    | `DefItemFilter`    | Defect 項目 |

### LQC（Line Quality Control）

| Fetcher 類型        | Filter 類型        | 說明           |
| ------------------- | ------------------ | -------------- |
| `LqcSummaryFetcher` | `LqcSummaryFilter` | LQC 彙總資料   |
| `LqcItemFetcher`    | `LqcItemFilter`    | LQC 測試項目   |
| `LqcWaferFetcher`   | `LqcWaferFilter`   | LQC Wafer 層級 |
| `LqcSiteFetcher`    | `LqcSiteFilter`    | LQC Site 資料  |

### WAT（Wafer Acceptance Test）

| Fetcher 類型        | Filter 類型        | 說明           |
| ------------------- | ------------------ | -------------- |
| `WatSummaryFetcher` | `WatSummaryFilter` | WAT 彙總資料   |
| `WatItemFetcher`    | `WatItemFilter`    | WAT 測試項目   |
| `WatWaferFetcher`   | `WatWaferFilter`   | WAT Wafer 層級 |
| `WatSiteFetcher`    | `WatSiteFilter`    | WAT Site 資料  |

### WipEqpEvent

| Fetcher 類型         | Filter 類型         | 說明                   |
| -------------------- | ------------------- | ---------------------- |
| `WipEqpEventFetcher` | `WipEqpEventFilter` | WIP 設備事件（進出站） |

> **命名規律**：`Get{DataType}List` RPC → `{DataType}Filter` 對應 Filter 類別

---

## Filter 通用欄位

以下欄位於大多數 Filter 類型中均可使用：

| 欄位            | 型別       | 說明                           | 範例                             |
| --------------- | ---------- | ------------------------------ | -------------------------------- |
| `lots`          | `string[]` | LOT ID 清單                    | `["61465S300D0", "61465S300D1"]` |
| `startDt`       | `string`   | 查詢起始日期（含）`YYYY-MM-DD` | `"2025-01-01"`                   |
| `endDt`         | `string`   | 查詢截止日期（含）`YYYY-MM-DD` | `"2025-01-31"`                   |
| `productGroups` | `string[]` | 產品群組代碼（可選）           | `["GAA108"]`                     |
| `wafers`        | `string[]` | Wafer 編號清單（可選）         | `["01", "02"]`                   |

---

## ParquetUtil 用法

ParquetUtil 將 gRPC 串流暫存為本地 Parquet 檔案，必須明確關閉。

```python
from ieda_fetcher.utils import ParquetUtil

tid = "my_query_20250101"
with ParquetUtil() as pu:
    pu.write_grpc_stream_to_parquet(tid, "lqc_summary", grpc_stream)
# with 區塊結束自動 close()
```

| 方法                                              | 說明                               |
| ------------------------------------------------- | ---------------------------------- |
| `write_grpc_stream_to_parquet(tid, name, stream)` | 串流寫入 Parquet，以 tid+name 為鍵 |
| `close()`                                         | 釋放資源（用 `with` 則自動呼叫）   |

> **注意**：若不用 `with` 語法，必須在 `finally` 中呼叫 `pu.close()`，否則 Parquet 檔案可能損壞。

---

## DuckDBUtil 用法

DuckDBUtil 對 ParquetUtil 寫入的 Parquet 執行 SQL，回傳 pandas DataFrame。

```python
from ieda_fetcher.utils import DuckDBUtil

df = DuckDBUtil.query_to_dataframe(
    "my_query_20250101",
    "SELECT * FROM #lqc_summary# WHERE lot_id = '61465S300D0'"
)
```

| 方法                           | 說明                                         |
| ------------------------------ | -------------------------------------------- |
| `query_to_dataframe(tid, sql)` | 以 SQL 查詢 Parquet，`#table_name#` 為佔位符 |

---

## 錯誤碼對照

| 錯誤碼                   | 原因                       | 解法                             |
| ------------------------ | -------------------------- | -------------------------------- |
| `Unauthenticated`        | 未申請 iEDA 存取權限       | 聯絡 MK23 申請帳號/權限          |
| `PermissionDenied`       | 無特定資料類型存取權       | 聯絡 MK23 確認授權範圍           |
| `ImportError`            | 套件未安裝                 | 執行上方 `pip install` 指令      |
| `ParquetUtil` 資源未關閉 | 未使用 `with` 或 `close()` | 改用 `with ParquetUtil() as pu:` |
| `ConnectionRefusedError` | gRPC 服務無法連線          | 確認網路環境（需廠內 VPN）       |

---

## 聯絡窗口

- **服務負責人**：MK23
- **問題回報**：申請帳號、授權、套件問題均聯絡 MK23
