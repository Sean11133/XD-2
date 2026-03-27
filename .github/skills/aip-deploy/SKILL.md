---
name: aip-deploy
description: >
  This skill should be used when the user asks to "產生 Dockerfile", "建立 Jenkinsfile",
  "設定 CI/CD", "部署設定", "Docker 部署", "Harbor push", "AIP 部署", "pipeline 設定",
  "建立部署檔案", "產生 pipeline", "deployment config", "CI pipeline",
  or needs to generate Dockerfile and Jenkinsfile for the AIP deployment platform.
---

# AIP 部署檔案生成

根據專案技術棧，自動產出符合公司 CI/CD 標準的 Dockerfile 與 Jenkinsfile，支援透過 AIP 系統部署至 K8s。

## 部署架構概覽

```
GitLab tag push → Jenkins Pipeline → Build Docker Image → Push to Harbor → AIP UI 選版本部署至 K8s
```

- Tag 格式：`pilot-{version}`（測試環境）/ `prod-{version}`（正式環境）
- Image 命名：`{system}/{app-type}:{version}`
- Base images 統一從內部 Nexus Registry 拉取
- Harbor 分 PILOT / PROD，由 Jenkins 環境變數配置
- AIP 系統負責 K8s 部署，開發者只需產出 Dockerfile + Jenkinsfile

---

## 流程

### 階段一：專案偵測

掃描專案根目錄，識別技術棧與專案結構：

#### 技術棧判斷規則

| 偵測條件                                                      | 專案類型                     | Dockerfile Pattern |
| ------------------------------------------------------------- | ---------------------------- | ------------------ |
| `*.csproj` + `angular.json`（或有 Frontend/ + Backend/ 目錄） | Full-stack（Angular + .NET） | Pattern 1          |
| `*.csproj` 存在，無 `angular.json`                            | .NET Backend Only            | Pattern 2          |
| `angular.json` 存在，無 `*.csproj`                            | Angular Frontend Only        | Pattern 3          |
| `requirements.txt` 或 `pyproject.toml` 存在                   | Python                       | Pattern 4          |

#### 必須識別的參數

針對 **所有專案類型**：

| 參數          | 識別方式                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `SYSTEM_NAME` | 從 `.csproj` 的 namespace 前綴（如 `iMX.Portal.Web` → `imx`）或 `package.json` 的 `name` 欄位擷取 |
| `APP_TYPE`    | 依專案性質決定：`web-api`（API）、`web-app`（含前端）、`service`（背景服務）                      |

針對 **.NET 專案**（Pattern 1, 2）：

| 參數                        | 識別方式                                                       |
| --------------------------- | -------------------------------------------------------------- |
| `WEB_PROJECT_DIR`           | 找到主要的 Web 專案目錄（含 `Program.cs` + `.csproj`）         |
| `WEB_PROJECT_CSPROJ`        | 該目錄下的 `.csproj` 檔名                                      |
| `ADDITIONAL_CSPROJ_RESTORE` | 掃描 `*.sln` 或目錄中所有 `.csproj`，列出需額外 restore 的專案 |
| `BACKEND_DIR`               | 後端原始碼根目錄（如 `Backend`），若直接在根目錄則為 `.`       |

針對 **Angular 專案**（Pattern 1, 3）：

| 參數                      | 識別方式                                                                |
| ------------------------- | ----------------------------------------------------------------------- |
| `FRONTEND_DIR`            | 包含 `angular.json` 的目錄（如 `Frontend`）                             |
| `FRONTEND_DIST_PATH`      | 從 `angular.json` 的 `outputPath` 讀取                                  |
| `FRONTEND_BUILD_CMD_PROD` | 從 `package.json` 的 `scripts` 中找 `deploy:production` 或 `build:prod` |
| `FRONTEND_NPMRC`          | 檢查是否存在 `.npmrc`                                                   |

針對 **Python 專案**（Pattern 4）：

| 參數                | 識別方式                                                          |
| ------------------- | ----------------------------------------------------------------- |
| `APP_MODULE_NAME`   | 從 `main.py` 或 `app/main.py` 推斷（如 `app.main:app`）           |
| `REQUIREMENTS_FILE` | `requirements.txt` 或 `pyproject.toml`                            |
| `PYTHON_VERSION`    | 從 `pyproject.toml` 的 `python` 版本約束或 `.python-version` 讀取 |

#### 偵測結果確認

完成偵測後，向使用者展示識別結果並等待確認：

```
📋 專案偵測結果：

- 專案類型：Full-stack（Angular + .NET 8）
- SYSTEM_NAME：imx
- APP_TYPE：web-app
- 前端目錄：Frontend/（Angular 17）
- 後端目錄：Backend/（.NET 8）
- Web 專案：iMX.Portal.Web

確認以上資訊？(Y/n)
```

---

### 階段二：Dockerfile 生成

根據偵測的專案類型，讀取 `references/dockerfile-patterns.md` 中對應的 Pattern 模板。

1. 選取對應 Pattern（1~4）
2. 替換所有 `{{佔位符}}` 為專案實際值
3. 將產出的 Dockerfile 寫入專案根目錄

#### 共通約束（所有 Pattern 必須遵循）

- Base image 必須從 Nexus Registry（`10.18.20.121:80`）拉取，禁止使用 Docker Hub
- 統一 `ENV TZ=Asia/Taipei`
- 統一 `EXPOSE 8080`
- .NET 專案必須設定 `ENV DOTNET_NUGET_SIGNATURE_VERIFICATION=false`
- NuGet source 必須指向內部 Nexus（`http://10.18.20.121:8081/repository/wec-nuget/`）
- npm 透過專案 `.npmrc` 指向內部 Registry
- 機密資訊不得寫入 Dockerfile，透過 runtime 環境變數注入

For detailed Dockerfile templates and per-pattern notes, consult **`references/dockerfile-patterns.md`**.

---

### 階段三：Jenkinsfile 生成

讀取 `references/jenkinsfile-pattern.md` 中的模板，根據專案類型調整。

1. 替換所有 `{{佔位符}}` 為專案實際值
2. 根據專案類型移除不適用的 stage：

| 專案類型              | Build CI Image | Playwright Test | Build Runtime | Docker Push |
| --------------------- | :------------: | :-------------: | :-----------: | :---------: |
| Full-stack            |       ✅       |       ✅        |      ✅       |     ✅      |
| .NET Backend Only     |    ❌ 移除     |     ❌ 移除     |      ✅       |     ✅      |
| Angular Frontend Only |       ✅       | ✅（若有測試）  |      ✅       |     ✅      |
| Python                |    ❌ 移除     |     ❌ 移除     |      ✅       |     ✅      |

3. 移除 stage 時，同時移除對應的 helper functions 和未使用的環境變數
4. 將產出的 Jenkinsfile 寫入專案根目錄

#### 必須向使用者確認的參數

以下參數無法自動偵測，需詢問使用者：

| 參數                           | 問題                                | 預設值              |
| ------------------------------ | ----------------------------------- | ------------------- |
| `GIT_CREDENTIALS_ID`           | Jenkins 中的 Git 憑證 ID？          | `MK22-FAB6GITLAB`   |
| `NEXUS_CREDENTIALS_ID`         | Jenkins 中的 Nexus 憑證 ID？        | `NEXUS-CREDENTIAL`  |
| `HARBOR_PILOT_CREDENTIALS_ID`  | Jenkins 中的 Harbor PILOT 憑證 ID？ | `MK22-HARBOR-PILOT` |
| `HARBOR_PROD_CREDENTIALS_ID`   | Jenkins 中的 Harbor PROD 憑證 ID？  | `MK22-HARBOR-PROD`  |
| `NOTIFICATION_EMAIL`           | Pipeline 通知信箱？                 | —                   |
| `PLAYWRIGHT_IMAGE`（若有測試） | Playwright Docker Image 位址？      | —                   |

若使用者無法提供，使用預設值並標注 `// TODO: 請確認` 註解。

For the complete Jenkinsfile template, stage logic, and per-type adaptation guide, consult **`references/jenkinsfile-pattern.md`**.

---

### 階段四：驗證清單

產出 Dockerfile 和 Jenkinsfile 後，逐項檢查：

**Dockerfile 驗證：**

- [ ] 所有 base image 指向內部 Nexus Registry（`10.18.20.121:80/...`），未使用 Docker Hub
- [ ] NuGet source 指向 `http://10.18.20.121:8081/repository/wec-nuget/`
- [ ] npm registry 透過 `.npmrc` 設定（Angular 專案）
- [ ] 設定 `ENV TZ=Asia/Taipei`
- [ ] `EXPOSE 8080`
- [ ] 無機密資訊（密碼、token、連線字串）寫入 Dockerfile
- [ ] Multi-stage build 正確：build stage 的產物正確 COPY 到 final stage

**Jenkinsfile 驗證：**

- [ ] `IMAGE_NAME` 格式為 `{system}/{app-type}:{version}`
- [ ] `HARBOR_REPO` 和 `HARBOR_CREDENTIALS_ID` 根據 tag 前綴動態切換 PILOT / PROD
- [ ] 所有憑證使用 Jenkins credentials ID（不明碼）
- [ ] PILOT 環境執行測試 stage，PROD 環境跳過
- [ ] `-skip-` tag 可跳過測試 stage
- [ ] `post.failure` 區塊包含失敗通知
- [ ] `post.success` 區塊包含測試報告發佈（若有測試）

---

## Reference Files

For detailed templates and patterns, consult:

- **`references/dockerfile-patterns.md`** — 四種技術棧（Full-stack / .NET / Angular / Python）的 Dockerfile 標準模板，含佔位符說明與替換範例
- **`references/jenkinsfile-pattern.md`** — Jenkinsfile 通用模板，含 stage 說明、環境判斷邏輯、依專案類型的調整指引
