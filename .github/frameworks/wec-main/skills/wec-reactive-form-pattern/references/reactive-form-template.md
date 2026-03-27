# Reactive Form Template (WEC)

## Component 範本

```ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-query-form',
  templateUrl: './query-form.component.html'
})
export class QueryFormComponent {
  formGroup: FormGroup = this.fb.group({
    userName: ['', [Validators.required]],
    department: [''],
    email: ['', [Validators.required, Validators.email]]
  });

  constructor(private fb: FormBuilder) {}

  onSubmit(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.invalid) {
      return;
    }
    // TODO: submit
  }

  onReset(): void {
    this.formGroup.reset({
      userName: '',
      department: '',
      email: ''
    });
  }
}
```

## Template 範本

```html
<form [formGroup]="formGroup" class="fx-column small">
  <wec-form-item label="使用者名稱" required>
    <input nbInput formControlName="userName" type="text" />
    @if (formGroup.get('userName')?.touched && formGroup.get('userName')?.invalid) {
    <div class="text-danger">請輸入使用者名稱</div>
    }
  </wec-form-item>

  <wec-form-item label="部門">
    <nb-select formControlName="department" placeholder="請選擇部門">
      <nb-option value="IT">IT</nb-option>
      <nb-option value="HR">HR</nb-option>
    </nb-select>
  </wec-form-item>

  <wec-form-item label="Email" required>
    <input nbInput formControlName="email" type="email" />
    @if (formGroup.get('email')?.touched && formGroup.get('email')?.invalid) {
    <div class="text-danger">請輸入有效的 Email</div>
    }
  </wec-form-item>

  <div class="fx-row small">
    <button nbButton status="primary" type="button" (click)="onSubmit()">送出</button>
    <button nbButton status="basic" type="button" (click)="onReset()">重設</button>
  </div>
</form>
```
