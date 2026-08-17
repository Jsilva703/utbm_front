import { NextRequest } from "next/server";
import { loginAdmin, logoutAdmin } from "@/lib/admin/server";

export async function POST(request: NextRequest) {
  return loginAdmin(request);
}

export async function DELETE(request: NextRequest) {
  return logoutAdmin(request);
}
