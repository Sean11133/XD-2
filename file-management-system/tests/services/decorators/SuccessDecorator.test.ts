import { describe, it, expect } from "vitest";
import { SuccessDecorator } from "../../../src/services/decorators/SuccessDecorator";
import type { LogEntry } from "../../../src/domain/observer/LogEntry";

const ts = new Date("2026-01-01T00:00:00Z");

function makeEntry(message: string): LogEntry {
  return { level: "INFO", message, timestamp: ts };
}

describe("SuccessDecorator", () => {
  const dec = new SuccessDecorator();

  it("訊息包含「完成」→ icon=✅，styleHints=['color-green','bold']", () => {
    const result = dec.decorate(makeEntry("JSONExporter 完成 ✓"));
    expect(result.icon).toBe("✅");
    expect(result.styleHints).toEqual(["color-green", "bold"]);
  });

  it("訊息不含觸發關鍵字 → 無 icon，styleHints 為空陣列", () => {
    const result = dec.decorate(makeEntry("正在掃描節點"));
    expect(result.icon).toBeUndefined();
    expect(result.styleHints).toEqual([]);
  });

  it("不修改原始 LogEntry 的其他欄位（不可變性）", () => {
    const entry = makeEntry("匯出完成");
    const result = dec.decorate(entry);
    expect(result.level).toBe(entry.level);
    expect(result.message).toBe(entry.message);
    expect(result.timestamp).toBe(entry.timestamp);
  });

  it("「完成」在訊息中間也能命中", () => {
    const result = dec.decorate(makeEntry("操作完成，共處理 10 個節點"));
    expect(result.icon).toBe("✅");
  });
});
