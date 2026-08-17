import { NextRequest, NextResponse } from "next/server";
import { ApiError, getPublicTrackingByCode } from "@/lib/api/server";

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
    const tracking = await getPublicTrackingByCode(code);
    return NextResponse.json(tracking);
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
      { error: "Não foi possível atualizar os dados." },
      { status: 502 },
    );
  }
}
