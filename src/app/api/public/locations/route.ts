import { NextRequest, NextResponse } from "next/server";
import { ApiError, getPublicLocations, resolveTestPublicToken } from "@/lib/api/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") || "";
  const page = Number(request.nextUrl.searchParams.get("page") || 1);
  const perPage = Number(request.nextUrl.searchParams.get("per_page") || 50);
  const publicToken = resolveTestPublicToken(code);

  if (!publicToken) {
    return NextResponse.json(
      { error: "Atleta não encontrado", message: "Verifique o código informado." },
      { status: 404 },
    );
  }

  try {
    const locations = await getPublicLocations(publicToken, page, perPage);
    return NextResponse.json(locations);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: "Não foi possível carregar o histórico.", details: error.payload },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Não foi possível carregar o histórico." },
      { status: 502 },
    );
  }
}

