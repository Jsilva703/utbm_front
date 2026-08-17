import { pollingConfig } from "@/lib/config";
import { lastUpdateTone, relativeLastUpdate } from "@/lib/format";

type LastUpdateProps = {
  value?: string | null;
  now: number;
};

export function LastUpdate({ value, now }: LastUpdateProps) {
  const tone = lastUpdateTone(
    value,
    now,
    pollingConfig.staleAttentionMs,
    pollingConfig.staleOutdatedMs,
  );

  const detail =
    tone === "outdated"
      ? "Dados desatualizados. O último ponto conhecido permanece visível."
      : tone === "attention"
        ? "Aguardando nova atualização do atleta."
        : "Atualização dentro do intervalo esperado.";

  return (
    <section className={`last-update ${tone}`} aria-live="polite">
      <strong>{relativeLastUpdate(value, now)}</strong>
      <span>{detail}</span>
    </section>
  );
}

