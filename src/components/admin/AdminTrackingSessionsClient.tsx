"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Eye, MapPin, Radio, RefreshCw } from "lucide-react";
import {
  createTrackingSession,
  getAthletes,
  getRaces,
  getTrackingSessions,
} from "@/lib/admin/client";
import type { AdminAthlete, AdminRace, AdminTrackingSession } from "@/lib/admin/types";
import { formatClock, formatMeters } from "@/lib/format";
import { AdminDetailDialog } from "@/components/admin/AdminDetailDialog";
import { AdminErrorState, AdminLoadingState, EmptyState } from "@/components/admin/AdminState";

function locationLabel(session: AdminTrackingSession) {
  const location = session.latest_location;

  if (!location) {
    return "Sem localização";
  }

  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} - ${formatClock(
    location.recorded_at,
  )}`;
}

export function AdminTrackingSessionsClient() {
  const [sessions, setSessions] = useState<AdminTrackingSession[]>([]);
  const [athletes, setAthletes] = useState<AdminAthlete[]>([]);
  const [races, setRaces] = useState<AdminRace[]>([]);
  const [athleteId, setAthleteId] = useState("");
  const [raceId, setRaceId] = useState("");
  const [filter, setFilter] = useState("all");
  const [createdSession, setCreatedSession] = useState<AdminTrackingSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isCreating, setCreating] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AdminTrackingSession | null>(null);

  const query = useMemo(() => {
    if (filter === "active") {
      return "?active=true";
    }

    if (filter === "finished") {
      return "?finished=true";
    }

    return "";
  }, [filter]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [sessionsPayload, athletesPayload, racesPayload] = await Promise.all([
        getTrackingSessions(query),
        getAthletes(),
        getRaces(),
      ]);

      setSessions(sessionsPayload.tracking_sessions);
      setAthletes(athletesPayload.athletes);
      setRaces(racesPayload.races);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Não foi possível carregar sessões.",
      );
    } finally {
      setLoading(false);
    }
  }, [query]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    setCreatedSession(null);

    try {
      const payload = await createTrackingSession({
        athlete_id: Number(athleteId),
        race_id: Number(raceId),
      });
      setCreatedSession(payload.tracking_session);
      setAthleteId("");
      setRaceId("");
      await loadPage();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Não foi possível criar sessão de tracking.",
      );
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  if (isLoading && sessions.length === 0) {
    return <AdminLoadingState label="Carregando sessões..." />;
  }

  if (error && sessions.length === 0) {
    return <AdminErrorState message={error} onRetry={loadPage} />;
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Monitoramento</p>
          <h1>Tracking</h1>
          <span>Crie sessões e acompanhe o estado operacional dos atletas.</span>
        </div>
        <button type="button" className="secondary-button" onClick={loadPage}>
          <RefreshCw size={18} aria-hidden="true" />
          Atualizar
        </button>
      </header>

      <section className="admin-panel">
        <div className="admin-section-heading">
          <h2>Nova sessão</h2>
        </div>

        <form className="admin-form admin-form-inline" onSubmit={handleCreate}>
          <label>
            <span className="field-label">Atleta</span>
            <select
              required
              className="admin-select"
              value={athleteId}
              onChange={(event) => setAthleteId(event.target.value)}
            >
              <option value="">Selecione</option>
              {athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="field-label">Prova</span>
            <select
              required
              className="admin-select"
              value={raceId}
              onChange={(event) => setRaceId(event.target.value)}
            >
              <option value="">Selecione</option>
              {races.map((race) => (
                <option key={race.id} value={race.id}>
                  {race.name}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="primary-button" disabled={isCreating}>
            {isCreating ? "Criando..." : "Criar sessão"}
          </button>
        </form>

        {createdSession ? (
          <div className="admin-secret-box">
            <strong>Sessão criada</strong>
            <span>Atleta: {createdSession.athlete.name}</span>
            <span>Prova: {createdSession.race.name}</span>
            <span>Status: {createdSession.status}</span>
            <span>Código do atleta: {createdSession.athlete_access_code || "-"}</span>
            <span>Início: {formatClock(createdSession.started_at)}</span>
            <p>Entregue o código do atleta para o celular que fará a transmissão.</p>
            <button
              type="button"
              className="secondary-button admin-compact-button"
              onClick={() =>
                navigator.clipboard?.writeText(createdSession.athlete_access_code || "")
              }
              disabled={!createdSession.athlete_access_code}
            >
              <Copy size={16} aria-hidden="true" />
              Copiar código
            </button>
          </div>
        ) : null}

        {error ? <p className="form-error">{error}</p> : null}
      </section>

      <section className="admin-panel">
        <div className="admin-section-heading admin-filter-heading">
          <h2>Sessões</h2>
          <select
            className="admin-select admin-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">Todas</option>
            <option value="active">Ativas</option>
            <option value="finished">Finalizadas</option>
          </select>
        </div>

        {sessions.length === 0 ? (
          <EmptyState message="Nenhuma sessão encontrada." />
        ) : (
          <div className="admin-list admin-session-list">
            {sessions.map((session) => (
              <article key={session.id} className="admin-list-row admin-session-row">
                <div className="admin-entity-main">
                  <strong>{session.athlete.name}</strong>
                  <span>{session.race.name}</span>
                  <span className="admin-location-line">
                    <MapPin size={14} aria-hidden="true" />
                    {locationLabel(session)}
                  </span>
                </div>
                <div className="admin-token-stack">
                  <span
                    className={
                      session.status === "active"
                        ? "pill pill-live admin-status-pill"
                        : "pill pill-finished admin-status-pill"
                    }
                  >
                    {session.status === "active" ? (
                      <>
                        <Radio size={14} aria-hidden="true" />
                        AO VIVO
                      </>
                    ) : (
                      "Finalizada"
                    )}
                  </span>
                  <span>Início: {formatClock(session.started_at)}</span>
                  <span>Fim: {formatClock(session.finished_at)}</span>
                  <span>Precisão: {formatMeters(session.latest_location?.accuracy)}</span>
                  {session.athlete_access_code ? (
                    <span>Código: {session.athlete_access_code}</span>
                  ) : null}
                  <button
                    type="button"
                    className="icon-button admin-copy-button"
                    title="Copiar código do atleta"
                    onClick={() =>
                      navigator.clipboard?.writeText(session.athlete_access_code || "")
                    }
                    disabled={!session.athlete_access_code}
                  >
                    <Copy size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="secondary-button admin-compact-button"
                    onClick={() => setSelectedSession(session)}
                  >
                    <Eye size={16} aria-hidden="true" />
                    Ver detalhes
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedSession ? (
        <AdminDetailDialog
          eyebrow="Tracking Session"
          title={selectedSession.athlete.name}
          onClose={() => setSelectedSession(null)}
        >
          <dl className="admin-detail-grid">
            <div>
              <dt>Atleta</dt>
              <dd>{selectedSession.athlete.name}</dd>
            </div>
            <div>
              <dt>Prova</dt>
              <dd>{selectedSession.race.name}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{selectedSession.status}</dd>
            </div>
            <div>
              <dt>Código do atleta</dt>
              <dd>{selectedSession.athlete_access_code || "-"}</dd>
            </div>
            <div>
              <dt>Início</dt>
              <dd>{formatClock(selectedSession.started_at)}</dd>
            </div>
            <div>
              <dt>Fim</dt>
              <dd>{formatClock(selectedSession.finished_at)}</dd>
            </div>
            <div>
              <dt>Última posição</dt>
              <dd>{locationLabel(selectedSession)}</dd>
            </div>
            <div>
              <dt>Precisão</dt>
              <dd>{formatMeters(selectedSession.latest_location?.accuracy)}</dd>
            </div>
          </dl>
        </AdminDetailDialog>
      ) : null}
    </div>
  );
}
