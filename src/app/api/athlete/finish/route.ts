import { NextRequest } from "next/server";
import { proxyAthleteJson } from "@/lib/athlete/server";

export async function POST(request: NextRequest) {
  return proxyAthleteJson(request, "finish");
}
