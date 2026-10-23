-- CreateEnum
CREATE TYPE "AREffectType" AS ENUM ('particles', 'glow', 'floating_text', 'model_3d', 'frame');

-- CreateTable
CREATE TABLE "Dress" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "designer" TEXT,
    "collection" TEXT,
    "category" TEXT,
    "color" TEXT,
    "materials" TEXT,
    "imageUrl" TEXT,
    "model3dUrl" TEXT,
    "arEffectType" "AREffectType" NOT NULL DEFAULT 'glow',
    "arEffectAssetUrl" TEXT,
    "arEffectIntensity" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "story" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dress_pkey" PRIMARY KEY ("id")
);
