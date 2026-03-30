import { describe, it, expect, vi } from "vitest";
import { ProgressSubjectImpl } from "../../../src/services/observers/ProgressSubjectImpl";
import type { IProgressObserver } from "../../../src/domain/observer/IProgressObserver";
import type { ProgressEvent } from "../../../src/domain/observer/ProgressEvent";

const makeEvent = (percentage: number): ProgressEvent => ({
  phase: "export",
  operationName: "Test",
  current: percentage,
  total: 100,
  percentage,
  message: "test",
  timestamp: new Date(),
});

describe("ProgressSubjectImpl", () => {
  it("subscribe 後 notify 會呼叫 observer", () => {
    const subject = new ProgressSubjectImpl();
    const obs: IProgressObserver = { onProgress: vi.fn() };
    subject.subscribe(obs);
    subject.notify(makeEvent(50));
    expect(obs.onProgress).toHaveBeenCalledOnce();
  });

  it("subscribe 防重複：同一 observer 只呼叫一次", () => {
    const subject = new ProgressSubjectImpl();
    const obs: IProgressObserver = { onProgress: vi.fn() };
    subject.subscribe(obs);
    subject.subscribe(obs); // 重複訂閱
    subject.notify(makeEvent(50));
    expect(obs.onProgress).toHaveBeenCalledTimes(1);
  });

  it("unsubscribe 後不再呼叫", () => {
    const subject = new ProgressSubjectImpl();
    const obs: IProgressObserver = { onProgress: vi.fn() };
    subject.subscribe(obs);
    subject.unsubscribe(obs);
    subject.notify(makeEvent(50));
    expect(obs.onProgress).not.toHaveBeenCalled();
  });

  it("unsubscribe 不存在的 observer 不拋例外", () => {
    const subject = new ProgressSubjectImpl();
    const obs: IProgressObserver = { onProgress: vi.fn() };
    expect(() => subject.unsubscribe(obs)).not.toThrow();
  });

  it("notify 依訂閱順序呼叫多個 observers", () => {
    const subject = new ProgressSubjectImpl();
    const order: number[] = [];
    const obs1: IProgressObserver = { onProgress: () => order.push(1) };
    const obs2: IProgressObserver = { onProgress: () => order.push(2) };
    subject.subscribe(obs1);
    subject.subscribe(obs2);
    subject.notify(makeEvent(10));
    expect(order).toEqual([1, 2]);
  });

  it("notify 時傳入正確的 event 物件", () => {
    const subject = new ProgressSubjectImpl();
    const obs: IProgressObserver = { onProgress: vi.fn() };
    subject.subscribe(obs);
    const event = makeEvent(75);
    subject.notify(event);
    expect(obs.onProgress).toHaveBeenCalledWith(event);
  });
});
