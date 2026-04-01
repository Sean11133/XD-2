# ApiClientManager 詳解

## 目錄

- [config.yaml 設定](#configyaml-設定)
  - [設定欄位說明](#設定欄位說明)
- [初始化](#初始化)
- [基本使用](#基本使用)
  - [GET 請求](#get-請求)
  - [POST 請求](#post-請求)
  - [PUT / DELETE / PATCH 請求](#put-delete-patch-請求)
- [add_field 方法](#add_field-方法)
- [set_data 與 set_tid 方法](#set_data-與-set_tid-方法)
  - [set_data](#set_data)
  - [set_tid](#set_tid)
- [完整範例](#完整範例)
  - [查詢設備資料](#查詢設備資料)
  - [批次查詢](#批次查詢)
  - [整合 APM 監控](#整合-apm-監控)
- [方法摘要](#方法摘要)
- [最佳實務](#最佳實務)
  - [1. 每次請求新建實例](#1-每次請求新建實例)
  - [2. 檢查回應狀態](#2-檢查回應狀態)
  - [3. 錯誤處理](#3-錯誤處理)
- [常見問題](#常見問題)
  - [Q1：請求逾時](#q1請求逾時)
  - [Q2：認證失敗](#q2認證失敗)
  - [Q3：參數未正確傳遞](#q3參數未正確傳遞)
  - [Q4：回應解析失敗](#q4回應解析失敗)

本文件詳細說明 wecpy 框架中 ApiClientManager（API 呼叫）的使用方式。

## config.yaml 設定

```yaml
APIClient:
  imxportal:
    base_url: "http://10.18.20.56:8050"
    timeout: 10
    retry: 3
    wec_pat: "{wec_pat}"

  report:
    base_url: "http://report/api/ToAPI/getReportData"
    timeout: 30
    retry: 3
    wec_pat: "{wec_pat}"

  ctifdc:
    base_url: "http://ctifdc"
    timeout: 10
    retry: 3
```

### 設定欄位說明

| 欄位 | 說明 | 必要 |
|-----|------|-----|
| base_url | API 基礎 URL | ✅ |
| timeout | 請求逾時時間（秒） | ⚠️ |
| retry | 重試次數 | ⚠️ |
| wec_pat | WEC PAT Token（使用環境變數） | ⚠️ |

## 初始化

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.api_client_manager import ApiClientManager

# 使用 config.yaml 中定義的 API 設定名稱
api = ApiClientManager("ctifdc")
```

## 基本使用

### GET 請求

使用 `add_field()` 方法添加請求參數：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.api_client_manager import ApiClientManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def get_request():
    """GET 請求範例"""
    api = ApiClientManager("ctifdc")

    # 使用 add_field 添加查詢參數
    api.add_field("eqpIdList", "EAPLYB04")
    api.add_field("chamberList", "EAPLYB04_CA,C2,C3")

    # 發送 GET 請求
    response = api.get("/dataapi/ECRP/Svid")

    log.info(f"回應: {response.text}")
    return response

if __name__ == "__main__":
    get_request()
```

### POST 請求

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.api_client_manager import ApiClientManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def post_request():
    """POST 請求範例"""
    api = ApiClientManager("ctifdc")

    # 使用 add_field 添加參數（支援列表）
    api.add_field("eqpIdList", ["EAPLYB04"])
    api.add_field("chamberList", ["EAPLYB04_CA", "C2", "C3"])

    # 發送 POST 請求
    response = api.post("/dataapi/ECRP/Svid")

    log.info(f"回應: {response.text}")
    return response

if __name__ == "__main__":
    post_request()
```

### PUT / DELETE / PATCH 請求

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.api_client_manager import ApiClientManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def put_request():
    """PUT 請求範例"""
    api = ApiClientManager("imxportal")
    api.add_field("name", "updated_value")

    response = api.put("/api/resource/1")
    log.info(f"PUT 回應: {response.text}")

def delete_request():
    """DELETE 請求範例"""
    api = ApiClientManager("imxportal")

    response = api.delete("/api/resource/1")
    log.info(f"DELETE 回應: {response.text}")

def patch_request():
    """PATCH 請求範例"""
    api = ApiClientManager("imxportal")
    api.add_field("status", "active")

    response = api.patch("/api/resource/1")
    log.info(f"PATCH 回應: {response.text}")

if __name__ == "__main__":
    put_request()
    delete_request()
    patch_request()
```

## add_field 方法

`add_field()` 是添加請求參數的主要方法：

```python
api = ApiClientManager("ctifdc")

# 添加字串參數
api.add_field("param1", "value1")

# 添加列表參數
api.add_field("param2", ["value1", "value2", "value3"])

# 添加多個參數
api.add_field("eqpIdList", "EAPLYB04")
api.add_field("chamberList", "EAPLYB04_CA,C2,C3")
api.add_field("startDate", "2024-01-01")
api.add_field("endDate", "2024-01-31")
```

## set_data 與 set_tid 方法

### set_data

直接設定請求資料（取代 `add_field` 逐一設定）：

```python
api = ApiClientManager("ctifdc")

# 直接設定完整請求資料
api.set_data({
    "eqpIdList": ["EAPLYB04"],
    "chamberList": ["EAPLYB04_CA", "C2", "C3"]
})

response = api.post("/dataapi/ECRP/Svid")
```

### set_tid

設定 Transaction ID 用於追蹤：

```python
api = ApiClientManager("ctifdc")
api.set_tid("TXN-20240701-001")
api.add_field("eqpIdList", "EAPLYB04")

response = api.get("/dataapi/ECRP/Svid")
```

## 完整範例

### 查詢設備資料

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.api_client_manager import ApiClientManager
from wecpy.log_manager import LogManager
import json

log = LogManager.get_logger()

def query_equipment_data():
    """查詢設備資料"""
    try:
        api = ApiClientManager("ctifdc")
        
        # 添加查詢參數
        api.add_field("eqpIdList", "EAPLYB04")
        api.add_field("chamberList", "EAPLYB04_CA,C2,C3")
        
        # GET 請求
        response = api.get("/dataapi/ECRP/Svid")
        
        if response.status_code == 200:
            data = json.loads(response.text)
            log.info(f"查詢成功，取得 {len(data)} 筆資料")
            return data
        else:
            log.error(f"查詢失敗: {response.status_code}")
            return None
            
    except Exception as e:
        log.error(f"API 呼叫失敗: {e}")
        return None

if __name__ == "__main__":
    data = query_equipment_data()
    if data:
        log.info(f"查詢結果: {json.dumps(data, indent=2)}")
```

### 批次查詢

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.api_client_manager import ApiClientManager
from wecpy.log_manager import LogManager
import json

log = LogManager.get_logger()

def batch_query(equipment_list: list):
    """批次查詢多台設備"""
    results = []
    
    for eqp_id in equipment_list:
        try:
            # 每次查詢需要新建 ApiClientManager
            api = ApiClientManager("ctifdc")
            api.add_field("eqpIdList", eqp_id)
            
            response = api.get("/dataapi/ECRP/Svid")
            
            if response.status_code == 200:
                data = json.loads(response.text)
                results.append({
                    "equipment": eqp_id,
                    "data": data,
                    "status": "success"
                })
                log.info(f"設備 {eqp_id} 查詢成功")
            else:
                results.append({
                    "equipment": eqp_id,
                    "error": response.status_code,
                    "status": "failed"
                })
                log.warning(f"設備 {eqp_id} 查詢失敗: {response.status_code}")
                
        except Exception as e:
            results.append({
                "equipment": eqp_id,
                "error": str(e),
                "status": "error"
            })
            log.error(f"設備 {eqp_id} 查詢錯誤: {e}")
    
    return results

if __name__ == "__main__":
    equipment_list = ["EAPLYB04", "EAPLYB05", "EAPLYB06"]
    results = batch_query(equipment_list)

    for result in results:
        log.info(f"{result['equipment']}: {result['status']}")
```

### 整合 APM 監控

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.api_client_manager import ApiClientManager
from wecpy.apm_manager.apm_manager import APMManager
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

def api_with_monitoring():
    """API 呼叫帶 APM 監控"""
    apm = APMManager("apmserver")
    apm.begin_transaction()
    
    try:
        api = ApiClientManager("ctifdc")
        api.add_field("eqpIdList", "EAPLYB04")
        
        response = api.get("/dataapi/ECRP/Svid")
        
        if response.status_code == 200:
            log.info("API 呼叫成功")
            apm.end_transaction("success")
        else:
            log.warning(f"API 回應異常: {response.status_code}")
            apm.end_transaction("error")
            
        return response
        
    except Exception as e:
        log.error(f"API 呼叫失敗: {e}")
        apm.capture_exception()
        apm.end_transaction("error")
        raise

if __name__ == "__main__":
    api_with_monitoring()
```

## 方法摘要

| 方法 | 說明 | 參數 |
|-----|------|------|
| `add_field(key, value)` | 添加請求參數 | 參數名, 參數值 |
| `set_data(data)` | 直接設定請求資料 | 資料物件 |
| `set_tid(tid)` | 設定 Transaction ID | TID 字串 |
| `get(url)` | 發送 GET 請求 | API 路徑 |
| `post(url)` | 發送 POST 請求 | API 路徑 |
| `put(url)` | 發送 PUT 請求 | API 路徑 |
| `delete(url)` | 發送 DELETE 請求 | API 路徑 |
| `patch(url)` | 發送 PATCH 請求 | API 路徑 |

> **注意**：`get`、`post`、`put`、`delete`、`patch` 方法皆支援可選參數 `url`（路徑）、`headers`（自訂標頭）、`data`（請求資料）。

## 最佳實務

### 1. 每次請求新建實例
```python
# ✅ 正確 - 每次請求新建
for item in items:
    api = ApiClientManager("ctifdc")
    api.add_field("id", item)
    response = api.get("/path")

# ❌ 錯誤 - 複用實例可能殘留參數
api = ApiClientManager("ctifdc")
for item in items:
    api.add_field("id", item)  # 參數會累積！
    response = api.get("/path")
```

### 2. 檢查回應狀態
```python
response = api.get("/path")

if response.status_code == 200:
    data = json.loads(response.text)
elif response.status_code == 404:
    log.warning("資源不存在")
else:
    log.error(f"請求失敗: {response.status_code}")
```

### 3. 錯誤處理
```python
try:
    api = ApiClientManager("ctifdc")
    api.add_field("param", "value")
    response = api.get("/path")
except Exception as e:
    log.error(f"API 呼叫失敗: {e}")
```

## 常見問題

### Q1：請求逾時
```
原因：timeout 設定過短或網路問題
解決：
1. 增加 timeout 設定
2. 確認網路連通性
3. 確認 API 服務正常
```

### Q2：認證失敗
```
原因：wec_pat Token 錯誤或過期
解決：
1. 確認環境變數 wec_pat 已設定
2. 確認 Token 有效
3. 重新取得 Token
```

### Q3：參數未正確傳遞
```
原因：未使用 add_field 或參數格式錯誤
解決：
1. 確認使用 add_field 添加參數
2. 確認參數名稱正確
3. 確認參數值格式正確
```

### Q4：回應解析失敗
```
原因：回應不是 JSON 格式
解決：
1. 先檢查 response.status_code
2. 檢查 response.text 內容
3. 確認 API 回傳格式
```
