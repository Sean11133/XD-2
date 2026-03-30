import { describe, it, expect } from "vitest";
import { WarningDecorator } from "../../../src/services/decorators/WarningDecorator";
import type { LogEntry } from "../../../src/domain/observer/LogEntry";

const ts = new Date("2026-01-01T00:00:00Z");

function makeEntry(message: string): LogEntry {
  return { level: "INFO", message, timestamp: ts };
}

describe("WarningDecorator", () => {
  const dec = new WarningDecorator();

  it("訊息包含「警告」→ icon=⚠️，styleHints=['color-yellow']", () => {
    const result = dec.decorate(makeEntry("發現權限警告"));
    expect(result.icon).toBe("⚠️");
    expect(result.styleHints).toEqual(["color-yellow"]);
  });

  it("訊息包含「失敗」→ icon=⚠️，styleHints=['color-yellow']", () => {
    const result = dec.decorate(makeEntry("匯出失敗，請重試"));
    expect(result.icon).toBe("⚠️");
    expect(result.styleHints).toEqual(["color-yellow"]);
  });

  it("訊息不含觸發關鍵字 → 無 icon，styleHints 為空陣列", () => {
    const result = dec.decorate(makeEntry("正在掃描節點"));
    expect(result.icon).toBeUndefined();
    expect(result.styleHints).toEqual([]);
  });

  it("不修改原始 LogEntry 的其他欄位（不可變性）", () => {
    const entry = makeEntry("發生警告");
    const result = dec.decorate(entry);
    expect(result.level).toBe(entry.level);
    expect(result.message).toBe(entry.message);
    expect(result.timestamp).toBe(entry.timestamp);
  });
});
