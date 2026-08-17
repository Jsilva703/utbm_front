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
    vi.stubEnv("TEST_PUBLIC_TOKEN", "public-token");
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("proxies the official route for the configured public tracking code", async () => {
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

    const response = await GET(nextRequest("/api/public/route?code=12345"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://utmb-trail.onrender.com/api/v1/public/tracking/public-token/route",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("does not call Rails when the public tracking code is invalid", async () => {
    const { GET } = await import("@/app/api/public/route/route");

    const response = await GET(nextRequest("/api/public/route?code=wrong"));

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
