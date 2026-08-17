import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl } from "@/lib/config";
import {
  FRONTEND_ADMIN_SESSION_COOKIE,
  RAILS_ADMIN_SESSION_COOKIE,
} from "@/lib/admin/types";

type ProxyOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: BodyInit | null;
  contentType?: string | null;
  validateOrigin?: boolean;
  streamBody?: boolean;
};

const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function extractSetCookieValue(setCookieHeader: string | null, cookieName: string) {
  if (!setCookieHeader) {
    return null;
  }

  const cookieStrings = setCookieHeader.split(/,(?=\s*[^;,]+=)/g);

  for (const cookieString of cookieStrings) {
    const pair = cookieString.split(";")[0];
    const separatorIndex = pair.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const name = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();

    if (name === cookieName) {
      return value;
    }
  }

  return null;
}

export function validateSameOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return null;
  }

  const requestOrigin = new URL(request.url).origin;

  if (origin !== requestOrigin) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }

  return null;
}

export async function getAdminSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(FRONTEND_ADMIN_SESSION_COOKIE)?.value || null;
}

export function setAdminSessionCookie(response: NextResponse, value: string) {
  response.cookies.set(FRONTEND_ADMIN_SESSION_COOKIE, value, adminCookieOptions);
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(FRONTEND_ADMIN_SESSION_COOKIE, "", {
    ...adminCookieOptions,
    maxAge: 0,
  });
}

function railsCookieHeader(value: string) {
  return `${RAILS_ADMIN_SESSION_COOKIE}=${value}`;
}

async function toSanitizedResponse(railsResponse: Response) {
  const text = await railsResponse.text();
  const contentType = railsResponse.headers.get("content-type") || "application/json";
  const response = new NextResponse(text || null, {
    status: railsResponse.status,
    headers: text ? { "content-type": contentType } : undefined,
  });

  if (railsResponse.status === 401) {
    clearAdminSessionCookie(response);
  }

  return response;
}

export async function proxyAdminRequest(
  request: NextRequest | Request,
  railsPath: string,
  options: ProxyOptions = {},
) {
  if (options.validateOrigin) {
    const originError = validateSameOrigin(request);
    if (originError) {
      return originError;
    }
  }

  const sessionCookie = await getAdminSessionCookie();

  if (!sessionCookie) {
    const response = NextResponse.json({ error: "Sessão administrativa expirada." }, { status: 401 });
    clearAdminSessionCookie(response);
    return response;
  }

  const headers = new Headers({
    Cookie: railsCookieHeader(sessionCookie),
  });

  if (options.contentType) {
    headers.set("Content-Type", options.contentType);
  }

  try {
    const railsResponse = await fetch(`${apiBaseUrl}${railsPath}`, {
      method: options.method || "GET",
      headers,
      body: options.body,
      cache: "no-store",
      ...(options.streamBody ? { duplex: "half" } : {}),
    });

    return toSanitizedResponse(railsResponse);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível conectar ao backend administrativo." },
      { status: 502 },
    );
  }
}

export async function proxyAdminJsonMutation(
  request: NextRequest,
  railsPath: string,
  method: "POST" | "DELETE" = "POST",
) {
  const body = method === "DELETE" ? null : await request.text();

  return proxyAdminRequest(request, railsPath, {
    method,
    body,
    contentType: request.headers.get("content-type") || "application/json",
    validateOrigin: true,
  });
}

export async function proxyAdminMultipart(request: NextRequest, railsPath: string) {
  return proxyAdminRequest(request, railsPath, {
    method: "POST",
    body: request.body,
    contentType: request.headers.get("content-type"),
    validateOrigin: true,
    streamBody: true,
  });
}

export async function loginAdmin(request: NextRequest) {
  const originError = validateSameOrigin(request);
  if (originError) {
    return originError;
  }

  const body = await request.text();
  const headers = new Headers({
    "Content-Type": request.headers.get("content-type") || "application/json",
  });

  try {
    const railsResponse = await fetch(`${apiBaseUrl}/api/v1/admin/session`, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    });
    const response = await toSanitizedResponse(railsResponse);

    if (railsResponse.ok) {
      const sessionValue = extractSetCookieValue(
        railsResponse.headers.get("set-cookie"),
        RAILS_ADMIN_SESSION_COOKIE,
      );

      if (!sessionValue) {
        return NextResponse.json(
          { error: "Sessão administrativa não foi criada pelo backend." },
          { status: 502 },
        );
      }

      setAdminSessionCookie(response, sessionValue);
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: "Não foi possível conectar ao backend administrativo." },
      { status: 502 },
    );
  }
}

export async function logoutAdmin(request: NextRequest) {
  const originError = validateSameOrigin(request);
  if (originError) {
    return originError;
  }

  const sessionCookie = await getAdminSessionCookie();

  try {
    if (sessionCookie) {
      await fetch(`${apiBaseUrl}/api/v1/admin/session`, {
        method: "DELETE",
        headers: {
          Cookie: railsCookieHeader(sessionCookie),
        },
        cache: "no-store",
      });
    }
  } catch {
    // Logout must clear the first-party cookie even if Render is waking up or unavailable.
  }

  const response = NextResponse.json({ ok: true });
  clearAdminSessionCookie(response);
  return response;
}
