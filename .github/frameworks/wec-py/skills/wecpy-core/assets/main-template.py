# -*- coding: utf-8 -*-
"""
wecpy 應用程式主要進入點

專案：{專案名稱}
說明：{專案說明}
作者：{作者}
日期：{日期}

使用方式：
    python main.py
"""
import sys

# =============================================================================
# 步驟 1：初始化 ConfigManager（必須最先執行，不可分離）
# =============================================================================
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

# =============================================================================
# 步驟 2：匯入其他 wecpy 元件
# =============================================================================
from wecpy.log_manager import LogManager

# =============================================================================
# 步驟 3：匯入其他相依模組（從 src/ 目錄）
# =============================================================================
# from src.services.your_service import YourService
# from src.models.your_model import YourModel
# from src.daos.your_dao import YourDao

# =============================================================================
# 初始化日誌
# =============================================================================
log = LogManager.get_logger()


def main() -> None:
    """
    主程式函式
    
    執行流程：
        1. 記錄啟動資訊
        2. 執行業務邏輯
        3. 記錄完成資訊
    
    Raises:
        Exception: 當業務邏輯執行失敗時
    """
    try:
        # -----------------------------------------------------------------
        # 記錄啟動資訊
        # -----------------------------------------------------------------
        log.info("=" * 60)
        log.info("應用程式啟動")
        log.info(f"執行環境：{ConfigManager.ENV.IMX_ENV}")
        log.info(f"系統代碼：{ConfigManager.general.system}")
        log.info(f"應用程式：{ConfigManager.general.app}")
        log.info(f"應用類型：{ConfigManager.general.app_type}")
        log.info("=" * 60)
        
        # -----------------------------------------------------------------
        # TODO: 在這裡實作業務邏輯
        # -----------------------------------------------------------------
        # 範例：
        # service = YourService()
        # result = service.process()
        # log.info(f"處理結果: {result}")
        
        log.info("Hello, wecpy!")
        
        # -----------------------------------------------------------------
        # 記錄完成資訊
        # -----------------------------------------------------------------
        log.info("=" * 60)
        log.info("應用程式執行完成")
        log.info("=" * 60)
        
    except Exception as e:
        log.error(f"應用程式執行失敗：{e}", "app_error")
        log.exception("詳細錯誤資訊")
        sys.exit(1)


if __name__ == "__main__":
    main()
