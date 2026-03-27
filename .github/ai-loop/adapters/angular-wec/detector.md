# Angular WEC Adapter — Framework Detector

> Chain of Responsibility 節點：偵測當前 project 是否為 Angular + WEC Component Library 專案。

## 偵測邏輯

### 主要偵測條件（ALL 必須成立）

| 優先級 | 條件                                               | 查找位置       |
| ------ | -------------------------------------------------- | -------------- |
| 必要   | `package.json` 存在                                | project root   |
| 必要   | `@angular/core` 在 dependencies 或 devDependencies | `package.json` |
| 必要   | `angular.json` 或 `.angular-cli.json` 存在         | project root   |

### WEC 特有偵測條件（至少 1 個成立即確認為 WEC 專案）

| 條件                                     | 查找位置                     |
| ---------------------------------------- | ---------------------------- |
| `@wec/component-library` 在 dependencies | `package.json`               |
| `@wec/ui` 在 dependencies                | `package.json`               |
| `WecModule` 在 import                    | 任意 `*.module.ts` 或 `*.ts` |
| `wec-*` 在 HTML templates                | 任意 `*.html`                |

### 版本要求

| 套件            | 最低版本 | 建議版本 |
| --------------- | -------- | -------- |
| `@angular/core` | 17.0.0   | 17.x     |
| `typescript`    | 5.0.0    | 5.x      |
| Node.js         | 18.0.0   | 20.x LTS |

---

## 偵測流程

```
1. 在 project root 尋找 package.json
   └─ 不存在 → return false（非 Node 專案）

2. 解析 package.json
   └─ 無 @angular/core → return false

3. 確認 angular.json 存在
   └─ 不存在 → return false（非 Angular CLI 專案）

4. 檢查 WEC 特有標誌
   └─ 任一條件成立 → 進入步驟 5（angular-wec confirmed）
   └─ 全部不成立 → return false（一般 Angular 專案，非 WEC）

5. Fork 流程狀態驗證（所有 Angular WEC 專案強制執行）
   ├─ 執行 `git remote -v` 檢查 remote 設定
   ├─ 驗證 upstream remote 是否存在且指向 wec-main
   │    ├─ upstream 包含 cim-framework/ui-framework/wec-main
   │    │    → fork_status: CONFIGURED
   │    └─ upstream 不存在或指向其他 repo
   │         → fork_status: NOT_CONFIGURED
   ├─ 驗證 origin remote 是否為 fork（非原始 repo）
   │    ├─ origin ≠ cim-framework/ui-framework/wec-main
   │    │    → fork_origin: VALID
   │    └─ origin = cim-framework/ui-framework/wec-main（直接 clone 非 fork）
   │         → fork_origin: DIRECT_CLONE（需轉為 fork 流程）
   └─ 檢查 submodule/npm 模式
        ├─ .gitmodules 存在且含 wec-core / wec-components
        │    → dependency_mode: submodule
        ├─ @wec/core 或 @wec/components 在 package.json dependencies
        │    → dependency_mode: npm
        └─ 兩者皆無 → dependency_mode: NOT_INITIALIZED

注意：所有 Angular 專案均強制使用 WEC fork 流程。
不存在「非 WEC 的純 Angular 專案」，偵測到 Angular 即視為 WEC 專案。
```

---

## 偵測結果

```yaml
# 偵測成功（fork 已正確設定）
detected: true
framework: angular-wec
confidence: HIGH
angular_version: "17.3.0"
project_root: "."
fork_status: CONFIGURED        # upstream 已指向 wec-main
fork_origin: VALID             # origin 為 fork repo
dependency_mode: submodule     # submodule | npm | NOT_INITIALIZED

# 偵測成功（但 fork 未設定 — 需引導初始化）
detected: true
framework: angular-wec
confidence: HIGH
angular_version: "17.3.0"
project_root: "."
fork_status: NOT_CONFIGURED    # ⚠️ 必須先完成 fork 流程
fork_origin: DIRECT_CLONE      # ⚠️ 非 fork，是直接 clone
dependency_mode: NOT_INITIALIZED

# 偵測失敗（傳給下一個 adapter）
detected: false
reason: "WEC component library not found in package.json"
```

> **責任分工**：Detector 僅輸出狀態旗標（`fork_status`、`fork_origin`、`dependency_mode`）。
> `initialization_required` 判定、`instructions_override` 填入、以及引導至哪個 skill 均由 **project-discovery Step 5** 與 **@dev agent** 負責。

---

## Fork 狀態與 AI 行為對應

| `fork_status`             | `dependency_mode`   | AI 行為                                                |
| ------------------------- | ------------------- | ------------------------------------------------------ |
| `CONFIGURED`              | `submodule` / `npm` | 正常進入 Inner Loop 開發                               |
| `CONFIGURED`              | `NOT_INITIALIZED`   | 提示執行 `npm install` 或 `git submodule update`       |
| `NOT_CONFIGURED`          | 任何值              | **中斷開發流程**，引導至 `wec-framework-install` skill |
| 非 git repo（無 `.git/`） | —                   | 若為 `@dev new project` → 引導完整 fork 流程；否則報錯 |
