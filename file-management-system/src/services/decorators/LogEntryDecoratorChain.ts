import type { LogEntry } from "../../domain/observer/LogEntry";
import type { DecoratedLogEntry } from "../../domain/observer/DecoratedLogEntry";
import type { ILogEntryDecorator } from "../../domain/observer/ILogEntryDecorator";
import type { StyleHint } from "../../domain/observer/StyleHint";

/**
 * Decorator Pattern — Decorator 鏈（SRP：協調多個 Decorator 的執行與結果合併）
 *
 * 優先級策略（ADR-003）：
 *   - icon：以第一個命中的 Decorator 為準（SUCCESS > WARNING > SCAN > START）
 *   - styleHints：全部合併後去重（允許一條訊息同時命中多個 Decorator）
 *
 * 若無任何 Decorator 命中，回傳 styleHints 為空陣列的 DecoratedLogEntry。
 */
export class LogEntryDecoratorChain {
  constructor(private readonly _decorators: ILogEntryDecorator[]) {}

  decorate(entry: LogEntry): DecoratedLogEntry {
    let firstIcon: string | undefined = undefined;
    const allHints: StyleHint[] = [];

    for (const dec of this._decorators) {
      const result = dec.decorate(entry);

      // 命中判斷：styleHints 非空代表此 Decorator 有應用
      if (result.styleHints.length > 0) {
        if (firstIcon === undefined && result.icon !== undefined) {
          firstIcon = result.icon;
        }
        allHints.push(...result.styleHints);
      }
    }

    // 去重 styleHints，保留原始順序中第一次出現的位置
    const uniqueHints = [...new Set(allHints)];

    return {
      ...entry,
      icon: firstIcon,
      styleHints: uniqueHints,
    };
  }
}
