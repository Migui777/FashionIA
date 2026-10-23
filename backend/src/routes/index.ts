import { Router } from "express";
import { dressRouter } from "./dress.routes";
import { chatRouter } from "./chat.routes";

export const apiRouter = Router();

apiRouter.use("/dresses", dressRouter);
apiRouter.use("/chat", chatRouter);
