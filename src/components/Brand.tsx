import { Zap } from "lucide-react";

export function Brand() {
  return (
    <div className="brand-mark" aria-label="RacePulse">
      <span className="brand-dot" aria-hidden="true">
        <Zap size={14} strokeWidth={2.5} />
      </span>
      <span>RacePulse</span>
    </div>
  );
}
