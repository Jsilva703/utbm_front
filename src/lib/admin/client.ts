"use client";

import type {
  AdminApiErrorPayload,
  AdminAthlete,
  AdminDashboard,
  AdminRace,
  AdminRouteImport,
  AdminTrackingSession,
  AdminUser,
} from "@/lib/admin/types";

export class AdminClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: AdminApiErrorPayload,
  ) {
    super(message);
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
};

function validationMessage(payload?: AdminApiErrorPayload) {
  if (payload?.details) {
    return Object.entries(payload.details)
      .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
      .join("; ");
  }

  return payload?.message || payload?.error || "Não foi possível completar a operação.";
}

async function handleUnauthorized() {
  await fetch("/api/admin/session", { method: "DELETE" }).catch(() => undefined);
  window.location.assign("/admin/login");
}

export async function adminRequest<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers();
  let body: BodyInit | undefined;

  if (options.body != null) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`/api/admin${path}`, {
    method: options.method || "GET",
    headers,
    body,
    cache: "no-store",
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (response.status === 401) {
    await handleUnauthorized();
  }

  if (!response.ok) {
    throw new AdminClientError(validationMessage(payload), response.status, payload);
  }

  return payload as T;
}

export async function adminUpload<T>(path: string, formData: FormData) {
  const response = await fetch(`/api/admin${path}`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (response.status === 401) {
    await handleUnauthorized();
  }

  if (!response.ok) {
    throw new AdminClientError(validationMessage(payload), response.status, payload);
  }

  return payload as T;
}

export async function loginAdminUser(email: string, password: string) {
  return adminRequest<{ admin_user: AdminUser }>("/session", {
    method: "POST",
    body: { email, password },
  });
}

export async function logoutAdminUser() {
  await fetch("/api/admin/session", { method: "DELETE" });
  window.location.assign("/admin/login");
}

export async function getDashboard() {
  return adminRequest<AdminDashboard>("/dashboard");
}

export async function getAthletes() {
  return adminRequest<{ athletes: AdminAthlete[] }>("/athletes");
}

export async function createAthlete(payload: { name: string; status?: string }) {
  return adminRequest<{ athlete: AdminAthlete }>("/athletes", { method: "POST", body: payload });
}

export async function getRaces() {
  return adminRequest<{ races: AdminRace[] }>("/races");
}

export async function createRace(payload: {
  name: string;
  slug: string;
  distance_km: number;
  status: string;
}) {
  return adminRequest<{ race: AdminRace }>("/races", { method: "POST", body: payload });
}

export async function uploadRaceRoute(raceId: number, file: File) {
  const formData = new FormData();
  formData.set("file", file);
  return adminUpload<AdminRouteImport>(`/races/${raceId}/route`, formData);
}

export async function getTrackingSessions(query = "") {
  return adminRequest<{ tracking_sessions: AdminTrackingSession[] }>(
    `/tracking-sessions${query}`,
  );
}

export async function createTrackingSession(payload: { athlete_id: number; race_id: number }) {
  return adminRequest<{ tracking_session: AdminTrackingSession }>("/tracking-sessions", {
    method: "POST",
    body: payload,
  });
}
