import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { FRONTEND_ADMIN_SESSION_COOKIE } from "@/lib/admin/types";
import { proxy } from "@/proxy";

describe("admin proxy", () => {
  it("redirects /admin to login when there is no local admin cookie", () => {
    const response = proxy(new NextRequest("http://localhost:3000/admin"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/admin/login?next=%2Fadmin",
    );
  });

  it("allows protected admin pages when the local admin cookie exists", () => {
    const response = proxy(
      new NextRequest("http://localhost:3000/admin/races", {
        headers: {
          cookie: `${FRONTEND_ADMIN_SESSION_COOKIE}=opaque-value`,
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects nested protected admin pages when there is no local admin cookie", () => {
    const response = proxy(new NextRequest("http://localhost:3000/admin/races/new"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/admin/login?next=%2Fadmin%2Fraces%2Fnew",
    );
  });

  it("does not redirect the login page", () => {
    const response = proxy(new NextRequest("http://localhost:3000/admin/login"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
