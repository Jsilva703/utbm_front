"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Copy, MapPin, Radio, RefreshCw } from "lucide-react";
import {
  createTrackingSession,
  getAthletes,
  getRaces,
  getTrackingSessions,
} from "@/lib/admin/client";
import type { AdminAthlete, AdminRace, AdminTrackingSession } from "@/lib/admin/types";
import { formatClock, formatMeters } from "@/lib/format";
import { AdminErrorState, AdminLoadingState, EmptyState } from "@/components/admin/AdminState";

type CreatedSession = {
  public_token: string;
  ingest_token?: string;
};

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
  const [createdSession, setCreatedSession] = useState<CreatedSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isCreating, setCreating] = useState(false);

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
      setCreatedSession({
        public_token: payload.tracking_session.public_token,
        ingest_token: payload.tracking_session.ingest_token,
      });
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
            <span>public_token: {createdSession.public_token}</span>
            <span>ingest_token: {createdSession.ingest_token}</span>
            <p>O ingest_token é sensível. Ele não foi salvo permanentemente no browser.</p>
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
                  <button
                    type="button"
                    className="icon-button admin-copy-button"
                    title="Copiar public_token"
                    onClick={() => navigator.clipboard?.writeText(session.public_token)}
                  >
                    <Copy size={16} aria-hidden="true" />
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
