import type { LogEntry } from "../../domain/observer/LogEntry";
import type { DecoratedLogEntry } from "../../domain/observer/DecoratedLogEntry";
import type { ILogEntryDecorator } from "../../domain/observer/ILogEntryDecorator";

/**
 * Decorator Pattern — 掃描裝飾器（SRP：專注於「掃描」「走訪」類訊息的樣式）
 *
 * 觸發關鍵字：「掃描」、「走訪」（不分大小寫）
 * 效果：icon = 🔍，styleHints = ['color-blue']
 */
export class ScanDecorator implements ILogEntryDecorator {
  private static readonly KEYWORDS = ["掃描", "走訪"];
  private static readonly ICON = "🔍";

  decorate(entry: LogEntry): DecoratedLogEntry {
    const matched = ScanDecorator.KEYWORDS.some((kw) =>
      entry.message.toLowerCase().includes(kw.toLowerCase()),
    );

    if (!matched) {
      return { ...entry, styleHints: [] };
    }

    return {
      ...entry,
      icon: ScanDecorator.ICON,
      styleHints: ["color-blue"],
    };
  }
}
