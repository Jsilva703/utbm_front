"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, CheckCircle2, Flag, Route, Users } from "lucide-react";
import { AdminRefreshButton } from "@/components/admin/AdminRefreshButton";
import { getDashboard } from "@/lib/admin/client";
import type { AdminDashboard } from "@/lib/admin/types";
import { pollingConfig } from "@/lib/config";
import { formatKm } from "@/lib/format";
import { useConditionalPolling } from "@/hooks/useConditionalPolling";
import { AdminErrorState, AdminLoadingState, EmptyState } from "@/components/admin/AdminState";

const dashboardCards = [
  { key: "total_athletes", label: "Atletas", icon: Users },
  { key: "athletes_tracking_now", label: "Rastreando agora", icon: Activity, featured: true },
  { key: "total_races", label: "Provas", icon: Flag },
  { key: "races_with_route", label: "Rotas disponíveis", icon: Route },
  { key: "active_tracking_sessions", label: "Sessões ativas", icon: Activity, featured: true },
  { key: "finished_tracking_sessions", label: "Sessões finalizadas", icon: CheckCircle2 },
] as const;

export function AdminDashboardClient() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setDashboard(await getDashboard());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o painel.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useConditionalPolling(
    Boolean(dashboard && dashboard.active_tracking_sessions > 0),
    loadDashboard,
    pollingConfig.adminTrackingMs,
  );

  if (isLoading && !dashboard) {
    return <AdminLoadingState label="Carregando dashboard..." />;
  }

  if (error || !dashboard) {
    return (
      <AdminErrorState
        message={error || "Não foi possível carregar o painel."}
        onRetry={loadDashboard}
      />
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Operação</p>
          <h1>Dashboard</h1>
          <span>Visão rápida da prova, atletas em campo e rotas prontas para uso.</span>
        </div>
        <AdminRefreshButton isRefreshing={isLoading} onRefresh={loadDashboard} />
      </header>

      <section className="admin-card-grid" aria-label="Indicadores">
        {dashboardCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.key}
              className={
                "featured" in card && card.featured
                  ? "admin-metric-card featured"
                  : "admin-metric-card"
              }
            >
              <span>
                <Icon size={18} aria-hidden="true" />
                {card.label}
              </span>
              <strong>{dashboard[card.key]}</strong>
            </article>
          );
        })}
      </section>

      <section className="admin-panel">
        <div className="admin-section-heading">
          <h2>Provas</h2>
        </div>

        {dashboard.races.length === 0 ? (
          <EmptyState message="Nenhuma prova cadastrada ainda." />
        ) : (
          <div className="admin-race-grid admin-dashboard-races">
            {dashboard.races.map((race) => (
              <article key={race.id} className="admin-race-card compact">
                <div className="admin-race-main">
                  <div>
                    <span className="admin-eyebrow">Race</span>
                    <strong>{race.name}</strong>
                    <span>{race.distance_km ? formatKm(race.distance_km) : "Distância no cadastro da prova"}</span>
                  </div>
                  <span className={race.active_tracking_sessions_count > 0 ? "pill pill-live" : "pill"}>
                    {race.active_tracking_sessions_count} ao vivo
                  </span>
                </div>
                <dl className="admin-mini-grid">
                  <div>
                    <dt>Rota</dt>
                    <dd>ver Provas</dd>
                  </div>
                  <div>
                    <dt>Atletas</dt>
                    <dd>{race.tracking_sessions_count}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
