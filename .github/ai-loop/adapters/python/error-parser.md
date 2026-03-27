# Python 3.10+ Adapter — Error Parser

> `parseErrorOutput(rawOutput)` 實作：將 ruff / pytest / mypy 工具輸出轉為統一 ParsedError[] 格式。

## ruff JSON 輸出解析（Lint Phase）

### 輸入格式（`ruff check src --output-format json`）

```json
[
  {
    "code": "ANN001",
    "message": "Missing type annotation for function argument `user_id`",
    "filename": "/project/src/domain/services/user_service.py",
    "location": { "row": 42, "column": 15 },
    "end_location": { "row": 42, "column": 22 },
    "fix": null,
    "noqa_row": null
  }
]
```

### 解析規則

| 欄位       | 映射來源                                    |
| ---------- | ------------------------------------------- |
| `error_id` | `ruff-{code_lower}-{filename_slug}-line{N}` |
| `severity` | 見下表                                      |
| `tool`     | `"ruff"`                                    |
| `file`     | `filename` 相對路徑                         |
| `line`     | `location.row`                              |

### 常見 ruff 規則嚴重度對應

| Rule Code | 說明                                           | severity |
| --------- | ---------------------------------------------- | -------- |
| `ANN001`  | 函式參數缺少型別標注                           | BLOCK    |
| `ANN201`  | 函式回傳值缺少型別標注                         | BLOCK    |
| `E501`    | 行長度超過限制                                 | WARN     |
| `F401`    | Import but unused                              | WARN     |
| `T201`    | `print` found（應使用 logging）                | BLOCK    |
| `S101`    | Use of `assert` in production code             | WARN     |
| `S608`    | SQL injection risk（string formatting in SQL） | BLOCK    |
| `B006`    | Mutable default argument                       | BLOCK    |
| `BLE001`  | Blind exception catch（`except Exception`）    | WARN     |

---

## mypy 輸出解析（可選型別檢查）

### 輸入格式（`mypy src --ignore-missing-imports`）

```
src/domain/services/user_service.py:42: error: Argument 1 to "get_user" has incompatible type "str"; expected "int"   [arg-type]
src/application/use_cases/create_user.py:18: note: Revealed type is "builtins.str"
```

### 解析規則

| 欄位       | 映射來源                                               |
| ---------- | ------------------------------------------------------ |
| `error_id` | `mypy-{error_code}-{filename_slug}-line{N}`            |
| `severity` | `error` → `WARN`（mypy 整體歸 WARN，不觸發 Fast-Fail） |
| `tool`     | `"mypy"`                                               |

---

## pytest JSON 報告解析（Test Phase）

### 輸入格式（`pytest --json-report`，`pytest-report.json`）

```json
{
  "summary": {
    "passed": 15,
    "failed": 2,
    "total": 17
  },
  "tests": [
    {
      "nodeid": "tests/domain/test_user_service.py::TestUserService::test_get_user_returns_none_when_not_found",
      "outcome": "failed",
      "call": {
        "longrepr": "AssertionError: assert None == UserDto(id=1, name='Alice')\n  at tests/domain/test_user_service.py:67",
        "traceback": [
          { "path": "tests/domain/test_user_service.py", "lineno": 67 }
        ]
      }
    }
  ]
}
```

### 解析規則

| 欄位        | 映射來源                                        |
| ----------- | ----------------------------------------------- |
| `error_id`  | `pytest-fail-{test_slug}-line{N}`               |
| `severity`  | `BLOCK`（測試失敗）                             |
| `tool`      | `"pytest"`                                      |
| `test_slug` | `nodeid` 的測試方法名稱（去除路徑，kebab-case） |

### 覆蓋率解析（`coverage.json`）

| 條件                          | severity | message                                     |
| ----------------------------- | -------- | ------------------------------------------- |
| `totals.percent_covered < 80` | WARN     | "Coverage is {N}%, below the 80% threshold" |
| `totals.percent_covered < 60` | BLOCK    | "Coverage is critically low at {N}%"        |

---

## error_id 生成範例

```
ruff ANN001, user_service.py, line 42
→ ruff-ann001-user-service-line42

mypy arg-type error, user_service.py, line 42
→ mypy-arg-type-user-service-line42

pytest test fail, test_user_service.py::test_get_user_returns_none_when_not_found, line 67
→ pytest-fail-test-get-user-returns-none-when-not-found-line67
```
