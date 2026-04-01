"use client";

import { FC, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import clsx from "clsx";

import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";

export interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = resolvedTheme === "light";

  const handleToggle = () => {
    setTheme(isLight ? "dark" : "light");
  };

  return (
    <button
      type="button"
      aria-label={
        mounted
          ? `Switch to ${isLight ? "dark" : "light"} mode`
          : "Toggle color theme"
      }
      className={clsx(
        "inline-flex cursor-pointer items-center justify-center rounded-lg px-px",
        "bg-transparent text-foreground/75 transition-colors hover:text-foreground",
        "min-h-10 min-w-10",
        className,
      )}
      onClick={handleToggle}
    >
      {mounted ? (
        isLight ? (
          <SunFilledIcon size={22} />
        ) : (
          <MoonFilledIcon size={22} />
        )
      ) : (
        <span className="block h-[22px] w-[22px] shrink-0" aria-hidden />
      )}
    </button>
  );
};
