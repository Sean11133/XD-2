---
name: ifdc-connect
description: This skill should be used when the user asks about "iFDC 怎麼用", "怎麼取 FDC 資料", "RawDataFetcher 怎麼設定", "FDC filter 怎麼寫", "連到 iFDC", "ifdc-datafetcher 安裝", or needs to connect to the iFDC Data Fetcher service to query factory FDC measurement data using Python or C#.
---

# iFDC Data Fetcher 連線與查詢

iFDC Data Fetcher 是 MK22 提供的工廠設備控制（FDC）資料高效存取服務，透過 gRPC 串流取代 EDWM + SQL。

## 邊界

**處理**：iFDC 安裝、連線、Filter 設定、串流取值  
**不處理**：iEDA 資料（見 `shared/ieda/`）、資料後續分析邏輯

## 執行步驟

### Step 1：確認語言

詢問使用者：Python 還是 C#？確認套件已安裝（見 API Reference）。

### Step 2：收集 Filter 條件

提示使用者提供（詳細欄位見 [references/ifdc-api-reference.md](references/ifdc-api-reference.md)）：

- 機台 ID（`eqpId`）
- Chamber 清單
- Parameter 清單
- 時間區間（`YYYY-MM-DD HH:MM:SS`）

### Step 3：提供範例

依語言載入對應 instructions 並生成完整可用的程式碼：

- Python → `../../instructions/ifdc-python.instructions.md`
- C# → `../../instructions/ifdc-csharp.instructions.md`

### Step 4：錯誤排查

查閱 [references/ifdc-api-reference.md](references/ifdc-api-reference.md) 的錯誤對照表。

## 參考資源

- **[references/ifdc-api-reference.md](references/ifdc-api-reference.md)** — Filter 欄位、Fetcher 類型、錯誤碼對照
- **[overview.md](../../overview.md)** — 服務總覽與安裝指令
