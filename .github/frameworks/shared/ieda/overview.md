# iEDA Data Fetcher — 服務總覽

**提供單位**：MK23  
**協定**：gRPC (Protocol Buffers)  
**取代方案**：EDWM + IMPALA + SQL（效能提升 10 倍以上）

---

## 什麼是 EDA Data Fetcher

iEDA Data Fetcher 是由 A0IM 提供的晶圓廠工程資料分析（EDA）資料高效存取服務，透過 gRPC 串流傳輸半導體製造各類量測與測試資料。

### 特點

- 不需撰寫 SQL，以 Filter 物件取代 WHERE 條件
- 支援大批量資料串流，有效掌握網路與記憶體用量
- 客戶端支援 **Python** 與 **C#**
- 內建 `ParquetUtil` + `DuckDBUtil` 提供高效在地查詢

### 使用情境

- 存取 CP、WAT、LQC、缺陷（DEF）等工廠量測資料
- 開發者使用 Python 或 C# 開發分析應用程式
- JMP / Power BI 使用者可先透過 Python 匯出後再分析

---

## 核心概念：Fetcher / Filter / Parquet / DuckDB

```
1. <SomeData>FetcherStub    建立 gRPC 客戶端
2. <SomeData>Filter         設定條件（lots、時間、產品群組等）
3. ParquetUtil              將 gRPC 串流寫入 Parquet 暫存檔
4. DuckDBUtil               對 Parquet 執行 SQL 查詢，轉成 DataFrame
```

---

## 支援資料類型

| 類別        | Fetcher              | 說明            |
| ----------- | -------------------- | --------------- |
| **通用**    | `CmnChipFetcher`     | 晶片資料        |
|             | `CmnLotFetcher`      | 批號資料        |
|             | `CmnWaferFetcher`    | 晶圓資料        |
|             | `CmnProductFetcher`  | 產品資料        |
|             | `CmnShotFetcher`     | 曝光點資料      |
| **CP 測試** | `CpSummaryFetcher`   | CP 摘要         |
|             | `CpChipDcFetcher`    | CP 晶片 DC 參數 |
|             | `CpWaferFetcher`     | CP 晶圓         |
| **缺陷**    | `DefSummaryFetcher`  | 缺陷摘要        |
|             | `DefWaferFetcher`    | 缺陷晶圓        |
| **LQC**     | `LqcSummaryFetcher`  | LQC 摘要        |
|             | `LqcParamFetcher`    | LQC 參數        |
|             | `LqcSiteFetcher`     | LQC 測試點      |
|             | `LqcRegionFetcher`   | LQC 區域        |
| **WAT**     | `WatSummaryFetcher`  | WAT 摘要        |
|             | `WatParamFetcher`    | WAT 參數        |
|             | `WatSiteFetcher`     | WAT 測試點      |
|             | `WatRegionFetcher`   | WAT 區域        |
| **其他**    | `WipEqpEventFetcher` | 在製品設備事件  |

---

## 套件安裝

**Python**：

```bash
pip install --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple \
  --trusted-host=10.18.20.121:8081 \
  ieda-datafetcher
```

**C#**：

```
nuget install iEDA.DataFetcher
```

---

## 語言使用指引

| 語言   | 文件                                                                                 |
| ------ | ------------------------------------------------------------------------------------ |
| Python | [instructions/ieda-python.instructions.md](instructions/ieda-python.instructions.md) |
| C#     | [instructions/ieda-csharp.instructions.md](instructions/ieda-csharp.instructions.md) |

---

## 權限申請

未申請權限會出現以下錯誤：

- `Unauthenticated`：`Access denied. Authentication is required.`
- `PermissionDenied`：`Access denied. You do not have permission to access.`

請聯絡 **MK23** 申請授權。
