"use client";

import React, { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isMounted) {
    return (
      <div className="p-2 rounded-xl border border-border bg-card/60 text-muted-foreground">
        <span className="w-5 h-5 block" />
      </div>
    );
  }

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Chuyển đổi giao diện sáng/tối"
      className="p-2 rounded-xl border border-border bg-card/80 backdrop-blur-md text-foreground transition-all duration-300 hover:scale-105 hover:border-emerald-500/50 hover:bg-card flex items-center justify-center shadow-sm cursor-pointer"
      title={isDark ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-500" />
      )}
    </button>
  );
}
