export function AdminLoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <section className="admin-state">
      <div className="spinner" />
      <p>{label}</p>
    </section>
  );
}

export function AdminErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="admin-state">
      <p className="api-error">{message}</p>
      <button type="button" className="secondary-button" onClick={onRetry}>
        Tentar novamente
      </button>
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="admin-empty">{message}</p>;
}
