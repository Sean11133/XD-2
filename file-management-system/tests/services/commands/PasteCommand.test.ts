import { afterEach, describe, expect, it } from "vitest";
import { Clipboard } from "../../../src/domain/Clipboard";
import { Directory } from "../../../src/domain/Directory";
import { PasteCommand } from "../../../src/services/commands/PasteCommand";
import { TextFile } from "../../../src/domain/TextFile";

afterEach(() => {
  Clipboard._resetForTest();
});

describe("PasteCommand", () => {
  it("execute() 貼入 clone 節點，children 數量 +1", () => {
    const clipboard = Clipboard.getInstance();
    const source = new TextFile("src.txt", 10, new Date(), "UTF-8");
    clipboard.setNode(source);

    const targetDir = new Directory("target");
    const cmd = new PasteCommand(clipboard, targetDir);
    cmd.execute();

    expect(targetDir.getChildren()).toHaveLength(1);
  });

  it("execute() 貼入的是 clone（!== 原始節點）", () => {
    const clipboard = Clipboard.getInstance();
    const source = new TextFile("src.txt", 10, new Date(), "UTF-8");
    clipboard.setNode(source);

    const targetDir = new Directory("target");
    new PasteCommand(clipboard, targetDir).execute();

    expect(targetDir.getChildren()[0]).not.toBe(source);
  });

  it("undo() 後 children 數量恢復原值", () => {
    const clipboard = Clipboard.getInstance();
    clipboard.setNode(new TextFile("src.txt", 10, new Date(), "UTF-8"));

    const targetDir = new Directory("target");
    const cmd = new PasteCommand(clipboard, targetDir);
    cmd.execute();
    expect(targetDir.getChildren()).toHaveLength(1);
    cmd.undo();
    expect(targetDir.getChildren()).toHaveLength(0);
  });

  it("Clipboard 為空時 execute() 拋出例外", () => {
    const clipboard = Clipboard.getInstance();
    const targetDir = new Directory("target");
    const cmd = new PasteCommand(clipboard, targetDir);
    expect(() => cmd.execute()).toThrow("Clipboard is empty");
  });

  it("description 為「貼上」", () => {
    const cmd = new PasteCommand(Clipboard.getInstance(), new Directory("d"));
    expect(cmd.description).toBe("貼上");
  });

  // ── 同名重命名規則 ──────────────────────────────────────────────────────

  it("目標目錄無同名節點時，名稱不變", () => {
    const clipboard = Clipboard.getInstance();
    clipboard.setNode(new TextFile("config.txt", 10, new Date(), "UTF-8"));

    const targetDir = new Directory("dir");
    const cmd = new PasteCommand(clipboard, targetDir);
    cmd.execute();

    expect(cmd.pastedNodeName).toBe("config.txt");
  });

  it("目標目錄已有同名節點時，自動加 (複製) 后綴", () => {
    const clipboard = Clipboard.getInstance();
    clipboard.setNode(new TextFile("config.txt", 10, new Date(), "UTF-8"));

    const targetDir = new Directory("dir");
    targetDir.addChild(new TextFile("config.txt", 5, new Date(), "UTF-8"));

    const cmd = new PasteCommand(clipboard, targetDir);
    cmd.execute();

    expect(cmd.pastedNodeName).toBe("config (複製).txt");
  });

  it("(複製) 也衝突時，使用 (複製 2)", () => {
    const clipboard = Clipboard.getInstance();
    clipboard.setNode(new TextFile("a.txt", 10, new Date(), "UTF-8"));

    const targetDir = new Directory("dir");
    targetDir.addChild(new TextFile("a.txt", 1, new Date(), "UTF-8"));
    targetDir.addChild(new TextFile("a (複製).txt", 1, new Date(), "UTF-8"));

    const cmd = new PasteCommand(clipboard, targetDir);
    cmd.execute();

    expect(cmd.pastedNodeName).toBe("a (複製 2).txt");
  });

  it("Directory 同名也套用重命名規則", () => {
    const clipboard = Clipboard.getInstance();
    const srcDir = new Directory("docs");
    clipboard.setNode(srcDir);

    const targetDir = new Directory("root");
    targetDir.addChild(new Directory("docs"));

    const cmd = new PasteCommand(clipboard, targetDir);
    cmd.execute();

    expect(cmd.pastedNodeName).toBe("docs (複製)");
  });
});
