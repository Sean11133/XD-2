/**
 * Observer Pattern — 進度事件值物件（Value Object）
 *
 * 不可變快照，描述「某一時刻的操作進度」。
 * 無唯一識別（ID），兩個欄位完全相同的 ProgressEvent 視為相等。
 * 不引用任何框架，保持 Domain Layer 純淨（Clean Architecture DIP）。
 */
export interface ProgressEvent {
  readonly phase: "export" | "scan";
  readonly operationName: string; // e.g. "JSONExporter"、"節點掃描"
  readonly current: number; // 已完成節點數（0 = 開始事件）
  readonly total: number; // 總節點數
  readonly percentage: number; // 0–100，Math.round(current / total * 100)
  readonly message: string; // 人類可讀訊息，供 LogPanel 顯示
  readonly timestamp: Date;
}
