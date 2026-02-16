"use client";

import { AnalyticsEvent } from "./analytics-server";

/**
 * Client-side helper to track events via the API.
 * This can be safely used in Client Components.
 */
export function trackEventClient(event: AnalyticsEvent) {
    // Fire and forget
    fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        keepalive: true // Ensure request completes even if page unloads
    }).catch(err => {
        console.error('[Analytics Client] Failed to track:', err);
    });
}
