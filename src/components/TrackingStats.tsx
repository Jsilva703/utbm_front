import type { PublicTrackingResponse } from "@/lib/api/types";
import { formatKm, formatMeters, formatPercent } from "@/lib/format";

type TrackingStatsProps = {
  tracking: PublicTrackingResponse;
};

export function TrackingStats({ tracking }: TrackingStatsProps) {
  const progress = tracking.route_progress;

  return (
    <section className="stats-grid" aria-label="Indicadores de tracking">
      <div className="stat-card">
        <span>Distância estimada</span>
        <strong>{formatKm(progress?.estimated_distance_km)}</strong>
      </div>
      <div className="stat-card">
        <span>Progresso</span>
        <strong>{formatPercent(progress?.estimated_progress_percentage)}</strong>
      </div>
      <div className="stat-card">
        <span>Precisão GPS</span>
        <strong>{formatMeters(tracking.location?.accuracy)}</strong>
      </div>
      <div className="stat-card">
        <span>Restante</span>
        <strong>{formatKm(progress?.estimated_remaining_distance_km)}</strong>
      </div>
    </section>
  );
}

