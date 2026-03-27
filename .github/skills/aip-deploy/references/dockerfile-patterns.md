# Dockerfile Patterns

本文件包含各技術棧的 Dockerfile 標準模板。所有佔位符以 `{{PLACEHOLDER}}` 標示，需根據專案實際值替換。

## 共通約束

- **Base Image Registry**：所有 base image 必須從內部 Nexus Registry 拉取（`10.18.20.121:80`）
- **Timezone**：統一 `ENV TZ=Asia/Taipei`
- **Port**：應用程式統一暴露 `8080`
- **NuGet Source**（.NET）：`http://10.18.20.121:8081/repository/wec-nuget/`
- **npm Registry**（Angular）：透過專案 `.npmrc` 指向內部 Nexus
- **NuGet Signature**：內部 Registry 需設定 `ENV DOTNET_NUGET_SIGNATURE_VERIFICATION=false`
- **機密資訊**：不得寫入 Dockerfile，透過 runtime 環境變數注入

## 佔位符說明

| 佔位符                          | 說明                                             | 範例                                             |
| ------------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| `{{NEXUS_REGISTRY}}`            | 內部 Nexus Registry 位址                         | `10.18.20.121:80`                                |
| `{{NEXUS_NUGET_SOURCE}}`        | 內部 NuGet Repository URL                        | `http://10.18.20.121:8081/repository/wec-nuget/` |
| `{{NODE_VERSION}}`              | Node.js 版本                                     | `18.20.8`                                        |
| `{{DOTNET_VERSION}}`            | .NET SDK/Runtime 版本                            | `8.0`                                            |
| `{{PYTHON_VERSION}}`            | Python 版本                                      | `3.11`                                           |
| `{{FRONTEND_DIR}}`              | 前端原始碼目錄（相對專案根目錄）                 | `Frontend`                                       |
| `{{FRONTEND_NPMRC}}`            | .npmrc 檔案路徑（相對 FRONTEND_DIR）             | `.npmrc`                                         |
| `{{FRONTEND_DIST_PATH}}`        | 前端 build 產出目錄（相對 FRONTEND_DIR）         | `dist/ui`                                        |
| `{{FRONTEND_BUILD_CMD_PROD}}`   | 前端 production build 指令                       | `npm run deploy:production`                      |
| `{{FRONTEND_BUILD_CMD_OTHER}}`  | 前端非 production build 指令模板                 | `npm run deploy:$NG_ENV`                         |
| `{{FRONTEND_BUILD_CMD_TEST}}`   | 前端 test/CI build 指令（用於 CI Image）         | `npm run deploy:test` 或與 OTHER 相同            |
| `{{BACKEND_DIR}}`               | 後端原始碼目錄（相對專案根目錄）                 | `Backend`                                        |
| `{{WEB_PROJECT_DIR}}`           | Web 專案目錄名稱（相對 BACKEND_DIR）             | `iMX.Portal.Web`                                 |
| `{{WEB_PROJECT_CSPROJ}}`        | Web 專案 .csproj 檔名                            | `iMX.Portal.Web.csproj`                          |
| `{{WEB_PROJECT_DLL}}`           | 發佈後的 DLL 檔名                                | `iMX.Portal.Web.dll`                             |
| `{{ADDITIONAL_CSPROJ_RESTORE}}` | 需要額外 restore 的 .csproj（COPY + restore 行） | 見範例                                           |
| `{{APP_MODULE_NAME}}`           | Python 應用程式模組名稱                          | `app.main:app`                                   |
| `{{REQUIREMENTS_FILE}}`         | Python 依賴檔案名稱                              | `requirements.txt`                               |

---

## Pattern 1: Full-Stack（Angular + .NET 8）

適用條件：專案根目錄同時存在 `*.csproj`（或 Backend 子目錄）與 `angular.json`（或 Frontend 子目錄）。

```dockerfile
# ============================================================
# Stage 1: Frontend Build (Angular)
# ============================================================
FROM {{NEXUS_REGISTRY}}/node:{{NODE_VERSION}} AS frontend
WORKDIR /frontend

ARG NG_ENV=prod
ENV NG_ENV=${NG_ENV}

COPY ["{{FRONTEND_DIR}}/{{FRONTEND_NPMRC}}", ".npmrc"]
COPY ["{{FRONTEND_DIR}}/package*.json", "./"]

RUN npm install --force --loglevel verbose && \
    find ./node_modules/.bin -type f -exec chmod +x {} \; || true

COPY ./{{FRONTEND_DIR}}/ .

ENV PATH="/frontend/node_modules/.bin:$PATH"

RUN if [ "$NG_ENV" = "prod" ] || [ "$NG_ENV" = "production" ]; then \
      {{FRONTEND_BUILD_CMD_PROD}}; \
    else \
      {{FRONTEND_BUILD_CMD_OTHER}}; \
    fi

# ============================================================
# Stage 2: .NET Runtime Base
# ============================================================
FROM {{NEXUS_REGISTRY}}/dotnet/aspnet:{{DOTNET_VERSION}} AS base
WORKDIR /app
ENV TZ=Asia/Taipei
EXPOSE 8080
EXPOSE 443

# ============================================================
# Stage 3: .NET Build
# ============================================================
FROM {{NEXUS_REGISTRY}}/dotnet/sdk:{{DOTNET_VERSION}} AS build
WORKDIR /src
ENV TZ=Asia/Taipei

COPY ["{{BACKEND_DIR}}/{{WEB_PROJECT_DIR}}/{{WEB_PROJECT_CSPROJ}}", "{{WEB_PROJECT_DIR}}/"]
{{ADDITIONAL_CSPROJ_RESTORE}}

ENV DOTNET_NUGET_SIGNATURE_VERIFICATION=false
RUN dotnet restore "{{WEB_PROJECT_DIR}}/{{WEB_PROJECT_CSPROJ}}" --source {{NEXUS_NUGET_SOURCE}}

COPY ./{{BACKEND_DIR}} .
WORKDIR "/src/{{WEB_PROJECT_DIR}}"
RUN dotnet build "{{WEB_PROJECT_CSPROJ}}" -c Release -o /app/build

# ============================================================
# Stage 4: .NET Publish
# ============================================================
FROM build AS publish
RUN dotnet publish "{{WEB_PROJECT_CSPROJ}}" -c Release -o /app/publish /p:UseAppHost=false

# ============================================================
# Stage 5: Final Runtime
# ============================================================
FROM base AS final
WORKDIR /app
ENV TZ=Asia/Taipei
COPY --from=publish /app/publish .
COPY --from=frontend /frontend/{{FRONTEND_DIST_PATH}} ./wwwroot

ENTRYPOINT ["dotnet", "{{WEB_PROJECT_DLL}}"]
```

### 替換範例（iMX.Portal）

| 佔位符                          | 實際值                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------- |
| `{{NEXUS_REGISTRY}}`            | `10.18.20.121:80`                                                             |
| `{{NODE_VERSION}}`              | `18.20.8`                                                                     |
| `{{DOTNET_VERSION}}`            | `8.0`                                                                         |
| `{{FRONTEND_DIR}}`              | `Frontend`                                                                    |
| `{{FRONTEND_NPMRC}}`            | `.npmrc`                                                                      |
| `{{FRONTEND_DIST_PATH}}`        | `dist/ui`                                                                     |
| `{{FRONTEND_BUILD_CMD_PROD}}`   | `npm run deploy:production`                                                   |
| `{{FRONTEND_BUILD_CMD_OTHER}}`  | `npm run deploy:$NG_ENV`                                                      |
| `{{BACKEND_DIR}}`               | `Backend`                                                                     |
| `{{WEB_PROJECT_DIR}}`           | `iMX.Portal.Web`                                                              |
| `{{WEB_PROJECT_CSPROJ}}`        | `iMX.Portal.Web.csproj`                                                       |
| `{{WEB_PROJECT_DLL}}`           | `iMX.Portal.Web.dll`                                                          |
| `{{ADDITIONAL_CSPROJ_RESTORE}}` | `COPY ["Backend/iMX.Portal.Core/iMX.Portal.Core.csproj", "iMX.Portal.Core/"]` |

---

## Pattern 2: .NET Backend Only

適用條件：專案存在 `*.csproj` 但沒有 `angular.json` 或前端目錄。

```dockerfile
# ============================================================
# Stage 1: .NET Runtime Base
# ============================================================
FROM {{NEXUS_REGISTRY}}/dotnet/aspnet:{{DOTNET_VERSION}} AS base
WORKDIR /app
ENV TZ=Asia/Taipei
EXPOSE 8080
EXPOSE 443

# ============================================================
# Stage 2: .NET Build
# ============================================================
FROM {{NEXUS_REGISTRY}}/dotnet/sdk:{{DOTNET_VERSION}} AS build
WORKDIR /src
ENV TZ=Asia/Taipei

COPY ["{{WEB_PROJECT_DIR}}/{{WEB_PROJECT_CSPROJ}}", "{{WEB_PROJECT_DIR}}/"]
{{ADDITIONAL_CSPROJ_RESTORE}}

ENV DOTNET_NUGET_SIGNATURE_VERIFICATION=false
RUN dotnet restore "{{WEB_PROJECT_DIR}}/{{WEB_PROJECT_CSPROJ}}" --source {{NEXUS_NUGET_SOURCE}}

COPY . .
WORKDIR "/src/{{WEB_PROJECT_DIR}}"
RUN dotnet build "{{WEB_PROJECT_CSPROJ}}" -c Release -o /app/build

# ============================================================
# Stage 3: .NET Publish
# ============================================================
FROM build AS publish
RUN dotnet publish "{{WEB_PROJECT_CSPROJ}}" -c Release -o /app/publish /p:UseAppHost=false

# ============================================================
# Stage 4: Final Runtime
# ============================================================
FROM base AS final
WORKDIR /app
ENV TZ=Asia/Taipei
COPY --from=publish /app/publish .

ENTRYPOINT ["dotnet", "{{WEB_PROJECT_DLL}}"]
```

### 注意事項

- 若專案原始碼直接在根目錄（無 `Backend/` 子目錄），`COPY` 路徑需調整
- 若有多個 .csproj 需要 restore，逐行加入 `{{ADDITIONAL_CSPROJ_RESTORE}}`
- 若專案使用 `Directory.Build.props` 或 `NuGet.config`，需在 restore 前 COPY

---

## Pattern 3: Angular Frontend Only

適用條件：專案存在 `angular.json` 但沒有 `*.csproj` 或後端目錄。使用 Nginx 作為靜態檔案伺服器。

```dockerfile
# ============================================================
# Stage 1: Frontend Build (Angular)
# ============================================================
FROM {{NEXUS_REGISTRY}}/node:{{NODE_VERSION}} AS build
WORKDIR /app

ARG NG_ENV=prod
ENV NG_ENV=${NG_ENV}

COPY [".npmrc", ".npmrc"]
COPY ["package*.json", "./"]

RUN npm install --force --loglevel verbose && \
    find ./node_modules/.bin -type f -exec chmod +x {} \; || true

COPY . .

ENV PATH="/app/node_modules/.bin:$PATH"

RUN if [ "$NG_ENV" = "prod" ] || [ "$NG_ENV" = "production" ]; then \
      {{FRONTEND_BUILD_CMD_PROD}}; \
    else \
      {{FRONTEND_BUILD_CMD_OTHER}}; \
    fi

# ============================================================
# Stage 2: Nginx Runtime
# ============================================================
FROM {{NEXUS_REGISTRY}}/nginx:stable-alpine AS final
ENV TZ=Asia/Taipei
EXPOSE 8080

# 自訂 Nginx 設定（SPA fallback + port 8080）
RUN echo 'server { \
    listen 8080; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

COPY --from=build /app/{{FRONTEND_DIST_PATH}} /usr/share/nginx/html
```

### 注意事項

- Nginx 設定使用 `try_files` 支援 Angular SPA 路由（所有未匹配的路徑 fallback 到 `index.html`）
- Port 統一使用 `8080`，與後端一致
- 若專案有自訂的 `nginx.conf`，應優先使用專案自帶的設定檔
- 若前端原始碼在子目錄中，`COPY` 路徑需調整

---

## Pattern 4: Python（FastAPI / Flask + wecpy）

適用條件：專案存在 `requirements.txt` 或 `pyproject.toml`。

```dockerfile
# ============================================================
# Stage 1: Python Build
# ============================================================
FROM {{NEXUS_REGISTRY}}/python:{{PYTHON_VERSION}}-slim AS build
WORKDIR /app
ENV TZ=Asia/Taipei

COPY {{REQUIREMENTS_FILE}} .
RUN pip install --no-cache-dir -r {{REQUIREMENTS_FILE}}

COPY . .

# ============================================================
# Stage 2: Python Runtime
# ============================================================
FROM {{NEXUS_REGISTRY}}/python:{{PYTHON_VERSION}}-slim AS final
WORKDIR /app
ENV TZ=Asia/Taipei
EXPOSE 8080

COPY --from=build /usr/local/lib/python{{PYTHON_VERSION}}/site-packages /usr/local/lib/python{{PYTHON_VERSION}}/site-packages
COPY --from=build /usr/local/bin /usr/local/bin
COPY --from=build /app .

# IMX_ENV 由 runtime 注入（PILOT / PROD）
# 對應 wecpy 的 ConfigManager 讀取 {IMX_ENV}/config.yaml
ENV IMX_ENV=PILOT

ENTRYPOINT ["uvicorn", "{{APP_MODULE_NAME}}", "--host", "0.0.0.0", "--port", "8080"]
```

### 注意事項

- `IMX_ENV` 預設為 `PILOT`，正式環境由 K8s / AIP 注入 `PROD`
- wecpy 的 `ConfigManager` 根據 `IMX_ENV` 讀取對應的設定目錄（`PILOT/config.yaml` 或 `PROD/config.yaml`）
- 若使用 Flask 而非 FastAPI，將 ENTRYPOINT 替換為 `gunicorn`：
  ```dockerfile
  ENTRYPOINT ["gunicorn", "{{APP_MODULE_NAME}}", "--bind", "0.0.0.0:8080", "--workers", "4"]
  ```
- 若使用 `pyproject.toml`（poetry），替換 build stage 為：
  ```dockerfile
  RUN pip install poetry && poetry config virtualenvs.create false && poetry install --no-dev
  ```
- 若有內部 PyPI Mirror，加入：
  ```dockerfile
  RUN pip install --no-cache-dir -r {{REQUIREMENTS_FILE}} -i http://{{NEXUS_REGISTRY}}:8081/repository/pypi-proxy/simple/ --trusted-host {{NEXUS_REGISTRY}}
  ```
