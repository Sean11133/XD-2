# === ConfigManager 必須最先初始化（這兩行不可分開） ===
from wecpy.config_manager import ConfigManager
ConfigManager('config.yaml')

from wecpy.log_manager import LogManager
from ml.core.fdc import FdcClient, FdcDataType

log = LogManager.get_logger()


def main():
    log.info("開始 FDC 資料擷取")

    with FdcClient(config_path="fdc_config.yaml") as client:
        # 擷取資料
        result = client.fetch()
        log.info(
            f"擷取完成 — 成功: {result.succeeded}, "
            f"跳過: {result.skipped}, "
            f"空資料: {result.empty}, "
            f"失敗: {result.failed}"
        )

        # 列出失敗詳情
        for f in result.failures:
            log.error(f"失敗: {f.data_type} / {f.label} — {f.error}")

        # 查詢資料
        df = client.get_raw_data()
        log.info(f"查詢到 {len(df)} 筆 raw_data")
        if not df.empty:
            print(df.head(10))

    log.info("完成")


if __name__ == "__main__":
    main()
