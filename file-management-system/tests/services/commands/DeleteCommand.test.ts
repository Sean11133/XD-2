import { describe, expect, it } from "vitest";
import { Directory } from "../../../src/domain/Directory";
import { DeleteCommand } from "../../../src/services/commands/DeleteCommand";
import { TextFile } from "../../../src/domain/TextFile";

const DATE = new Date("2026-03-20");

describe("DeleteCommand", () => {
  it("execute() 後節點不在 children 中", () => {
    const parent = new Directory("root");
    const file = new TextFile("a.txt", 10, DATE, "UTF-8");
    parent.addChild(file);

    const cmd = new DeleteCommand(file, parent);
    cmd.execute();

    expect(parent.getChildren()).toHaveLength(0);
  });

  it("execute() 記錄的原始 index 正確（中間節點）", () => {
    const parent = new Directory("root");
    const a = new TextFile("a.txt", 10, DATE, "UTF-8");
    const b = new TextFile("b.txt", 10, DATE, "UTF-8");
    const c = new TextFile("c.txt", 10, DATE, "UTF-8");
    parent.addChild(a);
    parent.addChild(b);
    parent.addChild(c);

    const cmd = new DeleteCommand(b, parent);
    cmd.execute();

    // undo 還原後 b 應回到 index 1
    cmd.undo();
    expect(parent.getChildren()[1]).toBe(b);
  });

  it("undo() 後節點回到原位", () => {
    const parent = new Directory("root");
    const file = new TextFile("x.txt", 5, DATE, "UTF-8");
    parent.addChild(file);

    const cmd = new DeleteCommand(file, parent);
    cmd.execute();
    cmd.undo();

    expect(parent.getChildren()).toHaveLength(1);
    expect(parent.getChildren()[0]).toBe(file);
  });

  it("description 為「刪除」", () => {
    const cmd = new DeleteCommand(
      new TextFile("f.txt", 1, DATE, "UTF-8"),
      new Directory("d"),
    );
    expect(cmd.description).toBe("刪除");
  });
});
