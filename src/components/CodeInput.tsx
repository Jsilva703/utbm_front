"use client";

import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";

type CodeInputProps = {
  onSubmit: (code: string) => Promise<void> | void;
  error?: string | null;
  label?: string;
  placeholder?: string;
};

export function CodeInput({
  onSubmit,
  error,
  label = "Código do atleta",
  placeholder = "12345",
}: CodeInputProps) {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(code);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="code-form" onSubmit={handleSubmit}>
      <label className="field-label" htmlFor="athlete-code">
        {label}
      </label>
      <input
        id="athlete-code"
        className="code-input"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder={placeholder}
        value={code}
        onChange={(event) => setCode(event.target.value)}
        aria-describedby={error ? "code-error" : undefined}
      />
      {error ? (
        <p className="form-error" id="code-error">
          {error}
        </p>
      ) : null}
      <button className="primary-button" type="submit" disabled={isSubmitting || !code.trim()}>
        {isSubmitting ? "CONECTANDO" : "ACOMPANHAR"}
        <ArrowRight size={19} aria-hidden="true" />
      </button>
    </form>
  );
}
