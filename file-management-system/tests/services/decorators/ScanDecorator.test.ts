import { describe, it, expect } from "vitest";
import { ScanDecorator } from "../../../src/services/decorators/ScanDecorator";
import type { LogEntry } from "../../../src/domain/observer/LogEntry";

const ts = new Date("2026-01-01T00:00:00Z");

function makeEntry(message: string): LogEntry {
  return { level: "INFO", message, timestamp: ts };
}

describe("ScanDecorator", () => {
  const dec = new ScanDecorator();

  it("訊息包含「掃描」→ icon=🔍，styleHints=['color-blue']", () => {
    const result = dec.decorate(makeEntry("掃描 requirements.docx"));
    expect(result.icon).toBe("🔍");
    expect(result.styleHints).toEqual(["color-blue"]);
  });

  it("訊息包含「走訪」→ icon=🔍，styleHints=['color-blue']", () => {
    const result = dec.decorate(makeEntry("走訪子目錄 docs/"));
    expect(result.icon).toBe("🔍");
    expect(result.styleHints).toEqual(["color-blue"]);
  });

  it("訊息不含觸發關鍵字 → 無 icon，styleHints 為空陣列", () => {
    const result = dec.decorate(makeEntry("匯出完成"));
    expect(result.icon).toBeUndefined();
    expect(result.styleHints).toEqual([]);
  });

  it("不修改原始 LogEntry 的其他欄位（不可變性）", () => {
    const entry = makeEntry("掃描節點");
    const result = dec.decorate(entry);
    expect(result.level).toBe(entry.level);
    expect(result.message).toBe(entry.message);
    expect(result.timestamp).toBe(entry.timestamp);
  });
});
