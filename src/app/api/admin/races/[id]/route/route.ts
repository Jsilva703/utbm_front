import { NextRequest } from "next/server";
import { proxyAdminMultipart } from "@/lib/admin/server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return proxyAdminMultipart(request, `/api/v1/admin/races/${id}/route`);
}
