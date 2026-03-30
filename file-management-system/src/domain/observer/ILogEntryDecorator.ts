import type { LogEntry } from "./LogEntry";
import type { DecoratedLogEntry } from "./DecoratedLogEntry";

/**
 * Decorator Pattern — 日誌裝飾器介面（Domain Layer）
 *
 * 每個具體 Decorator 負責一組關鍵字的樣式裝飾（SRP）。
 * 新增關鍵字只需新增 Decorator 類別，不修改任何現有程式碼（OCP）。
 * 介面定義在 Domain Layer，具體實作在 Services Layer（Clean Architecture DIP）。
 */
export interface ILogEntryDecorator {
  decorate(entry: LogEntry): DecoratedLogEntry;
}
