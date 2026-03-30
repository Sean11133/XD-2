import type { IProgressObserver } from "./IProgressObserver";
import type { ProgressEvent } from "./ProgressEvent";

/**
 * Observer Pattern — 發佈端介面（Port）
 *
 * 任何希望發佈進度事件的類別均須實作此介面。
 * subscribe / unsubscribe / notify 三個方法構成完整的 Subject 合約。
 */
export interface IProgressSubject {
  subscribe(observer: IProgressObserver): void;
  unsubscribe(observer: IProgressObserver): void;
  notify(event: ProgressEvent): void;
}
