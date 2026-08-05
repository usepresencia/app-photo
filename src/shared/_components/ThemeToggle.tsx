"use client";

import { useTheme } from "@/shared/_hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      className="font-condensed border border-gold/40 px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.3em] text-foreground transition-colors hover:border-gold hover:text-gold"
    >
      {theme === "dark" ? "Claro" : "Escuro"}
    </button>
  );
}
