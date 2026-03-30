/**
 * Observer Pattern — 日誌條目值物件（Value Object）
 *
 * ConsoleObserver 將 ProgressEvent 轉換後推送給 LogPanel 的顯示物件。
 * 不可變；不引用任何框架，保持 Domain Layer 純淨。
 */
export interface LogEntry {
  readonly level: "INFO" | "SUCCESS" | "WARNING";
  readonly message: string;
  readonly timestamp: Date;
}
