import { useEffect, useState } from "react";

/** 支援三主題：light / dark / ocean（預設）。已移除 "system" 主題。 */
export type Theme = "light" | "dark" | "ocean";

const STORAGE_KEY = "cfm-theme";

const VALID_THEMES = new Set<Theme>(["light", "dark", "ocean"]);

function isValidTheme(value: string | null): value is Theme {
  return value !== null && VALID_THEMES.has(value as Theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isValidTheme(saved) ? saved : "ocean"; // ocean 為預設主題
  });

  // isDark 向後相容（部分元件依賴此值判斷樣式）
  const isDark = theme === "dark" || theme === "ocean";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = (t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
  };

  return { theme, isDark, setTheme };
}
