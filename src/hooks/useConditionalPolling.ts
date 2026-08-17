"use client";

import { useEffect } from "react";

export function useConditionalPolling(
  enabled: boolean,
  callback: () => void | Promise<void>,
  intervalMs: number,
) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const interval = window.setInterval(() => {
      void callback();
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [callback, enabled, intervalMs]);
}
