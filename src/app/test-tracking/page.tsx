"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Send, Square } from "lucide-react";
import { Brand } from "@/components/Brand";
import type { LocationPayload } from "@/lib/api/types";
import { trackingConfig } from "@/lib/config";
import {
  countPendingLocations,
  deletePendingLocations,
  listPendingLocations,
  savePendingLocation,
} from "@/lib/tracking/buffer";
import { createClientPointId } from "@/lib/tracking/ids";
import { formatClock, formatMeters } from "@/lib/format";

type SyncState = "idle" | "offline" | "syncing" | "synced" | "error";

type LastPosition = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  recorded_at: string;
};

async function postLocations(locations: LocationPayload[]) {
  const response = await fetch("/api/test-tracking/locations", {
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

export default function TestTrackingPage() {
  const watchIdRef = useRef<number | null>(null);
  const [isTracking, setTracking] = useState(false);
  const [lastPosition, setLastPosition] = useState<LastPosition | null>(null);
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);
  const [sentCount, setSentCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [isFinishing, setFinishing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    if (!("indexedDB" in window)) {
      return;
    }

    setPendingCount(await countPendingLocations());
  }, []);

  const syncPending = useCallback(async () => {
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
  }, [refreshPendingCount]);

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
      await fetch("/api/test-tracking/finish", { method: "POST" });
      pauseTracking();
    } finally {
      setFinishing(false);
    }
  }

  useEffect(() => {
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
    <main className="screen">
      <div className="app-frame tracking-grid">
        <header className="topbar">
          <Brand />
          <span className="pill">Modo de teste</span>
        </header>

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
            <button className="primary-button" type="button" onClick={startTracking} disabled={isTracking}>
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

        <section className="panel">
          <h2>Limitação iOS/PWA</h2>
          <p>
            O teste valida PWA ativa, GPS, API, buffer e mapa. O comportamento com tela bloqueada
            ou aplicação em background depende do iOS e deve ser medido no teste real.
          </p>
        </section>
      </div>

      {showStopDialog ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="finish-title">
          <section className="modal">
            <h2 id="finish-title">Finalizar sessão?</h2>
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
