import type { LogEntry } from "../../domain/observer/LogEntry";
import type { DecoratedLogEntry } from "../../domain/observer/DecoratedLogEntry";
import type { ILogEntryDecorator } from "../../domain/observer/ILogEntryDecorator";

/**
 * Decorator Pattern — 成功裝飾器（SRP：專注於「完成」類訊息的樣式）
 *
 * 觸發關鍵字：「完成」（不分大小寫）
 * 效果：icon = ✅，styleHints = ['color-green', 'bold']
 */
export class SuccessDecorator implements ILogEntryDecorator {
  private static readonly KEYWORDS = ["完成"];
  private static readonly ICON = "✅";

  decorate(entry: LogEntry): DecoratedLogEntry {
    const matched = SuccessDecorator.KEYWORDS.some((kw) =>
      entry.message.toLowerCase().includes(kw.toLowerCase()),
    );

    if (!matched) {
      return { ...entry, styleHints: [] };
    }

    return {
      ...entry,
      icon: SuccessDecorator.ICON,
      styleHints: ["color-green", "bold"],
    };
  }
}
