/**
 * Decorator Pattern — 樣式提示 Union Type（Value Object）
 *
 * 描述一條日誌條目的視覺樣式，多個提示可組合使用。
 * Domain Layer 純 TypeScript，不引用任何框架。
 */
export type StyleHint =
  | "bold"
  | "italic"
  | "color-green"
  | "color-yellow"
  | "color-blue"
  | "color-gray";
