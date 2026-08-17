"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LockKeyhole, Radio } from "lucide-react";
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
      setError("Não encontramos uma sessão de acompanhamento com esse código.");
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
        <CodeInput
          label="Código de acompanhamento"
          placeholder="Digite o código público"
          onSubmit={handleCode}
          error={error}
        />
        <div className="home-action-grid" aria-label="Outros acessos">
          <Link className="secondary-button" href="/athlete">
            <Radio size={18} aria-hidden="true" />
            Entrar como atleta
          </Link>
          <Link className="home-admin-link" href="/admin/login">
            <LockKeyhole size={16} aria-hidden="true" />
            Área administrativa
          </Link>
        </div>
      </section>
    </main>
  );
}
