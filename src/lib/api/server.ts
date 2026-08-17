import { apiBaseUrl, testAthleteConfig } from "@/lib/config";
import type {
  BatchLocationResponse,
  FinishResponse,
  LocationPayload,
  LocationResponse,
  PublicLocationsResponse,
  PublicRaceRouteResponse,
  PublicTrackingResponse,
} from "@/lib/api/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message);
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError("Rails API request failed", response.status, payload);
  }

  return payload as T;
}

export function resolveTestPublicToken(code: string): string | null {
  if (code.trim() !== testAthleteConfig.code) {
    return null;
  }

  return testAthleteConfig.publicToken || null;
}

export function getTestTrackingConfig() {
  if (!testAthleteConfig.trackingSessionId || !testAthleteConfig.ingestToken) {
    throw new ApiError("Test tracking environment is not configured", 500);
  }

  return {
    sessionId: testAthleteConfig.trackingSessionId,
    ingestToken: testAthleteConfig.ingestToken,
  };
}

export async function getPublicTracking(publicToken: string) {
  return requestJson<PublicTrackingResponse>(`/api/v1/public/tracking/${publicToken}`);
}

export async function getPublicLocations(publicToken: string, page = 1, perPage = 50) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });

  return requestJson<PublicLocationsResponse>(
    `/api/v1/public/tracking/${publicToken}/locations?${params.toString()}`,
  );
}

export async function getPublicRoute(publicToken: string) {
  return requestJson<PublicRaceRouteResponse>(`/api/v1/public/tracking/${publicToken}/route`);
}

export async function sendLocation(payload: LocationPayload) {
  const { sessionId, ingestToken } = getTestTrackingConfig();

  return requestJson<LocationResponse>(`/api/v1/tracking_sessions/${sessionId}/locations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ingestToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function sendLocationsBatch(locations: LocationPayload[]) {
  const { sessionId, ingestToken } = getTestTrackingConfig();

  return requestJson<BatchLocationResponse>(
    `/api/v1/tracking_sessions/${sessionId}/locations/batch`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ingestToken}`,
      },
      body: JSON.stringify({ locations }),
    },
  );
}

export async function finishTestTrackingSession() {
  const { sessionId, ingestToken } = getTestTrackingConfig();

  return requestJson<FinishResponse>(`/api/v1/tracking_sessions/${sessionId}/finish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ingestToken}`,
    },
  });
}
