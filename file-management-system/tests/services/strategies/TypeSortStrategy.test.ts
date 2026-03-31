import { describe, it, expect } from "vitest";
import { TypeSortStrategy } from "../../../src/services/strategies/TypeSortStrategy";
import { Directory } from "../../../src/domain/Directory";
import { TextFile } from "../../../src/domain/TextFile";

const DATE = new Date("2026-03-20");

describe("TypeSortStrategy", () => {
  const dir1 = new Directory("folder1");
  const dir2 = new Directory("folder2");
  const file1 = new TextFile("file1.txt", 10, DATE, "UTF-8");
  const file2 = new TextFile("file2.txt", 10, DATE, "UTF-8");

  it("folder priority: 資料夾排在檔案前面", () => {
    const sorted = new TypeSortStrategy("folder").sort([
      file1,
      dir1,
      file2,
      dir2,
    ]);
    // 前兩個應是 Directory
    expect(sorted[0].isDirectory()).toBe(true);
    expect(sorted[1].isDirectory()).toBe(true);
    expect(sorted[2].isDirectory()).toBe(false);
    expect(sorted[3].isDirectory()).toBe(false);
  });

  it("file priority: 檔案排在資料夾前面", () => {
    const sorted = new TypeSortStrategy("file").sort([
      dir1,
      file1,
      dir2,
      file2,
    ]);
    expect(sorted[0].isDirectory()).toBe(false);
    expect(sorted[1].isDirectory()).toBe(false);
    expect(sorted[2].isDirectory()).toBe(true);
    expect(sorted[3].isDirectory()).toBe(true);
  });

  it("空陣列回傳空陣列", () => {
    expect(new TypeSortStrategy("folder").sort([])).toEqual([]);
  });

  it("不修改原陣列", () => {
    const nodes = [file1, dir1];
    const first = nodes[0];
    new TypeSortStrategy("folder").sort(nodes);
    expect(nodes[0]).toBe(first);
  });

  it("label 正確", () => {
    expect(new TypeSortStrategy("folder").label).toBe("依類型 資料夾優先");
    expect(new TypeSortStrategy("file").label).toBe("依類型 檔案優先");
  });
});
