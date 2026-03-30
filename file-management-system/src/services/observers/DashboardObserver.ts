import type { IProgressObserver } from "../../domain/observer/IProgressObserver";
import type { ProgressEvent } from "../../domain/observer/ProgressEvent";

/**
 * Observer Pattern — Dashboard 接收端（SRP：專注於更新 UI 進度條狀態）
 *
 * 透過 constructor 注入的 _onUpdate callback 與 React state 互動（DIP），
 * 自身不持有任何 React API，可在非瀏覽器環境中獨立使用。
 *
 * 轉換規則：
 *   percentage < 100  → isDone: false
 *   percentage === 100 → isDone: true
 */
export class DashboardObserver implements IProgressObserver {
  constructor(
    private readonly _onUpdate: (percentage: number, isDone: boolean) => void,
  ) {}

  onProgress(event: ProgressEvent): void {
    this._onUpdate(event.percentage, event.percentage === 100);
  }
}
