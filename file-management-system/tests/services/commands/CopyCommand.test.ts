import { afterEach, describe, expect, it } from "vitest";
import { Clipboard } from "../../../src/domain/Clipboard";
import { CopyCommand } from "../../../src/services/commands/CopyCommand";
import { TextFile } from "../../../src/domain/TextFile";

afterEach(() => {
  Clipboard._resetForTest();
});

describe("CopyCommand", () => {
  it("execute() 將節點存入 Clipboard", () => {
    const clipboard = Clipboard.getInstance();
    const node = new TextFile("a.txt", 10, new Date(), "UTF-8");
    const cmd = new CopyCommand(node, clipboard);
    cmd.execute();
    expect(clipboard.hasNode()).toBe(true);
    expect(clipboard.getNode()).toBe(node);
  });

  it("undo() 不改變 Clipboard 狀態（no-op）", () => {
    const clipboard = Clipboard.getInstance();
    const node = new TextFile("a.txt", 10, new Date(), "UTF-8");
    clipboard.setNode(node);
    new CopyCommand(node, clipboard).undo();
    expect(clipboard.getNode()).toBe(node);
  });

  it("description 為「複製」", () => {
    const clipboard = Clipboard.getInstance();
    const cmd = new CopyCommand(
      new TextFile("x.txt", 1, new Date(), "UTF-8"),
      clipboard,
    );
    expect(cmd.description).toBe("複製");
  });
});
