---
# Python Adapter — Framework Detector
---

# Python 3.10+ Adapter — Framework Detector

> Chain of Responsibility 節點：偵測當前 project 是否為 Python 3.10+ 專案。

## 偵測邏輯

### 主要偵測條件（任一成立即確認）

| 優先級 | 條件                                              | 查找位置               |
| ------ | ------------------------------------------------- | ---------------------- |
| 高     | `pyproject.toml` 存在                             | project root           |
| 高     | `requirements.txt` 或 `requirements-dev.txt` 存在 | project root           |
| 中     | `setup.py` 或 `setup.cfg` 存在                    | project root           |
| 中     | `*.py` 檔案存在（至少 3 個）                      | project root 或 `src/` |

### Python 版本確認

| 條件                                | 查找位置                        |
| ----------------------------------- | ------------------------------- |
| `python_requires = ">=3.10"`        | `pyproject.toml` 或 `setup.cfg` |
| `[tool.poetry] python = "^3.10"`    | `pyproject.toml`                |
| `.python-version` 內容以 `3.1` 開頭 | project root                    |

**注意**：若偵測到 Python < 3.10，仍使用此 Adapter，但加入 WARN：

```
severity: WARN
message: "Detected Python {version}, standards require Python 3.10+. Union type syntax may not be supported."
```

### Streamlit 專案特有偵測

| 條件                             | 查找位置         |
| -------------------------------- | ---------------- |
| `streamlit` 在 requirements.txt  | project root     |
| `import streamlit` 在任意 `*.py` | `src/` 或 `app/` |

---

## 偵測流程

```
1. 在 project root 搜尋 pyproject.toml
   └─ 找到 → 確認為 Python 專案，跳到步驟 3

2. 在 project root 搜尋 requirements.txt
   └─ 找到 → 確認為 Python 專案，繼續步驟 3
   └─ 未找到 → 搜尋 *.py 檔案（至少 3 個）
      └─ 找到 → return true（保守確認）
      └─ 未找到 → return false（非 Python 專案）

3. 嘗試確認 Python 版本
   └─ >= 3.10 → 繼續步驟 4
   └─ < 3.10 → 繼續步驟 4 with WARN

4. wecpy 函式庫偵測（掃描依賴清單）
   > wecpy 是企業級共用 Library（非 API 框架），提供 ConfigManager、LogManager、DatabaseManager 等基礎設施。
   > 使用者仍需自行選擇 API 框架（如 FastAPI、Flask 等），wecpy 作為基礎設施層整合其中。
   ├─ 在 pyproject.toml [project.dependencies] 或 [tool.poetry.dependencies] 搜尋 `wecpy`
   ├─ 在 requirements.txt 搜尋以 `wecpy` 開頭的行
   ├─ 在 任意 *.py 搜尋 `from wecpy.` 或 `import wecpy` import 語句
   └─ 判定：
        ├─ 任一條件成立 → wecpy_detected: true
        │    ├─ 自動載入 `frameworks/wec-py/instructions/wecpy.instructions.md`
        │    ├─ 將路徑加入 project-profile.yaml 的 instructions_override
        │    └─ 驗證初始化模式：
        │         ├─ 存在 PROD/config.yaml 或 PILOT/config.yaml → wecpy_initialized: true
        │         └─ 不存在 → wecpy_initialized: false（需引導建立設定目錄）
        └─ 全部不成立 → wecpy_detected: false
             └─ 若為新專案（@dev new project）→ 主動提示：
                「Python 專案必須使用 wecpy 函式庫，請選擇您要使用的 API 框架（如 FastAPI、Flask 等）」
```

---

## 偵測結果

```yaml
# 偵測成功（使用 wecpy 函式庫）
detected: true
framework: python
confidence: HIGH
python_version: "3.11"
project_structure: pyproject
is_streamlit: false
entry_point: "main.py"
wecpy_detected: true           # 偵測到 wecpy 依賴（Library，非 API 框架）
wecpy_initialized: true        # PROD/config.yaml 或 PILOT/config.yaml 存在

# 偵測成功（Python 專案但未使用 wecpy）
detected: true
framework: python
confidence: HIGH
python_version: "3.11"
project_structure: pyproject
wecpy_detected: false          # ⚠️ 未偵測到 wecpy

# 偵測成功（使用 wecpy 但尚未初始化）
detected: true
framework: python
confidence: HIGH
python_version: "3.11"
wecpy_detected: true
wecpy_initialized: false       # ⚠️ 缺少 config.yaml

# 偵測失敗
detected: false
reason: "No Python project files found"
```

> **責任分工**：Detector 僅輸出狀態旗標（`wecpy_detected`、`wecpy_initialized`）。
> `instructions_override` 填入、`wecpy_prompt_required` 判定、以及新/舊專案分流均由 **project-discovery Step 5** 負責。

---

## wecpy 偵測狀態與 AI 行為對應

> wecpy 是企業級共用 **Library**，非 API 框架。AI 必須在建立專案時詢問使用者選擇 API 框架（如 FastAPI、Flask 等），並將 wecpy 作為基礎設施層整合其中。

| `wecpy_detected` | `wecpy_initialized` | AI 行為                                                                                    |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------ |
| `true`           | `true`              | 正常進入 Inner Loop，自動載入 wecpy instructions                                           |
| `true`           | `false`             | 提示建立 `PROD/config.yaml` + `PILOT/config.yaml`，載入 wecpy 初始化指引                   |
| `false`          | —                   | **新專案**：強制使用 wecpy + 詢問 API 框架選擇；**既有專案**：詢問使用者確認               |
