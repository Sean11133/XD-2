---
name: wecpy-monitoring
description: >
  Invoke for ANY wecpy monitoring, observability, or metrics operation.
  Covers: APMManager (Elastic APM transaction/span tracking, @capture decorator, capture_exception, capture_error_message, add_label),
  COPManager (Prometheus counter/gauge/histogram/summary, add_label, reset_counter, Pushgateway),
  ElasticsearchManager (add_must/add_should queries, ElasticsearchRequest pagination from_/size, ElasticsearchResponse/Hit).
  Keywords: APM、效能監控、transaction、tracing、COP、Prometheus、counter、gauge、histogram、指標上報、
  Elasticsearch、ES 查詢、日誌搜尋、log search、observability、錯誤追蹤、capture_exception。
  Excludes LogManager→wecpy-core, Kafka→wecpy-kafka, DB→wecpy-database, FTP/S3/API→wecpy-io.
---

# wecpy 監控整合技能

本技能提供 wecpy 框架的監控整合指南，支援 APM 效能追蹤、COP 指標上報、Elasticsearch 搜尋。

> **前置條件**：請先閱讀 `wecpy-core` 技能了解 ConfigManager 初始化規範。

## 支援的監控元件

| 元件 | 用途 | 整合系統 |
|-----|------|---------|
| `APMManager` | 效能追蹤、分散式追蹤 | Elastic APM |
| `COPManager` | 指標收集與上報 | Prometheus |
| `ElasticsearchManager` | 日誌/資料搜尋 | Elasticsearch |

## 快速開始

### 1. config.yaml 設定

```yaml
# APM 設定
Apm:
  apmserver:
    enabled: true
    server_url: http://ctpilotapm:8200

# COP 設定
COP:
  COPServer:
    host: "http://fppushgateway"

# Elasticsearch 設定
Elasticsearch:
  ElasticsearchServer:
    hosts: http://es1:9200,http://es2:9200,http://es3:9200
```

### 2. APMManager 使用

APMManager **必須**傳入 `apm_name` 參數，採用 Singleton 模式：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.apm_manager.apm_manager import APMManager

# 初始化（必須傳入 apm_name）
apm = APMManager("apmserver")

# 模式一：手動控制 Transaction
apm.begin_transaction()
try:
    # 業務邏輯
    process_data()
    apm.end_transaction("success")
except Exception as e:
    apm.capture_exception()
    apm.end_transaction("error")
    raise
```

```python
# 模式二：Context Manager
with APMManager("apmserver") as apm:
    apm.begin_transaction()
    # 業務邏輯
    process_data()
```

```python
# 模式三：Decorator（@apm.capture）
apm = APMManager("apmserver")

@apm.capture()
def my_function():
    """整個函式自動被追蹤為一個 transaction"""
    pass

@apm.capture("custom_transaction_name")
def another_function():
    """使用自訂名稱追蹤"""
    pass
```

### 3. COPManager 使用

COPManager **必須**傳入 `cop_name` 參數，另可選擇性傳入 `metric_name` 和 `labels`：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.cop_manager import COPManager

# 基本初始化（必須傳入 cop_name）
cop = COPManager("COPServer")

# 進階初始化 - 帶預設 metric_name 和 labels
cop = COPManager("COPServer", metric_name="myapp_metric", labels={"system": "IRS"})

# Counter（計數器）- 預設增加 1
cop.counter("customized_Report_Schedule_Counter")

# 指定增加值，帶標籤
cop.counter("customized_Report_Schedule_Counter", value=5, labels={"env": "PROD"})

# Gauge（儀表）
cop.gauge("queue_size", 42)

# Histogram（直方圖）
cop.histogram("process_duration", 1.25)

# Summary（摘要）
cop.summary("response_time", 0.35)
```

### 4. ElasticsearchManager 使用

ElasticsearchManager **必須**傳入 config_name 和 index_name 兩個參數：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.elasticsearch_manager.elasticsearch_manager import ElasticsearchManager

# 初始化（必須傳入 config_name 和 index_name）
es = ElasticsearchManager("ElasticsearchServer", "storagegrid-metadata")

# 新增查詢條件（AND）
es.add_must("metadata.system", "IIDS")

# 新增查詢條件（OR）
es.add_should("metadata.type", "typeA")
es.add_should("metadata.type", "typeB")

# 執行搜尋
res = es.search()

# 處理結果
for hit in res.hits:
    print(hit.data["bucket"])
    print(hit.data["key"])
    print(hit.data["metadata"]["system"])
```

## APMManager 完整範例

### Schedule 排程任務監控

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.apm_manager.apm_manager import APMManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def main():
    apm = APMManager("apmserver")
    apm.begin_transaction()
    
    try:
        log.info("排程任務開始")
        
        # 業務邏輯
        from department_salary_etl import DepartmentSalaryETL
        etl = DepartmentSalaryETL("2024")
        etl.run()
        
        log.info("排程任務完成")
        apm.end_transaction("success")
        
    except Exception as e:
        log.error(f"排程任務失敗: {e}")
        apm.capture_exception()
        apm.end_transaction("error")
        raise

if __name__ == "__main__":
    main()
```

### 使用 with 語法

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.apm_manager.apm_manager import APMManager

if __name__ == "__main__":
    with APMManager("apmserver") as apm:
        apm.begin_transaction()
        # 業務邏輯
        from department_salary_etl import DepartmentSalaryETL
        etl = DepartmentSalaryETL("2024")
        etl.run()
```

## 詳細參考文件

- [APMManager 詳解](references/apm.md) — 當使用者需要 APM 進階操作（span 追蹤、custom context、分散式追蹤、錯誤分類）時閱讀
- [COPManager 詳解](references/cop.md) — 當使用者需要 COP 進階操作（自訂 metric 名稱、labels 設計、histogram buckets、Pushgateway 設定）時閱讀
- [ElasticsearchManager 詳解](references/elasticsearch.md) — 當使用者需要 ES 進階查詢（複合條件、聚合、分頁、index pattern、hit 結構解析）時閱讀

## 資源檔案

- [監控 config.yaml 模板](assets/monitoring-config.yaml)

## 常見問題

### Q1：APM 資料未上報
```
檢查項目：
1. Apm.apmserver.enabled 是否為 true
2. server_url 是否正確
3. 網路是否可連通 APM Server
4. 是否有呼叫 begin_transaction() 和 end_transaction()
```

### Q2：COP 指標未顯示
```
檢查項目：
1. COP.COPServer.host 是否正確
2. Pushgateway 是否正常運作
3. 指標名稱是否符合規範
```

### Q3：ES 查詢失敗
```
檢查項目：
1. Elasticsearch hosts 是否正確
2. index 名稱是否存在
3. 查詢語法是否正確
4. 是否有傳入正確的 config_name 和 index_name
```
