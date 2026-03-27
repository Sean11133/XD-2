# Jenkinsfile Pattern

本文件包含 Jenkins Declarative Pipeline 的標準模板，用於建置 Docker Image 並推送至 Harbor Registry。所有佔位符以 `{{PLACEHOLDER}}` 標示。

## 觸發機制

Pipeline 由 GitLab 的 tag push 事件觸發（透過 GitLab Plugin 或 Webhook）。

- Tag 格式：`pilot-{version}` → 測試環境（PILOT），`prod-{version}` → 正式環境（PROD）
- Version 會從 tag 中擷取（移除 `pilot-` / `prod-` 前綴）
- 含 `-skip-` 的 tag 會跳過 CI 測試階段，直接 build runtime image

## 佔位符說明

| 佔位符                            | 說明                     | 範例                            |
| --------------------------------- | ------------------------ | ------------------------------- |
| `{{SYSTEM_NAME}}`                 | 系統名稱（小寫）         | `imx`                           |
| `{{APP_TYPE}}`                    | 應用程式類型             | `web-api`、`web-app`、`service` |
| `{{GIT_CREDENTIALS_ID}}`          | Jenkins Git 憑證 ID      | `MK22-FAB6GITLAB`               |
| `{{NEXUS_CREDENTIALS_ID}}`        | Nexus Registry 憑證 ID   | `NEXUS-CREDENTIAL`              |
| `{{HARBOR_PILOT_CREDENTIALS_ID}}` | Harbor PILOT 環境憑證 ID | `MK22-HARBOR-PILOT`             |
| `{{HARBOR_PROD_CREDENTIALS_ID}}`  | Harbor PROD 環境憑證 ID  | `MK22-HARBOR-PROD`              |
| `{{NOTIFICATION_EMAIL}}`          | 通知信箱                 | `team@company.com`              |
| `{{DOCKERFILE_PATH}}`             | Dockerfile 路徑          | `Dockerfile`                    |
| `{{DOCKER_BUILD_CONTEXT}}`        | Docker build context     | `.`                             |

### 條件區塊佔位符

| 佔位符                       | 說明                       | 適用類型                   |
| ---------------------------- | -------------------------- | -------------------------- |
| `{{HAS_FRONTEND_TEST}}`      | 是否包含前端測試 stage     | Full-stack with Playwright |
| `{{NG_ENV_BUILD_ARG}}`       | 前端 build 的環境參數      | Full-stack / Angular-only  |
| `{{TEST_NETWORK_NAME}}`      | Docker 測試用網路名稱      | Full-stack with Playwright |
| `{{PLAYWRIGHT_IMAGE}}`       | Playwright 測試 image      | Full-stack with Playwright |
| `{{SERVICE_CONTAINER_NAME}}` | 測試用服務容器名稱         | Full-stack with Playwright |
| `{{SERVICE_ENV_VAR}}`        | 服務容器環境變數           | Full-stack with Playwright |
| `{{BASE_URL_FOR_TEST}}`      | Playwright 測試的 base URL | Full-stack with Playwright |

---

## 完整 Jenkinsfile 模板

```groovy
pipeline {
    agent any
    environment {
        APP_ENV_NAME = "${GIT_TAG.startsWith('pilot-') ? 'pilot': 'prod'}"
        VERBOSE = 'true'
        GIT_CREDENTIALS_ID = '{{GIT_CREDENTIALS_ID}}'
        SYSTEM_NAME = '{{SYSTEM_NAME}}'
        PROJECT_NAME = "${env.gitlabSourceRepoName}"
        GIT_PROJECT = "${env.GIT_URL}"
        GIT_TAG = "${env.gitlabTargetBranch.replace('refs/tags/', '')}"

        NEXUS_REPO = "${env.NEXUS_REPO}"
        NEXUS_CREDENTIALS_ID = '{{NEXUS_CREDENTIALS_ID}}'
        FORCE_BUILD = "${env.GIT_TAG?.contains('-skip-') ? 'true' : 'false'}"
        HARBOR_REPO = "${GIT_TAG.startsWith('pilot-') ? env.HARBOR_PILOT : env.HARBOR_PROD}"
        HARBOR_CREDENTIALS_ID = "${GIT_TAG.startsWith('pilot-') ? '{{HARBOR_PILOT_CREDENTIALS_ID}}' : '{{HARBOR_PROD_CREDENTIALS_ID}}'}"
        IMAGE_NAME = "${SYSTEM_NAME}/{{APP_TYPE}}:${GIT_TAG.replace('pilot-', '').replace('prod-', '').replace('-skip-', '')}"
        // ---------- 以下僅在包含前端測試時使用 ----------
        // {{HAS_FRONTEND_TEST}}: 若無前端測試，移除 TEST_NETWORK 行
        TEST_NETWORK = '{{TEST_NETWORK_NAME}}'
    }

    stages {

        // ==============================================================
        // Stage: Build CI Image（僅 PILOT 且非 FORCE_BUILD）
        // 用途：建置含測試環境的 Image，用於執行 Playwright 等整合測試
        // 條件：APP_ENV_NAME != 'prod' && FORCE_BUILD != 'true'
        // 注意：若專案無前端測試，可移除此 stage
        // ==============================================================
        stage('Build CI Image') {
            when {
                allOf {
                    not {
                        environment name: 'APP_ENV_NAME', value: 'prod'
                    }
                    not {
                        environment name: 'FORCE_BUILD', value: 'true'
                    }
                }
            }
            steps {
                script {
                    docker.withRegistry(env.NEXUS_REPO, env.NEXUS_CREDENTIALS_ID) {
                        Image_CI = docker.build(env.IMAGE_NAME, "--build-arg NG_ENV=test -f {{DOCKERFILE_PATH}} {{DOCKER_BUILD_CONTEXT}}")
                    }
                }
            }
        }

        // ==============================================================
        // Stage: Service Run & Playwright Test
        // 用途：啟動服務容器，執行 Playwright E2E 測試
        // 條件：同 Build CI Image（僅 PILOT 且非 FORCE_BUILD）
        // 注意：若專案無前端測試，可移除此 stage 及相關 helper functions
        // ==============================================================
        stage('Service Run & Playwright Test') {
            when {
                allOf {
                    not {
                        environment name: 'APP_ENV_NAME', value: 'prod'
                    }
                    not {
                        environment name: 'FORCE_BUILD', value: 'true'
                    }
                }
            }
            steps {
                script {
                    debugWorkspaceStructure()
                    runPlaywrightTests()
                }
            }
        }

        // ==============================================================
        // Stage: Build Runtime Image
        // 用途：建置正式 Runtime Image（根據 APP_ENV_NAME 決定 build 參數）
        // 條件：永遠執行（PILOT 和 PROD 都需要）
        // ==============================================================
        stage('Build Runtime Image') {
            steps {
                script {
                    docker.withRegistry(env.NEXUS_REPO, env.NEXUS_CREDENTIALS_ID) {
                        Image = docker.build(env.IMAGE_NAME, "--build-arg NG_ENV=${APP_ENV_NAME} -f {{DOCKERFILE_PATH}} {{DOCKER_BUILD_CONTEXT}}")
                    }
                }
            }
        }

        // ==============================================================
        // Stage: Docker Push
        // 用途：將 Runtime Image 推送至 Harbor Registry
        // 條件：永遠執行
        // Harbor 目標由 HARBOR_REPO 環境變數決定（PILOT / PROD）
        // ==============================================================
        stage('Docker Push') {
            steps {
                script {
                    docker.withRegistry(env.HARBOR_REPO, env.HARBOR_CREDENTIALS_ID) {
                        Image.push()
                    }
                }
            }
        }

    }

    post {
        failure {
            script {
                echo "🚨 PIPELINE FAILED 🚨"
                echo "Failed stage information:"
                echo "Current build result: ${currentBuild.result}"
                echo "Current build display name: ${currentBuild.displayName}"

                emailext to: '{{NOTIFICATION_EMAIL}}',
                    subject: "❌ FAILED: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                    mimeType: 'text/html',
                    body: """
                        <h2 style="color: red;">❌ Pipeline Failed</h2>
                        <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                        <p><strong>Build:</strong> ${env.BUILD_NUMBER}</p>
                        <p><strong>Environment:</strong> ${env.APP_ENV_NAME}</p>
                        <p><strong>Build URL:</strong> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                        <p><strong>Console Output:</strong> <a href="${env.BUILD_URL}console">View Console</a></p>
                    """
            }
        }
        success {
            script {
                try {
                    if (env.APP_ENV_NAME != 'prod') {
                        publishTestResults()
                    }
                } catch (Exception e) {
                    echo "⚠️  Error in publishTestResults: ${e.getMessage()}"
                }

                try {
                    sendEmailNotification()
                } catch (Exception e) {
                    echo "⚠️  Error in sendEmailNotification: ${e.getMessage()}"
                }
            }
        }
    }
}

// ==============================================================
// Helper Functions
// 以下 helper functions 僅在「包含前端測試」的 pipeline 中需要。
// 若專案無前端測試，移除 Build CI Image stage、
// Service Run & Playwright Test stage 及所有 helper functions。
// ==============================================================

def debugWorkspaceStructure() {
    sh """
        echo '=== Debug: Jenkins Workspace Structure ==='
        echo "WORKSPACE: \$WORKSPACE"
        ls -la \$WORKSPACE
        echo '=== Looking for TestCase directory ==='
        find \$WORKSPACE -name "*TestCase*" -type d || echo 'No TestCase directory found'
        find \$WORKSPACE -name "package.json" || echo 'No package.json found'
    """
}

def runPlaywrightTests() {
    docker.withRegistry(env.NEXUS_REPO, env.NEXUS_CREDENTIALS_ID) {
        createTestNetwork()

        try {
            runServiceContainer()
        } finally {
            cleanupTestNetwork()
        }
    }
}

def createTestNetwork() {
    sh """
        echo '=== Creating test network with external access ==='
        docker network create ${env.TEST_NETWORK} \
            --driver bridge \
            --attachable \
            || true

        echo '=== Verify network creation ==='
        docker network inspect ${env.TEST_NETWORK}
    """
}

def runServiceContainer() {
    def serviceArgs = [
        "--network ${env.TEST_NETWORK}",
        "--name {{SERVICE_CONTAINER_NAME}}",
        "-e {{SERVICE_ENV_VAR}}"
    ].join(' ')

    Image_CI.withRun(serviceArgs) { c ->
        sh """
            docker exec {{SERVICE_CONTAINER_NAME}} env
            sleep 10
        """
        runPlaywrightContainer()
    }
}

def runPlaywrightContainer() {
    def playwrightImage = docker.image('{{PLAYWRIGHT_IMAGE}}')
    def dockerArgs = [
        "--network ${env.TEST_NETWORK}",
        "-e BASE_URL={{BASE_URL_FOR_TEST}}",
        "-e CI=true"
    ].join(' ')

    playwrightImage.inside(dockerArgs) {
        executePlaywrightTests()
    }
}

def executePlaywrightTests() {
    sh '''
        echo '=== Checking for required files ==='
        ls -la package.json package-lock.json 2>/dev/null || echo 'Missing package files'
        chmod -R 755 ./

        npm ci
        npx playwright test --workers=1
    '''
}

def cleanupTestNetwork() {
    sh "docker network rm ${env.TEST_NETWORK} || true"
}

def publishTestResults() {
    if (fileExists('test-results/results.xml')) {
        junit 'test-results/*.xml'
        archiveArtifacts artifacts: 'test-results/**, playwright-report/**', fingerprint: true
    } else {
        echo 'No test results found to publish'
    }
}

def sendEmailNotification() {
    emailext to: '{{NOTIFICATION_EMAIL}}',
        subject: "jenkins test:${currentBuild.currentResult}: ${env.JOB_NAME}",
        mimeType: 'text/html',
        body: """
            <h3>測試摘要</h3>
            Jenkins Build: <a href="${env.BUILD_URL}">${env.JOB_NAME}</a><br>
            <p>
            Total: \${TEST_COUNTS, var="total"}
            Passed: \${TEST_COUNTS, var="pass"}
            Failed: \${TEST_COUNTS, var="fail"}
            Skipped: \${TEST_COUNTS, var="skip"}</p>
            <b>JUnit 詳細報告：</b> <a href="${env.BUILD_URL}testReport/">點此查看</a>
        """
}
```

---

## Stage 說明摘要

| Stage                         | 用途                           | 執行條件                  | 可移除？        |
| ----------------------------- | ------------------------------ | ------------------------- | --------------- |
| Build CI Image                | 建置含測試環境的 Image         | PILOT only + !FORCE_BUILD | ✅ 若無前端測試 |
| Service Run & Playwright Test | 啟動服務 + 執行 Playwright E2E | PILOT only + !FORCE_BUILD | ✅ 若無前端測試 |
| Build Runtime Image           | 建置正式 Runtime Image         | 永遠執行                  | ❌ 必要         |
| Docker Push                   | 推送至 Harbor                  | 永遠執行                  | ❌ 必要         |

## 環境判斷邏輯

```
GIT_TAG = "pilot-1.2.3"
  → APP_ENV_NAME = "pilot"
  → HARBOR_REPO = HARBOR_PILOT (Jenkins env)
  → HARBOR_CREDENTIALS_ID = HARBOR_PILOT_CREDENTIALS_ID
  → IMAGE_NAME = "{system}/{app-type}:1.2.3"
  → 執行 CI Image + Playwright Test + Runtime Build + Push

GIT_TAG = "prod-1.2.3"
  → APP_ENV_NAME = "prod"
  → HARBOR_REPO = HARBOR_PROD (Jenkins env)
  → HARBOR_CREDENTIALS_ID = HARBOR_PROD_CREDENTIALS_ID
  → IMAGE_NAME = "{system}/{app-type}:1.2.3"
  → 跳過 CI Image + Playwright Test → 直接 Runtime Build + Push

GIT_TAG = "pilot-1.2.3-skip-hotfix"
  → FORCE_BUILD = "true"
  → 跳過 CI Image + Playwright Test → 直接 Runtime Build + Push
```

## 依專案類型調整

### Full-Stack（Angular + .NET）

使用完整模板。`--build-arg NG_ENV=` 控制前端 build 模式。

### .NET Backend Only

- 移除 `Build CI Image` stage（或保留但不傳 `NG_ENV`）
- 移除 `Service Run & Playwright Test` stage
- 移除所有 Playwright helper functions
- 移除 `TEST_NETWORK` 環境變數
- `Build Runtime Image` 的 `--build-arg` 不需要 `NG_ENV`

### Angular Frontend Only

- 保留前端測試 stages（若有 Playwright）
- `Build Runtime Image` 的 `--build-arg NG_ENV=` 控制 Angular build mode
- 通常不需要 `SERVICE_ENV_VAR`（無後端服務容器）

### Python

- 移除 `Build CI Image` stage（Python 測試通常不透過 Docker）
- 移除 `Service Run & Playwright Test` stage
- 移除所有 Playwright helper functions
- `Build Runtime Image` 不需要 `--build-arg`（除非有環境特定的 build 參數）
- 若需要在 CI 中跑 pytest，另行新增一個 `Run Tests` stage：
  ```groovy
  stage('Run Tests') {
      when {
          not { environment name: 'APP_ENV_NAME', value: 'prod' }
      }
      steps {
          script {
              docker.withRegistry(env.NEXUS_REPO, env.NEXUS_CREDENTIALS_ID) {
                  Image_CI = docker.build(env.IMAGE_NAME + '-test', '-f Dockerfile .')
                  Image_CI.inside {
                      sh 'pytest --junitxml=test-results/results.xml'
                  }
              }
          }
      }
  }
  ```

## Jenkins 環境變數依賴

以下環境變數需在 Jenkins 系統或 Job 層級設定，Jenkinsfile 中透過 `env.` 引用：

| 環境變數               | 說明                      | 設定位置               |
| ---------------------- | ------------------------- | ---------------------- |
| `NEXUS_REPO`           | Nexus Docker Registry URL | Jenkins Global / Job   |
| `HARBOR_PILOT`         | Harbor PILOT Registry URL | Jenkins Global / Job   |
| `HARBOR_PROD`          | Harbor PROD Registry URL  | Jenkins Global / Job   |
| `gitlabSourceRepoName` | GitLab repo 名稱          | GitLab Plugin 自動注入 |
| `gitlabTargetBranch`   | 觸發的 branch/tag         | GitLab Plugin 自動注入 |
| `GIT_URL`              | Git repo URL              | Jenkins SCM 自動注入   |
