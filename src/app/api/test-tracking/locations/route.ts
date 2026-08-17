import { NextResponse } from "next/server";
import { ApiError, sendLocation, sendLocationsBatch } from "@/lib/api/server";
import type { LocationPayload } from "@/lib/api/types";

function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: "Não foi possível enviar localização.", details: error.payload },
      { status: error.status },
    );
  }

  return NextResponse.json(
    { error: "Não foi possível enviar localização." },
    { status: 502 },
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LocationPayload | { locations: LocationPayload[] };

    if ("locations" in body) {
      const result = await sendLocationsBatch(body.locations);
      return NextResponse.json(result, { status: 201 });
    }

    const result = await sendLocation(body);
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

