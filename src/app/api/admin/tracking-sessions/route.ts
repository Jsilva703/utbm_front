import { NextRequest } from "next/server";
import { proxyAdminJsonMutation, proxyAdminRequest } from "@/lib/admin/server";

export async function GET(request: NextRequest) {
  return proxyAdminRequest(
    request,
    `/api/v1/admin/tracking_sessions${request.nextUrl.search}`,
  );
}

export async function POST(request: NextRequest) {
  return proxyAdminJsonMutation(request, "/api/v1/admin/tracking_sessions");
}
