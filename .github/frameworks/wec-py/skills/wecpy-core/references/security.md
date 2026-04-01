# Security 模組詳細說明


## 目錄

- [模組總覽](#模組總覽)
- [快速開始](#快速開始)
- [JwtHelper — JWT Token 解析](#jwthelper--jwt-token-解析)
  - [JwtParseResult](#jwtparseresult)
  - [解析 Token](#解析-token)
  - [使用場景](#使用場景)
- [AesHelper — AES 加解密](#aeshelper--aes-加解密)
  - [加密](#加密)
  - [解密](#解密)
  - [完整加解密流程](#完整加解密流程)
- [AesKeyGenerator — AES 金鑰產生](#aeskeygenerator--aes-金鑰產生)
  - [KeyMaterial](#keymaterial)
  - [產生金鑰](#產生金鑰)
- [SecurityService — 安全服務](#securityservice--安全服務)
  - [取得使用者上下文](#取得使用者上下文)
  - [取得使用者資源權限](#取得使用者資源權限)
  - [使用場景](#使用場景)
- [GrpcAuthClientInterceptor — gRPC 認證攔截器](#grpcauthclientinterceptor--grpc-認證攔截器)
  - [初始化與使用](#初始化與使用)
  - [搭配 gRPC Channel 使用](#搭配-grpc-channel-使用)
- [最佳實務](#最佳實務)
  - [1. 金鑰管理](#1-金鑰管理)
  - [2. 敏感資料保護](#2-敏感資料保護)
  - [3. JWT Token 驗證](#3-jwt-token-驗證)
  - [4. 加解密錯誤處理](#4-加解密錯誤處理)
- [常見問題](#常見問題)
  - [Q1：JWT 解析回傳 None](#q1jwt-解析回傳-none)
  - [Q2：AES 加密/解密失敗](#q2aes-加密解密失敗)
  - [Q3：GrpcAuthClientInterceptor 認證失敗](#q3grpcauthclientinterceptor-認證失敗)

Security 模組提供 wecpy 框架的安全性功能，包含 JWT 解析、AES 加解密、安全服務、gRPC 認證攔截器等元件。

## 模組總覽

| 元件 | 用途 | 匯入路徑 |
|-----|------|---------|
| `JwtHelper` | JWT Token 解析 | `wecpy.security.jwt_helper` |
| `AesHelper` | AES 加解密 | `wecpy.security.aes_helper` |
| `AesKeyGenerator` | AES 金鑰產生 | `wecpy.security.aes_key_generator` |
| `SecurityService` | 使用者安全上下文 | `wecpy.security.security_service` |
| `GrpcAuthClientInterceptor` | gRPC 認證攔截器 | `wecpy.security.grpc_auth_client_interceptor` |

## 快速開始

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.security.jwt_helper import JwtHelper, JwtParseResult
from wecpy.security.aes_helper import AesHelper
from wecpy.security.security_service import SecurityService

# 解析 JWT Token
result = JwtHelper.parse_jwt_token(token)
print(result.claims)
print(result.user)

# AES 加解密
encrypted = AesHelper.encrypt({"key": "value"}, secret_key_base64)
decrypted = AesHelper.decrypt(encrypted, secret_key_base64)

# 取得目前使用者上下文
user_context = SecurityService.get_user_context()
```

## JwtHelper — JWT Token 解析

`JwtHelper` 用於解析 JWT Token，取得其中的 claims 和使用者資訊。

### JwtParseResult

解析結果的資料物件：

```python
from wecpy.security.jwt_helper import JwtParseResult

class JwtParseResult:
    def __init__(self, claims=None, user=None):
        self.claims = claims  # dict：JWT 中的 claims 資訊
        self.user = user      # str：使用者識別
```

### 解析 Token

```python
from wecpy.security.jwt_helper import JwtHelper, JwtParseResult

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

result = JwtHelper.parse_jwt_token(token)

if result.claims:
    print(f"使用者: {result.user}")
    print(f"Claims: {result.claims}")
```

### 使用場景

- Web 應用程式的請求認證
- API 端點的身份驗證
- 從 Token 中擷取使用者資訊

## AesHelper — AES 加解密

`AesHelper` 提供 AES 對稱式加解密功能，適用於敏感資料的加密保護。

### 加密

將物件加密為 Base64 編碼字串：

```python
from wecpy.security.aes_helper import AesHelper

# 準備要加密的資料
data = {"lot_id": "LOT123", "result": "PASS"}
secret_key_base64 = "your_base64_encoded_secret_key"

# 加密
encrypted = AesHelper.encrypt(data, secret_key_base64)
print(f"加密結果: {encrypted}")  # Base64 編碼的加密字串
```

### 解密

將加密的 Base64 字串還原為原始物件：

```python
from wecpy.security.aes_helper import AesHelper

encrypted_base64 = "encrypted_base64_string..."
secret_key_base64 = "your_base64_encoded_secret_key"

# 解密
decrypted = AesHelper.decrypt(encrypted_base64, secret_key_base64)
print(f"解密結果: {decrypted}")  # {'lot_id': 'LOT123', 'result': 'PASS'}
```

### 完整加解密流程

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.security.aes_helper import AesHelper
from wecpy.security.aes_key_generator import AesKeyGenerator
from wecpy.log_manager import LogManager

log = LogManager.get_logger()

# 產生金鑰
key_material = AesKeyGenerator.generate_random_string()
secret_key = key_material.key

# 加密敏感資料
sensitive_data = {"employee_id": "E001", "salary": 50000}
encrypted = AesHelper.encrypt(sensitive_data, secret_key)
log.info("資料已加密")

# 解密還原
decrypted = AesHelper.decrypt(encrypted, secret_key)
log.info(f"解密完成: employee_id={decrypted['employee_id']}")
```

## AesKeyGenerator — AES 金鑰產生

`AesKeyGenerator` 用於產生 AES 加密所需的隨機金鑰。

### KeyMaterial

金鑰材料的資料物件：

```python
from wecpy.security.aes_key_generator import KeyMaterial

class KeyMaterial:
    def __init__(self, full_random_string, key):
        self.full_random_string = full_random_string  # 完整隨機字串
        self.key = key                                  # Base64 編碼的金鑰
```

### 產生金鑰

```python
from wecpy.security.aes_key_generator import AesKeyGenerator

# 自動產生隨機金鑰
key_material = AesKeyGenerator.generate_random_string()
print(f"隨機字串: {key_material.full_random_string}")
print(f"金鑰: {key_material.key}")

# 使用指定的隨機字串產生金鑰
key_material = AesKeyGenerator.generate_random_string(
    full_random_string="my_custom_seed_string"
)
```

## SecurityService — 安全服務

`SecurityService` 提供取得當前使用者上下文和資源權限的功能。

### 取得使用者上下文

```python
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.security.security_service import SecurityService

# 取得目前使用者上下文
user_context = SecurityService.get_user_context()
```

### 取得使用者資源權限

```python
from wecpy.security.security_service import SecurityService

# 取得使用者可存取的資源
user = "user_id"
resources = SecurityService.get_resources(user)
```

### 使用場景

- 在 Web 或 Listener 類型應用中取得認證使用者
- 實作資源存取控制（RBAC）
- 搭配 `GrpcAuthClientInterceptor` 進行服務間認證

## GrpcAuthClientInterceptor — gRPC 認證攔截器

`GrpcAuthClientInterceptor` 用於在 gRPC 呼叫中自動附加認證資訊。

### 初始化與使用

```python
from wecpy.security.grpc_auth_client_interceptor import GrpcAuthClientInterceptor

# 建立攔截器實例
interceptor = GrpcAuthClientInterceptor(token="jwt_token", key_seed="seed_value")

# 設定認證（類別方法）
GrpcAuthClientInterceptor.set_authentication()

# 取得單例實例
instance = GrpcAuthClientInterceptor.get_instance()
```

### 搭配 gRPC Channel 使用

```python
import grpc
from wecpy.security.grpc_auth_client_interceptor import GrpcAuthClientInterceptor

# 設定認證
GrpcAuthClientInterceptor.set_authentication()
interceptor = GrpcAuthClientInterceptor.get_instance()

# 建立帶認證的 gRPC Channel
channel = grpc.insecure_channel("server:50051")
channel = grpc.intercept_channel(channel, interceptor)
```

## IMXUserContext — SSL 憑證管理

`IMXUserContext` 提供 SSL 憑證的取得與管理，用於安全的 gRPC 通訊。憑證每天自動快取一次。

```python
from wecpy.shared.imx_user_context import IMXUserContext
import grpc

# 取得 SSL 憑證（自動快取，每天更新一次）
cert_bytes = IMXUserContext.get_ssl_certificate()

# 取得 gRPC SSL Channel Credentials
credentials = IMXUserContext.get_ssl_channel_credentials()

# 建立安全的 gRPC Channel
channel = grpc.secure_channel("server:50051", credentials)
```

| 方法 | 說明 | 回傳值 |
|-----|------|--------|
| `get_ssl_certificate(cert_url=None)` | 取得 SSL 憑證（支援自訂 URL） | `bytes` |
| `get_ssl_channel_credentials(file=None)` | 取得 gRPC SSL Channel Credentials | `grpc.ChannelCredentials` |

> 憑證使用每日快取機制（`_is_certificate_expired()` 檢查），避免頻繁請求。

## 最佳實務

### 1. 金鑰管理

```python
# ❌ 禁止：在程式碼中硬編碼金鑰
secret_key = "my_secret_key_123"

# ✅ 正確：從環境變數或安全儲存取得金鑰
import os
secret_key = os.environ.get("APP_AES_SECRET_KEY")
```

### 2. 敏感資料保護

```python
# ❌ 禁止：日誌中記錄敏感資訊
log.info(f"解密結果: {decrypted}")

# ✅ 正確：只記錄非敏感欄位
log.info(f"解密完成，employee_id={decrypted['employee_id']}")
```

### 3. JWT Token 驗證

```python
# ✅ 正確：檢查解析結果
result = JwtHelper.parse_jwt_token(token)
if result.claims is None:
    log.error("JWT Token 解析失敗", "jwt_parse_error")
    return

# 繼續使用 result.user 和 result.claims
```

### 4. 加解密錯誤處理

```python
from wecpy.security.aes_helper import AesHelper

try:
    decrypted = AesHelper.decrypt(encrypted_data, secret_key)
except Exception as e:
    log.error(f"解密失敗: {e}", "decrypt_error")
```

## 常見問題

### Q1：JWT 解析回傳 None

```
原因：Token 格式不正確或已過期
解決：
1. 確認 Token 格式為有效的 JWT（三段式 Base64 字串）
2. 檢查 Token 是否已過期
3. 確認簽章金鑰正確
```

### Q2：AES 加密/解密失敗

```
原因：金鑰不正確或資料損壞
解決：
1. 確認加密和解密使用相同的 secret_key_base64
2. 確認金鑰為有效的 Base64 編碼字串
3. 確認加密資料未被截斷或修改
```

### Q3：GrpcAuthClientInterceptor 認證失敗

```
原因：Token 或 key_seed 設定不正確
解決：
1. 確認已呼叫 set_authentication() 進行初始化
2. 確認 Token 有效且未過期
3. 確認 gRPC 服務端支援此認證方式
```
