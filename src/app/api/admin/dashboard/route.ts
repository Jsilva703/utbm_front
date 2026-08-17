import { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin/server";

export async function GET(request: NextRequest) {
  return proxyAdminRequest(request, "/api/v1/admin/dashboard");
}
