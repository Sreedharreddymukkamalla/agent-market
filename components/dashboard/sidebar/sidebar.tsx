"use client";

import React, { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { Sidebar } from "./sidebar.styles";
import { Button, Dropdown } from "@heroui/react";
import { BurguerButton } from "../navbar/burguer-button";
import {
  AgentsIcon,
  MarketplaceIcon,
  ShieldIcon,
  InspectIcon,
  MCPIcon,
  AgentAimIcon,
  SettingsIcon,
} from "../icons";
import { SidebarItem } from "./sidebar-item";
import { SidebarMenu } from "./sidebar-menu";
import { useSidebarContext } from "../layout-context";
import { usePathname, useRouter } from "next/navigation";
import NextLink from "next/link";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import { SidebarCollapse } from "./sidebar-collapse";
import { SettingsModal } from "./settings-modal";

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}



function getInitials(name: string, email: string): string {
  const n = name.trim();
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const e = email.trim();
  if (e.length >= 2) return e.slice(0, 2).toUpperCase();
  return "U";
}

export const SidebarWrapper = () => {
  const pathname = usePathname();
  const router = useRouter();  const { sidebarOpen, closeSidebar, isMdUp } = useSidebarContext();
  const isRail = isMdUp && !sidebarOpen;
  const mobileDrawerOpen = !isMdUp && sidebarOpen;
  const [user, setUser] = useState<User | null>(null);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const supabase = createClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    const load = async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      setUser(u);
    };
    void load();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router, supabase]);

  const isGuest = user?.is_anonymous;
  const meta = user?.user_metadata as Record<string, string> | undefined;
  const displayName = isGuest
    ? "Guest"
    : meta?.full_name ||
    meta?.name ||
    user?.email?.split("@")[0] ||
    "Account";
  const initials = getInitials(displayName, user?.email ?? "");
  const avatarUrl = meta?.avatar_url as string | undefined;
  const planRaw =
    (meta?.plan as string | undefined) ??
    (meta?.subscription_tier as string | undefined) ??
    (isGuest ? "Guest Access" : "Free Plan");
  const planLabel = planRaw
    ? `${planRaw.charAt(0).toUpperCase()}${planRaw.slice(1)}`
    : "Free";

  const closeMobileSidebar = () => {
    if (!isMdUp) closeSidebar();
  };

  return (
    <>
      <div
        className={Sidebar.Overlay({ visible: mobileDrawerOpen })}
        onClick={closeSidebar}
        aria-hidden={!mobileDrawerOpen}
      />
      <div
        className={clsx(
          Sidebar({ expanded: sidebarOpen }),
          isMdUp && isRail && "group/sidebar-rail",
        )}
      >
        <div
          className={clsx(
            "grid min-h-0 shrink-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-[var(--sidebar-bg)]",
            isMdUp && "border-r border-divider",
            !isMdUp &&
            "fixed left-0 top-12 z-[203] h-[calc(100dvh-3rem)] w-64 rounded-r-[2rem] border-r border-[var(--sidebar-border)] transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
            !isMdUp &&
            (sidebarOpen
              ? "translate-x-0 px-2 pb-2 pt-3"
              : "pointer-events-none -translate-x-full px-2 pb-2 pt-3"),
            isMdUp &&
            "relative z-auto h-full min-h-0 w-full max-w-full translate-x-0 px-2 pb-2 pt-3",
            isMdUp && isRail && "justify-items-stretch",
            isMdUp && !isRail && "w-64",
          )}
        >
          <div className={Sidebar.Header({ rail: isRail })}>
            {!isRail && (
              <NextLink
                href="/"
                className="flex min-w-0 flex-1 items-center gap-2 py-2 pl-1 pr-0 transition-opacity hover:opacity-80"
              >
                <img
                  src="/logo.png"
                  alt=""
                  width={28}
                  height={28}
                  className="shrink-0 rounded-md object-contain shadow-sm ring-1 ring-black/[0.06] dark:ring-white/10"
                />
                <span className="min-w-0 truncate text-[17.5px] font-bold tracking-tight text-foreground">
                  Aimploy
                </span>
              </NextLink>
            )}
            <div className="flex shrink-0 items-center justify-center pr-0.5">
              <BurguerButton variant="rail" />
            </div>
          </div>

          <div className={Sidebar.Body({ rail: isRail })}>
            <SidebarItem
              title="Agent Aim"
              icon={<AgentAimIcon />}
              isActive={pathname === "/dashboard/agent-aim"}
              href="/dashboard/agent-aim"
            />
            <SidebarMenu hideLabel>
              <SidebarItem
                isActive={pathname === "/dashboard/agents"}
                title="My Agents"
                icon={<AgentsIcon />}
                href={(!user) ? "/login" : "/dashboard/agents"}
              />
              <SidebarItem
                isActive={pathname === "/dashboard/marketplace"}
                title="Agent MarketPlace"
                icon={<MarketplaceIcon />}
                href="/dashboard/marketplace"
              />


              <SidebarCollapse
                title="MCP"
                icon={<MCPIcon />}
              >
                <SidebarItem
                  isActive={pathname === "/agent-market"}
                  title="Market"
                  icon={<MCPIcon size={18} />}
                  href={(!user) ? "/login" : "/agent-market"}
                />
                <SidebarItem
                  isActive={pathname === "/dashboard/mcp-inspection"}
                  title="Inspector"
                  icon={<InspectIcon size={18} />}
                  href={(!user) ? "/login" : "/dashboard/mcp-inspection"}
                />
                <SidebarItem
                  isActive={pathname === "/dashboard/mcp-scanner"}
                  title="Scanner"
                  icon={<ShieldIcon size={18} />}
                  href={(!user) ? "/login" : "/dashboard/mcp-scanner"}
                />
              </SidebarCollapse>
            </SidebarMenu>
          </div>

          <div className={Sidebar.Footer({ rail: isRail })}>
            {user ? (
              <div className={clsx(
                "w-full flex items-center gap-1",
                !isRail && "rounded-2xl border border-[var(--border)]/60 bg-[var(--sidebar-profile-chip)] p-1.5 shadow-[0_1px_4px_oklch(0%_0_0_/0.05)] dark:border-white/[0.08]"
              )}>
                <Dropdown>
                  <Dropdown.Trigger
                    aria-label="Account menu"
                    className={clsx(
                      "flex-1 flex items-center transition-all outline-none",
                      isRail
                        ? "size-10 shrink-0 justify-center rounded-full border-0 bg-transparent p-0 hover:bg-[var(--sidebar-item-hover)]"
                        : "min-w-0 cursor-pointer gap-3 rounded-xl p-1.5 hover:bg-default-100/50 text-left",
                    )}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className={clsx(
                          "shrink-0 rounded-full object-cover",
                          isRail ? "size-9" : "size-9 shadow-sm"
                        )}
                      />
                    ) : (
                      <div
                        className={clsx(
                          "flex shrink-0 items-center justify-center rounded-full bg-[var(--sidebar-user-avatar-bg)] font-semibold text-[var(--sidebar-user-avatar-fg)]",
                          isRail ? "size-9 text-xs" : "size-9 text-[12px]",
                        )}
                      >
                        {initials}
                      </div>
                    )}
                    {!isRail && (
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-bold leading-tight text-default-900">
                          {displayName}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] leading-tight text-default-500 font-medium tracking-tight">
                          {planLabel}
                        </p>
                      </div>
                    )}
                  </Dropdown.Trigger>
                <Dropdown.Popover
                  placement="top start"
                  offset={8}
                  className="rounded-2xl border border-divider bg-overlay p-0 shadow-[var(--overlay-shadow)]"
                >
                  <Dropdown.Menu
                    aria-label="Account"
                    className="min-w-[160px] gap-0 rounded-2xl p-1.5"
                  >
                    <Dropdown.Item
                      key="logout"
                      className="cursor-pointer rounded-xl py-2.5 pl-2 pr-3 text-danger data-[hovered=true]:bg-danger/10"
                      onPress={handleLogout}
                    >
                      <span className="flex items-center gap-3">
                        <LogOutIcon className="shrink-0 text-danger" />
                        <span className="text-sm font-medium">Sign out</span>
                      </span>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
              
              {!isRail && (
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-9 w-9 min-w-0 rounded-xl hover:bg-default-200/50 text-default-400 hover:text-default-900 transition-all border-none"
                  onPress={() => setIsSettingsModalOpen(true)}
                >
                  <SettingsIcon size={18} />
                </Button>
              )}
              </div>
            ) : (
              <div className={clsx("flex w-full gap-2", isRail && "flex-col items-center")}>
                <Button
                  variant="ghost"
                  size={isRail ? "sm" : "md"}
                  className={clsx(
                    "flex-1 font-semibold",
                    isRail ? "size-10 min-w-0 p-0" : "px-4"
                  )}
                  onPress={() => {
                    router.push("/login");
                    closeMobileSidebar();
                  }}
                >
                  {isRail ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3" /></svg>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                <Button
                  className={clsx(
                    "flex-1 bg-primary text-primary-foreground font-bold shadow-md hover:shadow-lg transition-all",
                    isRail ? "size-10 min-w-0 p-0" : "px-4"
                  )}
                  size={isRail ? "sm" : "md"}
                  isPending={isGuestLoading}
                  onPress={async () => {
                    setIsGuestLoading(true);
                    try {
                      const { error } = await supabase.auth.signInAnonymously();
                      if (error) {
                        alert(error.message);
                        return;
                      }
                      window.location.href = "/dashboard/agent-aim?aimFresh=1";
                    } catch (e: any) {
                      alert(e?.message || "Guest login failed");
                    } finally {
                      setIsGuestLoading(false);
                    }
                  }}
                >
                  {isRail ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  ) : (
                    "Guest"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
        <SettingsModal 
          isOpen={isSettingsModalOpen} 
          onOpenChange={setIsSettingsModalOpen} 
        />
      </div>
    </>
  );
};
