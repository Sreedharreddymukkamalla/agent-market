import React from "react";
import clsx from "clsx";
import { useSidebarContext } from "../layout-context";
import {
  StyledSidebarRailToggle,
  StyledSidebarToggle,
} from "./navbar.styles";

/** Lucide-style: collapse / hide left sidebar. */
function PanelLeftCloseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
      <path d="m16 15-3-3 3-3" />
    </svg>
  );
}

/** Lucide-style: expand / show left sidebar. */
function PanelRightCloseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M15 3v18" />
      <path d="m8 9 3 3-3 3" />
    </svg>
  );
}

type Variant = "navbar" | "rail";

interface BurguerButtonProps {
  variant?: Variant;
}

/** ChatGPT-style sidebar toggle: `navbar` when rail hidden, `rail` inside sidebar header. */
export const BurguerButton = ({ variant = "navbar" }: BurguerButtonProps) => {
  const { sidebarOpen, toggleSidebar, isMdUp } = useSidebarContext();
  const rail = variant === "rail";
  const collapsedDesktopRail = rail && !sidebarOpen && isMdUp;

  return (
    <button
      type="button"
      className={clsx(
        rail ? StyledSidebarRailToggle() : StyledSidebarToggle({ active: false }),
        collapsedDesktopRail && "group",
      )}
      onClick={toggleSidebar}
      aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      aria-expanded={sidebarOpen}
    >
      {sidebarOpen ? (
        <PanelLeftCloseIcon className="size-5 shrink-0 text-current" />
      ) : collapsedDesktopRail ? (
        <span className="relative h-5 w-5 shrink-0 [&_svg]:size-5">
          <img
            src="/logo.png"
            alt=""
            className="absolute inset-0 m-auto h-5 w-5 rounded-md object-contain opacity-100 transition-opacity duration-150 group-hover/sidebar-rail:opacity-0 group-focus-visible:opacity-0"
          />
          <span
            className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover/sidebar-rail:opacity-100 group-focus-visible:opacity-100"
            aria-hidden
          >
            <PanelRightCloseIcon className="size-5 text-current" />
          </span>
        </span>
      ) : (
        <PanelRightCloseIcon className="size-5 shrink-0 text-current" />
      )}
    </button>
  );
};
