"use client";

import { Dropdown } from "@heroui/react";
import React from "react";

import { NotificationsIcon } from "../icons";

export const NotificationsDropdown = () => {
  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label="Notifications"
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-foreground/75 outline-none transition-colors hover:bg-[var(--sidebar-item-hover)] hover:text-foreground dark:hover:bg-white/10 data-[pressed]:opacity-90"
      >
        <NotificationsIcon className="shrink-0" size={22} />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu aria-label="Notifications" className="w-80">
          <Dropdown.Item key="1" className="py-2">
            <div className="flex flex-col gap-1">
              <p className="font-medium text-sm">📣 Task Completed</p>
              <p className="text-xs text-default-500">
                Your recent agent 'Data Miner' completed its task successfully.
              </p>
            </div>
          </Dropdown.Item>
          <Dropdown.Item key="2" className="py-2">
            <div className="flex flex-col gap-1">
              <p className="font-medium text-sm">🚀 Platform Update</p>
              <p className="text-xs text-default-500">
                AgentMarket v2.0 is now live with enhanced analytics tools.
              </p>
            </div>
          </Dropdown.Item>
          <Dropdown.Item key="3" className="py-2">
            <div className="flex flex-col gap-1">
              <p className="font-medium text-sm">💳 Billing Success</p>
              <p className="text-xs text-default-500">
                Your monthly subscription was renewed successfully.
              </p>
            </div>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
};
