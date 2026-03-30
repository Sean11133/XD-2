import { describe, it, expect } from "vitest";
import { StartDecorator } from "../../../src/services/decorators/StartDecorator";
import type { LogEntry } from "../../../src/domain/observer/LogEntry";

const ts = new Date("2026-01-01T00:00:00Z");

function makeEntry(message: string): LogEntry {
  return { level: "INFO", message, timestamp: ts };
}

describe("StartDecorator", () => {
  const dec = new StartDecorator();

  it("訊息包含「開始」→ icon=▶，styleHints=['color-gray','italic']", () => {
    const result = dec.decorate(makeEntry("JSONExporter 開始，共 10 個節點"));
    expect(result.icon).toBe("▶");
    expect(result.styleHints).toEqual(["color-gray", "italic"]);
  });

  it("訊息不含觸發關鍵字 → 無 icon，styleHints 為空陣列", () => {
    const result = dec.decorate(makeEntry("掃描 readme.txt"));
    expect(result.icon).toBeUndefined();
    expect(result.styleHints).toEqual([]);
  });

  it("不修改原始 LogEntry 的其他欄位（不可變性）", () => {
    const entry = makeEntry("匯出開始");
    const result = dec.decorate(entry);
    expect(result.level).toBe(entry.level);
    expect(result.message).toBe(entry.message);
    expect(result.timestamp).toBe(entry.timestamp);
  });
});
