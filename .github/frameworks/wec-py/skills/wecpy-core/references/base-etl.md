# BaseETL 詳細說明


## 目錄

- [匯入路徑](#匯入路徑)
- [基本概念](#基本概念)
- [類別定義](#類別定義)
- [快速開始](#快速開始)
  - [最簡實作](#最簡實作)
- [完整範例：從 Trino 擷取，載入 Oracle](#完整範例從-trino-擷取載入-oracle)
  - [對應的 config.yaml](#對應的-configyaml)
- [進階用法](#進階用法)
  - [自訂 run() 行為](#自訂-run-行為)
  - [帶有錯誤處理的 ETL](#帶有錯誤處理的-etl)
  - [批次載入](#批次載入)
- [最佳實務](#最佳實務)
  - [1. 每個 ETL 職責單一](#1-每個-etl-職責單一)
  - [2. 在 transform 中處理資料清理](#2-在-transform-中處理資料清理)
  - [3. 日誌記錄各階段](#3-日誌記錄各階段)
- [常見問題](#常見問題)
  - [Q1：必須實作所有四個方法嗎？](#q1必須實作所有四個方法嗎)
  - [Q2：extract 必須回傳 list 嗎？](#q2extract-必須回傳-list-嗎)
  - [Q3：ETL 執行失敗如何回滾？](#q3etl-執行失敗如何回滾)

BaseETL 是 wecpy 框架提供的 ETL（Extract-Transform-Load）基礎抽象類別，定義了標準的 ETL 流程介面。開發者可繼承此類別，實作各階段的具體邏輯。

## 匯入路徑

```python
from wecpy.shared.base_etl import BaseETL
```

## 基本概念

BaseETL 定義了四個抽象方法，對應 ETL 流程的四個階段：

| 方法 | 階段 | 說明 |
|-----|------|------|
| `purge()` | 清除 | 清除目標資料（在載入前執行） |
| `extract()` | 擷取 | 從來源擷取資料，回傳 list |
| `transform()` | 轉換 | 轉換資料格式，回傳 list |
| `load()` | 載入 | 載入資料到目標 |

執行順序由 `run()` 方法控制：`purge → extract → transform → load`

## 類別定義

```python
from abc import ABC, abstractmethod

class BaseETL(ABC):
    @abstractmethod
    def purge(self):
        """清除目標資料（在載入前執行）"""
    
    @abstractmethod
    def extract(self) -> list:
        """從來源擷取資料"""
    
    @abstractmethod
    def transform(self, models: list) -> list:
        """轉換資料格式"""
    
    @abstractmethod
    def load(self, models: list):
        """載入資料到目標"""
    
    def run(self):
        """執行完整 ETL 流程：purge → extract → transform → load"""
        self.purge()
        extract_data = self.extract()
        transform_data = self.transform(extract_data)
        self.load(transform_data)
```

## 快速開始

### 最簡實作

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.shared.base_etl import BaseETL
from wecpy.log_manager import LogManager

log = LogManager.get_logger()


class SimpleETL(BaseETL):
    def purge(self):
        log.info("清除目標資料")
    
    def extract(self) -> list:
        log.info("擷取來源資料")
        return [{"id": 1, "name": "A"}, {"id": 2, "name": "B"}]
    
    def transform(self, models: list) -> list:
        log.info(f"轉換資料，共 {len(models)} 筆")
        return [{"id": m["id"], "name": m["name"].upper()} for m in models]
    
    def load(self, models: list):
        log.info(f"載入資料，共 {len(models)} 筆")
        for m in models:
            log.debug(f"載入: {m}")


# 執行
etl = SimpleETL()
etl.run()
```

## 完整範例：從 Trino 擷取，載入 Oracle

以下範例示範從 Trino 資料倉儲擷取資料，經轉換後載入 Oracle 資料庫：

```python
# main.py
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.log_manager import LogManager
from src.services.lot_etl_service import LotETLService

log = LogManager.get_logger()


def main():
    try:
        log.info("開始執行 Lot ETL")
        etl = LotETLService()
        etl.run()
        log.info("Lot ETL 執行完成")
    except Exception as e:
        log.error(f"Lot ETL 執行失敗: {e}", "etl_error")


if __name__ == "__main__":
    main()
```

```python
# src/services/lot_etl_service.py
from wecpy.shared.base_etl import BaseETL
from wecpy.database_manager.oracle_manager import OracleManager
from wecpy.database_manager.trino_manager import TrinoManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()


class LotETLService(BaseETL):
    """從 Trino 擷取批號資料，轉換後載入 Oracle"""

    def __init__(self):
        self.trino = TrinoManager("edwml2")
        self.oracle = OracleManager("TRAINDB")

    def purge(self):
        """清除 Oracle 目標表的舊資料"""
        log.info("清除目標表 LOT_SUMMARY 舊資料")
        self.oracle.execute_sql(
            "DELETE FROM LOT_SUMMARY WHERE DATA_DATE = TRUNC(SYSDATE)"
        )

    def extract(self) -> list:
        """從 Trino 擷取批號資料"""
        log.info("從 Trino 擷取批號資料")
        sql = """
            SELECT lot_id, product_id, stage, qty, update_time
            FROM edw.lot_history
            WHERE update_date = CURRENT_DATE
        """
        df = self.trino.query_dataframe(sql)
        log.info(f"擷取完成，共 {len(df)} 筆")
        return df.to_dict('records')

    def transform(self, models: list) -> list:
        """轉換資料格式"""
        log.info(f"開始轉換資料，共 {len(models)} 筆")
        transformed = []
        for row in models:
            transformed.append({
                "LOT_ID": row["lot_id"],
                "PRODUCT": row["product_id"],
                "STAGE": row["stage"],
                "QTY": int(row["qty"]),
                "DATA_DATE": row["update_time"],
            })
        log.info(f"轉換完成，共 {len(transformed)} 筆")
        return transformed

    def load(self, models: list):
        """載入資料到 Oracle"""
        if not models:
            log.warning("無資料需要載入")
            return
        
        log.info(f"開始載入資料到 Oracle，共 {len(models)} 筆")
        insert_sql = """
            INSERT INTO LOT_SUMMARY (LOT_ID, PRODUCT, STAGE, QTY, DATA_DATE)
            VALUES (:LOT_ID, :PRODUCT, :STAGE, :QTY, :DATA_DATE)
        """
        self.oracle.execute_sql(insert_sql, models)
        log.info(f"載入完成，共 {len(models)} 筆")
```

### 對應的 config.yaml

```yaml
General:
  system: "{IMX_SYSTEM}"
  app: "{IMX_APP}"
  app_type: Schedule
  section: MK10

Log:
  version: 1
  formatters:
    format1:
      format: "[%(asctime)s.%(msecs)03d] {%(system)s %(app)s %(filename)s: %(funcName)s:%(lineno)d} %(levelname)s %(tid)s - %(message)s"
      datefmt: '%Y-%m-%d %H:%M:%S'
  handlers:
    console:
      class: logging.StreamHandler
      formatter: format1
      stream: ext://sys.stdout
    file:
      class: logging.handlers.RotatingFileHandler
      formatter: format1
      filename: log/app.log
      maxBytes: 10000000
      backupCount: 5
  root:
    handlers: [console, file]
    level: INFO

Database:
  TRAINDB:
    type: oracle
    host: 10.18.20.35
    port: 1531
    username: "{IMX_TRAINDB_ID}"
    password: "{IMX_TRAINDB_PWD}"
    service: TRAINDB

  edwml2:
    type: trino
    host: edwml2
    port: 18081
    catalog: udpdb
    username: "{IMX_EDWML2_ID}"
    password: "{IMX_EDWML2_PWD}"
```

## 進階用法

### 自訂 run() 行為

若預設的 `purge → extract → transform → load` 流程不符需求，可以覆寫 `run()` 方法：

```python
class CustomETL(BaseETL):
    def run(self):
        """自訂流程：先擷取和轉換，有資料才清除和載入"""
        extract_data = self.extract()
        if not extract_data:
            log.info("無新資料，跳過 ETL")
            return
        
        transform_data = self.transform(extract_data)
        self.purge()
        self.load(transform_data)
        log.info(f"ETL 完成，共處理 {len(transform_data)} 筆")
    
    # ... 實作 purge, extract, transform, load
```

### 帶有錯誤處理的 ETL

```python
class RobustETL(BaseETL):
    def run(self):
        """含錯誤處理的 ETL 流程"""
        try:
            self.purge()
        except Exception as e:
            log.error(f"Purge 階段失敗: {e}", "etl_purge_error")
            raise
        
        try:
            extract_data = self.extract()
        except Exception as e:
            log.error(f"Extract 階段失敗: {e}", "etl_extract_error")
            raise
        
        try:
            transform_data = self.transform(extract_data)
        except Exception as e:
            log.error(f"Transform 階段失敗: {e}", "etl_transform_error")
            raise
        
        try:
            self.load(transform_data)
        except Exception as e:
            log.error(f"Load 階段失敗: {e}", "etl_load_error")
            raise
        
        log.info("ETL 流程全部完成", "etl_complete")
    
    # ... 實作 purge, extract, transform, load
```

### 批次載入

```python
class BatchETL(BaseETL):
    BATCH_SIZE = 1000

    def load(self, models: list):
        """分批載入資料"""
        total = len(models)
        for i in range(0, total, self.BATCH_SIZE):
            batch = models[i:i + self.BATCH_SIZE]
            self.oracle.execute_sql(self.insert_sql, batch)
            log.info(f"已載入 {min(i + self.BATCH_SIZE, total)}/{total} 筆")
    
    # ... 實作 purge, extract, transform
```

## 最佳實務

### 1. 每個 ETL 職責單一

```python
# ❌ 避免：一個 ETL 處理太多事情
class DoEverythingETL(BaseETL):
    def extract(self):
        # 同時從 3 個資料來源擷取 5 種資料...
        pass

# ✅ 正確：拆分為多個 ETL
class LotETL(BaseETL):
    """處理批號資料"""
    pass

class EquipmentETL(BaseETL):
    """處理設備資料"""
    pass
```

### 2. 在 transform 中處理資料清理

```python
def transform(self, models: list) -> list:
    """轉換並清理資料"""
    transformed = []
    for row in models:
        # 跳過無效資料
        if not row.get("lot_id"):
            log.warning(f"跳過無效資料: {row}")
            continue
        
        transformed.append({
            "LOT_ID": row["lot_id"].strip(),
            "QTY": int(row.get("qty", 0)),
        })
    
    log.info(f"轉換完成: 原始 {len(models)} 筆 → 有效 {len(transformed)} 筆")
    return transformed
```

### 3. 日誌記錄各階段

```python
# ✅ 正確：每個階段都記錄開始和結束
def extract(self) -> list:
    log.info("Extract 階段開始", "etl_extract_start")
    data = self.trino.query_dataframe(sql)
    log.info(f"Extract 階段完成，共 {len(data)} 筆", "etl_extract_complete")
    return data.to_dict('records')
```

## 常見問題

### Q1：必須實作所有四個方法嗎？

```
是的。BaseETL 的四個方法都是 @abstractmethod，必須全部實作。
若某階段不需要處理，可以實作為空方法：

def purge(self):
    pass  # 此 ETL 不需要清除目標資料
```

### Q2：extract 必須回傳 list 嗎？

```
建議回傳 list 以保持與 transform/load 的介面一致。
若使用 DataFrame，可在 extract 末尾轉換：
return df.to_dict('records')
```

### Q3：ETL 執行失敗如何回滾？

```
BaseETL 本身不提供交易管理。
建議：
1. 在 purge 中使用資料庫交易
2. 在 load 中使用批次交易
3. 或覆寫 run() 方法加入整體交易管理
```
