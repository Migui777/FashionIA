import cors from "cors";
import express from "express";
import helmet from "helmet";
import { apiRouter } from "./routes";
import { createChatV1Router } from "./routes/chatV1.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    }),
  );
  // Contrato v0.1 del chatbot: lleva su propio parser JSON y formato de error, va antes del global.
  app.use("/api/v1/chat", createChatV1Router());

  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
