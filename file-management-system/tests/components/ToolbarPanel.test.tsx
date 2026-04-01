import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToolbarPanel } from "../../src/components/ToolbarPanel";
import { Directory } from "../../src/domain/Directory";
import { TextFile } from "../../src/domain/TextFile";

const DATE = new Date("2026-03-20");
const selectedFile = new TextFile("report.txt", 10, DATE, "UTF-8");
const selectedDir = new Directory("docs");

const noop = () => {};
const defaultProps = {
  selectedNode: null,
  canPaste: false,
  canUndo: false,
  canRedo: false,
  onCopy: noop,
  onPaste: noop,
  onDelete: noop,
  onSort: noop,
  onUndo: noop,
  onRedo: noop,
};

describe("ToolbarPanel — 按鈕 disabled 狀態", () => {
  it("無選取節點時：複製按鈕為 disabled", () => {
    render(<ToolbarPanel {...defaultProps} />);
    expect(screen.getByText(/複製/)).toBeDisabled();
  });

  it("無選取節點時：刪除按鈕為 disabled", () => {
    render(<ToolbarPanel {...defaultProps} />);
    expect(screen.getByText(/刪除/)).toBeDisabled();
  });

  it("無選取節點時：排序選單為 disabled", () => {
    render(<ToolbarPanel {...defaultProps} />);
    expect(screen.getByRole("button", { name: /排序/ })).toBeDisabled();
  });

  it("canPaste=false 時：貼上按鈕為 disabled", () => {
    render(<ToolbarPanel {...defaultProps} canPaste={false} />);
    expect(screen.getByText(/貼上/)).toBeDisabled();
  });

  it("canUndo=false 時：復原按鈕為 disabled", () => {
    render(<ToolbarPanel {...defaultProps} canUndo={false} />);
    expect(screen.getByText(/復原/)).toBeDisabled();
  });

  it("canRedo=false 時：重做按鈕為 disabled", () => {
    render(<ToolbarPanel {...defaultProps} canRedo={false} />);
    expect(screen.getByText(/重做/)).toBeDisabled();
  });

  it("選取 Directory 時排序選單為 enabled", () => {
    render(<ToolbarPanel {...defaultProps} selectedNode={selectedDir} />);
    expect(screen.getByRole("button", { name: /排序/ })).not.toBeDisabled();
  });

  it("選取 File 時排序選單依然 disabled（只有 Directory 可排序）", () => {
    render(<ToolbarPanel {...defaultProps} selectedNode={selectedFile} />);
    expect(screen.getByRole("button", { name: /排序/ })).toBeDisabled();
  });
});

describe("ToolbarPanel — callback 觸發", () => {
  it("點擊「複製」（已啟用）→ onCopy 被呼叫", () => {
    const onCopy = vi.fn();
    render(
      <ToolbarPanel
        {...defaultProps}
        selectedNode={selectedFile}
        onCopy={onCopy}
      />,
    );
    fireEvent.click(screen.getByText(/複製/));
    expect(onCopy).toHaveBeenCalledOnce();
  });

  it("點擊「復原」（已啟用）→ onUndo 被呼叫", () => {
    const onUndo = vi.fn();
    render(
      <ToolbarPanel {...defaultProps} canUndo={true} onUndo={onUndo} />,
    );
    fireEvent.click(screen.getByText(/復原/));
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it("排序下拉選擇「名稱 A → Z」→ onSort 被呼叫", () => {
    const onSort = vi.fn();
    render(
      <ToolbarPanel
        {...defaultProps}
        selectedNode={selectedDir}
        onSort={onSort}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /排序/ }));
    fireEvent.click(screen.getByText("名稱 A → Z"));
    expect(onSort).toHaveBeenCalledOnce();
  });
});
