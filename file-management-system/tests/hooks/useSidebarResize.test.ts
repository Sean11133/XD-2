import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSidebarResize } from "../../src/hooks/useSidebarResize";

describe("useSidebarResize", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return default width when no localStorage value", () => {
    const { result } = renderHook(() => useSidebarResize(288));
    expect(result.current.width).toBe(288);
  });

  it("should restore width from localStorage", () => {
    localStorage.setItem("cfm-sidebar-width", "320");
    const { result } = renderHook(() => useSidebarResize(288));
    expect(result.current.width).toBe(320);
  });

  it("should clamp width at minimum 200", () => {
    localStorage.setItem("cfm-sidebar-width", "100"); // too small
    const { result } = renderHook(() => useSidebarResize(288));
    expect(result.current.width).toBe(200);
  });

  it("should clamp width at maximum 400", () => {
    localStorage.setItem("cfm-sidebar-width", "999"); // too large
    const { result } = renderHook(() => useSidebarResize(288));
    expect(result.current.width).toBe(400);
  });

  it("should ignore invalid localStorage values", () => {
    localStorage.setItem("cfm-sidebar-width", "not-a-number");
    const { result } = renderHook(() => useSidebarResize(288));
    expect(result.current.width).toBe(288);
  });

  it("should update width and persist to localStorage on drag", () => {
    const { result } = renderHook(() => useSidebarResize(288));

    // Simulate mousedown at x=100
    act(() => {
      const mockEvent = {
        clientX: 100,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent;
      result.current.handleMouseDown(mockEvent);
    });

    // Simulate mousemove to x=150 (delta +50 → 288+50=338)
    act(() => {
      const moveEvent = new MouseEvent("mousemove", { clientX: 150 });
      document.dispatchEvent(moveEvent);
    });
    expect(result.current.width).toBe(338);

    // Simulate mouseup to finalize
    act(() => {
      const upEvent = new MouseEvent("mouseup", { clientX: 150 });
      document.dispatchEvent(upEvent);
    });
    expect(localStorage.getItem("cfm-sidebar-width")).toBe("338");
  });
});
