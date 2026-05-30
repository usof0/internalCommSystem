CREATE TYPE "RegistrationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "RegistrationRequest" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100),
    "secondName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "displayName" VARCHAR(160),
    "status" "RegistrationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "processedById" UUID,
    "processedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RegistrationRequest_email_idx" ON "RegistrationRequest"("email");
CREATE INDEX "RegistrationRequest_status_idx" ON "RegistrationRequest"("status");
CREATE INDEX "RegistrationRequest_processedById_idx" ON "RegistrationRequest"("processedById");
CREATE INDEX "RegistrationRequest_createdUserId_idx" ON "RegistrationRequest"("createdUserId");

ALTER TABLE "RegistrationRequest"
ADD CONSTRAINT "RegistrationRequest_processedById_fkey"
FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
