# Loop Summary Template — Loop 完成後的總結報告

> 用途：Inner Loop 成功完成（Reviewer PASS）後，向使用者呈現整體執行摘要。

---

## 成功完成的 Loop Summary

```markdown
# ✅ AI Inner Loop 完成

**完成時間**：Round {N}, Phase: reviewer
**Framework**：{framework}
**執行統計**：{N} rounds, {total_phases} phases

---

## 交付摘要

### Spec 驗收條件

| #   | 驗收條件   | 狀態    |
| --- | ---------- | ------- |
| 1   | {AC1 描述} | ✅ 通過 |
| 2   | {AC2 描述} | ✅ 通過 |
| 3   | {AC3 描述} | ✅ 通過 |

### 建立/修改的檔案

| 動作        | 檔案路徑                                            |
| ----------- | --------------------------------------------------- |
| ✅ created  | `src/app/features/user/user-list.component.ts`      |
| ✅ created  | `src/app/features/user/user-list.component.spec.ts` |
| ✅ modified | `src/app/features/user/index.ts`                    |

---

## 品質報告

### 測試結果

- 測試通過率：**{passed}/{total}（{pct}%）**
- 程式碼覆蓋率：**{coverage}%**

### 程式碼審查

- SOLID 原則：✅ 無違規
- Clean Architecture：✅ 無違規
- DDD 原則：✅ 無違規
- Security：✅ 無高危問題
- {D1 維度名稱}：✅ 無違規
- {D2 維度名稱}：✅ 無違規

### 警告（不阻斷，建議後續處理）

- {warning 1}
- {warning 2}（或「無警告」）

---

## 設計亮點

{1–3 行描述本次實作中值得注意的設計決策，例如：使用了哪個 Design Pattern、為何選擇此架構}

---

## 後續建議

{來自 Reviewer 的後續建議，例如效能優化方向、未來擴充點}

**最終報告已由 ai-loop Phase E 自動產出：**
`docs/{NNN}-{需求簡述}/final-report.md`

> 如需重新產出或補充報告，可輸入：`@reporter 重新產出最終報告`
```

---

## 統計用欄位（供 Phase E / @reporter 引用）

```yaml
# 此區塊供最終報告自動整合
loop_summary:
  spec_title: "{spec.title}"
  spec_hash: "{spec_hash}"
  framework: "{framework}"
  total_rounds: { N }
  total_phases: { N }
  files_created: { N }
  files_modified: { N }
  # 單元測試統計（來自 Phase B）
  unit_tests_passed: { N }
  unit_tests_total: { N }
  unit_test_coverage_pct: { N }
  # 整合測試統計（來自 Phase D）
  integration_test_result: "{PASS | PARTIAL | SKIPPED}" # 新增
  integration_tests_passed: { N } # 新增
  integration_tests_total: { N } # 新增
  integration_test_tool: "{playwright | xunit-webapplicationfactory | pytest-httpx}" # 新增
  # 其他統計
  warnings_count: { N }
  heal_attempts_total: { N }
  completed_at: "Round {N}, Phase D {result}"
```
