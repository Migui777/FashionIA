import type { NextFunction, Request, Response } from "express";
import { DressNotFoundError } from "../services/dress.service";
import { ValidationError } from "../controllers/chat.controller";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Route not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof DressNotFoundError) {
    return res.status(404).json({ error: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
