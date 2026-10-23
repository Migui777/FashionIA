import type { DressContext } from "../types/chat";

export interface AIProvider {
  chat(message: string, context: DressContext): Promise<string>;
}
