import { Mountain } from "lucide-react";

export function Brand() {
  return (
    <div className="brand-mark" aria-label="RacePulse">
      <span className="brand-dot" aria-hidden="true">
        <Mountain size={21} strokeWidth={2.4} />
      </span>
      <span>RacePulse</span>
    </div>
  );
}
