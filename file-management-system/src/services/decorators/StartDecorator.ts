import type { LogEntry } from "../../domain/observer/LogEntry";
import type { DecoratedLogEntry } from "../../domain/observer/DecoratedLogEntry";
import type { ILogEntryDecorator } from "../../domain/observer/ILogEntryDecorator";

/**
 * Decorator Pattern — 開始裝飾器（SRP：專注於「開始」類訊息的樣式）
 *
 * 觸發關鍵字：「開始」（不分大小寫）
 * 效果：icon = ▶，styleHints = ['color-gray', 'italic']
 */
export class StartDecorator implements ILogEntryDecorator {
  private static readonly KEYWORDS = ["開始"];
  private static readonly ICON = "▶";

  decorate(entry: LogEntry): DecoratedLogEntry {
    const matched = StartDecorator.KEYWORDS.some((kw) =>
      entry.message.toLowerCase().includes(kw.toLowerCase()),
    );

    if (!matched) {
      return { ...entry, styleHints: [] };
    }

    return {
      ...entry,
      icon: StartDecorator.ICON,
      styleHints: ["color-gray", "italic"],
    };
  }
}
