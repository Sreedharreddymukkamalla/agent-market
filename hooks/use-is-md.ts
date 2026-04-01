"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 768px)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getMd() {
  return window.matchMedia(QUERY).matches;
}

/** Client-only breakpoint: desktop sidebar rail vs mobile drawer. */
export function useIsMd() {
  return useSyncExternalStore(subscribe, getMd, () => true);
}
