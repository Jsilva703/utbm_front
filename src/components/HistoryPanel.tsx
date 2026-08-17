import type { PublicLocationPoint, PublicLocationsResponse } from "@/lib/api/types";
import { formatClock, formatMeters } from "@/lib/format";

type HistoryPanelProps = {
  history: PublicLocationsResponse | null;
  onLoadMore: () => void;
  isLoading: boolean;
};

function coordinate(point: PublicLocationPoint) {
  return `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`;
}

export function HistoryPanel({ history, onLoadMore, isLoading }: HistoryPanelProps) {
  const hasMore =
    history && history.pagination.page * history.pagination.per_page < history.pagination.total_count;

  return (
    <section className="panel" aria-label="Histórico de localizações">
      <h2>Histórico</h2>
      {!history || history.locations.length === 0 ? (
        <p className="api-error">Aguardando primeira localização do atleta.</p>
      ) : (
        <div className="history-list">
          {history.locations.map((point, index) => (
            <div className="history-row" key={`${point.recorded_at}-${index}`}>
              <span>
                {formatClock(point.recorded_at)}
                <br />
                {formatMeters(point.accuracy)}
              </span>
              <strong>{coordinate(point)}</strong>
            </div>
          ))}
        </div>
      )}
      {hasMore ? (
        <button className="secondary-button" type="button" onClick={onLoadMore} disabled={isLoading}>
          {isLoading ? "Carregando..." : "Carregar mais"}
        </button>
      ) : null}
    </section>
  );
}

