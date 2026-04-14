type IconProps = { className?: string };

export function IconHistory({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={22}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={22}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={22}
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={22}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconMic({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={20}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={20}
    >
      <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" />
      <path d="M19 10v1a7 7 0 01-14 0v-1M12 18v4M8 22h8" />
    </svg>
  );
}

export function IconCloseRecording({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={20}
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={20}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function IconSend({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={18}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.25}
      viewBox="0 0 24 24"
      width={18}
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export function IconBack({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={22}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={22}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function IconMore({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      height={20}
      viewBox="0 0 24 24"
      width={20}
    >
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  );
}

export function IconShare({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={18}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={18}
    >
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
    </svg>
  );
}

export function IconPhotosFiles({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={20}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={20}
    >
      <rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={17}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={17}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function IconCopy({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={17}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={17}
    >
      <rect height="14" rx="2" ry="2" width="14" x="8" y="8" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

export function IconEditMessage({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={17}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={17}
    >
      <path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

export function IconTrash({ className }: IconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={18}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={18}
    >
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" />
    </svg>
  );
}
