# Oracle 操作詳解

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
- [完整 ETL 範例](#完整-etl-範例)
- [最佳實務](#最佳實務)
  - [1. 使用參數化查詢](#1-使用參數化查詢)
  - [2. 適當的錯誤處理](#2-適當的錯誤處理)
  - [3. 大量資料處理](#3-大量資料處理)
- [常見問題](#常見問題)
  - [Q1：ORA-12170: TNS:連線逾時](#q1ora-12170-tns連線逾時)
  - [Q2：ORA-01017: 無效的使用者名稱/密碼](#q2ora-01017-無效的使用者名稱密碼)
  - [Q3：ORA-00942: 資料表或視圖不存在](#q3ora-00942-資料表或視圖不存在)

本文件詳細說明 wecpy 框架中 OracleManager 的使用方式。

## config.yaml 設定

```yaml
Database:
  TRAINDB:
    type: oracle
    host: 10.18.20.35
    port: 1531
    username: "{IMX_TRAINDB_ID}"
    password: "{IMX_TRAINDB_PWD}"
    service: TRAINDB
```

### 設定欄位說明

| 欄位 | 說明 | 必要 |
|-----|------|-----|
| type | 資料庫類型，固定為 `oracle` | ✅ |
| host | 資料庫主機位址 | ✅ |
| port | 連接埠（Oracle 預設 1521） | ✅ |
| username | 使用者名稱（建議用環境變數） | ✅ |
| password | 密碼（建議用環境變數） | ✅ |
| service | Oracle Service Name | ✅ |

### 環境變數

```bash
# .env
IMX_TRAINDB_ID=your_oracle_username
IMX_TRAINDB_PWD=your_oracle_password
```

## 初始化

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.database_manager.oracle_manager import OracleManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

# 使用 config.yaml 中定義的連線名稱
oracle = OracleManager("TRAINDB")
```

## 查詢操作

### query_dataframe - 查詢回傳 DataFrame

```python
# 簡單查詢
df = oracle.query_dataframe("SELECT * FROM DEPARTMENT_SALARY")

# 帶參數查詢（推薦）
df = oracle.query_dataframe(
    "SELECT * FROM DEPARTMENT_SALARY WHERE year = :year AND department_id = :dept_id",
    params={"year": "2024", "dept_id": 10}
)

# 處理結果
print(f"共 {len(df)} 筆資料")
print(df.head())
```

### query_data - 查詢回傳原始資料

```python
# 回傳 List[Dict]
data = oracle.query_data(
    "SELECT * FROM DEPARTMENT_SALARY WHERE year = :year",
    params={"year": "2024"}
)

# 處理結果
for row in data:
    print(f"部門: {row['DEPARTMENT_ID']}, 薪資: {row['SALARY']}")
```

## 寫入操作

### execute_sql - 執行 SQL

```python
# INSERT
oracle.execute_sql(
    "INSERT INTO DEPARTMENT_SALARY (DEPARTMENT_ID, YEAR, SALARY) VALUES (:dept_id, :year, :salary)",
    params={"dept_id": 10, "year": "2025", "salary": 50000}
)

# UPDATE
oracle.execute_sql(
    "UPDATE DEPARTMENT_SALARY SET SALARY = :salary WHERE DEPARTMENT_ID = :dept_id",
    params={"salary": 55000, "dept_id": 10}
)

# DELETE
oracle.execute_sql(
    "DELETE FROM DEPARTMENT_SALARY WHERE DEPARTMENT_ID = :dept_id",
    params={"dept_id": 10}
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
oracle.insert(data, DepartmentSalary)
log.info(f"成功寫入 {len(data)} 筆資料")
```

### truncate - 清空資料表

```python
from models.department_salary import DepartmentSalary

# 清空資料表
oracle.truncate(DepartmentSalary)
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
oracle.delete_all(DepartmentSalary)
log.info("已刪除所有記錄")
```

## 完整 ETL 範例

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.database_manager.oracle_manager import OracleManager
from wecpy.database_manager.trino_manager import TrinoManager
from wecpy.log_manager import LogManager
from models.department_salary import DepartmentSalary
from datetime import datetime
from decimal import Decimal
import getpass

log = LogManager.get_logger()

def etl_department_salary(year: str):
    """
    部門薪資 ETL 流程
    
    Args:
        year: 資料年份
    """
    log.info(f"開始 ETL，年份: {year}", "etl_start")
    
    # =========================================================================
    # Extract：從 Trino 讀取來源資料
    # =========================================================================
    # 注意：以下範例為簡化示範，正式環境建議使用參數化查詢防止 SQL Injection
    # 若 year 來自外部輸入，務必先進行驗證（例如：確認為 4 位數字）
    trino = TrinoManager("edwml2")
    
    # 驗證 year 格式（安全措施）
    if not year.isdigit() or len(year) != 4:
        raise ValueError(f"無效的年份格式: {year}")
    
    source_df = trino.query_dataframe(f"""
        SELECT 
            YEAR, 
            DEPARTMENT_ID, 
            CEIL(avg(SALARY)) AS SALARY
        FROM ccai.aicsuser.employees_v 
        WHERE DEPARTMENT_ID IS NOT NULL 
          AND YEAR = '{year}'
        GROUP BY YEAR, DEPARTMENT_ID 
        ORDER BY DEPARTMENT_ID
    """)
    log.info(f"Extract 完成，共 {len(source_df)} 筆", "extract_complete")
    
    # =========================================================================
    # Transform：資料轉換
    # =========================================================================
    now = datetime.now()
    username = getpass.getuser()
    
    target_df = source_df.copy()
    target_df['YEAR'] = (target_df['YEAR'].astype(int) + 1).astype(str)
    target_df['SALARY'] = target_df['SALARY'] * Decimal('1.06')  # 加薪 6%
    target_df['CREATE_USER'] = username
    target_df['CREATE_TIME'] = now
    target_df['UPDATE_USER'] = username
    target_df['UPDATE_TIME'] = now
    
    log.info("Transform 完成", "transform_complete")
    
    # =========================================================================
    # Load：寫入 Oracle
    # =========================================================================
    oracle = OracleManager("TRAINDB")
    
    # 清空目標資料表
    oracle.truncate(DepartmentSalary)
    log.info("目標資料表已清空")
    
    # 批次寫入
    oracle.insert(target_df, DepartmentSalary)
    log.info(f"Load 完成，共寫入 {len(target_df)} 筆", "load_complete")
    
    # =========================================================================
    # 驗證
    # =========================================================================
    verify_df = oracle.query_dataframe("SELECT * FROM DEPARTMENT_SALARY")
    log.info(f"驗證完成，共 {len(verify_df)} 筆", "verify_complete")
    
    return verify_df

if __name__ == "__main__":
    etl_department_salary("2024")
```

## 最佳實務

### 1. 使用參數化查詢
```python
# ✅ 正確
df = oracle.query_dataframe(
    "SELECT * FROM table WHERE id = :id",
    params={"id": user_input}
)

# ❌ 錯誤（SQL Injection 風險）
df = oracle.query_dataframe(f"SELECT * FROM table WHERE id = {user_input}")
```

### 2. 適當的錯誤處理
```python
try:
    oracle.insert(df, Model)
    log.info("寫入成功")
except Exception as e:
    log.error(f"寫入失敗: {e}", "db_insert_error")
    raise
```

### 3. 大量資料處理
```python
# 分批處理大量資料
batch_size = 10000
for i in range(0, len(df), batch_size):
    batch = df.iloc[i:i+batch_size]
    oracle.insert(batch, Model)
    log.info(f"已處理 {min(i+batch_size, len(df))}/{len(df)} 筆")
```

## 常見問題

### Q1：ORA-12170: TNS:連線逾時
```
原因：無法連線到 Oracle 伺服器
解決：
1. 確認 host 和 port 正確
2. 確認網路可連通
3. 確認防火牆設定
```

### Q2：ORA-01017: 無效的使用者名稱/密碼
```
原因：認證失敗
解決：
1. 確認環境變數已設定
2. 確認使用者名稱和密碼正確
3. 確認帳號未被鎖定
```

### Q3：ORA-00942: 資料表或視圖不存在
```
原因：資料表不存在或無權限
解決：
1. 確認資料表名稱正確（大小寫敏感）
2. 確認帳號有存取權限
3. 確認 schema 正確
```
