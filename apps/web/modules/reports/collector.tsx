"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { AnalyticsEvent } from "@caab/contracts";
const screens = new Set([
  "news",
  "members",
  "partners",
  "users",
  "scheduling",
  "messages",
  "audit",
  "reports",
  "sessions",
  "settings",
]);
export function reportSession() {
  const now = Date.now();
  let data: { visitorId: string; sessionId: string; last: number };
  try {
    data = JSON.parse(sessionStorage.getItem("caab:analytics") ?? "null");
  } catch {
    data = null!;
  }
  if (!data?.visitorId || !data.sessionId || now - data.last > 30 * 60 * 1000)
    data = {
      visitorId: data?.visitorId ?? crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
      last: now,
    };
  data.last = now;
  sessionStorage.setItem("caab:analytics", JSON.stringify(data));
  return { visitorId: data.visitorId, sessionId: data.sessionId };
}
export function trackPanelEvent(event: AnalyticsEvent["event"], screen: AnalyticsEvent["screen"]) {
  try {
    const session = reportSession();
    void fetch("/api/v1/reports/collect", {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json", "x-csrf-token": crypto.randomUUID() },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        ...session,
        event,
        screen,
        device: innerWidth < 600 ? "mobile" : innerWidth < 1000 ? "tablet" : "desktop",
        origin: "internal",
      }),
    }).catch(() => undefined);
  } catch {
    /* Analytics is best effort and must never interrupt navigation. */
  }
}
export function PanelAnalytics() {
  const pathname = usePathname();
  const previous = useRef("");
  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    const area = pathname.split("/")[1] || "home";
    const screen = (
      area === "home"
        ? "home"
        : area === "operations"
          ? "audit"
          : screens.has(area)
            ? area
            : "other"
    ) as AnalyticsEvent["screen"];
    trackPanelEvent("page_view", screen);
    if (pathname === "/scheduling/new") trackPanelEvent("schedule_open", "scheduling");
  }, [pathname]);
  return null;
}
