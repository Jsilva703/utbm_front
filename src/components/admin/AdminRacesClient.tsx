"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CheckCircle2, Eye, FileUp, ListChecks, Plus, Route, Trash2, X } from "lucide-react";
import { createRace, getRaces, uploadRaceRoute } from "@/lib/admin/client";
import type { AdminRace, AdminRouteImport } from "@/lib/admin/types";
import { AdminRefreshButton } from "@/components/admin/AdminRefreshButton";
import { formatKm, formatMeters } from "@/lib/format";
import { pollingConfig } from "@/lib/config";
import { useConditionalPolling } from "@/hooks/useConditionalPolling";
import { AdminDetailDialog } from "@/components/admin/AdminDetailDialog";
import { AdminErrorState, AdminLoadingState, EmptyState } from "@/components/admin/AdminState";

type RaceTab = "list" | "create";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeDistance(value: string) {
  const normalized = value.replace(",", ".").replace(/[^0-9.]/g, "");
  const [integerPart, ...decimalParts] = normalized.split(".");
  return decimalParts.length > 0 ? `${integerPart}.${decimalParts.join("")}` : integerPart;
}

export function AdminRacesClient() {
  const [races, setRaces] = useState<AdminRace[]>([]);
  const [activeTab, setActiveTab] = useState<RaceTab>("list");
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
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [hiddenRaceIds, setHiddenRaceIds] = useState<number[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isCreating, setCreating] = useState(false);
  const [selectedRace, setSelectedRace] = useState<AdminRace | null>(null);
  const [raceToHide, setRaceToHide] = useState<AdminRace | null>(null);

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

  const visibleRaces = races.filter((race) => !hiddenRaceIds.includes(race.id));
  const distanceNumber = Number(distanceKm);
  const fieldErrors = {
    name: name.trim() ? null : "Informe o nome da prova.",
    slug: slugPattern.test(slug) ? null : "Use apenas letras minúsculas, números e hífens.",
    distanceKm:
      distanceKm && Number.isFinite(distanceNumber) && distanceNumber > 0
        ? null
        : "Informe uma distância válida maior que zero.",
    gpxFile: gpxFile ? null : "Selecione o GPX da rota oficial.",
  };
  const isFormValid = Object.values(fieldErrors).every((value) => value === null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({
      name: true,
      slug: true,
      distanceKm: true,
      gpxFile: true,
    });

    if (!isFormValid || !gpxFile) {
      setError("Revise os campos obrigatórios antes de criar a prova.");
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
        distance_km: distanceNumber,
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
        resetForm();
        setActiveTab("list");
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
      resetForm();
      setActiveTab("list");
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

  function resetForm() {
    setName("");
    setSlug("");
    setDistanceKm("");
    setStatus("active");
    setGpxFile(null);
    setTouched({});
  }

  function confirmHideRace() {
    if (!raceToHide) {
      return;
    }

    setHiddenRaceIds((current) => [...current, raceToHide.id]);
    setRaceToHide(null);
  }

  useEffect(() => {
    loadRaces();
  }, [loadRaces]);

  useConditionalPolling(
    races.some((race) => race.active_tracking_sessions_count > 0),
    loadRaces,
    pollingConfig.adminTrackingMs,
  );

  if (isLoading && races.length === 0) {
    return <AdminLoadingState label="Carregando provas..." />;
  }

  if (error && races.length === 0) {
    return <AdminErrorState message={error} onRetry={loadRaces} />;
  }

  return (
    <div className="admin-page admin-races-page">
      <header className="admin-page-header admin-races-header">
        <div>
          <p className="admin-eyebrow">Eventos e percursos</p>
          <h1>Provas</h1>
          <span>Organize provas, rotas oficiais e acompanhamento ativo em um só painel.</span>
        </div>
        <AdminRefreshButton isRefreshing={isLoading} onRefresh={loadRaces} />
      </header>

      <div className="admin-races-tabs" role="tablist" aria-label="Seções de provas">
        <button
          type="button"
          className={activeTab === "list" ? "active" : undefined}
          onClick={() => setActiveTab("list")}
          role="tab"
          aria-selected={activeTab === "list"}
        >
          <ListChecks size={17} aria-hidden="true" />
          Provas cadastradas
          <span>{visibleRaces.length}</span>
        </button>
        <button
          type="button"
          className={activeTab === "create" ? "active" : undefined}
          onClick={() => setActiveTab("create")}
          role="tab"
          aria-selected={activeTab === "create"}
        >
          <Plus size={17} aria-hidden="true" />
          Nova prova
        </button>
      </div>

      {activeTab === "create" ? (
        <section className="admin-panel admin-race-create-panel">
          <div className="admin-race-panel-intro">
            <div>
              <p className="admin-eyebrow">Nova prova</p>
              <h2>Criar prova e importar GPX</h2>
              <span>O cadastro cria a prova e, em seguida, processa a rota oficial selecionada.</span>
            </div>
            {createStep ? <span className="pill pill-live">{createStep}</span> : null}
          </div>

          <form className="admin-form admin-race-form" onSubmit={handleCreate} noValidate>
            <label className={touched.name && fieldErrors.name ? "field-invalid" : undefined}>
              <span className="field-label">Nome</span>
              <input
                required
                className="code-input admin-input"
                value={name}
                onBlur={() => setTouched((current) => ({ ...current, name: true }))}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setName(nextName);
                  if (!slug || slug === normalizeSlug(name)) {
                    setSlug(normalizeSlug(nextName));
                  }
                }}
                placeholder="UTMB Paraty 58K"
              />
              {touched.name && fieldErrors.name ? <span className="field-hint error">{fieldErrors.name}</span> : null}
            </label>

            <label className={touched.slug && fieldErrors.slug ? "field-invalid" : undefined}>
              <span className="field-label">Slug</span>
              <input
                required
                className="code-input admin-input"
                value={slug}
                onBlur={() => {
                  setSlug((value) => normalizeSlug(value));
                  setTouched((current) => ({ ...current, slug: true }));
                }}
                onChange={(event) => setSlug(normalizeSlug(event.target.value))}
                placeholder="utmb-paraty-58k"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              />
              {touched.slug && fieldErrors.slug ? <span className="field-hint error">{fieldErrors.slug}</span> : null}
            </label>

            <label className={touched.distanceKm && fieldErrors.distanceKm ? "field-invalid" : undefined}>
              <span className="field-label">Distância km</span>
              <input
                required
                className="code-input admin-input"
                type="text"
                inputMode="decimal"
                value={distanceKm}
                onBlur={() => setTouched((current) => ({ ...current, distanceKm: true }))}
                onChange={(event) => setDistanceKm(normalizeDistance(event.target.value))}
                placeholder="58"
              />
              {touched.distanceKm && fieldErrors.distanceKm ? (
                <span className="field-hint error">{fieldErrors.distanceKm}</span>
              ) : null}
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

            <label
              className={
                touched.gpxFile && fieldErrors.gpxFile
                  ? "admin-create-upload field-invalid"
                  : "admin-create-upload"
              }
            >
              <span className="field-label">Arquivo GPX</span>
              <span className={gpxFile ? "admin-upload-dropzone loaded" : "admin-upload-dropzone"}>
                {gpxFile ? <CheckCircle2 size={24} aria-hidden="true" /> : <FileUp size={24} aria-hidden="true" />}
                <strong>{gpxFile ? "GPX selecionado" : "Importar rota GPX"}</strong>
                <span>{gpxFile ? gpxFile.name : "Arraste o arquivo aqui ou selecione um arquivo"}</span>
                <input
                  required
                  type="file"
                  accept=".gpx,application/gpx+xml"
                  onBlur={() => setTouched((current) => ({ ...current, gpxFile: true }))}
                  onChange={(event) => {
                    setGpxFile(event.target.files?.[0] || null);
                    setTouched((current) => ({ ...current, gpxFile: true }));
                  }}
                />
              </span>
              {touched.gpxFile && fieldErrors.gpxFile ? <span className="field-hint error">{fieldErrors.gpxFile}</span> : null}
            </label>

            <div className="admin-race-submit-row">
              <button type="submit" className="primary-button" disabled={isCreating || !isFormValid}>
                {isCreating ? createStep || "Criando..." : "Criar prova e importar rota"}
              </button>
              <span>{isFormValid ? "Pronto para criar a prova." : "Preencha os campos obrigatórios para continuar."}</span>
            </div>
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
            <div className="admin-partial-failure">
              <div>
                <strong>Prova criada, mas a rota não foi importada.</strong>
                <span>Você pode tentar enviar o GPX novamente sem recriar a prova.</span>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={handleRetryCreatedRoute}
                disabled={isCreating}
              >
                <FileUp size={18} aria-hidden="true" />
                Tentar importar GPX novamente
              </button>
            </div>
          ) : null}
          {error ? <p className="form-error">{error}</p> : null}
        </section>
      ) : (
        <section className="admin-panel admin-race-list-panel">
          <div className="admin-race-list-toolbar">
            <div>
              <p className="admin-eyebrow">Provas cadastradas</p>
              <h2>{visibleRaces.length} provas visíveis</h2>
              <span>Itens ocultos saem apenas desta visualização local. O backend não é alterado.</span>
            </div>
            <button type="button" className="primary-button admin-compact-button" onClick={() => setActiveTab("create")}>
              <Plus size={16} aria-hidden="true" />
              Nova prova
            </button>
          </div>

          {visibleRaces.length === 0 ? (
            <EmptyState
              message={
                hiddenRaceIds.length > 0
                  ? "Todas as provas foram ocultadas nesta visualização."
                  : "Nenhuma prova cadastrada ainda."
              }
            />
          ) : (
            <div className="admin-race-grid admin-race-grid-refined">
              {visibleRaces.map((race) => (
                <article key={race.id} className="admin-race-card admin-race-card-refined">
                  <div className="admin-race-main">
                    <div>
                      <span className="admin-eyebrow">Prova</span>
                      <strong>{race.name}</strong>
                      <span>{race.slug}</span>
                    </div>
                    <span className={race.has_route ? "pill pill-live" : "pill"}>
                      <Route size={14} aria-hidden="true" />
                      {race.has_route ? "rota disponível" : "sem rota"}
                    </span>
                  </div>

                  <dl className="admin-mini-grid admin-race-facts">
                    <div>
                      <dt>Distância</dt>
                      <dd>{formatKm(Number(race.distance_km))}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{race.status}</dd>
                    </div>
                    <div>
                      <dt>Pontos da rota</dt>
                      <dd>{race.has_route ? race.route_points_count : "-"}</dd>
                    </div>
                    <div>
                      <dt>Distância processada</dt>
                      <dd>{race.has_route ? formatKm(Number(race.distance_km)) : "-"}</dd>
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

                  <div className="admin-race-actions refined">
                    <button
                      type="button"
                      className="secondary-button admin-compact-button"
                      onClick={() => setSelectedRace(race)}
                    >
                      <Eye size={16} aria-hidden="true" />
                      Ver detalhes
                    </button>
                    <button
                      type="button"
                      className="danger-button admin-compact-button"
                      onClick={() => setRaceToHide(race)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      Ocultar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

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
              <dt>Arquivo GPX</dt>
              <dd>{selectedRace.has_route ? "Importado" : "-"}</dd>
            </div>
            <div>
              <dt>Total de pontos</dt>
              <dd>{selectedRace.route_points_count}</dd>
            </div>
            <div>
              <dt>Distância processada</dt>
              <dd>{selectedRace.has_route ? formatKm(Number(selectedRace.distance_km)) : "-"}</dd>
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

      {raceToHide ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="hide-race-title">
          <section className="modal admin-hide-modal">
            <button
              type="button"
              className="icon-button admin-modal-close"
              onClick={() => setRaceToHide(null)}
              aria-label="Fechar"
            >
              <X size={18} aria-hidden="true" />
            </button>
            <div>
              <p className="admin-eyebrow">Ação local</p>
              <h2 id="hide-race-title">Ocultar prova da lista?</h2>
              <p>
                {raceToHide.name} será removida apenas desta visualização do admin. Nenhum dado será apagado do backend.
              </p>
            </div>
            <div className="modal-actions">
              <button type="button" className="danger-button" onClick={confirmHideRace}>
                <Trash2 size={18} aria-hidden="true" />
                Ocultar da lista
              </button>
              <button type="button" className="secondary-button" onClick={() => setRaceToHide(null)}>
                Cancelar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
