"use client";

import { useTheme } from "next-themes";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { Icons } from "./icons";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  const handleThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    posthog.capture("theme_toggled", {
      from_theme: theme,
      to_theme: newTheme,
    });
  };

  return (
    <Button onClick={handleThemeToggle} size="icon" variant="ghost">
      <div className="relative h-[16px] w-[16px]">
        <div className="dark:-rotate-90 rotate-0 scale-100 transition-all dark:scale-0">
          <Icons.sun />
        </div>
        <div className="absolute top-0 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100">
          <Icons.moon />
        </div>
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
