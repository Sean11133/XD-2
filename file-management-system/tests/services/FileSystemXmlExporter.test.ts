import { describe, it, expect } from "vitest";
import { Directory } from "../../src/domain/Directory";
import { WordDocument } from "../../src/domain/WordDocument";
import { ImageFile } from "../../src/domain/ImageFile";
import { TextFile } from "../../src/domain/TextFile";
import { exportToXml } from "../../src/services/FileSystemXmlExporter";

const DATE = new Date("2026-01-15T00:00:00.000Z");

describe("FileSystemXmlExporter (Visitor Pattern)", () => {
  it("空目錄輸出含 XML 宣告與 Directory 元素", () => {
    const root = new Directory("root");
    const xml = exportToXml(root);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<Directory name="root" sizeKB="0">');
    expect(xml).toContain("</Directory>");
  });

  it("visitWordDocument — 產生含正確屬性的 File 元素", () => {
    const root = new Directory("root");
    root.addChild(new WordDocument("report.docx", 80, DATE, 5));
    const xml = exportToXml(root);
    expect(xml).toContain('type="WordDocument"');
    expect(xml).toContain('name="report.docx"');
    expect(xml).toContain('sizeKB="80"');
    expect(xml).toContain('pageCount="5"');
  });

  it("visitImageFile — 產生含 width/height 的 File 元素", () => {
    const root = new Directory("root");
    root.addChild(new ImageFile("photo.png", 300, DATE, 1920, 1080));
    const xml = exportToXml(root);
    expect(xml).toContain('type="ImageFile"');
    expect(xml).toContain('name="photo.png"');
    expect(xml).toContain('width="1920"');
    expect(xml).toContain('height="1080"');
  });

  it("visitTextFile — 產生含 encoding 的 File 元素", () => {
    const root = new Directory("root");
    root.addChild(new TextFile("readme.txt", 10, DATE, "UTF-8"));
    const xml = exportToXml(root);
    expect(xml).toContain('type="TextFile"');
    expect(xml).toContain('encoding="UTF-8"');
  });

  it("巢狀目錄遞迴序列化（accept 呼叫鏈正確）", () => {
    const root = new Directory("root");
    const sub = new Directory("docs");
    sub.addChild(new WordDocument("plan.docx", 50, DATE, 3));
    root.addChild(sub);
    const xml = exportToXml(root);
    // root Directory 應包含 sub Directory
    expect(xml).toContain('<Directory name="docs"');
    expect(xml).toContain('name="plan.docx"');
  });

  it("sizeKB 屬性反映總計大小（Composite Pattern 整合）", () => {
    const root = new Directory("root");
    root.addChild(new WordDocument("a.docx", 100, DATE, 1));
    root.addChild(new TextFile("b.txt", 50, DATE, "UTF-8"));
    const xml = exportToXml(root);
    expect(xml).toContain('sizeKB="150"');
  });

  it("XML 特殊字元應被跳脫（& < > \" '）", () => {
    const root = new Directory("root");
    root.addChild(new TextFile("test<>&\"'.txt", 5, DATE, "UTF-8"));
    const xml = exportToXml(root);
    expect(xml).toContain("&amp;");
    expect(xml).toContain("&lt;");
    expect(xml).toContain("&gt;");
    expect(xml).toContain("&quot;");
    expect(xml).toContain("&apos;");
    // 不應出現未跳脫的危險字元於屬性值中
    expect(xml).not.toContain('name="test<>&"\'.txt"');
  });

  it("多層巢狀縮排正確（每層增加 2 個空格）", () => {
    const root = new Directory("root");
    const sub = new Directory("sub");
    sub.addChild(new TextFile("file.txt", 1, DATE, "ASCII"));
    root.addChild(sub);
    const xml = exportToXml(root);
    const lines = xml.split("\n");
    const subDirLine = lines.find((l) => l.includes('<Directory name="sub"'));
    const fileLine = lines.find((l) => l.includes('name="file.txt"'));
    expect(subDirLine).toBeDefined();
    expect(fileLine).toBeDefined();
    // sub Directory 縮排 2 格，File 縮排 4 格
    expect(subDirLine!.startsWith("  ")).toBe(true);
    expect(fileLine!.startsWith("    ")).toBe(true);
  });
});
