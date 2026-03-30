import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardPanel } from "../../src/components/DashboardPanel";
import type { DashboardPanelProps } from "../../src/domain/observer/DashboardPanelProps";

function makeProps(overrides: Partial<DashboardPanelProps> = {}): DashboardPanelProps {
  return {
    operationName: "JSONExporter",
    percentage: 50,
    current: 7,
    total: 14,
    message: "掃描 requirements.docx",
    isDone: false,
    phase: "export",
    ...overrides,
  };
}

describe("DashboardPanel", () => {
  it("percentage=0, isDone=false → 仍渲染（預設展開）", () => {
    render(<DashboardPanel {...makeProps({ percentage: 0, isDone: false })} />);
    expect(screen.getByTestId("dashboard-panel")).toBeInTheDocument();
  });

  it("percentage=50, isDone=false → 顯示面板", () => {
    render(<DashboardPanel {...makeProps()} />);
    expect(screen.getByTestId("dashboard-panel")).toBeInTheDocument();
  });

  it("顯示 operationName", () => {
    render(<DashboardPanel {...makeProps()} />);
    expect(screen.getByText("JSONExporter")).toBeInTheDocument();
  });

  it("顯示 current / total 計數", () => {
    render(<DashboardPanel {...makeProps({ current: 7, total: 14 })} />);
    expect(screen.getByText("7 / 14")).toBeInTheDocument();
  });

  it("顯示 message", () => {
    render(<DashboardPanel {...makeProps()} />);
    expect(screen.getByText(/掃描 requirements\.docx/)).toBeInTheDocument();
  });

  it("phase='scan' → 顯示掃描 phase badge", () => {
    render(<DashboardPanel {...makeProps({ phase: "scan" })} />);
    expect(screen.getByText("掃描")).toBeInTheDocument();
  });

  it("phase='export' → 顯示匯出 phase badge", () => {
    render(<DashboardPanel {...makeProps({ phase: "export" })} />);
    expect(screen.getByText("匯出")).toBeInTheDocument();
  });

  it("isDone=true → 顯示完成訊息", () => {
    render(
      <DashboardPanel {...makeProps({ percentage: 100, isDone: true })} />,
    );
    expect(screen.getByText(/操作完成/)).toBeInTheDocument();
  });

  it("isDone=true → 面板持續顯示（不自動隱藏）", () => {
    render(
      <DashboardPanel {...makeProps({ percentage: 100, isDone: true })} />,
    );
    expect(screen.getByTestId("dashboard-panel")).toBeInTheDocument();
  });
});
