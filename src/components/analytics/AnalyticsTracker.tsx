"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEventClient } from "@/lib/analytics-client";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // Only track if the pathname has actually changed to avoid spamming
    if (pathname && pathname !== lastTrackedPath.current) {
      lastTrackedPath.current = pathname;
      trackEventClient({
        eventName: "app_visited",
        metadata: { path: pathname }
      });
    }
  }, [pathname]);

  return null;
}
