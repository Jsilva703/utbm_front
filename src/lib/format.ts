export function formatKm(value?: number | null) {
  if (value == null || Number.isNaN(value)) {
    return "-";
  }

  return `${value.toFixed(2)} km`;
}

export function formatMeters(value?: number | null) {
  if (value == null || Number.isNaN(value)) {
    return "-";
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} km`;
  }

  return `${Math.round(value)} m`;
}

export function formatPercent(value?: number | null) {
  if (value == null || Number.isNaN(value)) {
    return "-";
  }

  return `${value.toFixed(1)}%`;
}

export function formatClock(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export function relativeLastUpdate(value?: string | null, now = Date.now()) {
  if (!value) {
    return "Aguardando primeira localização";
  }

  const elapsedSeconds = Math.max(0, Math.floor((now - new Date(value).getTime()) / 1000));

  if (elapsedSeconds < 10) {
    return "Atualizado agora";
  }

  if (elapsedSeconds < 60) {
    return `Atualizado há ${elapsedSeconds}s`;
  }

  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) {
    return `Atualizado há ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  return `Atualizado há ${hours} h`;
}

export function lastUpdateTone(
  value?: string | null,
  now = Date.now(),
  attentionMs = 90_000,
  outdatedMs = 5 * 60_000,
) {
  if (!value) {
    return "empty" as const;
  }

  const elapsed = now - new Date(value).getTime();

  if (elapsed >= outdatedMs) {
    return "outdated" as const;
  }

  if (elapsed >= attentionMs) {
    return "attention" as const;
  }

  return "normal" as const;
}

