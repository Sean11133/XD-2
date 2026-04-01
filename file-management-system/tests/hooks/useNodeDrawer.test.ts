import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNodeDrawer } from "../../src/hooks/useNodeDrawer";
import { TextFile } from "../../src/domain/TextFile";
import { Directory } from "../../src/domain/Directory";

describe("useNodeDrawer", () => {
  it("should be closed with null node initially", () => {
    const { result } = renderHook(() => useNodeDrawer());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.node).toBeNull();
  });

  it("should open with the provided node", () => {
    const { result } = renderHook(() => useNodeDrawer());
    const file = new TextFile("test.txt", 10, new Date("2026-01-01"), "UTF-8");
    act(() => result.current.open(file));
    expect(result.current.isOpen).toBe(true);
    expect(result.current.node).toBe(file);
  });

  it("should close but retain last node", () => {
    const { result } = renderHook(() => useNodeDrawer());
    const file = new TextFile("test.txt", 10, new Date("2026-01-01"), "UTF-8");
    act(() => result.current.open(file));
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
    // node retained for animation (drawer can transition out with content visible)
    expect(result.current.node).toBe(file);
  });

  it("should replace node when opened with different node", () => {
    const { result } = renderHook(() => useNodeDrawer());
    const file1 = new TextFile("file1.txt", 5, new Date("2026-01-01"), "UTF-8");
    const file2 = new TextFile(
      "file2.txt",
      15,
      new Date("2026-01-01"),
      "UTF-8",
    );
    act(() => result.current.open(file1));
    act(() => result.current.open(file2));
    expect(result.current.node).toBe(file2);
    expect(result.current.isOpen).toBe(true);
  });

  it("should work with Directory nodes too", () => {
    const { result } = renderHook(() => useNodeDrawer());
    const dir = new Directory("myFolder");
    act(() => result.current.open(dir));
    expect(result.current.node).toBe(dir);
  });
});
