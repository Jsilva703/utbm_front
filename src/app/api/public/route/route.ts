import { NextRequest, NextResponse } from "next/server";
import { ApiError, getPublicRoute, resolveTestPublicToken } from "@/lib/api/server";

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
    const route = await getPublicRoute(publicToken);
    return NextResponse.json(route);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: "Não foi possível carregar a rota oficial.", details: error.payload },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Não foi possível carregar a rota oficial." },
      { status: 502 },
    );
  }
}
