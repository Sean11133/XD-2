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

  it("SUCCESS 日誌列使用 green inline style", () => {
    const logs = [makeLog("SUCCESS", "完成 ✓")];
    render(<LogPanel logs={logs} onClear={vi.fn()} />);
    const row = screen.getByText("完成 ✓").closest("div") as HTMLElement;
    const style = row?.getAttribute("style") ?? "";
    // jsdom normalises #10b981 → rgb(16, 185, 129)
    expect(style).toMatch(/10b981|rgb\(16,\s*185,\s*129\)/);
  });

  it("INFO 日誌列使用 text-secondary CSS 變數", () => {
    const logs = [makeLog("INFO", "開始處理")];
    render(<LogPanel logs={logs} onClear={vi.fn()} />);
    const row = screen.getByText("開始處理").closest("div") as HTMLElement;
    expect(row?.getAttribute("style")).toMatch(/text-secondary/);
  });

  it("WARNING 日誌列使用 yellow inline style", () => {
    const logs = [makeLog("WARNING", "警告訊息")];
    render(<LogPanel logs={logs} onClear={vi.fn()} />);
    const row = screen.getByText("警告訊息").closest("div") as HTMLElement;
    const style = row?.getAttribute("style") ?? "";
    // jsdom normalises #f59e0b → rgb(245, 158, 11)
    expect(style).toMatch(/f59e0b|rgb\(245,\s*158,\s*11\)/);
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

  it("DecoratedLogEntry with styleHints=['color-green','bold'] → row 有 green+bold inline style", () => {
    const entry = makeDecoratedLog("完成", {
      icon: "✅",
      styleHints: ["color-green", "bold"],
    });
    render(<LogPanel logs={[entry]} onClear={vi.fn()} />);
    const row = screen.getByText("完成").closest("div") as HTMLElement;
    const style = row?.getAttribute("style") ?? "";
    expect(style).toMatch(/10b981|rgb\(16,\s*185,\s*129\)/);
    expect(style).toMatch(/bold/);
  });

  it("DecoratedLogEntry with styleHints=['color-yellow'] → row 有 yellow inline style", () => {
    const entry = makeDecoratedLog("警告", {
      icon: "⚠️",
      styleHints: ["color-yellow"],
    });
    render(<LogPanel logs={[entry]} onClear={vi.fn()} />);
    const row = screen.getByText("警告").closest("div") as HTMLElement;
    const style = row?.getAttribute("style") ?? "";
    // jsdom normalises #f59e0b → rgb(245, 158, 11)
    expect(style).toMatch(/f59e0b|rgb\(245,\s*158,\s*11\)/);
  });

  it("DecoratedLogEntry with styleHints=['color-blue'] → row 有 accent CSS 變數", () => {
    const entry = makeDecoratedLog("掃描", {
      icon: "🔍",
      styleHints: ["color-blue"],
    });
    render(<LogPanel logs={[entry]} onClear={vi.fn()} />);
    const row = screen.getByText("掃描").closest("div") as HTMLElement;
    expect(row?.getAttribute("style")).toMatch(/accent/);
  });

  it("DecoratedLogEntry with styleHints=['color-gray','italic'] → row 有 text-muted+italic inline style", () => {
    const entry = makeDecoratedLog("開始", {
      icon: "▶",
      styleHints: ["color-gray", "italic"],
    });
    render(<LogPanel logs={[entry]} onClear={vi.fn()} />);
    const row = screen.getByText("開始").closest("div") as HTMLElement;
    const style = row?.getAttribute("style") ?? "";
    expect(style).toMatch(/text-muted/);
    expect(style).toMatch(/italic/);
  });

  it("DecoratedLogEntry with empty styleHints → 使用 INFO LEVEL_STYLE fallback（text-secondary）", () => {
    const entry = makeDecoratedLog("一般訊息", { styleHints: [] });
    render(<LogPanel logs={[entry]} onClear={vi.fn()} />);
    const row = screen.getByText("一般訊息").closest("div") as HTMLElement;
    expect(row?.getAttribute("style")).toMatch(/text-secondary/);
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
