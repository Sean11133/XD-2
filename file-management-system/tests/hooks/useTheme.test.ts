import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme, type Theme } from "../../src/hooks/useTheme";

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should default to ocean when no localStorage value", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("ocean");
  });

  it("should restore theme from localStorage", () => {
    localStorage.setItem("cfm-theme", "light");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });

  it("should fallback to ocean when localStorage has invalid value", () => {
    localStorage.setItem("cfm-theme", "system"); // old value, now invalid
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("ocean");
  });

  it("should set data-theme attribute on documentElement", () => {
    const { result } = renderHook(() => useTheme());
    expect(document.documentElement.getAttribute("data-theme")).toBe("ocean");

    act(() => result.current.setTheme("light"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    act(() => result.current.setTheme("dark"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("should persist theme to localStorage on setTheme", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme("dark"));
    expect(localStorage.getItem("cfm-theme")).toBe("dark");
  });

  it("isDark should be true for dark and ocean themes", () => {
    const { result } = renderHook(() => useTheme());

    act(() => result.current.setTheme("ocean"));
    expect(result.current.isDark).toBe(true);

    act(() => result.current.setTheme("dark"));
    expect(result.current.isDark).toBe(true);

    act(() => result.current.setTheme("light"));
    expect(result.current.isDark).toBe(false);
  });

  it("should switch between all three themes", () => {
    const { result } = renderHook(() => useTheme());
    const themes: Theme[] = ["light", "dark", "ocean"];
    for (const t of themes) {
      act(() => result.current.setTheme(t));
      expect(result.current.theme).toBe(t);
    }
  });
});
