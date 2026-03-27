import { describe, it, expect } from "vitest";
import { Directory } from "../../src/domain/Directory";
import { WordDocument } from "../../src/domain/WordDocument";
import { ImageFile } from "../../src/domain/ImageFile";
import { TextFile } from "../../src/domain/TextFile";
import { FileSystemNode } from "../../src/domain/FileSystemNode";

const DATE = new Date("2026-03-20");

describe("Directory", () => {
  it("getDisplayInfo 回傳資料夾格式", () => {
    const dir = new Directory("我的目錄");
    expect(dir.getDisplayInfo()).toBe("📁 我的目錄");
  });

  it("isDirectory 回傳 true", () => {
    const dir = new Directory("目錄");
    expect(dir.isDirectory()).toBe(true);
  });

  it("空目錄 getChildren 回傳空陣列", () => {
    const dir = new Directory("空目錄");
    expect(dir.getChildren()).toHaveLength(0);
  });

  it("addChild 加入 WordDocument 後可正確取得", () => {
    const dir = new Directory("目錄");
    const doc = new WordDocument("test.docx", 100, DATE, 5);
    dir.addChild(doc);
    const children = dir.getChildren();
    expect(children).toHaveLength(1);
    expect(children[0]).toBe(doc);
  });

  it("可包含多個不同類型的子節點", () => {
    const dir = new Directory("目錄");
    dir.addChild(new WordDocument("doc.docx", 100, DATE, 5));
    dir.addChild(new ImageFile("img.png", 200, DATE, 800, 600));
    dir.addChild(new TextFile("txt.txt", 10, DATE, "UTF-8"));
    expect(dir.getChildren()).toHaveLength(3);
  });

  it("可包含子 Directory（巢狀 Composite）", () => {
    const parent = new Directory("父目錄");
    const child = new Directory("子目錄");
    parent.addChild(child);
    const children = parent.getChildren();
    expect(children).toHaveLength(1);
    expect((children[0] as Directory).isDirectory()).toBe(true);
  });

  it("多層巢狀（≥3層）可正確建構", () => {
    const root = new Directory("root");
    const level1 = new Directory("level1");
    const level2 = new Directory("level2");
    const leaf = new WordDocument("leaf.docx", 10, DATE, 1);

    level2.addChild(leaf);
    level1.addChild(level2);
    root.addChild(level1);

    const l1 = root.getChildren()[0] as Directory;
    const l2 = l1.getChildren()[0] as Directory;
    const l3 = l2.getChildren()[0];

    expect(l1.name).toBe("level1");
    expect(l2.name).toBe("level2");
    expect(l3.getDisplayInfo()).toContain("leaf.docx");
  });

  it("getChildren 回傳防禦性複製（不影響內部狀態）", () => {
    const dir = new Directory("目錄");
    dir.addChild(new WordDocument("doc.docx", 10, DATE, 1));
    const children = dir.getChildren() as FileSystemNode[];
    children.push(new TextFile("extra.txt", 1, DATE, "UTF-8"));
    expect(dir.getChildren()).toHaveLength(1);
  });
});

// ── Composite Pattern ─────────────────────────────────────────────────────────

describe("Directory.getSizeKB", () => {
  it("空目錄大小為 0", () => {
    expect(new Directory("empty").getSizeKB()).toBe(0);
  });

  it("單層目錄大小等於所有直接子節點總和", () => {
    const dir = new Directory("dir");
    dir.addChild(new WordDocument("a.docx", 100, DATE, 1));
    dir.addChild(new ImageFile("b.png", 200, DATE, 800, 600));
    dir.addChild(new TextFile("c.txt", 50, DATE, "UTF-8"));
    expect(dir.getSizeKB()).toBe(350);
  });

  it("巢狀目錄遞迴加總所有葉節點大小", () => {
    const root = new Directory("root");
    const sub = new Directory("sub");
    sub.addChild(new WordDocument("x.docx", 40, DATE, 1));
    sub.addChild(new TextFile("y.txt", 10, DATE, "UTF-8"));
    root.addChild(sub);
    root.addChild(new ImageFile("z.png", 100, DATE, 1920, 1080));
    // 總計 40 + 10 + 100 = 150
    expect(root.getSizeKB()).toBe(150);
  });

  it("Leaf.getSizeKB 直接回傳 sizeKB", () => {
    const doc = new WordDocument("file.docx", 77, DATE, 3);
    expect(doc.getSizeKB()).toBe(77);
  });
});

// ── Domain Method ─────────────────────────────────────────────────────────────

describe("Directory.search", () => {
  it("空目錄搜尋回傳空陣列", () => {
    expect(new Directory("root").search("test")).toHaveLength(0);
  });

  it("直接子節點名稱完全符合", () => {
    const dir = new Directory("root");
    const doc = new WordDocument("report.docx", 10, DATE, 1);
    dir.addChild(doc);
    const results = dir.search("report");
    expect(results).toHaveLength(1);
    expect(results[0]).toBe(doc);
  });

  it("大小寫不分（case-insensitive）", () => {
    const dir = new Directory("root");
    const file = new TextFile("README.txt", 5, DATE, "UTF-8");
    dir.addChild(file);
    expect(dir.search("readme")).toHaveLength(1);
    expect(dir.search("README")).toHaveLength(1);
  });

  it("部分比對：關鍵字為名稱子字串", () => {
    const dir = new Directory("root");
    dir.addChild(new ImageFile("holiday-photo.png", 300, DATE, 1920, 1080));
    dir.addChild(new WordDocument("photo-album.docx", 80, DATE, 12));
    const results = dir.search("photo");
    expect(results).toHaveLength(2);
  });

  it("巢狀目錄遞迴搜尋", () => {
    const root = new Directory("root");
    const sub = new Directory("docs");
    const nested = new WordDocument("report.docx", 20, DATE, 1);
    sub.addChild(nested);
    root.addChild(sub);
    const results = root.search("report");
    expect(results).toHaveLength(1);
    expect(results[0]).toBe(nested);
  });

  it("無符合項目時回傳空陣列", () => {
    const dir = new Directory("root");
    dir.addChild(new TextFile("readme.txt", 5, DATE, "UTF-8"));
    expect(dir.search("xyz_not_exist")).toHaveLength(0);
  });
});
