import { NextRequest, NextResponse } from "next/server";
import { ApiError, getPublicLocationsByCode } from "@/lib/api/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") || "";
  const page = Number(request.nextUrl.searchParams.get("page") || 1);
  const perPage = Number(request.nextUrl.searchParams.get("per_page") || 50);

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
    const locations = await getPublicLocationsByCode(code, page, perPage);
    return NextResponse.json(locations);
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
      { error: "Não foi possível carregar o histórico." },
      { status: 502 },
    );
  }
}
