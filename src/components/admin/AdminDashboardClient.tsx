"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, CheckCircle2, Flag, Route, Users } from "lucide-react";
import { getDashboard } from "@/lib/admin/client";
import type { AdminDashboard } from "@/lib/admin/types";
import { AdminErrorState, AdminLoadingState, EmptyState } from "@/components/admin/AdminState";

const dashboardCards = [
  { key: "total_athletes", label: "Total de atletas", icon: Users },
  { key: "athletes_tracking_now", label: "Rastreando agora", icon: Activity },
  { key: "total_races", label: "Total de provas", icon: Flag },
  { key: "races_with_route", label: "Provas com rota", icon: Route },
  { key: "active_tracking_sessions", label: "Sessões ativas", icon: Activity },
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

  if (isLoading) {
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
        </div>
      </header>

      <section className="admin-card-grid" aria-label="Indicadores">
        {dashboardCards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.key} className="admin-metric-card">
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
          <h2>Resumo por prova</h2>
        </div>

        {dashboard.races.length === 0 ? (
          <EmptyState message="Nenhuma prova cadastrada ainda." />
        ) : (
          <div className="admin-list">
            {dashboard.races.map((race) => (
              <article key={race.id} className="admin-list-row">
                <div>
                  <strong>{race.name}</strong>
                  <span>{race.tracking_sessions_count} sessões cadastradas</span>
                </div>
                <span className="pill">{race.active_tracking_sessions_count} ativas</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
