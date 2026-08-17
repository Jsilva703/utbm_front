import { NextRequest } from "next/server";
import { activateAthleteSession, currentAthleteSession } from "@/lib/athlete/server";

export async function GET() {
  return currentAthleteSession();
}

export async function POST(request: NextRequest) {
  return activateAthleteSession(request);
}
