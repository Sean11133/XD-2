# Angular 編碼標準

> **適用範圍**：選用 Angular 17+ 的前端專案（含 WEC Angular 前端）  
> **Angular 版本**：17+  
> **最後更新**：2025-07  
> 📌 Angular 為前端可選框架之一，非強制。前端基礎規範請參閱 `standards/coding-standard-frontend.md`。

---

## 目錄

1. [核心原則](#1-核心原則)
2. [命名慣例](#2-命名慣例)
3. [檔案切分與組織](#3-檔案切分與組織)
4. [目錄與分層](#4-目錄與分層)
5. [元件設計規範](#5-元件設計規範)
6. [程式碼風格](#6-程式碼風格)
7. [RxJS 與狀態管理](#7-rxjs-與狀態管理)
8. [Template 語法規範](#8-template-語法規範)
9. [資料結構操作規範](#9-資料結構操作規範)
10. [測試規範](#10-測試規範)
11. [變更邊界](#11-變更邊界)

---

## 1. 核心原則

- **重用優先**：優先重用既有元件與能力，避免重造輪子。
- **單一職責**：單一檔案維持單一職責，避免把 UI、資料存取與流程控制混在一起。
- **最小變更**：變更以最小範圍為原則，避免不必要的大量重構。
- **Clean Architecture 思維**：即使是前端專案，也應以 Clean Architecture 思考職責分層，降低對 Angular 框架本身的耦合。
- **SOLID 與 DRY**：實作時應遵守 SOLID 與 DRY；若只是為了滿足名詞而增加不必要 class、interface 或層次，視為不合格設計。

---

## 2. 命名慣例

### 2.1 通則

| 對象              | 命名風格                      | 範例                                   |
| ----------------- | ----------------------------- | -------------------------------------- |
| 檔案名稱          | `kebab-case`                  | `user-list.component.ts`               |
| 類別（Class）     | PascalCase                    | `UserListComponent`                    |
| 介面（Interface） | PascalCase                    | `UserProfile`                          |
| 型別（Type）      | PascalCase                    | `DialogConfig`                         |
| 方法（Method）    | camelCase                     | `getUserById`                          |
| 屬性（Property）  | camelCase                     | `userName`                             |
| 變數              | camelCase                     | `currentPage`                          |
| 常數              | UPPER_SNAKE_CASE 或 camelCase | `MAX_RETRY_COUNT`、`defaultPageSize`   |
| 列舉（Enum）      | PascalCase（單數）            | `OrderStatus`                          |
| 列舉值            | PascalCase                    | `OrderStatus.Pending`                  |
| boolean 屬性      | `is` / `has` / `can` 前綴     | `isActive`、`hasPermission`、`canEdit` |
| 私有欄位          | `_camelCase`（沿用既有模式）  | `_userService`                         |

### 2.2 Angular 檔案命名

| 檔案類型  | 命名模式                        | 範例                         |
| --------- | ------------------------------- | ---------------------------- |
| 元件      | `{name}.component.ts/html/scss` | `user-list.component.ts`     |
| 服務      | `{name}.service.ts`             | `user.service.ts`            |
| 模型      | `{name}.model.ts`               | `user.model.ts`              |
| 介面      | `{name}.interface.ts`           | `dialog-config.interface.ts` |
| Pipe      | `{name}.pipe.ts`                | `date-format.pipe.ts`        |
| Directive | `{name}.directive.ts`           | `auto-focus.directive.ts`    |
| Guard     | `{name}.guard.ts`               | `auth.guard.ts`              |

### 2.3 範例

```typescript
// ✅ 正確命名
export class UserListComponent {
  protected readonly isLoading = signal(false);
  protected readonly hasPermission = signal(true);
  private readonly _userService = inject(UserService);

  protected getUserById(userId: number): void { ... }
}

// ❌ 錯誤命名
export class userList {                    // 類別應使用 PascalCase，且缺少 Component 後綴
  protected Loading = signal(false);       // boolean 應加 is 前綴，屬性應為 camelCase
  private userService = inject(UserService); // 私有欄位應加 _ 前綴
}
```

---

## 3. 檔案切分與組織

### 3.1 元件一律拆檔

Angular 元件必須拆分為獨立的 `.ts`、`.html`、`.scss` 三個檔案，禁止使用 inline `template` 或 inline `styles`。

```typescript
// ✅ 獨立檔案
@Component({
  selector: 'app-user-card',
  standalone: true,
  templateUrl: './user-card.component.html',
  styleUrl: './user-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCardComponent { ... }

// ❌ Inline template / styles
@Component({
  selector: 'app-user-card',
  template: `<div>{{ user.name }}</div>`,   // 禁止 inline template
  styles: [`div { color: red; }`],          // 禁止 inline styles
})
export class UserCardComponent { ... }
```

### 3.2 檔案切分原則

- `class` 採一個主要實體一個檔案，避免單檔多個大型 class。
- `interface` / `type` / `enum` 若為跨模組重用，應獨立檔案。
- 僅供單一檔案使用且結構簡單的 `interface` / `type`，可與主檔同檔。
- 避免在同一檔案混放過多型別宣告，維持可讀性與可維護性。

### 3.3 責任拆分

若某段邏輯已同時影響多個責任面向，應考慮拆成獨立模組，避免單一 class 持續膨脹。

```typescript
// ✅ 責任拆分：mapper、validator、policy 各自獨立
// user.mapper.ts
export function toUserDto(entity: UserEntity): UserDto { ... }

// order-discount.policy.ts
export class OrderDiscountPolicy {
  calculate(order: Order): number { ... }
}

// ❌ 所有邏輯塞在同一個 component
export class OrderPageComponent {
  mapToDto() { ... }         // 應拆到 mapper
  validateOrder() { ... }    // 應拆到 validator
  calculateDiscount() { ... } // 應拆到 policy
}
```

---

## 4. 目錄與分層

### 4.1 標準目錄結構

| 目錄                | 職責       | 放置內容                                         |
| ------------------- | ---------- | ------------------------------------------------ |
| `components/`       | 展示型元件 | 可重用 UI 區塊（Dumb Components）                |
| `views/`            | 頁面容器   | 頁面協調、流程編排與事件整合（Smart Components） |
| `services/`         | 資料存取   | 後端溝通、商業流程邏輯                           |
| `models/`、`beans/` | 資料結構   | interface、type、enum 定義                       |
| `shared/`           | 跨頁共用   | 對話框、工具類、共用片段                         |

### 4.2 分層原則

- 避免在 component 直接實作大量資料存取邏輯，優先下沉到 service。
- Angular 相關程式碼（DI、component lifecycle、template event binding、HttpClient）應盡量停留在 adapter 層，不要污染純 TS 核心。
- 可被其他前端框架重用的邏輯，優先拆成不依賴 Angular decorator、RxJS subscription lifecycle 與 DOM API 的純 TS 模組。

```typescript
// ✅ 純 TS 模組：不依賴 Angular，可被任何框架重用
// utils/date-formatter.ts
export function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale).format(date);
}

// ✅ Angular adapter 層：封裝 Angular 特有能力
// services/user-api.service.ts
@Injectable({ providedIn: "root" })
export class UserApiService {
  private readonly http = inject(HttpClient);
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>("/api/users");
  }
}

// ❌ 在 component 中直接呼叫 HttpClient
export class UserPageComponent {
  private readonly http = inject(HttpClient); // 應下沉到 service
}
```

---

## 5. 元件設計規範

### 5.1 Standalone + OnPush

所有元件必須使用 Standalone 模式與 OnPush 變更偵測策略。

```typescript
// ✅ Standalone + OnPush
@Component({
  selector: 'app-user-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent { ... }
```

### 5.2 Smart / Dumb 分離

```typescript
// ✅ Smart（Container）— 處理資料，不負責 UI 樣式
@Component({ selector: 'app-user-page', standalone: true, ... })
export class UserPageComponent {
  private readonly _userService = inject(UserService);
  protected readonly users$ = this._userService.getAll();
}

// ✅ Dumb（Presentational）— 只接受 Input，只 emit Output
@Component({ selector: 'app-user-card', standalone: true, ... })
export class UserCardComponent {
  @Input({ required: true }) user!: User;
  @Output() selected = new EventEmitter<User>();
}
```

### 5.3 Input / Output 命名

- Input 命名語意清楚，反映資料內容。
- Output 事件名稱使用動詞，描述發生的動作。

```typescript
// ✅ 語意清楚
@Input({ required: true }) user!: User;
@Input() isEditable = false;
@Output() saved = new EventEmitter<User>();
@Output() deleted = new EventEmitter<number>();

// ❌ 命名不清
@Input() data: any;           // 避免 any，名稱無語意
@Output() click = new EventEmitter(); // 與原生事件衝突
```

---

## 6. 程式碼風格

### 6.1 型別安全

優先使用明確型別，避免 `any`。

```typescript
// ✅ 明確型別
protected users: User[] = [];
protected getUser(id: number): User | undefined { ... }

// ❌ 使用 any
protected users: any[] = [];
protected getUser(id: any): any { ... }
```

### 6.2 成員排列順序

公開方法放在前段，私有輔助方法放在後段，維持一致順序：

1. 靜態成員
2. `@Input()` / `@Output()`
3. public / protected 屬性
4. private 屬性
5. constructor / `inject()`
6. 生命週期方法（`ngOnInit`、`ngOnDestroy` 等）
7. public / protected 方法
8. private 方法

### 6.3 降低複雜度

- 長函式先抽出私有方法，降低巢狀與重複邏輯。
- 若某段邏輯不需要 Angular 能力，不要放在 component 內；優先抽成純 function、domain service、mapper 或 policy class。
- 避免把 API response shape、UI state shape 與 domain 規則直接耦合在同一個 component class 內。
- 遇到重複的條件判斷、字串常數、資料轉換或欄位映射時，應先評估是否可抽成共用函式或 class，避免 copy-paste 擴散。

### 6.4 介面使用原則

只有一種實作且短期沒有替換需求時，不要為了形式先建立過多 interface；依賴反轉應用在真正需要替換或隔離框架/外部系統的邊界。

```typescript
// ✅ 有替換需求時才建立 interface（如隔離外部 API）
export interface UserRepository {
  findById(id: number): Observable<User | undefined>;
}

@Injectable({ providedIn: "root" })
export class HttpUserRepository implements UserRepository {
  private readonly http = inject(HttpClient);
  findById(id: number): Observable<User | undefined> {
    return this.http.get<User>(`/api/users/${id}`);
  }
}

// ❌ 不必要的 interface（只有一種實作且無替換需求）
export interface IUserFormatter {
  // 過度抽象
  format(user: User): string;
}
export class UserFormatter implements IUserFormatter {
  format(user: User): string {
    return user.name;
  }
}
```

---

## 7. RxJS 與狀態管理

### 7.1 BehaviorSubject 狀態管理

```typescript
// ✅ BehaviorSubject 管理元件狀態
private readonly _users = new BehaviorSubject<User[]>([]);
protected readonly users$ = this._users.asObservable();
protected readonly activeUsers$ = this._users.pipe(
  map(users => users.filter(u => u.isActive))
);
```

### 7.2 訂閱管理（防止記憶體洩漏）

RxJS 訂閱必須有釋放機制，優先使用 `takeUntilDestroyed`。

```typescript
// ✅ takeUntilDestroyed（Angular 16+，推薦）
private readonly _destroyRef = inject(DestroyRef);

ngOnInit(): void {
  this._userService.getUsers()
    .pipe(takeUntilDestroyed(this._destroyRef))
    .subscribe(users => this._users.next(users));
}

// ✅ async pipe（模板中自動管理訂閱）
// template: @for (user of users$ | async; track user.id) { ... }

// ❌ 手動管理訂閱（容易遺漏清理）
private _subscription!: Subscription;
ngOnInit(): void {
  this._subscription = this._service.getData().subscribe(...);
}
ngOnDestroy(): void {
  this._subscription.unsubscribe(); // 容易忘記
}
```

---

## 8. Template 語法規範

### 8.1 控制流程語法

一律使用 Angular 17+ 控制流程語法，禁止使用已過時的結構指令。

```html
<!-- ✅ Angular 17+ 新式控制流程 -->
@if (isLoading()) {
<app-spinner />
} @else if (users().length === 0) {
<p>目前沒有資料</p>
} @else { @for (user of users(); track user.id) {
<app-user-card [user]="user" (selected)="onSelect($event)" />
} @empty {
<p>清單為空</p>
} } @switch (status()) { @case ('active') {
<span class="badge-active">啟用</span> } @case ('inactive') {
<span class="badge-inactive">停用</span> } @default { <span>未知</span> } }

<!-- ❌ 過時的結構指令（禁止使用） -->
<div *ngIf="isLoading">Loading...</div>
<div *ngFor="let user of users">{{ user.name }}</div>
<div [ngSwitch]="status">
  <span *ngSwitchCase="'active'">啟用</span>
</div>
```

---

## 9. 資料結構操作規範

### 9.1 Map / Set 操作

`Map` / `Set` 必須使用其原生方法操作，禁止用 `[]` bracket notation 存取。

```typescript
// ✅ 使用原生方法操作 Map
const userMap = new Map<number, User>();
userMap.set(1, user); // 寫值
const found = userMap.get(1); // 讀值
const exists = userMap.has(1); // 判斷存在

// ❌ 使用 bracket notation（TypeScript 不報錯但永遠取到 undefined）
userMap[1] = user; // 不會寫入 Map
const found = userMap[1]; // 永遠是 undefined
const exists = userMap[1] !== undefined; // 永遠 false
```

---

## 10. 測試規範

### 10.1 基本原則

- 使用 Jest 作為測試框架。
- 元件測試使用 `@angular/core/testing` 的 `TestBed`。
- Service 測試優先使用 mock / stub 隔離外部依賴。
- 測試檔案與被測檔案同目錄，命名為 `{name}.spec.ts`。

### 10.2 測試範例

```typescript
// ✅ Service 測試
describe("UserService", () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it("should fetch users", () => {
    const mockUsers: User[] = [{ id: 1, name: "Alice", isActive: true }];
    service.getUsers().subscribe((users) => {
      expect(users).toEqual(mockUsers);
    });
    httpMock.expectOne("/api/users").flush(mockUsers);
  });
});
```

---

## 11. 變更邊界

- 未經明確要求，**不修改** `projects/wec-components/**` 與 `projects/wec-core/**`。
- 優先在業務頁面層組裝能力，不直接改共用 library 預設行為。
