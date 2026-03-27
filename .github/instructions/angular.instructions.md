---
applyTo: "**/*.ts,**/*.html,**/*.scss"
---

# Angular 17 編碼標準摘要

> 完整標準：`standards/coding-standard-angular.md`  
> 📌 Angular 為前端可選框架之一，非強制。前端基礎規範請參閱 `standards/coding-standard-frontend.md`。

## 元件強制規範

```typescript
// ✅ 所有元件必須 Standalone + OnPush
@Component({
  selector: "app-user-list",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  templateUrl: "./user-list.component.html",
})
export class UserListComponent {
  // ✅ RxJS BehaviorSubject（標準作法）
  protected readonly users$ = new BehaviorSubject<User[]>([]);
  protected readonly isLoading$ = new BehaviorSubject(false);
  protected readonly filteredUsers$ = this.users$.pipe(
    map(users => users.filter(u => u.isActive))
  );
}
```

## Smart / Dumb Component 分離

```typescript
// ✅ Smart（Container）— 處理資料，不負責 UI 樣式
@Component({ selector: 'app-user-page', standalone: true, ... })
export class UserPageComponent {
  private readonly userService = inject(UserService);
  protected readonly users$ = this.userService.getAll();
}

// ✅ Dumb（Presentational）— 只接受 Input，只 emit Output
@Component({ selector: 'app-user-card', standalone: true, ... })
export class UserCardComponent {
  @Input({ required: true }) user!: User;
  @Output() userSelected = new EventEmitter<User>();
}
```

## RxJS 狀態管理（標準作法）

```typescript
// ✅ BehaviorSubject 管理元件狀態
private readonly _users = new BehaviorSubject<User[]>([]);
protected readonly users$ = this._users.asObservable();

// ✅ async pipe 搭配 OnPush
// template: <div *ngFor="let u of users$ | async">...

// ⚠️ 若專案已採用 Signal API，請保持一致，勿混用
```

## RxJS 訂閱管理（防止記憶體洩漏）

```typescript
// ✅ takeUntilDestroyed（Angular 16+）
private readonly destroyRef = inject(DestroyRef);

this.service.getData()
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe(data => this.items.set(data));

// ❌ 禁止手動管理訂閱（除非有充分理由）
// this.subscription = ...subscribe();
// ngOnDestroy() { this.subscription.unsubscribe(); }
```

## Template 語法（Angular 17）

```html
<!-- ✅ @if / @for（新式） -->
@if (isLoading()) {
<app-loading-spinner />
} @else { @for (user of users(); track user.id) {
<app-user-card [user]="user" />
} @empty {
<p>No users found.</p>
} }

<!-- ❌ 禁止舊式 *ngIf / *ngFor（新專案） -->
```

## Service 設計

```typescript
// ✅ inject() 函式注入（Angular 14+）
@Injectable({ providedIn: "root" })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL_TOKEN);

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }
}

// ❌ 元件直接注入 HttpClient（必須透過 Service）
```

## 禁止事項

- ❌ `any` 型別（必須明確型別或使用 `unknown`）
- ❌ `ngOnDestroy + subscription.unsubscribe()`（改用 `takeUntilDestroyed`）
- ❌ `ChangeDetectionStrategy.Default`（必須 `OnPush`）
- ❌ 在 Component 直接呼叫 `HttpClient`
- ❌ 使用 `NgModule` 而非 Standalone（新元件）
- ❌ 在 Template 使用複雜邏輯（移至 Component 或 Pipe）

## 測試規範（Jest）

```typescript
// 最低覆蓋率 80%
describe("UserListComponent", () => {
  it("should display users when loaded", () => {
    const fixture = TestBed.createComponent(UserListComponent);
    const component = fixture.componentInstance;
    component.users.set([{ id: 1, name: "Alice" }]);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll("app-user-card"),
    ).toHaveLength(1);
  });
});
```
