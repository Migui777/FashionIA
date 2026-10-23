import { aiProvider } from "../ai";
import { dressService } from "./dress.service";
import type { DressContext } from "../types/chat";

export const chatService = {
  async ask(dressId: string, message: string): Promise<string> {
    const dress = await dressService.getById(dressId);

    const context: DressContext = {
      name: dress.name,
      designer: dress.designer,
      materials: dress.materials,
      description: dress.description,
      collection: dress.collection,
      category: dress.category,
      color: dress.color,
      story: dress.story,
    };

    return aiProvider.chat(message, context);
  },
};
