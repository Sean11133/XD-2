---
mode: ask
---

# Winbond wecpy Python Framework 介紹與專案初始化

本提示詞專為 Winbond 內部 wecpy 框架設計，提供框架介紹。

---

## wecpy 框架定位與特色

wecpy 是 Winbond Electronics Corporation 內部專用的 Python 企業應用框架，聚焦於：

- 高生產力、可重用元件
- 統一組態、日誌、資料庫、資料傳輸、外部整合等重複性工作
- 企業級安全與維運規範

## 安裝與環境要求

- 僅支援 Python 3.8~3.10
- 內部 Nexus 私有倉庫安裝：
  ```bash
  pip install --index-url=http://10.18.20.121:8081/repository/wec-pypi/simple --trusted-host=10.18.20.121:8081 wecpy
  ```

## 組態與專案結構

- 必須使用 .yaml 格式組態檔，依環境分為 PROD/config.yaml、PILOT/config.yaml
- `ConfigManager('config.yaml')` 必須在所有 wecpy 相關模組（如 LogManager、DatabaseManager 等）import 或使用前執行，且 import 與初始化必須連續兩行
- 組態檔支援環境變數（如 {IMX_UDB_ID}）
- 推薦專案結構：
  - PROD/PILOT/config.yaml
  - .venv/、.env、requirements.txt
  - models/、daos/、main.py、tests/

## 關鍵設計原則

- 日誌統一用 LogManager，禁止 print，支援 log rotation、TID、log_key
- 資料庫操作支援 Oracle/Trino/SQLServer，建議用參數化查詢與批次 insert
- Kafka/物件儲存/ElasticSearch/APM/FTP/通知/COP 皆有專屬 manager，跨元件資料傳遞建議用 WecDoc
- 所有程式碼必須以標準 Python 文字格式提供，不可用截圖
- ConfigManager 初始化必須在所有其他 wecpy 模組之前，且程式碼片段需完整可執行

## wecpy 初始化範例

```python
# 嚴格遵循初始化順序
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')
from wecpy.log_manager import LogManager
log = LogManager.get_logger()
```

## 參考資源

- [官方 API 文件](http://pilot-imx/wecpy/doc/api_document.html)
- [Sample Code Git](http://usergitlab/template/wecpy-sample-code/)
- [Config Manager Example](http://pilot-imx/wecpy/doc/start/config_manager_ex.html)

---

如需補充細節或舉例，請聚焦於 Winbond wecpy 框架的實務應用與規範。
