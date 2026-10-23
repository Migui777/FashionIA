import { Router } from "express";
import { chatController } from "../controllers/chat.controller";

export const chatRouter = Router();

chatRouter.post("/", chatController.ask);
