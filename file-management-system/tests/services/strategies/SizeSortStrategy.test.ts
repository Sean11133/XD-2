import { describe, it, expect } from "vitest";
import { SizeSortStrategy } from "../../../src/services/strategies/SizeSortStrategy";
import { TextFile } from "../../../src/domain/TextFile";
import { Directory } from "../../../src/domain/Directory";

const DATE = new Date("2026-03-20");

describe("SizeSortStrategy", () => {
  it("asc: 小→大排序", () => {
    const strategy = new SizeSortStrategy("asc");
    const nodes = [
      new TextFile("c.txt", 300, DATE, "UTF-8"),
      new TextFile("a.txt", 100, DATE, "UTF-8"),
      new TextFile("b.txt", 200, DATE, "UTF-8"),
    ];
    const sorted = strategy.sort(nodes);
    expect(sorted.map((n) => n.name)).toEqual(["a.txt", "b.txt", "c.txt"]);
  });

  it("desc: 大→小排序", () => {
    const strategy = new SizeSortStrategy("desc");
    const nodes = [
      new TextFile("small.txt", 50, DATE, "UTF-8"),
      new TextFile("large.txt", 500, DATE, "UTF-8"),
    ];
    const sorted = strategy.sort(nodes);
    expect(sorted[0].name).toBe("large.txt");
  });

  it("空陣列回傳空陣列", () => {
    expect(new SizeSortStrategy("asc").sort([])).toEqual([]);
  });

  it("不修改原陣列", () => {
    const nodes = [
      new TextFile("b.txt", 200, DATE, "UTF-8"),
      new TextFile("a.txt", 100, DATE, "UTF-8"),
    ];
    const first = nodes[0];
    new SizeSortStrategy("asc").sort(nodes);
    expect(nodes[0]).toBe(first);
  });

  it("Directory 以 getSizeKB() 遞迴加總排序", () => {
    const big = new Directory("big");
    big.addChild(new TextFile("x.txt", 1000, DATE, "UTF-8"));
    const small = new Directory("small");
    small.addChild(new TextFile("y.txt", 10, DATE, "UTF-8"));
    const sorted = new SizeSortStrategy("asc").sort([big, small]);
    expect(sorted[0].name).toBe("small");
  });

  it("label 正確", () => {
    expect(new SizeSortStrategy("asc").label).toBe("依大小 小→大");
    expect(new SizeSortStrategy("desc").label).toBe("依大小 大→小");
  });
});
