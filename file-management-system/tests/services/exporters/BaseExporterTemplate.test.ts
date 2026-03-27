import { describe, it, expect, vi } from "vitest";
import { Directory } from "../../../src/domain/Directory";
import { WordDocument } from "../../../src/domain/WordDocument";
import { ImageFile } from "../../../src/domain/ImageFile";
import { TextFile } from "../../../src/domain/TextFile";
import { BaseExporterTemplate } from "../../../src/services/exporters/BaseExporterTemplate";

const DATE = new Date("2026-01-15T00:00:00.000Z");

/**
 * 測試替身：包裹器標示 escape 被呼叫，以便 spy 追蹤
 */
class StubExporter extends BaseExporterTemplate {
  protected escape(value: string): string {
    return `[${value}]`;
  }

  protected renderDirOpen(escapedName: string, sizeKB: number, indentLevel: number): string {
    return `${"  ".repeat(indentLevel)}DIR_OPEN:${escapedName}:${sizeKB}`;
  }

  protected renderDirClose(indentLevel: number): string {
    return `${"  ".repeat(indentLevel)}DIR_CLOSE`;
  }

  protected renderLeaf(type: string, escapedAttrs: Record<string, string>, indentLevel: number): string {
    return `${"  ".repeat(indentLevel)}LEAF:${type}:${escapedAttrs.name}`;
  }

  /** 測試用：暴露 _indentLevel */
  getIndentLevel(): number {
    return this._indentLevel;
  }
}

describe("BaseExporterTemplate（骨架演算法驗證）", () => {
  it("visitDirectory 結束後 _indentLevel 回到原始值 0", () => {
    const stub = new StubExporter();
    const root = new Directory("root");
    root.accept(stub);
    expect(stub.getIndentLevel()).toBe(0);
  });

  it("多層嵌套後 _indentLevel 仍能正確還原", () => {
    const stub = new StubExporter();
    const root = new Directory("root");
    const sub = new Directory("sub");
    sub.addChild(new TextFile("note.txt", 5, DATE, "UTF-8"));
    root.addChild(sub);
    root.accept(stub);
    expect(stub.getIndentLevel()).toBe(0);
  });

  it("單層目錄：renderDirOpen 在 renderDirClose 之前，中間夾子節點", () => {
    const stub = new StubExporter();
    const root = new Directory("root");
    root.addChild(new TextFile("a.txt", 1, DATE, "UTF-8"));
    root.accept(stub);

    const result = stub.getResult();
    const lines = result.split("\n");
    const openIdx = lines.findIndex((l) => l.trimStart().startsWith("DIR_OPEN"));
    const leafIdx = lines.findIndex((l) => l.trimStart().startsWith("LEAF"));
    const closeIdx = lines.findIndex((l) => l.trimStart().startsWith("DIR_CLOSE"));

    expect(openIdx).toBeLessThan(leafIdx);
    expect(leafIdx).toBeLessThan(closeIdx);
  });

  it("子節點的 renderLeaf 縮排比父目錄多 2 個空格", () => {
    const stub = new StubExporter();
    const root = new Directory("root");
    root.addChild(new TextFile("file.txt", 1, DATE, "UTF-8"));
    root.accept(stub);

    const result = stub.getResult();
    const lines = result.split("\n");
    const openLine = lines.find((l) => l.includes("DIR_OPEN"));
    const leafLine = lines.find((l) => l.includes("LEAF"));

    expect(openLine).toBeDefined();
    expect(leafLine).toBeDefined();
    // root 在層級 0 → renderDirOpen 無前置空白；Leaf 在層級 1 → 2 空格
    expect(openLine!.startsWith("DIR_OPEN")).toBe(true);
    expect(leafLine!.startsWith("  LEAF")).toBe(true);
  });

  it("escape() 在 visitDirectory 中被呼叫，包裹目錄名稱", () => {
    const stub = new StubExporter();
    const escapeSpy = vi.spyOn(stub as unknown as { escape: (v: string) => string }, "escape");
    const root = new Directory("my-dir");
    root.accept(stub);
    expect(escapeSpy).toHaveBeenCalledWith("my-dir");
  });

  it("escape() 在 visitTextFile 中被呼叫，包裹 fileName 與 encoding", () => {
    const stub = new StubExporter();
    const escapeSpy = vi.spyOn(stub as unknown as { escape: (v: string) => string }, "escape");
    const root = new Directory("root");
    root.addChild(new TextFile("notes.txt", 5, DATE, "UTF-8"));
    root.accept(stub);

    const calls = escapeSpy.mock.calls.map((c) => c[0]);
    expect(calls).toContain("notes.txt");
    expect(calls).toContain("UTF-8");
  });

  it("escape() 在 visitWordDocument 中被呼叫，包裹 fileName", () => {
    const stub = new StubExporter();
    const escapeSpy = vi.spyOn(stub as unknown as { escape: (v: string) => string }, "escape");
    const root = new Directory("root");
    root.addChild(new WordDocument("report.docx", 80, DATE, 5));
    root.accept(stub);
    expect(escapeSpy).toHaveBeenCalledWith("report.docx");
  });

  it("escape() 在 visitImageFile 中被呼叫，包裹 fileName", () => {
    const stub = new StubExporter();
    const escapeSpy = vi.spyOn(stub as unknown as { escape: (v: string) => string }, "escape");
    const root = new Directory("root");
    root.addChild(new ImageFile("photo.png", 300, DATE, 1920, 1080));
    root.accept(stub);
    expect(escapeSpy).toHaveBeenCalledWith("photo.png");
  });

  it("getResult() 在 getHeader() 有值時，表頭出現在第一行", () => {
    class HeaderStub extends StubExporter {
      protected override getHeader(): string {
        return "HEADER";
      }
    }
    const stub = new HeaderStub();
    const root = new Directory("root");
    root.accept(stub);
    expect(stub.getResult().startsWith("HEADER\n")).toBe(true);
  });

  it("getResult() 在 getHeader() 為空時，不插入空白前綴行", () => {
    const stub = new StubExporter();
    const root = new Directory("root");
    root.accept(stub);
    const result = stub.getResult();
    expect(result.startsWith("DIR_OPEN")).toBe(true);
  });
});
