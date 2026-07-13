-- CreateIndex
CREATE UNIQUE INDEX "Workout_one_active_per_user_key"
ON "Workout"("userId")
WHERE "status" = 'active';
