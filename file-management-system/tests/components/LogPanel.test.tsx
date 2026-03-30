import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LogPanel } from "../../src/components/LogPanel";
import type { LogEntry } from "../../src/domain/observer";

const makeLog = (
  level: LogEntry["level"],
  message: string,
): LogEntry => ({
  level,
  message,
  timestamp: new Date("2026-01-01T10:00:00Z"),
});

describe("LogPanel", () => {
  it("logs 為空時顯示「暫無日誌」提示", () => {
    render(<LogPanel logs={[]} onClear={vi.fn()} />);
    expect(screen.getByText("暫無日誌")).toBeTruthy();
  });

  it("渲染日誌列表的文字內容", () => {
    const logs = [makeLog("INFO", "匯出開始"), makeLog("SUCCESS", "匯出完成")];
    render(<LogPanel logs={logs} onClear={vi.fn()} />);
    expect(screen.getByText("匯出開始")).toBeTruthy();
    expect(screen.getByText("匯出完成")).toBeTruthy();
  });

  it("SUCCESS 日誌包含 text-green-600 className", () => {
    const logs = [makeLog("SUCCESS", "完成 ✓")];
    render(<LogPanel logs={logs} onClear={vi.fn()} />);
    const row = screen.getByText("完成 ✓").closest("div");
    expect(row?.className).toContain("text-green-600");
  });

  it("INFO 日誌包含 text-gray-600 className", () => {
    const logs = [makeLog("INFO", "開始處理")];
    render(<LogPanel logs={logs} onClear={vi.fn()} />);
    const row = screen.getByText("開始處理").closest("div");
    expect(row?.className).toContain("text-gray-600");
  });

  it("WARNING 日誌包含 text-yellow-600 className", () => {
    const logs = [makeLog("WARNING", "警告訊息")];
    render(<LogPanel logs={logs} onClear={vi.fn()} />);
    const row = screen.getByText("警告訊息").closest("div");
    expect(row?.className).toContain("text-yellow-600");
  });

  it("點擊清除日誌按鈕觸發 onClear callback", () => {
    const onClear = vi.fn();
    render(<LogPanel logs={[]} onClear={onClear} />);
    fireEvent.click(screen.getByText("清除日誌"));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("超過 maxLogs 時截斷顯示最新的 maxLogs 筆", () => {
    const logs = Array.from({ length: 10 }, (_, i) =>
      makeLog("INFO", `訊息 ${i}`),
    );
    render(<LogPanel logs={logs} onClear={vi.fn()} maxLogs={5} />);
    // 顯示最新 5 筆（訊息 5–9）
    expect(screen.queryByText("訊息 0")).toBeNull();
    expect(screen.getByText("訊息 9")).toBeTruthy();
  });
});
