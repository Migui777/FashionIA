import type { NextFunction, Request, Response } from "express";
import { dressService } from "../services/dress.service";

export const dressController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const dresses = await dressService.getAll();
      res.json(dresses);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const dress = await dressService.getById(req.params.id);
      res.json(dress);
    } catch (err) {
      next(err);
    }
  },

  async getAREffect(req: Request, res: Response, next: NextFunction) {
    try {
      const effect = await dressService.getAREffect(req.params.id);
      res.json(effect);
    } catch (err) {
      next(err);
    }
  },
};
