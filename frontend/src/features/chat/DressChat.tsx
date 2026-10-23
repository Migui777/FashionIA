import { useState } from "react";
import type { FormEvent } from "react";
import { chatService } from "../../services/chatService";
import type { ChatMessage } from "../../types/chat";

interface DressChatProps {
  dressId: string;
}

function createId() {
  return Math.random().toString(36).slice(2);
}

export function DressChat({ dressId }: DressChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { id: createId(), role: "user", text }]);
    setIsLoading(true);

    try {
      const reply = await chatService.ask(dressId, text);
      setMessages((prev) => [...prev, { id: createId(), role: "assistant", text: reply }]);
    } catch {
      setError("No pudimos obtener respuesta en este momento. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel flex flex-col rounded-2xl p-4">
      <h3 className="mb-3 font-display text-xl text-runway-mist">Pregúntame sobre este vestido</h3>

      <div className="mb-3 flex max-h-72 flex-col gap-2 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-runway-mist/50">
            Pregunta por los materiales, el diseñador, la colección o la historia de esta pieza.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
              m.role === "user"
                ? "self-end bg-runway-gold/20 text-runway-mist"
                : "self-start bg-runway-ink text-runway-mist/90"
            }`}
          >
            {m.text}
          </div>
        ))}
        {isLoading && (
          <div className="self-start rounded-2xl bg-runway-ink px-3.5 py-2 text-sm text-runway-mist/50">
            Escribiendo...
          </div>
        )}
      </div>

      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          className="flex-1 rounded-full border border-runway-gold/30 bg-runway-black/40 px-4 py-2 text-sm text-runway-mist placeholder:text-runway-mist/40 focus:border-runway-gold focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-full bg-runway-gold px-5 py-2 text-sm font-medium text-runway-black transition-opacity disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
