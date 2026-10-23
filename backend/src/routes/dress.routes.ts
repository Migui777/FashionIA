import { Router } from "express";
import { dressController } from "../controllers/dress.controller";

export const dressRouter = Router();

dressRouter.get("/", dressController.list);
dressRouter.get("/:id", dressController.getById);
dressRouter.get("/:id/ar-effect", dressController.getAREffect);
