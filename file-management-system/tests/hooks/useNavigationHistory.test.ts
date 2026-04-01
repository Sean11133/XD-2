import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNavigationHistory } from "../../src/hooks/useNavigationHistory";
import { Directory } from "../../src/domain/Directory";
import { TextFile } from "../../src/domain/TextFile";

function buildTree() {
  const root = new Directory("root");
  const folderA = new Directory("folderA");
  const folderB = new Directory("folderB");
  const subFolder = new Directory("subFolder");
  const file = new TextFile("file.txt", 10, new Date("2026-01-01"), "UTF-8");
  root.addChild(folderA);
  root.addChild(folderB);
  folderA.addChild(subFolder);
  folderA.addChild(file);
  return { root, folderA, folderB, subFolder, file };
}

describe("useNavigationHistory", () => {
  let tree: ReturnType<typeof buildTree>;

  beforeEach(() => {
    tree = buildTree();
  });

  it("should start at rootNode", () => {
    const { result } = renderHook(() => useNavigationHistory(tree.root));
    expect(result.current.currentNode).toBe(tree.root);
  });

  it("should not be able to go back or forward at start", () => {
    const { result } = renderHook(() => useNavigationHistory(tree.root));
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.canGoForward).toBe(false);
  });

  it("should push a directory and update currentNode", () => {
    const { result } = renderHook(() => useNavigationHistory(tree.root));
    act(() => result.current.push(tree.folderA));
    expect(result.current.currentNode).toBe(tree.folderA);
    expect(result.current.canGoBack).toBe(true);
    expect(result.current.canGoForward).toBe(false);
  });

  it("should go back after pushing", () => {
    const { result } = renderHook(() => useNavigationHistory(tree.root));
    act(() => result.current.push(tree.folderA));
    act(() => result.current.goBack());
    expect(result.current.currentNode).toBe(tree.root);
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.canGoForward).toBe(true);
  });

  it("should go forward after going back", () => {
    const { result } = renderHook(() => useNavigationHistory(tree.root));
    act(() => result.current.push(tree.folderA));
    act(() => result.current.goBack());
    act(() => result.current.goForward());
    expect(result.current.currentNode).toBe(tree.folderA);
  });

  it("should truncate forward history when pushing new path", () => {
    const { result } = renderHook(() => useNavigationHistory(tree.root));
    act(() => result.current.push(tree.folderA));
    act(() => result.current.goBack());
    act(() => result.current.push(tree.folderB)); // new branch
    expect(result.current.currentNode).toBe(tree.folderB);
    expect(result.current.canGoForward).toBe(false); // folderA path gone
  });

  it("goBack should not go past beginning", () => {
    const { result } = renderHook(() => useNavigationHistory(tree.root));
    act(() => result.current.goBack()); // no-op
    expect(result.current.currentNode).toBe(tree.root);
  });

  it("goForward should not go past end", () => {
    const { result } = renderHook(() => useNavigationHistory(tree.root));
    act(() => result.current.push(tree.folderA));
    act(() => result.current.goForward()); // no-op
    expect(result.current.currentNode).toBe(tree.folderA);
  });

  it("breadcrumb should show [root] when at root", () => {
    const { result } = renderHook(() => useNavigationHistory(tree.root));
    expect(result.current.breadcrumb).toEqual([tree.root]);
  });

  it("breadcrumb should show [root, folderA] after pushing folderA", () => {
    const { result } = renderHook(() => useNavigationHistory(tree.root));
    act(() => result.current.push(tree.folderA));
    expect(result.current.breadcrumb).toEqual([tree.root, tree.folderA]);
  });

  it("breadcrumb should show [root, folderA, subFolder] for nested folder", () => {
    const { result } = renderHook(() => useNavigationHistory(tree.root));
    act(() => result.current.push(tree.folderA));
    act(() => result.current.push(tree.subFolder));
    expect(result.current.breadcrumb).toEqual([
      tree.root,
      tree.folderA,
      tree.subFolder,
    ]);
  });
});
