"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEventClient } from "@/lib/analytics-client";

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Track app visit on initial load
    trackEventClient({
      eventName: "app_visited",
      metadata: { 
        path: window.location.pathname,
        referrer: document.referrer,
        screen: `${window.screen.width}x${window.screen.height}`
      }
    });

    // Handle menu clicks by decorating sidebar links if needed,
    // but for now, we'll track general navigation via pathname changes
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
        const result = originalPushState.apply(this, args);
        trackEventClient({
            eventName: "app_visited",
            metadata: { path: args[2] || window.location.pathname }
        });
        return result;
    };

    window.history.replaceState = function(...args) {
        const result = originalReplaceState.apply(this, args);
        trackEventClient({
            eventName: "app_visited",
            metadata: { path: args[2] || window.location.pathname }
        });
        return result;
    };

    return () => {
        window.history.pushState = originalPushState;
        window.history.replaceState = originalReplaceState;
    };
  }, []);

  useEffect(() => {
    // Track page views on route change (simplified)
    if (pathname) {
      trackEventClient({
        eventName: "app_visited",
        metadata: { path: pathname }
      });
    }
  }, [pathname]);

  return null;
}
