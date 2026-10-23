import { GoogleGenAI } from "@google/genai";

/**
 * Crea el cliente de Gemini según el tipo de clave:
 *  - Clave de Google AI Studio (empieza con "AIza")  -> API de Gemini normal.
 *  - Clave de Vertex AI modo express (empieza con "AQ.") -> modo Vertex.
 * Se puede forzar con GEMINI_VERTEX=true | false.
 */
export function createGeminiClient(apiKey: string, env: NodeJS.ProcessEnv = process.env): GoogleGenAI {
  const forced = env.GEMINI_VERTEX?.toLowerCase();
  const vertexai = forced === "true" ? true : forced === "false" ? false : apiKey.startsWith("AQ.");
  return new GoogleGenAI({ apiKey, vertexai });
}
