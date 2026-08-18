"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Pause, Play, Send, Square } from "lucide-react";
import { Brand } from "@/components/Brand";
import { PublicSharePanel } from "@/components/PublicSharePanel";
import type { LocationPayload } from "@/lib/api/types";
import type { AthleteSessionPublic } from "@/lib/athlete/types";
import { trackingConfig } from "@/lib/config";
import { racepulseImages, racepulseVideos } from "@/config/racepulse-media";
import { formatClock, formatKm, formatMeters } from "@/lib/format";
import {
  countPendingLocations,
  deletePendingLocations,
  listPendingLocations,
  savePendingLocation,
} from "@/lib/tracking/buffer";
import { createClientPointId } from "@/lib/tracking/ids";

type SyncState = "idle" | "offline" | "syncing" | "synced" | "error";

type LastPosition = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  recorded_at: string;
};

async function fetchCurrentSession() {
  const response = await fetch("/api/athlete/session", { cache: "no-store" });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as AthleteSessionPublic;
}

async function activateSession(code: string) {
  const response = await fetch("/api/athlete/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  if (response.status === 404 || response.status === 422) {
    throw new Error("Código inválido ou sessão indisponível.");
  }

  if (!response.ok) {
    throw new Error("Não foi possível ativar a sessão agora.");
  }

  return (await response.json()) as AthleteSessionPublic;
}

async function postLocations(locations: LocationPayload[]) {
  const response = await fetch("/api/athlete/locations/batch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ locations }),
  });

  if (!response.ok) {
    throw new Error("Falha ao sincronizar localizações.");
  }

  return response.json();
}

export default function AthletePage() {
  const watchIdRef = useRef<number | null>(null);
  const [code, setCode] = useState("");
  const [session, setSession] = useState<AthleteSessionPublic | null>(null);
  const [isActivating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [isTracking, setTracking] = useState(false);
  const [lastPosition, setLastPosition] = useState<LastPosition | null>(null);
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);
  const [sentCount, setSentCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [isFinishing, setFinishing] = useState(false);

  async function handleActivate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActivating(true);
    setActivationError(null);

    try {
      setSession(await activateSession(code));
      setCode("");
    } catch (error) {
      setActivationError(
        error instanceof Error ? error.message : "Não foi possível ativar a sessão.",
      );
    } finally {
      setActivating(false);
    }
  }

  const refreshPendingCount = useCallback(async () => {
    if (!("indexedDB" in window)) {
      return;
    }

    setPendingCount(await countPendingLocations());
  }, []);

  const syncPending = useCallback(async () => {
    if (!session) {
      return;
    }

    if (!navigator.onLine) {
      setSyncState("offline");
      await refreshPendingCount();
      return;
    }

    const pending = await listPendingLocations(trackingConfig.batchSize);
    if (pending.length === 0) {
      setSyncState("synced");
      await refreshPendingCount();
      return;
    }

    setSyncState("syncing");

    try {
      await postLocations(pending);
      await deletePendingLocations(pending.map((point) => point.client_point_id));
      setSentCount((count) => count + pending.length);
      setLastSentAt(new Date().toISOString());
      setSyncState("synced");
    } catch {
      setSyncState("error");
    } finally {
      await refreshPendingCount();
    }
  }, [refreshPendingCount, session]);

  const handlePosition = useCallback(
    async (position: GeolocationPosition) => {
      const payload: LocationPayload & LastPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
        altitude: position.coords.altitude ?? null,
        recorded_at: new Date(position.timestamp).toISOString(),
        client_point_id: createClientPointId(),
      };

      setLastPosition(payload);
      await savePendingLocation(payload);
      await refreshPendingCount();
    },
    [refreshPendingCount],
  );

  function startTracking() {
    setGpsError(null);

    if (!session) {
      setGpsError("Ative sua sessão antes de iniciar o tracking.");
      return;
    }

    if (!("geolocation" in navigator)) {
      setGpsError("Geolocalização não está disponível neste navegador.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        handlePosition(position).catch(() => {
          setGpsError("Não foi possível salvar a posição no aparelho.");
        });
      },
      (error) => {
        setGpsError(error.message || "Não foi possível obter a localização.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: trackingConfig.gpsMaximumAgeMs,
        timeout: trackingConfig.gpsTimeoutMs,
      },
    );

    setTracking(true);
  }

  function pauseTracking() {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setTracking(false);
    setShowStopDialog(false);
  }

  async function finishSession() {
    setFinishing(true);

    try {
      await fetch("/api/athlete/finish", { method: "POST" });
      pauseTracking();
      setSession((current) =>
        current
          ? {
              ...current,
              tracking: {
                ...current.tracking,
                status: "finished",
                finished_at: new Date().toISOString(),
              },
            }
          : current,
      );
    } finally {
      setFinishing(false);
    }
  }

  useEffect(() => {
    fetchCurrentSession().then((current) => {
      if (current) {
        setSession(current);
      }
    });
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    if (!isTracking) {
      return;
    }

    const interval = window.setInterval(() => {
      syncPending();
    }, trackingConfig.sendIntervalMs);

    syncPending();

    return () => window.clearInterval(interval);
  }, [isTracking, syncPending]);

  useEffect(() => {
    const handleOnline = () => syncPending();
    const handleOffline = () => setSyncState("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [syncPending]);

  const syncLabel = {
    idle: "Aguardando início",
    offline: "Sem conexão. Salvando posições no aparelho.",
    syncing: `Sincronizando ${pendingCount} posições...`,
    synced: "Sincronizado",
    error: "Falha ao enviar. Tentaremos novamente.",
  }[syncState];

  return (
    <main className={session ? "screen athlete-screen figma-athlete-active" : "figma-athlete-split"}>
      {!session ? (
        <>
          <section className="figma-athlete-media">
            <video autoPlay muted loop playsInline poster={racepulseImages.athlete}>
              {racepulseVideos.map((video) => (
                <source key={video} src={video} />
              ))}
            </video>
            <div />
            <aside>
              <span>Para atletas</span>
              <strong>
                Ative seu
                <br />
                tracking privado.
              </strong>
              <p>
                Sua posição ao vivo, compartilhada
                <br />
                com quem você escolher.
              </p>
            </aside>
          </section>

          <section className="figma-athlete-form-panel">
            <Link href="/" className="figma-back-link">
              <ArrowLeft size={13} aria-hidden="true" />
              Voltar
            </Link>
            <Brand />
            <div className="figma-form-spacer" />
            <span>Tracking privado</span>
            <h1>Área do atleta</h1>
            <p>Digite o código de acesso entregue pela organização para ativar seu tracking.</p>

            <form className="figma-side-form" onSubmit={handleActivate}>
              <label htmlFor="athlete-code">Código de acesso</label>
              <input
                id="athlete-code"
                required
                value={code}
                inputMode="text"
                autoCapitalize="characters"
                placeholder="ex: TRAIL-2025-ATL-042"
                onChange={(event) => setCode(event.target.value)}
              />
              {activationError ? <p className="figma-form-error">{activationError}</p> : null}
              <button type="submit" disabled={isActivating}>
                {isActivating ? "Validando..." : "Continuar"}
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </form>

            <div className="figma-side-form-footer">
              <Link href="/admin/login">Ir para a área administrativa →</Link>
            </div>
          </section>
        </>
      ) : (
        <div className="app-frame tracking-grid">
          <header className="topbar">
            <Brand />
            <span className="pill">Área do atleta</span>
          </header>

          <>
            <section className="athlete-session-card">
              <div>
                <span className="admin-eyebrow">Sessão ativa</span>
                <h1>{session.athlete.name}</h1>
                <p>
                  {session.race.name} - {formatKm(session.race.distance_km)}
                </p>
              </div>
              <div className="status-row">
                <span className={session.tracking.status === "active" ? "pill pill-live" : "pill pill-finished"}>
                  {session.tracking.status === "active" ? "ATIVA" : "FINALIZADA"}
                </span>
                <span className="pill">Início {formatClock(session.tracking.started_at)}</span>
              </div>
            </section>

            <PublicSharePanel code={session.public_access?.code} />

            <section className="gps-card">
              <div className="status-row">
                <span className={isTracking ? "pill pill-live" : "pill"}>
                  {isTracking ? "TRACKING ATIVO" : "PAUSADO"}
                </span>
                <span className="pill">{syncLabel}</span>
              </div>

              <div className="gps-readout" aria-label="Status GPS">
                <div>
                  <span>Status GPS</span>
                  <strong>{gpsError ? "Erro" : isTracking ? "Monitorando" : "Aguardando"}</strong>
                </div>
                <div>
                  <span>Precisão</span>
                  <strong>{formatMeters(lastPosition?.accuracy)}</strong>
                </div>
                <div>
                  <span>Latitude</span>
                  <strong>{lastPosition ? lastPosition.latitude.toFixed(6) : "-"}</strong>
                </div>
                <div>
                  <span>Longitude</span>
                  <strong>{lastPosition ? lastPosition.longitude.toFixed(6) : "-"}</strong>
                </div>
                <div>
                  <span>Último envio</span>
                  <strong>{formatClock(lastSentAt)}</strong>
                </div>
                <div>
                  <span>Pontos enviados</span>
                  <strong>{sentCount}</strong>
                </div>
                <div>
                  <span>Pendentes</span>
                  <strong>{pendingCount}</strong>
                </div>
                <div>
                  <span>Rede</span>
                  <strong>{typeof navigator !== "undefined" && navigator.onLine ? "Online" : "Offline"}</strong>
                </div>
              </div>

              {gpsError ? <p className="api-error">{gpsError}</p> : null}

              <div className="action-row">
                <button
                  className="primary-button"
                  type="button"
                  onClick={startTracking}
                  disabled={isTracking || session.tracking.status !== "active"}
                >
                  <Play size={18} aria-hidden="true" />
                  INICIAR
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setShowStopDialog(true)}
                  disabled={!isTracking}
                >
                  <Pause size={18} aria-hidden="true" />
                  PARAR
                </button>
              </div>

              <button className="secondary-button" type="button" onClick={syncPending}>
                <Send size={18} aria-hidden="true" />
                Sincronizar agora
              </button>
            </section>
          </>
        </div>
      )}

      {showStopDialog ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="athlete-finish-title">
          <section className="modal">
            <h2 id="athlete-finish-title">Finalizar sessão?</h2>
            <p>
              Pausar interrompe apenas a coleta local. Finalizar encerra a sessão no backend e novas
              localizações não poderão ser enviadas.
            </p>
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={pauseTracking}>
                <Pause size={18} aria-hidden="true" />
                Pausar
              </button>
              <button
                className="danger-button"
                type="button"
                onClick={finishSession}
                disabled={isFinishing}
              >
                <Square size={18} aria-hidden="true" />
                {isFinishing ? "Finalizando..." : "Finalizar sessão"}
              </button>
              <button className="secondary-button" type="button" onClick={() => setShowStopDialog(false)}>
                Cancelar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
