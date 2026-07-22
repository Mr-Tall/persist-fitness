-- AlterTable
ALTER TABLE "Exercise"
ADD COLUMN "movementPattern" TEXT,
ADD COLUMN "exerciseType" TEXT,
ADD COLUMN "laterality" TEXT,
ADD COLUMN "tips" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "thumbnailUrl" TEXT,
ADD COLUMN "trackingType" TEXT;
