import "dotenv/config";
import { createGeminiClient } from "./src/ai/geminiClient";

async function main() {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  console.log("AI_PROVIDER    =", process.env.AI_PROVIDER ?? "(no definido)");
  console.log("CHATBOT_SOURCE =", process.env.CHATBOT_SOURCE ?? "(no definido)");
  console.log("GEMINI_MODEL   =", model);

  if ((process.env.AI_PROVIDER ?? "").toLowerCase() !== "gemini") {
    console.log("\n[PROBLEMA] AI_PROVIDER no es 'gemini'. Cambialo en backend\\.env y reinicia el servidor.");
  }
  if (!key) {
    console.log("\n[PROBLEMA] GEMINI_API_KEY no se cargo. Revisa que el archivo se llame .env y este en backend\\.");
    return;
  }

  console.log(
    "GEMINI_API_KEY = cargada (prefijo:",
    key.slice(0, 3) + "..., longitud:",
    key.length + ", modo:",
    key.startsWith("AQ.") ? "Vertex express)" : "AI Studio)",
  );

  console.log("\nLlamando a Gemini...");
  try {
    const client = createGeminiClient(key);
    const res = await client.models.generateContent({ model, contents: "Di hola en una frase corta." });
    console.log("[OK] Gemini respondio:", res.text);
  } catch (err) {
    const e = err as { message?: string; status?: number };
    console.log("[ERROR] Gemini fallo.");
    if (e.status) console.log("Codigo HTTP:", e.status);
    console.log("Mensaje:", e.message ?? err);
    console.log("\n(Si el mensaje incluye tu key, borrala antes de compartirlo.)");
  }
}

main();
