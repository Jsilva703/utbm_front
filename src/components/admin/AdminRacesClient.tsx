"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Plus, Route, Trash2, X } from "lucide-react";
import { getRaces } from "@/lib/admin/client";
import type { AdminRace } from "@/lib/admin/types";
import { AdminRefreshButton } from "@/components/admin/AdminRefreshButton";
import { formatKm } from "@/lib/format";
import { pollingConfig } from "@/lib/config";
import { useConditionalPolling } from "@/hooks/useConditionalPolling";
import { AdminDetailDialog } from "@/components/admin/AdminDetailDialog";
import { AdminErrorState, AdminLoadingState, EmptyState } from "@/components/admin/AdminState";

export function AdminRacesClient() {
  const [races, setRaces] = useState<AdminRace[]>([]);
  const [hiddenRaceIds, setHiddenRaceIds] = useState<number[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const visibleRaces = useMemo(
    () => races.filter((race) => !hiddenRaceIds.includes(race.id)),
    [hiddenRaceIds, races],
  );

  const summary = useMemo(
    () => ({
      total: visibleRaces.length,
      withRoute: visibleRaces.filter((race) => race.has_route).length,
      activeTracking: visibleRaces.reduce(
        (total, race) => total + race.active_tracking_sessions_count,
        0,
      ),
    }),
    [visibleRaces],
  );

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
          <span>Liste provas cadastradas, rotas oficiais e sessões ativas.</span>
        </div>
        <div className="admin-page-actions">
          <AdminRefreshButton isRefreshing={isLoading} onRefresh={loadRaces} />
          <Link href="/admin/races/new" className="primary-button admin-compact-button">
            <Plus size={16} aria-hidden="true" />
            Nova prova
          </Link>
        </div>
      </header>

      <section className="admin-race-summary-strip" aria-label="Resumo das provas">
        <div>
          <span>Provas visíveis</span>
          <strong>{summary.total}</strong>
        </div>
        <div>
          <span>Rotas disponíveis</span>
          <strong>{summary.withRoute}</strong>
        </div>
        <div>
          <span>Tracking ativo</span>
          <strong>{summary.activeTracking}</strong>
        </div>
      </section>

      <section className="admin-panel admin-race-list-panel">
        <div className="admin-race-list-toolbar">
          <div>
            <p className="admin-eyebrow">Provas cadastradas</p>
            <h2>Lista operacional</h2>
            <span>Ocultar remove a prova apenas desta visualização local. O backend não é alterado.</span>
          </div>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

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
