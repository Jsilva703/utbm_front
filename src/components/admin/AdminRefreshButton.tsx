"use client";

import { RefreshCw } from "lucide-react";

type AdminRefreshButtonProps = {
  isRefreshing?: boolean;
  onRefresh: () => void | Promise<void>;
};

export function AdminRefreshButton({
  isRefreshing = false,
  onRefresh,
}: AdminRefreshButtonProps) {
  return (
    <button
      type="button"
      className="icon-button admin-refresh-button"
      onClick={() => void onRefresh()}
      title="Atualizar"
      aria-label="Atualizar"
      aria-busy={isRefreshing}
      disabled={isRefreshing}
    >
      <RefreshCw
        size={18}
        aria-hidden="true"
        className={isRefreshing ? "is-spinning" : undefined}
      />
    </button>
  );
}
