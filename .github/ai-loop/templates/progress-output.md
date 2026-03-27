# Loop Progress Output — 每 Phase 完成的標準輸出模板

> 用途：Developer / Tester / Reviewer Phase 完成後的標準輸出格式。
> 確保 Loop 執行過程對使用者可讀，同時機器可解析。

---

## Developer Phase 輸出模板

```
### 🔧 Developer Phase Complete — Round {N}

**Framework**：{framework}
**Spec Hash**：`{spec_hash}`

#### 實作摘要

{一段描述本輪實作了什麼，約 2–3 行}

#### 建立/修改的檔案

| 動作 | 檔案路徑 | 說明 |
|------|----------|------|
| ✅ created | `src/...` | {一行說明} |
| ✅ modified | `src/...` | {一行說明} |

#### 設計決策

- {關鍵的設計決策或 trade-off，每項一行}
- {若遵循了某個設計模式，說明為何選擇}

#### 等候 Tester Phase 驗證...
```

> **>>> NEXT: Phase B (Tester) | Prompt: prompts/ai-loop-test.prompt.md <<<**
> 請立即執行 Phase Transition Protocol：輸出 PHASE A COMPLETE 宣告 → 更新 LoopState → 讀取 Tester Prompt

---

## Tester Phase 輸出模板（PASS）

```
### ✅ Tester Phase Passed — Round {N}

| 工具 | 狀態 | 詳情 |
|------|------|------|
| Lint (`{lint_cmd}`) | ✅ PASS | 0 errors, {N} warnings |
| Build (`{build_cmd}`) | ✅ PASS | 0 errors |
| Test (`{test_cmd}`) | ✅ PASS | {passed}/{total} passed, coverage {N}% |

**Warnings（不阻斷）：**
- `{error_id}`：{message}

#### 等候 Reviewer Phase...
```

> **>>> NEXT: Phase C (Reviewer) | Prompt: prompts/ai-loop-review.prompt.md <<<**
> 請立即執行 Phase Transition Protocol：輸出 PHASE B COMPLETE 宣告 → 更新 LoopState → 讀取 Reviewer Prompt

## Tester Phase 輸出模板（FAIL）

```
### ❌ Tester Phase Failed — Round {N}

| 工具 | 狀態 | 詳情 |
|------|------|------|
| Lint | {status} | {N} errors |
| Build | {status} | {N} errors |
| Test | {status} | {passed}/{total} passed |

**BLOCK 錯誤（必須修復）：**

| error_id | 工具 | 訊息 | 位置 |
|----------|------|------|------|
| `{error_id}` | {tool} | {message} | {file}:{line} |

**修復分析：**
{說明錯誤根因和修復計畫}

**→ 返回 Developer Phase（Round {N+1} 或 Heal 中...）**
```

---

## Reviewer Phase 輸出模板（PASS）

```
### ✅ Reviewer Phase Passed — Round {N}

| 維度 | 狀態 | 備注 |
|------|------|------|
| D0 spec_hash | ✅ | `{spec_hash}` 吻合 |
| A SOLID | ✅ | 無違規 |
| B DDD | ✅ | 無違規 |
| C Security | ✅ | 無高危問題 |
| D Clean Arch | ✅ | 無違規 |
| D1 {dim1_name} | ✅ | 無違規 |
| D2 {dim2_name} | ✅ | 無違規 |
| ...          | ...  | ... |

**建議（MEDIUM/LOW，不阻斷）：**
- {suggestion}

**🎉 Inner Loop 完成！所有 AC 通過。**
```

> **>>> NEXT: Phase D (Integration Tester) | Prompt: prompts/ai-loop-integration-test.prompt.md <<<**
> 請立即執行 Phase Transition Protocol：輸出 PHASE C COMPLETE 宣告 → 更新 LoopState → 讀取 Integration Test Prompt
> ⚠️ Phase D 是強制執行的，不得跳過。

## Reviewer Phase 輸出模板（FAIL）

```
### ❌ Reviewer Phase Failed — Round {N}

**HIGH severity 問題（必須修復）：**

| 維度 | 問題描述 | 位置 | 修復建議 |
|------|---------|------|---------|
| D3 Async | `.Result` 阻塞呼叫 | `UserRepo.cs:42` | 改用 `await` |

**MEDIUM/LOW 問題（建議修復）：**
- ...

**→ 返回 Developer Phase（Round {N+1}）**
```
