-- AlterTable
ALTER TABLE "WorkoutSet"
ADD COLUMN "durationSeconds" INTEGER,
ADD COLUMN "distance" DOUBLE PRECISION,
ADD COLUMN "distanceUnit" TEXT;

-- Normalize the legacy bodyweight label to the supported reps-only mode.
UPDATE "Exercise"
SET "trackingType" = 'reps_only'
WHERE "trackingType" IN ('bodyweight_reps', 'reps');
