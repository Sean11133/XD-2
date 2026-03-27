# Python (wecpy Framework) E2E 範例

# 檔案 #38 | 完整的 Inner Auto Loop 執行演示

## 情境

在 `wec_py` 的 `wecpy/database_manager/` 中新增一個安全的查詢方法，
支援參數化查詢並使用 wecpy LogManager 記錄。

---

## Step 1：撰寫 Spec

建立檔案 `wec_py/.github/ai-loop/specs/db-query-method.yaml`：

```yaml
spec_version: "1.0"
title: "DatabaseManager.query_safe"

scope:
  framework: python
  targets:
    - path: wecpy/database_manager/

acceptance_criteria:
  - "新增 query_safe(sql: str, params: tuple) -> list[dict] 方法"
  - "使用參數化查詢（禁止 f-string 或字串拼接 SQL）"
  - "使用 wecpy LogManager 記錄查詢錯誤（禁止 print）"
  - "所有 pytest 測試通過（valid query, empty result, exception handling）"

constraints:
  - "ConfigManager 必須在 DatabaseManager 初始化之前完成初始化"
  - "query_safe 必須有完整的型別標注"
  - "不得使用 bare except"

loop_config:
  max_rounds: 3
```

---

## Step 2：觸發 Loop

```
@ai-loop .github/ai-loop/specs/db-query-method.yaml
```

---

## Step 3：預期的 Developer 輸出（Round 1）

**修改的 `wecpy/database_manager/__init__.py`**（節錄）：

```python
from typing import Optional
from ..config_manager import ConfigManager
from ..log_manager import LogManager

logger = LogManager.get_logger(__name__)   # ✅ AC-3: LogManager，非 print


class DatabaseManager:
    def __init__(self, config: ConfigManager) -> None:  # ✅ D1.2: 依賴注入
        self._config = config
        self._connection: Optional[object] = None

    def query_safe(                              # ✅ AC-1: 方法簽名
        self,
        sql: str,                               # ✅ D2.1: 型別標注
        params: tuple = ()
    ) -> list[dict]:                            # ✅ D2.1: 返回型別
        """
        Execute a parameterized SQL query safely.

        Args:
            sql: SQL statement with %s placeholders
            params: Parameters tuple (prevents SQL injection)

        Returns:
            List of result rows as dictionaries
        """
        try:
            cursor = self._connection.cursor()
            cursor.execute(sql, params)          # ✅ AC-2: 參數化查詢
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
        except Exception as e:
            logger.error("Database query failed: %s | SQL: %s", e, sql)  # ✅ AC-3
            raise                                # ✅ D4.1: 不吞 exception
```

**建立的測試 `db_test.py`（補充 query_safe 測試）**：

```python
import pytest
from unittest.mock import MagicMock, patch
from wecpy.database_manager import DatabaseManager
from wecpy.config_manager import ConfigManager


@pytest.fixture
def db_manager():
    # ✅ D1.1: ConfigManager 先初始化，連續兩行
    config = ConfigManager("test_config.yaml")
    config.load()
    manager = DatabaseManager(config)
    manager._connection = MagicMock()
    return manager


class TestQuerySafe:
    def test_valid_query_returns_results(self, db_manager):
        # Arrange
        mock_cursor = MagicMock()
        mock_cursor.description = [("id",), ("name",)]
        mock_cursor.fetchall.return_value = [(1, "Alice"), (2, "Bob")]
        db_manager._connection.cursor.return_value = mock_cursor

        # Act
        results = db_manager.query_safe("SELECT id, name FROM users WHERE id = %s", (1,))

        # Assert
        assert len(results) == 2
        assert results[0] == {"id": 1, "name": "Alice"}
        mock_cursor.execute.assert_called_once_with(
            "SELECT id, name FROM users WHERE id = %s", (1,)
        )

    def test_empty_result_returns_empty_list(self, db_manager):
        mock_cursor = MagicMock()
        mock_cursor.description = [("id",)]
        mock_cursor.fetchall.return_value = []
        db_manager._connection.cursor.return_value = mock_cursor

        results = db_manager.query_safe("SELECT id FROM users WHERE id = %s", (999,))
        assert results == []

    def test_exception_is_logged_and_raised(self, db_manager):
        db_manager._connection.cursor.side_effect = Exception("Connection lost")

        with pytest.raises(Exception, match="Connection lost"):
            db_manager.query_safe("SELECT 1", ())
```

---

## Step 4：Tester Agent 輸出（Round 1）

```
╔══════════════════════════════════════════════════════╗
║  🧪 TESTER  Round 1 / 3                             ║
╠══════════════════════════════════════════════════════╣
║  STEP RESULTS                                        ║
║  Lint   : ✅ PASS (pylint: exit 0)                  ║
║  Test   : ✅ PASS (pytest: 3 passed, 0 failed)      ║
║  Build  : ✅ PASS (python -m build)                 ║
║  RESULT : ✅ PASS                                    ║
╚══════════════════════════════════════════════════════╝
```

---

## Step 5：Reviewer Agent 輸出

```
╔══════════════════════════════════════════════════════╗
║  🔍 REVIEWER  Round 1 / 3                           ║
╠══════════════════════════════════════════════════════╣
║  REVIEW DIMENSIONS                                   ║
║  D0 Spec Compliance  : ✅ All 4 AC satisfied        ║
║  D1 wecpy SSoT       : ✅ ConfigManager 順序正確     ║
║  D2 Type Safety      : ✅ 完整型別標注               ║
║  D3 Security         : ✅ 參數化查詢，無硬編碼敏感資訊 ║
║  D4 Error Handling   : ✅ logger.error + raise      ║
║  RESULT              : ✅ PASS                      ║
╚══════════════════════════════════════════════════════╝
```

---

## Round 2 D3 失敗範例

若 Developer 不小心使用 f-string：

```python
# ❌ Developer 誤寫的版本
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
```

Reviewer D3 會報告：

```yaml
errors:
  - error_id: "review-sql-injection-fstring"
    description: "D3.1: f-string SQL injection risk detected"
    file: "wecpy/database_manager/__init__.py"
    line: 35
```

Round 2 Developer 必須修復此特定行，不得修改其他程式碼。
