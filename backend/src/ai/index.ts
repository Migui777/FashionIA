import type { AIProvider } from "./AIProvider";
import { MockAIProvider } from "./MockAIProvider";
import { GeminiProvider } from "./GeminiProvider";
import { createGeminiClient } from "./geminiClient";
import type { DressContext } from "../types/chat";

/**
 * Si Gemini falla (cuota, red, key inválida) respondemos con el mock
 * para que la demo no se rompa. El error real queda en consola.
 */
class FallbackProvider implements AIProvider {
  constructor(
    private readonly primary: AIProvider,
    private readonly fallback: AIProvider,
  ) {}

  async chat(message: string, context: DressContext): Promise<string> {
    try {
      return await this.primary.chat(message, context);
    } catch (err) {
      console.error("[AI] Gemini falló, usando mock:", err);
      return this.fallback.chat(message, context);
    }
  }
}

function createAIProvider(): AIProvider {
  if (process.env.NODE_ENV === "test") {
    return new MockAIProvider();
  }

  const provider = (process.env.AI_PROVIDER ?? "mock").toLowerCase();

  switch (provider) {
    case "mock":
      return new MockAIProvider();
    case "gemini": {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("AI_PROVIDER=gemini pero falta GEMINI_API_KEY, usando mock.");
        return new MockAIProvider();
      }
      const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
      return new FallbackProvider(new GeminiProvider(createGeminiClient(apiKey), model), new MockAIProvider());
    }
    default:
      console.warn(`Unknown AI_PROVIDER "${provider}", falling back to mock.`);
      return new MockAIProvider();
  }
}

export const aiProvider = createAIProvider();
