import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

function getSystemDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveIsDark(theme: Theme): boolean {
  if (theme === "system") return getSystemDark();
  return theme === "dark";
}

const STORAGE_KEY = "cfm-theme";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return saved ?? "system";
  });

  const isDark = resolveIsDark(theme);

  useEffect(() => {
    const root = document.documentElement;
    const apply = (dark: boolean) => {
      root.setAttribute("data-theme", dark ? "dark" : "light");
    };
    apply(resolveIsDark(theme));

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    }
  }, [theme]);

  const setTheme = (t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
  };

  return { theme, isDark, setTheme };
}
