import { describe, it, expect, vi } from "vitest";
import { ConsoleObserver } from "../../../src/services/observers/ConsoleObserver";
import type { ProgressEvent } from "../../../src/domain/observer/ProgressEvent";
import type { LogEntry } from "../../../src/domain/observer/LogEntry";

const makeEvent = (
  percentage: number,
  operationName = "TestOp",
  total = 10,
  message = "處理中",
): ProgressEvent => ({
  phase: "export",
  operationName,
  current: percentage === 0 ? 0 : percentage,
  total,
  percentage,
  message,
  timestamp: new Date("2026-01-01T12:00:00Z"),
});

describe("ConsoleObserver", () => {
  it("percentage=0 → INFO，message 包含操作名稱與節點總數", () => {
    const captured: LogEntry[] = [];
    const obs = new ConsoleObserver((e) => captured.push(e));
    obs.onProgress(makeEvent(0, "JSONExporter", 10));

    expect(captured).toHaveLength(1);
    expect(captured[0].level).toBe("INFO");
    expect(captured[0].message).toContain("JSONExporter");
    expect(captured[0].message).toContain("開始");
    expect(captured[0].message).toContain("10");
  });

  it("percentage=100 → SUCCESS，message 包含完成", () => {
    const captured: LogEntry[] = [];
    const obs = new ConsoleObserver((e) => captured.push(e));
    obs.onProgress(makeEvent(100, "JSONExporter"));

    expect(captured[0].level).toBe("SUCCESS");
    expect(captured[0].message).toContain("完成");
  });

  it("percentage 中間值 → INFO，message 含百分比", () => {
    const captured: LogEntry[] = [];
    const obs = new ConsoleObserver((e) => captured.push(e));
    obs.onProgress(makeEvent(50));

    expect(captured[0].level).toBe("INFO");
    expect(captured[0].message).toContain("50%");
  });

  it("callback 呼叫次數等於 onProgress 呼叫次數", () => {
    const cb = vi.fn();
    const obs = new ConsoleObserver(cb);
    obs.onProgress(makeEvent(0));
    obs.onProgress(makeEvent(50));
    obs.onProgress(makeEvent(100));
    expect(cb).toHaveBeenCalledTimes(3);
  });

  it("timestamp 直接從 event 傳入 LogEntry", () => {
    const captured: LogEntry[] = [];
    const obs = new ConsoleObserver((e) => captured.push(e));
    const ts = new Date("2026-03-15T10:00:00Z");
    obs.onProgress({ ...makeEvent(30), timestamp: ts });
    expect(captured[0].timestamp).toBe(ts);
  });
});
