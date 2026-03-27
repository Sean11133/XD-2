---
name: wecpy-data-integration
description: >-
  This skill should be used when the user asks about "ApiClientManager HTTP 呼叫 retry", "REST API GET POST PUT PATCH DELETE",
  "ElasticsearchManager search add_must add_should", "DataCacheManager Redis set_cache get_cache remove_cache",
  "FetcherFactory DataFetcher SAP EDWM", "BaseETL extract transform load purge",
  "ReportApiRequest WebApiMessageContent Report API",
  or needs wecpy data integration for HTTP API calls, Elasticsearch, Redis cache, ETL workflows, or Report API.
  (wecpy v1.11.1)
---

# wecpy-data-integration

## 首要原則 — 使用 wecpy，不要重造輪子

> **AI 在實作時，必須優先調用 wecpy 已提供的方法，嚴禁自行重新實作 wecpy 已涵蓋的功能。**

- **禁止**自行用 `requests` / `httpx` 呼叫 REST API → 使用 `ApiClientManager`（已內建 retry、tid propagation、header 管理）
- **禁止**自行組裝 Elasticsearch query JSON → 使用 `ElasticsearchManager` 的 `add_must()` / `add_should()` / `search()`
- **禁止**自行用 `redis` 套件連線 Redis → 使用 `IMXAppContext.set_cache()` / `get_cache()` / `remove_cache()`
- **禁止**自行建立 gRPC channel 呼叫 DataFetcher → 使用 `FetcherFactory.create_client(stub_cls)`
- **禁止**自行實作 ETL 排程流程 → 繼承 `BaseETL` 並覆寫 `purge/extract/transform/load`
- **禁止**自行組裝 Report API 請求 → 使用 `ReportApiRequest` + `WebApiMessageContent`

如果需求可以被本 skill 列出的 API 滿足，就必須使用該 API。只有在 wecpy 確實不提供對應功能時，才能自行實作。

## 適用情境

- 呼叫 REST API 並處理 retry
- Elasticsearch 查詢條件組合
- 以 DataCache 降低重複查詢成本
- 透過 DataFetcher 取得外部資料
- 建立標準 ETL 流程

## 設計模式

| 模組                 | 模式           | 備註                                |
| -------------------- | -------------- | ----------------------------------- |
| ApiClientManager     | Adapter        | 包裝 HTTP retry / tid propagation   |
| ElasticsearchManager | Builder        | 逐步組合 Query DSL                  |
| DataCacheManager     | Proxy          | gRPC-based Redis 代理               |
| DataFetcher          | Factory Method | 透過 FetcherFactory.create_client() |

## API Surface (Anti-Hallucination)

### ApiClientManager

- `ApiClientManager(api_name: str)`
- HTTP methods: `.get()`, `.post()`, `.put()`, `.patch()`, `.delete()`
- Request helpers: `.add_field()`, `.set_data()`, `.set_tid()`
- Properties: `.api_data`, `.api_tid`

### ElasticsearchManager

- `ElasticsearchManager(index: str)`
- `add_must(field, value)` — 建構 must 條件
- `add_should(field, value)` — 建構 should 條件
- `get_query() -> dict` — 取得組合後的 query dict
- `search(request: ElasticsearchRequest) -> ElasticsearchResponse`

### ElasticsearchRequest

```python
from wecpy.elasticsearch_manager import ElasticsearchRequest
req = ElasticsearchRequest()
req.from_ = 0      # 起始偏移
req.size = 10      # 分頁大小
req.index = "logs" # 可覆蓋預設索引
```

- `add_must()`, `add_should()`, `get_query()`

### ElasticsearchResponse / Hit / Total

```python
# response: ElasticsearchResponse
response.total          # Total object
response.total.value    # 符合數量
response.total.relation # "eq" / "gte"
response.max_score      # float
response.hits           # list[Hit]

# hit: Hit
hit.index  # 索引名
hit.type   # _doc
hit.id     # 文件 ID
hit.score  # float
hit.data   # dict 屬性資料
```

### DataCacheManager (透過 IMXAppContext)

```python
from wecpy.imx_app_context import IMXAppContext

IMXAppContext.set_cache(key, value, ttl)    # 寫入 Redis（gRPC to Cacher）
result = IMXAppContext.get_cache(key, cls)   # 讀取快取，cls 可選泛型反序列化
IMXAppContext.remove_cache(key)              # 移除快取
```

- 環境變數 `APP_CACHER_URL` (v1.11.1) — 覆蓋預設 Cacher gRPC 端點

### DataFetcher

- `FetcherFactory.create_client(stub_cls)`
- 環境變數 `APP_FETCHER_URL` (v1.11.1) — 覆蓋預設 Fetcher gRPC 端點
- 環境變數 `APP_IFDC_DATAFETCHER_URL` / `APP_IEDA_DATAFETCHER_URL` / `APP_{package}_URL` — 個別 package 端點

### BaseETL

- lifecycle: `purge() -> extract() -> transform() -> load() -> run()`

### ReportApiRequest (wecpy.shared)

```python
from wecpy.shared.report_api_request import ReportApiRequest
req = ReportApiRequest()
req.add_qi(key, value)
resp = req.get()
```

- `ReportApiRequest.web_api_message_content`
- `ReportApiRequest.add_qi(key, value)`
- `ReportApiRequest.get()`

### WebApiMessageContent (wecpy.shared)

```python
from wecpy.shared.web_api_message_content import WebApiMessageContent
content = WebApiMessageContent()
content.add_field(key, value)
content.jsonify_field(key)
```

## 範例

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.api_client_manager import ApiClientManager

client = ApiClientManager('order_service')
resp = client.get('/orders', params={'date': '2026-01-01'})
```

## 常見幻覺與禁止事項

- **不存在 `ElasticsearchManager.add_filter()`** — 請改用 `add_must()` 或 `add_should()`
- 不存在 `ElasticsearchManager.execute()`
- 不存在 `ApiClientManager.request_json()`
- 不存在 `FetcherFactory.get_client_pool()`
- 不存在 `DataCacheManager.connect()` — 快取由 `IMXAppContext` 靜態方法直接操作
- 不存在 `ReportApiRequest.post()` — 正確為 `get()`
- 不要跳過 `BaseETL.run()` 直接手動拼流程，除非有明確需求
