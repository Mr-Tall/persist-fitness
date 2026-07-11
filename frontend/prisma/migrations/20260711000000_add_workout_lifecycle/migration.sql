-- Add workout lifecycle fields without assigning new-workout defaults to legacy rows.
ALTER TABLE "Workout"
ADD COLUMN "status" TEXT,
ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "finishedAt" TIMESTAMP(3);

-- Workouts created before lifecycle tracking represent historical, completed sessions.
UPDATE "Workout"
SET
  "status" = 'completed',
  "startedAt" = "date",
  "finishedAt" = GREATEST("date", "updatedAt");

-- New workouts start active at creation time; finishedAt remains nullable until completion.
ALTER TABLE "Workout"
ALTER COLUMN "status" SET DEFAULT 'active',
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "startedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "startedAt" SET NOT NULL;
