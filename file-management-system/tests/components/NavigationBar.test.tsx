import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NavigationBar } from "../../src/components/NavigationBar";
import { Directory } from "../../src/domain/Directory";
import type { NavigationHistoryResult } from "../../src/hooks/useNavigationHistory";

function makeHistory(overrides: Partial<NavigationHistoryResult> = {}): NavigationHistoryResult {
  const root = new Directory("root");
  const docs = new Directory("docs");
  return {
    currentNode: docs,
    canGoBack: false,
    canGoForward: false,
    breadcrumb: [root, docs],
    push: vi.fn(),
    goBack: vi.fn(),
    goForward: vi.fn(),
    ...overrides,
  };
}

describe("NavigationBar", () => {
  it("renders breadcrumb labels from history", () => {
    render(<NavigationBar history={makeHistory()} onNavigate={vi.fn()} />);
    expect(screen.getByText("root")).toBeInTheDocument();
    expect(screen.getByText("docs")).toBeInTheDocument();
  });

  it("back button calls goBack when clicked", () => {
    const goBack = vi.fn();
    render(
      <NavigationBar history={makeHistory({ canGoBack: true, goBack })} onNavigate={vi.fn()} />,
    );
    fireEvent.click(screen.getByLabelText("上一步"));
    expect(goBack).toHaveBeenCalledOnce();
  });

  it("back button is disabled when canGoBack is false", () => {
    render(<NavigationBar history={makeHistory({ canGoBack: false })} onNavigate={vi.fn()} />);
    expect(screen.getByLabelText("上一步")).toBeDisabled();
  });

  it("forward button is disabled when canGoForward is false", () => {
    render(<NavigationBar history={makeHistory({ canGoForward: false })} onNavigate={vi.fn()} />);
    expect(screen.getByLabelText("下一步")).toBeDisabled();
  });
});
