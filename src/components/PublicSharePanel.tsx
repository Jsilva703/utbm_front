"use client";

import { Copy, Share2 } from "lucide-react";

type PublicSharePanelProps = {
  code?: string | null;
  title?: string;
  description?: string;
};

function publicTrackingLink(code: string) {
  if (typeof window === "undefined") {
    return `/tracking?code=${encodeURIComponent(code)}`;
  }

  return `${window.location.origin}/tracking?code=${encodeURIComponent(code)}`;
}

export function PublicSharePanel({
  code,
  title = "Compartilhar acompanhamento",
  description = "Este código permite somente leitura do acompanhamento público.",
}: PublicSharePanelProps) {
  if (!code) {
    return null;
  }

  const link = publicTrackingLink(code);

  async function copyCode() {
    await navigator.clipboard?.writeText(code || "");
  }

  async function copyLink() {
    await navigator.clipboard?.writeText(link);
  }

  async function shareLink() {
    if (navigator.share) {
      await navigator.share({
        title: "Acompanhamento UTMB Trail Tracking",
        text: `Código público: ${code}`,
        url: link,
      });
      return;
    }

    await copyLink();
  }

  return (
    <section className="share-panel" aria-label={title}>
      <div>
        <span className="admin-eyebrow">Acompanhamento</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="share-code-box">
        <span>Código público</span>
        <strong>{code}</strong>
      </div>

      <div className="share-link-box">
        <span>Link público</span>
        <strong>{link}</strong>
      </div>

      <div className="share-actions">
        <button type="button" className="secondary-button" onClick={copyCode}>
          <Copy size={18} aria-hidden="true" />
          Copiar código
        </button>
        <button type="button" className="secondary-button" onClick={copyLink}>
          <Copy size={18} aria-hidden="true" />
          Copiar link
        </button>
        <button type="button" className="primary-button" onClick={shareLink}>
          <Share2 size={18} aria-hidden="true" />
          Compartilhar
        </button>
      </div>
    </section>
  );
}
