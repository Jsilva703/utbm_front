import { NextRequest, NextResponse } from "next/server";
import { ApiError, getPublicTracking, resolveTestPublicToken } from "@/lib/api/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") || "";
  const publicToken = resolveTestPublicToken(code);

  if (!publicToken) {
    return NextResponse.json(
      { error: "Atleta não encontrado", message: "Verifique o código informado." },
      { status: 404 },
    );
  }

  try {
    const tracking = await getPublicTracking(publicToken);
    return NextResponse.json(tracking);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: "Não foi possível atualizar os dados.", details: error.payload },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Não foi possível atualizar os dados." },
      { status: 502 },
    );
  }
}

