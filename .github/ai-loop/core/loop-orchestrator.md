# Inner Auto Loop — Loop Orchestrator（Template Method 骨架）

> 檔案角色：Core Orchestrator | 設計模式：Template Method + Chain of Responsibility

## 概述

Loop Orchestrator 定義了 Inner Auto Loop 的**固定執行骨架**：

```
Framework Detection → Developer Phase → Tester Phase → Reviewer Phase → Done
```

每個 Phase 的**演算法骨架**固定，但具體指令（lint command、review dimensions 等）由 Framework Adapter 提供（Strategy Pattern）。

---

## 演算法骨架（Template Method）

```
LOOP BEGIN
│
├─ Step 0: init_loop(spec)
│    ├── 計算 spec_hash
│    ├── 初始化 LoopState（round=1, phase=init）
│    └── 載入 Framework Adapter（Chain of Responsibility → adapter-registry）
│
├─ Step 0.5: project_discovery()       [新增 — 僅既有專案觸發]
│    ├── 判斷是否為既有專案（規則見 project-discovery.md）
│    ├── 新專案 / 使用者指定 "@dev new project" → 跳過
│    ├── 既有專案 → 執行 project-discovery.md 完整流程
│    ├── 生成 project-profile.yaml
│    └── 輸出 PROJECT-DISCOVERY 狀態區塊
│
│ ⏸️ HUMAN INTERVENTION GATE #1 — Framework Initialization
│    ├── 讀取 project-profile.yaml 中的 initialization_required 欄位
│    ├── 若 initialization_required = false → 繼續 Step 1
│    └── 若 initialization_required = true →
│         ├── 輸出 Human Intervention Gate 宣告（gate_type: FRAMEWORK_INIT）
│         ├── 輸出 LoopState（result: HUMAN_REQUIRED）
│         └── ⛔ 完全停止，等待使用者執行初始化後 @dev resume
│
├─ Step 1: detect_framework()       [Chain of Responsibility]
│    ├── 嘗試 angular-wec/detector.md
│    ├── 嘗試 dotnet/detector.md
│    ├── 嘗試 python/detector.md
│    └── 若全部失敗 → Escape Hatch（framework_unknown）
│
│ ⏸️ HUMAN INTERVENTION GATE #2 — Architecture Decision
│    ├── 判斷是否有未決的架構選擇（Python API 框架、.NET iMX 版本等）
│    ├── 若使用者已明確指定框架選項 → 跳過
│    └── 若需要使用者選擇 →
│         ├── 輸出 Human Intervention Gate 宣告（gate_type: ARCHITECTURE_DECISION）
│         ├── 列出選項供使用者選擇（使用 options[] 格式）
│         ├── 輸出 LoopState（result: HUMAN_REQUIRED）
│         └── ⛔ 完全停止，等待使用者選擇後 @dev resume
│
└─ ROUND LOOP（最多 5 rounds）
     │
     ├─ Phase A: developer_phase(adapter, spec, loopState)
     │    ├── [Pre-Flight Check] 每次進入此 Phase 強制自檢（round 1 及後續 Heal 均執行）：
     │    │    ├── ① framework instructions 已根據 project-profile/adapter 正確綁定並載入？
     │    │    ├── ② plan.md Section 1.5 規範基線表已閱讀並記錄約束條件？
     │    │    ├── ③ 若 round > 1（Heal 路徑）→ 重新載入 instructions，不使用快取版本？
     │    │    └── ④ 當前 Task 是否有對應的框架 Skill 可參考（frameworks/{name}/skills/）？
     │    ├── 讀取 spec + plan.md（含 Section 1.5 規範基線表作為硬性約束）
     │    ├── 載入 adapter.getInstructionsPath() 的 instructions
     │    ├── 若有 project-profile.yaml → 載入 instructions_override
     │    ├── 查詢 frameworks/{framework}/skills/ 確認是否有對應 Task 的開發 Skill 可參考
     │    ├── 實作程式碼（遵循 standards/ 與架構的漸進式合規原則）
     │    ├── 產出單元測試（Unit Tests）
     │    └── 輸出 LoopState（phase=developer, result=PASS/FAIL）
     │
     │ >>> TRANSITION CHECKPOINT A→B <<<
     │ MUST: 輸出 === PHASE A COMPLETE | round: {N} | result: PASS ===
     │ MUST: 更新並輸出 LoopState
     │ MUST: 輸出 >>> ENTERING PHASE B (Tester) <<< 並讀取 prompts/ai-loop-test.prompt.md
     │
     ├─ Phase B: tester_phase(adapter, loopState)     [僅在 developer PASS 後]
     │    ├── 執行 adapter.getLintCommand()            [Fast-Fail]
     │    ├── 若 Lint FAIL → LoopState(result=FAIL) → 返回 Phase A
     │    ├── 執行 adapter.getBuildCommand()           [Fast-Fail]
     │    ├── 若 Build FAIL → LoopState(result=FAIL) → 返回 Phase A
     │    ├── 執行 adapter.getTestCommand()（單元測試）
     │    ├── 解析輸出（adapter error-parser.md）
     │    ├── 若 Test FAIL → Heal（最多 3 次）→ 若仍 FAIL → 返回 Phase A
     │    └── 輸出 LoopState（phase=tester, result=PASS/FAIL）
     │
     │ >>> TRANSITION CHECKPOINT B→C <<<
     │ MUST: 輸出 === PHASE B COMPLETE | round: {N} | result: PASS ===
     │ MUST: 更新並輸出 LoopState
     │ MUST: 輸出 >>> ENTERING PHASE C (Reviewer) <<< 並讀取 prompts/ai-loop-review.prompt.md
     │
     ├─ Phase C: reviewer_phase(adapter, loopState)   [僅在 tester PASS 後]
     │    ├── 驗證 spec_hash（D0）
     │    ├── 執行 SOLID/CleanArch/DDD/Security 通用審查（A–E 維度）
     │    ├── 載入 adapter.getReviewDimensions()（框架特有審查）
     │    ├── ⏸️ HUMAN INTERVENTION GATE #3 — Security Review
     │    │    ├── 若發現 🔴 Security 問題（OWASP Top 10 等級）→
     │    │    │    ├── 輸出 Human Intervention Gate 宣告（gate_type: SECURITY_REVIEW）
     │    │    │    ├── 輸出 LoopState（result: HUMAN_REQUIRED）
     │    │    │    └── ⛔ 完全停止，**不允許 AI 自動修復安全漏洞**，等待人工審查後 @dev resume
     │    │    └── 若無 Security 問題 → 繼續一般 🔴 High 處理
     │    ├── 若任一非 Security 的 🔴 High severity → LoopState(result=FAIL) → round++, Phase A
     │    └── 輸出 LoopState（phase=reviewer, result=PASS/FAIL）
     │
     ├─ 若 reviewer PASS → 跳出 ROUND LOOP
     │
     └─ 若 rounds >= 5 OR oscillation_detected → Escape Hatch

├─ Phase D: integration_test_phase(adapter, loopState)  [新增 — Inner Loop 完成後強制執行]
│
│ >>> TRANSITION CHECKPOINT C→D (MANDATORY) <<<
│ MUST: 輸出 === PHASE C COMPLETE | round: {N} | result: PASS ===
│ MUST: 輸出 >>> ENTERING PHASE D (Integration Tester) <<<
│ MUST: 讀取 prompts/ai-loop-integration-test.prompt.md  ← 進入 Phase D 前必須讀取
│
│    ├── 讀取 plan.md 的 Integration Test 範圍
│    ├── 讀取 project-profile.yaml 的 existing_tests.integration 設定
│    ├── 若 already_configured=false → 執行 adapter.getIntegrationTestSetupCommand()
│    ├── 撰寫整合測試（參考 prompts/ai-loop-integration-test.prompt.md）
│    ├── 執行 adapter.getIntegrationTestCommand()
│    ├── 失敗 → Heal（最多 3 次）
│    ├── Heal 涉及業務邏輯（類型 B）→ 返回 Inner Loop Phase A 重新驗證
│    ├── 3 次 Heal 仍失敗 → result=PARTIAL（不觸發 Escape Hatch）
│    └── 輸出 IntegrationTestState（PASS / PARTIAL）
│
└─ Phase E: reporter_phase(adapter, loopState, integrationTestState)  [Phase D 完成後強制執行]
│
│ >>> TRANSITION CHECKPOINT D→E (MANDATORY) <<<
│ MUST: 輸出 === PHASE D COMPLETE | result: {PASS|PARTIAL|SKIPPED} ===
│ MUST: 輸出 >>> ENTERING PHASE E (Reporter) <<<
│ MUST: 讀取 prompts/final-report.prompt.md  ← 進入 Phase E 前必須讀取（PASS/PARTIAL/SKIPPED 均執行）
│
     ├── 讀取需求工作區中的 spec.md + plan.md
     ├── 彙整所有 rounds 的 LoopState（cumulative_changes、errors 歷史）
     ├── 讀取 Phase D 的 IntegrationTestState（含整合測試統計與失敗案例）
     ├── 依 templates/final-report.md 格式產出含完整測試報告的最終交付文件
     │    ├── Section 4.1-4.3 單元測試統計與修復記錄（來自 Phase B LoopState）
     │    └── Section 4.4 整合測試結果（來自 Phase D IntegrationTestState）
     ├── 使用 edit/editFiles 直接寫入 docs/{NNN}-{需求簡述}/final-report.md
     └── 報告產出失敗不觸發 Escape Hatch（最後一步，不影響程式碼品質）
```

---

## 各 Phase 的職責邊界

| Phase              | 職責                                | 不應做                            |
| ------------------ | ----------------------------------- | --------------------------------- |
| Developer          | 實作符合 spec.md 的程式碼和單元測試 | 不執行測試、不審查品質            |
| Tester             | 執行單元測試工具並分析輸出          | 不寫新程式碼（只修 BLOCK 類錯誤） |
| Reviewer           | 依審查標準評估程式碼品質            | 不執行測試工具、不重新實作        |
| Integration Tester | 執行整合測試（跨層、跨模組互動）    | 不重複單元測試已驗證的邏輯        |
| Reporter           | 彙整所有產出，寫入 final-report.md  | 不修改程式碼、不執行測試          |

---

## Escape Hatch 觸發（escape-hatch.md 詳細定義）

以下任一條件觸發 Escape Hatch：

```
rounds >= 5
oscillation_flags.length >= 1 (相同 error_id 出現 3+ 次)
context_budget.budget_pct > "90%"
SECURITY_RISK error detected
spec_hash mismatch (D0 審查失敗)
```

---

## Adapter 介面呼叫順序

```yaml
# Step 1: Framework Detection
adapter = adapter-registry.resolve(project_root)

# Step 2: 取得各 Phase 所需資訊
framework_name:  adapter.getFrameworkName()
instructions:    adapter.getInstructionsPath()      # Developer Phase 使用
lint_cmd:        adapter.getLintCommand()            # Tester Phase 使用
test_cmd:        adapter.getTestCommand()            # Tester Phase 使用
build_cmd:       adapter.getBuildCommand()           # Tester Phase 使用
error_parser:    adapter.parseErrorOutput()          # Tester Phase 使用
review_dims:     adapter.getReviewDimensions()       # Reviewer Phase 使用
it_cmd:          adapter.getIntegrationTestCommand()      # Integration Tester Phase 使用
it_setup_cmd:    adapter.getIntegrationTestSetupCommand() # Integration Tester Phase 環境設定
```
