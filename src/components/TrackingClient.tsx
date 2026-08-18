"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, LockKeyhole, Radio } from "lucide-react";
import { Brand } from "@/components/Brand";
import { AthleteHeader } from "@/components/AthleteHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { DetailsPanel } from "@/components/DetailsPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { LastUpdate } from "@/components/LastUpdate";
import { TrackingStats } from "@/components/TrackingStats";
import { pollingConfig } from "@/lib/config";
import { racepulseImages, racepulseVideos } from "@/config/racepulse-media";
import type {
  PublicLocationsResponse,
  PublicRaceRouteResponse,
  PublicTrackingResponse,
} from "@/lib/api/types";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";
  const [publicCode, setPublicCode] = useState("");
  const [tracking, setTracking] = useState<PublicTrackingResponse | null>(null);
  const [history, setHistory] = useState<PublicLocationsResponse | null>(null);
  const [officialRoute, setOfficialRoute] = useState<PublicRaceRouteResponse | null>(null);
  const [tab, setTab] = useState<Tab>("map");
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setInitialLoading] = useState(Boolean(code));
  const [isHistoryLoading, setHistoryLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  const historyPoints = useMemo(() => history?.locations || [], [history]);
  const officialRoutePoints = useMemo(
    () => officialRoute?.route?.points || [],
    [officialRoute],
  );
  const isPublicTrackingActive = tracking?.tracking.status === "active";

  const handlePublicCodeSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const submittedCode = publicCode.trim();

      if (!submittedCode) {
        return;
      }

      setError(null);

      const response = await fetch(
        `/api/public/tracking?code=${encodeURIComponent(submittedCode)}`,
        { cache: "no-store" },
      );

      if (response.status === 404) {
        setError("Não encontramos uma sessão de acompanhamento com esse código.");
        return;
      }

      if (!response.ok) {
        setError("Não foi possível conectar ao servidor. Tentaremos novamente.");
        return;
      }

      router.push(`/tracking?code=${encodeURIComponent(submittedCode)}`);
    },
    [publicCode, router],
  );

  const loadTracking = useCallback(async () => {
    const response = await fetch(`/api/public/tracking?code=${encodeURIComponent(code)}`, {
      cache: "no-store",
    });

    if (response.status === 404) {
      throw new Error("Não encontramos uma sessão de acompanhamento com esse código.");
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

  const loadOfficialRoute = useCallback(async () => {
    const response = await fetch(`/api/public/route?code=${encodeURIComponent(code)}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Não foi possível carregar a rota oficial.");
    }

    setOfficialRoute((await response.json()) as PublicRaceRouteResponse);
  }, [code]);

  useEffect(() => {
    if (!code) {
      setTracking(null);
      setHistory(null);
      setOfficialRoute(null);
      setInitialLoading(false);
      return;
    }

    let isMounted = true;

    async function initialLoad() {
      setInitialLoading(true);

      try {
        await Promise.all([loadTracking(), loadHistory(1), loadOfficialRoute()]);
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
  }, [loadHistory, loadOfficialRoute, loadTracking]);

  useEffect(() => {
    if (!code || !isPublicTrackingActive) {
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
      loadHistory(1).catch(() => undefined);
      setNow(Date.now());
    }, pollingConfig.publicTrackingMs);

    return () => window.clearInterval(interval);
  }, [code, isPublicTrackingActive, loadHistory, loadTracking]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(interval);
  }, []);

  if (!code) {
    return (
      <main className="figma-tracking-screen">
        <video autoPlay muted loop playsInline poster={racepulseImages.hero}>
          {racepulseVideos.map((video) => (
            <source key={video} src={video} />
          ))}
        </video>
        <div className="figma-tracking-overlay" />
        <div className="figma-tracking-radial" />

        <nav className="figma-access-nav">
          <Link href="/" aria-label="Voltar para a home">
            <Brand />
          </Link>
          <Link className="figma-nav-ghost" href="/admin/login">
            <LockKeyhole size={12} aria-hidden="true" />
            Área administrativa
          </Link>
        </nav>

        <section className="figma-tracking-card">
          <span>Tracking ao vivo</span>
          <h1>
            Acompanhe
            <br />
            atletas
            <br />
            <strong>ao vivo</strong>
            <br />
            nas trilhas.
          </h1>
          <p>
            Tracking público para provas de trail — acompanhe o atleta no celular com
            mapa, progresso estimado e última atualização em destaque.
          </p>

          <form className="figma-code-form" onSubmit={handlePublicCodeSubmit}>
            <label htmlFor="public-code">Código de acompanhamento</label>
            <input
              id="public-code"
              value={publicCode}
              onChange={(event) => setPublicCode(event.target.value)}
              placeholder="Digite o código público..."
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="one-time-code"
            />
            {error ? <p className="figma-form-error">{error}</p> : null}
            <button type="submit" disabled={!publicCode.trim()}>
              Acompanhar
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <Link href="/athlete" className="figma-athlete-link">
              <Radio size={15} aria-hidden="true" />
              Entrar como atleta
            </Link>
          </form>
        </section>

        <div className="figma-tracking-bottom">
          {[
            ["GPS", "Transmissão"],
            ["MAPA", "Ao vivo"],
            ["ROTA", "Progresso"],
          ].map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </main>
    );
  }

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
          <h1>Acompanhamento não encontrado</h1>
          <p className="api-error">
            {error || "Não encontramos uma sessão de acompanhamento com esse código."}
          </p>
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
              <TrailMap
                tracking={tracking}
                history={historyPoints}
                officialRoute={officialRoutePoints}
              />
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
