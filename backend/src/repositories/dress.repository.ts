import { prisma } from "../database/prisma";
import type { Dress } from "../types/dress";

export const dressRepository = {
  findAll(): Promise<Dress[]> {
    return prisma.dress.findMany({ orderBy: { createdAt: "asc" } });
  },

  findById(id: string): Promise<Dress | null> {
    return prisma.dress.findUnique({ where: { id } });
  },
};
