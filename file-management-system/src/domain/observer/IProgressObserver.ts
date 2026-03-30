import type { ProgressEvent } from "./ProgressEvent";

/**
 * Observer Pattern — 接收端介面（Port）
 *
 * 任何希望接收進度通知的類別均須實作此介面。
 * Subject 只依賴此介面，不依賴具體 Observer（DIP）。
 * 新增 Observer 只需新增類別，不修改 Subject 或其他 Observer（OCP）。
 */
export interface IProgressObserver {
  onProgress(event: ProgressEvent): void;
}
