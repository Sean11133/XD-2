import { describe, it, expect, vi } from "vitest";
import { DashboardObserver } from "../../../src/services/observers/DashboardObserver";
import type { ProgressEvent } from "../../../src/domain/observer/ProgressEvent";

const makeEvent = (percentage: number): ProgressEvent => ({
  phase: "export",
  operationName: "TestOp",
  current: percentage,
  total: 100,
  percentage,
  message: "test",
  timestamp: new Date(),
});

describe("DashboardObserver", () => {
  it("percentage < 100 → isDone: false", () => {
    const cb = vi.fn();
    const obs = new DashboardObserver(cb);
    obs.onProgress(makeEvent(0));
    expect(cb).toHaveBeenCalledWith(0, false);
  });

  it("percentage === 50 → isDone: false，正確傳入 percentage", () => {
    const cb = vi.fn();
    const obs = new DashboardObserver(cb);
    obs.onProgress(makeEvent(50));
    expect(cb).toHaveBeenCalledWith(50, false);
  });

  it("percentage === 100 → isDone: true", () => {
    const cb = vi.fn();
    const obs = new DashboardObserver(cb);
    obs.onProgress(makeEvent(100));
    expect(cb).toHaveBeenCalledWith(100, true);
  });

  it("callback 每次 onProgress 呼叫時都執行", () => {
    const cb = vi.fn();
    const obs = new DashboardObserver(cb);
    obs.onProgress(makeEvent(10));
    obs.onProgress(makeEvent(50));
    obs.onProgress(makeEvent(100));
    expect(cb).toHaveBeenCalledTimes(3);
  });
});
