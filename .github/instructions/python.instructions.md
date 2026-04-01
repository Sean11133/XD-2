---
applyTo: "**/*.py"
---

# Python 3.10+ 編碼標準（快速參考）

> 📌 **完整標準**：`standards/coding-standard-python.md`（命名慣例、型別提示、Docstring、Domain 層、Result Pattern、日誌等全部規範）
>
> 本檔僅列出**自動載入時的提醒重點**，詳細規範與範例請查閱完整標準文件。

## 關鍵提醒

- **型別提示**：所有公開函式必須有型別提示（Python 3.10+ `X | Y` syntax）
- **Docstring**：Google Style，強制於所有公開 API
- **Domain 層**：禁止 import 任何框架（SQLAlchemy / Streamlit / FastAPI）
- **錯誤處理**：預期失敗用 `Result`（`from result import Ok, Err`），非預期用 Exception
- **日誌**：禁止 `print()`，使用 `logging.getLogger(__name__)` + 結構化 extra
- **命名**：模組/函式/變數 `snake_case`、類別 `PascalCase`、常數 `UPPER_SNAKE_CASE`
- **測試**：pytest，命名 `test_{行為}_{情境}_{預期}`，最低覆蓋率 80%
- **程式碼品質**：ruff（lint + format）、mypy（型別檢查）、bandit（安全掃描）

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
