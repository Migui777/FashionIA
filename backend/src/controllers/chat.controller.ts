import type { NextFunction, Request, Response } from "express";
import { chatService } from "../services/chat.service";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export const chatController = {
  async ask(req: Request, res: Response, next: NextFunction) {
    try {
      const { dressId, message } = req.body ?? {};

      if (typeof dressId !== "string" || dressId.trim().length === 0) {
        throw new ValidationError("dressId is required");
      }
      if (typeof message !== "string" || message.trim().length === 0) {
        throw new ValidationError("message is required");
      }

      const reply = await chatService.ask(dressId, message.trim());
      res.json({ message: reply });
    } catch (err) {
      next(err);
    }
  },
};
