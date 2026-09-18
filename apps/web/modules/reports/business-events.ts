import { z } from "zod";
import type { Pool } from "pg";
import { collectReportEvent } from "@caab/db/repositories/report-analytics";
import { analyticsEnvironment } from "./ingest";
import { logger } from "../shared/logger";
export async function trackConfirmedBooking(
  pool: Pool,
  request: Request,
  bookingId: string,
  userId: string,
) {
  const visitor = z.uuid().safeParse(request.headers.get("x-analytics-visitor"));
  const session = z.uuid().safeParse(request.headers.get("x-analytics-session"));
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!visitor.success || !session.success || !secret) return;
  try {
    await collectReportEvent(
      pool,
      {
        id: bookingId,
        visitorId: visitor.data,
        sessionId: session.data,
        event: "booking_confirmed",
        screen: "scheduling",
        origin: "internal",
      },
      {
        source: "panel",
        channel: "admin",
        environment: analyticsEnvironment(),
        secret,
        accountId: userId,
      },
    );
  } catch {
    logger.warn(
      { event: "analytics.collection_failed", errorCode: "ANALYTICS_UNAVAILABLE" },
      "Usage collection unavailable",
    );
  }
}
