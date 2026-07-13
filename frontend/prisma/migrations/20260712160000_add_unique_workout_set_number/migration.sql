-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSet_workoutExerciseId_setNumber_key"
ON "WorkoutSet"("workoutExerciseId", "setNumber");
