"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, CheckCircle2, FileUp } from "lucide-react";
import { createRace, uploadRaceRoute } from "@/lib/admin/client";
import type { AdminRace, AdminRouteImport } from "@/lib/admin/types";
import { formatMeters } from "@/lib/format";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeDistance(value: string) {
  const normalized = value.replace(",", ".").replace(/[^0-9.]/g, "");
  const [integerPart, ...decimalParts] = normalized.split(".");
  return decimalParts.length > 0 ? `${integerPart}.${decimalParts.join("")}` : integerPart;
}

export function AdminRaceCreateClient() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [status, setStatus] = useState("active");
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdRoute, setCreatedRoute] = useState<AdminRouteImport["route"] | null>(null);
  const [createStep, setCreateStep] = useState<string | null>(null);
  const [retryUpload, setRetryUpload] = useState<{ race: AdminRace; file: File } | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isCreating, setCreating] = useState(false);

  const distanceNumber = Number(distanceKm);
  const fieldErrors = {
    name: name.trim() ? null : "Informe o nome da prova.",
    slug: slugPattern.test(slug) ? null : "Use letras minúsculas, números e hífens.",
    distanceKm:
      distanceKm && Number.isFinite(distanceNumber) && distanceNumber > 0
        ? null
        : "Informe uma distância maior que zero.",
    gpxFile: gpxFile ? null : "Selecione o GPX da rota oficial.",
  };
  const isFormValid = Object.values(fieldErrors).every((value) => value === null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({
      name: true,
      slug: true,
      distanceKm: true,
      gpxFile: true,
    });

    if (!isFormValid || !gpxFile) {
      setError("Revise os campos obrigatórios antes de criar a prova.");
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(null);
    setCreatedRoute(null);
    setRetryUpload(null);

    try {
      setCreateStep("Criando prova...");
      const payload = await createRace({
        name,
        slug,
        distance_km: distanceNumber,
        status,
      });

      try {
        setCreateStep("Importando rota...");
        const routePayload = await uploadRaceRoute(payload.race.id, gpxFile);
        setCreatedRoute(routePayload.route);
        setSuccess(
          `Prova criada e rota importada: ${routePayload.route.points_count} pontos, ${formatMeters(
            routePayload.route.total_distance_m,
          )}.`,
        );
        resetForm();
      } catch (uploadError) {
        setRetryUpload({ race: payload.race, file: gpxFile });
        setError(
          uploadError instanceof Error
            ? `Prova criada, mas a rota não foi importada. ${uploadError.message}`
            : "Prova criada, mas a rota não foi importada.",
        );
      }
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Não foi possível criar prova.");
    } finally {
      setCreating(false);
      setCreateStep(null);
    }
  }

  async function handleRetryCreatedRoute() {
    if (!retryUpload) {
      return;
    }

    setCreating(true);
    setCreateStep("Importando rota...");
    setError(null);
    setSuccess(null);

    try {
      const routePayload = await uploadRaceRoute(retryUpload.race.id, retryUpload.file);
      setCreatedRoute(routePayload.route);
      setRetryUpload(null);
      resetForm();
      setSuccess(
        `Rota importada: ${routePayload.route.points_count} pontos, ${formatMeters(
          routePayload.route.total_distance_m,
        )}.`,
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? `Prova criada, mas a rota não foi importada. ${uploadError.message}`
          : "Prova criada, mas a rota não foi importada.",
      );
    } finally {
      setCreating(false);
      setCreateStep(null);
    }
  }

  function resetForm() {
    setName("");
    setSlug("");
    setDistanceKm("");
    setStatus("active");
    setGpxFile(null);
    setTouched({});
  }

  return (
    <div className="admin-page admin-races-page admin-race-new-page">
      <header className="admin-page-header admin-races-header">
        <div>
          <p className="admin-eyebrow">Nova prova</p>
          <h1>Criar prova</h1>
          <span>Cadastre a prova e importe o GPX oficial em um fluxo guiado.</span>
        </div>
        <Link href="/admin/races" className="secondary-button admin-compact-button">
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar
        </Link>
      </header>

      <section className="admin-panel admin-race-create-panel">
        <div className="admin-race-panel-intro">
          <div>
            <p className="admin-eyebrow">Dados da prova</p>
            <h2>Informações principais</h2>
            <span>O GPX é obrigatório neste fluxo para manter a prova pronta para acompanhamento.</span>
          </div>
          {createStep ? <span className="pill pill-live">{createStep}</span> : null}
        </div>

        <form className="admin-form admin-race-form" onSubmit={handleCreate} noValidate>
          <label className={touched.name && fieldErrors.name ? "field-invalid" : undefined}>
            <span className="field-label">Nome</span>
            <input
              required
              className="code-input admin-input"
              value={name}
              onBlur={() => setTouched((current) => ({ ...current, name: true }))}
              onChange={(event) => {
                const nextName = event.target.value;
                setName(nextName);
                if (!slug || slug === normalizeSlug(name)) {
                  setSlug(normalizeSlug(nextName));
                }
              }}
              placeholder="UTMB Paraty 58K"
            />
            {touched.name && fieldErrors.name ? <span className="field-hint error">{fieldErrors.name}</span> : null}
          </label>

          <label className={touched.slug && fieldErrors.slug ? "field-invalid" : undefined}>
            <span className="field-label">Slug</span>
            <input
              required
              className="code-input admin-input"
              value={slug}
              onBlur={() => {
                setSlug((value) => normalizeSlug(value));
                setTouched((current) => ({ ...current, slug: true }));
              }}
              onChange={(event) => setSlug(normalizeSlug(event.target.value))}
              placeholder="utmb-paraty-58k"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            />
            {touched.slug && fieldErrors.slug ? <span className="field-hint error">{fieldErrors.slug}</span> : null}
          </label>

          <label className={touched.distanceKm && fieldErrors.distanceKm ? "field-invalid" : undefined}>
            <span className="field-label">Distância km</span>
            <input
              required
              className="code-input admin-input"
              type="text"
              inputMode="decimal"
              value={distanceKm}
              onBlur={() => setTouched((current) => ({ ...current, distanceKm: true }))}
              onChange={(event) => setDistanceKm(normalizeDistance(event.target.value))}
              placeholder="58"
            />
            {touched.distanceKm && fieldErrors.distanceKm ? (
              <span className="field-hint error">{fieldErrors.distanceKm}</span>
            ) : null}
          </label>

          <label>
            <span className="field-label">Status</span>
            <select className="admin-select" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>

          <label
            className={
              touched.gpxFile && fieldErrors.gpxFile
                ? "admin-create-upload field-invalid"
                : "admin-create-upload"
            }
          >
            <span className="field-label">Arquivo GPX</span>
            <span className={gpxFile ? "admin-upload-dropzone loaded" : "admin-upload-dropzone"}>
              {gpxFile ? <CheckCircle2 size={24} aria-hidden="true" /> : <FileUp size={24} aria-hidden="true" />}
              <strong>{gpxFile ? "GPX selecionado" : "Importar rota GPX"}</strong>
              <span>{gpxFile ? gpxFile.name : "Arraste o arquivo aqui ou selecione um arquivo"}</span>
              <input
                required
                type="file"
                accept=".gpx,application/gpx+xml"
                onBlur={() => setTouched((current) => ({ ...current, gpxFile: true }))}
                onChange={(event) => {
                  setGpxFile(event.target.files?.[0] || null);
                  setTouched((current) => ({ ...current, gpxFile: true }));
                }}
              />
            </span>
            {touched.gpxFile && fieldErrors.gpxFile ? (
              <span className="field-hint error">{fieldErrors.gpxFile}</span>
            ) : null}
          </label>

          <div className="admin-race-submit-row">
            <button type="submit" className="primary-button" disabled={isCreating || !isFormValid}>
              {isCreating ? createStep || "Criando..." : "Criar prova"}
            </button>
            <span>
              {isFormValid
                ? "Tudo pronto para criar a prova e importar o GPX."
                : "Preencha nome, slug, distância e GPX para continuar."}
            </span>
          </div>
        </form>

        {success ? (
          <div className="admin-success admin-create-success">
            <span>{success}</span>
            <Link href="/admin/races" className="secondary-button admin-compact-button">
              Ver provas cadastradas
            </Link>
          </div>
        ) : null}
        {createdRoute ? (
          <dl className="admin-detail-grid admin-route-import-summary">
            <div>
              <dt>Arquivo</dt>
              <dd>{createdRoute.source_filename}</dd>
            </div>
            <div>
              <dt>Pontos</dt>
              <dd>{createdRoute.points_count}</dd>
            </div>
            <div>
              <dt>Distância processada</dt>
              <dd>{formatMeters(createdRoute.total_distance_m)}</dd>
            </div>
          </dl>
        ) : null}
        {retryUpload ? (
          <div className="admin-partial-failure">
            <div>
              <strong>Prova criada, mas a rota não foi importada.</strong>
              <span>Você pode tentar enviar o GPX novamente sem recriar a prova.</span>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={handleRetryCreatedRoute}
              disabled={isCreating}
            >
              <FileUp size={18} aria-hidden="true" />
              Tentar importar GPX novamente
            </button>
          </div>
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
      </section>
    </div>
  );
}
