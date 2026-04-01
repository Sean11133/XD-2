import { Label } from "./Label";

/**
 * LabelWithPriority — Label 的擴充值物件（OCP：不修改現有 Label，新增子類別）
 *
 * 在 Label 基礎上增加 priority（1–5 星）欄位，用於表達標籤重要等級。
 * 仍為不可變值物件，由 LabelFactory 建立並凍結。
 */
export class LabelWithPriority extends Label {
  constructor(
    id: string,
    name: string,
    color: string,
    description: string,
    createdAt: Date,
    public readonly priority: number, // 1–5
  ) {
    super(id, name, color, description, createdAt);
  }
}
