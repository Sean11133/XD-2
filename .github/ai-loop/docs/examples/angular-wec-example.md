# Angular / WEC Framework E2E 範例

# 檔案 #36 | 完整的 Inner Auto Loop 執行演示

## 情境

在 `wec-main` 中建立一個新的 Angular Standalone Component，
顯示使用者清單，並從 `UserDataService` 獲取資料。

---

## Step 1：撰寫 Spec

建立檔案 `wec-main/.github/ai-loop/specs/user-list-feature.yaml`：

```yaml
spec_version: "1.0"
title: "UserListComponent"

scope:
  framework: auto
  targets:
    - path: src/app/features/user-list/

acceptance_criteria:
  - "建立 UserListComponent（standalone: true，使用 @if/@for）"
  - "注入 UserDataService 並呼叫 getUsers() 獲取 User[] 資料"
  - "所有 Jest 測試通過（覆蓋 init、render、data binding）"
  - "ESLint 無 error"

constraints:
  - "使用 Angular 17+ 的 @if / @for 語法（禁止 *ngIf / *ngFor）"
  - "UserDataService 繼承 WEC DataService 基底類別"

loop_config:
  max_rounds: 3
```

---

## Step 2：觸發 Loop

在 VS Code Copilot Chat 中輸入：

```
@ai-loop .github/ai-loop/specs/user-list-feature.yaml
```

---

## Step 3：預期的 Round 1 輸出

### Developer Agent 輸出（節錄）

```
╔══════════════════════════════════════════════════════╗
║  🔨 DEVELOPER  Round 1 / 3                          ║
╠══════════════════════════════════════════════════════╣
║  Framework : angular-wec                             ║
║  Spec Hash : UserListComponent|建立 UserList,注入,所有 ║
╠══════════════════════════════════════════════════════╣
║  FILES CHANGED                                       ║
║  [created] src/app/features/user-list/               ║
║  [created]   user-list.component.ts                  ║
║  [created]   user-list.component.html                ║
║  [created]   user-list.component.spec.ts             ║
╚══════════════════════════════════════════════════════╝
```

**建立的 `user-list.component.ts`（AC 對應說明）**：

```typescript
import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Subject, takeUntil } from "rxjs";
import { UserDataService } from "../../core/services/user-data.service";
import { User } from "../../core/models/user.model";

@Component({
  selector: "app-user-list",
  standalone: true, // ✅ AC-1: standalone: true
  imports: [CommonModule],
  templateUrl: "./user-list.component.html",
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  private readonly _destroy$ = new Subject<void>();

  constructor(private readonly userDataService: UserDataService) {} // ✅ AC-2

  ngOnInit(): void {
    this.userDataService
      .getUsers()
      .pipe(takeUntil(this._destroy$)) // ✅ D5.2: subscription cleanup
      .subscribe((users) => {
        this.users = users;
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
```

**`user-list.component.html`（@for / @if 語法）**：

```html
<!-- ✅ AC-1: Angular 17+ @for/@if 語法 -->
@if (users.length > 0) {
<ul>
  @for (user of users; track user.id) {
  <li>{{ user.name }}</li>
  }
</ul>
} @else {
<p>No users found.</p>
}
```

---

## Step 4：Tester Agent 輸出（Round 1 成功）

```
╔══════════════════════════════════════════════════════╗
║  🧪 TESTER  Round 1 / 3                             ║
╠══════════════════════════════════════════════════════╣
║  STEP RESULTS                                        ║
║  Lint   : ✅ PASS                                    ║
║  Test   : ✅ PASS                                    ║
║  Build  : ✅ PASS                                    ║
╠══════════════════════════════════════════════════════╣
║  BLOCK ERRORS  : 0                                   ║
║  WARNINGS      : 0                                   ║
║  RESULT        : ✅ PASS                             ║
╚══════════════════════════════════════════════════════╝
```

---

## Step 5：Reviewer Agent 輸出（Round 1 通過）

```
╔══════════════════════════════════════════════════════╗
║  🔍 REVIEWER  Round 1 / 3                           ║
╠══════════════════════════════════════════════════════╣
║  REVIEW DIMENSIONS                                   ║
║  D0 Spec Compliance   : ✅ All 4 AC satisfied       ║
║  D1 WEC Framework     : ✅ DataService 繼承確認      ║
║  D2 Component Arch    : ✅ standalone: true          ║
║  D3 Type Safety       : ✅ 無 any，Optional 處理正確 ║
║  D4 Error Handling    : ✅ catchError in Observable  ║
║  D5 Performance       : ✅ OnDestroy + takeUntil     ║
║  RESULT               : ✅ PASS                     ║
╚══════════════════════════════════════════════════════╝
```

---

## Step 6：Loop Summary

```
╔══════════════════════════════════════════════════════════════╗
║  ✅ COMPLETED IN 1 ROUND                                    ║
║  Task: UserListComponent                                    ║
╚══════════════════════════════════════════════════════════════╝

All acceptance criteria satisfied.
Lint ✅  |  Tests ✅  |  Build ✅  |  Review ✅

Files created  : 3
Files modified : 0
Warnings       : 0
```

---

## Round 2 重試範例（Tester 失敗情境）

若 Round 1 Tester 報告以下錯誤：

```yaml
errors:
  - error_id: "eslint-no-unused-vars-users-line10"
    description: "Variable 'users' is assigned a value but never used"
    file: "src/app/features/user-list/user-list.component.ts"
    line: 10
```

**Round 2 Developer 應只修復此特定錯誤**（Minimum Change Principle），
不得重寫整個元件。
