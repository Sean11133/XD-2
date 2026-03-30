import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LogPanel } from "../../src/components/LogPanel";
import type { LogEntry } from "../../src/domain/observer";
import type { DecoratedLogEntry } from "../../src/domain/observer/DecoratedLogEntry";

const makeLog = (
  level: LogEntry["level"],
  message: string,
): LogEntry => ({
  level,
  message,
  timestamp: new Date("2026-01-01T10:00:00Z"),
});

function makeDecoratedLog(
  message: string,
  overrides: Partial<Pick<DecoratedLogEntry, "icon" | "styleHints">> = {},
): DecoratedLogEntry {
  return {
    level: "INFO",
    message,
    timestamp: new Date("2026-01-01T10:00:00Z"),
    styleHints: [],
    ...overrides,
  };
}

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

describe("LogPanel — DecoratedLogEntry 支援", () => {
  it("DecoratedLogEntry with icon → 顯示圖標", () => {
    const entry = makeDecoratedLog("完成操作", {
      icon: "✅",
      styleHints: ["color-green", "bold"],
    });
    render(<LogPanel logs={[entry]} onClear={vi.fn()} />);
    expect(screen.getByText("✅")).toBeTruthy();
  });

  it("DecoratedLogEntry with styleHints=['color-green','bold'] → 對應 CSS class 存在", () => {
    const entry = makeDecoratedLog("完成", {
      icon: "✅",
      styleHints: ["color-green", "bold"],
    });
    const { container } = render(<LogPanel logs={[entry]} onClear={vi.fn()} />);
    const row = container.querySelector(".text-emerald-600.font-bold");
    expect(row).not.toBeNull();
  });

  it("DecoratedLogEntry with styleHints=['color-yellow'] → amber class 存在", () => {
    const entry = makeDecoratedLog("警告", {
      icon: "⚠️",
      styleHints: ["color-yellow"],
    });
    const { container } = render(<LogPanel logs={[entry]} onClear={vi.fn()} />);
    const row = container.querySelector(".text-amber-500");
    expect(row).not.toBeNull();
  });

  it("DecoratedLogEntry with styleHints=['color-blue'] → blue class 存在", () => {
    const entry = makeDecoratedLog("掃描", {
      icon: "🔍",
      styleHints: ["color-blue"],
    });
    const { container } = render(<LogPanel logs={[entry]} onClear={vi.fn()} />);
    const row = container.querySelector(".text-blue-600");
    expect(row).not.toBeNull();
  });

  it("DecoratedLogEntry with styleHints=['color-gray','italic'] → gray+italic class 存在", () => {
    const entry = makeDecoratedLog("開始", {
      icon: "▶",
      styleHints: ["color-gray", "italic"],
    });
    const { container } = render(<LogPanel logs={[entry]} onClear={vi.fn()} />);
    const row = container.querySelector(".text-slate-400.italic");
    expect(row).not.toBeNull();
  });

  it("DecoratedLogEntry with empty styleHints → 使用 LEVEL_CLASS fallback（INFO→text-gray-600）", () => {
    const entry = makeDecoratedLog("一般訊息", { styleHints: [] });
    render(<LogPanel logs={[entry]} onClear={vi.fn()} />);
    const row = screen.getByText("一般訊息").closest("div");
    expect(row?.className).toContain("text-gray-600");
  });

  it("混合 LogEntry 與 DecoratedLogEntry → 均正常渲染", () => {
    const plain = makeLog("SUCCESS", "普通成功訊息");
    const decorated = makeDecoratedLog("完成操作", {
      icon: "✅",
      styleHints: ["color-green", "bold"],
    });
    render(<LogPanel logs={[plain, decorated]} onClear={vi.fn()} />);
    expect(screen.getByText("普通成功訊息")).toBeTruthy();
    expect(screen.getByText("完成操作")).toBeTruthy();
    expect(screen.getByText("✅")).toBeTruthy();
  });
});
