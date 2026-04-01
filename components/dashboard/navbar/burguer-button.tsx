import React from "react";
import { useSidebarContext } from "../layout-context";
import {
  StyledSidebarRailToggle,
  StyledSidebarToggle,
} from "./navbar.styles";

/** Rounded frame + left rail divider (ChatGPT / common sidebar toggle). */
function SidebarPanelGlyph({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="9.5"
        y1="7"
        x2="9.5"
        y2="17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

type Variant = "navbar" | "rail";

interface BurguerButtonProps {
  variant?: Variant;
}

/** ChatGPT-style sidebar toggle: `navbar` when rail hidden, `rail` inside sidebar header. */
export const BurguerButton = ({ variant = "navbar" }: BurguerButtonProps) => {
  const { sidebarOpen, toggleSidebar } = useSidebarContext();
  const rail = variant === "rail";

  return (
    <button
      type="button"
      className={
        rail ? StyledSidebarRailToggle() : StyledSidebarToggle({ active: false })
      }
      onClick={toggleSidebar}
      aria-label={rail ? "Close sidebar" : "Open sidebar"}
      aria-expanded={sidebarOpen}
    >
      <SidebarPanelGlyph className="text-current" />
    </button>
  );
};
