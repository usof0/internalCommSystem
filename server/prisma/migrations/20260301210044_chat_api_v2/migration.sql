/*
  Warnings:

  - You are about to drop the `TopicVisibility` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('DIRECT', 'GROUP');

-- CreateEnum
CREATE TYPE "VisibilityScopeType" AS ENUM ('ALL_MEMBERS', 'INCLUDE_MEMBERS', 'EXCLUDE_MEMBERS', 'ORG_UNIT', 'ORG_UNIT_TAG');

-- DropForeignKey
ALTER TABLE "TopicVisibility" DROP CONSTRAINT "TopicVisibility_topicId_fkey";

-- DropForeignKey
ALTER TABLE "TopicVisibility" DROP CONSTRAINT "TopicVisibility_userId_fkey";

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "type" "RoomType" NOT NULL DEFAULT 'GROUP';

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "TopicVisibility";

-- CreateTable
CREATE TABLE "TopicVisibilityScope" (
    "id" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "scopeType" "VisibilityScopeType" NOT NULL,
    "includeSubUnits" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicVisibilityScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicVisibilityMember" (
    "scopeId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "TopicVisibilityMember_pkey" PRIMARY KEY ("scopeId","userId")
);

-- CreateTable
CREATE TABLE "TopicVisibilityOrgUnit" (
    "scopeId" UUID NOT NULL,
    "orgUnitId" UUID NOT NULL,

    CONSTRAINT "TopicVisibilityOrgUnit_pkey" PRIMARY KEY ("scopeId","orgUnitId")
);

-- CreateTable
CREATE TABLE "TopicVisibilityOrgUnitTag" (
    "scopeId" UUID NOT NULL,
    "tagId" UUID NOT NULL,

    CONSTRAINT "TopicVisibilityOrgUnitTag_pkey" PRIMARY KEY ("scopeId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "TopicVisibilityScope_topicId_key" ON "TopicVisibilityScope"("topicId");

-- CreateIndex
CREATE INDEX "TopicVisibilityScope_topicId_idx" ON "TopicVisibilityScope"("topicId");

-- CreateIndex
CREATE INDEX "TopicVisibilityMember_userId_idx" ON "TopicVisibilityMember"("userId");

-- CreateIndex
CREATE INDEX "TopicVisibilityOrgUnit_orgUnitId_idx" ON "TopicVisibilityOrgUnit"("orgUnitId");

-- CreateIndex
CREATE INDEX "TopicVisibilityOrgUnitTag_tagId_idx" ON "TopicVisibilityOrgUnitTag"("tagId");

-- CreateIndex
CREATE INDEX "Room_type_idx" ON "Room"("type");

-- AddForeignKey
ALTER TABLE "TopicVisibilityScope" ADD CONSTRAINT "TopicVisibilityScope_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicVisibilityMember" ADD CONSTRAINT "TopicVisibilityMember_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "TopicVisibilityScope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicVisibilityMember" ADD CONSTRAINT "TopicVisibilityMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicVisibilityOrgUnit" ADD CONSTRAINT "TopicVisibilityOrgUnit_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "TopicVisibilityScope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicVisibilityOrgUnit" ADD CONSTRAINT "TopicVisibilityOrgUnit_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicVisibilityOrgUnitTag" ADD CONSTRAINT "TopicVisibilityOrgUnitTag_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "TopicVisibilityScope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicVisibilityOrgUnitTag" ADD CONSTRAINT "TopicVisibilityOrgUnitTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
