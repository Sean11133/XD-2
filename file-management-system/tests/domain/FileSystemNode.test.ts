import { describe, it, expect } from "vitest";
import { FileSystemNode } from "../../src/domain/FileSystemNode";
import { WordDocument } from "../../src/domain/WordDocument";
import { ImageFile } from "../../src/domain/ImageFile";
import { TextFile } from "../../src/domain/TextFile";
import { Directory } from "../../src/domain/Directory";

const DATE = new Date("2026-03-20");

describe("WordDocument", () => {
  it("getDisplayInfo 回傳正確格式", () => {
    const doc = new WordDocument("需求規格.docx", 245, DATE, 12);
    expect(doc.getDisplayInfo()).toBe(
      "📄 需求規格.docx [Word] 245KB, 12頁, 2026-03-20",
    );
  });

  it("isDirectory 回傳 false", () => {
    const doc = new WordDocument("test.docx", 10, DATE, 1);
    expect(doc.isDirectory()).toBe(false);
  });

  it("可作為 FileSystemNode 使用（LSP）", () => {
    const doc: FileSystemNode = new WordDocument("test.docx", 10, DATE, 1);
    expect(doc.getDisplayInfo()).toContain("[Word]");
  });
});

describe("ImageFile", () => {
  it("getDisplayInfo 回傳正確格式", () => {
    const img = new ImageFile("架構圖.png", 1024, DATE, 1920, 1080);
    expect(img.getDisplayInfo()).toBe(
      "🖼️ 架構圖.png [圖片] 1024KB, 1920×1080, 2026-03-20",
    );
  });

  it("isDirectory 回傳 false", () => {
    const img = new ImageFile("test.png", 100, DATE, 800, 600);
    expect(img.isDirectory()).toBe(false);
  });

  it("可作為 FileSystemNode 使用（LSP）", () => {
    const img: FileSystemNode = new ImageFile("test.png", 100, DATE, 800, 600);
    expect(img.getDisplayInfo()).toContain("[圖片]");
  });
});

describe("TextFile", () => {
  it("getDisplayInfo 回傳正確格式", () => {
    const txt = new TextFile("config.txt", 2, DATE, "UTF-8");
    expect(txt.getDisplayInfo()).toBe(
      "📝 config.txt [文字] 2KB, UTF-8, 2026-03-20",
    );
  });

  it("isDirectory 回傳 false", () => {
    const txt = new TextFile("test.txt", 1, DATE, "UTF-8");
    expect(txt.isDirectory()).toBe(false);
  });

  it("可作為 FileSystemNode 使用（LSP）", () => {
    const txt: FileSystemNode = new TextFile("test.txt", 1, DATE, "UTF-8");
    expect(txt.getDisplayInfo()).toContain("[文字]");
  });
});

describe("Directory", () => {
  it("可包含 File 子類別", () => {
    const dir = new Directory("測試目錄");
    const doc = new WordDocument("test.docx", 10, DATE, 1);
    dir.addChild(doc);
    expect(dir.getChildren()).toHaveLength(1);
  });

  it("可包含子 Directory（巢狀）", () => {
    const parent = new Directory("父目錄");
    const child = new Directory("子目錄");
    parent.addChild(child);
    expect(parent.getChildren()[0]).toBe(child);
  });

  it("空目錄 getChildren 回傳空陣列", () => {
    const dir = new Directory("空目錄");
    expect(dir.getChildren()).toHaveLength(0);
  });

  it("isDirectory 回傳 true", () => {
    const dir = new Directory("目錄");
    expect(dir.isDirectory()).toBe(true);
  });
});
