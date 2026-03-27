import { describe, it, expect } from "vitest";
import { Directory } from "../../../src/domain/Directory";
import { WordDocument } from "../../../src/domain/WordDocument";
import { ImageFile } from "../../../src/domain/ImageFile";
import { TextFile } from "../../../src/domain/TextFile";
import { exportToMarkdown } from "../../../src/services/exporters/MarkdownExporter";

const DATE = new Date("2026-01-15T00:00:00.000Z");

describe("MarkdownExporter", () => {
  it("根 Directory 輸出以 `- 📁` 開頭", () => {
    const root = new Directory("MyDocs");
    const md = exportToMarkdown(root);
    expect(md.startsWith("- 📁 MyDocs")).toBe(true);
  });

  it("根目錄行顯示正確的 sizeKB", () => {
    const root = new Directory("root");
    root.addChild(new TextFile("a.txt", 50, DATE, "UTF-8"));
    const md = exportToMarkdown(root);
    expect(md).toContain("- 📁 root (50 KB)");
  });

  it("TextFile 子節點縮排 2 個空格，含 Emoji 與 encoding", () => {
    const root = new Directory("root");
    root.addChild(new TextFile("notes.txt", 10, DATE, "UTF-8"));
    const lines = exportToMarkdown(root).split("\n");
    const leafLine = lines.find((l) => l.includes("notes.txt"));
    expect(leafLine).toBeDefined();
    expect(leafLine).toMatch(/^  - 📝 notes\.txt \(10 KB, UTF-8\)$/);
  });

  it("WordDocument 子節點含 pageCount 與 Emoji", () => {
    const root = new Directory("root");
    root.addChild(new WordDocument("report.docx", 80, DATE, 12));
    const md = exportToMarkdown(root);
    expect(md).toContain("- 📄 report.docx (80 KB, 12 pages)");
  });

  it("ImageFile 子節點含 width×height 與 Emoji", () => {
    const root = new Directory("root");
    root.addChild(new ImageFile("photo.png", 300, DATE, 1920, 1080));
    const md = exportToMarkdown(root);
    expect(md).toContain("- 🖼️ photo.png (300 KB, 1920×1080)");
  });

  it("子目錄縮排 2 格，孫節點縮排 4 格", () => {
    const root = new Directory("root");
    const sub = new Directory("sub");
    sub.addChild(new TextFile("deep.txt", 5, DATE, "ASCII"));
    root.addChild(sub);
    const lines = exportToMarkdown(root).split("\n");

    const subLine = lines.find((l) => l.includes("- 📁 sub"));
    const leafLine = lines.find((l) => l.includes("deep.txt"));
    expect(subLine).toBeDefined();
    expect(leafLine).toBeDefined();
    expect(subLine!.startsWith("  - 📁 sub")).toBe(true);
    expect(leafLine!.startsWith("    - 📝 deep.txt")).toBe(true);
  });

  it("輸出不含孤立空行（renderDirClose 的空字串已過濾）", () => {
    const root = new Directory("root");
    const sub = new Directory("sub");
    root.addChild(sub);
    const lines = exportToMarkdown(root).split("\n");
    const emptyLines = lines.filter((l) => l.trim() === "");
    expect(emptyLines).toHaveLength(0);
  });

  it("檔名含 * 時，輸出包含 \\* 脫逸", () => {
    const root = new Directory("root");
    root.addChild(new TextFile("file*name.txt", 1, DATE, "UTF-8"));
    const md = exportToMarkdown(root);
    expect(md).toContain("file\\*name.txt");
  });

  it("檔名含反引號時，輸出包含 \\` 脫逸", () => {
    const root = new Directory("root");
    root.addChild(new TextFile("file`name.txt", 1, DATE, "UTF-8"));
    const md = exportToMarkdown(root);
    expect(md).toContain("file\\`name.txt");
  });

  it("檔名含底線時，輸出包含 \\_ 脫逸", () => {
    const root = new Directory("root");
    root.addChild(new TextFile("file_name.txt", 1, DATE, "UTF-8"));
    const md = exportToMarkdown(root);
    expect(md).toContain("file\\_name.txt");
  });

  it("多個子節點的多層結構：每個節點都在正確位置", () => {
    const root = new Directory("root");
    root.addChild(new WordDocument("report.docx", 50, DATE, 3));
    root.addChild(new ImageFile("photo.png", 60, DATE, 800, 600));
    const sub = new Directory("archive");
    sub.addChild(new TextFile("old.txt", 10, DATE, "ASCII"));
    root.addChild(sub);

    const md = exportToMarkdown(root);
    const lines = md.split("\n");

    expect(lines[0]).toContain("- 📁 root");
    expect(lines[1]).toContain("report.docx");
    expect(lines[2]).toContain("photo.png");
    expect(lines[3]).toContain("- 📁 archive");
    expect(lines[4]).toContain("old.txt");
  });
});
