# Integration Test Report Template — Phase D 整合測試結果

> 用途：Phase D（Integration Tester）完成後，以此格式輸出整合測試報告。
> 此報告內容由 @reporter 整合至 final-report.md 的第 4.4 章節。

---

## 整合測試完成報告（PASS）

```markdown
# ✅ 整合測試完成

**Framework**：{framework}
**測試工具**：{Playwright / xUnit WebApplicationFactory / pytest+httpx}
**執行結果**：PASS（{tests_passed}/{tests_total} 通過）
**Heal 次數**：{heal_attempts} 次

---

### 測試案例清單

| 測試檔案           | 測試案例數 | 通過 | 失敗 | 狀態    |
| ------------------ | ---------- | ---- | ---- | ------- |
| `{test_file_path}` | {N}        | {N}  | 0    | ✅ PASS |

---

### 對應 AC 覆蓋

| AC # | 驗收條件   | 整合測試案例             | 狀態    |
| ---- | ---------- | ------------------------ | ------- |
| AC-1 | {AC1 描述} | `{test method/describe}` | ✅ 通過 |
| AC-2 | {AC2 描述} | `{test method/describe}` | ✅ 通過 |
```

---

## 整合測試部分完成報告（PARTIAL）

```markdown
# ⚠️ 整合測試部分完成

**Framework**：{framework}
**測試工具**：{tool}
**執行結果**：PARTIAL（{tests_passed}/{tests_total} 通過，{tests_failed} 失敗）
**Heal 次數**：{heal_attempts} 次（已達上限）
**是否返回 Inner Loop**：{是 / 否}

---

### 測試案例清單

| 測試檔案           | 測試案例數 | 通過     | 失敗     | 狀態       |
| ------------------ | ---------- | -------- | -------- | ---------- |
| `{test_file_path}` | {N}        | {pass_N} | {fail_N} | ⚠️ PARTIAL |

---

### 失敗案例分析

| 測試案例      | 失敗類型             | 原因           | 建議處理方式                                 |
| ------------- | -------------------- | -------------- | -------------------------------------------- |
| `{test_name}` | TYPE_C（環境問題）   | {失敗原因描述} | 設定 TestDB 連線字串於 appsettings.Test.json |
| `{test_name}` | TYPE_A（測試程式碼） | {失敗原因描述} | 修正 Playwright selector                     |

---

### 說明

整合測試 PARTIAL 為可接受的交付狀態。失敗項目已記錄於最終報告，
建議在下一個 Sprint 修復上述失敗案例。
```

---

## 統計用欄位（供 @reporter 引用）

```yaml
# 此區塊供最終報告 Section 4.4 自動整合
integration_test_summary:
  result: "{PASS | PARTIAL | SKIPPED}"
  framework: "{framework}"
  test_tool: "{playwright | xunit-webapplicationfactory | pytest-httpx}"
  tests_total: { N }
  tests_passed: { N }
  tests_failed: { N }
  tests_skipped: { N }
  heal_attempts: { N }
  returned_to_inner_loop: { true | false }
  failed_tests_summary:
    - test: "{test_name}"
      failure_type: "{TYPE_A | TYPE_B | TYPE_C | TYPE_D}"
      reason: "{reason}"
```
