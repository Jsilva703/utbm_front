import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function nextRequest(path: string) {
  return new NextRequest(`http://localhost:3000${path}`);
}

describe("public BFF route handlers", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("proxies public tracking by public access code", async () => {
    const { GET } = await import("@/app/api/public/tracking/route");
    const payload = {
      athlete: { name: "Runner" },
      race: { name: "UTMB", distance_km: 58 },
      tracking: { status: "active", started_at: "2026-08-17T19:00:00Z" },
      location: null,
      route_progress: null,
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(payload));

    const response = await GET(nextRequest("/api/public/tracking?code=582731"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://utmb-trail.onrender.com/api/v1/public/tracking/code/582731",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("proxies public location history by public access code", async () => {
    const { GET } = await import("@/app/api/public/locations/route");
    const payload = {
      locations: [{ latitude: -23, longitude: -46, accuracy: 8, altitude: null, recorded_at: "2026-08-17T19:00:00Z" }],
      pagination: { page: 1, per_page: 50, total_count: 1 },
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(payload));

    const response = await GET(nextRequest("/api/public/locations?code=582731&page=1&per_page=50"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://utmb-trail.onrender.com/api/v1/public/tracking/code/582731/locations?page=1&per_page=50",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("proxies the official route for the public access code", async () => {
    const { GET } = await import("@/app/api/public/route/route");
    const payload = {
      route: {
        source_filename: "route.gpx",
        total_distance_m: 4293.44,
        points_count: 2,
        points: [
          {
            sequence: 0,
            latitude: -23.524346,
            longitude: -46.885805,
            altitude: 785,
            cumulative_distance_m: 0,
          },
        ],
      },
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(payload));

    const response = await GET(nextRequest("/api/public/route?code=582731"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://utmb-trail.onrender.com/api/v1/public/tracking/code/582731/route",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("proxies invalid public tracking codes to Rails for validation", async () => {
    const { GET } = await import("@/app/api/public/route/route");
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "not found" }, 404));

    const response = await GET(nextRequest("/api/public/route?code=wrong"));

    expect(response.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://utmb-trail.onrender.com/api/v1/public/tracking/code/wrong/route",
      expect.objectContaining({ cache: "no-store" }),
    );
  });
});
