import { tv } from "@heroui/react";

/** Desktop: expanded w-64 or icon rail w-16 (enough room for 44px controls + padding). */
export const SidebarRail = tv({
  base: "relative z-[202] flex min-h-0 shrink-0 flex-col self-stretch overflow-hidden transition-[width] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] md:h-full",
  variants: {
    expanded: {
      true: "md:w-64 max-md:w-0",
      false: "md:w-16 max-md:w-0",
    },
  },
  defaultVariants: {
    expanded: true,
  },
});

export const Overlay = tv({
  base: "fixed left-0 right-0 top-16 bottom-0 z-[201] bg-[var(--scrim)] transition-opacity duration-200 ease-out md:hidden",
  variants: {
    visible: {
      true: "pointer-events-auto opacity-100",
      false: "pointer-events-none opacity-0",
    },
  },
  defaultVariants: {
    visible: false,
  },
});

export const Header = tv({
  base: "flex w-full shrink-0 gap-2 px-1 pt-0.5",
  variants: {
    rail: {
      true: "flex-col items-center justify-center pb-2 pt-1",
      false: "mb-3 flex-row items-center justify-between pb-1",
    },
  },
  defaultVariants: {
    rail: false,
  },
});

/** Middle scroll region (grid row minmax(0,1fr)); not flex-1 — parent grid assigns height. */
export const Body = tv({
  base: "flex min-h-0 flex-col justify-start gap-0.5 overflow-y-auto overflow-x-hidden overscroll-contain px-1 pt-1",
  variants: {
    rail: {
      true: "w-full items-stretch px-0 pt-1",
      false: "",
    },
  },
});

export const Footer = tv({
  base: "flex w-full shrink-0 flex-col border-t border-[var(--separator)] bg-[var(--sidebar-bg)] px-2 pb-3 pt-3",
  variants: {
    rail: {
      true: "items-center justify-center px-0.5 pb-2 pt-3",
      false: "",
    },
  },
});

export const Sidebar = Object.assign(SidebarRail, {
  Header,
  Body,
  Overlay,
  Footer,
});
