import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CodeInput } from "@/components/CodeInput";

describe("CodeInput", () => {
  it("submits the typed athlete code", async () => {
    const onSubmit = vi.fn();
    render(<CodeInput onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Código do atleta"), {
      target: { value: "12345" },
    });
    fireEvent.click(screen.getByRole("button", { name: /acompanhar/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("12345"));
  });

  it("renders invalid code feedback", () => {
    render(<CodeInput onSubmit={vi.fn()} error="Atleta não encontrado" />);

    expect(screen.getByText("Atleta não encontrado")).toBeInTheDocument();
  });
});
