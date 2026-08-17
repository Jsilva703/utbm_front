import { Radio, Trophy } from "lucide-react";
import type { PublicTrackingResponse } from "@/lib/api/types";

type AthleteHeaderProps = {
  tracking: PublicTrackingResponse;
};

export function AthleteHeader({ tracking }: AthleteHeaderProps) {
  const isFinished = tracking.tracking.status === "finished";

  return (
    <section className="athlete-header" aria-label="Resumo do atleta">
      <div className="status-row">
        <span className={isFinished ? "pill pill-finished" : "pill pill-live"}>
          <Radio size={14} aria-hidden="true" />
          {isFinished ? "FINALIZADO" : "AO VIVO"}
        </span>
        <span className="pill">
          <Trophy size={14} aria-hidden="true" />
          {tracking.race.distance_km.toFixed(3)} km
        </span>
      </div>
      <div>
        <h1>{tracking.athlete.name}</h1>
        <p>{tracking.race.name}</p>
      </div>
    </section>
  );
}

