import { describe, it, expect, beforeEach } from "vitest";
import { Label } from "../../src/domain/labels/Label";
import { LabelWithPriority } from "../../src/domain/labels/LabelWithPriority";
import { LabelFactory } from "../../src/domain/labels/LabelFactory";

describe("LabelWithPriority", () => {
  it("should extend Label", () => {
    const lwp = new LabelWithPriority(
      "id-1",
      "Urgent",
      "#FF0000",
      "urgent desc",
      new Date(),
      5,
    );
    expect(lwp).toBeInstanceOf(Label);
    expect(lwp).toBeInstanceOf(LabelWithPriority);
  });

  it("should have readonly priority field", () => {
    const lwp = new LabelWithPriority(
      "id-2",
      "Low",
      "#00FF00",
      "",
      new Date(),
      1,
    );
    expect(lwp.priority).toBe(1);
    // TypeScript readonly is compile-time only, but value should not change
    expect(lwp.id).toBe("id-2");
    expect(lwp.name).toBe("Low");
  });

  it("should inherit all Label fields", () => {
    const now = new Date();
    const lwp = new LabelWithPriority("id-3", "Medium", "#0000FF", "med", now, 3);
    expect(lwp.id).toBe("id-3");
    expect(lwp.name).toBe("Medium");
    expect(lwp.color).toBe("#0000FF");
    expect(lwp.description).toBe("med");
    expect(lwp.createdAt).toBe(now);
    expect(lwp.priority).toBe(3);
  });
});

describe("LabelFactory with LabelWithPriority", () => {
  let factory: LabelFactory;

  beforeEach(() => {
    factory = new LabelFactory();
  });

  it("should create LabelWithPriority instead of Label", () => {
    const label = factory.getOrCreate("test");
    expect(label).toBeInstanceOf(LabelWithPriority);
  });

  it("should default priority to 1", () => {
    const label = factory.getOrCreate("default-priority");
    expect(label.priority).toBe(1);
  });

  it("should accept custom priority", () => {
    const label = factory.getOrCreate("high-prio", { priority: 5 });
    expect(label.priority).toBe(5);
  });

  it("should return same instance for same name (Flyweight)", () => {
    const a = factory.getOrCreate("shared");
    const b = factory.getOrCreate("shared");
    expect(a).toBe(b);
  });

  it("getAll should return LabelWithPriority array", () => {
    factory.getOrCreate("alpha", { priority: 2 });
    factory.getOrCreate("beta", { priority: 4 });
    const all = factory.getAll();
    expect(all).toHaveLength(2);
    all.forEach((lbl) => expect(lbl).toBeInstanceOf(LabelWithPriority));
  });

  it("findByName should return LabelWithPriority", () => {
    factory.getOrCreate("findme", { priority: 3 });
    const found = factory.findByName("findme");
    expect(found).toBeInstanceOf(LabelWithPriority);
    expect(found?.priority).toBe(3);
  });
});
