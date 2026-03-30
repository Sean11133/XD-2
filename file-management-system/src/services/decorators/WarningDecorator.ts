import type { LogEntry } from "../../domain/observer/LogEntry";
import type { DecoratedLogEntry } from "../../domain/observer/DecoratedLogEntry";
import type { ILogEntryDecorator } from "../../domain/observer/ILogEntryDecorator";

/**
 * Decorator Pattern — 警告裝飾器（SRP：專注於「警告」「失敗」類訊息的樣式）
 *
 * 觸發關鍵字：「警告」、「失敗」（不分大小寫）
 * 效果：icon = ⚠️，styleHints = ['color-yellow']
 */
export class WarningDecorator implements ILogEntryDecorator {
  private static readonly KEYWORDS = ["警告", "失敗"];
  private static readonly ICON = "⚠️";

  decorate(entry: LogEntry): DecoratedLogEntry {
    const matched = WarningDecorator.KEYWORDS.some((kw) =>
      entry.message.toLowerCase().includes(kw.toLowerCase()),
    );

    if (!matched) {
      return { ...entry, styleHints: [] };
    }

    return {
      ...entry,
      icon: WarningDecorator.ICON,
      styleHints: ["color-yellow"],
    };
  }
}
