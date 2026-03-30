import type { IProgressSubject } from "../../domain/observer/IProgressSubject";
import type { IProgressObserver } from "../../domain/observer/IProgressObserver";
import type { ProgressEvent } from "../../domain/observer/ProgressEvent";

/**
 * Observer Pattern — Subject 具體實作
 *
 * 管理 Observer 訂閱清單並依序通知所有訂閱者。
 * subscribe 防重複；unsubscribe 找不到時靜默（不拋例外）。
 * 不引用任何 React API（Clean Architecture DIP）。
 */
export class ProgressSubjectImpl implements IProgressSubject {
  private readonly _observers: IProgressObserver[] = [];

  subscribe(observer: IProgressObserver): void {
    if (!this._observers.includes(observer)) {
      this._observers.push(observer);
    }
  }

  unsubscribe(observer: IProgressObserver): void {
    const idx = this._observers.indexOf(observer);
    if (idx !== -1) {
      this._observers.splice(idx, 1);
    }
  }

  notify(event: ProgressEvent): void {
    for (const obs of this._observers) {
      obs.onProgress(event);
    }
  }
}
