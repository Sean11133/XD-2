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
    expect(cb).toHaveBeenCalledOnce();
    const props = cb.mock.calls[0][0];
    expect(props.isDone).toBe(false);
    expect(props.percentage).toBe(0);
  });

  it("percentage === 50 → isDone: false，正確傳入 percentage", () => {
    const cb = vi.fn();
    const obs = new DashboardObserver(cb);
    obs.onProgress(makeEvent(50));
    expect(cb).toHaveBeenCalledOnce();
    const props = cb.mock.calls[0][0];
    expect(props.percentage).toBe(50);
    expect(props.isDone).toBe(false);
  });

  it("percentage === 100 → isDone: true", () => {
    const cb = vi.fn();
    const obs = new DashboardObserver(cb);
    obs.onProgress(makeEvent(100));
    expect(cb).toHaveBeenCalledOnce();
    const props = cb.mock.calls[0][0];
    expect(props.isDone).toBe(true);
    expect(props.percentage).toBe(100);
  });

  it("callback 每次 onProgress 呼叫時都執行", () => {
    const cb = vi.fn();
    const obs = new DashboardObserver(cb);
    obs.onProgress(makeEvent(10));
    obs.onProgress(makeEvent(50));
    obs.onProgress(makeEvent(100));
    expect(cb).toHaveBeenCalledTimes(3);
  });

  it("回傳完整的 DashboardPanelProps（operationName、current、total、phase、message）", () => {
    const cb = vi.fn();
    const obs = new DashboardObserver(cb);
    obs.onProgress(makeEvent(50));
    const props = cb.mock.calls[0][0];
    expect(props.operationName).toBe("TestOp");
    expect(props.current).toBe(50);
    expect(props.total).toBe(100);
    expect(props.phase).toBe("export");
    expect(props.message).toBe("test");
  });
});

