import { describe, expect, it } from "vitest";
import { Directory } from "../../../src/domain/Directory";
import { SortCommand } from "../../../src/services/commands/SortCommand";
import { NameSortStrategy } from "../../../src/services/strategies/NameSortStrategy";
import { TextFile } from "../../../src/domain/TextFile";

const DATE = new Date("2026-03-20");

describe("SortCommand", () => {
  it("execute() 依策略排序 children", () => {
    const dir = new Directory("root");
    const c = new TextFile("c.txt", 1, DATE, "UTF-8");
    const a = new TextFile("a.txt", 1, DATE, "UTF-8");
    const b = new TextFile("b.txt", 1, DATE, "UTF-8");
    dir.addChild(c);
    dir.addChild(a);
    dir.addChild(b);

    const snapshot = [...dir.getChildren()];
    const cmd = new SortCommand(dir, new NameSortStrategy("asc"), snapshot);
    cmd.execute();

    expect(dir.getChildren().map((n) => n.name)).toEqual([
      "a.txt",
      "b.txt",
      "c.txt",
    ]);
  });

  it("undo() 後 children 恢復 _originalOrder", () => {
    const dir = new Directory("root");
    const c = new TextFile("c.txt", 1, DATE, "UTF-8");
    const a = new TextFile("a.txt", 1, DATE, "UTF-8");
    dir.addChild(c);
    dir.addChild(a);

    const snapshot = [...dir.getChildren()];
    const cmd = new SortCommand(dir, new NameSortStrategy("asc"), snapshot);
    cmd.execute();
    cmd.undo();

    expect(dir.getChildren().map((n) => n.name)).toEqual(["c.txt", "a.txt"]);
  });

  it("連續 execute 兩次 — 第二次以目前 children 為輸入，_originalOrder 不受影響", () => {
    const dir = new Directory("root");
    const b = new TextFile("b.txt", 1, DATE, "UTF-8");
    const a = new TextFile("a.txt", 1, DATE, "UTF-8");
    dir.addChild(b);
    dir.addChild(a);

    const snapshot = [...dir.getChildren()];
    const cmd = new SortCommand(dir, new NameSortStrategy("asc"), snapshot);
    cmd.execute();
    cmd.execute();

    // children 仍然有序
    expect(dir.getChildren().map((n) => n.name)).toEqual(["a.txt", "b.txt"]);
    // undo 依然能還原到最初快照
    cmd.undo();
    expect(dir.getChildren().map((n) => n.name)).toEqual(["b.txt", "a.txt"]);
  });

  it("description 為「排序」", () => {
    const cmd = new SortCommand(
      new Directory("d"),
      new NameSortStrategy("asc"),
      [],
    );
    expect(cmd.description).toBe("排序");
  });
});
