# SQLAlchemy Model 定義範例

## 目錄

- [基本 Model 結構](#基本-model-結構)
- [欄位類型對照表](#欄位類型對照表)
- [常見欄位類型](#常見欄位類型)
  - [字串欄位](#字串欄位)
  - [數值欄位](#數值欄位)
  - [日期時間欄位](#日期時間欄位)
  - [布林欄位](#布林欄位)
- [主鍵定義](#主鍵定義)
  - [單一主鍵](#單一主鍵)
  - [複合主鍵](#複合主鍵)
  - [自動遞增主鍵](#自動遞增主鍵)
- [指定 Schema（SQL Server）](#指定-schemasql-server)
- [完整 Model 範例](#完整-model-範例)
  - [員工資料表](#員工資料表)
  - [訂單資料表](#訂單資料表)
  - [製程資料表（半導體）](#製程資料表半導體)
- [使用 Model 進行操作](#使用-model-進行操作)
  - [Insert](#insert)
  - [Truncate](#truncate)
- [Model 定義最佳實務](#model-定義最佳實務)
  - [1. 欄位命名對應](#1-欄位命名對應)
  - [2. 使用 nullable](#2-使用-nullable)
  - [3. 設定預設值](#3-設定預設值)
  - [4. 審計欄位標準化](#4-審計欄位標準化)
  - [5. 檔案組織](#5-檔案組織)

本文件提供 wecpy 框架中 SQLAlchemy Model 的定義範例和最佳實務。

## 基本 Model 結構

```python
# models/department_salary.py
from sqlalchemy import Column, Date, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class DepartmentSalary(Base):
    """部門薪資資料表 Model"""
    
    __tablename__ = 'DEPARTMENT_SALARY'
    
    # 主鍵欄位
    DEPARTMENT_ID = Column('DEPARTMENT_ID', String, primary_key=True)
    YEAR = Column('YEAR', Integer, primary_key=True)
    
    # 資料欄位
    SALARY = Column('SALARY', Float)
    
    # 審計欄位
    CREATE_USER = Column('CREATE_USER', String)
    CREATE_TIME = Column('CREATE_TIME', Date)
    UPDATE_USER = Column('UPDATE_USER', String)
    UPDATE_TIME = Column('UPDATE_TIME', Date)
```

## 欄位類型對照表

| Python/SQLAlchemy | Oracle | SQL Server | Trino |
|-------------------|--------|------------|-------|
| String | VARCHAR2 | VARCHAR/NVARCHAR | VARCHAR |
| Integer | NUMBER | INT | INTEGER |
| Float | NUMBER | FLOAT | DOUBLE |
| Date | DATE | DATE | DATE |
| DateTime | TIMESTAMP | DATETIME | TIMESTAMP |
| Boolean | NUMBER(1) | BIT | BOOLEAN |
| Text | CLOB | TEXT | VARCHAR |
| Numeric | NUMBER | DECIMAL | DECIMAL |

## 常見欄位類型

### 字串欄位

```python
from sqlalchemy import Column, String, Text

class Example(Base):
    __tablename__ = 'EXAMPLE'
    
    # 固定長度字串
    CODE = Column('CODE', String(10))
    
    # 變動長度字串
    NAME = Column('NAME', String(100))
    
    # 長文字
    DESCRIPTION = Column('DESCRIPTION', Text)
```

### 數值欄位

```python
from sqlalchemy import Column, Integer, Float, Numeric

class Example(Base):
    __tablename__ = 'EXAMPLE'
    
    # 整數
    COUNT = Column('COUNT', Integer)
    
    # 浮點數
    PRICE = Column('PRICE', Float)
    
    # 精確小數（財務用）
    AMOUNT = Column('AMOUNT', Numeric(15, 2))  # 15位數，2位小數
```

### 日期時間欄位

```python
from sqlalchemy import Column, Date, DateTime, Time
from datetime import datetime, date, time

class Example(Base):
    __tablename__ = 'EXAMPLE'
    
    # 日期
    BIRTH_DATE = Column('BIRTH_DATE', Date)
    
    # 日期時間
    CREATED_AT = Column('CREATED_AT', DateTime, default=datetime.now)
    
    # 時間
    START_TIME = Column('START_TIME', Time)
```

### 布林欄位

```python
from sqlalchemy import Column, Boolean, Integer

class Example(Base):
    __tablename__ = 'EXAMPLE'
    
    # 布林值
    IS_ACTIVE = Column('IS_ACTIVE', Boolean, default=True)
    
    # Oracle 用 NUMBER(1) 模擬布林
    ENABLED = Column('ENABLED', Integer, default=1)  # 1=True, 0=False
```

## 主鍵定義

### 單一主鍵

```python
class Employee(Base):
    __tablename__ = 'EMPLOYEE'
    
    EMPLOYEE_ID = Column('EMPLOYEE_ID', String(20), primary_key=True)
    NAME = Column('NAME', String(100))
```

### 複合主鍵

```python
class DepartmentEmployee(Base):
    __tablename__ = 'DEPARTMENT_EMPLOYEE'
    
    DEPARTMENT_ID = Column('DEPARTMENT_ID', String(10), primary_key=True)
    EMPLOYEE_ID = Column('EMPLOYEE_ID', String(20), primary_key=True)
    ROLE = Column('ROLE', String(50))
```

### 自動遞增主鍵

```python
class Log(Base):
    __tablename__ = 'LOG'
    
    # Oracle 使用 Sequence，需額外設定
    LOG_ID = Column('LOG_ID', Integer, primary_key=True, autoincrement=True)
    MESSAGE = Column('MESSAGE', String(500))
```

## 指定 Schema（SQL Server）

```python
class ReportData(Base):
    __tablename__ = 'REPORT_DATA'
    __table_args__ = {'schema': 'dbo'}  # 指定 schema
    
    REPORT_ID = Column('REPORT_ID', Integer, primary_key=True)
    REPORT_NAME = Column('REPORT_NAME', String(100))
```

## 完整 Model 範例

### 員工資料表

```python
# models/employee.py
from sqlalchemy import Column, Date, Integer, String, Float, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Employee(Base):
    """員工資料表 Model"""
    
    __tablename__ = 'EMPLOYEE'
    
    # 主鍵
    EMPLOYEE_ID = Column('EMPLOYEE_ID', String(20), primary_key=True)
    
    # 基本資料
    EMPLOYEE_NAME = Column('EMPLOYEE_NAME', String(100), nullable=False)
    EMAIL = Column('EMAIL', String(100))
    PHONE = Column('PHONE', String(20))
    
    # 部門與職位
    DEPARTMENT_ID = Column('DEPARTMENT_ID', String(10))
    POSITION = Column('POSITION', String(50))
    
    # 薪資
    SALARY = Column('SALARY', Float)
    
    # 狀態
    IS_ACTIVE = Column('IS_ACTIVE', Boolean, default=True)
    HIRE_DATE = Column('HIRE_DATE', Date)
    
    # 審計欄位
    CREATE_USER = Column('CREATE_USER', String(50))
    CREATE_TIME = Column('CREATE_TIME', Date, default=datetime.now)
    UPDATE_USER = Column('UPDATE_USER', String(50))
    UPDATE_TIME = Column('UPDATE_TIME', Date, default=datetime.now, onupdate=datetime.now)
```

### 訂單資料表

```python
# models/order.py
from sqlalchemy import Column, Date, DateTime, Integer, String, Numeric
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Order(Base):
    """訂單資料表 Model"""
    
    __tablename__ = 'ORDERS'
    
    # 主鍵
    ORDER_ID = Column('ORDER_ID', String(30), primary_key=True)
    
    # 訂單資訊
    CUSTOMER_ID = Column('CUSTOMER_ID', String(20), nullable=False)
    ORDER_DATE = Column('ORDER_DATE', Date, nullable=False)
    
    # 金額（使用 Numeric 確保精確度）
    SUBTOTAL = Column('SUBTOTAL', Numeric(15, 2))
    TAX = Column('TAX', Numeric(15, 2))
    TOTAL = Column('TOTAL', Numeric(15, 2))
    
    # 狀態
    STATUS = Column('STATUS', String(20), default='PENDING')
    
    # 時間戳記
    CREATED_AT = Column('CREATED_AT', DateTime, default=datetime.now)
    UPDATED_AT = Column('UPDATED_AT', DateTime, default=datetime.now, onupdate=datetime.now)
```

### 製程資料表（半導體）

```python
# models/process_data.py
from sqlalchemy import Column, DateTime, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class ProcessData(Base):
    """製程資料表 Model"""
    
    __tablename__ = 'PROCESS_DATA'
    
    # 複合主鍵
    LOT_ID = Column('LOT_ID', String(20), primary_key=True)
    WAFER_ID = Column('WAFER_ID', String(10), primary_key=True)
    STEP_ID = Column('STEP_ID', String(20), primary_key=True)
    
    # 製程資訊
    EQUIPMENT_ID = Column('EQUIPMENT_ID', String(20))
    CHAMBER_ID = Column('CHAMBER_ID', String(20))
    RECIPE_ID = Column('RECIPE_ID', String(50))
    
    # 時間
    START_TIME = Column('START_TIME', DateTime)
    END_TIME = Column('END_TIME', DateTime)
    
    # 參數值
    PARAM_1 = Column('PARAM_1', Float)
    PARAM_2 = Column('PARAM_2', Float)
    PARAM_3 = Column('PARAM_3', Float)
    
    # 結果
    RESULT = Column('RESULT', String(10))  # PASS/FAIL
    DEFECT_COUNT = Column('DEFECT_COUNT', Integer, default=0)
```

## 使用 Model 進行操作

### Insert

```python
from models.employee import Employee
import pandas as pd
from datetime import datetime

# 準備 DataFrame
df = pd.DataFrame([
    {
        "EMPLOYEE_ID": "E001",
        "EMPLOYEE_NAME": "Alice",
        "DEPARTMENT_ID": "D01",
        "SALARY": 50000.0,
        "IS_ACTIVE": True,
        "HIRE_DATE": datetime.now().date(),
        "CREATE_USER": "system",
        "CREATE_TIME": datetime.now(),
        "UPDATE_USER": "system",
        "UPDATE_TIME": datetime.now()
    }
])

# 寫入資料庫
oracle.insert(df, Employee)
```

### Truncate

```python
from models.employee import Employee

# 清空資料表
oracle.truncate(Employee)
```

## Model 定義最佳實務

### 1. 欄位命名對應
```python
# 確保 Column 名稱與資料庫欄位名稱完全一致
DEPARTMENT_ID = Column('DEPARTMENT_ID', String)  # ✅
department_id = Column('DEPARTMENT_ID', String)  # ⚠️ 可能造成混淆
```

### 2. 使用 nullable
```python
# 標記必填欄位
EMPLOYEE_NAME = Column('EMPLOYEE_NAME', String(100), nullable=False)
```

### 3. 設定預設值
```python
IS_ACTIVE = Column('IS_ACTIVE', Boolean, default=True)
CREATE_TIME = Column('CREATE_TIME', DateTime, default=datetime.now)
```

### 4. 審計欄位標準化
```python
# 所有資料表都應包含審計欄位
CREATE_USER = Column('CREATE_USER', String(50))
CREATE_TIME = Column('CREATE_TIME', DateTime)
UPDATE_USER = Column('UPDATE_USER', String(50))
UPDATE_TIME = Column('UPDATE_TIME', DateTime)
```

### 5. 檔案組織
```
models/
├── __init__.py
├── employee.py
├── department.py
├── order.py
└── process_data.py
```

```python
# models/__init__.py
from .employee import Employee
from .department import Department
from .order import Order
from .process_data import ProcessData
```
