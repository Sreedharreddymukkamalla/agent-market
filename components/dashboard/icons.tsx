import React from "react";

interface IconProps {
  size?: number;
  className?: string;
  fill?: string;
}

export const HomeIcon = ({
  size = 24,
  className,
  fill = "currentColor",
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill={fill}
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 13H10C10.55 13 11 12.55 11 12V4C11 3.45 10.55 3 10 3H4C3.45 3 3 3.45 3 4V12C3 12.55 3.45 13 4 13ZM4 21H10C10.55 21 11 20.55 11 20V16C11 15.45 10.55 15 10 15H4C3.45 15 3 15.45 3 16V20C3 20.55 3.45 21 4 21ZM14 21H20C20.55 21 21 20.55 21 20V12C21 11.45 20.55 11 20 11H14C13.45 11 13 11.45 13 12V20C13 20.55 13.45 21 14 21ZM13 4V8C13 8.55 13.45 9 14 9H20C20.55 9 21 8.55 21 8V4C21 3.45 20.55 3 20 3H14C13.45 3 13 3.45 13 4Z"
    />
  </svg>
);

export const AgentsIcon = ({
  size = 24,
  className,
  fill = "currentColor",
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill={fill}
      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
    />
  </svg>
);

export const MarketplaceIcon = ({
  size = 24,
  className,
  fill = "currentColor",
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill={fill}
      d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"
    />
  </svg>
);

export const BillingIcon = ({
  size = 24,
  className,
  fill = "currentColor",
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill={fill}
      d="M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5z"
    />
    <circle fill={fill} cx="16" cy="12" r="1.5" />
  </svg>
);

export const SettingsIcon = ({
  size = 24,
  className,
  fill = "currentColor",
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill={fill}
      d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L3.81 10.2c-.12.2.06.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
    />
  </svg>
);

export const SearchIcon = ({
  size = 24,
  fill = "currentColor",
  className,
  ...props
}: IconProps & any) => (
  <svg
    fill="none"
    height={size}
    viewBox="0 0 24 24"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    <path
      d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
      stroke={fill}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M22 22L20 20"
      stroke={fill}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

export const NotificationsIcon = ({
  size = 24,
  className,
  fill = "currentColor",
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill={fill}
      d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
    />
  </svg>
);

export const ShieldIcon = ({
  size = 24,
  className,
  fill = "currentColor",
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill={fill}
      d="M12 2l7 4v6c0 5-3.58 9.74-7 10-3.42-.26-7-5-7-10V6l7-4z"
    />
    <path
      fill="currentColor"
      d="M10.5 12.5l1.5 1.5 3-3"
      opacity="0.2"
    />
  </svg>
);

export const InspectIcon = ({
  size = 24,
  className,
  fill = "currentColor",
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g
      stroke={fill}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M4 20c1.6-2 4.2-3 6-3s4.4 1 6 3" />
      <circle cx="17" cy="17" r="3.2" />
      <path d="M19 19l3 3" />
    </g>
  </svg>
);

export const AgentAimIcon = ({
  size = 24,
  className,
  fill = "currentColor",
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill={fill} />
    <path
      d="M2 17L12 22L22 17"
      stroke={fill}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12L12 17L22 12"
      stroke={fill}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const MCPIcon = ({
  size = 24,
  className,
  fill = "currentColor",
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g
      stroke={fill}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="10" height="6" rx="1.5" />
      <path d="M17 15v-2a2 2 0 00-2-2h-1" />
      <circle cx="19" cy="18" r="1.6" />
    </g>
  </svg>
);
export const UserIcon = ({
  size = 24,
  className,
  fill = "currentColor",
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill={fill}
      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
    />
  </svg>
);

export const RobotIcon = ({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Antenna base */}
    <rect x="11.25" y="1" width="1.5" height="3" rx="0.5" fill="currentColor" opacity="0.8" />
    {/* Antenna ball */}
    <circle cx="12" cy="1" r="1" fill="currentColor" />

    {/* Head */}
    <rect x="4" y="4" width="16" height="10" rx="2.5" fill="currentColor" opacity="0.15" />
    <rect x="4" y="4" width="16" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.2" />

    {/* Visor / eye bar */}
    <rect x="6" y="6.5" width="12" height="4.5" rx="1.2" fill="currentColor" opacity="0.15" />

    {/* Left eye */}
    <circle cx="9" cy="8.75" r="1.5" fill="currentColor" opacity="0.9" />
    <circle cx="9.5" cy="8.25" r="0.4" fill="currentColor" opacity="0.3" />

    {/* Right eye */}
    <circle cx="15" cy="8.75" r="1.5" fill="currentColor" opacity="0.9" />
    <circle cx="15.5" cy="8.25" r="0.4" fill="currentColor" opacity="0.3" />

    {/* Mouth dots */}
    <circle cx="10" cy="12.5" r="0.6" fill="currentColor" opacity="0.7" />
    <circle cx="12" cy="12.5" r="0.6" fill="currentColor" opacity="0.7" />
    <circle cx="14" cy="12.5" r="0.6" fill="currentColor" opacity="0.7" />

    {/* Neck */}
    <rect x="10.5" y="14" width="3" height="1.5" rx="0.5" fill="currentColor" opacity="0.6" />

    {/* Body */}
    <rect x="3" y="15.5" width="18" height="7" rx="2" fill="currentColor" opacity="0.15" />
    <rect x="3" y="15.5" width="18" height="7" rx="2" stroke="currentColor" strokeWidth="1.2" />

    {/* Chest panel */}
    <rect x="8" y="17" width="8" height="4" rx="1" fill="currentColor" opacity="0.2" />

    {/* Chest LEDs */}
    <circle cx="10" cy="19" r="0.8" fill="currentColor" opacity="0.9" />
    <circle cx="12" cy="19" r="0.8" fill="currentColor" opacity="0.5" />
    <circle cx="14" cy="19" r="0.8" fill="currentColor" opacity="0.9" />

    {/* Left arm bump */}
    <rect x="1" y="16" width="2.5" height="5" rx="1.2" fill="currentColor" opacity="0.6" />
    {/* Right arm bump */}
    <rect x="20.5" y="16" width="2.5" height="5" rx="1.2" fill="currentColor" opacity="0.6" />
  </svg>
);  

export const PaletteIcon = ({
  size = 24,
  className,
  fill = "currentColor",
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill={fill}
      d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
    />
  </svg>
);

export const ChartIcon = ({
  size = 24,
  className,
  fill = "currentColor",
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill={fill}
      d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
    />
  </svg>
);

export const BeakerIcon = ({
  size = 24,
  className,
  fill = "currentColor",
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill={fill}
      d="M19 19c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V7L3 3h18l-2 4v12zm-2-9l-1 2h-1l-1-2h-1l-1 2h-1l-1-2H8l-1 2v7h10V10h-1z"
    />
  </svg>
);

export const HelpIcon = ({
  size = 24,
  className,
  fill = "currentColor",
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      fill={fill}
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
    />
  </svg>
);
