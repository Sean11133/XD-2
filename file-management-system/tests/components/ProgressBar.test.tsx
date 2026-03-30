import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ProgressBar } from "../../src/components/ProgressBar";

describe("ProgressBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("percentage=0, isDone=false → 不渲染", () => {
    const { container } = render(
      <ProgressBar percentage={0} isDone={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("percentage=50, isDone=false → 顯示，寬度 50%", () => {
    render(
      <ProgressBar percentage={50} isDone={false} operationName="匯出 JSON" />,
    );
    const bar = document.querySelector(".bg-blue-500") as HTMLElement;
    expect(bar).not.toBeNull();
    expect(bar.style.width).toBe("50%");
  });

  it("isDone=true → 顯示綠色 bar", () => {
    render(<ProgressBar percentage={100} isDone={true} />);
    const bar = document.querySelector(".bg-green-500");
    expect(bar).not.toBeNull();
  });

  it("isDone=true → 2s 後自動隱藏", async () => {
    const { container } = render(
      <ProgressBar percentage={100} isDone={true} />,
    );
    // 0s: 顯示
    expect(container.firstChild).not.toBeNull();
    // 2s: 消失
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(container.firstChild).toBeNull();
  });

  it("operationName 顯示於 label", () => {
    render(
      <ProgressBar
        percentage={30}
        isDone={false}
        operationName="正在匯出 XML..."
      />,
    );
    expect(screen.getByText(/正在匯出 XML/)).toBeTruthy();
  });
});
