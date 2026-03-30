import type { LogEntry } from "./LogEntry";
import type { StyleHint } from "./StyleHint";

/**
 * Decorator Pattern — 裝飾後的日誌條目（Value Object）
 *
 * 繼承 LogEntry 的所有欄位，並附加由 Decorator Chain 計算出的
 * 視覺提示（icon + styleHints）。
 * 所有欄位 readonly，不可變；不引用任何框架，保持 Domain Layer 純淨。
 */
export interface DecoratedLogEntry extends LogEntry {
  readonly icon?: string; // 例如 "✅"、"⚠️"，由 Decorator 決定
  readonly styleHints: StyleHint[]; // 可疊加的樣式描述陣列
}
