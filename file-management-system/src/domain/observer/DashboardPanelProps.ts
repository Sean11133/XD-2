/**
 * Adapter Pattern — Dashboard 面板 Props（Value Object / Adapter 目標介面）
 *
 * ProgressEventAdapter 將 ProgressEvent 轉換為此介面，
 * DashboardPanel 元件直接使用此型別作為 Props。
 * 定義在 Domain Layer，確保 Services/Presentation 均可引用，
 * 且 Domain 本身不依賴任何框架（Clean Architecture DIP）。
 */
export interface DashboardPanelProps {
  readonly operationName: string;
  readonly percentage: number; // 0–100
  readonly current: number;
  readonly total: number;
  readonly message: string;
  readonly isDone: boolean;
  readonly phase: "export" | "scan";
}
