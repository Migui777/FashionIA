import { useState, useRef, useEffect } from 'react';
import type { ChatResponse, Garment } from './types/chat';
import { sendChatMessage } from './services/chatService';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  status?: string;
  garment?: Garment | null;
}

export default function App() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: '¡Hola! Soy tu asistente de Fashion-IA. Pregúntame sobre los materiales, inspiración o diseñadores de nuestra colección.',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userText = question.trim();
    setQuestion('');

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res: ChatResponse = await sendChatMessage(userText);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.answer,
        status: res.status,
        garment: res.garment,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: err.message || 'Error al conectar con el servidor.',
        status: 'error',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F0EDE4', // Marfil (Papel del atelier)
        color: '#613312',           // Café oscuro (Texto de cuerpo)
        fontFamily: "'EB Garamond', Georgia, serif", // Tipografía de lectura
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Importación de tipografías oficiales */}
      <link
        href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700&family=EB+Garamond:ital,wght@0,400..700;1,400..700&family=IBM+Plex+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          display: 'flex',
          flexDirection: 'column',
          height: '90vh',
          backgroundColor: '#F0EDE4',
          border: '1px solid #507454', // Filete Verde viñedo de 1px
          borderRadius: '0px',         // Todo cuadrado
          boxSizing: 'border-box',
        }}
      >
        {/* Cabecera del Prototipo */}
        <header
          style={{
            padding: '20px',
            borderBottom: '1px solid #507454',
            textAlign: 'center',
            backgroundColor: '#F0EDE4',
          }}
        >
          <h1
            style={{
              color: '#385438',       // Verde viñedo para títulos
              fontFamily: "'EB Garamond', serif",
              margin: 0,
              fontSize: '2rem',
              fontWeight: '600',
              letterSpacing: '0.5px',
            }}
          >
            Fashion-IA
          </h1>
          <p
            style={{
              color: '#613312',
              fontFamily: "'Archivo', sans-serif",
              margin: '4px 0 0 0',
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            ATELIER & CHATBOT INTERACTIVO
          </p>
        </header>

        {/* Área de Historial de Conversación */}
        <div
          style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '16px',
                  borderRadius: '0px', // Esquinas totalmente cuadradas
                  backgroundColor: msg.sender === 'user' ? '#B0906A' : '#F0EDE4', // Café crema / Marfil
                  color: msg.sender === 'user' ? '#F0EDE4' : '#613312',
                  border: msg.sender === 'user' ? 'none' : '1px solid #507454',
                  boxShadow: 'none',   // Sin sombras (regla del sistema)
                }}
              >
                {/* Badge de Estado para respuestas del bot */}
                {msg.status && msg.status !== 'error' && (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontFamily: "'IBM Plex Mono', monospace",
                      borderRadius: '12px', // Forma de píldora para chips
                      marginBottom: '10px',
                      border: '1px solid #507454',
                      color: '#385438',
                      backgroundColor: '#F0EDE4',
                    }}
                  >
                    • {msg.status === 'answered' ? 'IDENTIFICADA' : msg.status.toUpperCase()}
                  </span>
                )}

                <p
                  style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    lineHeight: '1.5',
                    fontFamily: "'EB Garamond', serif",
                  }}
                >
                  {msg.text}
                </p>

                {/* Tarjeta de Prenda (Datos Técnicos) */}
                {msg.garment && (
                  <div
                    style={{
                      marginTop: '14px',
                      padding: '14px',
                      backgroundColor: '#F0EDE4',
                      border: '1px solid #507454',
                      borderRadius: '0px',
                    }}
                  >
                    <h4
                      style={{
                        margin: '0 0 8px 0',
                        color: '#385438',
                        fontFamily: "'EB Garamond', serif",
                        fontSize: '1.2rem',
                        fontWeight: '600',
                      }}
                    >
                      {msg.garment.name}
                    </h4>
                    <p
                      style={{
                        margin: '4px 0',
                        fontFamily: "'Archivo', sans-serif",
                        fontSize: '0.85rem',
                        color: '#613312',
                      }}
                    >
                      <strong>CREADOR:</strong> {msg.garment.creator}
                    </p>
                    <p
                      style={{
                        margin: '4px 0',
                        fontFamily: "'IBM Plex Mono', monospace", // Datos de la prenda en Plex Mono
                        fontSize: '0.8rem',
                        color: '#613312',
                      }}
                    >
                      COMPOSICIÓN: {msg.garment.materials.join(', ')}
                    </p>
                    {msg.garment.inspiration && (
                      <p
                        style={{
                          margin: '6px 0 0 0',
                          fontFamily: "'EB Garamond', serif",
                          fontSize: '0.95rem',
                          fontStyle: 'italic',
                          color: '#613312',
                        }}
                      >
                        "{msg.garment.inspiration}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div
              style={{
                alignSelf: 'flex-start',
                color: '#385438',
                fontSize: '0.9rem',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              [ BUSCANDO EN EL ATELIER... ]
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Formulario de Entrada */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '16px',
            backgroundColor: '#F0EDE4',
            borderTop: '1px solid #507454',
            display: 'flex',
            gap: '12px',
          }}
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Pregunta sobre una prenda o material..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '0px',          // Esquinas totalmente cuadradas
              border: '1px solid #507454',   // Filete Verde viñedo
              backgroundColor: '#F0EDE4',
              color: '#613312',
              fontSize: '0.95rem',
              fontFamily: "'Archivo', sans-serif", // Elementos de interacción en Archivo
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              borderRadius: '0px',          // Esquinas cuadradas
              border: 'none',
              backgroundColor: '#4F1036',   // Burdeos (Único color de acento)
              color: '#F0EDE4',             // Marfil
              fontFamily: "'Archivo', sans-serif",
              fontSize: '0.85rem',
              fontWeight: '600',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}