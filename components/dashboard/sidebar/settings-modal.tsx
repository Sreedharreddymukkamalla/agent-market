"use client";

import React, { useState } from "react";
import {
  ModalRoot,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalCloseTrigger,
  Button,
  Separator,
  Accordion,
  Card,
  Chip,
} from "@heroui/react";
import { useTheme } from "next-themes";
import clsx from "clsx";

import {
  PaletteIcon,
  ShieldIcon,
  BillingIcon,
  MCPIcon,
  HelpIcon,
} from "../icons";

import { createClient } from "@/utils/supabase/client";
import { MoonFilledIcon, SunFilledIcon, LaptopIcon } from "@/components/icons";

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

type SettingTab = "connectors" | "appearance" | "privacy" | "billing" | "help";

export const SettingsModal = ({ isOpen, onOpenChange }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<SettingTab>("appearance");
  const { setTheme, theme } = useTheme();

  const handleSignOut = async () => {
    const supabase = createClient();

    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const tabs = [
    { id: "connectors", label: "Connectors", icon: <MCPIcon size={18} /> },
    { id: "appearance", label: "Appearance", icon: <PaletteIcon size={18} /> },
    {
      id: "privacy",
      label: "Privacy & Access",
      icon: <ShieldIcon size={18} />,
    },
    { id: "divider1", type: "divider" },
    { id: "billing", label: "Billing", icon: <BillingIcon size={18} /> },
    { id: "divider2", type: "divider" },
    { id: "help", label: "Help Center", icon: <HelpIcon size={18} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "appearance":
        return (
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="text-2xl font-bold text-default-900 leading-tight">
                Appearance Settings
              </h3>
              <p className="text-sm text-default-500 mt-1.5">
                Customize how Agent Market looks on your device.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 w-full">
              <Button
                className={clsx(
                  "group flex h-24 min-w-[140px] w-full flex-col items-center justify-center gap-2.5 rounded-2xl border-2 transition-all p-0 overflow-hidden border-none",
                  theme === "light"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                    : "bg-default-50 text-default-600 hover:bg-default-100 ring-1 ring-divider",
                )}
                variant="ghost"
                onPress={() => setTheme("light")}
              >
                <div
                  className={clsx(
                    "transition-transform group-hover:scale-110 duration-300",
                    theme === "light" ? "text-inherit" : "text-default-900",
                  )}
                >
                  <SunFilledIcon size={24} />
                </div>
                <span className="text-sm font-bold">Light</span>
              </Button>

              <Button
                className={clsx(
                  "group flex h-24 min-w-[140px] w-full flex-col items-center justify-center gap-2.5 rounded-2xl border-2 transition-all p-0 overflow-hidden border-none",
                  theme === "dark"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                    : "bg-default-50 text-default-600 hover:bg-default-100 ring-1 ring-divider",
                )}
                variant="ghost"
                onPress={() => setTheme("dark")}
              >
                <div
                  className={clsx(
                    "transition-transform group-hover:scale-110 duration-300",
                    theme === "dark" ? "text-inherit" : "text-default-900",
                  )}
                >
                  <MoonFilledIcon size={24} />
                </div>
                <span className="text-sm font-bold">Dark</span>
              </Button>

              <Button
                className={clsx(
                  "group flex h-24 min-w-[140px] w-full flex-col items-center justify-center gap-2.5 rounded-2xl border-2 transition-all p-0 overflow-hidden border-none",
                  theme === "system"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                    : "bg-default-50 text-default-600 hover:bg-default-100 ring-1 ring-divider",
                )}
                variant="ghost"
                onPress={() => setTheme("system")}
              >
                <div
                  className={clsx(
                    "transition-transform group-hover:scale-110 duration-300",
                    theme === "system" ? "text-inherit" : "text-default-900",
                  )}
                >
                  <LaptopIcon size={24} />
                </div>
                <span className="text-sm font-bold">System</span>
              </Button>
            </div>
          </div>
        );
      case "billing":
        return (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className="p-4 border border-default-100/50 shadow-sm"
                variant="secondary"
              >
                <Card.Header className="flex-col items-start gap-1 p-0">
                  <span className="text-[10px] font-bold text-default-400 uppercase tracking-widest">
                    PLAN
                  </span>
                  <Card.Title className="text-2xl font-bold text-default-900">
                    Pro
                  </Card.Title>
                </Card.Header>
                <Card.Footer className="pt-3 p-0">
                  <Button
                    className="text-primary font-bold p-0 h-auto hover:bg-transparent hover:underline"
                    size="sm"
                    variant="ghost"
                  >
                    Upgrade to Business
                  </Button>
                </Card.Footer>
              </Card>

              <Card
                className="p-4 border border-default-100/50 shadow-sm"
                variant="secondary"
              >
                <Card.Header className="flex-col items-start gap-1 p-0">
                  <span className="text-[10px] font-bold text-default-400 uppercase tracking-widest">
                    BILLING CYCLE
                  </span>
                  <Card.Title className="text-2xl font-bold text-default-900">
                    Monthly
                  </Card.Title>
                </Card.Header>
                <Card.Footer className="flex items-center gap-2 pt-3 p-0">
                  <Button
                    className="text-primary font-bold p-0 h-auto hover:bg-transparent hover:underline"
                    size="sm"
                    variant="ghost"
                  >
                    Switch to annual
                  </Button>
                  <Chip
                    className="bg-success-50 text-success-600 font-bold px-2 py-0 h-5 text-[9px] border border-success-100"
                    size="sm"
                  >
                    SAVE $144 / YEAR
                  </Chip>
                </Card.Footer>
              </Card>
            </div>

            <div className="flex flex-col gap-6 pt-2">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-default-900">
                  Billing details
                </h3>
                <p className="text-sm text-default-500">
                  AgentMarket integrates with Stripe for safe and secure
                  billing.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center py-2 border-b border-default-100/50">
                  <span className="text-xs font-bold text-default-400 uppercase tracking-wider">
                    Payment Method
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-default-900">
                      Mastercard •••• 2461
                    </span>
                    <span className="text-xs font-medium text-default-400">
                      Expires 02/2028
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-default-100/50">
                  <span className="text-xs font-bold text-default-400 uppercase tracking-wider">
                    Billing Contact
                  </span>
                  <span className="text-sm font-bold text-default-900">
                    tech@agentmarket.ai
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs font-bold text-default-400 uppercase tracking-wider">
                    Invoice History
                  </span>
                  <Button
                    className="text-primary font-bold p-0 h-auto hover:bg-transparent hover:underline"
                    size="sm"
                    variant="ghost"
                  >
                    View in Stripe
                  </Button>
                </div>
              </div>

              <div className="mt-2">
                <Button
                  className="w-full h-12 bg-default-100 text-[#635BFF] hover:bg-default-200 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  onPress={() =>
                    window.open("https://billing.stripe.com", "_blank")
                  }
                >
                  Manage billing in Stripe
                  <svg
                    fill="none"
                    height="14"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    width="14"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" x2="21" y1="14" y2="3" />
                  </svg>
                </Button>
              </div>

              <div className="pt-6 border-t border-default-100">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <h4 className="text-sm font-bold text-default-900">
                      Cancel subscription
                    </h4>
                    <p className="text-xs text-default-500 mt-0.5">
                      Your subscription will remain active until the end of this
                      period.
                    </p>
                  </div>
                  <Button
                    className="bg-red-500/10 text-red-500 font-bold px-5 rounded-xl hover:bg-red-500/20 transition-colors h-10"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      case "privacy":
        return (
          <div className="flex flex-col gap-8">
            <Accordion hideSeparator className="w-full">
              <Accordion.Item key="privacy">
                <Accordion.Heading>
                  <Accordion.Trigger className="py-4 hover:bg-default-50/50 -mx-2 px-2 rounded-xl transition-colors">
                    <span className="text-lg font-bold text-default-900">
                      Privacy
                    </span>
                    <Accordion.Indicator>
                      <svg
                        className="text-default-400"
                        fill="none"
                        height="20"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="20"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </Accordion.Indicator>
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body className="py-4 text-default-500 text-sm">
                    Manage your data visibility and privacy preferences.
                  </Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item key="email">
                <Accordion.Heading>
                  <Accordion.Trigger className="py-4 hover:bg-default-50/50 -mx-2 px-2 rounded-xl transition-colors">
                    <span className="text-lg font-bold text-default-900">
                      Email settings
                    </span>
                    <Accordion.Indicator>
                      <svg
                        className="text-default-400"
                        fill="none"
                        height="20"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="20"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </Accordion.Indicator>
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body className="py-4 text-default-500 text-sm">
                    Configure which emails you receive and how your address is
                    used.
                  </Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item key="account">
                <Accordion.Heading>
                  <Accordion.Trigger className="py-4 hover:bg-default-50/50 -mx-2 px-2 rounded-xl transition-colors">
                    <span className="text-lg font-bold text-default-900">
                      Account management
                    </span>
                    <Accordion.Indicator>
                      <svg
                        className="text-default-400"
                        fill="none"
                        height="20"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="20"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </Accordion.Indicator>
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body className="py-4 text-default-500 text-sm">
                    Manage your account details and security settings.
                  </Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>

            <div className="flex flex-col gap-4 pt-4 border-t border-divider">
              <div>
                <h3 className="text-xl font-bold text-default-900">Sign Out</h3>
                <p className="text-sm text-default-500 mt-2">
                  You will be logged out of your account and redirected to the
                  login page.
                </p>
              </div>
              <Button
                className="w-fit h-12 px-8 font-bold rounded-2xl transition-all"
                variant="primary"
                onPress={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        );
      default:
        const activeTabData = tabs.find((t) => t.id === activeTab);
        const label = activeTabData?.label || "Settings";

        return (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 gap-6">
            <div className="p-6 rounded-3xl bg-default-100/50 text-default-400 ring-1 ring-divider">
              {activeTabData?.icon}
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-default-900">{label}</h3>
              <p className="text-default-500 max-w-sm mx-auto leading-relaxed">
                We're currently building this section. Soon you'll be able to
                manage all your {label.toLowerCase()} settings here.
              </p>
            </div>
            <Button className="rounded-xl px-6" variant="outline">
              Notify me when ready
            </Button>
          </div>
        );
    }
  };

  return (
    <ModalRoot isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalBackdrop
        className="z-[420] bg-black/20 backdrop-blur-sm"
        variant="blur"
      >
        <ModalContainer className="z-[421] p-4" placement="center">
          <ModalDialog className="bg-background border border-divider/50 shadow-2xl rounded-[2rem] overflow-hidden flex flex-col w-full max-w-4xl h-[600px] outline-none animate-in zoom-in-95 fade-in duration-300 relative">
            {/* Close Button - Extreme Top Right */}
            <ModalCloseTrigger className="absolute top-6 right-6 z-50 text-default-400 hover:text-default-900 transition-all p-2 rounded-full hover:bg-default-100 active:scale-90">
              <svg
                fill="none"
                height="20"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="20"
              >
                <line x1="18" x2="6" y1="6" y2="18" />
                <line x1="6" x2="18" y1="6" y2="18" />
              </svg>
            </ModalCloseTrigger>

            {/* Header with Title */}
            <div className="relative p-0 h-20 flex items-center shrink-0">
              <h2 className="text-2xl font-bold text-default-900 tracking-tight px-9">
                Settings
              </h2>
            </div>

            <div className="flex flex-row flex-1 overflow-hidden">
              {/* Sidebar */}
              <div className="w-[240px] shrink-0 flex flex-col px-6 py-2 overflow-y-auto">
                <div className="flex flex-col gap-1">
                  {tabs.map((tab) => {
                    if (tab.type === "divider") {
                      return (
                        <Separator
                          key={tab.id}
                          className="my-3 opacity-50 mx-2"
                        />
                      );
                    }
                    const isActive = activeTab === tab.id;

                    return (
                      <Button
                        key={tab.id}
                        className={clsx(
                          "justify-start gap-3 h-11 px-3 rounded-xl transition-all duration-200 border-none",
                          isActive
                            ? "bg-default-100 font-semibold text-default-900"
                            : "text-default-500 hover:bg-default-50 hover:text-default-900",
                        )}
                        variant="ghost"
                        onPress={() => setActiveTab(tab.id as SettingTab)}
                      >
                        <span
                          className={clsx(
                            "shrink-0",
                            isActive ? "text-default-900" : "text-default-400",
                          )}
                        >
                          {tab.icon}
                        </span>
                        <span className="text-sm font-medium">{tab.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Content area */}
              <div className="flex-1 min-w-0 flex flex-col bg-background">
                <div className="flex-1 overflow-y-auto px-10 py-6 custom-scrollbar">
                  {renderContent()}
                </div>
              </div>
            </div>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </ModalRoot>
  );
};
