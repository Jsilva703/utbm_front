"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { Brand } from "@/components/Brand";
import { AdminClientError, loginAdminUser } from "@/lib/admin/client";

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
    <main className="screen admin-login-screen">
      <header className="admin-login-top">
        <Brand />
        <span className="pill">
          <LockKeyhole size={14} aria-hidden="true" />
          Admin
        </span>
      </header>

      <section className="admin-login-panel">
        <div className="admin-login-card">
          <span className="pill">
            <LockKeyhole size={14} aria-hidden="true" />
            Admin
          </span>
          <h1>Área administrativa</h1>
          <p>Gerencie atletas, provas e sessões de tracking.</p>

          <form className="admin-form admin-login-form" onSubmit={handleSubmit}>
            <label>
              <span className="field-label">E-mail</span>
              <input
                required
                autoComplete="email"
                className="code-input admin-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label>
              <span className="field-label">Senha</span>
              <input
                required
                autoComplete="current-password"
                className="code-input admin-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {error ? <p className="form-error admin-feedback">{error}</p> : null}

            <button type="submit" className="primary-button admin-login-button" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
