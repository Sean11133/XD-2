import type { ProgressEvent } from "../../domain/observer/ProgressEvent";
import type { DashboardPanelProps } from "../../domain/observer/DashboardPanelProps";

/**
 * Adapter Pattern — 將 ProgressEvent 轉換為 DashboardPanelProps（ADR-002）
 *
 * 靜態工具類，無狀態，直接呼叫 adapt() 即可使用。
 * DashboardObserver 透過此 Adapter 取得完整的 DashboardPanelProps，
 * App.tsx 無需手動解構 ProgressEvent（SRP）。
 */
export class ProgressEventAdapter {
  static adapt(event: ProgressEvent): DashboardPanelProps {
    return {
      operationName: event.operationName,
      percentage: event.percentage,
      current: event.current,
      total: event.total,
      message: event.message,
      isDone: event.percentage === 100,
      phase: event.phase,
    };
  }
}
