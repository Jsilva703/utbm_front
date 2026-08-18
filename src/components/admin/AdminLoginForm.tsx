"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Brand } from "@/components/Brand";
import { AdminClientError, loginAdminUser } from "@/lib/admin/client";
import { racepulseImages, racepulseVideos } from "@/config/racepulse-media";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await loginAdminUser(email, password);
      router.replace("/admin");
    } catch (loginError) {
      if (loginError instanceof AdminClientError && loginError.status === 401) {
        setError("E-mail ou senha inválidos.");
      } else {
        setError("Não foi possível entrar agora. Tente novamente em instantes.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="figma-admin-login-split">
      <section className="figma-admin-login-panel">
        <Link href="/" className="figma-back-link">
          <ArrowLeft size={13} aria-hidden="true" />
          Voltar
        </Link>
        <Brand />
        <div className="figma-form-spacer" />
        <span>Acesso restrito</span>
        <h1>
          Área
          <br />
          administrativa
        </h1>
        <p>Gerencie atletas, provas e sessões de tracking.</p>

        <form className="figma-side-form" onSubmit={handleSubmit}>
          <label htmlFor="admin-email">E-mail</label>
          <input
            id="admin-email"
            required
            autoComplete="email"
            type="email"
            placeholder="admin@racepulse.com.br"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label htmlFor="admin-password">Senha</label>
          <input
            id="admin-password"
            required
            autoComplete="current-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error ? <p className="figma-form-error">{error}</p> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar"}
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </form>
      </section>

      <section className="figma-admin-media">
        <video autoPlay muted loop playsInline poster={racepulseImages.admin}>
          {racepulseVideos.map((video) => (
            <source key={video} src={video} />
          ))}
        </video>
        <div className="figma-admin-media-overlay" />
        <div className="figma-admin-media-radial" />
        <aside>
          <blockquote>
            "No trail, cada segundo conta. Aqui, você acompanha todos."
          </blockquote>
          <p>RacePulse · Tracking operacional</p>
        </aside>
      </section>
    </main>
  );
}
