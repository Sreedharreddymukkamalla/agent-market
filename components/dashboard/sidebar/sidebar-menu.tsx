import React from "react";
import clsx from "clsx";

interface Props {
  /** Section heading (omit when using hideLabel). */
  title?: string;
  children?: React.ReactNode;
  /** Hide section title (e.g. no "Explore" label). */
  hideLabel?: boolean;
}

export const SidebarMenu = ({ title, children, hideLabel }: Props) => {
  return (
    <div
      className={clsx(
        "flex w-full flex-col gap-1",
        !hideLabel && "mt-4 first:mt-2",
      )}
    >
      {!hideLabel && title ? (
        <span className="px-2.5 py-1 text-xs font-medium text-default-500">
          {title}
        </span>
      ) : null}
      <div
        className={clsx(
          "flex flex-col gap-1",
          hideLabel && "w-full items-stretch",
        )}
      >
        {children}
      </div>
    </div>
  );
};
