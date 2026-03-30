import { describe, it, expect } from "vitest";
import { ProgressEventAdapter } from "../../../src/services/adapters/ProgressEventAdapter";
import type { ProgressEvent } from "../../../src/domain/observer/ProgressEvent";

const ts = new Date("2026-01-01T00:00:00Z");

function makeEvent(overrides: Partial<ProgressEvent> = {}): ProgressEvent {
  return {
    phase: "export",
    operationName: "JSONExporter",
    current: 5,
    total: 10,
    percentage: 50,
    message: "處理 file.json",
    timestamp: ts,
    ...overrides,
  };
}

describe("ProgressEventAdapter", () => {
  it("基本映射：所有欄位正確傳遞", () => {
    const event = makeEvent();
    const props = ProgressEventAdapter.adapt(event);

    expect(props.operationName).toBe("JSONExporter");
    expect(props.percentage).toBe(50);
    expect(props.current).toBe(5);
    expect(props.total).toBe(10);
    expect(props.message).toBe("處理 file.json");
    expect(props.phase).toBe("export");
  });

  it("percentage=50 → isDone: false", () => {
    const props = ProgressEventAdapter.adapt(makeEvent({ percentage: 50 }));
    expect(props.isDone).toBe(false);
  });

  it("percentage=100 → isDone: true", () => {
    const props = ProgressEventAdapter.adapt(makeEvent({ percentage: 100 }));
    expect(props.isDone).toBe(true);
  });

  it("percentage=0 → isDone: false", () => {
    const props = ProgressEventAdapter.adapt(makeEvent({ percentage: 0 }));
    expect(props.isDone).toBe(false);
  });

  it("phase='scan' 正確映射", () => {
    const props = ProgressEventAdapter.adapt(makeEvent({ phase: "scan" }));
    expect(props.phase).toBe("scan");
  });

  it("不包含 ProgressEvent 的 timestamp 欄位（非 DashboardPanelProps 欄位）", () => {
    const props = ProgressEventAdapter.adapt(makeEvent());
    // DashboardPanelProps 不含 timestamp
    expect("timestamp" in props).toBe(false);
  });
});
