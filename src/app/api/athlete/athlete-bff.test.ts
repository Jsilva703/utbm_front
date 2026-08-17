import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { ATHLETE_SESSION_COOKIE, AthleteSessionCookiePayload } from "@/lib/athlete/types";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

const fetchMock = vi.fn();

function mockCookie(value?: string) {
  vi.mocked(cookies).mockResolvedValue({
    get: vi.fn(() => (value ? { name: ATHLETE_SESSION_COOKIE, value } : undefined)),
  } as never);
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

function nextRequest(path: string, init?: RequestInit) {
  return new Request(`http://localhost:3000${path}`, init) as NextRequest;
}

function railsPayload() {
  return {
    athlete: { name: "João Teste" },
    race: { name: "Praça Test Run", distance_km: 4.293 },
    tracking: {
      status: "active",
      started_at: "2026-08-17T16:18:22Z",
      finished_at: null,
    },
    server_credentials: {
      tracking_session_id: 11,
      ingest_token: "ingest-secret",
    },
  };
}

describe("athlete BFF route handlers", () => {
  beforeEach(() => {
    process.env.ATHLETE_SESSION_SECRET = "test-athlete-secret";
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    mockCookie(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.ATHLETE_SESSION_SECRET;
  });

  it("activates an athlete session and does not expose ingest_token to the browser", async () => {
    const { POST } = await import("@/app/api/athlete/session/route");
    fetchMock.mockResolvedValueOnce(jsonResponse(railsPayload()));

    const response = await POST(
      nextRequest("/api/athlete/session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ code: "AB23CD45" }),
      }),
    );

    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("João Teste");
    expect(body).not.toContain("ingest-secret");
    expect(body).not.toContain("server_credentials");
    expect(response.headers.get("set-cookie")).toContain(ATHLETE_SESSION_COOKIE);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")?.toLowerCase()).toContain("samesite=lax");
  });

  it("rejects activation from another Origin", async () => {
    const { POST } = await import("@/app/api/athlete/session/route");

    const response = await POST(
      nextRequest("/api/athlete/session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://evil.example",
        },
        body: JSON.stringify({ code: "AB23CD45" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 401 when the athlete cookie is missing", async () => {
    const { POST } = await import("@/app/api/athlete/locations/route");

    const response = await POST(
      nextRequest("/api/athlete/locations", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ latitude: -23, longitude: -46 }),
      }),
    );

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards a location with the sealed ingest token server-side", async () => {
    const { POST } = await import("@/app/api/athlete/locations/route");
    const { sealAthleteSession } = await import("@/lib/athlete/server");
    const sealed = sealAthleteSession({
      ...railsPayload(),
      trackingSessionId: 11,
      ingestToken: "ingest-secret",
    } as unknown as AthleteSessionCookiePayload);
    mockCookie(sealed);
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 1, created: true }, 201));

    const response = await POST(
      nextRequest("/api/athlete/locations", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ latitude: -23, longitude: -46 }),
      }),
    );

    expect(response.status).toBe(201);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://utmb-trail.onrender.com/api/v1/tracking_sessions/11/locations",
    );
    expect((fetchMock.mock.calls[0][1].headers as Record<string, string>).Authorization).toBe(
      "Bearer ingest-secret",
    );
  });

  it("forwards batch locations through the athlete session", async () => {
    const { POST } = await import("@/app/api/athlete/locations/batch/route");
    const { sealAthleteSession } = await import("@/lib/athlete/server");
    mockCookie(
      sealAthleteSession({
        athlete: { name: "João Teste" },
        race: { name: "Praça", distance_km: 4.293 },
        tracking: { status: "active", started_at: "2026-08-17T16:18:22Z", finished_at: null },
        trackingSessionId: 11,
        ingestToken: "ingest-secret",
      }),
    );
    fetchMock.mockResolvedValueOnce(jsonResponse({ created_count: 1, duplicate_count: 0 }, 201));

    const response = await POST(
      nextRequest("/api/athlete/locations/batch", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ locations: [] }),
      }),
    );

    expect(response.status).toBe(201);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://utmb-trail.onrender.com/api/v1/tracking_sessions/11/locations/batch",
    );
  });

  it("finishes through the athlete session", async () => {
    const { POST } = await import("@/app/api/athlete/finish/route");
    const { sealAthleteSession } = await import("@/lib/athlete/server");
    mockCookie(
      sealAthleteSession({
        athlete: { name: "João Teste" },
        race: { name: "Praça", distance_km: 4.293 },
        tracking: { status: "active", started_at: "2026-08-17T16:18:22Z", finished_at: null },
        trackingSessionId: 11,
        ingestToken: "ingest-secret",
      }),
    );
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ tracking: { status: "finished", finished_at: "2026-08-17T17:00:00Z" } }),
    );

    const response = await POST(
      nextRequest("/api/athlete/finish", {
        method: "POST",
        headers: { origin: "http://localhost:3000" },
      }),
    );

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://utmb-trail.onrender.com/api/v1/tracking_sessions/11/finish",
    );
  });
});
