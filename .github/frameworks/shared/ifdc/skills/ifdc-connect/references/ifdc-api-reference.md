# iFDC Data Fetcher — API Reference

## 安裝

```bash
pip install ifdc-datafetcher \
  --index-url http://10.18.20.121:8081/repository/wec-pypi/simple \
  --trusted-host 10.18.20.121:8081
```

---

## Fetcher 類型

| Fetcher 類型     | Stub 類別            | 說明                     |
| ---------------- | -------------------- | ------------------------ |
| `RawDataFetcher` | `RawDataFetcherStub` | 原始機台 FDC 量測值      |
| `LotRunFetcher`  | `LotRunFetcherStub`  | 以 Lot 為單位的 Run 資料 |

---

## Filter 欄位

### RawDataFilter

| 欄位         | 型別       | 必填 | 說明                        | 範例                       |
| ------------ | ---------- | ---- | --------------------------- | -------------------------- |
| `eqpId`      | `string`   | ✓    | 機台 ID                     | `"DIFNC01"`                |
| `chambers`   | `string[]` |      | Chamber 清單（空白 = 全部） | `["PM1", "PM2"]`           |
| `parameters` | `string[]` |      | 量測參數清單（空白 = 全部） | `["RF_POWER", "PRESSURE"]` |
| `dateRanges` | `object[]` | ✓    | 時間區間（可多筆）          | 見下方                     |

**dateRanges 結構**

```python
dateRanges=[
    DateRange(
        start="2025-01-01 00:00:00",
        end="2025-01-02 00:00:00"
    )
]
```

### LotRunFilter

| 欄位       | 型別       | 必填 | 說明         |
| ---------- | ---------- | ---- | ------------ |
| `eqpId`    | `string`   | ✓    | 機台 ID      |
| `lots`     | `string[]` | ✓    | LOT ID 清單  |
| `chambers` | `string[]` |      | Chamber 清單 |

---

## 資料中心

| 常數          | 位置   |
| ------------- | ------ |
| `Location.KH` | 高雄廠 |
| `Location.TN` | 台南廠 |

---

## 錯誤碼對照

| 錯誤碼                   | 原因              | 解法                        |
| ------------------------ | ----------------- | --------------------------- |
| `Unauthenticated`        | 未申請 FDC 權限   | 聯絡 MK22 申請存取權限      |
| `PermissionDenied`       | 無特定機台存取權  | 聯絡 MK22 確認授權範圍      |
| `ImportError`            | 套件未安裝        | 執行上方 `pip install` 指令 |
| `ConnectionRefusedError` | gRPC 服務無法連線 | 確認網路環境（需廠內 VPN）  |

---

## 聯絡窗口

- **服務負責人**：MK22
- **問題回報**：申請帳號、授權、套件問題均聯絡 MK22
