# 設計模式標準（GoF 23 種）— 索引

本文件是 GoF 全部 23 種設計模式的**索引與速查頁**。詳細意圖說明、適用場景與 C#/Python 程式碼範例請查閱各分類子文件。

> **與 SOLID 的關係**：設計模式是 SOLID 原則的**具體實作手段**。每個模式都標注對應的 SOLID 原則。
>
> **與 Clean Architecture 的關係**：模式多用於 Application / Infrastructure 層的銜接，Domain 層應保持模式的「意圖」而非「實作」。

---

## 子文件（詳細內容）

| 分類              | 模式數 | 子文件                                                         |
| ----------------- | ------ | -------------------------------------------------------------- |
| 創建型 Creational | 5      | [design-patterns-creational.md](design-patterns-creational.md) |
| 結構型 Structural | 7      | [design-patterns-structural.md](design-patterns-structural.md) |
| 行為型 Behavioral | 11     | [design-patterns-behavioral.md](design-patterns-behavioral.md) |

---

## 一、Creational Patterns（創建型模式）— 5 種

| #   | 模式                 | 意圖（一句話）           | SOLID       |
| --- | -------------------- | ------------------------ | ----------- |
| 1   | **Singleton**        | 確保一個類別只有一個實例 | SRP（慎用） |
| 2   | **Factory Method**   | 子類別決定建立哪個物件   | OCP、DIP    |
| 3   | **Abstract Factory** | 建立一組相關物件的介面   | OCP、DIP    |
| 4   | **Builder**          | 分步驟建構複雜物件       | SRP         |
| 5   | **Prototype**        | 複製現有物件建立新物件   | —           |

---

## 二、Structural Patterns（結構型模式）— 7 種

| #   | 模式          | 意圖（一句話）                 | SOLID    |
| --- | ------------- | ------------------------------ | -------- |
| 6   | **Adapter**   | 轉換不相容介面使其協作         | OCP、DIP |
| 7   | **Bridge**    | 將抽象與實作分離獨立變化       | OCP、DIP |
| 8   | **Composite** | 樹狀結構，統一處理單個與組合   | OCP、LSP |
| 9   | **Decorator** | 動態新增職責，優於繼承         | OCP、SRP |
| 10  | **Facade**    | 為子系統提供統一簡單介面       | SRP、DIP |
| 11  | **Flyweight** | 共享大量細粒度物件，減少記憶體 | SRP      |
| 12  | **Proxy**     | 代理控制存取（快取/安全/延遲） | OCP、SRP |

---

## 三、Behavioral Patterns（行為型模式）— 11 種

| #   | 模式                        | 意圖（一句話）                   | SOLID    |
| --- | --------------------------- | -------------------------------- | -------- |
| 13  | **Chain of Responsibility** | 請求沿鍊傳遞，各節點決定是否處理 | OCP、SRP |
| 14  | **Command**                 | 請求封裝為物件，支援 Undo/CQRS   | SRP、OCP |
| 15  | **Iterator**                | 統一遍歷集合，不暴露內部結構     | SRP      |
| 16  | **Mediator**                | 封裝物件互動，降低直接耦合       | SRP、DIP |
| 17  | **Memento**                 | 捕獲並恢復物件狀態               | SRP      |
| 18  | **Observer**                | 一對多依賴，狀態變更自動通知     | OCP、DIP |
| 19  | **State**                   | 狀態改變時改變行為（狀態機）     | OCP、SRP |
| 20  | **Strategy**                | 封裝可替換演算法，取代 if-else   | OCP、DIP |
| 21  | **Template Method**         | 定義演算法骨架，子類別填充步驟   | OCP、LSP |
| 22  | **Visitor**                 | 不改變結構新增操作               | OCP      |
| 23  | **Interpreter**             | 為 DSL/規則引擎定義文法          | —        |

---

## 模式速查表

### 按 SOLID 對應

| 原則 | 相關模式                                                              |
| ---- | --------------------------------------------------------------------- |
| SRP  | Facade, Command, Iterator, Decorator                                  |
| OCP  | Strategy, Observer, Chain of Responsibility, Visitor, Template Method |
| LSP  | Composite, Bridge, Template Method                                    |
| ISP  | Adapter, Proxy                                                        |
| DIP  | Factory Method, Abstract Factory, Observer, Mediator, Adapter         |

### 按 Clean Architecture 層次

| 層次           | 常用模式                                                                           |
| -------------- | ---------------------------------------------------------------------------------- |
| Domain         | Builder（Entity 建構）, Observer（Domain Event）, State（狀態機）, Memento         |
| Application    | Command（CQRS）, Mediator, Template Method（Use Case 流程）, Iterator              |
| Infrastructure | Adapter（外部整合）, Decorator（快取/重試）, Proxy（存取控制）, Flyweight          |
| Cross-cutting  | Factory Method / Abstract Factory（物件建立）, Chain of Responsibility（驗證管線） |

### ai-loop 使用的模式

| 模式                    | 位置                                    | 說明                         |
| ----------------------- | --------------------------------------- | ---------------------------- |
| Template Method         | `ai-loop/core/loop-orchestrator.md`     | 固定 Dev→Test→Review 骨架    |
| Strategy                | `ai-loop/adapters/adapter-interface.md` | 可替換的框架行為             |
| Chain of Responsibility | `ai-loop/adapters/*/detector.md`        | 依優先序偵測框架             |
| Factory Method          | `ai-loop/adapters/adapter-registry.md`  | 從 framework_id 建立 Adapter |
| Composite               | `ai-loop/adapters/adapter-registry.md`  | 多框架同時支援               |

### 按情境選用（快速對照）

| 情境                           | 建議模式                 |
| ------------------------------ | ------------------------ |
| 需要根據類型執行不同演算法     | Strategy                 |
| 物件建立過程複雜               | Builder / Factory Method |
| 需要統一處理一系列物件         | Composite / Iterator     |
| 需要跨層通知事件               | Observer / Domain Event  |
| 需要加強功能但不修改既有類別   | Decorator                |
| 需要整合不相容介面             | Adapter                  |
| 多步驟固定流程 with 可替換步驟 | Template Method          |
| 需要攔截/控制物件存取          | Proxy                    |
