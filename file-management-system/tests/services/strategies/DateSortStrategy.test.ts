import { describe, it, expect } from "vitest";
import { DateSortStrategy } from "../../../src/services/strategies/DateSortStrategy";
import { TextFile } from "../../../src/domain/TextFile";
import { Directory } from "../../../src/domain/Directory";

describe("DateSortStrategy", () => {
  const old = new TextFile("old.txt", 10, new Date("2020-01-01"), "UTF-8");
  const mid = new TextFile("mid.txt", 10, new Date("2023-06-15"), "UTF-8");
  const recent = new TextFile(
    "recent.txt",
    10,
    new Date("2026-01-01"),
    "UTF-8",
  );

  it("asc: 舊→新排序", () => {
    const sorted = new DateSortStrategy("asc").sort([recent, old, mid]);
    expect(sorted.map((n) => n.name)).toEqual([
      "old.txt",
      "mid.txt",
      "recent.txt",
    ]);
  });

  it("desc: 新→舊排序", () => {
    const sorted = new DateSortStrategy("desc").sort([old, recent, mid]);
    expect(sorted[0].name).toBe("recent.txt");
    expect(sorted[2].name).toBe("old.txt");
  });

  it("空陣列回傳空陣列", () => {
    expect(new DateSortStrategy("asc").sort([])).toEqual([]);
  });

  it("不修改原陣列", () => {
    const nodes = [recent, old];
    const first = nodes[0];
    new DateSortStrategy("asc").sort(nodes);
    expect(nodes[0]).toBe(first);
  });

  it("Directory 視為 epoch（最舊）— asc 時排在最前", () => {
    const dir = new Directory("folder");
    const file = new TextFile("file.txt", 5, new Date("2025-01-01"), "UTF-8");
    const sorted = new DateSortStrategy("asc").sort([file, dir]);
    expect(sorted[0]).toBe(dir);
  });

  it("Directory 視為 epoch（最舊）— desc 時排在最後", () => {
    const dir = new Directory("folder");
    const file = new TextFile("file.txt", 5, new Date("2025-01-01"), "UTF-8");
    const sorted = new DateSortStrategy("desc").sort([dir, file]);
    expect(sorted[sorted.length - 1]).toBe(dir);
  });

  it("label 正確", () => {
    expect(new DateSortStrategy("asc").label).toBe("依日期 舊→新");
    expect(new DateSortStrategy("desc").label).toBe("依日期 新→舊");
  });
});
