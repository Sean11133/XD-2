import type { FileSystemNode } from "./FileSystemNode";

/**
 * Clipboard — Singleton Pattern
 * 全應用程式共用唯一剪貼簿，供 CopyCommand 寫入、PasteCommand 讀取。
 * 放在 Domain 層確保命令邏輯無需感知 Domain 外部依賴。
 */
export class Clipboard {
  private static _instance: Clipboard | null = null;
  private _node: FileSystemNode | null = null;

  private constructor() {}

  static getInstance(): Clipboard {
    if (!Clipboard._instance) {
      Clipboard._instance = new Clipboard();
    }
    return Clipboard._instance;
  }

  setNode(node: FileSystemNode): void {
    this._node = node;
  }

  getNode(): FileSystemNode | null {
    return this._node;
  }

  hasNode(): boolean {
    return this._node !== null;
  }

  clear(): void {
    this._node = null;
  }

  /** 僅供測試使用：重置 Singleton 實例（確保測試隔離） */
  static _resetForTest(): void {
    Clipboard._instance = null;
  }
}
