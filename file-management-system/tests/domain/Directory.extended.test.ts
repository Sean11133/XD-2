import { describe, it, expect } from "vitest";
import { Directory } from "../../src/domain/Directory";
import { TextFile } from "../../src/domain/TextFile";
import { WordDocument } from "../../src/domain/WordDocument";
import { ImageFile } from "../../src/domain/ImageFile";

const DATE = new Date("2026-03-20");

describe("Directory.removeChild", () => {
  it("移除存在的節點後回傳正確 index (0)", () => {
    const dir = new Directory("root");
    const file = new TextFile("a.txt", 10, DATE, "UTF-8");
    dir.addChild(file);
    const idx = dir.removeChild(file);
    expect(idx).toBe(0);
    expect(dir.getChildren()).toHaveLength(0);
  });

  it("移除中間節點回傳正確 index", () => {
    const dir = new Directory("root");
    const a = new TextFile("a.txt", 10, DATE, "UTF-8");
    const b = new TextFile("b.txt", 10, DATE, "UTF-8");
    const c = new TextFile("c.txt", 10, DATE, "UTF-8");
    dir.addChild(a);
    dir.addChild(b);
    dir.addChild(c);
    const idx = dir.removeChild(b);
    expect(idx).toBe(1);
    expect(dir.getChildren()).toHaveLength(2);
  });

  it("節點不存在時回傳 -1 且不改變 children", () => {
    const dir = new Directory("root");
    const file = new TextFile("a.txt", 10, DATE, "UTF-8");
    dir.addChild(new TextFile("b.txt", 5, DATE, "UTF-8"));
    const idx = dir.removeChild(file);
    expect(idx).toBe(-1);
    expect(dir.getChildren()).toHaveLength(1);
  });
});

describe("Directory.insertChildAt", () => {
  it("index=0 插入到最前面", () => {
    const dir = new Directory("root");
    const a = new TextFile("a.txt", 10, DATE, "UTF-8");
    const b = new TextFile("b.txt", 10, DATE, "UTF-8");
    dir.addChild(a);
    dir.insertChildAt(0, b);
    expect(dir.getChildren()[0]).toBe(b);
    expect(dir.getChildren()[1]).toBe(a);
  });

  it("index=length 等同 push（加到最後）", () => {
    const dir = new Directory("root");
    const a = new TextFile("a.txt", 10, DATE, "UTF-8");
    const b = new TextFile("b.txt", 10, DATE, "UTF-8");
    dir.addChild(a);
    dir.insertChildAt(1, b);
    expect(dir.getChildren()[1]).toBe(b);
  });

  it("插入後 children 長度增加 1", () => {
    const dir = new Directory("root");
    dir.addChild(new TextFile("a.txt", 5, DATE, "UTF-8"));
    dir.addChild(new TextFile("c.txt", 5, DATE, "UTF-8"));
    dir.insertChildAt(1, new TextFile("b.txt", 5, DATE, "UTF-8"));
    expect(dir.getChildren()).toHaveLength(3);
  });
});

describe("Directory.replaceChildren", () => {
  it("完全替換 children 為新陣列", () => {
    const dir = new Directory("root");
    dir.addChild(new TextFile("old.txt", 5, DATE, "UTF-8"));
    const newA = new WordDocument("a.docx", 10, DATE, 1);
    const newB = new WordDocument("b.docx", 20, DATE, 2);
    dir.replaceChildren([newA, newB]);
    const children = dir.getChildren();
    expect(children).toHaveLength(2);
    expect(children[0]).toBe(newA);
    expect(children[1]).toBe(newB);
  });

  it("傳入空陣列後 children 為空", () => {
    const dir = new Directory("root");
    dir.addChild(new TextFile("a.txt", 5, DATE, "UTF-8"));
    dir.replaceChildren([]);
    expect(dir.getChildren()).toHaveLength(0);
  });
});

describe("Directory.clone", () => {
  it("回傳新 Directory 實例（!== 原本）", () => {
    const dir = new Directory("root");
    const clone = dir.clone();
    expect(clone).not.toBe(dir);
    expect(clone).toBeInstanceOf(Directory);
  });

  it("clone 的 name 與原本相同", () => {
    const dir = new Directory("myDir");
    expect(dir.clone().name).toBe("myDir");
  });

  it("修改 clone 的子節點不影響原本", () => {
    const dir = new Directory("root");
    dir.addChild(new TextFile("a.txt", 5, DATE, "UTF-8"));
    const clone = dir.clone();
    clone.addChild(new TextFile("extra.txt", 1, DATE, "UTF-8"));
    expect(dir.getChildren()).toHaveLength(1);
    expect(clone.getChildren()).toHaveLength(2);
  });

  it("遞迴 clone — 子目錄的子節點也是獨立實例", () => {
    const root = new Directory("root");
    const sub = new Directory("sub");
    const leaf = new TextFile("leaf.txt", 5, DATE, "UTF-8");
    sub.addChild(leaf);
    root.addChild(sub);

    const cloned = root.clone();
    const clonedSub = cloned.getChildren()[0] as Directory;
    expect(clonedSub).not.toBe(sub);
    expect(clonedSub.getChildren()[0]).not.toBe(leaf);
  });
});

describe("File subclass clone()", () => {
  it("TextFile.clone() 回傳獨立實例，屬性相同", () => {
    const original = new TextFile("hello.txt", 12, DATE, "UTF-8");
    const cloned = original.clone();
    expect(cloned).not.toBe(original);
    expect(cloned).toBeInstanceOf(TextFile);
    expect(cloned.fileName).toBe("hello.txt");
    expect(cloned.sizeKB).toBe(12);
    expect(cloned.createdAt).toBe(DATE);
    expect(cloned.encoding).toBe("UTF-8");
  });

  it("WordDocument.clone() 回傳獨立實例，屬性相同", () => {
    const original = new WordDocument("doc.docx", 100, DATE, 5);
    const cloned = original.clone();
    expect(cloned).not.toBe(original);
    expect(cloned).toBeInstanceOf(WordDocument);
    expect(cloned.pageCount).toBe(5);
  });

  it("ImageFile.clone() 回傳獨立實例，屬性相同", () => {
    const original = new ImageFile("photo.png", 300, DATE, 1920, 1080);
    const cloned = original.clone();
    expect(cloned).not.toBe(original);
    expect(cloned).toBeInstanceOf(ImageFile);
    expect(cloned.width).toBe(1920);
    expect(cloned.height).toBe(1080);
  });
});
