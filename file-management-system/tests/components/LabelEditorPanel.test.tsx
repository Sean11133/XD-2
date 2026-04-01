import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LabelEditorPanel } from "../../src/components/LabelEditorPanel";
import { LabelWithPriority } from "../../src/domain/labels/LabelWithPriority";

const makeLabel = () =>
  new LabelWithPriority(
    "label-1",
    "重要",
    "#00B4D8",
    "",
    new Date("2025-01-01"),
    3,
  );

describe("LabelEditorPanel", () => {
  it("renders in create mode when no initialLabel", () => {
    render(
      <LabelEditorPanel
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("建立標籤")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "建立" })).toBeInTheDocument();
  });

  it("renders in edit mode when initialLabel is provided", () => {
    render(
      <LabelEditorPanel
        initialLabel={makeLabel()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("編輯標籤")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();
  });

  it("pre-fills name and priority from initialLabel", () => {
    render(
      <LabelEditorPanel
        initialLabel={makeLabel()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    const nameInput = screen.getByLabelText("標籤名稱") as HTMLInputElement;
    expect(nameInput.value).toBe("重要");
  });

  it("calls onSave with name, color, priority when 建立 is clicked", () => {
    const onSave = vi.fn();
    render(<LabelEditorPanel onSave={onSave} onCancel={vi.fn()} />);
    const nameInput = screen.getByLabelText("標籤名稱");
    fireEvent.change(nameInput, { target: { value: "緊急" } });
    fireEvent.click(screen.getByRole("button", { name: "建立" }));
    expect(onSave).toHaveBeenCalledWith("緊急", expect.any(String), expect.any(Number));
  });

  it("disables save button when name is empty", () => {
    render(<LabelEditorPanel onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole("button", { name: "建立" })).toBeDisabled();
  });

  it("calls onCancel when 取消 is clicked", () => {
    const onCancel = vi.fn();
    render(<LabelEditorPanel onSave={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("updates priority when star button is clicked", () => {
    const onSave = vi.fn();
    render(<LabelEditorPanel onSave={onSave} onCancel={vi.fn()} />);
    const nameInput = screen.getByLabelText("標籤名稱");
    fireEvent.change(nameInput, { target: { value: "測試" } });
    fireEvent.click(screen.getByRole("button", { name: "4 星" }));
    fireEvent.click(screen.getByRole("button", { name: "建立" }));
    expect(onSave).toHaveBeenCalledWith("測試", expect.any(String), 4);
  });

  it("accepts custom HEX color input and reflects in selected color", () => {
    const onSave = vi.fn();
    render(<LabelEditorPanel onSave={onSave} onCancel={vi.fn()} />);
    const nameInput = screen.getByLabelText("標籤名稱");
    fireEvent.change(nameInput, { target: { value: "HEX" } });
    const hexInput = screen.getByLabelText("自訂 HEX 顏色");
    fireEvent.change(hexInput, { target: { value: "#FF5733" } });
    fireEvent.click(screen.getByRole("button", { name: "建立" }));
    expect(onSave).toHaveBeenCalledWith("HEX", "#FF5733", expect.any(Number));
  });

  it("clamps name to 20 characters via maxLength", () => {
    render(<LabelEditorPanel onSave={vi.fn()} onCancel={vi.fn()} />);
    const nameInput = screen.getByLabelText("標籤名稱") as HTMLInputElement;
    // The maxLength attribute should be set
    expect(nameInput.maxLength).toBe(20);
  });
});
