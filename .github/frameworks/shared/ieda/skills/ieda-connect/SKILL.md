---
name: ieda-connect
description: This skill should be used when the user asks about "iEDA 怎麼用", "怎麼取 LQC 資料", "CP 資料怎麼查", "WAT 資料怎麼拉", "EDA filter 怎麼設定", "LqcSummaryFetcher 怎麼用", "連到 iEDA", "ieda-datafetcher 安裝", or needs to connect to the iEDA Data Fetcher service to query semiconductor manufacturing data (CP/LQC/WAT/DEF) using Python or C#.
---

# iEDA Data Fetcher 連線與查詢

iEDA Data Fetcher 是 MK23 提供的半導體製程資料（CP/LQC/WAT/DEF）gRPC 存取服務，涵蓋 Cmn／CP／DEF／LQC／WAT 多種 Fetcher 類型。

## 邊界

**處理**：iEDA 安裝、連線、Fetcher 選型、Filter 設定、ParquetUtil+DuckDBUtil 資料存取  
**不處理**：iFDC 設備量測資料（見 `shared/ifdc/`）、資料後續分析邏輯

## 執行步驟

### Step 1：確認資料類型與語言

詢問使用者：

1. 需要什麼類型的資料？（CP / LQC / WAT / DEF / Cmn）
2. Python 還是 C#？

完整 Fetcher 對照表見 [references/ieda-api-reference.md](references/ieda-api-reference.md)。

### Step 2：收集 Filter 條件

提示使用者提供（詳細欄位見 [references/ieda-api-reference.md](references/ieda-api-reference.md)）：

- Lot 清單（`lots`）
- 時間區間（`startDt` / `endDt`，格式：`YYYY-MM-DD`）
- Product Group（若適用）

### Step 3：選擇資料存取模式

iEDA 採兩步式存取：

1. **ParquetUtil** — 將 gRPC Stream 寫入 Parquet 暫存
2. **DuckDBUtil** — 以 SQL 查詢 Parquet 資料，回傳 DataFrame

詳細用法見 [references/ieda-api-reference.md](references/ieda-api-reference.md)。

### Step 4：提供範例

依語言載入對應 instructions 並生成完整可用的程式碼：

- Python → `../../instructions/ieda-python.instructions.md`
- C# → `../../instructions/ieda-csharp.instructions.md`

### Step 5：錯誤排查

查閱 [references/ieda-api-reference.md](references/ieda-api-reference.md) 的錯誤對照表。

## 參考資源

- **[references/ieda-api-reference.md](references/ieda-api-reference.md)** — Fetcher 類型表、Filter 欄位、ParquetUtil/DuckDBUtil 用法、錯誤碼
- **[overview.md](../../overview.md)** — 服務總覽與安裝指令
