import { NextResponse } from "next/server";
import { ApiError, finishTestTrackingSession } from "@/lib/api/server";

export async function POST() {
  try {
    const result = await finishTestTrackingSession();
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: "Não foi possível finalizar a sessão.", details: error.payload },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Não foi possível finalizar a sessão." },
      { status: 502 },
    );
  }
}

