-- AlterTable
ALTER TABLE "User"
ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

-- Existing accounts are returning users and should not be shown first-time onboarding.
UPDATE "User"
SET "onboardingCompletedAt" = CURRENT_TIMESTAMP
WHERE "onboardingCompletedAt" IS NULL;
