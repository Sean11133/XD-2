# Trino 操作詳解

## 目錄

- [config.yaml 設定](#configyaml-設定)
  - [設定欄位說明](#設定欄位說明)
  - [環境變數](#環境變數)
- [Trino 資料結構](#trino-資料結構)
- [初始化](#初始化)
- [查詢操作](#查詢操作)
  - [query_dataframe - 查詢回傳 DataFrame](#query_dataframe-查詢回傳-dataframe)
  - [query_data - 查詢回傳原始資料](#query_data-查詢回傳原始資料)
- [常用查詢模式](#常用查詢模式)
  - [聚合查詢](#聚合查詢)
  - [日期範圍查詢](#日期範圍查詢)
  - [子查詢](#子查詢)
  - [JOIN 查詢](#join-查詢)
- [ETL 範例：Trino 到 Oracle](#etl-範例trino-到-oracle)
- [Trino 特有功能](#trino-特有功能)
  - [使用 WITH 子句（CTE）](#使用-with-子句cte)
  - [使用視窗函數](#使用視窗函數)
- [效能最佳化](#效能最佳化)
  - [1. 限制回傳筆數](#1-限制回傳筆數)
  - [2. 只選擇需要的欄位](#2-只選擇需要的欄位)
  - [3. 使用適當的過濾條件](#3-使用適當的過濾條件)
- [常見問題](#常見問題)
  - [Q1：查詢逾時](#q1查詢逾時)
  - [Q2：記憶體不足](#q2記憶體不足)
  - [Q3：找不到資料表](#q3找不到資料表)

本文件詳細說明 wecpy 框架中 TrinoManager 的使用方式。Trino（原 Presto）是分散式 SQL 查詢引擎，適合大數據查詢。

## config.yaml 設定

```yaml
Database:
  edwml2:
    type: trino
    host: edwml2
    port: 18081
    catalog: udpdb
    username: "{IMX_EDWML2_ID}"
    password: "{IMX_EDWML2_PWD}"
```

### 設定欄位說明

| 欄位 | 說明 | 必要 |
|-----|------|-----|
| type | 資料庫類型，固定為 `trino` | ✅ |
| host | Trino 伺服器位址 | ✅ |
| port | 連接埠（Trino 預設 8080 或自訂） | ✅ |
| catalog | 資料目錄名稱 | ✅ |
| username | 使用者名稱（建議用環境變數） | ✅ |
| password | 密碼（建議用環境變數） | ✅ |

### 環境變數

```bash
# .env
IMX_EDWML2_ID=your_trino_username
IMX_EDWML2_PWD=your_trino_password
```

## Trino 資料結構

Trino 使用三層結構：`catalog.schema.table`

```
catalog (edwml2)
├── schema (ccai)
│   ├── table (aicsuser.employees_v)
│   └── table (aicsuser.departments)
└── schema (udpdb)
    └── table (mk00user.sales_data)
```

查詢時需指定完整路徑：
```sql
SELECT * FROM ccai.aicsuser.employees_v
```

## 初始化

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.database_manager.trino_manager import TrinoManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

# 使用 config.yaml 中定義的連線名稱
trino = TrinoManager("edwml2")
```

## 查詢操作

### query_dataframe - 查詢回傳 DataFrame

```python
# 簡單查詢
df = trino.query_dataframe("SELECT * FROM ccai.aicsuser.employees_v")

# 帶參數查詢
df = trino.query_dataframe(
    "SELECT * FROM ccai.aicsuser.employees_v WHERE year = :year",
    params={"year": "2024"}
)

# 複雜查詢
df = trino.query_dataframe("""
    SELECT 
        YEAR, 
        DEPARTMENT_ID, 
        CEIL(avg(SALARY)) AS AVG_SALARY,
        COUNT(*) AS EMPLOYEE_COUNT
    FROM ccai.aicsuser.employees_v 
    WHERE DEPARTMENT_ID IS NOT NULL 
      AND YEAR = :year
    GROUP BY YEAR, DEPARTMENT_ID 
    ORDER BY DEPARTMENT_ID
""", params={"year": "2024"})

print(f"共 {len(df)} 筆資料")
print(df.head())
```

### query_data - 查詢回傳原始資料

```python
# 回傳 List[Dict]
data = trino.query_data(
    "SELECT * FROM ccai.aicsuser.employees_v WHERE year = :year",
    params={"year": "2024"}
)

# 處理結果
for row in data:
    print(f"員工: {row['EMPLOYEE_NAME']}, 部門: {row['DEPARTMENT_ID']}")
```

## 常用查詢模式

### 聚合查詢

```python
df = trino.query_dataframe("""
    SELECT 
        DEPARTMENT_ID,
        COUNT(*) AS total_employees,
        AVG(SALARY) AS avg_salary,
        MAX(SALARY) AS max_salary,
        MIN(SALARY) AS min_salary
    FROM ccai.aicsuser.employees_v
    WHERE YEAR = :year
    GROUP BY DEPARTMENT_ID
    HAVING COUNT(*) > 10
    ORDER BY avg_salary DESC
""", params={"year": "2024"})
```

### 日期範圍查詢

```python
df = trino.query_dataframe("""
    SELECT *
    FROM udpdb.mk00user.process_data
    WHERE process_date >= DATE :start_date
      AND process_date <= DATE :end_date
""", params={"start_date": "2024-01-01", "end_date": "2024-12-31"})
```

### 子查詢

```python
df = trino.query_dataframe("""
    SELECT e.*
    FROM ccai.aicsuser.employees_v e
    WHERE e.SALARY > (
        SELECT AVG(SALARY)
        FROM ccai.aicsuser.employees_v
        WHERE DEPARTMENT_ID = e.DEPARTMENT_ID
    )
""")
```

### JOIN 查詢

```python
df = trino.query_dataframe("""
    SELECT 
        e.EMPLOYEE_ID,
        e.EMPLOYEE_NAME,
        d.DEPARTMENT_NAME,
        e.SALARY
    FROM ccai.aicsuser.employees_v e
    JOIN ccai.aicsuser.departments d 
        ON e.DEPARTMENT_ID = d.DEPARTMENT_ID
    WHERE e.YEAR = :year
""", params={"year": "2024"})
```

## ETL 範例：Trino 到 Oracle

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.database_manager.trino_manager import TrinoManager
from wecpy.database_manager.oracle_manager import OracleManager
from wecpy.log_manager import LogManager
from datetime import datetime
import getpass

log = LogManager.get_logger()

def extract_from_trino(year: str):
    """從 Trino 擷取資料"""
    trino = TrinoManager("edwml2")
    
    df = trino.query_dataframe("""
        SELECT 
            YEAR, 
            DEPARTMENT_ID, 
            CEIL(avg(SALARY)) AS SALARY
        FROM ccai.aicsuser.employees_v 
        WHERE DEPARTMENT_ID IS NOT NULL 
          AND YEAR = :year
        GROUP BY YEAR, DEPARTMENT_ID 
        ORDER BY DEPARTMENT_ID
    """, params={"year": year})
    
    log.info(f"從 Trino 擷取 {len(df)} 筆資料")
    return df

def transform_data(df):
    """轉換資料"""
    now = datetime.now()
    username = getpass.getuser()
    
    # 加入審計欄位
    df['CREATE_USER'] = username
    df['CREATE_TIME'] = now
    df['UPDATE_USER'] = username
    df['UPDATE_TIME'] = now
    
    log.info("資料轉換完成")
    return df

def load_to_oracle(df, model):
    """載入到 Oracle"""
    oracle = OracleManager("TRAINDB")
    oracle.truncate(model)
    oracle.insert(df, model)
    log.info(f"載入 {len(df)} 筆到 Oracle")

if __name__ == "__main__":
    from models.department_salary import DepartmentSalary
    
    df = extract_from_trino("2024")
    df = transform_data(df)
    load_to_oracle(df, DepartmentSalary)
```

## Trino 特有功能

### 使用 WITH 子句（CTE）

```python
df = trino.query_dataframe("""
    WITH dept_stats AS (
        SELECT 
            DEPARTMENT_ID,
            AVG(SALARY) as avg_salary,
            COUNT(*) as emp_count
        FROM ccai.aicsuser.employees_v
        WHERE YEAR = :year
        GROUP BY DEPARTMENT_ID
    )
    SELECT 
        DEPARTMENT_ID,
        avg_salary,
        emp_count,
        RANK() OVER (ORDER BY avg_salary DESC) as salary_rank
    FROM dept_stats
    WHERE emp_count >= 5
""", params={"year": "2024"})
```

### 使用視窗函數

```python
df = trino.query_dataframe("""
    SELECT 
        EMPLOYEE_ID,
        DEPARTMENT_ID,
        SALARY,
        AVG(SALARY) OVER (PARTITION BY DEPARTMENT_ID) as dept_avg_salary,
        RANK() OVER (PARTITION BY DEPARTMENT_ID ORDER BY SALARY DESC) as dept_rank
    FROM ccai.aicsuser.employees_v
    WHERE YEAR = :year
""", params={"year": "2024"})
```

## 寫入操作

### insert — 批次寫入（支援 batch_size）

TrinoManager 的 `insert` 方法支援 `batch_size` 參數，控制每次批次寫入的筆數（預設 500）：

```python
from wecpy.database_manager.trino_manager import TrinoManager

trino = TrinoManager("edwml2")

# 使用預設 batch_size（500 筆一批）
trino.insert(df, MyModel)

# 自訂 batch_size（適合大量資料寫入）
trino.insert(df, MyModel, batch_size=1000)

# 小批次寫入（適合記憶體受限環境）
trino.insert(df, MyModel, batch_size=100)
```

> **注意**：OracleManager 和 SQLServerManager 的 `insert` 不支援 `batch_size` 參數，這是 TrinoManager 獨有的功能。

## 密碼特殊字元處理

Trino 連線時密碼會進行 URL encoding。如果密碼包含特殊字元（如 `@`、`#`、`%`），wecpy 會**自動**處理 URL encoding，不需要手動處理：

```yaml
# config.yaml — 直接填原始密碼即可
Database:
  edwml2:
    type: trino
    password: "P@ss#word%123"  # 含特殊字元，wecpy 自動 URL encode
```

## 效能最佳化

### 1. 限制回傳筆數
```python
# 大量資料時加上 LIMIT
df = trino.query_dataframe("""
    SELECT * FROM large_table LIMIT 10000
""")
```

### 2. 只選擇需要的欄位
```python
# ✅ 只選需要的欄位
df = trino.query_dataframe("""
    SELECT EMPLOYEE_ID, DEPARTMENT_ID, SALARY FROM employees_v
""")

# ❌ 避免 SELECT *
df = trino.query_dataframe("SELECT * FROM employees_v")
```

### 3. 使用適當的過濾條件
```python
# 在資料庫端過濾，減少傳輸量
df = trino.query_dataframe("""
    SELECT * FROM employees_v
    WHERE YEAR = :year AND DEPARTMENT_ID = :dept_id
""", params={"year": "2024", "dept_id": 10})
```

## 常見問題

### Q1：查詢逾時
```
原因：查詢時間過長
解決：
1. 加入適當的 WHERE 條件
2. 使用 LIMIT 限制筆數
3. 優化 JOIN 和子查詢
```

### Q2：記憶體不足
```
原因：回傳資料量過大
解決：
1. 減少 SELECT 的欄位數
2. 分批查詢處理
3. 使用聚合函數減少資料量
```

### Q3：找不到資料表
```
原因：資料表路徑不正確
解決：
1. 確認 catalog.schema.table 路徑正確
2. 確認有存取權限
3. 檢查大小寫（Trino 預設不區分大小寫）
```
