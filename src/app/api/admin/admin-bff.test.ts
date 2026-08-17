import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { FRONTEND_ADMIN_SESSION_COOKIE } from "@/lib/admin/types";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

const fetchMock = vi.fn();

function mockCookie(value?: string) {
  vi.mocked(cookies).mockResolvedValue({
    get: vi.fn(() => (value ? { name: FRONTEND_ADMIN_SESSION_COOKIE, value } : undefined)),
  } as never);
}

function jsonResponse(payload: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });
}

function nextRequest(path: string, init?: RequestInit) {
  return new Request(`http://localhost:3000${path}`, init) as NextRequest;
}

function forwardedHeaders() {
  return fetchMock.mock.calls[0][1].headers as Headers;
}

describe("admin BFF route handlers", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    mockCookie("rails-session-value");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("logs in and stores the Rails session as a first-party HttpOnly cookie", async () => {
    const { POST } = await import("@/app/api/admin/session/route");
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { admin_user: { email: "admin@example.com", active: true } },
        201,
        {
          "set-cookie":
            "_utmb_trail_admin_session=rails-cookie-value; path=/; httponly; samesite=none",
        },
      ),
    );

    const response = await POST(
      nextRequest("/api/admin/session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ email: "admin@example.com", password: "password123" }),
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      admin_user: { email: "admin@example.com", active: true },
    });
    expect(response.headers.get("set-cookie")).toContain(
      "utmb_trail_admin_session=rails-cookie-value",
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")?.toLowerCase()).toContain("samesite=lax");
  });

  it("keeps invalid login friendly and does not create a cookie", async () => {
    const { POST } = await import("@/app/api/admin/session/route");
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "unauthorized" }, 401));

    const response = await POST(
      nextRequest("/api/admin/session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ email: "admin@example.com", password: "wrong" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).not.toContain("rails-cookie-value");
  });

  it("rejects mutating requests from a different Origin", async () => {
    const { POST } = await import("@/app/api/admin/athletes/route");

    const response = await POST(
      nextRequest("/api/admin/athletes", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://evil.example",
        },
        body: JSON.stringify({ name: "Runner" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 401 before proxying when no admin cookie exists", async () => {
    const { GET } = await import("@/app/api/admin/dashboard/route");
    mockCookie(undefined);

    const response = await GET(nextRequest("/api/admin/dashboard"));

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards the opaque Rails session cookie to dashboard", async () => {
    const { GET } = await import("@/app/api/admin/dashboard/route");
    fetchMock.mockResolvedValueOnce(jsonResponse({ total_athletes: 1 }));

    const response = await GET(nextRequest("/api/admin/dashboard"));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://utmb-trail.onrender.com/api/v1/admin/dashboard",
      expect.objectContaining({ method: "GET" }),
    );
    expect(forwardedHeaders().get("Cookie")).toBe(
      "_utmb_trail_admin_session=rails-session-value",
    );
  });

  it("proxies dashboard JSON", async () => {
    const { GET } = await import("@/app/api/admin/dashboard/route");
    const payload = {
      total_athletes: 1,
      athletes_tracking_now: 1,
      total_races: 1,
      races_with_route: 1,
      active_tracking_sessions: 1,
      finished_tracking_sessions: 0,
      races: [],
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(payload));

    const response = await GET(nextRequest("/api/admin/dashboard"));

    expect(await response.json()).toEqual(payload);
  });

  it("proxies athlete creation", async () => {
    const { POST } = await import("@/app/api/admin/athletes/route");
    fetchMock.mockResolvedValueOnce(jsonResponse({ athlete: { id: 1, name: "Runner" } }, 201));

    const response = await POST(
      nextRequest("/api/admin/athletes", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ name: "Runner", status: "active" }),
      }),
    );

    expect(response.status).toBe(201);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://utmb-trail.onrender.com/api/v1/admin/athletes",
    );
    expect(fetchMock.mock.calls[0][1].body).toBe(
      JSON.stringify({ name: "Runner", status: "active" }),
    );
  });

  it("proxies race creation", async () => {
    const { POST } = await import("@/app/api/admin/races/route");
    fetchMock.mockResolvedValueOnce(jsonResponse({ race: { id: 1, name: "UTMB" } }, 201));

    const response = await POST(
      nextRequest("/api/admin/races", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          name: "UTMB Paraty 58K",
          slug: "utmb-paraty-58k",
          distance_km: 58,
          status: "active",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://utmb-trail.onrender.com/api/v1/admin/races",
    );
  });

  it("proxies GPX upload as multipart form data", async () => {
    const { POST } = await import("@/app/api/admin/races/[id]/route/route");
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ route: { source_filename: "route.gpx", points_count: 3 } }, 201),
    );
    const formData = new FormData();
    formData.set("file", new File(["<gpx></gpx>"], "route.gpx", { type: "application/gpx+xml" }));

    const response = await POST(
      new Request("http://localhost:3000/api/admin/races/10/route", {
        method: "POST",
        headers: { origin: "http://localhost:3000" },
        body: formData,
      }) as NextRequest,
      { params: Promise.resolve({ id: "10" }) },
    );

    expect(response.status).toBe(201);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://utmb-trail.onrender.com/api/v1/admin/races/10/route",
    );
    expect(fetchMock.mock.calls[0][1].body).toBeInstanceOf(ReadableStream);
    expect(forwardedHeaders().get("Content-Type")).toContain("multipart/form-data");
  });

  it("proxies tracking session creation and preserves response tokens", async () => {
    const { POST } = await import("@/app/api/admin/tracking-sessions/route");
    const payload = {
      tracking_session: {
        id: 1,
        public_token: "public-token",
        ingest_token: "ingest-token",
      },
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(payload, 201));

    const response = await POST(
      nextRequest("/api/admin/tracking-sessions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ athlete_id: 1, race_id: 2 }),
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(payload);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://utmb-trail.onrender.com/api/v1/admin/tracking_sessions",
    );
  });

  it("clears the frontend cookie when Rails returns 401", async () => {
    const { GET } = await import("@/app/api/admin/dashboard/route");
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "unauthorized" }, 401));

    const response = await GET(nextRequest("/api/admin/dashboard"));

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toContain("utmb_trail_admin_session=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("clears local session on logout even when Rails is unavailable", async () => {
    const { DELETE } = await import("@/app/api/admin/session/route");
    fetchMock.mockRejectedValueOnce(new Error("Render cold start"));

    const response = await DELETE(
      nextRequest("/api/admin/session", {
        method: "DELETE",
        headers: { origin: "http://localhost:3000" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
