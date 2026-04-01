# Skill 索引

本文件集中列出所有可用的 AI Skills，按類別分組。點擊各 Skill 連結查閱詳細用法與執行步驟。

---

## 核心流程 Skills（頂層 `skills/`）

| Skill               | 觸發時機                      | 路徑                                                                      |
| ------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| `pm`                | 描述業務需求，啟動完整流程    | [skills/pm/SKILL.md](../skills/pm/SKILL.md)                               |
| `architect`         | 讀取 spec.md，產出 FRD + plan | [skills/architect/SKILL.md](../skills/architect/SKILL.md)                 |
| `ai-loop`           | 詢問 Inner Loop 運作方式      | [skills/ai-loop/SKILL.md](../skills/ai-loop/SKILL.md)                     |
| `skill-development` | 建立或改善 Skill / Agent 定義 | [skills/skill-development/SKILL.md](../skills/skill-development/SKILL.md) |

## Git 工作流 Skills

| Skill                 | 觸發時機                                | 路徑                                                                          |
| --------------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| `git-smart-commit`    | 整理雜亂的 git 變更為有意義的 Commits   | [skills/git-smart-commit/SKILL.md](../skills/git-smart-commit/SKILL.md)       |
| `git-pr-description`  | 建立 Pull Request Title & Description   | [skills/git-pr-description/SKILL.md](../skills/git-pr-description/SKILL.md)   |
| `git-worktree-design` | 多功能需求或需要平行開發時拆分 Worktree | [skills/git-worktree-design/SKILL.md](../skills/git-worktree-design/SKILL.md) |

## 部署 / UI 設計 Skills

| Skill           | 觸發時機                                 | 路徑                                                              |
| --------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| `aip-deploy`    | 部署 / CI/CD（Dockerfile、Jenkinsfile）  | [skills/aip-deploy/SKILL.md](../skills/aip-deploy/SKILL.md)       |
| `ui-ux-pro-max` | UI/UX 設計（Landing Page、Dashboard 等） | [skills/ui-ux-pro-max/SKILL.md](../skills/ui-ux-pro-max/SKILL.md) |

---

## WEC Angular（wec-main）Framework Skills（`frameworks/wec-main/skills/`）

| Skill                                 | 說明                                      | 路徑                                                                                                                                                  |
| ------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wec-framework-intro`                 | 認識 wec-main 框架架構與組成              | [frameworks/wec-main/skills/wec-framework-intro/SKILL.md](../frameworks/wec-main/skills/wec-framework-intro/SKILL.md)                                 |
| `wec-framework-install`               | Fork wec-main + 設定 upstream + submodule | [frameworks/wec-main/skills/wec-framework-install/SKILL.md](../frameworks/wec-main/skills/wec-framework-install/SKILL.md)                             |
| `wec-system-init`                     | 建立新系統（`ng generate library`）       | [frameworks/wec-main/skills/wec-system-init/SKILL.md](../frameworks/wec-main/skills/wec-system-init/SKILL.md)                                         |
| `wec-menu-development`                | 建立選單與路由設定                        | [frameworks/wec-main/skills/wec-menu-development/SKILL.md](../frameworks/wec-main/skills/wec-menu-development/SKILL.md)                               |
| `wec-aggrid-page`                     | AG Grid 頁面開發模式                      | [frameworks/wec-main/skills/wec-aggrid-page/SKILL.md](../frameworks/wec-main/skills/wec-aggrid-page/SKILL.md)                                         |
| `wec-reactive-form-pattern`           | Reactive Form 開發模式                    | [frameworks/wec-main/skills/wec-reactive-form-pattern/SKILL.md](../frameworks/wec-main/skills/wec-reactive-form-pattern/SKILL.md)                     |
| `wec-service-dataservice-crud`        | DataService CRUD 服務開發                 | [frameworks/wec-main/skills/wec-service-dataservice-crud/SKILL.md](../frameworks/wec-main/skills/wec-service-dataservice-crud/SKILL.md)               |
| `wec-page-scaffold`                   | 頁面鷹架生成（完整頁面元件組合）          | [frameworks/wec-main/skills/wec-page-scaffold/SKILL.md](../frameworks/wec-main/skills/wec-page-scaffold/SKILL.md)                                     |
| `wec-dialog-pattern`                  | Dialog 對話框開發模式                     | [frameworks/wec-main/skills/wec-dialog-pattern/SKILL.md](../frameworks/wec-main/skills/wec-dialog-pattern/SKILL.md)                                   |
| `wec-migration-deprecated-components` | 遷移廢棄元件至新版                        | [frameworks/wec-main/skills/wec-migration-deprecated-components/SKILL.md](../frameworks/wec-main/skills/wec-migration-deprecated-components/SKILL.md) |

---

## Python wecpy Framework Skills（`frameworks/wec-py/skills/`）

| Skill               | 說明                                           | 路徑                                                                                                          |
| ------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `wecpy-core`        | wecpy 核心模組（ConfigManager、LogManager 等） | [frameworks/wec-py/skills/wecpy-core/SKILL.md](../frameworks/wec-py/skills/wecpy-core/SKILL.md)               |
| `wecpy-database`    | DatabaseManager 資料庫操作                     | [frameworks/wec-py/skills/wecpy-database/SKILL.md](../frameworks/wec-py/skills/wecpy-database/SKILL.md)       |
| `wecpy-datafetcher` | DataFetcher 資料抓取整合                       | [frameworks/wec-py/skills/wecpy-datafetcher/SKILL.md](../frameworks/wec-py/skills/wecpy-datafetcher/SKILL.md) |
| `wecpy-fdc`         | FDC（Financial Data Client）整合               | [frameworks/wec-py/skills/wecpy-fdc/SKILL.md](../frameworks/wec-py/skills/wecpy-fdc/SKILL.md)                 |
| `wecpy-fix-init`    | 自動掃描並修復 wecpy init 前置結構缺失         | [frameworks/wec-py/skills/wecpy-fix-init/SKILL.md](../frameworks/wec-py/skills/wecpy-fix-init/SKILL.md)       |
| `wecpy-io`          | IO 操作（檔案讀寫、資料匯出）                  | [frameworks/wec-py/skills/wecpy-io/SKILL.md](../frameworks/wec-py/skills/wecpy-io/SKILL.md)                   |
| `wecpy-kafka`       | Kafka 消費者/生產者整合                        | [frameworks/wec-py/skills/wecpy-kafka/SKILL.md](../frameworks/wec-py/skills/wecpy-kafka/SKILL.md)             |
| `wecpy-monitoring`  | 監控與告警整合                                 | [frameworks/wec-py/skills/wecpy-monitoring/SKILL.md](../frameworks/wec-py/skills/wecpy-monitoring/SKILL.md)   |
| `wecpy-refactor`    | wecpy 專案重構指引                             | [frameworks/wec-py/skills/wecpy-refactor/SKILL.md](../frameworks/wec-py/skills/wecpy-refactor/SKILL.md)       |

---

## iMX Framework（.NET）Skills（`frameworks/imxframework/skills/`）

| Skill         | 說明                                                | 路徑                                                                                                          |
| ------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `imx-intro`   | 認識 iMX Framework 架構與組成                       | [frameworks/imxframework/skills/imx-intro/SKILL.md](../frameworks/imxframework/skills/imx-intro/SKILL.md)     |
| `imx-init`    | 建立新 iMX 專案（appsettings + DI 設定）            | [frameworks/imxframework/skills/imx-init/SKILL.md](../frameworks/imxframework/skills/imx-init/SKILL.md)       |
| `imx-develop` | iMX 功能開發指引（Repository、Service、Controller） | [frameworks/imxframework/skills/imx-develop/SKILL.md](../frameworks/imxframework/skills/imx-develop/SKILL.md) |

---

## 共用 / 跨框架 Skills（`frameworks/shared/`）

| Skill          | 說明                           | 路徑                                                                                                          |
| -------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `ifdc-connect` | iEDA / iFDC 資料介接層連線設定 | [frameworks/shared/ifdc/skills/ifdc-connect/SKILL.md](../frameworks/shared/ifdc/skills/ifdc-connect/SKILL.md) |
