# Copilot Instructions for wec-core

這個核心庫提供 WEC Framework 的企業級服務、工具類、模型和管道，基於 Angular 17+ 開發。  
請始終使用這些核心服務而不是重複實作相同功能。

## 核心服務架構

### 1. **DataService** - 基底服務類別

**所有自定義服務都必須繼承 DataService**

- **基本用法：**

  ```typescript
  @Injectable({ providedIn: 'root' })
  export class YourService extends DataService {
    protected get app(): string {
      return AppConfig.get('app');
    }

    constructor(injector: Injector) {
      super(injector);
    }
  }
  ```

- **主要方法：**
  - `post(relativeURL: string, data: any, showBusy?: boolean, busyMessage?: string)` - HTTP POST 請求
  - `get(relativeURL: string, showBusy?: boolean)` - HTTP GET 請求
  - `log(level: LogLevel, func: string, msg: string)` - 系統日誌記錄

- **自動功能：**
  - 自動載入指示器 (Busy Indicator)
  - 錯誤處理和日誌記錄
  - 主機 URL 自動設定

## 認證與安全服務

### 2. **AuthService** - 認證服務

處理使用者驗證、SSO 登入和權限管理。

- **主要方法：**

  ```typescript
  // 表單登入
  login(username: string, password: string): ReplaySubject<any>

  // iMX 帳號登入
  loginWithImxAccount(username: string, password: string): ReplaySubject<any>

  // SSO 登入
  sso(): ReplaySubject<any>

  // 登出
  logout(): void

  // 模擬登入
  impersonate(username: string): ReplaySubject<any>

  // 取得導航權限
  getNavigations(): ReplaySubject<any>
  ```

- **使用範例：**

  ```typescript
  constructor(private authService: AuthService) {}

  login() {
    this.authService.login(this.username, this.password)
      .subscribe({
        next: (response) => {
          // 登入成功處理
          UserContext.token = response.token;
        },
        error: (error) => {
          // 錯誤處理
        }
      });
  }
  ```

### 3. **AuthGuard** - 路由守衛

基於使用者權限的路由保護。

- **使用方式：**
  ```typescript
  const routes: Routes = [
    {
      path: 'protected',
      component: ProtectedComponent,
      canActivate: [AuthGuard]
    }
  ];
  ```

## 狀態管理與配置

### 4. **UserContext** - 使用者上下文

管理 sessionStorage 中的使用者狀態和會話資料。

- **主要屬性：**

  ```typescript
  // 使用者資訊
  UserContext.username: string
  UserContext.section: string
  UserContext.token: string
  UserContext.securityLevel: string
  UserContext.ipAddress: string
  UserContext.loginMode: 'sso' | 'form'

  // 導航和權限
  UserContext.navigations: Navigations
  UserContext.resources: Resources

  // 使用者設定
  UserContext.setting: UserSettingModel
  ```

- **常用方法：**

  ```typescript
  // 檢查權限
  UserContext.hasPermission(resourceId: string): boolean

  // 清除會話
  UserContext.invalidate(): void

  // 檢查登入狀態
  UserContext.isLoggedIn(): boolean
  ```

### 5. **AppConfig** - 應用程式配置

從 `app-config.json` 載入和管理系統配置。

- **使用方式：**

  ```typescript
  // 取得配置值
  const apiUrl = AppConfig.get('apiUrl');
  const appName = AppConfig.get('app');
  const location = AppConfig.location;

  // 取得系統配置
  const systemConfig = AppConfig.Systems['your-app'];
  const webAPI = AppConfig.Systems['your-app'].webAPI;
  ```

## 事件通訊系統

### 6. **EventBusManager** - 事件匯流排

跨元件和服務的事件通訊機制。

- **主要方法：**

  ```typescript
  // 訂閱事件
  EventBusManager.subscribe(topic: string, listener: Function): Subscription

  // 發布事件
  EventBusManager.publish(topic: string, event: any): void

  // 取消訂閱
  EventBusManager.unsubscribe(subscription: Subscription): void

  // 清理所有訂閱
  EventBusManager.destroy(): void
  ```

- **使用範例：**

  ```typescript
  export class ComponentA {
    private subscription: Subscription;

    ngOnInit() {
      // 訂閱事件
      this.subscription = EventBusManager.subscribe('user-updated', (data) => {
        console.log('User updated:', data);
      });
    }

    ngOnDestroy() {
      // 清理訂閱
      EventBusManager.unsubscribe(this.subscription);
    }

    updateUser() {
      // 發布事件
      EventBusManager.publish('user-updated', { userId: 123, name: 'John' });
    }
  }
  ```

## 工具類別與服務

### 7. **BusyIndicatorService** - 載入指示器

管理全域載入狀態顯示。

- **使用方式：**

  ```typescript
  constructor(private busyIndicator: BusyIndicatorService) {}

  loadData() {
    this.busyIndicator.show('載入中...');

    this.dataService.getData().subscribe({
      next: (data) => {
        this.busyIndicator.hide();
      },
      error: (error) => {
        this.busyIndicator.hide();
      }
    });
  }
  ```

### 8. **MessageService** - 訊息服務

顯示系統訊息和通知。

- **使用方式：**

  ```typescript
  constructor(private messageService: MessageService) {}

  showMessage() {
    this.messageService.success('操作成功');
    this.messageService.error('操作失敗');
    this.messageService.warning('注意事項');
    this.messageService.info('資訊提示');
  }
  ```

### 9. **LogService** - 日誌服務

系統日誌記錄和管理。

- **使用方式：**

  ```typescript
  constructor(private logService: LogService) {}

  logActivity() {
    this.logService.debug('除錯訊息');
    this.logService.info('資訊訊息');
    this.logService.warn('警告訊息');
    this.logService.error('錯誤訊息');
  }
  ```

### 10. **LocaleService** - 國際化服務

多語言支援和本地化管理。

- **使用方式：**

  ```typescript
  constructor(private localeService: LocaleService) {}

  switchLanguage() {
    this.localeService.setLocale('zh-TW');
    this.localeService.setLocale('en-US');
  }
  ```

## 核心模型類別

### 11. **Application** - 應用程式模型

應用程式配置和設定的資料模型。

### 12. **Session** - 會話模型

使用者會話資訊的資料結構。

### 13. **Navigation/Navigations** - 導航模型

系統導航選單和權限結構。

### 14. **ErrorMessage** - 錯誤訊息模型

標準化錯誤訊息格式。

### 15. **EventMessage** - 事件訊息模型

事件通訊的標準資料格式。

### 16. **PersistentBean** - 持久化表單模型

用於將表單或狀態資料持久化到 localStorage，適合記錄使用者輸入的暫存資料。

- **使用方式：** Model 類別繼承 `PersistentBean`，在 `constructor` 內傳入唯一名稱（通常是類別名），並視需要呼叫 `load()`/`save()`。

  ```typescript
  export class UserProfileModel extends PersistentBean {
    @Required()
    name = '';

    @Max(100)
    age = 0;

    @DateRange('startDate', 'endDate', 365)
    period = null;

    constructor() {
      super('UserProfileModel');
    }
  }

  // 使用時：
  const model = new UserProfileModel();
  model.load(); // 還原 localStorage
  model.save(); // 儲存 localStorage
  ```

## 管道 (Pipes)

### 17. **SecurityPipe** - 安全管道

HTML 內容安全過濾和清理。

- **使用方式：**
  ```html
  <div [innerHTML]="htmlContent | security"></div>
  ```

### 18. **HtmlSanitizerPurePipe** - HTML 清理管道

純管道版本的 HTML 內容清理。

- **使用方式：**
  ```html
  <div [innerHTML]="dangerousHtml | htmlSanitizerPure"></div>
  ```

## 列舉類型

### 19. **LogLevel** - 日誌級別

```typescript
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}
```

### 20. **MessageTransmission** - 訊息傳輸類型

定義訊息傳輸方式和格式。

## 介面定義

### 21. **ILogAppender** - 日誌附加器介面

日誌記錄的標準介面定義。

## 高級服務

### 22. **ElasticSearchService** - 搜尋服務

Elasticsearch 整合服務。

### 23. **HomeService** - 首頁服務

首頁資料和設定管理。

### 24. **LazyRouterService** - 懶載入路由服務

動態路由載入管理。

### 25. **SettingService** - 設定服務

系統設定和偏好管理。

### 26. **ChildToParentService** - 子父元件通訊

父子元件間的資料通訊服務。

## 使用模式與最佳實踐

### 1. **服務繼承模式**

```typescript
@Injectable({ providedIn: 'root' })
export class FeatureService extends DataService {
  protected get app(): string {
    return AppConfig.get('app');
  }

  constructor(injector: Injector) {
    super(injector);
  }

  // 使用內建的 post 方法
  loadFeatures(params: any) {
    return this.post('api/features', params, true, '載入功能中...');
  }
}
```

### 2. **事件驅動通訊**

```typescript
// 發布者
export class PublisherComponent {
  notifyDataChange(data: any) {
    EventBusManager.publish('data-changed', data);
  }
}

// 訂閱者
export class SubscriberComponent implements OnInit, OnDestroy {
  private subscription: Subscription;

  ngOnInit() {
    this.subscription = EventBusManager.subscribe('data-changed', (data) => {
      this.handleDataChange(data);
    });
  }

  ngOnDestroy() {
    EventBusManager.unsubscribe(this.subscription);
  }
}
```

### 3. **認證流程管理**

```typescript
export class LoginComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async login() {
    try {
      const result = await this.authService.login(this.username, this.password).toPromise();

      // 設定使用者上下文
      UserContext.token = result.token;
      UserContext.username = result.username;

      // 導航到主頁
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Login failed:', error);
    }
  }
}
```

### 4. **配置管理**

```typescript
export class ConfiguredService extends DataService {
  protected get app(): string {
    return AppConfig.get('app');
  }

  protected get hostURL(): string {
    return AppConfig.Systems[this.app]?.webAPI || super.hostURL;
  }

  constructor(injector: Injector) {
    super(injector);
  }
}
```

## 開發原則

1. **服務繼承**: 所有自定義服務必須繼承 `DataService`
2. **配置驅動**: 使用 `AppConfig` 管理所有配置
3. **狀態集中**: 使用 `UserContext` 管理使用者狀態
4. **事件解耦**: 使用 `EventBusManager` 進行跨元件通訊
5. **錯誤統一**: 使用內建錯誤處理機制
6. **日誌標準**: 實作 `ILogAppender` 介面進行日誌記錄
7. **安全第一**: 使用 `AuthGuard` 和權限檢查
8. **型別安全**: 使用定義的模型和介面

## 匯入和使用

```typescript
// 核心服務
import { DataService, AuthService, AuthGuard, BusyIndicatorService, MessageService } from '@wec/core';

// 模型和工具
import { UserContext, AppConfig, EventBusManager, LogLevel } from '@wec/core';

// 管道
import { SecurityPipe, HtmlSanitizerPurePipe } from '@wec/core';
```

## 注意事項

1. **依賴注入**: 使用 `Injector` 模式進行服務依賴注入
2. **記憶體管理**: 記得在 `ngOnDestroy` 中清理事件訂閱
3. **錯誤處理**: 利用 `DataService` 內建的錯誤處理機制
4. **安全性**: 敏感操作前檢查使用者權限
5. **效能**: 使用 `ReplaySubject` 進行資料快取
6. **配置**: 所有環境相關設定都應透過 `AppConfig` 管理
