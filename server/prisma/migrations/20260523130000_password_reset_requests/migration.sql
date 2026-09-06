CREATE TYPE "PasswordResetStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'USED', 'EXPIRED');

CREATE TABLE "PasswordResetRequest" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "requestedEmail" VARCHAR(320) NOT NULL,
    "reason" TEXT,
    "status" "PasswordResetStatus" NOT NULL DEFAULT 'PENDING',
    "temporaryPasswordHash" VARCHAR(255),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "temporaryPasswordExpiresAt" TIMESTAMP(3),
    "processedById" UUID,
    "processedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PasswordResetRequest_userId_idx" ON "PasswordResetRequest"("userId");
CREATE INDEX "PasswordResetRequest_status_idx" ON "PasswordResetRequest"("status");
CREATE INDEX "PasswordResetRequest_expiresAt_idx" ON "PasswordResetRequest"("expiresAt");
CREATE INDEX "PasswordResetRequest_processedById_idx" ON "PasswordResetRequest"("processedById");

ALTER TABLE "PasswordResetRequest"
ADD CONSTRAINT "PasswordResetRequest_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PasswordResetRequest"
ADD CONSTRAINT "PasswordResetRequest_processedById_fkey"
FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
