# Python 編碼標準

> **適用範圍**：公司所有 Python 專案（含 Streamlit、FastAPI 等）
> **Python 版本**：3.10+
> **最後更新**：2025-07

---

## 目錄

1. [基礎規範（PEP 8 + 公司補充）](#1-基礎規範pep-8--公司補充)
2. [Type Hints 使用規範](#2-type-hints-使用規範)
3. [錯誤處理](#3-錯誤處理)
4. [專案結構規範](#4-專案結構規範)
5. [Streamlit 開發規範](#5-streamlit-開發規範)
6. [資料庫存取規範](#6-資料庫存取規範)
7. [API 開發規範（FastAPI）](#7-api-開發規範fastapi)
8. [pytest 測試規範](#8-pytest-測試規範)
9. [虛擬環境與依賴管理](#9-虛擬環境與依賴管理)
10. [程式碼品質工具](#10-程式碼品質工具)
11. [日誌規範](#11-日誌規範)

---

## 1. 基礎規範（PEP 8 + 公司補充）

本節以 [PEP 8](https://peps.python.org/pep-0008/) 為基礎，並依公司實務需求進行補充與調整。

### 1.1 縮排

- 使用 **4 個空格**，禁止使用 Tab。
- 續行對齊時，使用懸掛縮排（hanging indent）並額外縮排 4 格。

### 1.2 行長度限制

- 單行上限 **120 字元**（放寬 PEP 8 預設的 79 字元，以符合現代寬螢幕開發環境）。
- URL、長字串常數等不便換行的情況可例外超過。

### 1.3 import 順序

使用 **isort**（或 ruff 內建的 isort 規則）自動排序，分為三個區塊並以空行隔開：

1. **標準函式庫**（stdlib）
2. **第三方套件**（third-party）
3. **本地模組**（local / project）

```python
# 標準函式庫
import os
import sys
from datetime import datetime
from pathlib import Path

# 第三方套件
import httpx
import pandas as pd
from pydantic import BaseModel

# 本地模組
from project_name.domain.models import User
from project_name.utils.helpers import format_date
```

### 1.4 命名慣例

| 對象             | 風格                 | 範例                          |
| ---------------- | -------------------- | ----------------------------- |
| 檔案 / 模組      | `snake_case`         | `user_service.py`             |
| 套件（Package）   | `snake_case`         | `data_processing`             |
| 類別（Class）     | `PascalCase`         | `UserRepository`              |
| 函式 / 方法       | `snake_case`         | `get_active_users()`          |
| 變數             | `snake_case`         | `user_count`                  |
| 常數             | `UPPER_SNAKE_CASE`   | `MAX_RETRY_COUNT`             |
| 私有成員          | 前綴單底線           | `_internal_cache`             |
| Type Variable    | `PascalCase`         | `T`, `KeyType`                |

### 1.5 字串

- 優先使用 **雙引號** `"` 作為字串定界符（與 ruff format 預設一致）。
- f-string 為首選的字串格式化方式；避免使用 `%` 或 `.format()`。
- 多行字串使用三重雙引號 `"""..."""`。

### 1.6 空行規範

- 頂層函式與類別之間：**2 個空行**。
- 類別內方法之間：**1 個空行**。
- 函式內邏輯區塊之間：適度使用 **1 個空行** 分隔。

### 1.7 Docstring

- 所有公開模組、類別、函式必須撰寫 docstring。
- 採用 **Google Style** docstring 格式。

```python
def calculate_discount(price: float, rate: float) -> float:
    """計算折扣後的價格。

    Args:
        price: 原始價格，必須為正數。
        rate: 折扣率，範圍 0.0 ~ 1.0。

    Returns:
        折扣後的價格。

    Raises:
        ValueError: 當 price 為負數或 rate 超出範圍時。
    """
    if price < 0:
        raise ValueError(f"price 必須為正數，收到 {price}")
    if not 0.0 <= rate <= 1.0:
        raise ValueError(f"rate 必須介於 0.0 ~ 1.0，收到 {rate}")
    return price * (1 - rate)
```

### 1.8 綜合範例

```python
"""使用者服務模組。

提供使用者相關的業務邏輯操作。
"""

import logging
from datetime import datetime

import httpx
from pydantic import BaseModel

from project_name.domain.models import User
from project_name.infrastructure.repositories import UserRepository

logger = logging.getLogger(__name__)

MAX_LOGIN_ATTEMPTS = 5
DEFAULT_PAGE_SIZE = 20


class UserDTO(BaseModel):
    """使用者資料傳輸物件。"""

    id: int
    name: str
    email: str
    created_at: datetime


class UserService:
    """使用者相關業務邏輯。"""

    def __init__(self, repository: UserRepository) -> None:
        self._repository = repository

    def get_user_by_id(self, user_id: int) -> UserDTO | None:
        """根據 ID 取得使用者。

        Args:
            user_id: 使用者 ID。

        Returns:
            使用者 DTO，若不存在則回傳 None。
        """
        user = self._repository.find_by_id(user_id)
        if user is None:
            logger.warning("使用者不存在: user_id=%d", user_id)
            return None
        return UserDTO(
            id=user.id,
            name=user.name,
            email=user.email,
            created_at=user.created_at,
        )

    def list_active_users(self, page: int = 1) -> list[UserDTO]:
        """取得啟用中的使用者清單。

        Args:
            page: 頁碼，從 1 開始。

        Returns:
            使用者 DTO 清單。
        """
        offset = (page - 1) * DEFAULT_PAGE_SIZE
        users = self._repository.find_active(
            limit=DEFAULT_PAGE_SIZE,
            offset=offset,
        )
        return [
            UserDTO(
                id=u.id,
                name=u.name,
                email=u.email,
                created_at=u.created_at,
            )
            for u in users
        ]
```

---

## 2. Type Hints 使用規範

Type hints 能提升程式碼可讀性與 IDE 支援，並搭配 mypy 進行靜態型別檢查。

### 2.1 基本原則

- **所有公開函式（public functions）必須加上 type hints**，包含參數與回傳值。
- 私有函式（`_` 前綴）建議加上，但不強制。
- 區域變數在型別不明確時才需要標註。

### 2.2 語法風格（Python 3.10+）

使用新式聯合型別語法，不再使用 `typing.Optional` 或 `typing.Union`：

```python
# ✅ 正確：Python 3.10+ 語法
def find_user(user_id: int) -> User | None:
    ...

def process(value: str | int | float) -> str:
    ...

# ❌ 避免：舊式語法
from typing import Optional, Union

def find_user(user_id: int) -> Optional[User]:
    ...

def process(value: Union[str, int, float]) -> str:
    ...
```

### 2.3 內建泛型型別

Python 3.9+ 起可直接使用內建型別作為泛型：

```python
# ✅ 正確
def get_names(users: list[User]) -> dict[int, str]:
    return {u.id: u.name for u in users}

# ❌ 避免
from typing import List, Dict

def get_names(users: List[User]) -> Dict[int, str]:
    ...
```

### 2.4 TypeAlias

當型別表達式較複雜時，使用 `TypeAlias` 提高可讀性：

```python
from typing import TypeAlias

# 為複雜型別建立別名
JsonValue: TypeAlias = str | int | float | bool | None | list["JsonValue"] | dict[str, "JsonValue"]
UserMap: TypeAlias = dict[int, list[User]]
Callback: TypeAlias = Callable[[str, int], bool]


def process_data(data: JsonValue) -> JsonValue:
    ...
```

### 2.5 Protocol（結構型子類型）

使用 `Protocol` 取代傳統 ABC，實現鴨子型別的靜態檢查：

```python
from typing import Protocol, runtime_checkable


@runtime_checkable
class Repository(Protocol):
    """資料存取介面（結構型子類型）。"""

    def find_by_id(self, entity_id: int) -> dict | None:
        ...

    def save(self, entity: dict) -> int:
        ...


class PostgresUserRepository:
    """PostgreSQL 實作——無需繼承 Repository，只需符合結構即可。"""

    def find_by_id(self, entity_id: int) -> dict | None:
        # 實際資料庫查詢邏輯
        ...

    def save(self, entity: dict) -> int:
        # 實際儲存邏輯
        ...


def get_service(repo: Repository) -> None:
    """接受任何符合 Repository 結構的物件。"""
    result = repo.find_by_id(1)
    print(result)
```

### 2.6 常見型別標註範例

```python
from collections.abc import Callable, Iterator, Sequence
from typing import Any, TypeAlias

# 可呼叫物件
Handler: TypeAlias = Callable[[str], None]

# 生成器
def read_lines(path: str) -> Iterator[str]:
    with open(path) as f:
        yield from f

# 彈性序列參數
def first_item(items: Sequence[str]) -> str | None:
    return items[0] if items else None

# 類別方法
class Config:
    @classmethod
    def from_env(cls) -> "Config":
        ...

    def get(self, key: str, default: Any = None) -> Any:
        ...
```

---

## 3. 錯誤處理

### 3.1 基本原則

- **禁止 bare except**（`except:` 不帶型別）。
- **禁止 `except Exception` 後不做任何處理或僅 `pass`**。
- 捕捉 **具體的 Exception 型別**，越精確越好。

```python
# ✅ 正確：捕捉具體例外
try:
    value = int(user_input)
except ValueError as e:
    logger.warning("無效的數值輸入: %s", e)
    value = 0

# ❌ 錯誤：bare except
try:
    value = int(user_input)
except:
    pass

# ❌ 錯誤：過度寬泛
try:
    value = int(user_input)
except Exception:
    pass
```

### 3.2 自訂 Exception 類別

- 所有自訂例外必須繼承自 `Exception`（或其子類別）。
- 專案統一定義 **基礎例外類別**，其他例外繼承自該類別。
- 類別名稱以 `Error` 結尾。

```python
class AppError(Exception):
    """專案基礎例外類別。"""

    def __init__(self, message: str, code: str | None = None) -> None:
        super().__init__(message)
        self.code = code


class NotFoundError(AppError):
    """資源不存在時拋出。"""

    def __init__(self, resource: str, resource_id: int | str) -> None:
        super().__init__(
            message=f"{resource} 不存在: {resource_id}",
            code="NOT_FOUND",
        )
        self.resource = resource
        self.resource_id = resource_id


class ValidationError(AppError):
    """資料驗證失敗時拋出。"""

    def __init__(self, field: str, reason: str) -> None:
        super().__init__(
            message=f"欄位 '{field}' 驗證失敗: {reason}",
            code="VALIDATION_ERROR",
        )
        self.field = field
        self.reason = reason


class ExternalServiceError(AppError):
    """外部服務呼叫失敗時拋出。"""

    def __init__(self, service_name: str, detail: str) -> None:
        super().__init__(
            message=f"外部服務 '{service_name}' 錯誤: {detail}",
            code="EXTERNAL_SERVICE_ERROR",
        )
        self.service_name = service_name
```

### 3.3 Result Pattern

對於預期的失敗情境（如驗證、查詢不到資料），可使用 Result Pattern 取代拋出例外，使控制流更明確：

```python
from dataclasses import dataclass
from typing import Generic, TypeVar

T = TypeVar("T")


@dataclass(frozen=True)
class Success(Generic[T]):
    """操作成功的結果。"""
    value: T


@dataclass(frozen=True)
class Failure:
    """操作失敗的結果。"""
    error: str
    code: str = "UNKNOWN"


type Result[T] = Success[T] | Failure


# 使用範例
def divide(a: float, b: float) -> Result[float]:
    if b == 0:
        return Failure(error="除數不可為零", code="DIVISION_BY_ZERO")
    return Success(value=a / b)


def process_division() -> None:
    result = divide(10, 0)
    match result:
        case Success(value=v):
            print(f"結果: {v}")
        case Failure(error=err, code=code):
            print(f"錯誤 [{code}]: {err}")
```

使用 Pydantic 版本（適用於需要序列化的場景）：

```python
from pydantic import BaseModel


class SuccessResult[T](BaseModel):
    """操作成功。"""
    ok: bool = True
    data: T


class ErrorResult(BaseModel):
    """操作失敗。"""
    ok: bool = False
    error: str
    code: str


type ApiResult[T] = SuccessResult[T] | ErrorResult


def get_user(user_id: int) -> ApiResult[UserDTO]:
    user = repository.find_by_id(user_id)
    if user is None:
        return ErrorResult(error="使用者不存在", code="NOT_FOUND")
    return SuccessResult(data=UserDTO.model_validate(user))
```

---

## 4. 專案結構規範

### 4.1 一般 Python 專案

採用 **src layout** 搭配分層架構（Domain-Driven 風格）：

```
project/
├── src/
│   └── project_name/
│       ├── __init__.py
│       ├── domain/              # 領域層：核心業務邏輯、實體、值物件
│       │   ├── __init__.py
│       │   ├── models.py
│       │   └── exceptions.py
│       ├── application/         # 應用層：使用案例、服務
│       │   ├── __init__.py
│       │   ├── services.py
│       │   └── dto.py
│       ├── infrastructure/      # 基礎設施層：資料庫、外部 API、檔案 I/O
│       │   ├── __init__.py
│       │   ├── repositories.py
│       │   ├── database.py
│       │   └── external_api.py
│       └── presentation/        # 表現層：API 路由、CLI
│           ├── __init__.py
│           ├── routes.py
│           └── schemas.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── unit/
│   │   ├── __init__.py
│   │   └── test_services.py
│   └── integration/
│       ├── __init__.py
│       └── test_repositories.py
├── pyproject.toml
├── requirements.txt
├── requirements-dev.txt
├── .env.example
├── README.md
└── Makefile
```

**各層職責說明**：

| 層級             | 職責                                   | 可依賴              |
| ---------------- | -------------------------------------- | -------------------- |
| `domain`         | 業務實體、規則、介面定義               | 無（最內層）         |
| `application`    | 編排業務流程、DTO 轉換                 | `domain`             |
| `infrastructure` | 技術實作（DB、API、快取）              | `domain`             |
| `presentation`   | 處理 HTTP 請求/回應、CLI 指令          | `application`        |

### 4.2 Streamlit 專案結構

Streamlit 專案採用扁平化分層，兼顧 Streamlit 的多頁面機制與業務邏輯分離：

```
streamlit_app/
├── app.py                      # 主入口（Home 頁面）
├── pages/                      # Streamlit 多頁面（檔名前綴數字控制順序）
│   ├── 1_page_a.py
│   ├── 2_page_b.py
│   └── 3_page_c.py
├── components/                 # 可重用 UI 元件
│   ├── __init__.py
│   ├── sidebar.py
│   ├── charts.py
│   └── forms.py
├── services/                   # 業務邏輯（不依賴 Streamlit）
│   ├── __init__.py
│   ├── data_service.py
│   └── auth_service.py
├── models/                     # 資料模型（Pydantic / dataclass）
│   ├── __init__.py
│   └── schemas.py
├── utils/                      # 工具函式
│   ├── __init__.py
│   ├── formatters.py
│   └── validators.py
├── config/                     # 設定檔
│   ├── __init__.py
│   └── settings.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── test_services.py
├── .streamlit/
│   └── config.toml             # Streamlit 設定
├── .env.example
├── requirements.txt
└── README.md
```

---

## 5. Streamlit 開發規範

### 5.1 頁面結構規範

`st.set_page_config()` **必須是每個頁面的第一個 Streamlit 指令**：

```python
"""訂單管理頁面。"""

import streamlit as st

# 必須在最前面，不可在其他 st.* 之後
st.set_page_config(
    page_title="訂單管理",
    page_icon="📦",
    layout="wide",
    initial_sidebar_state="expanded",
)

# 之後才能使用其他 Streamlit 功能
from services.order_service import OrderService
from components.sidebar import render_sidebar


def main() -> None:
    """頁面主函式。"""
    st.title("📦 訂單管理")

    render_sidebar()

    orders = OrderService().get_recent_orders()
    st.dataframe(orders)


if __name__ == "__main__":
    main()
```

### 5.2 Session State 管理規範

- 使用 **集中初始化** 模式，避免散落在各處。
- Key 命名使用 **snake_case**，並加上功能前綴以避免衝突。

```python
import streamlit as st


def init_session_state() -> None:
    """集中初始化 session state，避免 KeyError。"""
    defaults: dict[str, object] = {
        "auth_user": None,
        "auth_token": None,
        "order_filter_status": "all",
        "order_current_page": 1,
        "cart_items": [],
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


# 在 app.py 或每個頁面最前面呼叫
init_session_state()

# 存取 session state
st.session_state.auth_user = user_data
current_user = st.session_state.auth_user
```

### 5.3 快取策略

根據資料特性選擇合適的快取裝飾器：

```python
import streamlit as st
import pandas as pd
from sqlalchemy import create_engine


@st.cache_data(ttl=300)
def load_sales_data(date_range: str) -> pd.DataFrame:
    """快取可序列化的資料（DataFrame、dict、list 等）。

    - 適用於資料查詢結果、API 回應、檔案讀取。
    - ttl（秒）控制快取存活時間。
    - 參數改變時自動失效。
    """
    # 模擬資料查詢
    ...
    return df


@st.cache_resource
def get_db_engine():
    """快取不可序列化的全域資源（資料庫連線、ML 模型等）。

    - 適用於資料庫引擎、HTTP client、機器學習模型。
    - 生命週期與應用相同，不會自動失效。
    """
    return create_engine("postgresql://user:pass@host/db")
```

| 裝飾器               | 適用場景                            | 序列化 | TTL 支援 |
| --------------------- | ----------------------------------- | ------ | -------- |
| `@st.cache_data`      | DataFrame、dict、API 回應           | 是     | 是       |
| `@st.cache_resource`  | DB engine、ML model、HTTP client    | 否     | 否       |

### 5.4 表單處理規範

使用 `st.form` 避免每次互動都觸發 rerun：

```python
import streamlit as st
from models.schemas import OrderFilter


def render_order_filter() -> OrderFilter | None:
    """渲染訂單篩選表單。"""
    with st.form("order_filter_form"):
        col1, col2 = st.columns(2)

        with col1:
            status = st.selectbox("訂單狀態", ["all", "pending", "completed", "cancelled"])
        with col2:
            date_range = st.date_input("日期範圍", value=[])

        submitted = st.form_submit_button("🔍 查詢", use_container_width=True)

    if submitted:
        return OrderFilter(status=status, date_range=date_range)
    return None
```

### 5.5 效能注意事項

- **避免不必要的 rerun**：將互動元件放入 `st.form` 內，或使用 `on_change` callback。
- **大量資料**：使用 `st.dataframe`（虛擬化渲染）取代 `st.table`。
- **耗時操作**：搭配 `st.spinner` 或 `st.progress` 顯示進度。
- **避免在迴圈中呼叫 Streamlit 元件**：預先準備資料，一次性渲染。

```python
import streamlit as st

# ✅ 耗時操作顯示進度
with st.spinner("載入資料中..."):
    data = load_heavy_data()

# ✅ 使用 callback 避免不必要的 rerun
def on_category_change() -> None:
    st.session_state.order_current_page = 1

st.selectbox(
    "分類",
    options=categories,
    key="order_filter_category",
    on_change=on_category_change,
)
```

---

## 6. 資料庫存取規範

### 6.0 本機開發資料庫建議：SQLite 優先

> ✅ **開發階段預設使用 SQLite**，無需安裝外部資料庫服務，快速啟動、零設定。

SQLAlchemy 以 `create_engine()` 為抽象入口，**切換資料庫只需替換連線字串**，ORM Model 與 Repository 無需修改。

#### 開發環境設定（`config.py` 或 `.env`）

```python
import os

# 開發預設：SQLite 本機檔案
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dev.db")
```

#### 環境切換對照表

| 環境                    | 連線字串範例                                                        |
| ----------------------- | ------------------------------------------------------------------- |
| 本機開發（Development） | `sqlite:///./dev.db`                                                |
| CI / 整合測試           | `sqlite:///:memory:`（每次測試獨立，無殘留狀態）                    |
| Staging / UAT           | `postgresql://user:pass@host:5432/db` 或 `mssql+pyodbc://...`      |
| Production              | 由環境變數 `DATABASE_URL` 注入，不寫入程式碼                        |

#### SQLite 注意事項

- `dev.db` 必須加入 `.gitignore`，不可提交版本控制
- SQLite 不支援部分 PostgreSQL / SQL Server 的進階語法（如 `array`、`json` 欄位）；若使用這類功能，CI 應改用目標 DB 做整合測試
- Alembic migration 在 SQLite 上可能有限制（不支援 `ALTER COLUMN`），若遇到，可採 `batch_alter_table` 或在 CI 以目標 DB 執行 migration 驗證

> ✅ **安裝**：SQLite 為 Python 標準函式庫內建，無需額外安裝套件。

---

### 6.1 SQLAlchemy ORM 使用規範

使用 SQLAlchemy 2.0 風格（Mapped / mapped_column）：

```python
from datetime import datetime

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """ORM 基礎類別。"""
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    orders: Mapped[list["Order"]] = relationship(back_populates="user")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, name={self.name!r})>"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    total_amount: Mapped[float] = mapped_column()
    status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="orders")
```

### 6.2 Connection 管理

使用 **Context Manager** 確保連線正確釋放：

```python
from collections.abc import Generator
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

engine = create_engine(
    "postgresql://user:password@localhost:5432/mydb",
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """提供資料庫 session 的 context manager。

    自動處理 commit / rollback / close。
    """
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


# 使用範例
def create_user(name: str, email: str) -> User:
    with get_db_session() as session:
        user = User(name=name, email=email)
        session.add(user)
        session.flush()  # 取得自動產生的 ID
        return user
```

### 6.3 Migration 管理（Alembic）

- 所有 schema 變更必須透過 Alembic migration，**禁止手動修改資料庫 schema**。
- Migration 檔案必須納入版本控制。
- 每次 migration 都要包含 `upgrade()` 和 `downgrade()`。

```bash
# 初始化 Alembic
alembic init alembic

# 自動產生 migration
alembic revision --autogenerate -m "add_users_table"

# 執行 migration
alembic upgrade head

# 回滾上一個版本
alembic downgrade -1
```

Migration 檔案範例：

```python
"""add users table

Revision ID: abc123
"""

from alembic import op
import sqlalchemy as sa

revision = "abc123"
down_revision = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"])


def downgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
```

---

## 7. API 開發規範（FastAPI）

### 7.1 Router 組織

按功能模組拆分 router，在 `main.py` 集中註冊：

```python
# src/project_name/presentation/routes/user_routes.py
from fastapi import APIRouter, Depends, HTTPException, status

from project_name.application.services import UserService
from project_name.presentation.dependencies import get_user_service
from project_name.presentation.schemas import UserCreateRequest, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    """取得使用者資訊。"""
    user = service.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"使用者 {user_id} 不存在",
        )
    return UserResponse.model_validate(user)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: UserCreateRequest,
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    """建立新使用者。"""
    user = service.create_user(name=request.name, email=request.email)
    return UserResponse.model_validate(user)
```

```python
# src/project_name/main.py
from fastapi import FastAPI

from project_name.presentation.routes import user_routes, order_routes

app = FastAPI(
    title="My API",
    version="1.0.0",
    docs_url="/docs",
)

app.include_router(user_routes.router)
app.include_router(order_routes.router)
```

### 7.2 Pydantic Model 用於請求/回應

- 請求與回應使用 **獨立的 Pydantic Model**，不直接暴露 ORM Model。
- 使用 `model_config` 設定序列化行為。

```python
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreateRequest(BaseModel):
    """建立使用者的請求。"""
    name: str = Field(..., min_length=1, max_length=100, examples=["Alice"])
    email: EmailStr = Field(..., examples=["alice@example.com"])


class UserResponse(BaseModel):
    """使用者回應。"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    is_active: bool
    created_at: datetime


class PaginatedResponse[T](BaseModel):
    """通用分頁回應。"""
    items: list[T]
    total: int
    page: int
    page_size: int
    has_next: bool
```

### 7.3 依賴注入（Depends）

```python
# src/project_name/presentation/dependencies.py
from collections.abc import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from project_name.application.services import UserService
from project_name.infrastructure.database import SessionLocal
from project_name.infrastructure.repositories import UserRepository


def get_db() -> Generator[Session, None, None]:
    """提供資料庫 session。"""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    """提供 UserRepository 實例。"""
    return UserRepository(session=db)


def get_user_service(
    repo: UserRepository = Depends(get_user_repository),
) -> UserService:
    """提供 UserService 實例。"""
    return UserService(repository=repo)
```

### 7.4 中介層（Middleware）

```python
import time
import logging

from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """記錄每個請求的處理時間。"""

    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start_time) * 1000

        logger.info(
            "method=%s path=%s status=%d duration=%.2fms",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        return response


class CORSConfigMiddleware(BaseHTTPMiddleware):
    """自訂 CORS 設定範例。"""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Request-ID"] = request.headers.get("X-Request-ID", "N/A")
        return response


# 在 main.py 中註冊
app = FastAPI()
app.add_middleware(RequestLoggingMiddleware)
```

---

## 8. pytest 測試規範

### 8.1 命名慣例

測試函式命名格式：`test_<功能>_when_<條件>_then_<預期結果>`

```python
# ✅ 好的命名：清楚表達測試意圖
def test_calculate_discount_when_rate_is_zero_then_returns_original_price():
    ...

def test_create_user_when_email_duplicate_then_raises_validation_error():
    ...

def test_login_when_credentials_valid_then_returns_token():
    ...

# ❌ 不好的命名：不清楚測試什麼
def test_discount():
    ...

def test_user_1():
    ...
```

### 8.2 Fixture 使用規範

```python
# tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from project_name.infrastructure.database import Base


@pytest.fixture(scope="session")
def engine():
    """建立測試資料庫引擎（整個測試 session 共用）。"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db_session(engine) -> Session:
    """提供獨立的資料庫 session（每個測試自動回滾）。"""
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def sample_user(db_session: Session) -> "User":
    """建立測試用使用者。"""
    from project_name.domain.models import User

    user = User(name="Test User", email="test@example.com")
    db_session.add(user)
    db_session.flush()
    return user
```

### 8.3 conftest.py 組織

```
tests/
├── conftest.py              # 全域 fixture（DB engine、shared config）
├── unit/
│   ├── conftest.py          # 單元測試專用 fixture
│   ├── test_services.py
│   └── test_models.py
├── integration/
│   ├── conftest.py          # 整合測試專用 fixture（DB session、API client）
│   ├── test_repositories.py
│   └── test_api.py
└── e2e/
    ├── conftest.py
    └── test_workflows.py
```

### 8.4 Mock 使用

```python
from unittest.mock import MagicMock, patch

import pytest

from project_name.application.services import UserService
from project_name.domain.exceptions import NotFoundError


class TestUserService:
    """UserService 單元測試。"""

    @pytest.fixture
    def mock_repository(self) -> MagicMock:
        return MagicMock()

    @pytest.fixture
    def service(self, mock_repository: MagicMock) -> UserService:
        return UserService(repository=mock_repository)

    def test_get_user_by_id_when_exists_then_returns_user_dto(
        self, service: UserService, mock_repository: MagicMock
    ):
        mock_repository.find_by_id.return_value = MagicMock(
            id=1, name="Alice", email="alice@example.com"
        )

        result = service.get_user_by_id(1)

        assert result is not None
        assert result.name == "Alice"
        mock_repository.find_by_id.assert_called_once_with(1)

    def test_get_user_by_id_when_not_exists_then_returns_none(
        self, service: UserService, mock_repository: MagicMock
    ):
        mock_repository.find_by_id.return_value = None

        result = service.get_user_by_id(999)

        assert result is None


# 使用 pytest-mock（更簡潔的語法）
def test_send_email_when_called_then_uses_smtp_client(mocker):
    mock_smtp = mocker.patch("project_name.infrastructure.email.SmtpClient")
    service = NotificationService()

    service.send_welcome_email("user@example.com")

    mock_smtp.return_value.send.assert_called_once()
```

### 8.5 測試覆蓋率要求

- **最低覆蓋率**：**80%**（整體）。
- **核心業務邏輯**（domain、application 層）：目標 **90%** 以上。
- CI 中自動檢查，低於閾值則 build 失敗。

```bash
# 執行測試並產生覆蓋率報告
pytest --cov=src/project_name --cov-report=term-missing --cov-fail-under=80
```

`pyproject.toml` 設定：

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --strict-markers --tb=short"
markers = [
    "slow: 標記執行較慢的測試",
    "integration: 整合測試",
]

[tool.coverage.run]
source = ["src/project_name"]
omit = ["*/tests/*", "*/__init__.py"]

[tool.coverage.report]
fail_under = 80
show_missing = true
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "if __name__ == .__main__.",
]
```

---

## 9. 虛擬環境與依賴管理

### 9.1 虛擬環境

每個專案**必須**使用獨立的虛擬環境。推薦使用 `venv` 或 `poetry`：

```bash
# 使用 venv（標準做法）
python -m venv .venv

# 啟用（Windows）
.venv\Scripts\activate

# 啟用（macOS / Linux）
source .venv/bin/activate
```

使用 Poetry：

```bash
# 初始化專案
poetry init

# 安裝依賴
poetry install

# 啟用虛擬環境
poetry shell
```

### 9.2 requirements.txt 格式

- **必須指定版本號**，避免不同環境產生差異。
- 生產依賴與開發依賴分開管理。

```txt
# requirements.txt（生產依賴）
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy==2.0.35
pydantic==2.9.0
httpx==0.27.0
structlog==24.4.0
```

```txt
# requirements-dev.txt（開發依賴）
-r requirements.txt

pytest==8.3.0
pytest-cov==5.0.0
pytest-mock==3.14.0
ruff==0.6.0
mypy==1.11.0
pre-commit==3.8.0
```

### 9.3 pyproject.toml 規範

推薦使用 `pyproject.toml` 作為統一設定檔：

```toml
[project]
name = "my-project"
version = "1.0.0"
description = "專案說明"
requires-python = ">=3.10"
dependencies = [
    "fastapi>=0.115.0,<1.0.0",
    "uvicorn[standard]>=0.30.0",
    "sqlalchemy>=2.0.35,<3.0.0",
    "pydantic>=2.9.0,<3.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-cov>=5.0.0",
    "pytest-mock>=3.14.0",
    "ruff>=0.6.0",
    "mypy>=1.11.0",
    "pre-commit>=3.8.0",
]

[build-system]
requires = ["setuptools>=70.0", "wheel"]
build-backend = "setuptools.backends._legacy:_Backend"
```

### 9.4 開發依賴 vs 生產依賴

| 類型       | 範例                                      | 部署環境是否需要 |
| ---------- | ----------------------------------------- | ---------------- |
| 生產依賴   | FastAPI、SQLAlchemy、Pydantic、httpx      | ✅ 是            |
| 開發依賴   | pytest、ruff、mypy、pre-commit            | ❌ 否            |

```bash
# 安裝生產依賴
pip install -r requirements.txt

# 安裝全部依賴（含開發）
pip install -r requirements-dev.txt

# Poetry：區分 groups
poetry add --group dev pytest ruff mypy
```

---

## 10. 程式碼品質工具

### 10.1 Ruff（取代 flake8 + isort + black）

[Ruff](https://docs.astral.sh/ruff/) 是一個超高速的 Python linter 與 formatter，整合了 flake8、isort、black 的功能。

`pyproject.toml` 設定：

```toml
[tool.ruff]
target-version = "py310"
line-length = 120

[tool.ruff.lint]
select = [
    "E",    # pycodestyle errors
    "W",    # pycodestyle warnings
    "F",    # pyflakes
    "I",    # isort
    "N",    # pep8-naming
    "UP",   # pyupgrade
    "B",    # flake8-bugbear
    "SIM",  # flake8-simplify
    "TCH",  # flake8-type-checking
    "RUF",  # Ruff-specific rules
]
ignore = [
    "E501",  # 行長度由 formatter 控制
]

[tool.ruff.lint.isort]
known-first-party = ["project_name"]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
```

```bash
# Lint 檢查
ruff check .

# 自動修正
ruff check --fix .

# 格式化
ruff format .
```

### 10.2 Mypy（型別檢查）

```toml
[tool.mypy]
python_version = "3.10"
strict = true
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false

[[tool.mypy.overrides]]
module = ["httpx.*", "uvicorn.*"]
ignore_missing_imports = true
```

```bash
# 執行型別檢查
mypy src/
```

### 10.3 Pre-commit Hook 設定

`.pre-commit-config.yaml`：

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.6.0
    hooks:
      - id: ruff
        args: [--fix, --exit-non-zero-on-fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.11.0
    hooks:
      - id: mypy
        additional_dependencies:
          - pydantic>=2.9.0
          - sqlalchemy>=2.0.35

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-toml
      - id: check-added-large-files
        args: [--maxkb=500]
```

```bash
# 安裝 pre-commit hooks
pre-commit install

# 手動執行所有 hooks
pre-commit run --all-files
```

---

## 11. 日誌規範

### 11.1 基本原則

- 使用 `logging` 標準模組，**禁止使用 `print()` 作為日誌**。
- 推薦使用 [structlog](https://www.structlog.org/) 實現結構化日誌。
- 每個模組使用 `logger = logging.getLogger(__name__)` 建立獨立 logger。

### 11.2 日誌等級使用指引

| 等級       | 使用場景                                             | 範例                                   |
| ---------- | ---------------------------------------------------- | -------------------------------------- |
| `DEBUG`    | 開發除錯用的詳細資訊，生產環境通常關閉               | 函式參數值、SQL 查詢內容               |
| `INFO`     | 正常流程中的重要事件                                 | 服務啟動、使用者登入、訂單建立         |
| `WARNING`  | 潛在問題，但程式仍可正常運作                         | 快取未命中、重試操作、deprecated 呼叫  |
| `ERROR`    | 錯誤發生，影響單一功能但程式仍可運行                 | API 呼叫失敗、資料驗證錯誤             |
| `CRITICAL` | 嚴重錯誤，可能導致程式無法繼續                       | 資料庫連線失敗、設定檔遺失             |

### 11.3 使用 logging 標準模組

```python
import logging

logger = logging.getLogger(__name__)


def process_order(order_id: int) -> None:
    logger.info("開始處理訂單: order_id=%d", order_id)

    try:
        # 業務邏輯
        ...
        logger.info("訂單處理完成: order_id=%d", order_id)
    except ValueError as e:
        logger.warning("訂單資料異常: order_id=%d, error=%s", order_id, e)
    except Exception:
        logger.exception("訂單處理失敗: order_id=%d", order_id)
        raise
```

**注意事項**：
- 使用 `%s`、`%d` 格式化（lazy evaluation），**不要在 logger 呼叫中使用 f-string**。
- 使用 `logger.exception()` 自動附帶 traceback（僅在 `except` 區塊中使用）。

### 11.4 結構化日誌（structlog）

推薦在正式專案中使用 structlog，產出 JSON 格式日誌，便於日誌收集與分析：

```python
import structlog

# 設定 structlog
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.ConsoleRenderer()         # 開發環境：彩色輸出
        # structlog.processors.JSONRenderer()   # 生產環境：JSON 格式
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


def process_order(order_id: int, user_id: int) -> None:
    log = logger.bind(order_id=order_id, user_id=user_id)

    log.info("order_processing_started")

    try:
        # 業務邏輯
        ...
        log.info("order_processing_completed", total_amount=150.0)
    except Exception:
        log.exception("order_processing_failed")
        raise
```

生產環境 JSON 輸出範例：

```json
{
  "event": "order_processing_completed",
  "order_id": 12345,
  "user_id": 67,
  "total_amount": 150.0,
  "log_level": "info",
  "timestamp": "2025-07-01T10:30:00Z"
}
```

### 11.5 日誌設定範例

```python
# config/logging_config.py
import logging.config

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": "DEBUG",
            "formatter": "standard",
            "stream": "ext://sys.stdout",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "INFO",
            "formatter": "standard",
            "filename": "logs/app.log",
            "maxBytes": 10_485_760,  # 10 MB
            "backupCount": 5,
            "encoding": "utf-8",
        },
    },
    "loggers": {
        "project_name": {
            "level": "DEBUG",
            "handlers": ["console", "file"],
            "propagate": False,
        },
        "sqlalchemy.engine": {
            "level": "WARNING",
            "handlers": ["console"],
            "propagate": False,
        },
    },
    "root": {
        "level": "WARNING",
        "handlers": ["console"],
    },
}


def setup_logging() -> None:
    """初始化日誌設定，在應用程式啟動時呼叫。"""
    logging.config.dictConfig(LOGGING_CONFIG)
```

---

## 附錄：快速檢查清單

在提交 Code Review 前，請確認以下項目：

- [ ] 所有公開函式皆有 type hints 與 docstring
- [ ] 沒有 bare except 或被忽略的例外
- [ ] import 順序正確（stdlib → third-party → local）
- [ ] 命名符合慣例（snake_case / PascalCase / UPPER_SNAKE_CASE）
- [ ] 測試覆蓋率 ≥ 80%
- [ ] `ruff check` 與 `mypy` 檢查通過
- [ ] 沒有使用 `print()` 作為日誌
- [ ] 敏感資訊（密碼、API Key）未寫死在程式碼中
- [ ] Migration 檔案已包含且可正常執行
