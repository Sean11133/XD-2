import { describe, it, expect } from "vitest";
import { LogEntryDecoratorChain } from "../../../src/services/decorators/LogEntryDecoratorChain";
import { SuccessDecorator } from "../../../src/services/decorators/SuccessDecorator";
import { WarningDecorator } from "../../../src/services/decorators/WarningDecorator";
import { ScanDecorator } from "../../../src/services/decorators/ScanDecorator";
import { StartDecorator } from "../../../src/services/decorators/StartDecorator";
import type { LogEntry } from "../../../src/domain/observer/LogEntry";

const ts = new Date("2026-01-01T00:00:00Z");

function makeEntry(message: string): LogEntry {
  return { level: "INFO", message, timestamp: ts };
}

const fullChain = new LogEntryDecoratorChain([
  new SuccessDecorator(),
  new WarningDecorator(),
  new ScanDecorator(),
  new StartDecorator(),
]);

describe("LogEntryDecoratorChain", () => {
  it("無任何 Decorator 命中 → icon 為 undefined，styleHints 為空陣列", () => {
    const result = fullChain.decorate(makeEntry("[50%] 處理中"));
    expect(result.icon).toBeUndefined();
    expect(result.styleHints).toEqual([]);
  });

  it("單一命中（SuccessDecorator）→ icon=✅，styleHints=['color-green','bold']", () => {
    const result = fullChain.decorate(makeEntry("匯出完成 ✓"));
    expect(result.icon).toBe("✅");
    expect(result.styleHints).toContain("color-green");
    expect(result.styleHints).toContain("bold");
  });

  it("多個命中（「開始掃描」）→ styleHints 合併，icon 以優先級高者為準", () => {
    // ScanDecorator 先於 StartDecorator，所以 icon 應為 🔍
    const result = fullChain.decorate(makeEntry("開始掃描，共 10 個節點"));
    expect(result.icon).toBe("🔍"); // ScanDecorator 在鏈中排第三，StartDecorator 排第四；但「開始」也命中
    // styleHints 應包含兩者的 hints
    expect(result.styleHints).toContain("color-blue"); // ScanDecorator
    expect(result.styleHints).toContain("color-gray"); // StartDecorator
    expect(result.styleHints).toContain("italic"); // StartDecorator
  });

  it("icon 以第一個命中者為準（SUCCESS > WARNING > SCAN > START）", () => {
    // 同時包含「完成」與「掃描」，SuccessDecorator 排在 ScanDecorator 之前
    const result = fullChain.decorate(makeEntry("掃描完成"));
    expect(result.icon).toBe("✅"); // SuccessDecorator 先命中
    expect(result.styleHints).toContain("color-green");
    expect(result.styleHints).toContain("color-blue");
  });

  it("styleHints 去重（同一 hint 不重複）", () => {
    // 若兩個 Decorator 都有 color-green，應只出現一次
    const duplicateChain = new LogEntryDecoratorChain([
      new SuccessDecorator(),
      new SuccessDecorator(), // 刻意重複
    ]);
    const result = duplicateChain.decorate(makeEntry("完成"));
    const count = result.styleHints.filter((h) => h === "color-green").length;
    expect(count).toBe(1);
  });

  it("空鏈 → 回傳 styleHints 為空陣列的 DecoratedLogEntry", () => {
    const emptyChain = new LogEntryDecoratorChain([]);
    const entry = makeEntry("任意訊息");
    const result = emptyChain.decorate(entry);
    expect(result.icon).toBeUndefined();
    expect(result.styleHints).toEqual([]);
    expect(result.message).toBe(entry.message);
  });

  it("不修改原始 LogEntry 的欄位（不可變性）", () => {
    const entry = makeEntry("完成處理");
    const result = fullChain.decorate(entry);
    expect(result.level).toBe(entry.level);
    expect(result.message).toBe(entry.message);
    expect(result.timestamp).toBe(entry.timestamp);
  });
});
