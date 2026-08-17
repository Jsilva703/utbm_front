import { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/lib/admin/server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return proxyAdminRequest(request, `/api/v1/admin/races/${id}`);
}
