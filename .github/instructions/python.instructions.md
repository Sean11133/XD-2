---
applyTo: "**/*.py"
---

# Python 3.10+ 編碼標準摘要

> 完整標準：`standards/coding-standard-python.md`

## 命名慣例

| 對象              | 規範               | 範例                             |
| ----------------- | ------------------ | -------------------------------- |
| 模組、函式、變數  | `snake_case`       | `user_service.py`, `get_user()`  |
| 類別              | `PascalCase`       | `OrderService`, `UserRepository` |
| 常數              | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT`                |
| 私有成員          | `_snake_case`      | `_db_session`                    |
| Abstract/Protocol | `PascalCase`       | `IOrderRepository`               |

## 型別提示（強制要求）

```python
# ✅ 所有公開函式必須有型別提示（Python 3.10+ union syntax）
def get_user(user_id: int) -> User | None:
    ...

# ✅ 泛型
def batch_process(items: list[Order], *, dry_run: bool = False) -> list[Result]:
    ...

# ✅ TypeAlias（複雜型別）
type UserId = int
type OrderItems = list[OrderItem]
```

## Docstring 規範（Google Style，強制）

```python
def process_order(order: Order, *, notify: bool = True) -> Result[Order, str]:
    """訂單處理服務的核心業務邏輯。

    Args:
        order: 待處理的訂單 Aggregate Root。
        notify: 是否發送通知郵件，預設為 True。

    Returns:
        成功時回傳 Ok(order)，驗證失敗時回傳 Err(訊息)。

    Raises:
        InfrastructureError: 資料庫連線失敗時。
    """
```

## Domain 層規範（Clean Architecture）

```python
# ✅ Domain Entity — 使用 dataclass，無任何框架引用
from dataclasses import dataclass, field
from uuid import UUID

@dataclass
class Order:
    id: UUID
    customer_id: UUID
    items: list[OrderItem] = field(default_factory=list)
    status: OrderStatus = OrderStatus.PENDING

    def add_item(self, item: OrderItem) -> None:
        if item.quantity <= 0:
            raise DomainError("Quantity must be positive")
        self.items.append(item)

# ✅ Value Object — frozen dataclass（不可變）
@dataclass(frozen=True)
class Money:
    amount: Decimal
    currency: str

    def __post_init__(self) -> None:
        if self.amount < 0:
            raise DomainError("Amount cannot be negative")

# ❌ 禁止：Domain 層 import SQLAlchemy / Streamlit / FastAPI
```

## Result Pattern（錯誤處理）

```python
# ✅ 預期失敗（驗證、找不到）用 Result，非 Exception
from result import Ok, Err, Result

def get_order(order_id: UUID) -> Result[Order, str]:
    order = self._repo.find_by_id(order_id)
    if order is None:
        return Err(f"Order {order_id} not found")
    return Ok(order)

# ✅ 非預期失敗（I/O、基礎設施）用 Exception
class InfrastructureError(AppError): ...

# ❌ 禁止 bare except
try:
    ...
except Exception:  # ❌
    pass
```

## 日誌規範（禁止 print）

```python
import logging

logger = logging.getLogger(__name__)

# ✅ 結構化日誌
logger.info("Order processed", extra={"order_id": str(order.id), "amount": float(total)})

# ❌ 禁止
print(f"Order {order_id} processed")  # 禁止
```

## pytest 測試規範

```python
# 命名：test_function_name_when_condition_then_expected
def test_add_item_when_quantity_zero_then_raises_domain_error() -> None:
    order = Order(id=uuid4(), customer_id=uuid4())

    with pytest.raises(DomainError, match="Quantity must be positive"):
        order.add_item(OrderItem(product_id=uuid4(), quantity=0))

# ✅ fixture 管理狀態
@pytest.fixture
def sample_order() -> Order:
    return Order(id=uuid4(), customer_id=uuid4())
```

## 禁止事項

- ❌ `print()` 作為正式日誌（使用 `logging`）
- ❌ `except Exception: pass` 或空 catch
- ❌ Domain 層引入 `sqlalchemy`、`streamlit`、`fastapi`
- ❌ 全域可變狀態（Global mutable state）
- ❌ 硬編碼密碼/設定值（使用環境變數或 config 物件）
- ❌ 公開函式省略型別提示

## 程式碼品質工具

```bash
ruff check .              # Linting（最高優先）
ruff format --check .    # 格式檢查
mypy .                    # 型別檢查
pytest --cov=src         # 測試（最低覆蓋率 80%）
```
