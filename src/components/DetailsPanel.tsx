import type { PublicTrackingResponse } from "@/lib/api/types";
import { formatClock, formatKm, formatMeters, formatPercent } from "@/lib/format";

type DetailsPanelProps = {
  tracking: PublicTrackingResponse;
};

export function DetailsPanel({ tracking }: DetailsPanelProps) {
  const progress = tracking.route_progress;
  const traveled = tracking.distance_traveled;

  const rows = [
    ["Status da sessão", tracking.tracking.status],
    ["Distância total", formatKm(tracking.race.distance_km)],
    ["Distância percorrida", formatMeters(traveled?.estimated_distance_m)],
    ["Progresso na rota", formatMeters(progress?.route_progress_m ?? progress?.estimated_distance_m)],
    ["Percentual da rota", formatPercent(progress?.estimated_progress_percentage)],
    ["Distância restante na rota", formatMeters(progress?.estimated_remaining_distance_m)],
    ["Distância da rota", formatMeters(progress?.distance_from_route_m)],
    ["Precisão GPS", formatMeters(tracking.location?.accuracy)],
    ["Pontos aceitos", traveled?.accepted_points_count?.toString() || "-"],
    ["Pontos filtrados", traveled?.rejected_points_count?.toString() || "-"],
    ["Última atualização", formatClock(tracking.tracking.last_update_at)],
  ];

  return (
    <section className="panel" aria-label="Detalhes do tracking">
      <h2>Detalhes</h2>
      <div className="detail-list">
        {rows.map(([label, value]) => (
          <div className="detail-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
