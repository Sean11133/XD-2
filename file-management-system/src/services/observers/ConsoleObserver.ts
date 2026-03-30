import type { IProgressObserver } from "../../domain/observer/IProgressObserver";
import type { ProgressEvent } from "../../domain/observer/ProgressEvent";
import type { LogEntry } from "../../domain/observer/LogEntry";
import type { DecoratedLogEntry } from "../../domain/observer/DecoratedLogEntry";
import type { LogEntryDecoratorChain } from "../decorators/LogEntryDecoratorChain";

/**
 * Observer Pattern — 日誌接收端（SRP：專注於將進度事件轉換為日誌條目）
 *
 * 透過 constructor 注入的 _onLog callback 與 React state 互動（DIP），
 * 自身不持有任何 React API，可在非瀏覽器環境（如 Node 測試）中獨立使用。
 *
 * 可選傳入 LogEntryDecoratorChain，對產出的 LogEntry 進行關鍵字樣式裝飾（OCP）。
 * 不傳 chain 時行為與原本完全相同（向後相容）。
 *
 * 轉換規則：
 *   percentage === 0   → INFO   - "[operationName] 開始，共 N 個節點"
 *   percentage === 100 → SUCCESS - "[operationName] 完成 ✓"
 *   其他              → INFO   - "[N%] message"
 */
export class ConsoleObserver implements IProgressObserver {
  constructor(
    private readonly _onLog: (entry: LogEntry | DecoratedLogEntry) => void,
    private readonly _chain?: LogEntryDecoratorChain,
  ) {}

  onProgress(event: ProgressEvent): void {
    const level: LogEntry["level"] =
      event.percentage === 100 ? "SUCCESS" : "INFO";

    let message: string;
    if (event.percentage === 0) {
      message = `${event.operationName} 開始，共 ${event.total} 個節點`;
    } else if (event.percentage === 100) {
      message = `${event.operationName} 完成 ✓`;
    } else {
      message = `[${event.percentage}%] ${event.message}`;
    }

    const entry: LogEntry = { level, message, timestamp: event.timestamp };
    const output = this._chain ? this._chain.decorate(entry) : entry;
    this._onLog(output);
  }
}
