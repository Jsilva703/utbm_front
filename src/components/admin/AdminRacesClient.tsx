"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { FileUp, RefreshCw, Route } from "lucide-react";
import { createRace, getRaces, uploadRaceRoute } from "@/lib/admin/client";
import type { AdminRace } from "@/lib/admin/types";
import { formatKm, formatMeters } from "@/lib/format";
import { AdminErrorState, AdminLoadingState, EmptyState } from "@/components/admin/AdminState";

type UploadState = {
  raceId: number | null;
  message: string | null;
  tone: "success" | "error" | null;
};

export function AdminRacesClient() {
  const [races, setRaces] = useState<AdminRace[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [status, setStatus] = useState("active");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    raceId: null,
    message: null,
    tone: null,
  });
  const [isLoading, setLoading] = useState(true);
  const [isCreating, setCreating] = useState(false);

  const loadRaces = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = await getRaces();
      setRaces(payload.races);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar provas.");
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
      await createRace({
        name,
        slug,
        distance_km: Number(distanceKm),
        status,
      });
      setName("");
      setSlug("");
      setDistanceKm("");
      setStatus("active");
      setSuccess("Prova criada com sucesso.");
      await loadRaces();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Não foi possível criar prova.");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpload(race: AdminRace, file?: File) {
    if (!file) {
      return;
    }

    setUploadState({ raceId: race.id, message: "Enviando GPX...", tone: null });

    try {
      const payload = await uploadRaceRoute(race.id, file);
      setUploadState({
        raceId: race.id,
        message: `Rota importada: ${payload.route.points_count} pontos, ${formatMeters(
          payload.route.total_distance_m,
        )}.`,
        tone: "success",
      });
      await loadRaces();
    } catch (uploadError) {
      setUploadState({
        raceId: race.id,
        message:
          uploadError instanceof Error
            ? uploadError.message
            : "Não foi possível importar a rota GPX.",
        tone: "error",
      });
    }
  }

  useEffect(() => {
    loadRaces();
  }, [loadRaces]);

  if (isLoading && races.length === 0) {
    return <AdminLoadingState label="Carregando provas..." />;
  }

  if (error && races.length === 0) {
    return <AdminErrorState message={error} onRetry={loadRaces} />;
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Eventos e percursos</p>
          <h1>Provas</h1>
        </div>
        <button type="button" className="secondary-button" onClick={loadRaces}>
          <RefreshCw size={18} aria-hidden="true" />
          Atualizar
        </button>
      </header>

      <section className="admin-panel">
        <div className="admin-section-heading">
          <h2>Nova prova</h2>
        </div>

        <form className="admin-form admin-form-grid" onSubmit={handleCreate}>
          <label>
            <span className="field-label">Nome</span>
            <input
              required
              className="code-input admin-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="UTMB Paraty 58K"
            />
          </label>

          <label>
            <span className="field-label">Slug</span>
            <input
              required
              className="code-input admin-input"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="utmb-paraty-58k"
            />
          </label>

          <label>
            <span className="field-label">Distância km</span>
            <input
              required
              className="code-input admin-input"
              inputMode="decimal"
              value={distanceKm}
              onChange={(event) => setDistanceKm(event.target.value)}
              placeholder="58"
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
            {isCreating ? "Criando..." : "Criar prova"}
          </button>
        </form>

        {success ? <p className="admin-success">{success}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </section>

      <section className="admin-panel">
        <div className="admin-section-heading">
          <h2>Provas cadastradas</h2>
          <span>{races.length}</span>
        </div>

        {races.length === 0 ? (
          <EmptyState message="Nenhuma prova cadastrada ainda." />
        ) : (
          <div className="admin-race-grid">
            {races.map((race) => (
              <article key={race.id} className="admin-race-card">
                <div className="admin-race-main">
                  <div>
                    <strong>{race.name}</strong>
                    <span>{race.slug}</span>
                  </div>
                  <span className={race.has_route ? "pill pill-live" : "pill"}>
                    <Route size={14} aria-hidden="true" />
                    {race.has_route ? "com rota" : "sem rota"}
                  </span>
                </div>

                <dl className="admin-mini-grid">
                  <div>
                    <dt>Distância</dt>
                    <dd>{formatKm(Number(race.distance_km))}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{race.status}</dd>
                  </div>
                  <div>
                    <dt>RoutePoints</dt>
                    <dd>{race.route_points_count}</dd>
                  </div>
                  <div>
                    <dt>Sessões</dt>
                    <dd>{race.tracking_sessions_count}</dd>
                  </div>
                  <div>
                    <dt>Ativas</dt>
                    <dd>{race.active_tracking_sessions_count}</dd>
                  </div>
                </dl>

                <label className="admin-upload-button">
                  <FileUp size={18} aria-hidden="true" />
                  Importar GPX
                  <input
                    type="file"
                    accept=".gpx,application/gpx+xml"
                    onChange={(event) => handleUpload(race, event.target.files?.[0])}
                  />
                </label>

                {uploadState.raceId === race.id && uploadState.message ? (
                  <p
                    className={
                      uploadState.tone === "success" ? "admin-success" : "form-error"
                    }
                  >
                    {uploadState.message}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
