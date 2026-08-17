export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "https://utmb-trail.onrender.com";

export const pollingConfig = {
  publicTrackingMs: 15_000,
  adminTrackingMs: 15_000,
  staleAttentionMs: 90_000,
  staleOutdatedMs: 5 * 60_000,
};

export const trackingConfig = {
  gpsMaximumAgeMs: 5_000,
  gpsTimeoutMs: 20_000,
  sendIntervalMs: 15_000,
  batchSize: 25,
};

export const testAthleteConfig = {
  trackingSessionId: process.env.TEST_TRACKING_SESSION_ID,
  ingestToken: process.env.RAILS_INGEST_TOKEN,
};
