---
agent: agent
---

# WEC UI Framework 初始化指引 (AI Prompts)

這是 WEC UI Framework 的完整初始化流程，AI 助手將引導使用者完成環境檢查、專案設置到程式碼下載的所有步驟。

## 何時使用此流程

此流程適用於：

- 還沒完成 WEC 開發環境初始化
- 需要檢查 Node.js、Git、npm、Angular CLI、內網與 registry 可用性
- 需要完成 fork、clone、submodule 或 npm 依賴模式選擇

## 不適用情境

以下情境不應繼續使用本流程：

- 已完成環境初始化，現在只是要建立新 system：改用 `wecui-init.prompt.md`
- 已有 system，現在要新增 menu / page：改用 `wecui-develop.prompt.md`
- 只是想了解框架架構與規範：改用 `wecui-intro.prompt.md`
- 只是要做 AG Grid、Reactive Form 或 DataService CRUD：改用對應 skill

## 流程概覽

1. 環境檢查 (Node.js, Git, PowerShell/Bash)
2. GitLab Group 確認
3. Fork WEC Framework 專案
4. Clone 到本地
5. 選擇依賴管理方式 (Submodule vs NPM)
6. 初始化專案配置
7. 驗證安裝

---

## Prompt 1: 環境檢查與準備

**Trigger**: "開始 WEC UI 初始化" 或 "init wec framework"

**Task**: 檢查開發環境是否滿足 WEC UI Framework 要求

**Action Steps**:

```
1. 檢查 Node.js 版本 (要求 >= 18.19.0)
   - 執行: node --version
   - 如不符合: 提供 Node.js 下載連結與安裝指引

2. 檢查 Git 版本 (要求 >= 2.30.0)
   - 執行: git --version
   - 檢查 Git 配置: git config user.name && git config user.email
   - 如未配置: 引導設定 git config --global

3. 檢查包管理器
   - 執行: npm --version
   - 檢查 Angular CLI: ng version
   - 如缺少: npm install -g @angular/cli@17

4. 檢查網路連接與權限
   - 測試: ping fab6gitlab (或 curl -I http://fab6gitlab/)
   - 測試私有 registry: curl -I http://10.18.20.121:8081/repository/wec-npm-private/
```

**Expected Output**: 環境檢查報告 + 缺失項目的修復指引

---

## Prompt 2: GitLab Group 設置

**Trigger**: 環境檢查通過後自動觸發

**Task**: 引導使用者建立或確認 GitLab Group

**Action Steps**:

```
1. 確認 GitLab Group 名稱
   - 建議命名規範: company-frontend, team-ui, project-name-ui
   - 檢查名稱可用性 (如可能)

2. 建立 GitLab Group 指引
   - 訪問: http://fab6gitlab/groups/new
   - 設定 Visibility level (Private/Internal/Public)
   - 配置成員權限
   - 邀請團隊成員

3. 確認使用者在 Group 中的權限
   - 至少需要 Developer/Maintainer 權限來 fork 專案
```

**Expected Output**: GitLab Group 建立確認 + 權限驗證

---

## Prompt 3: Fork WEC Framework 專案

**Trigger**: Group 設置完成後觸發

**Task**: 引導使用者 Fork WEC UI Framework 到其 Group

**Action Steps**:

```
1. 導航到 WEC Framework 原始專案
   - URL: http://fab6gitlab/cim-framework/ui-framework/wec-main
   - 確認使用者已登入 GitLab 平台

2. 執行 Fork 操作
   - 點擊 "Fork" 按鈕
   - 選擇目標 Group
   - 設定 Visibility level (建議與原專案相同)
   - 保持專案名稱為 "wec-main" 或自訂

3. 驗證 Fork 成功
   - 確認新 URL: http://fab6gitlab/{group-name}/wec-main
   - 檢查 Fork 關係顯示正確
   - 確認分支同步 (main branch 存在)

4. 設定 Fork 專案
   - 啟用 Issues (如需要)
   - 設定 Branch protection rules (建議保護 main)
   - 配置 Webhook (如有 CI/CD 需求)
```

**Expected Output**: Fork 專案 URL + 設定確認清單

**範例 URL**: http://fab6gitlab/{your-group}/wec-main

---

## Prompt 4: Clone 專案到本地

**Trigger**: Fork 完成後觸發

**Task**: 將 Fork 的專案 Clone 到本地開發環境

**Action Steps**:

```
1. 建立專案目錄
   - 在當前位置建立 UI 資料夾
   - 執行: mkdir UI && cd UI

2. 決定 Clone 方式並執行
   HTTPS (推薦給新手):
   git clone http://fab6gitlab/{group-name}/wec-main.git
   cd wec-main

3. 設定 upstream remote
   git remote add upstream http://fab6gitlab/cim-framework/ui-framework/wec-main.git
   git remote -v  # 驗證 remote 設定

4. 初步驗證
   - 檢查檔案結構: ls -la (Linux/Mac) 或 dir (Windows)
   - 確認 .git 目錄存在
   - 檢查分支: git branch -a

5. 自動執行指令
   AI 助手將直接執行以下指令序列:
   - mkdir UI
   - cd UI
   - git clone [fork-url] wec-main
   - cd wec-main
   - git remote add upstream [upstream-url]
   - git remote -v
```

**Expected Output**: 本地專案路徑 (./UI/wec-main) + Git remote 配置確認

---

## Prompt 5: 選擇依賴管理方式

**Trigger**: Clone 完成後觸發

**Task**: 引導使用者選擇 wec-core 和 wec-components 的管理方式

**User Interaction Flow**:

```
1. 首先檢查專案現狀
   - 檢查 .gitmodules 檔案是否存在
   - 檢查 tsconfig.json 中的 paths 設定
   - 檢查 submodule 目錄狀態

2. 向使用者說明兩種方式的差異並建議
   - 說明專案當前設定狀況
   - 提供建議方案 (通常建議 Git Submodule)
   - 詢問使用者偏好

3. 等待使用者回應後執行對應設定
```

**Decision Matrix**:

```
🔧 Git Submodule 方式 (建議):
✅ 適用場景:
- 需要修改 wec-core/wec-components 原始碼
- 希望與框架版本緊密同步
- 團隊有 Git 進階使用經驗
- 專案已預設為 submodule 架構

❌ 不適用:
- 只使用框架，不修改核心
- 團隊對 submodule 不熟悉
- 希望獨立管理依賴版本

📦 NPM Package 方式:
✅ 適用場景:
- 純粹使用框架功能
- 希望依賴管理簡單
- 使用 semantic versioning 控制更新

❌ 不適用:
- 需要客製化框架核心
- 需要即時同步最新開發版本
```

**User Choice Question**:

```
AI 詢問格式:
"根據專案檢查結果，建議使用 Git Submodule 方式，因為：
- 專案已預先設定 submodule 架構
- tsconfig.json 路徑已正確配置
- 可直接修改和貢獻框架程式碼

請選擇您希望使用的依賴管理方式：
A) Git Submodule (建議) - 與框架緊密整合
B) NPM Package - 簡單依賴管理

請回覆 A 或 B，或說明您的具體需求。"
```

**Action Steps for Submodule** (使用者選擇 A):

```
1. 初始化 submodule
   git submodule init

2. 初次更新 submodule
   git submodule update

3. 確認 submodule 狀態
   git submodule status

4. 執行 npm install
   npm install

5. 自動執行指令序列
   AI 助手將直接執行以上所有步驟
```

**Action Steps for NPM** (使用者選擇 B):

```
1. 移除 .gitmodules 檔案
   rm .gitmodules

2. 移除 submodule 目錄
   rm -rf projects/wec-core projects/wec-components

3. 移除 tsconfig.json 中的路徑設定
   編輯 tsconfig.json，移除 compilerOptions.paths 中的以下設定：
   "@wec/core": ["projects/wec-core/src/public-api.ts"]
   "@wec/components": ["projects/wec-components/src/public-api.ts"]

4. 安裝 NPM 依賴
   npm install @wec/core@17.1.0 @wec/components@17.1.0

5. 更新 package.json dependencies
   確認 @wec/core 和 @wec/components 在 dependencies 中

6. 安裝 peer dependencies
   npm install (會根據 peerDependencies 提示安裝)

7. 自動執行指令序列
   AI 助手將直接執行以上所有步驟
```

**Expected Output**:

- 使用者選擇確認
- 對應的依賴管理方式設定完成
- 下一步指引

---

## Prompt 6: 驗證安裝與測試

**Trigger**: 依賴管理設置完成後觸發

**Task**: 完整驗證 WEC UI Framework 安裝與運行

**Verification Checklist**:

```
1. Build 測試
   npm run build           # 主專案 build

2. 開發伺服器測試
   ng serve                # 啟動開發伺服器
   - 確認無編譯錯誤
   - 瀏覽器開啟 http://localhost:4200/#/
   - 確認 WEC UI 元件正常載入

3. 依賴關係檢查
   npm ls @wec/core @wec/components
   - 確認版本正確
   - 無 peer dependency 警告

4. Git 狀態檢查
   git status              # 應該是 clean working tree
   git remote -v           # 確認 origin 和 upstream
   git submodule status    # (如使用 submodule) 確認狀態正常

5. 功能性測試
   - 嘗試建立新元件: ng generate component test-component --standalone=true
   - 確認可以 import WEC 元件
   - 測試 build 流程
```

**Troubleshooting Guide**:

```
常見問題與解決方案:

1. "Cannot find module '@wec/core'"
   - 檢查 tsconfig.json paths 設定
   - 確認 npm install 完成
   - 重新建置: npm run build:core

2. Submodule 相關錯誤
   - git submodule update --init --recursive
   - 檢查 .gitmodules 檔案內容

3. 編譯錯誤
   - 清除快取: rm -rf node_modules package-lock.json && npm install
   - 檢查 Angular/Node.js 版本相容性

4. 權限問題
   - 確認對 Git repository 有正確權限
   - 檢查 NPM registry 存取權限
```

**Expected Output**: 完整安裝驗證報告 + 後續開發指引

---

## Prompt 7: 完成設置與後續指引

**Trigger**: 驗證測試全部通過後觸發

**Task**: 提供專案設置完成確認與後續開發建議

**Completion Summary**:

```
🎉 WEC UI Framework 初始化完成！

專案資訊:
- 本地路徑: [user-chosen-path]/wec-main
- Git Remote: http://fab6gitlab/{group-name}/wec-main
- 依賴管理: [Submodule/NPM]
- Framework 版本: 17.1.0

後續開發建議:

1. 閱讀框架文件
   - 查看 .github/copilot-instructions.md
   - 熟悉 WEC Layout System 與元件使用
   - 了解 Angular 17+ 新語法 (@if, @for, @switch)

2. 開發工作流程
   - 建立 feature branch: git checkout -b feature/your-feature
   - 使用 Standalone Components: ng g c component-name --standalone=true
   - 遵循 Conventional Commits 規範

3. 常用指令
   npm run start          # 開發伺服器
   npm run build          # 建置專案
   npm run lint           # 程式碼檢查
   npm run test           # 執行測試 (如設定)

4. 取得更新
   Submodule 方式:
   git submodule update --remote

   NPM 方式:
   npm update @wec/core @wec/components

5. 尋求協助
   - 查看框架範例專案
   - 參考 WEC UI Components 文件
   - 聯繫框架維護團隊
```

**Next Steps Prompt**:

```
🎉 WEC UI Framework 初始化完成！現在可以開始建立您的系統。

下一步選項：
A) 🚀 立即建立新的 WEC 系統（推薦）
B) 📚 查看 WEC 元件庫和文件

請選擇 A-B 或描述具體需求。

🔥 建議選擇 A) 來建立您的第一個 WEC 系統！
```

**Auto-Trigger for System Creation**:

如果使用者選擇 A) 或回覆包含以下關鍵字（不限大小寫），AI 必須**立即**切換並執行 [wecui-init.prompt.md](wecui-init.prompt.md) 的「WEC Framework 系統建立流程」。

關鍵字（任一符合即觸發）：

- 建立系統
- 建立前端系統
- 前端系統
- 新系統
- 建系統
- create system
- new system

**觸發後的標準回覆（務必原樣輸出並直接進入提問）**:

```
太好了！現在開始建立您的 WEC 系統。我將使用 wecui-init.prompt 來引導您完成系統建立流程。

首先，請提供以下資訊：
1. 系統名稱（英文，需要與 iMX Portal 的 AppName 一致）
2. 系統場別（0: 共用系統, 1: 台中廠系統, 2: 高雄廠系統, 3: 測試場系統）

請按照以下格式回覆：
系統名稱：your-system-name
系統場別：0

收到您的回覆後，我將立即開始建立系統！
```

**防跳過規則**:
若使用者任何一句話同時包含「建立系統/建立前端系統/新系統/system」且沒有提供系統名稱/場別，
AI 不可改聊其他話題，必須先發出上方標準回覆以收集資訊。

---

## 使用方式

**對 AI 說**:

```
"使用 wecui-install.prompts，開始 WEC UI Framework 初始化流程"
```

**或直接觸發特定步驟**:

```
"執行 Prompt 1: 環境檢查"
"執行完整的 WEC 初始化流程"
```

AI 將依序執行每個 Prompt，確保使用者完成所有必要步驟並得到可用的 WEC UI Framework 開發環境。
