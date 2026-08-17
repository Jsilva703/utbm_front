"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

type AdminDetailDialogProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  onClose: () => void;
};

export function AdminDetailDialog({
  title,
  eyebrow,
  children,
  onClose,
}: AdminDetailDialogProps) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="admin-detail-title">
      <section className="modal admin-detail-modal">
        <header className="admin-detail-header">
          <div>
            {eyebrow ? <span className="admin-eyebrow">{eyebrow}</span> : null}
            <h2 id="admin-detail-title">{title}</h2>
          </div>
          <button
            type="button"
            className="icon-button admin-copy-button"
            title="Fechar"
            onClick={onClose}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
