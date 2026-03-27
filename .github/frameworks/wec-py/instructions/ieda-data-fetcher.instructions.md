---
applyTo: "**/*.py"
---

# iEDA Data Fetcher — Python 指引（Pointer）

> ⚠️ **本文件已移轉至 `shared/` 統一管理** ⚠️
>
> iEDA Data Fetcher 同時支援 Python 與 C#，已移至跨語言共享目錄：
>
> ```
> frameworks/shared/ieda/
> ├── overview.md                          ← 服務總覽（概念、資料類型、安裝）
> ├── instructions/
> │   ├── ieda-python.instructions.md      ← Python 使用指引（本文件的替代）
> │   └── ieda-csharp.instructions.md      ← C# 使用指引
> └── skills/
>     └── ieda-connect/SKILL.md
> ```
>
> 請改至 `frameworks/shared/ieda/instructions/ieda-python.instructions.md`

---

<!-- 以下保留原始內容供過渡期參照，維護請至 shared/ -->

## 優先指導原則

當為此儲存庫產生涉及 iEDA Data Fetcher 的程式碼時：

1. **版本相容性**：嚴格遵循專案中檢測到的 Python 版本（3.8-3.12）和 wecpy 框架版本
2. **初始化順序**：必須遵循 wecpy 框架的強制初始化順序
3. **架構一致性**：維護 wecpy 企業級框架與 iEDA Data Fetcher 的整合設計
4. **程式碼品質**：在所有產生的程式碼中優先考慮可維護性、效能、安全性和可測試性
5. **官方模式**：嚴格遵循 iEDA Data Fetcher 官方文件範例的程式碼結構和命名慣例

## iEDA Data Fetcher 版本需求

### 支援版本

- **Python 版本**：Python >= 3.8 <= 3.12（排除 3.0-3.7）
- **安裝方式**：`pip install ieda_datafetcher`
- **核心功能**：基於 gRPC 協定的高效能資料擷取
- **安全性**：內建安全機制確保資料安全性與完整性
- **相關模組**：
  - `ieda_datafetcher.*_pb2` (Protocol Buffers 訊息定義)
  - `ieda_datafetcher.*_pb2_grpc` (gRPC 客戶端 Stub)

## 強制初始化模式

### ConfigManager 優先初始化（必須遵循 wecpy 規範）

```python
# 步驟 1：ConfigManager 必須最先匯入和初始化（不可分離）
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

# 步驟 2：其他 wecpy 元件匯入
from wecpy.log_manager import LogManager
from wecpy.data_fetcher import FetcherFactory

# 步驟 3：IEDA Data Fetcher 模組匯入
# 注意：安裝 ieda_datafetcher 後，才能 from ... import
from ieda_datafetcher.parquet_util import ParquetUtil
from ieda_datafetcher.duckdb_util import DuckDBUtil

# 步驟 4：初始化日誌
log = LogManager.get_logger()
```

**關鍵限制**：

- ConfigManager 的 import 和初始化必須為連續的兩行程式碼
- 絕不在這兩行之間插入任何其他程式碼
- iEDA Data Fetcher 模組必須在 ConfigManager 初始化之後匯入
- 必須先安裝 `ieda_datafetcher` 套件才能匯入相關模組

## iEDA Data Fetcher 實作模式

### 基本資料擷取模式

根據官方文件，遵循以下實作模式：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')
from wecpy.log_manager import LogManager
from wecpy.data_fetcher import FetcherFactory

# 安裝 ieda_datafetcher 後，才能 from ... import
from ieda_datafetcher.parquet_util import ParquetUtil
from ieda_datafetcher.duckdb_util import DuckDBUtil
from ieda_datafetcher.lqc_summary_pb2 import LqcSummary, LqcSummaryFilter
from ieda_datafetcher.lqc_summary_pb2_grpc import LqcSummaryFetcherStub

import pandas as pd
from typing import List, Optional

log = LogManager.get_logger()

def get_lqc_summary_data(lots: List[str]) -> pd.DataFrame:
    """
    從 iEDA 系統擷取 LQC Summary 資料並轉換為 DataFrame

    Args:
        lots: LOT ID 清單

    Returns:
        包含 LQC Summary 資料的 DataFrame
    """

    """取得 LQC Summary 統計摘要資料並轉換為 DataFrame"""
    # 連接到 gRPC 伺服器
    client = FetcherFactory.create_client(LqcSummaryFetcherStub)

    # 建立 LqcSummaryFilter 篩選條件
    filter = LqcSummaryFilter()
    # 設定時間範圍
    filter.startDt = "2025-09-01 00:00:00"
    filter.endDt = "2025-09-01 03:00:00"
    # 設定產品群組 (參考測試案例的真實資料)
    filter.productGroups.extend(["GAA108"])

    try:
        # 呼叫 gRPC 服務
        response_stream = client.GetLqcSummaryList(filter)

        # 使用 ParquetUtil 寫入 Parquet 檔案
        pu = ParquetUtil()
        try:
            result = pu.write_grpc_stream_to_parquet(
                tid="LQC_SUMMARY",
                table_name="lqc_summary",
                grpc_stream=response_stream
            )
            logger.info("gRPC 串流資料已成功寫入 Parquet 檔案")
        finally:
            pu.close()  # 確保資源正確釋放

        # 使用 DuckDB 讀取資料為 DataFrame
        duck_util = DuckDBUtil()
        df = duck_util.query_to_dataframe("LQC_SUMMARY", "SELECT * FROM #lqc_summary#")

        logger.info(f"成功取得 {len(df)} 筆 LQC Summary 統計資料")
        return df

    except Exception as e:
        logger.error(f"取得 LQC Summary 資料時發生錯誤: {str(e)}")
        raise
```

## 支援的資料類型與 Fetcher Stub

### 主要資料類型

iEDA Data Fetcher 支援多種半導體製造資料類型：

#### 1. 通用資料 (Common Data)

- **CmnChipFetcher**: 晶片資料
- **CmnLotFetcher**: 批號資料
- **CmnLotWaferFetcher**: 批號晶圓資料
- **CmnProductFetcher**: 產品資料
- **CmnShotFetcher**: 曝光點資料
- **CmnWaferFetcher**: 晶圓資料

#### 2. CP 測試資料 (Circuit Probing)

- **CpChipDcFetcher**: CP 晶片 DC 參數資料
- **CpChipRacFetcher**: CP 晶片 RAC 資料
- **CpSummaryFetcher**: CP 摘要資料
- **CpSummaryCprFetcher**: CP 摘要 CPR 資料
- **CpSummaryDcFetcher**: CP 摘要 DC 資料
- **CpSummaryFrcFetcher**: CP 摘要 FRC 資料
- **CpWaferFetcher**: CP 晶圓資料

#### 3. 缺陷分析 (Defect)

- **DefSummaryFetcher**: 缺陷摘要資料
- **DefSummaryClassFetcher**: 缺陷分類摘要資料
- **DefWaferFetcher**: 缺陷晶圓資料

#### 4. Lot Quality Control(LQC)

- **LqcParamFetcher**: LQC 參數資料
- **LqcSummaryFetcher**: LQC 摘要資料
- **LqcSiteFetcher**: LQC 測試點資料
- **LqcRegionFetcher**: LQC 區域資料

#### 5. Wafer Acceptance Test 晶片檢測(WAT)

- **WatParamFetcher**: WAT 參數資料
- **WatRegionFetcher**: WAT 區域資料
- **WatSiteFetcher**: WAT 測試點資料
- **WatSummaryFetcher**: WAT 摘要資料

#### 5. 其他專業資料

- **WipEqpEventFetcher**: 在製品設備事件資料

## 資料擷取操作模式

### 基本查詢模式

```python
def fetch_basic_data(fetcher_class, filter_class, lots: List[str]) -> pd.DataFrame:
    """通用的基本資料擷取模式"""
    try:
        # 建立客戶端
        client = FetcherFactory.create_client(fetcher_class)

        # 建立篩選條件
        filter_criteria = filter_class()
        filter_criteria.lots.extend(lots)

        # 執行查詢
        response_stream = client.GetLqcSummaryList(filter_criteria)  # 方法名稱依 Fetcher 而異

        # 使用 ParquetUtil 寫入 Parquet 檔案
        pu = ParquetUtil()
        try:
            result = pu.write_grpc_stream_to_parquet(
                tid="LQC_SUMMARY",
                table_name="lqc_summary",
                grpc_stream=response_stream
            )
            logger.info("gRPC 串流資料已成功寫入 Parquet 檔案")
        finally:
            pu.close()  # 確保資源正確釋放

        # 使用 DuckDB 讀取資料為 DataFrame
        duck_util = DuckDBUtil()
        df = duck_util.query_to_dataframe("LQC_SUMMARY", "SELECT * FROM #lqc_summary#")

        log.info(f"擷取完成: {len(df)} 筆記錄", log_key="ieda_fetch_success")
        return df

    except Exception as e:
        log.error(f"資料擷取失敗: {str(e)}", log_key="ieda_fetch_error")
        raise
```

## 錯誤處理模式

### iEDA Data Fetcher 例外處理

```python
import grpc
from grpc import RpcError

def safe_ieda_data_fetch(fetcher_class, filter_class, lots: List[str]) -> Optional[pd.DataFrame]:
    """安全的 iEDA 資料擷取，包含完整錯誤處理"""
    try:
        client = FetcherFactory.create_client(fetcher_class)

        filter_criteria = filter_class()
        filter_criteria.lots.extend(lots)

        response_stream = client.GetLqcSummaryList(filter_criteria)

         # 使用 ParquetUtil 寫入 Parquet 檔案
        pu = ParquetUtil()
        try:
            result = pu.write_grpc_stream_to_parquet(
                tid="LQC_SUMMARY",
                table_name="lqc_summary",
                grpc_stream=response_stream
            )
            logger.info("gRPC 串流資料已成功寫入 Parquet 檔案")
        finally:
            pu.close()  # 確保資源正確釋放

        # 使用 DuckDB 讀取資料為 DataFrame
        duck_util = DuckDBUtil()
        df = duck_util.query_to_dataframe("LQC_SUMMARY", "SELECT * FROM #lqc_summary#")

        return df

    except RpcError as e:
        # gRPC 特定錯誤
        log.error(f"gRPC 連線錯誤: {e.code()}, {e.details()}",
                 log_key="ieda_grpc_error")
        return None

    except ConnectionError as e:
        # 網路連線錯誤
        log.error(f"iEDA 伺服器連線失敗: {str(e)}",
                 log_key="ieda_connection_error")
        return None

    except TimeoutError as e:
        # 逾時錯誤
        log.error(f"iEDA 資料擷取逾時: {str(e)}",
                 log_key="ieda_timeout_error")
        return None

    except ImportError as e:
        # 模組匯入錯誤（可能未安裝 ieda_datafetcher）
        log.error(f"iEDA Data Fetcher 模組匯入失敗，請確認是否已安裝: {str(e)}",
                 log_key="ieda_import_error")
        return None

    except Exception as e:
        # 其他未預期錯誤
        log.error(f"iEDA 資料擷取發生未預期錯誤: {str(e)}",
                 log_key="ieda_unexpected_error")
        return None
```

## 程式碼品質標準

### 可維護性

- 使用有意義的函式和變數命名
- 適當使用型別提示增加程式碼可讀性
- 將 iEDA Data Fetcher 邏輯封裝為獨立服務類別
- 遵循 wecpy 框架的設計模式

### 安全性

- wecpy 框架自動處理 iEDA 伺服器連線設定
- 驗證輸入參數避免注入攻擊
- 妥善處理例外情況，避免洩漏敏感資訊
- 使用 SSL/TLS 加密 gRPC 通訊（如果支援）

### 可測試性

- 將 iEDA Data Fetcher 操作封裝為獨立方法
- 模擬 gRPC 客戶端進行單元測試
- 測試檔案命名為 `*_test.py`
- 使用 pytest 或 unittest 進行測試

## 專案結構模式

### 標準 iEDA Data Fetcher 專案結構

```
<project_root>/
├── PROD/config.yaml        # 正式環境設定
├── PILOT/config.yaml       # 開發/測試環境設定
├── .venv/                  # 虛擬環境
├── .env                    # 環境變數
├── requirements.txt        # 相依套件（包含 ieda_datafetcher）
├── services/               # 業務邏輯服務
│   ├── __init__.py
│   └── ieda_service.py    # iEDA Data Fetcher 服務層
├── models/                 # 資料模型
├── daos/                   # 資料存取物件
├── tests/                  # 測試檔案
│   └── ieda_test.py       # iEDA Data Fetcher 測試
├── cache/                  # 資料快取目錄
└── log/                    # 日誌檔案目錄
    └── app.log
```

## 最佳實踐

### iEDA Data Fetcher 使用時機

- **資料分析**：半導體製造資料的取得和分析
- **ETL 流程**：作為資料來源進行 ETL 處理
- **即時監控**：結合 Kafka 進行即時資料監控
- **報表生成**：為 BI 報表提供資料來源

### Protocol Buffer 使用原則

- 瞭解各 Fetcher 對應的訊息型別和篩選條件
- 適當設定篩選條件以減少不必要的資料傳輸
- 注意 repeated 欄位的使用方式（如 lots 清單）
- 善用 ieda_datafetcher 的 ParquetUtil 和 DuckDBUtil 進行資料轉換

### 效能最佳化

- 批次處理多個 LOT 而非逐一查詢
- 使用適當的篩選條件減少資料量
- 實作快取機制避免重複查詢
- 考慮使用並行處理提升效能

## 禁止事項

### 初始化順序

- **禁止**在 ConfigManager 初始化前匯入任何 wecpy 或 iEDA 模組
- **禁止**在 ConfigManager import 和初始化之間插入其他程式碼

### iEDA Data Fetcher 使用

- **禁止**忽略例外處理，必須妥善處理 gRPC 和網路相關例外
- **禁止**硬編碼 iEDA 伺服器資訊，wecpy 會自動處理連線設定
- **禁止**忘記安裝 `ieda_datafetcher` 套件就嘗試匯入相關模組

### 程式碼品質

- **禁止**使用 print()，必須使用 LogManager
- **禁止**忽略型別提示，應為函式參數和返回值加上型別註記
- **禁止**在產品環境中使用過度詳細的日誌輸出

## 參考資源

- **iEDA Data Fetcher 官方文件**：[https://ieda/docs/python/index.html](https://ieda/docs/python/index.html)
- **Getting Started 指南**：[https://ieda/docs/python/start.html](https://ieda/docs/python/start.html)
- **支援團隊**：MK23
- **wecpy 整合文件**：參考其他 wecpy 指示檔案
- **Protocol Buffers 文件**：各 Fetcher 的詳細 API 說明

## 實務範例

### iEDA Data Service 基本範例

基於官方文件和 wecpy 整合的基本實作範例：

```python
"""
iEDA Data Fetcher 服務類別
整合 wecpy 框架與 iEDA Data Fetcher 的基本解決方案
"""
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')
from wecpy.log_manager import LogManager
from wecpy.data_fetcher import FetcherFactory

# 安裝 ieda_datafetcher 後，才能 from ... import
from ieda_datafetcher.parquet_util import ParquetUtil
from ieda_datafetcher.duckdb_util import DuckDBUtil

import pandas as pd
from typing import List, Optional
from datetime import datetime

class IedaDataService:
    """iEDA Data Fetcher 統一服務介面"""

    def __init__(self):
        self.log = LogManager.get_logger()
        self.parquet_util = ParquetUtil()
        self.duckdb_util = DuckDBUtil()
        self.log.info("iEDA Data Service 初始化完成", log_key="ieda_service_init")

    def get_lqc_summary_data(self, lots: List[str]) -> pd.DataFrame:
        """取得 LQC Summary 資料"""
        try:
            from ieda_datafetcher.lqc_summary_pb2 import LqcSummaryFilter
            from ieda_datafetcher.lqc_summary_pb2_grpc import LqcSummaryFetcherStub

            client = FetcherFactory.create_client(LqcSummaryFetcherStub)

            filter_criteria = LqcSummaryFilter()
            filter_criteria.lots.extend(lots)

            response_stream = client.GetLqcSummaryList(filter_criteria)

            # 使用 ParquetUtil 寫入 Parquet 檔案
            pu = ParquetUtil()
            try:
                result = pu.write_grpc_stream_to_parquet(
                    tid="LQC_SUMMARY",
                    table_name="lqc_summary",
                    grpc_stream=response_stream
                )
                logger.info("gRPC 串流資料已成功寫入 Parquet 檔案")
            finally:
                pu.close()  # 確保資源正確釋放

            # 使用 DuckDB 讀取資料為 DataFrame
            duck_util = DuckDBUtil()
            df = duck_util.query_to_dataframe("LQC_SUMMARY", "SELECT * FROM #lqc_summary#")

            self.log.info(f"LQC Summary 資料擷取完成: {len(df)} 筆記錄",
                         log_key="ieda_lqc_summary")
            return df

        except Exception as e:
            self.log.error(f"LQC Summary 資料擷取失敗: {str(e)}",
                          log_key="ieda_lqc_summary_error")
            raise

# 使用範例
if __name__ == "__main__":
    service = IedaDataService()

    # 範例 LOT ID
    test_lots = ["61465S300D0", "61465S300D1"]

    try:
        # 取得 LQC Summary 資料
        lqc_df = service.get_lqc_summary_data(test_lots)
        print(f"LQC Summary 資料: {lqc_df.shape}")

    except Exception as e:
        print(f"執行失敗: {e}")
```

## 版本控制指引

- 在 requirements.txt 中明確指定 `ieda_datafetcher` 版本
- 記錄 iEDA Data Fetcher 相關的功能變更
- 標記與 wecpy 框架整合的版本相依性
- 注意 Protocol Buffer 定義的版本變化

## 一般最佳實務

### 程式碼組織原則

- 分離 iEDA Data Fetcher 邏輯與業務邏輯
- 使用服務層模式封裝 iEDA 操作
- 遵循 wecpy 官方範例的結構模式

### 開發工作流程

- 在 .venv 虛擬環境下開發
- 確保已安裝 `ieda_datafetcher` 套件
- wecpy 框架自動管理 iEDA 伺服器連線
- 實作適當的錯誤處理和日誌記錄

### iEDA Data Fetcher 開發規範

- 必須遵循 ConfigManager 初始化順序
- 適當使用 ieda_datafetcher 的 ParquetUtil 和 DuckDBUtil 進行資料轉換
- 妥善處理 gRPC 例外並記錄操作日誌
- 考慮效能和快取需求
- wecpy 框架會自動處理連線設定

**註**：此指示檔案基於 iEDA Data Fetcher 官方文件和 wecpy 框架整合需求編寫，具體使用時請確認專案中的套件版本相容性。
