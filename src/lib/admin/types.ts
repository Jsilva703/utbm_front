export const RAILS_ADMIN_SESSION_COOKIE = "_utmb_trail_admin_session";
export const FRONTEND_ADMIN_SESSION_COOKIE = "utmb_trail_admin_session";

export type AdminStatus = "active" | "inactive" | "finished" | string;

export type AdminUser = {
  email: string;
  active: boolean;
};

export type AdminAthlete = {
  id: number;
  name: string;
  status: AdminStatus;
  has_active_tracking: boolean;
  active_tracking_session?: {
    id: number;
    race_id: number;
    public_token: string;
    started_at: string | null;
  } | null;
};

export type AdminRace = {
  id: number;
  name: string;
  slug: string;
  distance_km: number;
  status: AdminStatus;
  published: boolean;
  has_route: boolean;
  route_points_count: number;
  tracking_sessions_count: number;
  active_tracking_sessions_count: number;
};

export type AdminTrackingSession = {
  id: number;
  status: AdminStatus;
  public_token: string;
  ingest_token?: string;
  started_at: string | null;
  finished_at: string | null;
  athlete: {
    id: number;
    name: string;
  };
  race: {
    id: number;
    name: string;
    slug: string;
  };
  latest_location?: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    altitude: number | null;
    recorded_at: string;
  } | null;
};

export type AdminDashboard = {
  total_athletes: number;
  athletes_tracking_now: number;
  total_races: number;
  races_with_route: number;
  active_tracking_sessions: number;
  finished_tracking_sessions: number;
  races: Array<{
    id: number;
    name: string;
    distance_km?: number | null;
    tracking_sessions_count: number;
    active_tracking_sessions_count: number;
  }>;
};

export type AdminRouteImport = {
  route: {
    source_filename: string;
    total_distance_m: number;
    points_count: number;
    points?: Array<{
      sequence: number;
      latitude: number;
      longitude: number;
      altitude: number | null;
      cumulative_distance_m: number;
    }>;
  };
};

export type AdminApiErrorPayload = {
  error?: string;
  message?: string;
  details?: Record<string, string[]>;
};
