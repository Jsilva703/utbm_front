import type {
  BatchLocationResponse,
  FinishResponse,
  LocationResponse,
  TrackingStatus,
} from "@/lib/api/types";

export const ATHLETE_SESSION_COOKIE = "utmb_trail_athlete_session";

export type AthleteSessionPublic = {
  athlete: {
    name: string;
  };
  race: {
    name: string;
    distance_km: number;
  };
  tracking: {
    status: TrackingStatus;
    started_at: string | null;
    finished_at: string | null;
  };
};

export type AthleteSessionCredentials = {
  trackingSessionId: number;
  ingestToken: string;
};

export type AthleteSessionCookiePayload = AthleteSessionPublic & AthleteSessionCredentials;

export type RailsAthleteSessionResponse = AthleteSessionPublic & {
  server_credentials: {
    tracking_session_id: number;
    ingest_token: string;
  };
};

export type AthleteLocationResponse = LocationResponse;
export type AthleteBatchLocationResponse = BatchLocationResponse;
export type AthleteFinishResponse = FinishResponse;
