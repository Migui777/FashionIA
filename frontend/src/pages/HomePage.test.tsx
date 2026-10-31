import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "./HomePage";

function ChatProbe() {
  const state = useLocation().state as { garment?: string } | null;
  return <p>chat:{state?.garment ?? "sin contexto"}</p>;
}

function renderHome() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("opens the chat without context from the floating button", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderHome();
    await user.click(screen.getByRole("button", { name: "Abrir el chat" }));
    expect(screen.getByText("chat:sin contexto")).toBeInTheDocument();
  });

  it("detects a garment and opens the chat with its name", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderHome();
    expect(screen.getByText("Escaneando pasarela…")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText("✦ Prenda identificada")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ver más información…" }));
    expect(screen.getByText("chat:Vestido Aurora de Jardín")).toBeInTheDocument();
  });
});
