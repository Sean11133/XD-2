# iFDC Data Fetcher — 服務總覽

**提供單位**：MK22  
**協定**：gRPC (Protocol Buffers)  
**取代方案**：EDWM + IMPALA + SQL（效能提升 10 倍以上）

---

## 什麼是 FDC Data Fetcher

iFDC Data Fetcher 是由 A0IM 提供的工廠設備控制（FDC）資料高效存取服務，透過 gRPC 串流協定傳輸，支援大資料量不中斷傳輸。

### 特點

- 不需撰寫 SQL，以 Filter 物件取代 WHERE 條件
- 支援大批量資料串流，有效掌握網路與記憶體用量
- 客戶端支援 **Python** 與 **C#**

### 使用情境

- 需要存取 FDC 工廠巨量資料（機台原始數據、Recipe 參數等）進行分析
- 開發者使用 Python 或 C# 開發應用程式
- JMP / Power BI 使用者可先透過 Python 匯出後再分析

---

## 核心概念：Fetcher / Filter / Result

```
1. <SomeData>Fetcher   建立資料來源（類似 SQL 的 Table）
2. <SomeData>Filter    設定條件（類似 SQL 的 WHERE）
3. for result in ...   逐批處理回傳資料
```

---

## 主要 Fetcher 類型

| Fetcher          | 說明             |
| ---------------- | ---------------- |
| `RawDataFetcher` | 機台原始量測數據 |
| `LotRunFetcher`  | Lot 運行記錄     |

---

## 套件安裝

**Python**：

```bash
pip install --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple \
  --trusted-host=10.18.20.121:8081 \
  ifdc-datafetcher
```

**C#**：

```
nuget install iFDC.DataFetcher
```

---

## 語言使用指引

| 語言   | 文件                                                                                 |
| ------ | ------------------------------------------------------------------------------------ |
| Python | [instructions/ifdc-python.instructions.md](instructions/ifdc-python.instructions.md) |
| C#     | [instructions/ifdc-csharp.instructions.md](instructions/ifdc-csharp.instructions.md) |

---

## 權限申請

未申請權限會出現以下錯誤：

- `Unauthenticated`：`Access denied. Authentication is required.`
- `PermissionDenied`：`Access denied. You do not have permission to access.`
