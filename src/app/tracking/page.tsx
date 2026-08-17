import { Suspense } from "react";
import { TrackingClient } from "@/components/TrackingClient";

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <main className="screen loading-screen">
          <div>
            <div className="spinner" />
            <p>Carregando atleta...</p>
          </div>
        </main>
      }
    >
      <TrackingClient />
    </Suspense>
  );
}

