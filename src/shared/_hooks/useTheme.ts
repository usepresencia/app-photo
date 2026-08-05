"use client";

import { useTheme as useNextTheme } from "next-themes";

export function useTheme() {
  const { resolvedTheme, setTheme } = useNextTheme();
  const theme = resolvedTheme === "light" ? "light" : "dark";
  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");
  return { theme, toggle };
}
