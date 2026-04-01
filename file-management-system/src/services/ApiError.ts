/**
 * ApiError — 統一封裝後端 API 錯誤（HTTP 4xx / 5xx）。
 *
 * 使用規則：
 * - Facade 的 async 方法在請求失敗時拋出此錯誤（而非 fetch 原生 TypeError）。
 * - App.tsx catch 後設定 serverError state，顯示 Error Banner。
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
