import NextLink from "next/link";
import React from "react";
import clsx from "clsx";

import { useSidebarContext } from "../layout-context";

interface Props {
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  href?: string;
  /** In collapsed rail MCP flyout, show icon + title as a full row */
  forceShowLabel?: boolean;
  /** e.g. close rail flyout after navigation */
  onActivate?: () => void;
}

export const SidebarItem = ({
  icon,
  title,
  isActive,
  href = "",
  forceShowLabel = false,
  onActivate,
}: Props) => {
  const { closeSidebar, sidebarOpen, isMdUp } = useSidebarContext();
  const compact = isMdUp && !sidebarOpen;
  const railIconOnly = compact && !forceShowLabel;

  const handleClick = () => {
    if (!isMdUp) {
      closeSidebar();
    }
    onActivate?.();
  };

  return (
    <NextLink
      className={clsx(
        "text-default-900 no-underline active:bg-none",
        railIconOnly
          ? "flex w-full justify-center px-0.5"
          : "max-w-full w-full",
      )}
      href={href}
      title={railIconOnly ? title : undefined}
      onClick={handleClick}
    >
      <div
        className={clsx(
          "relative",
          isActive
            ? "bg-[var(--sidebar-item-active)] text-[var(--sidebar-fg-active)]"
            : "text-default-600 hover:bg-[var(--sidebar-item-hover)]",
          railIconOnly
            ? "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-colors duration-150"
            : "flex min-h-9 w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-1.5 transition-colors duration-150",
        )}
      >
        {!railIconOnly && isActive ? (
          <span
            aria-hidden
            className="absolute right-[-0.55rem] top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--accent)]"
          />
        ) : null}
        <span
          className={clsx(
            "flex shrink-0 items-center justify-center [&_svg]:size-4",
            isActive
              ? "text-[var(--sidebar-fg-active)]"
              : "text-default-500 [&_path]:opacity-95",
          )}
        >
          {icon}
        </span>
        {!railIconOnly && (
          <span
            className={clsx(
              isActive ? "text-[var(--sidebar-fg-active)]" : "text-default-900",
              "font-medium text-sm",
            )}
          >
            {title}
          </span>
        )}
      </div>
    </NextLink>
  );
};
