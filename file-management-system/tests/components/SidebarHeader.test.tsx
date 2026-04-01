import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SidebarHeader } from "../../src/components/SidebarHeader";

describe("SidebarHeader", () => {
  it("renders three action buttons", () => {
    render(
      <SidebarHeader
        onAddFolder={vi.fn()}
        onAddFile={vi.fn()}
        onCollapseAll={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/新增資料夾/)).toBeInTheDocument();
    expect(screen.getByLabelText(/新增檔案/)).toBeInTheDocument();
    expect(screen.getByLabelText(/全部收合/)).toBeInTheDocument();
  });

  it("calls onAddFolder when add-folder button is clicked", () => {
    const handler = vi.fn();
    render(
      <SidebarHeader onAddFolder={handler} onAddFile={vi.fn()} onCollapseAll={vi.fn()} />,
    );
    fireEvent.click(screen.getByLabelText(/新增資料夾/));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("calls onAddFile when add-file button is clicked", () => {
    const handler = vi.fn();
    render(
      <SidebarHeader onAddFolder={vi.fn()} onAddFile={handler} onCollapseAll={vi.fn()} />,
    );
    fireEvent.click(screen.getByLabelText(/新增檔案/));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("calls onCollapseAll when collapse button is clicked", () => {
    const handler = vi.fn();
    render(
      <SidebarHeader onAddFolder={vi.fn()} onAddFile={vi.fn()} onCollapseAll={handler} />,
    );
    fireEvent.click(screen.getByLabelText(/全部收合/));
    expect(handler).toHaveBeenCalledOnce();
  });
});
