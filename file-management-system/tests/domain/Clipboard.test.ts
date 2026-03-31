import { afterEach, describe, expect, it } from "vitest";
import { Clipboard } from "../../src/domain/Clipboard";
import { TextFile } from "../../src/domain/TextFile";

afterEach(() => {
  Clipboard._resetForTest();
});

describe("Clipboard", () => {
  it("getInstance() 兩次呼叫回傳同一實例", () => {
    const a = Clipboard.getInstance();
    const b = Clipboard.getInstance();
    expect(a).toBe(b);
  });

  it("初始狀態 hasNode() 為 false", () => {
    expect(Clipboard.getInstance().hasNode()).toBe(false);
  });

  it("setNode() 後 getNode() 回傳相同節點", () => {
    const clipboard = Clipboard.getInstance();
    const file = new TextFile("a.txt", 10, new Date(), "UTF-8");
    clipboard.setNode(file);
    expect(clipboard.getNode()).toBe(file);
  });

  it("setNode() 後 hasNode() 為 true", () => {
    const clipboard = Clipboard.getInstance();
    clipboard.setNode(new TextFile("b.txt", 5, new Date(), "UTF-8"));
    expect(clipboard.hasNode()).toBe(true);
  });

  it("clear() 後 hasNode() 為 false", () => {
    const clipboard = Clipboard.getInstance();
    clipboard.setNode(new TextFile("c.txt", 5, new Date(), "UTF-8"));
    clipboard.clear();
    expect(clipboard.hasNode()).toBe(false);
    expect(clipboard.getNode()).toBeNull();
  });

  it("_resetForTest() 後 getInstance() 建立新實例", () => {
    const before = Clipboard.getInstance();
    Clipboard._resetForTest();
    const after = Clipboard.getInstance();
    expect(before).not.toBe(after);
  });
});
