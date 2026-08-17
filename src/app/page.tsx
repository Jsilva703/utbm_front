"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brand } from "@/components/Brand";
import { CodeInput } from "@/components/CodeInput";

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleCode(code: string) {
    setError(null);

    const response = await fetch(`/api/public/tracking?code=${encodeURIComponent(code)}`, {
      cache: "no-store",
    });

    if (response.status === 404) {
      setError("Atleta não encontrado. Verifique o código informado.");
      return;
    }

    if (!response.ok) {
      setError("Não foi possível conectar ao servidor. Tentaremos novamente.");
      return;
    }

    router.push(`/tracking?code=${encodeURIComponent(code)}`);
  }

  return (
    <main className="screen home-screen">
      <section className="home-panel">
        <Brand />
        <h1 className="home-title">Acompanhe atletas ao vivo nas trilhas</h1>
        <p className="home-copy">
          Tracking público para provas de trail, pensado para acompanhar o atleta no celular
          com mapa, progresso estimado e última atualização em destaque.
        </p>
        <CodeInput onSubmit={handleCode} error={error} />
      </section>
    </main>
  );
}

