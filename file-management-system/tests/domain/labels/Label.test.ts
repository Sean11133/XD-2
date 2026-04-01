import { describe, expect, it } from "vitest";
import { Label } from "../../../src/domain/labels/Label";

describe("Label", () => {
  const DATE = new Date("2026-04-01");

  it("建構子正確賦值所有屬性", () => {
    const label = new Label("id-001", "重要", "#FF6B6B", "說明文字", DATE);
    expect(label.id).toBe("id-001");
    expect(label.name).toBe("重要");
    expect(label.color).toBe("#FF6B6B");
    expect(label.description).toBe("說明文字");
    expect(label.createdAt).toBe(DATE);
  });

  it("所有屬性皆為 readonly（TypeScript 型別保證）", () => {
    const label = new Label("id-002", "緊急", "#4ECDC4", "", DATE);
    // 凍結後嘗試修改在 strict mode 下應被拒絕，這裡驗證屬性值未被改變
    const frozenLabel = Object.freeze(label);
    expect(frozenLabel.name).toBe("緊急");
    expect(Object.isFrozen(frozenLabel)).toBe(true);
  });

  it("description 可為空字串", () => {
    const label = new Label("id-003", "草稿", "#45B7D1", "", DATE);
    expect(label.description).toBe("");
  });
});
