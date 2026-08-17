export type TrackingStatus = "active" | "finished" | string;

export type PublicTrackingResponse = {
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
    last_update_at: string | null;
  };
  location: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null;
  route_progress: {
    route_point_sequence: number;
    estimated_distance_m: number;
    estimated_distance_km: number;
    estimated_progress_percentage: number;
    estimated_remaining_distance_m: number;
    estimated_remaining_distance_km: number;
    distance_from_route_m: number;
  } | null;
};

export type PublicLocationPoint = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  recorded_at: string;
};

export type PublicLocationsResponse = {
  locations: PublicLocationPoint[];
  pagination: {
    page: number;
    per_page: number;
    total_count: number;
  };
};

export type PublicRoutePoint = {
  sequence: number;
  latitude: number;
  longitude: number;
  altitude: number | null;
  cumulative_distance_m: number;
};

export type PublicRaceRouteResponse = {
  route: {
    source_filename: string;
    total_distance_m: number;
    points_count: number;
    points: PublicRoutePoint[];
  } | null;
};

export type LocationPayload = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  recorded_at: string;
  client_point_id: string;
};

export type LocationResponse = LocationPayload & {
  id: number;
  created?: boolean;
};

export type BatchLocationResponse = {
  created_count: number;
  duplicate_count: number;
  locations: LocationResponse[];
};

export type FinishResponse = {
  tracking: {
    status: TrackingStatus;
    finished_at: string | null;
  };
};

export type ApiErrorPayload = {
  error: string;
  details?: Record<string, string[]>;
};
