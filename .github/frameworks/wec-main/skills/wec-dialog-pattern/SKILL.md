---
name: wec-dialog-pattern
description: This skill should be used when the user asks to "建立 Dialog", "做彈窗", "Modal 怎麼寫", "表單 Dialog", "確認框", "cdkDrag Dialog", "dialogAnimation 怎麼用", or wants to create a WEC-compliant dialog component.
---

# WEC Dialog Pattern Skill

建立符合 WEC Framework 規範的 Dialog 元件，涵蓋表單型、確認框型與訊息型三種常見樣式。

## Purpose

- 統一 Dialog 結構（`nb-card` + `dialogAnimation` + `cdkDrag`）。
- 提供三種 Dialog 類型的骨架，快速選擇套用。
- 避免自行拼裝容器或使用原始 HTML div 建構 Dialog。

## Trigger Intent

在以下情境使用：

- 使用者需要建立表單編輯 Dialog（新增/編輯資料）。
- 使用者需要確認框（刪除確認、操作確認）。
- 使用者需要訊息提示（成功、警告、錯誤）Dialog。
- 使用者問 `cdkDrag`、`dialogAnimation`、`NbDialogService` 怎麼使用。

## Dialog 類型選擇

| 需求            | Dialog 類型    | 特徵                        |
| --------------- | -------------- | --------------------------- |
| 新增 / 編輯資料 | **表單型 (A)** | nb-card-body 含表單欄位     |
| 刪除 / 操作確認 | **確認型 (B)** | 簡短訊息 + 確認/取消按鈕    |
| 狀態提示 / 說明 | **訊息型 (C)** | 圖示 + 說明文字，只有關閉鈕 |

## Workflow

### 1) 讀取 Dialog 規範

讀取 `../../../../instructions/angular-comp-practices.instructions.md` 的 `## Dialog 實作規範`。

### 2) 建立 Dialog Component

產生 standalone Dialog component，必含：

- `animations: [dialogAnimation]`
- `nb-card` 作為根容器 + `@dialogAnimation`
- `cdkDrag` 拖曳（含 `cdkDragRootElement` 與 `cdkDragHandle`）

### 3) 依類型選擇骨架

#### 類型 A：表單型 Dialog

```html
<nb-card
  @dialogAnimation
  style="width: 560px; resize: both;"
  cdkDrag
  cdkDragRootElement=".cdk-overlay-pane"
  cdkDragBoundary="body"
>
  <nb-card-header
    class="fx-row space-between middle medium"
    style="cursor: move;"
    cdkDragHandle
  >
    <span>表單標題</span>
    <nb-actions size="small">
      <nb-action icon="close-outline" (click)="onClose()"></nb-action>
    </nb-actions>
  </nb-card-header>

  <nb-card-body class="fx-column start medium">
    <form [formGroup]="formGroup">
      <wec-form-item label="欄位名稱" labelWidth="90px" required>
        <input nbInput formControlName="fieldName" type="text" />
      </wec-form-item>
      <!-- 依需求增加欄位 -->
    </form>
  </nb-card-body>

  <nb-card-footer class="fx-row end middle small">
    <button nbButton status="basic" (click)="onClose()">取消</button>
    <button nbButton status="primary" (click)="onSave()">儲存</button>
  </nb-card-footer>
</nb-card>
```

```typescript
import { Component } from "@angular/core";
import { NbDialogRef } from "@nebular/theme";
import { dialogAnimation } from "@wec/components";
import { FormBuilder, Validators } from "@angular/forms";

@Component({
  standalone: true,
  animations: [dialogAnimation],
  // imports: [CommonModule, ReactiveFormsModule, NebularModule, WecComponentsModule],
  templateUrl: "./feature-edit-dialog.component.html",
})
export class FeatureEditDialogComponent {
  formGroup = this.fb.group({
    fieldName: ["", Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private dialogRef: NbDialogRef<FeatureEditDialogComponent>,
  ) {}

  onSave() {
    if (this.formGroup.valid) {
      this.dialogRef.close(this.formGroup.value);
    }
  }

  onClose() {
    this.dialogRef.close();
  }
}
```

#### 類型 B：確認型 Dialog

```html
<nb-card
  @dialogAnimation
  style="width: 400px;"
  cdkDrag
  cdkDragRootElement=".cdk-overlay-pane"
  cdkDragBoundary="body"
>
  <nb-card-header
    class="fx-row space-between middle medium"
    style="cursor: move;"
    cdkDragHandle
  >
    <span>確認操作</span>
    <nb-actions size="small">
      <nb-action icon="close-outline" (click)="onCancel()"></nb-action>
    </nb-actions>
  </nb-card-header>

  <nb-card-body class="fx-column center middle medium">
    <nb-icon
      icon="alert-triangle-outline"
      status="warning"
      style="font-size: 48px;"
    ></nb-icon>
    <p class="paragraph text-basic">確定要刪除此筆資料嗎？此操作無法復原。</p>
  </nb-card-body>

  <nb-card-footer class="fx-row end middle small">
    <button nbButton status="basic" (click)="onCancel()">取消</button>
    <button nbButton status="danger" (click)="onConfirm()">確認刪除</button>
  </nb-card-footer>
</nb-card>
```

#### 類型 C：訊息型 Dialog

```html
<nb-card
  @dialogAnimation
  style="width: 360px;"
  cdkDrag
  cdkDragRootElement=".cdk-overlay-pane"
  cdkDragBoundary="body"
>
  <nb-card-header
    class="fx-row space-between middle medium"
    style="cursor: move;"
    cdkDragHandle
  >
    <span>通知</span>
    <nb-actions size="small">
      <nb-action icon="close-outline" (click)="onClose()"></nb-action>
    </nb-actions>
  </nb-card-header>

  <nb-card-body class="fx-column center middle medium">
    <nb-icon
      icon="checkmark-circle-outline"
      status="success"
      style="font-size: 48px;"
    ></nb-icon>
    <p class="paragraph text-basic">{{ message }}</p>
  </nb-card-body>

  <nb-card-footer class="fx-row end middle small">
    <button nbButton status="primary" (click)="onClose()">關閉</button>
  </nb-card-footer>
</nb-card>
```

### 4) 呼叫 Dialog

從父元件使用 `NbDialogService` 開啟：

```typescript
import { NbDialogService } from '@nebular/theme';

constructor(private dialogService: NbDialogService) {}

openEditDialog(data?: any) {
  const ref = this.dialogService.open(FeatureEditDialogComponent, {
    context: { data },
    closeOnBackdropClick: false,
  });

  ref.onClose.subscribe((result) => {
    if (result) {
      // 處理回傳資料
      this.loadData();
    }
  });
}
```

## Checklist

- [ ] Dialog component 有 `animations: [dialogAnimation]`
- [ ] 根容器使用 `nb-card` + `@dialogAnimation`
- [ ] 已加入 `cdkDrag`、`cdkDragRootElement`、`cdkDragBoundary`
- [ ] `nb-card-header` 有 `cdkDragHandle` + `style="cursor: move;"`
- [ ] 表單型 Dialog 有 `[formGroup]` + `formControlName`
- [ ] 父元件使用 `NbDialogService.open()` 呼叫

## Additional Resources

- `../../../../instructions/angular-comp-practices.instructions.md` — Dialog 實作規範（必讀）
- `../../instructions/wec-component-selection.instructions.md` — 元件選型
- `../../instructions/wec-styling-system.instructions.md` — Layout / 樣式
- `../../../../instructions/angular-page-layouts.instructions.md` — 含 A + Dialog(B) 組合版型
