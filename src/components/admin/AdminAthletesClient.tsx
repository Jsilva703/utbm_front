"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Eye, Radio, RefreshCw, UserPlus } from "lucide-react";
import { createAthlete, getAthletes } from "@/lib/admin/client";
import type { AdminAthlete } from "@/lib/admin/types";
import { AdminErrorState, AdminLoadingState, EmptyState } from "@/components/admin/AdminState";

export function AdminAthletesClient() {
  const [athletes, setAthletes] = useState<AdminAthlete[]>([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("active");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isCreating, setCreating] = useState(false);

  const loadAthletes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = await getAthletes();
      setAthletes(payload.athletes);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar atletas.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      await createAthlete({ name, status });
      setName("");
      setStatus("active");
      setSuccess("Atleta criado com sucesso.");
      await loadAthletes();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Não foi possível criar atleta.");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    loadAthletes();
  }, [loadAthletes]);

  if (isLoading && athletes.length === 0) {
    return <AdminLoadingState label="Carregando atletas..." />;
  }

  if (error && athletes.length === 0) {
    return <AdminErrorState message={error} onRetry={loadAthletes} />;
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Cadastro</p>
          <h1>Atletas</h1>
          <span>Gerencie participantes e acompanhe quem está em tracking ativo.</span>
        </div>
        <button type="button" className="secondary-button" onClick={loadAthletes}>
          <RefreshCw size={18} aria-hidden="true" />
          Atualizar
        </button>
      </header>

      <section className="admin-panel">
        <div className="admin-section-heading">
          <h2>Novo atleta</h2>
        </div>

        <form className="admin-form admin-form-inline" onSubmit={handleCreate}>
          <label>
            <span className="field-label">Nome</span>
            <input
              required
              className="code-input admin-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome do atleta"
            />
          </label>

          <label>
            <span className="field-label">Status</span>
            <select
              className="admin-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>

          <button type="submit" className="primary-button" disabled={isCreating}>
            {isCreating ? (
              "Criando..."
            ) : (
              <>
                <UserPlus size={18} aria-hidden="true" />
                Novo atleta
              </>
            )}
          </button>
        </form>

        {success ? <p className="admin-success">{success}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </section>

      <section className="admin-panel">
        <div className="admin-section-heading">
          <h2>Atletas cadastrados</h2>
          <span>{athletes.length}</span>
        </div>

        {athletes.length === 0 ? (
          <EmptyState message="Nenhum atleta cadastrado ainda." />
        ) : (
          <div className="admin-list admin-athlete-list">
            {athletes.map((athlete) => (
              <article key={athlete.id} className="admin-list-row admin-athlete-card">
                <div className="admin-entity-main">
                  <strong>{athlete.name}</strong>
                  <span className="pill">{athlete.status}</span>
                  <span
                    className={
                      athlete.has_active_tracking
                        ? "admin-live-line live"
                        : "admin-live-line"
                    }
                  >
                    {athlete.has_active_tracking ? (
                      <>
                        <Radio size={14} aria-hidden="true" />
                        Ao vivo
                      </>
                    ) : (
                      "Sem sessão ativa"
                    )}
                  </span>
                </div>
                <div className="admin-row-actions">
                  {athlete.active_tracking_session ? (
                    <span className="pill">#{athlete.active_tracking_session.id}</span>
                  ) : null}
                  <button type="button" className="secondary-button admin-compact-button">
                    <Eye size={16} aria-hidden="true" />
                    Ver detalhes
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
