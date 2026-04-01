---
name: wecpy-database
description: >
  Invoke for ANY wecpy database operation (Oracle, Trino, SQL Server).
  Covers: OracleManager, TrinoManager (batch_size insert), SQLServerManager.
  Methods: query_dataframe, query_data, execute_sql, insert (DataFrame→DB), truncate, delete_all.
  SQLAlchemy Model definition, parameterized queries (:param), ETL pipelines.
  Keywords: 資料庫、DB、Oracle、Trino、SQL Server、query_dataframe、execute_sql、insert、
  TRAINDB、EDWML2、UDB、連資料庫、查資料、寫資料、ETL、DataFrame、SQLAlchemy Model。
  Excludes gRPC FDC/EDA→wecpy-datafetcher/wecpy-fdc, Kafka→wecpy-kafka.
---

# wecpy 資料庫操作技能

本技能提供 wecpy 框架的資料庫操作指南，支援 Oracle、Trino、SQL Server 三種資料庫。

> **前置條件**：請先閱讀 `wecpy-core` 技能了解 ConfigManager 初始化規範。

## 支援的資料庫管理器

| Manager | 資料庫類型 | 主要用途 |
|---------|-----------|---------|
| `OracleManager` | Oracle | 企業級交易資料庫 |
| `TrinoManager` | Trino | 大數據查詢引擎（原 Presto） |
| `SQLServerManager` | SQL Server | 報表資料庫 |

## 快速開始

### 1. config.yaml 設定

```yaml
Database:
  # Oracle
  TRAINDB:
    type: oracle
    host: 10.18.20.35
    port: 1531
    username: "{IMX_TRAINDB_ID}"
    password: "{IMX_TRAINDB_PWD}"
    service: TRAINDB

  # Trino
  edwml2:
    type: trino
    host: edwml2
    port: 18081
    catalog: udpdb
    username: "{IMX_EDWML2_ID}"
    password: "{IMX_EDWML2_PWD}"

  # SQL Server
  report:
    type: sqlserver
    host: 10.18.20.197
    port: 1435
    username: "{IMX_ID}"
    password: "{IMX_PWD}"
    service: iMX_Report
```

### 2. 基本查詢

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.database_manager.oracle_manager import OracleManager
from wecpy.database_manager.trino_manager import TrinoManager
from wecpy.database_manager.sqlserver_manager import SQLServerManager

# Oracle 查詢
oracle = OracleManager("TRAINDB")
df = oracle.query_dataframe("SELECT * FROM DEPARTMENT_SALARY WHERE year = :year", 
                            params={"year": "2024"})

# Trino 查詢
trino = TrinoManager("edwml2")
df = trino.query_dataframe("SELECT * FROM ccai.aicsuser.employees_v WHERE year = :year",
                           params={"year": "2024"})

# SQL Server 查詢
sqlserver = SQLServerManager("report")
df = sqlserver.query_dataframe("SELECT * FROM dbo.DEPARTMENT_SALARY WHERE year = :year",
                               params={"year": 2024})
```

## 共用方法

所有 Manager 都支援以下方法：

| 方法 | 說明 | 回傳類型 |
|-----|------|---------|
| `query_dataframe(sql, params)` | 查詢並回傳 DataFrame | pandas.DataFrame |
| `query_data(sql, params)` | 查詢並回傳原始資料 | List[Dict] |
| `execute_sql(sql, params)` | 執行 SQL（INSERT/UPDATE/DELETE） | None |
| `insert(dataframe, model, batch_size=500)` | 批次寫入 DataFrame（TrinoManager 支援 batch_size 參數，預設 500） | None |
| `truncate(model)` | 清空資料表（TRUNCATE，不可回滾） | None |
| `delete_all(model)` | 刪除所有記錄（DELETE，可回滾） | None |

## 參數化查詢（重要！）

**必須**使用參數化查詢，禁止字串拼接：

```python
# ✅ 正確：使用參數化查詢
df = oracle.query_dataframe(
    "SELECT * FROM EMPLOYEES WHERE department_id = :dept_id AND year = :year",
    params={"dept_id": 10, "year": "2024"}
)

# ❌ 錯誤：字串拼接（有 SQL Injection 風險）
df = oracle.query_dataframe(
    f"SELECT * FROM EMPLOYEES WHERE department_id = {dept_id}"
)
```

## SQLAlchemy Model 定義

使用 SQLAlchemy 定義資料模型，用於 `insert()`、`truncate()` 和 `delete_all()` 操作：

```python
# models/department_salary.py
from sqlalchemy import Column, Date, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class DepartmentSalary(Base):
    __tablename__ = 'DEPARTMENT_SALARY'

    DEPARTMENT_ID = Column('DEPARTMENT_ID', String, primary_key=True)
    YEAR = Column('YEAR', Integer, primary_key=True)
    SALARY = Column('SALARY', Float)
    CREATE_USER = Column('CREATE_USER', String)
    CREATE_TIME = Column('CREATE_TIME', Date)
    UPDATE_USER = Column('UPDATE_USER', String)
    UPDATE_TIME = Column('UPDATE_TIME', Date)
```

## ETL 範例

完整的 ETL 流程：從 Trino 讀取 → 轉換 → 寫入 Oracle：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.database_manager.trino_manager import TrinoManager
from wecpy.database_manager.oracle_manager import OracleManager
from wecpy.log_manager import LogManager
from models.department_salary import DepartmentSalary
from datetime import datetime
from decimal import Decimal
import getpass

log = LogManager.get_logger()

def main(year: str):
    log.info(f"開始 ETL 處理，年份: {year}")
    
    # 安全驗證：確保 year 為合法格式
    if not year.isdigit() or len(year) != 4:
        raise ValueError(f"無效的年份格式: {year}")
    
    # Extract：從 Trino 讀取
    # 注意：Trino 的參數化查詢語法與 Oracle 不同，此處簡化示範
    # 正式環境務必驗證外部輸入
    trino = TrinoManager("edwml2")
    df = trino.query_dataframe(f"""
        SELECT YEAR, DEPARTMENT_ID, CEIL(avg(SALARY)) AS SALARY
        FROM ccai.aicsuser.employees_v 
        WHERE DEPARTMENT_ID IS NOT NULL AND YEAR = '{year}'
        GROUP BY YEAR, DEPARTMENT_ID 
        ORDER BY DEPARTMENT_ID
    """)
    log.info(f"Extract 完成，共 {len(df)} 筆")
    
    # Transform：資料轉換
    now = datetime.now()
    username = getpass.getuser()
    df['YEAR'] = (df['YEAR'].astype(int) + 1).astype(str)
    df['SALARY'] = df['SALARY'] * Decimal('1.06')
    df['CREATE_USER'] = username
    df['CREATE_TIME'] = now
    df['UPDATE_USER'] = username
    df['UPDATE_TIME'] = now
    log.info("Transform 完成")
    
    # Load：寫入 Oracle
    oracle = OracleManager("TRAINDB")
    oracle.truncate(DepartmentSalary)
    oracle.insert(df, DepartmentSalary)
    log.info("Load 完成")
    
    # 驗證
    result = oracle.query_dataframe("SELECT * FROM DEPARTMENT_SALARY")
    log.info(f"驗證：共 {len(result)} 筆資料")

if __name__ == "__main__":
    main("2024")
```

## 詳細參考文件

- [Oracle 操作詳解](references/oracle.md) — 當使用者需要 Oracle 進階操作（batch insert、transaction、connection pool、特殊資料型別）時閱讀
- [Trino 操作詳解](references/trino.md) — 當使用者需要 Trino 特定語法、catalog/schema 設定、大數據查詢效能調優時閱讀
- [SQL Server 操作詳解](references/sqlserver.md) — 當使用者需要 SQL Server 連線設定、stored procedure、特殊資料型別時閱讀
- [Model 定義範例](references/model-patterns.md) — 當使用者需要定義 SQLAlchemy Model、處理複合主鍵、欄位映射、多表關聯時閱讀

## 資源檔案

- [資料庫 config.yaml 模板](assets/database-config.yaml)

## 常見問題

### Q1：連線失敗
```
檢查項目：
1. config.yaml 中的 host/port 是否正確
2. 環境變數 {IMX_XXX_ID}/{IMX_XXX_PWD} 是否設定
3. 網路是否可連通該資料庫
```

### Q2：query_dataframe 回傳空的 DataFrame
```
檢查項目：
1. SQL 語法是否正確
2. 參數值是否正確
3. 資料表是否有符合條件的資料
```

### Q3：insert 時欄位不符
```
檢查項目：
1. DataFrame 欄位名稱是否與 Model 定義一致（大小寫敏感）
2. 資料類型是否相容
3. 是否有 NOT NULL 欄位沒有提供值
```
