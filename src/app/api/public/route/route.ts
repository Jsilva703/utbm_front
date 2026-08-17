import { NextRequest, NextResponse } from "next/server";
import { ApiError, getPublicRouteByCode } from "@/lib/api/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") || "";

  if (!code.trim()) {
    return NextResponse.json(
      {
        error: "Código público obrigatório",
        message: "Informe o código público de acompanhamento.",
      },
      { status: 404 },
    );
  }

  try {
    const route = await getPublicRouteByCode(code);
    return NextResponse.json(route);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          error: "Não encontramos uma sessão de acompanhamento com esse código.",
          details: error.payload,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Não foi possível carregar a rota oficial." },
      { status: 502 },
    );
  }
}
