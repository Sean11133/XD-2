import { Label } from "./Label";

/** 色盤：10 色循環自動分配，供 LabelFactory 使用 */
const COLOR_PALETTE = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
];

/**
 * LabelFactory — Flyweight Pool（ADR-001）
 *
 * 保證相同名稱（key = name.trim().toLowerCase()）的 Label 在執行期間
 * 共享同一個 Object.freeze() 後的不可變實體（`===` 比較為 true）。
 */
export class LabelFactory {
  private readonly _registry = new Map<string, Label>();

  private _normalizeKey(name: string): string {
    return name.trim().toLowerCase();
  }

  private _nextColor(): string {
    return COLOR_PALETTE[this._registry.size % COLOR_PALETTE.length];
  }

  /**
   * 取得或建立 Label。
   * - 若相同名稱已存在於 Flyweight 池，直接回傳共享實體（忽略傳入的 options）。
   * - 若首次建立，使用 options 或預設值，凍結後存入池並回傳。
   */
  getOrCreate(
    name: string,
    options?: { color?: string; description?: string },
  ): Label {
    const key = this._normalizeKey(name);
    if (this._registry.has(key)) {
      return this._registry.get(key)!;
    }
    const label = Object.freeze(
      new Label(
        crypto.randomUUID(),
        name.trim(),
        options?.color ?? this._nextColor(),
        options?.description ?? "",
        new Date(),
      ),
    );
    this._registry.set(key, label);
    return label;
  }

  /** 以名稱查找（key 正規化），找不到回傳 undefined */
  findByName(name: string): Label | undefined {
    return this._registry.get(this._normalizeKey(name));
  }

  /** 回傳所有 Label，依 createdAt 升冪排序 */
  getAll(): readonly Label[] {
    return [...this._registry.values()].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }
}

/** 模組層級單例（non-class Singleton，測試時可建立獨立實例取代）*/
export const labelFactory = new LabelFactory();
