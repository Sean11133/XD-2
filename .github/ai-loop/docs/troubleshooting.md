# 疑難排解指南

# 檔案 #35 | 常見問題與解決方案

## Q1：Loop 沒有自動偵測框架

**症狀**：執行 `@ai-loop` 後，Copilot 說「無法偵測框架」

**解決方案**：

1. 確認 workspace 根目錄有 Marker Files
   - Angular: `angular.json` 必須存在
   - .NET: `*.sln` 或 `*.csproj` 必須存在
   - Python: `requirements.txt` + `setup.py` 必須存在

2. 在 `spec.yaml` 中手動指定框架：

   ```yaml
   scope:
     framework: angular-wec # 強制指定，跳過自動偵測
   ```

3. 確認 VS Code workspace folder 是否設定正確（專案根目錄）

---

## Q2：Tester Agent 的命令輸出 "SKIPPED"

**症狀**：Test 步驟顯示 ⏭️ SKIPPED

**解釋**：這是**正常行為**（Fast-Fail）

- Lint 失敗 → Test 自動 SKIP（因為 Lint 錯誤通常會造成 Test 也失敗）
- 節省 context token

**解決方案**：修復 Lint 錯誤後重啟

---

## Q3：Loop 在第 3 輪後觸發 Escape Hatch

**症狀**：看到 `---ESCAPE-DIAGNOSED---` 區塊

**可能原因**：

| 原因             | 診斷                                | 解決方案                            |
| ---------------- | ----------------------------------- | ----------------------------------- |
| Spec 過於複雜    | AC 超過 5 個                        | 拆分為多個小 Spec                   |
| 驗收條件描述模糊 | AC 用「良好」「適當」等模糊詞       | 改用具體且可測試的條件              |
| 循環依賴的錯誤   | `resolved_errors` 又出現在 `errors` | 手動修復核心衝突                    |
| Context 不足     | budget_pct > 80%                    | 關閉其他 Copilot 對話，增加 context |

---

## Q4：Developer Agent 沒有修復 Tester 報告的錯誤

**症狀**：Round 2 Developer 完成後，同樣的錯誤仍然存在

**診斷**：

1. 查看 Loop State 的 `errors[]` 是否有 error_id
2. 確認 Developer 的輸出有提到這些 error_id
3. 若沒有，可能是 Minimum Change Principle 誤判

**解決方案**：

- 在下一輪 prompt 前加上：`請確保修復以下 error_id: [list]`
- 或手動修復後重啟

---

## Q5：Reviewer Agent 一直 FAIL on D0

**症狀**：Reviewer 的 D0 Spec Compliance 一直 FAIL

**可能原因**：

1. `spec_hash` 不一致（Spec 被意外修改）
2. acceptance_criteria 描述與實作有根本差距
3. Developer 實作的 API 名稱與 AC 不符

**解決方案**：

1. 確認 spec.yaml 沒有在 Loop 中被修改
2. 更新 spec.yaml 的 AC，使用精確的類別名稱/方法名稱
3. 在 spec.yaml 的 `constraints` 中指定關鍵的 API 名稱

---

## Q6：context_budget 很快就超過 80%

**症狀**：第 1 輪就超過 80%

**解決方案**：

1. 關閉所有不相關的 Copilot Chat 對話
2. 不要在 prompt 中貼入大量程式碼
3. 使用 `@workspace` 而非將程式碼複製進 prompt
4. 考慮縮小 Spec scope（減少 AC 數量）

---

## Q7：偵測到震盪（Oscillation）

**症狀**：Loop State 中有 `oscillation_flags` 不為空

**解釋**：Round N 修復了某錯誤，但 Round N+1 Developer 又重新引入了它

**解決方案**：

1. Escape Hatch 通常會自動觸發（第 3 輪後）
2. 查看 `oscillation_flags` 中的 error_id
3. 手動修復牽涉的檔案中的根本衝突
4. 在 spec.yaml 的 `constraints` 中添加具體限制

---

## Q8：安裝腳本 (setup-angular.sh) 執行失敗

**症狀**：`./scripts/setup-angular.sh: Permission denied`

**解決方案**：

```bash
chmod +x scripts/setup-angular.sh
./scripts/setup-angular.sh /path/to/wec-main
```

---

## Q9：CI 驗證失敗（ai-loop-ci.yml）

**症狀**：GitHub Actions 顯示 `MISSING: .github/ai-loop/...`

**解決方案**：

1. 確認執行了安裝腳本
2. 確認目標專案中有完整的 `.github/ai-loop/` 目錄
3. 手動確認：`ls -la .github/ai-loop/`

---

## Q10：yaml.safe_load 報語法錯誤

**症狀**：CI 中 YAML 驗證步驟失敗

**解決方案**：

1. 檢查 `commands.yaml` 中是否有不合法的縮排
2. 使用線上 YAML 驗證工具確認
3. 特別注意多行字串（`|`）的縮排

---

## 快速診斷表

| 症狀         | 第一步確認                    | 文件參考                                                |
| ------------ | ----------------------------- | ------------------------------------------------------- |
| 框架未偵測   | Marker Files 存在？           | `adapters/*/detector.md`                                |
| Escape Hatch | `escape_trigger` 欄位是什麼？ | `core/escape-hatch.md`                                  |
| 震盪         | `oscillation_flags` 內容      | `instructions/ai-loop-anti-oscillation.instructions.md` |
| D0 FAIL      | spec_hash 是否一致？          | `instructions/ai-loop-protocols.instructions.md`        |
| Context 耗盡 | tokens_used / 37000           | `core/context-budget.md`                                |
