import { describe, expect, it, beforeEach } from "vitest";
import { LabelFactory } from "../../../src/domain/labels/LabelFactory";

describe("LabelFactory", () => {
  let factory: LabelFactory;

  // 每個測試使用獨立實例，避免 Flyweight 池狀態污染
  beforeEach(() => {
    factory = new LabelFactory();
  });

  describe("getOrCreate()", () => {
    it("首次建立 Label — 回傳含正確屬性的凍結物件", () => {
      const label = factory.getOrCreate("重要");
      expect(label.name).toBe("重要");
      expect(label.id).toBeTruthy();
      expect(label.color).toBeTruthy();
      expect(label.createdAt).toBeInstanceOf(Date);
      expect(Object.isFrozen(label)).toBe(true);
    });

    it("相同名稱第二次呼叫 — 回傳完全相同參考（=== true）", () => {
      const a = factory.getOrCreate("重要");
      const b = factory.getOrCreate("重要");
      expect(a).toBe(b);
    });

    it("名稱 trim 正規化 — 前後空白視為相同 key", () => {
      const a = factory.getOrCreate("重要");
      const b = factory.getOrCreate("  重要  ");
      expect(a).toBe(b);
    });

    it("大小寫不區分 — 'Work' 與 'work' 視為相同 key", () => {
      const a = factory.getOrCreate("Work");
      const b = factory.getOrCreate("work");
      expect(a).toBe(b);
    });

    it("名稱 trim 後存入 — name 屬性無空白", () => {
      const label = factory.getOrCreate("  草稿  ");
      expect(label.name).toBe("草稿");
    });

    it("自訂 color — 首次建立時使用傳入的 color", () => {
      const label = factory.getOrCreate("自訂色", { color: "#123456" });
      expect(label.color).toBe("#123456");
    });

    it("已存在的 Label 不會被覆蓋 — 即使傳入不同 options", () => {
      const a = factory.getOrCreate("已存在", { color: "#AABBCC" });
      const b = factory.getOrCreate("已存在", { color: "#999999" });
      expect(b.color).toBe("#AABBCC"); // 保留第一次建立的 color
      expect(a).toBe(b);
    });
  });

  describe("getAll()", () => {
    it("依 createdAt 升冪排序回傳所有 Label", () => {
      factory.getOrCreate("C");
      factory.getOrCreate("A");
      factory.getOrCreate("B");
      const all = factory.getAll();
      expect(all.map((l) => l.name)).toEqual(["C", "A", "B"]);
    });

    it("空 factory 回傳空陣列", () => {
      expect(factory.getAll()).toHaveLength(0);
    });
  });

  describe("findByName()", () => {
    it("找得到時回傳 Label", () => {
      factory.getOrCreate("重要");
      expect(factory.findByName("重要")).toBeDefined();
    });

    it("找不到時回傳 undefined", () => {
      expect(factory.findByName("不存在")).toBeUndefined();
    });

    it("key 正規化 — trim + lowercase 仍能查找", () => {
      factory.getOrCreate("Work");
      expect(factory.findByName("  WORK  ")).toBeDefined();
    });
  });

  describe("色盤循環", () => {
    it("第 11 個 Label 回到第 1 個顏色（10 色循環）", () => {
      const labels: ReturnType<typeof factory.getOrCreate>[] = [];
      for (let i = 0; i < 11; i++) {
        labels.push(factory.getOrCreate(`label-${i}`));
      }
      // labels[0] 是第 1 個色，labels[10] 是第 11 個（循環回第 1 個）
      expect(labels[10].color).toBe(labels[0].color);
    });
  });
});
