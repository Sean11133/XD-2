# IMXAppContext 詳細說明

IMXAppContext 提供 wecpy 應用程式層級的上下文管理功能，包含分散式快取存取和當前使用者識別。適用於需要在不同模組間共享狀態或取得使用者資訊的場景。

## 匯入路徑

```python
from wecpy.imx_app_context import IMXAppContext
```

## 初始化

IMXAppContext **必須**在 ConfigManager 初始化之後才能使用：

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.imx_app_context import IMXAppContext
```

## 功能總覽

| 方法 | 用途 |
|-----|------|
| `get_cache(key, cls)` | 從分散式快取取得資料 |
| `set_cache(key, value, ttl)` | 寫入分散式快取 |
| `get_current_user()` | 取得當前使用者識別 |

## 基本使用

### 快取操作

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.imx_app_context import IMXAppContext

# 寫入快取
IMXAppContext.set_cache("my_key", {"status": "active", "count": 42})

# 寫入快取（指定 TTL，單位為秒）
IMXAppContext.set_cache("temp_key", {"result": "ok"}, ttl=300)  # 5 分鐘

# 讀取快取
data = IMXAppContext.get_cache("my_key")
if data:
    print(f"狀態: {data['status']}")
```

### 指定型別讀取快取

```python
from dataclasses import dataclass
from wecpy.imx_app_context import IMXAppContext


@dataclass
class EquipmentStatus:
    eqp_id: str
    status: str
    last_update: str


# 寫入
status = EquipmentStatus(eqp_id="EQP001", status="RUN", last_update="2025-01-15")
IMXAppContext.set_cache("eqp:EQP001", status, ttl=600)

# 讀取（指定型別）
cached_status = IMXAppContext.get_cache("eqp:EQP001", cls=EquipmentStatus)
if cached_status:
    print(f"設備 {cached_status.eqp_id} 狀態: {cached_status.status}")
```

### 取得當前使用者

```python
from wecpy.imx_app_context import IMXAppContext

# 取得當前使用者識別
current_user = IMXAppContext.get_current_user()
print(f"當前使用者: {current_user}")
```

## 完整使用範例

### 應用程式狀態管理

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.imx_app_context import IMXAppContext
from wecpy.log_manager import LogManager

log = LogManager.get_logger()


def check_and_run_etl():
    """檢查是否有其他實例正在執行，避免重複執行"""
    lock_key = "etl:lot_summary:running"
    
    # 檢查是否已有實例在執行
    is_running = IMXAppContext.get_cache(lock_key)
    if is_running:
        log.warning("ETL 已在執行中，跳過本次執行")
        return
    
    try:
        # 設定執行鎖（TTL 30 分鐘，防止異常中斷後永久鎖定）
        user = IMXAppContext.get_current_user()
        IMXAppContext.set_cache(lock_key, {
            "started_by": user,
            "status": "running"
        }, ttl=1800)
        
        log.info(f"使用者 {user} 開始執行 ETL")
        run_etl_process()
        log.info("ETL 執行完成")
        
    finally:
        # 清除執行鎖（透過設定極短 TTL 實現）
        IMXAppContext.set_cache(lock_key, None, ttl=1)
```

### 跨模組資料共享

```python
# src/services/data_service.py
from wecpy.imx_app_context import IMXAppContext
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

CACHE_TTL = 600  # 10 分鐘


def get_product_config(product_id: str) -> dict:
    """取得產品設定（含快取）"""
    cache_key = f"product_config:{product_id}"
    
    config = IMXAppContext.get_cache(cache_key)
    if config:
        log.debug(f"產品設定快取命中: {product_id}")
        return config
    
    # 從資料庫載入
    config = load_product_config_from_db(product_id)
    IMXAppContext.set_cache(cache_key, config, ttl=CACHE_TTL)
    log.info(f"產品設定已載入並快取: {product_id}")
    return config
```

```python
# src/services/analysis_service.py
from wecpy.imx_app_context import IMXAppContext
from src.services.data_service import get_product_config


def analyze_lot(lot_id: str, product_id: str):
    """分析批號 — 自動使用快取的產品設定"""
    config = get_product_config(product_id)
    # 使用 config 進行分析...
```

### 搭配 SecurityService 使用

```python
from wecpy.imx_app_context import IMXAppContext
from wecpy.security.security_service import SecurityService
from wecpy.log_manager import LogManager

log = LogManager.get_logger()


def audit_log_action(action: str, detail: str):
    """記錄操作稽核日誌"""
    user = IMXAppContext.get_current_user()
    user_context = SecurityService.get_user_context()
    
    log.info(
        f"[稽核] 使用者={user}, 動作={action}, 詳情={detail}",
        "audit_log"
    )
```

## IMXAppContext 與 DataCacheManager 的差異

| 特性 | IMXAppContext | DataCacheManager |
|-----|--------------|-----------------|
| 呼叫方式 | 靜態方法（`IMXAppContext.get_cache()`） | 實例方法（`cache.get_cache()`） |
| 命名空間 | 無自動前綴 | `create_key()` 自動加前綴 |
| 適用場景 | 簡單快取 + 使用者上下文 | 進階快取管理 |
| 額外功能 | `get_current_user()` | `create_key()`, `remove_cache()` |

一般建議：
- 簡單的快取操作和使用者識別 → 使用 `IMXAppContext`
- 需要命名空間管理或進階快取控制 → 使用 `DataCacheManager`

## 最佳實務

### 1. 合理設定 TTL

```python
# ❌ 避免：所有快取都不設 TTL
IMXAppContext.set_cache("key", data)

# ✅ 正確：根據資料特性設定 TTL
IMXAppContext.set_cache("key", data, ttl=300)    # 動態資料：5 分鐘
IMXAppContext.set_cache("key", data, ttl=3600)   # 穩定資料：1 小時
```

### 2. 快取金鑰命名規範

```python
# ❌ 避免：模糊的金鑰名稱
IMXAppContext.set_cache("data", value)

# ✅ 正確：使用有意義的階層式金鑰
IMXAppContext.set_cache("eqp_status:EQP001", value)
IMXAppContext.set_cache("product_config:PROD_A", value)
IMXAppContext.set_cache("lot:LOT123:summary", value)
```

### 3. 錯誤處理

```python
# ✅ 正確：快取失敗不應中斷主要流程
try:
    data = IMXAppContext.get_cache("my_key")
except Exception as e:
    log.warning(f"快取讀取失敗: {e}", "cache_error")
    data = None

if data is None:
    data = load_from_database()
```

## 常見問題

### Q1：get_cache 回傳 None

```
原因：
1. 金鑰不存在或已過期
2. 快取服務未連線

解決：
1. 確認 set_cache 已設定該金鑰
2. 確認 TTL 未過期
3. 確認快取服務（gRPC）正常運作
```

### Q2：get_current_user 回傳空值

```
原因：
1. 應用程式類型為 Schedule，無使用者上下文
2. 認證資訊未正確傳遞

解決：
1. Schedule 類型應用通常無使用者上下文，改用 IMX_APP_OWNER
2. Web/Listener 類型應確認認證機制正確設定
```

### Q3：set_cache 靜默失敗

```
原因：快取服務連線中斷或寫入逾時
解決：
1. 確認 gRPC 快取服務狀態
2. 檢查網路連線
3. 加入錯誤處理和日誌記錄
```
