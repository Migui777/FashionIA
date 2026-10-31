import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TypedText } from "../features/chat/TypedText";
import {
  askedFieldOf,
  emojiFor,
  followUpSuggestions,
  initialSuggestions,
} from "../features/chat/chatSuggestions";
import type { AskedField, Suggestion } from "../features/chat/chatSuggestions";
import { streamChatMessage } from "../services/chatService";
import type { ChatResponse, ChatSource, ChatStatus, Garment } from "../types/chat";
import "../styles/atelier.css";

interface SuggestionGroup {
  lead: string;
  items: Suggestion[];
}

type Message =
  | { id: number; role: "user"; text: string }
  | {
      id: number;
      role: "bot";
      text: string;
      emoji?: string;
      /** true mientras el texto sigue llegando del servidor. */
      streaming?: boolean;
      highlight?: string | null;
      status?: ChatStatus;
      garment?: Garment | null;
      sources?: ChatSource[];
      suggestions?: SuggestionGroup;
      error?: boolean;
    };

type BotMessage = Extract<Message, { role: "bot" }>;

const BADGE: Record<ChatStatus, { label: string; warn: boolean }> = {
  answered: { label: "IDENTIFICADA", warn: false },
  no_evidence: { label: "SIN EVIDENCIA", warn: true },
  out_of_scope: { label: "FUERA DE ALCANCE", warn: true },
};

export function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialGarment = (location.state as { garment?: string } | null)?.garment ?? null;

  const [contextName, setContextName] = useState<string | null>(initialGarment);
  const [messages, setMessages] = useState<Message[]>(() => {
    const { lead, items } = initialSuggestions(initialGarment);
    return [
      {
        id: 0,
        role: "bot",
        text: initialGarment
          ? `¡Hola! 👋 Veo que te interesa el ${initialGarment}. ¿Qué te gustaría saber? ✨`
          : "¡Hola! 👋 Soy ModaAI. Pregúntame por prendas, materiales, colores, estilos o temporadas. ✨",
        highlight: initialGarment,
        suggestions: { lead, items },
      },
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const nextId = useRef(1);
  const asked = useRef(new Map<string, Set<AskedField>>());
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = useCallback(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, []);

  useEffect(scrollToEnd, [messages, loading, scrollToEnd]);

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { id: nextId.current++, role: "user", text }]);
    setLoading(true);

    // El mensaje del asistente aparece con el primer fragmento y crece mientras llega el texto.
    const botId = nextId.current++;
    let meta: Omit<ChatResponse, "answer"> | null = null;
    let streamed = "";
    const patch = (changes: Partial<BotMessage>) =>
      setMessages((prev) => prev.map((m) => (m.id === botId && m.role === "bot" ? { ...m, ...changes } : m)));

    try {
      const res: ChatResponse = await streamChatMessage(text, {
        onMeta: (m) => {
          meta = m;
        },
        onDelta: (delta) => {
          streamed += delta;
          if (streamed === delta) {
            const guess = meta ? emojiFor({ ...meta, answer: "" }) : "✨";
            setMessages((prev) => [
              ...prev,
              { id: botId, role: "bot", text: streamed, emoji: guess, streaming: true, highlight: meta?.garment?.name },
            ]);
          } else {
            patch({ text: streamed });
          }
        },
      });

      const field = askedFieldOf(res);
      if (res.garment && field && res.status === "answered") {
        const set = asked.current.get(res.garment.id) ?? new Set<AskedField>();
        set.add(field);
        asked.current.set(res.garment.id, set);
      }
      const final: BotMessage = {
        id: botId,
        role: "bot",
        text: res.answer,
        emoji: emojiFor(res),
        streaming: false,
        highlight: res.garment?.name,
        status: res.status,
        garment: res.garment,
        sources: res.sources,
        suggestions: followUpSuggestions(res, asked.current),
      };
      setMessages((prev) =>
        prev.some((m) => m.id === botId) ? prev.map((m) => (m.id === botId ? final : m)) : [...prev, final],
      );
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Error al conectar con el servidor.";
      const failed: BotMessage = { id: botId, role: "bot", text: `⚠️ ${message}`, error: true };
      setMessages((prev) =>
        prev.some((m) => m.id === botId) ? prev.map((m) => (m.id === botId ? failed : m)) : [...prev, failed],
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input;
    setInput("");
    void ask(text);
  };

  const lastMessage = messages[messages.length - 1];
  const lastId = lastMessage?.id;

  return (
    <div className="at-root">
      <header className="at-chead">
        <button type="button" className="at-back" aria-label="Volver a la cámara" onClick={() => navigate("/")}>
          ←
        </button>
        <div>
          <h2>ModaAI Assistant</h2>
          <span className="at-sub">Catálogo de Fashion-IA · Respuestas con fuente</span>
        </div>
      </header>

      {contextName && (
        <div className="at-ctx">
          <span>PRENDA</span>
          <b>{contextName}</b>
          <button type="button" aria-label="Quitar prenda de contexto" onClick={() => setContextName(null)}>
            ✕
          </button>
        </div>
      )}

      <div className="at-msgs" role="log" aria-live="polite">
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="at-m user">
              {m.text}
            </div>
          ) : (
            <BotBubble
              key={m.id}
              message={m}
              chipsActive={m.id === lastId && !loading}
              onTick={scrollToEnd}
              onPick={(s) => void ask(s.question)}
            />
          ),
        )}
        {loading && !(lastMessage?.role === "bot" && lastMessage.streaming) && (
          <div className="at-typing" role="status" aria-label="ModaAI está escribiendo">
            <i />
            <i />
            <i />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form className="at-form" onSubmit={handleSubmit}>
        <input
          id="chat-question"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregunta sobre una prenda o material…"
          autoComplete="off"
          maxLength={500}
          aria-label="Tu pregunta"
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}

interface BotBubbleProps {
  message: BotMessage;
  chipsActive: boolean;
  onTick: () => void;
  onPick: (suggestion: Suggestion) => void;
}

function BotBubble({ message, chipsActive, onTick, onPick }: BotBubbleProps) {
  const [done, setDone] = useState(false);
  const [liked, setLiked] = useState(false);
  const { garment, status, sources, suggestions } = message;
  const source = sources?.find((s) => s.fields.length > 0);

  const copy = () => {
    try {
      void navigator.clipboard?.writeText(`${message.emoji ?? ""} ${message.text}`.trim());
    } catch {
      /* el portapapeles puede no estar disponible */
    }
  };

  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(message.text);
    utterance.lang = "es-ES";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      <div className={`at-m bot${message.error ? " error" : ""}`}>
        {status && (
          <div className={`at-badge${BADGE[status].warn ? " warn" : ""}`}>● {BADGE[status].label}</div>
        )}
        <div className="at-txt">
          {message.emoji && <span className="at-emoji">{message.emoji} </span>}
          <TypedText
            text={message.text}
            highlight={message.highlight}
            onTick={onTick}
            onDone={() => setDone(true)}
            complete={!message.streaming}
          />
        </div>

        {done && garment && (garment.creator || garment.materials) && (
          <div className="at-gcard">
            <h4>{garment.name}</h4>
            {garment.creator && <p>CREADOR: {garment.creator}</p>}
            {garment.materials && <p>COMPOSICIÓN: {garment.materials.join(", ")}</p>}
          </div>
        )}
        {done && source && (
          <div className="at-src">
            📎 {source.document} · campo: {source.fields.join(", ")}
          </div>
        )}
        {done && status && (
          <div className="at-tools">
            <button type="button" onClick={copy}>
              📋 Copiar
            </button>
            <button type="button" aria-pressed={liked} onClick={() => setLiked((v) => !v)}>
              {liked ? "💜 Gracias" : "👍 Útil"}
            </button>
            <button type="button" onClick={speak}>
              🔊 Escuchar
            </button>
          </div>
        )}
      </div>

      {done && suggestions && (
        <div className="at-explore">
          <div className="at-lead">🧭 {suggestions.lead}</div>
          <div className="at-chips">
            {suggestions.items.map((s, i) => (
              <button
                key={s.question}
                type="button"
                className="at-chip"
                style={{ animationDelay: `${i * 110}ms` }}
                disabled={!chipsActive}
                onClick={() => onPick(s)}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
