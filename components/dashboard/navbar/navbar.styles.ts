import { tv } from "@heroui/react";

/** Rounded control like ChatGPT’s sidebar toggle. */
export const StyledSidebarToggle = tv({
  base: "flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-divider bg-[var(--surface-secondary)] text-default-900 outline-none transition-[background-color,transform] duration-150 ease-out hover:bg-default focus-visible:ring-2 focus-visible:ring-focus active:scale-[0.97]",
  variants: {
    active: {
      true: "border-divider bg-default",
    },
  },
});

/** Inside sidebar rail: minimal hover (ChatGPT header close control). */
export const StyledSidebarRailToggle = tv({
  base: "flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-default-700 outline-none transition-colors duration-150 hover:bg-[var(--sidebar-item-hover)] focus-visible:ring-2 focus-visible:ring-focus",
});
