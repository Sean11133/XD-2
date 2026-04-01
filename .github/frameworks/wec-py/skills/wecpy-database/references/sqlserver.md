# SQL Server 操作詳解

## 目錄

- [config.yaml 設定](#configyaml-設定)
  - [設定欄位說明](#設定欄位說明)
  - [環境變數](#環境變數)
- [初始化](#初始化)
- [查詢操作](#查詢操作)
  - [query_dataframe - 查詢回傳 DataFrame](#query_dataframe-查詢回傳-dataframe)
  - [query_data - 查詢回傳原始資料](#query_data-查詢回傳原始資料)
- [寫入操作](#寫入操作)
  - [execute_sql - 執行 SQL](#execute_sql-執行-sql)
  - [insert - 批次寫入 DataFrame](#insert-批次寫入-dataframe)
  - [truncate - 清空資料表](#truncate-清空資料表)
  - [delete_all - 刪除所有記錄](#delete_all-刪除所有記錄)
- [SQL Server 特有語法](#sql-server-特有語法)
  - [TOP 子句（限制筆數）](#top-子句限制筆數)
  - [分頁查詢（OFFSET FETCH）](#分頁查詢offset-fetch)
  - [日期函數](#日期函數)
  - [字串函數](#字串函數)
- [完整 ETL 範例](#完整-etl-範例)
- [最佳實務](#最佳實務)
  - [1. 使用適當的 schema](#1-使用適當的-schema)
  - [2. 處理 NULL 值](#2-處理-null-值)
  - [3. 交易處理](#3-交易處理)
- [常見問題](#常見問題)
  - [Q1：連線失敗](#q1連線失敗)
  - [Q2：登入失敗](#q2登入失敗)
  - [Q3：資料表不存在](#q3資料表不存在)

本文件詳細說明 wecpy 框架中 SQLServerManager 的使用方式。

## config.yaml 設定

```yaml
Database:
  report:
    type: sqlserver
    host: 10.18.20.197
    port: 1435
    username: "{IMX_ID}"
    password: "{IMX_PWD}"
    service: iMX_Report
```

### 設定欄位說明

| 欄位 | 說明 | 必要 |
|-----|------|-----|
| type | 資料庫類型，固定為 `sqlserver` | ✅ |
| host | SQL Server 主機位址 | ✅ |
| port | 連接埠（SQL Server 預設 1433） | ✅ |
| username | 使用者名稱（建議用環境變數） | ✅ |
| password | 密碼（建議用環境變數） | ✅ |
| service | 資料庫名稱 | ✅ |

### 環境變數

```bash
# .env
IMX_ID=your_sqlserver_username
IMX_PWD=your_sqlserver_password
```

## 初始化

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.database_manager.sqlserver_manager import SQLServerManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

# 使用 config.yaml 中定義的連線名稱
sqlserver = SQLServerManager("report")
```

## 查詢操作

### query_dataframe - 查詢回傳 DataFrame

```python
# 簡單查詢（注意 SQL Server 使用 dbo schema）
df = sqlserver.query_dataframe("SELECT * FROM dbo.DEPARTMENT_SALARY")

# 帶參數查詢
df = sqlserver.query_dataframe(
    "SELECT * FROM dbo.DEPARTMENT_SALARY WHERE year = :year",
    params={"year": 2024}  # 注意：SQL Server 通常用整數
)

# 複雜查詢
df = sqlserver.query_dataframe("""
    SELECT 
        DEPARTMENT_ID,
        YEAR,
        SUM(SALARY) AS TOTAL_SALARY,
        COUNT(*) AS EMPLOYEE_COUNT
    FROM dbo.EMPLOYEE_SALARY
    WHERE YEAR = :year
    GROUP BY DEPARTMENT_ID, YEAR
    ORDER BY TOTAL_SALARY DESC
""", params={"year": 2024})

print(f"共 {len(df)} 筆資料")
print(df.head())
```

### query_data - 查詢回傳原始資料

```python
# 回傳 List[Dict]
data = sqlserver.query_data(
    "SELECT TOP 100 * FROM dbo.DEPARTMENT_SALARY WHERE year = :year",
    params={"year": 2024}
)

# 處理結果
for row in data:
    print(f"部門: {row['DEPARTMENT_ID']}, 薪資: {row['SALARY']}")
```

## 寫入操作

### execute_sql - 執行 SQL

```python
# INSERT
sqlserver.execute_sql(
    "INSERT INTO dbo.DEPARTMENT_SALARY (DEPARTMENT_ID, YEAR, SALARY) VALUES (:dept_id, :year, :salary)",
    params={"dept_id": "10", "year": 2025, "salary": 50000.0}
)

# UPDATE
sqlserver.execute_sql(
    "UPDATE dbo.DEPARTMENT_SALARY SET SALARY = :salary WHERE DEPARTMENT_ID = :dept_id",
    params={"salary": 55000.0, "dept_id": "10"}
)

# DELETE
sqlserver.execute_sql(
    "DELETE FROM dbo.DEPARTMENT_SALARY WHERE DEPARTMENT_ID = :dept_id",
    params={"dept_id": "10"}
)
```

### insert - 批次寫入 DataFrame

需要先定義 SQLAlchemy Model：

```python
# models/department_salary.py
from sqlalchemy import Column, Date, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class DepartmentSalary(Base):
    __tablename__ = 'DEPARTMENT_SALARY'
    __table_args__ = {'schema': 'dbo'}  # 指定 schema
    
    DEPARTMENT_ID = Column('DEPARTMENT_ID', String, primary_key=True)
    YEAR = Column('YEAR', Integer, primary_key=True)
    SALARY = Column('SALARY', Float)
    CREATE_USER = Column('CREATE_USER', String)
    CREATE_TIME = Column('CREATE_TIME', Date)
    UPDATE_USER = Column('UPDATE_USER', String)
    UPDATE_TIME = Column('UPDATE_TIME', Date)
```

使用 insert：

```python
from models.department_salary import DepartmentSalary
import pandas as pd
from datetime import datetime

# 準備資料
data = pd.DataFrame([
    {"DEPARTMENT_ID": "10", "YEAR": 2025, "SALARY": 50000.0,
     "CREATE_USER": "system", "CREATE_TIME": datetime.now(),
     "UPDATE_USER": "system", "UPDATE_TIME": datetime.now()},
    {"DEPARTMENT_ID": "20", "YEAR": 2025, "SALARY": 60000.0,
     "CREATE_USER": "system", "CREATE_TIME": datetime.now(),
     "UPDATE_USER": "system", "UPDATE_TIME": datetime.now()},
])

# 批次寫入
sqlserver.insert(data, DepartmentSalary)
log.info(f"成功寫入 {len(data)} 筆資料")
```

### truncate - 清空資料表

```python
from models.department_salary import DepartmentSalary

# 清空資料表
sqlserver.truncate(DepartmentSalary)
log.info("資料表已清空")
```

### delete_all - 刪除所有記錄

使用 SQLAlchemy session 執行 DELETE 語句刪除資料表中的所有記錄。

與 `truncate()` 的差異：
- `delete_all()`：使用 DELETE 語句，可在交易中回滾（rollback）
- `truncate()`：使用 TRUNCATE 語句，速度較快但無法回滾

```python
from models.department_salary import DepartmentSalary

# 刪除所有記錄（可回滾）
sqlserver.delete_all(DepartmentSalary)
log.info("已刪除所有記錄")
```

## SQL Server 特有語法

### TOP 子句（限制筆數）

```python
# SQL Server 使用 TOP 而非 LIMIT
df = sqlserver.query_dataframe("""
    SELECT TOP 100 * 
    FROM dbo.DEPARTMENT_SALARY 
    ORDER BY SALARY DESC
""")
```

### 分頁查詢（OFFSET FETCH）

```python
# SQL Server 2012+ 支援 OFFSET FETCH
page = 1
page_size = 50

df = sqlserver.query_dataframe(f"""
    SELECT * 
    FROM dbo.DEPARTMENT_SALARY 
    ORDER BY DEPARTMENT_ID
    OFFSET {(page - 1) * page_size} ROWS
    FETCH NEXT {page_size} ROWS ONLY
""")
```

### 日期函數

```python
df = sqlserver.query_dataframe("""
    SELECT 
        DEPARTMENT_ID,
        SALARY,
        CREATE_TIME,
        DATEDIFF(day, CREATE_TIME, GETDATE()) AS DAYS_AGO
    FROM dbo.DEPARTMENT_SALARY
    WHERE CREATE_TIME >= DATEADD(month, -3, GETDATE())
""")
```

### 字串函數

```python
df = sqlserver.query_dataframe("""
    SELECT 
        DEPARTMENT_ID,
        LEN(DEPARTMENT_ID) AS ID_LENGTH,
        UPPER(DEPARTMENT_NAME) AS UPPER_NAME,
        CONCAT(DEPARTMENT_ID, '-', DEPARTMENT_NAME) AS FULL_NAME
    FROM dbo.DEPARTMENTS
""")
```

## 完整 ETL 範例

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.database_manager.sqlserver_manager import SQLServerManager
from wecpy.database_manager.trino_manager import TrinoManager
from wecpy.log_manager import LogManager
from models.department_salary import DepartmentSalary
from datetime import datetime
from decimal import Decimal
import getpass

log = LogManager.get_logger()

def etl_to_sqlserver(year: str):
    """
    ETL 流程：Trino → SQL Server
    
    Args:
        year: 資料年份
    """
    log.info(f"開始 ETL，年份: {year}", "etl_start")
    
    # =========================================================================
    # Extract：從 Trino 讀取
    # =========================================================================
    trino = TrinoManager("edwml2")
    df = trino.query_dataframe(f"""
        SELECT 
            YEAR, 
            DEPARTMENT_ID, 
            CEIL(avg(SALARY)) AS SALARY
        FROM ccai.aicsuser.employees_v 
        WHERE DEPARTMENT_ID IS NOT NULL AND YEAR = '{year}'
        GROUP BY YEAR, DEPARTMENT_ID 
        ORDER BY DEPARTMENT_ID
    """)
    log.info(f"Extract 完成，共 {len(df)} 筆", "extract_complete")
    
    # =========================================================================
    # Transform：資料轉換
    # =========================================================================
    now = datetime.now()
    username = getpass.getuser()
    
    df['YEAR'] = (df['YEAR'].astype(int) + 1)
    df['SALARY'] = df['SALARY'] * Decimal('1.06')
    df['CREATE_USER'] = username
    df['CREATE_TIME'] = now
    df['UPDATE_USER'] = username
    df['UPDATE_TIME'] = now
    
    log.info("Transform 完成", "transform_complete")
    
    # =========================================================================
    # Load：寫入 SQL Server
    # =========================================================================
    sqlserver = SQLServerManager("report")
    sqlserver.truncate(DepartmentSalary)
    sqlserver.insert(df, DepartmentSalary)
    
    log.info(f"Load 完成，共寫入 {len(df)} 筆", "load_complete")
    
    # =========================================================================
    # 驗證
    # =========================================================================
    result = sqlserver.query_dataframe("SELECT * FROM dbo.DEPARTMENT_SALARY")
    log.info(f"驗證完成，共 {len(result)} 筆", "verify_complete")

if __name__ == "__main__":
    etl_to_sqlserver("2024")
```

## 最佳實務

### 1. 使用適當的 schema
```python
# SQL Server 預設 schema 是 dbo
df = sqlserver.query_dataframe("SELECT * FROM dbo.MY_TABLE")
```

### 2. 處理 NULL 值
```python
df = sqlserver.query_dataframe("""
    SELECT 
        DEPARTMENT_ID,
        ISNULL(SALARY, 0) AS SALARY,
        COALESCE(MANAGER_ID, 'N/A') AS MANAGER_ID
    FROM dbo.DEPARTMENTS
""")
```

### 3. 交易處理
```python
try:
    sqlserver.execute_sql("DELETE FROM dbo.OLD_DATA WHERE year < :year", 
                          params={"year": 2020})
    sqlserver.insert(new_data, Model)
    log.info("交易完成")
except Exception as e:
    log.error(f"交易失敗: {e}", "transaction_error")
    raise
```

## 常見問題

### Q1：連線失敗
```
原因：無法連線到 SQL Server
解決：
1. 確認 host 和 port 正確
2. 確認 SQL Server 允許遠端連線
3. 確認防火牆設定
4. 確認 SQL Server Browser 服務已啟動
```

### Q2：登入失敗
```
原因：認證失敗
解決：
1. 確認使用者名稱和密碼正確
2. 確認 SQL Server 啟用混合模式驗證
3. 確認帳號有存取該資料庫的權限
```

### Q3：資料表不存在
```
原因：資料表名稱或 schema 不正確
解決：
1. 使用完整的 schema.table 格式（如 dbo.MY_TABLE）
2. 確認資料表存在且有權限
3. 檢查大小寫（SQL Server 預設不區分大小寫）
```
