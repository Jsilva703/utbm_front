export function createClientPointId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `point-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

