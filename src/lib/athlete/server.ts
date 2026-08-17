import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl } from "@/lib/config";
import { ATHLETE_SESSION_COOKIE, AthleteSessionCookiePayload, RailsAthleteSessionResponse } from "@/lib/athlete/types";

const athleteCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

function validateSameOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return null;
  }

  if (origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }

  return null;
}

function athleteSessionKey() {
  const secret = process.env.ATHLETE_SESSION_SECRET;

  if (process.env.NODE_ENV === "production" && !secret) {
    throw new Error("ATHLETE_SESSION_SECRET is required in production");
  }

  return crypto
    .createHash("sha256")
    .update(secret || `development-athlete-session:${apiBaseUrl}`)
    .digest();
}

export function sealAthleteSession(payload: AthleteSessionCookiePayload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", athleteSessionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function openAthleteSession(value: string) {
  const [iv, tag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64url"));

  if (!iv || !tag || !encrypted) {
    throw new Error("Invalid athlete session cookie");
  }

  const decipher = crypto.createDecipheriv("aes-256-gcm", athleteSessionKey(), iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8")) as AthleteSessionCookiePayload;
}

function publicPayload(payload: AthleteSessionCookiePayload) {
  return {
    athlete: payload.athlete,
    race: payload.race,
    tracking: payload.tracking,
  };
}

async function readCookiePayload() {
  const cookieStore = await cookies();
  const value = cookieStore.get(ATHLETE_SESSION_COOKIE)?.value;

  if (!value) {
    return null;
  }

  try {
    return openAthleteSession(value);
  } catch {
    return null;
  }
}

function clearAthleteCookie(response: NextResponse) {
  response.cookies.set(ATHLETE_SESSION_COOKIE, "", {
    ...athleteCookieOptions,
    maxAge: 0,
  });
}

async function railsJson<T>(path: string, init: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    cache: "no-store",
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  return { response, payload: payload as T };
}

export async function activateAthleteSession(request: NextRequest) {
  const originError = validateSameOrigin(request);
  if (originError) {
    return originError;
  }

  const body = await request.text();

  try {
    const { response, payload } = await railsJson<RailsAthleteSessionResponse>(
      "/api/v1/athlete/session",
      {
        method: "POST",
        headers: {
          "Content-Type": request.headers.get("content-type") || "application/json",
        },
        body,
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Código de acesso inválido ou sessão indisponível.", details: payload },
        { status: response.status },
      );
    }

    const cookiePayload: AthleteSessionCookiePayload = {
      athlete: payload.athlete,
      race: payload.race,
      tracking: payload.tracking,
      trackingSessionId: payload.server_credentials.tracking_session_id,
      ingestToken: payload.server_credentials.ingest_token,
    };
    const nextResponse = NextResponse.json(publicPayload(cookiePayload));
    nextResponse.cookies.set(
      ATHLETE_SESSION_COOKIE,
      sealAthleteSession(cookiePayload),
      athleteCookieOptions,
    );

    return nextResponse;
  } catch {
    return NextResponse.json(
      { error: "Não foi possível ativar a sessão do atleta." },
      { status: 502 },
    );
  }
}

export async function currentAthleteSession() {
  const payload = await readCookiePayload();

  if (!payload) {
    return NextResponse.json({ error: "Sessão do atleta expirada." }, { status: 401 });
  }

  return NextResponse.json(publicPayload(payload));
}

export async function proxyAthleteJson(
  request: NextRequest,
  target: "location" | "batch" | "finish",
) {
  const originError = validateSameOrigin(request);
  if (originError) {
    return originError;
  }

  const session = await readCookiePayload();

  if (!session) {
    const response = NextResponse.json({ error: "Sessão do atleta expirada." }, { status: 401 });
    clearAthleteCookie(response);
    return response;
  }

  const railsPath = {
    location: `/api/v1/tracking_sessions/${session.trackingSessionId}/locations`,
    batch: `/api/v1/tracking_sessions/${session.trackingSessionId}/locations/batch`,
    finish: `/api/v1/tracking_sessions/${session.trackingSessionId}/finish`,
  }[target];

  const body = target === "finish" ? undefined : await request.text();

  try {
    const { response, payload } = await railsJson<unknown>(railsPath, {
      method: "POST",
      headers: {
        "Content-Type": request.headers.get("content-type") || "application/json",
        Authorization: `Bearer ${session.ingestToken}`,
      },
      body,
    });

    const nextResponse = NextResponse.json(payload, { status: response.status });

    if (
      target === "finish" &&
      response.ok &&
      payload &&
      typeof payload === "object" &&
      "tracking" in payload
    ) {
      const finishedPayload = {
        ...session,
        tracking: payload.tracking as AthleteSessionCookiePayload["tracking"],
      };
      nextResponse.cookies.set(
        ATHLETE_SESSION_COOKIE,
        sealAthleteSession(finishedPayload),
        athleteCookieOptions,
      );
    }

    if (response.status === 401 || response.status === 403) {
      clearAthleteCookie(nextResponse);
    }

    return nextResponse;
  } catch {
    return NextResponse.json(
      { error: "Não foi possível comunicar com o backend de tracking." },
      { status: 502 },
    );
  }
}
