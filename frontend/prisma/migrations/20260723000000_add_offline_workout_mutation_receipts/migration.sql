-- A durable receipt makes replay after a lost response idempotent. It stores no
-- workout values and is removed automatically with its owning user.
CREATE TABLE "OfflineWorkoutMutationReceipt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "resultSetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfflineWorkoutMutationReceipt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OfflineWorkoutMutationReceipt_userId_workoutId_idx"
ON "OfflineWorkoutMutationReceipt"("userId", "workoutId");

CREATE INDEX "OfflineWorkoutMutationReceipt_createdAt_idx"
ON "OfflineWorkoutMutationReceipt"("createdAt");

ALTER TABLE "OfflineWorkoutMutationReceipt"
ADD CONSTRAINT "OfflineWorkoutMutationReceipt_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OfflineWorkoutMutationReceipt"
ADD CONSTRAINT "OfflineWorkoutMutationReceipt_workoutId_fkey"
FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
