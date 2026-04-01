import React from "react";
import clsx from "clsx";

interface Props {
  title: string;
  children?: React.ReactNode;
  /** Icon-only rail: hide section title. */
  hideLabel?: boolean;
}

export const SidebarMenu = ({ title, children, hideLabel }: Props) => {
  return (
    <div
      className={clsx(
        "flex flex-col gap-0.5",
        hideLabel ? "mt-1 first:mt-0" : "mt-4 first:mt-2",
      )}
    >
      {!hideLabel && (
        <span className="px-2.5 py-1 text-xs font-medium text-default-500">
          {title}
        </span>
      )}
      <div
        className={clsx(
          "flex flex-col gap-0.5",
          hideLabel && "w-full items-stretch",
        )}
      >
        {children}
      </div>
    </div>
  );
};
