"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Eye, FileUp, RefreshCw, Route } from "lucide-react";
import { createRace, getRaces, uploadRaceRoute } from "@/lib/admin/client";
import type { AdminRace, AdminRouteImport } from "@/lib/admin/types";
import { formatKm, formatMeters } from "@/lib/format";
import { AdminDetailDialog } from "@/components/admin/AdminDetailDialog";
import { AdminErrorState, AdminLoadingState, EmptyState } from "@/components/admin/AdminState";

type UploadState = {
  raceId: number | null;
  fileName?: string;
  message: string | null;
  tone: "success" | "error" | null;
};

export function AdminRacesClient() {
  const [races, setRaces] = useState<AdminRace[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [status, setStatus] = useState("active");
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdRoute, setCreatedRoute] = useState<AdminRouteImport["route"] | null>(null);
  const [createStep, setCreateStep] = useState<string | null>(null);
  const [retryUpload, setRetryUpload] = useState<{ race: AdminRace; file: File } | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    raceId: null,
    message: null,
    tone: null,
  });
  const [isLoading, setLoading] = useState(true);
  const [isCreating, setCreating] = useState(false);
  const [selectedRace, setSelectedRace] = useState<AdminRace | null>(null);

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
    if (!gpxFile) {
      setError("Selecione um arquivo GPX para criar a prova.");
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(null);
    setCreatedRoute(null);
    setRetryUpload(null);

    try {
      setCreateStep("Criando prova...");
      const payload = await createRace({
        name,
        slug,
        distance_km: Number(distanceKm),
        status,
      });

      try {
        setCreateStep("Importando rota...");
        const routePayload = await uploadRaceRoute(payload.race.id, gpxFile);
        setCreatedRoute(routePayload.route);
        setSuccess(
          `Prova criada e rota importada: ${routePayload.route.points_count} pontos, ${formatMeters(
            routePayload.route.total_distance_m,
          )}.`,
        );
        setName("");
        setSlug("");
        setDistanceKm("");
        setStatus("active");
        setGpxFile(null);
      } catch (uploadError) {
        setRetryUpload({ race: payload.race, file: gpxFile });
        setError(
          uploadError instanceof Error
            ? `Prova criada, mas a rota não foi importada. ${uploadError.message}`
            : "Prova criada, mas a rota não foi importada.",
        );
      }

      await loadRaces();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Não foi possível criar prova.");
    } finally {
      setCreating(false);
      setCreateStep(null);
    }
  }

  async function handleRetryCreatedRoute() {
    if (!retryUpload) {
      return;
    }

    setCreating(true);
    setCreateStep("Importando rota...");
    setError(null);
    setSuccess(null);

    try {
      const routePayload = await uploadRaceRoute(retryUpload.race.id, retryUpload.file);
      setCreatedRoute(routePayload.route);
      setRetryUpload(null);
      setName("");
      setSlug("");
      setDistanceKm("");
      setStatus("active");
      setGpxFile(null);
      setSuccess(
        `Rota importada: ${routePayload.route.points_count} pontos, ${formatMeters(
          routePayload.route.total_distance_m,
        )}.`,
      );
      await loadRaces();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? `Prova criada, mas a rota não foi importada. ${uploadError.message}`
          : "Prova criada, mas a rota não foi importada.",
      );
    } finally {
      setCreating(false);
      setCreateStep(null);
    }
  }

  async function handleUpload(race: AdminRace, file?: File) {
    if (!file) {
      return;
    }

    setUploadState({
      raceId: race.id,
      fileName: file.name,
      message: "Enviando GPX...",
      tone: null,
    });

    try {
      const payload = await uploadRaceRoute(race.id, file);
      setUploadState({
        raceId: race.id,
        fileName: file.name,
        message: `Rota importada: ${payload.route.points_count} pontos, ${formatMeters(
          payload.route.total_distance_m,
        )}.`,
        tone: "success",
      });
      await loadRaces();
    } catch (uploadError) {
      setUploadState({
        raceId: race.id,
        fileName: file.name,
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
          <span>Cadastre provas e importe a rota oficial em GPX.</span>
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

          <label className="admin-create-upload">
            <span className="field-label">Arquivo GPX</span>
            <span className="admin-upload-dropzone">
              <FileUp size={22} aria-hidden="true" />
              <strong>Importar rota GPX</strong>
              <span>{gpxFile ? gpxFile.name : "Arraste o arquivo aqui ou selecione um arquivo"}</span>
              <input
                required
                type="file"
                accept=".gpx,application/gpx+xml"
                onChange={(event) => setGpxFile(event.target.files?.[0] || null)}
              />
            </span>
          </label>

          <button type="submit" className="primary-button" disabled={isCreating}>
            {isCreating ? createStep || "Criando..." : "Criar prova"}
          </button>
        </form>

        {success ? <p className="admin-success">{success}</p> : null}
        {createdRoute ? (
          <dl className="admin-detail-grid admin-route-import-summary">
            <div>
              <dt>Arquivo</dt>
              <dd>{createdRoute.source_filename}</dd>
            </div>
            <div>
              <dt>Pontos</dt>
              <dd>{createdRoute.points_count}</dd>
            </div>
            <div>
              <dt>Distância processada</dt>
              <dd>{formatMeters(createdRoute.total_distance_m)}</dd>
            </div>
          </dl>
        ) : null}
        {retryUpload ? (
          <button
            type="button"
            className="secondary-button"
            onClick={handleRetryCreatedRoute}
            disabled={isCreating}
          >
            <FileUp size={18} aria-hidden="true" />
            Tentar importar GPX novamente
          </button>
        ) : null}
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
                    {race.has_route ? "rota disponível" : "sem rota"}
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
                    <dt>Atletas vinculados</dt>
                    <dd>{race.tracking_sessions_count}</dd>
                  </div>
                  <div>
                    <dt>Tracking ativo</dt>
                    <dd>{race.active_tracking_sessions_count}</dd>
                  </div>
                </dl>

                <div className="admin-race-actions">
                  <button
                    type="button"
                    className="secondary-button admin-compact-button"
                    onClick={() => setSelectedRace(race)}
                  >
                    <Eye size={16} aria-hidden="true" />
                    Ver
                  </button>

                  <label className="admin-upload-dropzone">
                    <FileUp size={22} aria-hidden="true" />
                    <strong>Importar rota GPX</strong>
                    <span>Arraste o arquivo aqui ou selecione um arquivo</span>
                    <input
                      type="file"
                      accept=".gpx,application/gpx+xml"
                      onChange={(event) => handleUpload(race, event.target.files?.[0])}
                    />
                  </label>
                </div>

                {uploadState.raceId === race.id && uploadState.message ? (
                  <div className="admin-upload-result">
                    {uploadState.fileName ? <strong>{uploadState.fileName}</strong> : null}
                    <p
                      className={
                        uploadState.tone === "success" ? "admin-success" : "form-error"
                      }
                    >
                      {uploadState.message}
                    </p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedRace ? (
        <AdminDetailDialog
          eyebrow="Prova"
          title={selectedRace.name}
          onClose={() => setSelectedRace(null)}
        >
          <dl className="admin-detail-grid">
            <div>
              <dt>Slug</dt>
              <dd>{selectedRace.slug}</dd>
            </div>
            <div>
              <dt>Distância cadastrada</dt>
              <dd>{formatKm(Number(selectedRace.distance_km))}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{selectedRace.status}</dd>
            </div>
            <div>
              <dt>Rota</dt>
              <dd>{selectedRace.has_route ? "Disponível" : "Não disponível"}</dd>
            </div>
            <div>
              <dt>RoutePoints</dt>
              <dd>{selectedRace.route_points_count}</dd>
            </div>
            <div>
              <dt>Atletas vinculados</dt>
              <dd>{selectedRace.tracking_sessions_count}</dd>
            </div>
            <div>
              <dt>Tracking ativo</dt>
              <dd>{selectedRace.active_tracking_sessions_count}</dd>
            </div>
          </dl>
        </AdminDetailDialog>
      ) : null}
    </div>
  );
}
