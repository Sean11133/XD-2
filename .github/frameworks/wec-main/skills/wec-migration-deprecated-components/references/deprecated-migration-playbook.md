# Deprecated Components Migration Playbook

## Scope

目標元件：

- `wec-button-group`
- `wec-combo-box`

## Replace Mapping

- `wec-button-group` → `nb-button-group`（或客製按鈕群組）
- `wec-combo-box` → `nb-select` / `@ng-select/ng-select`

## Migration Steps

1. 盤點引用檔案（按系統分組）
2. 建立替換批次（每批 3~8 個頁面）
3. 先做模板替換，再對齊事件與資料格式
4. 跑 smoke 測試與關鍵流程回歸
5. 逐批完成後移除舊元件依賴

## Validation Checklist

- 預設值顯示正確
- disabled / readonly 行為一致
- 事件（change/select）觸發時機一致
- 提交 payload 與後端契約一致
- 錯誤提示與欄位狀態一致

## Rollback Strategy

- 每批次一個獨立 PR
- 如遇重大問題，回滾該批次 PR
- 不跨批次混入其他重構內容
