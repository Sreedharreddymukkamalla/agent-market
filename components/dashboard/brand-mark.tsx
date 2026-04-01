import React from "react";

/** Shared logo glyph (AgentMarket mark). */
export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="var(--logo-mark-fg)" />
      <path
        d="M2 17L12 22L22 17"
        stroke="var(--logo-mark-fg)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 12L12 17L22 12"
        stroke="var(--logo-mark-fg)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
