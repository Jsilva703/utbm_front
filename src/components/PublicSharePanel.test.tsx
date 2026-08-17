import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PublicSharePanel } from "@/components/PublicSharePanel";

describe("PublicSharePanel", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("shows the public code and copies the public tracking link", async () => {
    render(<PublicSharePanel code="582731" />);

    expect(screen.getByText("582731")).toBeInTheDocument();
    expect(screen.getByText("http://localhost:3000/tracking?code=582731")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /copiar link/i }));

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "http://localhost:3000/tracking?code=582731",
      ),
    );
  });
});
