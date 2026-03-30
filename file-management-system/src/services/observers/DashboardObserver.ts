import type { IProgressObserver } from "../../domain/observer/IProgressObserver";
import type { ProgressEvent } from "../../domain/observer/ProgressEvent";
import type { DashboardPanelProps } from "../../domain/observer/DashboardPanelProps";
import { ProgressEventAdapter } from "../adapters/ProgressEventAdapter";

/**
 * Observer Pattern — Dashboard 接收端（SRP：專注於更新 UI 進度條狀態）
 *
 * 透過 constructor 注入的 _onUpdate callback 與 React state 互動（DIP），
 * 自身不持有任何 React API，可在非瀏覽器環境中獨立使用。
 *
 * 使用 ProgressEventAdapter 將完整 ProgressEvent 轉換為 DashboardPanelProps，
 * App.tsx 無需手動解構 ProgressEvent（SRP，ADR-002）。
 */
export class DashboardObserver implements IProgressObserver {
  constructor(
    private readonly _onUpdate: (props: DashboardPanelProps) => void,
  ) {}

  onProgress(event: ProgressEvent): void {
    this._onUpdate(ProgressEventAdapter.adapt(event));
  }
}
