import { Mountain } from "lucide-react";

export function Brand() {
  return (
    <div className="brand-mark" aria-label="UTMB Trail Tracking">
      <span className="brand-dot" aria-hidden="true">
        <Mountain size={21} strokeWidth={2.4} />
      </span>
      <span>UTMB Trail Tracking</span>
    </div>
  );
}

