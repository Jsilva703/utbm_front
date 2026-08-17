"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Brand } from "@/components/Brand";
import { AthleteHeader } from "@/components/AthleteHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { DetailsPanel } from "@/components/DetailsPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { LastUpdate } from "@/components/LastUpdate";
import { TrackingStats } from "@/components/TrackingStats";
import { pollingConfig } from "@/lib/config";
import type { PublicLocationsResponse, PublicTrackingResponse } from "@/lib/api/types";

type Tab = "map" | "details" | "history";

const TrailMap = dynamic(
  () => import("@/components/TrailMap").then((module) => module.TrailMap),
  {
    ssr: false,
    loading: () => (
      <section className="map-shell" aria-label="Mapa carregando">
        <div className="map-empty">
          <div>
            <div className="spinner" />
            <p>Carregando mapa...</p>
          </div>
        </div>
      </section>
    ),
  },
);

function appendHistory(
  current: PublicLocationsResponse | null,
  next: PublicLocationsResponse,
): PublicLocationsResponse {
  if (!current || next.pagination.page === 1) {
    return next;
  }

  return {
    locations: [...current.locations, ...next.locations],
    pagination: next.pagination,
  };
}

export function TrackingClient() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";
  const [tracking, setTracking] = useState<PublicTrackingResponse | null>(null);
  const [history, setHistory] = useState<PublicLocationsResponse | null>(null);
  const [tab, setTab] = useState<Tab>("map");
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setInitialLoading] = useState(true);
  const [isHistoryLoading, setHistoryLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  const historyPoints = useMemo(() => history?.locations || [], [history]);

  const loadTracking = useCallback(async () => {
    const response = await fetch(`/api/public/tracking?code=${encodeURIComponent(code)}`, {
      cache: "no-store",
    });

    if (response.status === 404) {
      throw new Error("Atleta não encontrado. Verifique o código informado.");
    }

    if (!response.ok) {
      throw new Error("Não foi possível atualizar os dados. Tentaremos novamente.");
    }

    const payload = (await response.json()) as PublicTrackingResponse;
    setTracking(payload);
    setError(null);
  }, [code]);

  const loadHistory = useCallback(
    async (page = 1) => {
      setHistoryLoading(true);

      try {
        const response = await fetch(
          `/api/public/locations?code=${encodeURIComponent(code)}&page=${page}&per_page=50`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Não foi possível carregar o histórico.");
        }

        const payload = (await response.json()) as PublicLocationsResponse;
        setHistory((current) => appendHistory(current, payload));
      } finally {
        setHistoryLoading(false);
      }
    },
    [code],
  );

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      setInitialLoading(true);

      try {
        await Promise.all([loadTracking(), loadHistory(1)]);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Erro ao carregar atleta.");
        }
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      isMounted = false;
    };
  }, [loadHistory, loadTracking]);

  useEffect(() => {
    if (!code) {
      return;
    }

    const interval = window.setInterval(() => {
      loadTracking().catch((pollError) => {
        setError(
          pollError instanceof Error
            ? pollError.message
            : "Não foi possível atualizar os dados. Tentaremos novamente.",
        );
      });
      setNow(Date.now());
    }, pollingConfig.publicTrackingMs);

    return () => window.clearInterval(interval);
  }, [code, loadTracking]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(interval);
  }, []);

  if (isInitialLoading) {
    return (
      <main className="screen loading-screen">
        <div>
          <div className="spinner" />
          <p>Conectando ao servidor...</p>
        </div>
      </main>
    );
  }

  if (!tracking) {
    return (
      <main className="screen state-screen">
        <div>
          <Brand />
          <h1>Atleta não encontrado</h1>
          <p className="api-error">{error || "Verifique o código informado."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="screen">
      <div className="app-frame">
        <header className="topbar">
          <Brand />
        </header>

        {error ? <p className="api-error">{error}</p> : null}

        <div className="live-layout">
          <div>
            {(tab === "map" || typeof window === "undefined") && (
              <TrailMap tracking={tracking} history={historyPoints} />
            )}
            {tab === "details" && <DetailsPanel tracking={tracking} />}
            {tab === "history" && (
              <HistoryPanel
                history={history}
                isLoading={isHistoryLoading}
                onLoadMore={() => loadHistory((history?.pagination.page || 1) + 1)}
              />
            )}
          </div>

          <aside className="side-stack">
            <AthleteHeader tracking={tracking} />
            <LastUpdate value={tracking.tracking.last_update_at} now={now} />
            {tracking.tracking.status === "finished" ? (
              <section className="panel">
                <h2>Sessão finalizada</h2>
                <p>Atleta finalizou o tracking. O último progresso conhecido permanece disponível.</p>
              </section>
            ) : null}
            <TrackingStats tracking={tracking} />
          </aside>
        </div>

        <BottomNavigation activeTab={tab} onChange={setTab} />
      </div>
    </main>
  );
}
