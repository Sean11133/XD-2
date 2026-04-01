# ElasticsearchManager 詳解

## 目錄

- [config.yaml 設定](#configyaml-設定)
  - [設定欄位說明](#設定欄位說明)
- [初始化](#初始化)
- [API 方法參考](#api-方法參考)
- [基本查詢](#基本查詢)
  - [使用 add_must 條件查詢](#使用-add_must-條件查詢)
  - [多條件查詢](#多條件查詢)
  - [使用 add_should 條件查詢（OR 邏輯）](#使用-add_should-條件查詢or-邏輯)
  - [混合使用 must 和 should](#混合使用-must-和-should)
  - [get_query - 取得目前查詢條件](#get_query-取得目前查詢條件)
- [完整範例](#完整範例)
  - [搜尋日誌](#搜尋日誌)
  - [搜尋物件儲存 Metadata](#搜尋物件儲存-metadata)
- [進階查詢](#進階查詢)
  - [ElasticsearchRequest 進階查詢](#elasticsearchrequest-進階查詢)
- [最佳實務](#最佳實務)
  - [1. 使用正確的 Index 名稱](#1-使用正確的-index-名稱)
  - [2. 處理查詢結果](#2-處理查詢結果)
  - [3. 錯誤處理](#3-錯誤處理)
- [常見問題](#常見問題)
  - [Q1：缺少參數錯誤](#q1缺少參數錯誤)
  - [Q2：Index 不存在](#q2index-不存在)
  - [Q3：連線失敗](#q3連線失敗)
  - [Q4：查詢無結果](#q4查詢無結果)

本文件詳細說明 wecpy 框架中 ElasticsearchManager 的使用方式。

## config.yaml 設定

```yaml
Elasticsearch:
  ElasticsearchServer:
    hosts: http://10.18.20.131:9200,http://10.18.20.132:9200,http://10.18.20.133:9200
```

### 設定欄位說明

| 欄位 | 說明 | 必要 |
|-----|------|-----|
| hosts | Elasticsearch 節點位址（逗號分隔） | ✅ |

## 初始化

**重要**：ElasticsearchManager **必須**傳入 config_name 和 index_name 兩個參數。

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.elasticsearch_manager.elasticsearch_manager import ElasticsearchManager

# 初始化 - 必須傳入 config_name 和 index_name
es = ElasticsearchManager("ElasticsearchServer", "storagegrid-metadata")
```

## API 方法參考

| 方法 | 說明 |
|-----|------|
| `__init__(elasticsearch_name, index, url=None)` | 初始化，傳入設定名稱和 index 名稱 |
| `search(query=None)` | 執行搜尋，可傳入 ElasticsearchRequest |
| `add_must(key, value)` | 加入 AND 條件（所有 must 條件都要符合） |
| `add_should(key, value)` | 加入 OR 條件（至少符合一個 should 條件） |
| `get_query() → dict` | 取得目前組裝的查詢條件 dict，可用於除錯 |

## 基本查詢

### 使用 add_must 條件查詢

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.elasticsearch_manager.elasticsearch_manager import ElasticsearchManager

# 初始化（必須傳入兩個參數）
es = ElasticsearchManager("ElasticsearchServer", "storagegrid-metadata")

# 新增 must 查詢條件
es.add_must("metadata.system", "IIDS")

# 執行搜尋
res = es.search()

# 處理結果
for hit in res.hits:
    print(hit.data["bucket"])
    print(hit.data["key"])
    print(hit.data["metadata"]["system"])
```

### 多條件查詢

```python
es = ElasticsearchManager("ElasticsearchServer", "logs-index")

# 新增多個 must 條件（AND 邏輯）
es.add_must("level", "ERROR")
es.add_must("system", "IRS")
es.add_must("app", "MODEL_MONITOR")

# 執行搜尋
res = es.search()

for hit in res.hits:
    print(f"時間: {hit.data.get('timestamp')}")
    print(f"訊息: {hit.data.get('message')}")
```

### 使用 add_should 條件查詢（OR 邏輯）

`add_should` 加入 OR 條件，查詢結果至少需符合一個 should 條件。

```python
es = ElasticsearchManager("ElasticsearchServer", "logs-index")

# 新增 should 條件（OR 邏輯）- 至少符合其中一個
es.add_should("level", "ERROR")
es.add_should("level", "WARN")

# 執行搜尋 - 會回傳 level 為 ERROR 或 WARN 的資料
res = es.search()

for hit in res.hits:
    print(f"Level: {hit.data.get('level')}, 訊息: {hit.data.get('message')}")
```

### 混合使用 must 和 should

```python
es = ElasticsearchManager("ElasticsearchServer", "logs-index")

# must 條件：一定要符合（AND）
es.add_must("system", "IRS")

# should 條件：至少符合一個（OR）
es.add_should("level", "ERROR")
es.add_should("level", "WARN")

# 查詢：system 為 IRS，且 level 為 ERROR 或 WARN
res = es.search()
```

### get_query - 取得目前查詢條件

`get_query()` 回傳目前組裝的查詢條件 dict，可用於除錯或確認查詢是否正確。

```python
es = ElasticsearchManager("ElasticsearchServer", "logs-index")

es.add_must("system", "IRS")
es.add_should("level", "ERROR")
es.add_should("level", "WARN")

# 取得目前查詢條件（用於除錯）
query = es.get_query()
print(query)
# 輸出查詢 dict，可檢查條件是否正確

# 確認無誤後執行搜尋
res = es.search()
```

## 完整範例

### 搜尋日誌

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.elasticsearch_manager.elasticsearch_manager import ElasticsearchManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def search_error_logs(system: str, date: str):
    """搜尋錯誤日誌"""
    
    # 初始化（必須傳入 config_name 和 index_name）
    es = ElasticsearchManager("ElasticsearchServer", f"logs-{date}")
    
    # 新增查詢條件
    es.add_must("level", "ERROR")
    es.add_must("system", system)
    
    # 執行搜尋
    res = es.search()
    
    log.info(f"找到 {len(res.hits)} 筆錯誤日誌")
    
    for hit in res.hits:
        log.info(f"錯誤: {hit.data.get('message')}")
    
    return res.hits

if __name__ == "__main__":
    errors = search_error_logs("IRS", "2024-01-14")
```

### 搜尋物件儲存 Metadata

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.elasticsearch_manager.elasticsearch_manager import ElasticsearchManager

def search_storage_metadata(system: str):
    """搜尋物件儲存 metadata"""
    
    es = ElasticsearchManager("ElasticsearchServer", "storagegrid-metadata")
    
    # 新增查詢條件
    es.add_must("metadata.system", system)
    
    # 執行搜尋
    res = es.search()
    
    results = []
    for hit in res.hits:
        results.append({
            "bucket": hit.data["bucket"],
            "key": hit.data["key"],
            "system": hit.data["metadata"]["system"]
        })
    
    return results

if __name__ == "__main__":
    items = search_storage_metadata("IIDS")
    for item in items:
        print(f"Bucket: {item['bucket']}, Key: {item['key']}")
```

## 進階查詢

### ElasticsearchRequest — 分頁查詢

`ElasticsearchRequest` 支援 `from_`（偏移量）和 `size`（每頁筆數）來控制分頁：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.elasticsearch_manager.elasticsearch_manager import ElasticsearchManager
from wecpy.elasticsearch_manager.elasticsearch_request import ElasticsearchRequest

def paginated_search():
    """分頁查詢範例"""
    es = ElasticsearchManager("ElasticsearchServer", "logs-index")

    # 建立 ElasticsearchRequest（傳入 index 名稱）
    request = ElasticsearchRequest("logs-index")
    request.add_must("level", "ERROR")
    request.add_must("system", "IRS")

    # 分頁設定
    request.from_ = 0      # 從第 0 筆開始（偏移量）
    request.size = 50       # 每頁 50 筆（預設 10）

    # 執行查詢（傳入 request 物件）
    res = es.search(query=request)

    return res.hits
```

### ElasticsearchRequest 欄位

| 欄位 | 型別 | 說明 |
|-----|------|------|
| `index` | `str` | 查詢的 index 名稱（constructor 傳入） |
| `from_` | `int` | 分頁偏移量（預設 0） |
| `size` | `int` | 每頁筆數（預設 10） |
| `add_must(key, value)` | method | 加入 AND 條件 |
| `add_should(key, value)` | method | 加入 OR 條件 |
| `get_query()` | method | 取得查詢 dict |

### ElasticsearchResponse 結構

`search()` 回傳 `ElasticsearchResponse`：

```python
res = es.search()

# 總筆數
print(res.total.value)       # e.g., 42
print(res.total.relation)    # e.g., "eq" 或 "gte"

# 最高分數
print(res.max_score)         # e.g., 1.0

# Hit 列表
for hit in res.hits:
    print(hit.index)    # index 名稱
    print(hit.id)       # 文件 ID
    print(hit.score)    # 相關度分數
    print(hit.data)     # 文件內容（dict）
```

| 欄位 | 型別 | 說明 |
|-----|------|------|
| `res.total.value` | `int` | 符合條件的總筆數 |
| `res.total.relation` | `str` | "eq"（精確）或 "gte"（大於等於） |
| `res.max_score` | `float` | 最高相關度分數 |
| `res.hits` | `list[Hit]` | Hit 物件列表 |
| `hit.index` | `str` | 來源 index 名稱 |
| `hit.id` | `str` | 文件 ID |
| `hit.score` | `float` | 相關度分數 |
| `hit.data` | `dict` | 文件內容 |

## 最佳實務

### 1. 使用正確的 Index 名稱
```python
# ✅ 正確 - 使用具體的 index 名稱
es = ElasticsearchManager("ElasticsearchServer", "storagegrid-metadata")
es = ElasticsearchManager("ElasticsearchServer", "logs-2024-01-14")

# ❌ 避免 - 不要忘記 index_name 參數
es = ElasticsearchManager("ElasticsearchServer")  # 錯誤！缺少 index_name
```

### 2. 處理查詢結果
```python
res = es.search()

# 檢查是否有結果
if res.hits:
    for hit in res.hits:
        # 安全取值
        bucket = hit.data.get("bucket", "N/A")
        key = hit.data.get("key", "N/A")
else:
    log.info("沒有找到符合條件的資料")
```

### 3. 錯誤處理
```python
try:
    es = ElasticsearchManager("ElasticsearchServer", "my-index")
    es.add_must("field", "value")
    res = es.search()
except Exception as e:
    log.error(f"ES 查詢失敗: {e}")
```

## 常見問題

### Q1：缺少參數錯誤
```
原因：ElasticsearchManager 初始化時缺少必要參數
解決：
# ❌ 錯誤 - 缺少 index_name
es = ElasticsearchManager("ElasticsearchServer")

# ✅ 正確 - 傳入 config_name 和 index_name
es = ElasticsearchManager("ElasticsearchServer", "my-index")
```

### Q2：Index 不存在
```
原因：指定的 index 名稱不存在於 Elasticsearch
解決：
1. 確認 index 名稱正確
2. 確認 index 已建立
3. 檢查 index 是否有時間後綴（如 logs-2024-01-14）
```

### Q3：連線失敗
```
原因：無法連線到 Elasticsearch 節點
解決：
1. 確認 hosts 設定正確
2. 確認網路可連通
3. 確認 Elasticsearch 服務正常
```

### Q4：查詢無結果
```
原因：查詢條件不符或資料不存在
解決：
1. 確認 add_must 的欄位名稱正確
2. 確認欄位值正確
3. 使用 Kibana 驗證查詢
```
