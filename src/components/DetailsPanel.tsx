import type { PublicTrackingResponse } from "@/lib/api/types";
import { formatClock, formatKm, formatMeters, formatPercent } from "@/lib/format";

type DetailsPanelProps = {
  tracking: PublicTrackingResponse;
};

export function DetailsPanel({ tracking }: DetailsPanelProps) {
  const progress = tracking.route_progress;

  const rows = [
    ["Status da sessão", tracking.tracking.status],
    ["Distância total", formatKm(tracking.race.distance_km)],
    ["Distância estimada", formatMeters(progress?.estimated_distance_m)],
    ["Progresso", formatPercent(progress?.estimated_progress_percentage)],
    ["Distância restante", formatMeters(progress?.estimated_remaining_distance_m)],
    ["Distância da rota", formatMeters(progress?.distance_from_route_m)],
    ["Precisão GPS", formatMeters(tracking.location?.accuracy)],
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

