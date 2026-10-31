import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatPage } from "./ChatPage";
import type { ChatResponse } from "../types/chat";

const answered: ChatResponse = {
  requestId: "req_0001",
  status: "answered",
  answer: "El Vestido Aurora de Jardín está confeccionado en algodón.",
  garment: { id: "VST-001", name: "Vestido Aurora de Jardín", type: "vestido", creator: "Elena", materials: ["algodón"], inspiration: null },
  sources: [{ recordId: "VST-001", document: "catalogo-mock.json", fields: ["materials"] }],
  meta: { contractVersion: "0.1", mock: true },
};

function sse(res: ChatResponse): Response {
  const { answer, ...meta } = res;
  const events = [
    { type: "meta", ...meta },
    { type: "delta", text: answer.slice(0, 10) },
    { type: "delta", text: answer.slice(10) },
    { type: "done", status: res.status, answer, garment: res.garment, sources: res.sources },
  ];
  return new Response(events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(""), {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

function renderChat(state?: { garment: string }) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/chat", state }]}>
      <Routes>
        <Route path="/" element={<p>home</p>} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ChatPage", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: true, media: query }));
    vi.stubGlobal("fetch", vi.fn(async () => sse(answered)));
  });

  it("greets without context and offers catalog suggestions", async () => {
    renderChat();
    expect(await screen.findByText(/Soy ModaAI/)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Vestido Aurora de Jardín/ })).toBeInTheDocument();
    expect(screen.queryByText("PRENDA")).not.toBeInTheDocument();
  });

  it("shows the garment context when coming from a detected garment", async () => {
    renderChat({ garment: "Vestido Aurora de Jardín" });
    expect(await screen.findByText("PRENDA")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /¿Qué colores tiene\?/ })).toBeInTheDocument();
  });

  it("sends a suggestion to the v1 endpoint and offers the remaining fields", async () => {
    const user = userEvent.setup();
    renderChat({ garment: "Vestido Aurora de Jardín" });

    await user.click(await screen.findByRole("button", { name: /materiales/ }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/chat/stream",
      expect.objectContaining({ body: JSON.stringify({ question: "¿De qué materiales está hecho el Vestido Aurora de Jardín?" }) }),
    );
    expect(await screen.findByText(/está confeccionado en algodón/)).toBeInTheDocument();
    expect(await screen.findByText("● IDENTIFICADA")).toBeInTheDocument();
    expect(await screen.findByText(/Hay más por descubrir/)).toBeInTheDocument();
    // materiales ya se consultó: se ofrecen colores, estilo, temporada y otra prenda
    const chips = screen.getAllByRole("button", { name: /¿Qué colores tiene\?|¿De qué estilo es\?|¿Para qué temporada es\?|Conocer el/ });
    expect(chips.filter((c) => !(c as HTMLButtonElement).disabled)).toHaveLength(4);
  });

  it("shows the server error in the conversation", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { message: "Demasiadas solicitudes." } }), { status: 429 })));
    const user = userEvent.setup();
    renderChat();

    await user.type(screen.getByLabelText("Tu pregunta"), "hola");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(await screen.findByText(/Demasiadas solicitudes/)).toBeInTheDocument();
  });

  it("goes back to the camera", async () => {
    const user = userEvent.setup();
    renderChat();
    await user.click(screen.getByRole("button", { name: "Volver a la cámara" }));
    expect(screen.getByText("home")).toBeInTheDocument();
  });
});
