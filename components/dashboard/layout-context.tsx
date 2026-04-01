"use client";

import { createContext, useContext } from "react";

interface SidebarContext {
  /** Desktop: expanded sidebar with labels. Mobile: drawer open. */
  sidebarOpen: boolean;
  /** Viewport is md breakpoint or wider (sidebar rail vs drawer). */
  isMdUp: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

export const SidebarContext = createContext<SidebarContext>({
  sidebarOpen: true,
  isMdUp: true,
  toggleSidebar: () => {},
  closeSidebar: () => {},
});

export const useSidebarContext = () => {
  return useContext(SidebarContext);
};
