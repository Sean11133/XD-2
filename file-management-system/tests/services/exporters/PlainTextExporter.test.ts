import { describe, it, expect } from "vitest";
import { Directory } from "../../../src/domain/Directory";
import { WordDocument } from "../../../src/domain/WordDocument";
import { ImageFile } from "../../../src/domain/ImageFile";
import { TextFile } from "../../../src/domain/TextFile";
import { exportToPlainText } from "../../../src/services/exporters/PlainTextExporter";

const DATE = new Date("2026-01-15T00:00:00.000Z");

describe("PlainTextExporter", () => {
  it("根 Directory 輸出 '{name}/ ({sizeKB} KB)' 格式", () => {
    const root = new Directory("MyDocs");
    const txt = exportToPlainText(root);
    expect(txt.startsWith("MyDocs/ (0 KB)")).toBe(true);
  });

  it("根目錄行顯示正確的 sizeKB", () => {
    const root = new Directory("root");
    root.addChild(new TextFile("a.txt", 50, DATE, "UTF-8"));
    const txt = exportToPlainText(root);
    expect(txt).toContain("root/ (50 KB)");
  });

  it("TextFile 子節點縮排 2 空格，顯示 [TXT] 標記與 encoding", () => {
    const root = new Directory("root");
    root.addChild(new TextFile("notes.txt", 10, DATE, "UTF-8"));
    const lines = exportToPlainText(root).split("\n");
    const leafLine = lines.find((l) => l.includes("notes.txt"));
    expect(leafLine).toBeDefined();
    expect(leafLine).toMatch(/^  \[TXT\] notes\.txt \(10 KB, UTF-8\)$/);
  });

  it("WordDocument 子節點顯示 [DOC] 標記與 pageCount", () => {
    const root = new Directory("root");
    root.addChild(new WordDocument("report.docx", 80, DATE, 12));
    const txt = exportToPlainText(root);
    expect(txt).toContain("[DOC] report.docx (80 KB, 12 pages)");
  });

  it("ImageFile 子節點顯示 [IMG] 標記與 widthxheight", () => {
    const root = new Directory("root");
    root.addChild(new ImageFile("photo.png", 300, DATE, 1920, 1080));
    const txt = exportToPlainText(root);
    expect(txt).toContain("[IMG] photo.png (300 KB, 1920x1080)");
  });

  it("子目錄縮排 2 格，孫節點縮排 4 格", () => {
    const root = new Directory("root");
    const sub = new Directory("sub");
    sub.addChild(new TextFile("deep.txt", 5, DATE, "ASCII"));
    root.addChild(sub);
    const lines = exportToPlainText(root).split("\n");

    const subLine = lines.find((l) => l.includes("sub/"));
    const leafLine = lines.find((l) => l.includes("deep.txt"));
    expect(subLine).toBeDefined();
    expect(leafLine).toBeDefined();
    expect(subLine!.startsWith("  sub/")).toBe(true);
    expect(leafLine!.startsWith("    [TXT] deep.txt")).toBe(true);
  });

  it("純文字格式不脫逸特殊字元", () => {
    const root = new Directory("my*dir");
    root.addChild(new TextFile("file_name.txt", 1, DATE, "UTF-8"));
    const txt = exportToPlainText(root);
    expect(txt).toContain("my*dir/");
    expect(txt).toContain("file_name.txt");
  });

  it("空目錄只輸出一行目錄標題", () => {
    const root = new Directory("empty");
    const lines = exportToPlainText(root)
      .split("\n")
      .filter((l) => l.trim());
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe("empty/ (0 KB)");
  });
});
