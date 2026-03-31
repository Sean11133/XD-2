import { describe, it, expect } from "vitest";
import { NameSortStrategy } from "../../../src/services/strategies/NameSortStrategy";
import { Directory } from "../../../src/domain/Directory";
import { TextFile } from "../../../src/domain/TextFile";

const DATE = new Date("2026-03-20");

describe("NameSortStrategy", () => {
  it("asc: 依字母 A→Z 排序", () => {
    const strategy = new NameSortStrategy("asc");
    const nodes = [
      new TextFile("cherry.txt", 1, DATE, "UTF-8"),
      new TextFile("apple.txt", 1, DATE, "UTF-8"),
      new TextFile("banana.txt", 1, DATE, "UTF-8"),
    ];
    const sorted = strategy.sort(nodes);
    expect(sorted.map((n) => n.name)).toEqual([
      "apple.txt",
      "banana.txt",
      "cherry.txt",
    ]);
  });

  it("desc: 依字母 Z→A 排序", () => {
    const strategy = new NameSortStrategy("desc");
    const nodes = [
      new TextFile("apple.txt", 1, DATE, "UTF-8"),
      new TextFile("cherry.txt", 1, DATE, "UTF-8"),
    ];
    const sorted = strategy.sort(nodes);
    expect(sorted[0].name).toBe("cherry.txt");
  });

  it("空陣列回傳空陣列", () => {
    expect(new NameSortStrategy("asc").sort([])).toEqual([]);
  });

  it("不修改原陣列", () => {
    const nodes = [
      new TextFile("b.txt", 1, DATE, "UTF-8"),
      new TextFile("a.txt", 1, DATE, "UTF-8"),
    ];
    const original = [...nodes];
    new NameSortStrategy("asc").sort(nodes);
    expect(nodes[0]).toBe(original[0]);
  });

  it("label 正確", () => {
    expect(new NameSortStrategy("asc").label).toBe("依名稱 A→Z");
    expect(new NameSortStrategy("desc").label).toBe("依名稱 Z→A");
  });

  it("Directory 節點依名稱排序（與 File 同規則）", () => {
    const strategy = new NameSortStrategy("asc");
    const nodes = [new Directory("zebra"), new Directory("alpha")];
    const sorted = strategy.sort(nodes);
    expect(sorted[0].name).toBe("alpha");
  });
});
