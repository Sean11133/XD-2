# DataCacheManager 詳細說明

DataCacheManager 是 wecpy 框架的分散式快取管理元件，透過 gRPC 與遠端快取服務通訊，提供統一的快取操作介面。

## 初始化

DataCacheManager **必須**在 ConfigManager 初始化之後才能使用：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.data_cache_manager.data_cache_manager import DataCacheManager

# 建立快取管理器（自動使用 ConfigManager.grpc_config 連線）
cache = DataCacheManager()
```

## 基本使用

### 設定快取

```python
from wecpy.data_cache_manager.data_cache_manager import DataCacheManager

cache = DataCacheManager()

# 設定快取（永不過期）
cache.set_cache("my_key", {"name": "test", "value": 123})

# 設定快取（指定 TTL，單位為秒）
cache.set_cache("temp_key", {"status": "processing"}, ttl=3600)  # 1 小時後過期
```

### 取得快取

```python
from wecpy.data_cache_manager.data_cache_manager import DataCacheManager

cache = DataCacheManager()

# 取得快取（回傳原始型別）
data = cache.get_cache("my_key")
if data:
    print(f"快取資料: {data}")
else:
    print("快取未命中")

# 取得快取並指定型別（自動反序列化）
from src.models.my_model import MyModel
model = cache.get_cache("model_key", cls=MyModel)
```

### 刪除快取

```python
from wecpy.data_cache_manager.data_cache_manager import DataCacheManager

cache = DataCacheManager()

# 刪除指定快取
success = cache.remove_cache("my_key")
if success:
    print("快取已刪除")
```

### 建立命名空間金鑰

```python
from wecpy.data_cache_manager.data_cache_manager import DataCacheManager

cache = DataCacheManager()

# 建立帶有系統/應用程式前綴的命名空間金鑰
namespaced_key = cache.create_key("lot_status")
# 例如回傳: "IRS:MODEL_MONITOR:lot_status"
```

## 完整使用範例

### 基本快取模式

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.log_manager import LogManager
from wecpy.data_cache_manager.data_cache_manager import DataCacheManager

log = LogManager.get_logger()
cache = DataCacheManager()


def get_equipment_status(eqp_id: str) -> dict:
    """取得設備狀態（優先從快取讀取）"""
    cache_key = cache.create_key(f"eqp_status:{eqp_id}")
    
    # 嘗試從快取取得
    status = cache.get_cache(cache_key)
    if status:
        log.debug(f"快取命中: {eqp_id}")
        return status
    
    # 快取未命中，從資料庫查詢
    log.info(f"快取未命中，查詢資料庫: {eqp_id}")
    status = query_equipment_status_from_db(eqp_id)
    
    # 寫入快取（TTL 5 分鐘）
    cache.set_cache(cache_key, status, ttl=300)
    
    return status
```

### 搭配型別反序列化

```python
from dataclasses import dataclass
from wecpy.data_cache_manager.data_cache_manager import DataCacheManager

cache = DataCacheManager()


@dataclass
class LotInfo:
    lot_id: str
    product: str
    stage: str
    qty: int


def cache_lot_info(lot: LotInfo):
    """快取批號資訊"""
    key = cache.create_key(f"lot:{lot.lot_id}")
    cache.set_cache(key, lot, ttl=600)


def get_lot_info(lot_id: str) -> LotInfo:
    """取得批號資訊（含型別轉換）"""
    key = cache.create_key(f"lot:{lot_id}")
    return cache.get_cache(key, cls=LotInfo)
```

### 快取失效策略

```python
from wecpy.data_cache_manager.data_cache_manager import DataCacheManager

cache = DataCacheManager()


def update_equipment_config(eqp_id: str, new_config: dict):
    """更新設備設定時清除相關快取"""
    # 更新資料庫
    save_to_db(eqp_id, new_config)
    
    # 清除舊快取
    cache.remove_cache(cache.create_key(f"eqp_config:{eqp_id}"))
    cache.remove_cache(cache.create_key(f"eqp_status:{eqp_id}"))
    
    log.info(f"設備 {eqp_id} 設定已更新，相關快取已清除")
```

## config.yaml 設定

DataCacheManager 使用 ConfigManager 的 gRPC 設定自動連線。確保 config.yaml 包含相關的 gRPC 設定：

```yaml
General:
  system: "{IMX_SYSTEM}"
  app: "{IMX_APP}"
  app_type: Schedule
  section: MK10

# gRPC 設定（DataCacheManager 自動使用）
Grpc:
  cache_service:
    host: cache-server
    port: 50051
```

## 最佳實務

### 1. 使用命名空間金鑰

```python
# ❌ 避免：使用簡單字串作為金鑰（可能與其他應用衝突）
cache.set_cache("lot_status", data)

# ✅ 正確：使用 create_key 建立命名空間金鑰
cache.set_cache(cache.create_key("lot_status"), data)
```

### 2. 設定合理的 TTL

```python
# ❌ 避免：所有快取都永不過期
cache.set_cache(key, data)  # ttl=0 代表永不過期

# ✅ 正確：根據資料特性設定 TTL
cache.set_cache(key, data, ttl=300)    # 經常變動的資料：5 分鐘
cache.set_cache(key, data, ttl=3600)   # 較穩定的資料：1 小時
cache.set_cache(key, data, ttl=86400)  # 極少變動的資料：1 天
```

### 3. 快取穿透防護

```python
# ✅ 正確：對空結果也進行快取，避免重複查詢資料庫
def get_data(key: str):
    cached = cache.get_cache(cache.create_key(key))
    if cached is not None:
        return cached
    
    result = query_from_db(key)
    if result is None:
        # 空結果也快取，但使用較短的 TTL
        cache.set_cache(cache.create_key(key), {}, ttl=60)
        return None
    
    cache.set_cache(cache.create_key(key), result, ttl=300)
    return result
```

### 4. 錯誤處理

```python
# ✅ 正確：快取操作失敗不應影響主要業務邏輯
try:
    data = cache.get_cache(cache.create_key("my_key"))
except Exception as e:
    log.warning(f"快取讀取失敗，直接查詢資料庫: {e}", "cache_read_error")
    data = None

if data is None:
    data = query_from_db()
```

## 常見問題

### Q1：DataCacheManager 初始化失敗

```
原因：gRPC 連線設定不正確或快取服務未啟動
解決：
1. 確認 config.yaml 包含正確的 gRPC 設定
2. 確認快取服務已啟動且可連線
3. 確認網路防火牆允許 gRPC 連線
```

### Q2：get_cache 回傳 None

```
原因：
1. 金鑰不存在（從未設定或已過期）
2. 金鑰名稱不一致（未使用 create_key）

解決：
1. 確認使用 set_cache 設定過該金鑰
2. 確認 TTL 未過期
3. 確認 get_cache 和 set_cache 使用相同的金鑰格式
```

### Q3：快取資料型別不正確

```
原因：get_cache 未指定 cls 參數，回傳原始型別
解決：使用 cls 參數指定目標型別
cache.get_cache("key", cls=MyModel)
```
