import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEMO_GARMENTS } from "../features/augmented-reality/demoGarments";
import "../styles/atelier.css";

const FIRST_DETECTION_MS = 2600;
const DETECTION_CYCLE_MS = 14000;
const BANNER_VISIBLE_MS = 9000;

const BOKEH = [
  { top: "14%", left: "18%", size: 60, delay: 0 },
  { top: "60%", left: "70%", size: 46, delay: 0.8 },
  { top: "76%", left: "12%", size: 38, delay: 1.4 },
  { top: "30%", left: "78%", size: 54, delay: 2 },
];

/**
 * Home: cámara simulada. No pide la cámara real ni reconoce prendas; recorre
 * prendas de demostración para mostrar el flujo "detectar → ver más información → chat".
 * Cuando exista el reconocimiento real se reemplaza esta simulación.
 */
export function HomePage() {
  const navigate = useNavigate();
  // `index` conserva la última prenda para que el banner no cambie de texto mientras se oculta.
  const [detection, setDetection] = useState({ index: 0, visible: false });

  useEffect(() => {
    let cursor = 0;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const detect = () => {
      setDetection({ index: cursor++ % DEMO_GARMENTS.length, visible: true });
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setDetection((d) => ({ ...d, visible: false })), BANNER_VISIBLE_MS);
    };

    const first = setTimeout(detect, FIRST_DETECTION_MS);
    const cycle = setInterval(detect, DETECTION_CYCLE_MS);
    return () => {
      clearTimeout(first);
      clearInterval(cycle);
      clearTimeout(hideTimer);
    };
  }, []);

  const shown = DEMO_GARMENTS[detection.index];
  const garment = detection.visible ? shown : null;

  return (
    <div className="at-root">
      <div className="at-cam" aria-hidden="true">
        {BOKEH.map((b) => (
          <i
            key={b.top}
            className="at-bokeh"
            style={{ top: b.top, left: b.left, width: b.size, height: b.size, animationDelay: `${b.delay}s` }}
          />
        ))}
        <div className="at-frame">
          <div className={`at-silhouette${garment ? " show" : ""}`} />
          <b className="at-corner tl" />
          <b className="at-corner tr" />
          <b className="at-corner bl" />
          <b className="at-corner br" />
          <div className="at-scanline" />
        </div>
      </div>

      <div className="at-htop">
        <div>
          <h1 className="at-logo">Fashion-IA</h1>
          <span className="at-sub">Pasarela · Modo demo</span>
        </div>
        <div className="at-rec">
          <i />
          SIMULACIÓN
        </div>
      </div>

      <div className="at-status" role="status">
        {garment ? "✦ Prenda identificada" : "Escaneando pasarela…"}
      </div>

      <div className={`at-banner${garment ? " show" : ""}`} aria-hidden={!garment}>
        <div className="at-tag">
          <i />
          Prenda detectada
        </div>
        <h3>{shown.name}</h3>
        <div className="at-by">
          {shown.creator} · {shown.collection}
        </div>
        <p>{shown.summary}</p>
        <button
          type="button"
          className="at-cta"
          tabIndex={garment ? 0 : -1}
          onClick={() => navigate("/chat", { state: { garment: shown.name } })}
        >
          Ver más información…
        </button>
      </div>

      <button type="button" className="at-fab" aria-label="Abrir el chat" onClick={() => navigate("/chat")}>
        {!garment && <small>Pregúntale a la IA</small>}
        💬
      </button>
    </div>
  );
}
