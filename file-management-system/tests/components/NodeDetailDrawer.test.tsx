import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NodeDetailDrawer } from "../../src/components/NodeDetailDrawer";
import { Directory } from "../../src/domain/Directory";
import { TextFile } from "../../src/domain/TextFile";

const DATE = new Date("2026-01-01");

describe("NodeDetailDrawer", () => {
  it("renders nothing when isOpen is false", () => {
    const dir = new Directory("root");
    const { container } = render(
      <NodeDetailDrawer isOpen={false} node={dir} nodeLabels={[]} onClose={vi.fn()} />,
    );
    // The drawer should be hidden (translateX(100%))
    const drawer = container.querySelector("[data-testid='node-detail-drawer']");
    expect(drawer).toBeInTheDocument();
    expect(drawer).toHaveStyle({ transform: "translateX(100%)" });
  });

  it("shows drawer content when isOpen is true", () => {
    const file = new TextFile("notes.txt", 10, DATE, "UTF-8");
    render(
      <NodeDetailDrawer isOpen={true} node={file} nodeLabels={[]} onClose={vi.fn()} />,
    );
    expect(screen.getByText("notes.txt")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const handler = vi.fn();
    const file = new TextFile("notes.txt", 10, DATE, "UTF-8");
    render(
      <NodeDetailDrawer isOpen={true} node={file} nodeLabels={[]} onClose={handler} />,
    );
    fireEvent.click(screen.getByLabelText("關閉詳情面板"));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("calls onClose when overlay is clicked", () => {
    const handler = vi.fn();
    const file = new TextFile("notes.txt", 10, DATE, "UTF-8");
    const { container } = render(
      <NodeDetailDrawer isOpen={true} node={file} nodeLabels={[]} onClose={handler} />,
    );
    const overlay = container.querySelector("[data-testid='drawer-overlay']");
    if (overlay) fireEvent.click(overlay);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("shows 'no node selected' message when node is null", () => {
    render(
      <NodeDetailDrawer isOpen={true} node={null} nodeLabels={[]} onClose={vi.fn()} />,
    );
    expect(screen.getByText(/尚未選取/)).toBeInTheDocument();
  });
});
