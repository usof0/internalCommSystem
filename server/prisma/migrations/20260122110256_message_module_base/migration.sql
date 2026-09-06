-- CreateTable
CREATE TABLE "Room" (
    "id" UUID NOT NULL,
    "creatorId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "creatorId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "parentId" UUID,
    "content" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicVisibility" (
    "userId" UUID NOT NULL,
    "topicId" UUID NOT NULL,

    CONSTRAINT "TopicVisibility_pkey" PRIMARY KEY ("userId","topicId")
);

-- CreateTable
CREATE TABLE "UserReadMessage" (
    "userId" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReadMessage_pkey" PRIMARY KEY ("userId","messageId")
);

-- CreateTable
CREATE TABLE "UserReceiveMessage" (
    "userId" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReceiveMessage_pkey" PRIMARY KEY ("userId","messageId")
);

-- CreateTable
CREATE TABLE "RoomRole" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomPermission" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleRoomPermission" (
    "roomRoleId" UUID NOT NULL,
    "roomPermissionId" UUID NOT NULL,

    CONSTRAINT "RoleRoomPermission_pkey" PRIMARY KEY ("roomRoleId","roomPermissionId")
);

-- CreateTable
CREATE TABLE "UserRoomMembership" (
    "userId" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "roomRoleId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRoomMembership_pkey" PRIMARY KEY ("userId","roomId")
);

-- CreateIndex
CREATE INDEX "Room_creatorId_idx" ON "Room"("creatorId");

-- CreateIndex
CREATE INDEX "Topic_roomId_idx" ON "Topic"("roomId");

-- CreateIndex
CREATE INDEX "Topic_creatorId_idx" ON "Topic"("creatorId");

-- CreateIndex
CREATE INDEX "Message_topicId_idx" ON "Message"("topicId");

-- CreateIndex
CREATE INDEX "Message_authorId_idx" ON "Message"("authorId");

-- CreateIndex
CREATE INDEX "Message_parentId_idx" ON "Message"("parentId");

-- CreateIndex
CREATE INDEX "TopicVisibility_topicId_idx" ON "TopicVisibility"("topicId");

-- CreateIndex
CREATE INDEX "UserReadMessage_messageId_idx" ON "UserReadMessage"("messageId");

-- CreateIndex
CREATE INDEX "UserReceiveMessage_messageId_idx" ON "UserReceiveMessage"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomRole_name_key" ON "RoomRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RoomPermission_code_key" ON "RoomPermission"("code");

-- CreateIndex
CREATE INDEX "RoleRoomPermission_roomPermissionId_idx" ON "RoleRoomPermission"("roomPermissionId");

-- CreateIndex
CREATE INDEX "UserRoomMembership_roomId_idx" ON "UserRoomMembership"("roomId");

-- CreateIndex
CREATE INDEX "UserRoomMembership_roomRoleId_idx" ON "UserRoomMembership"("roomRoleId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicVisibility" ADD CONSTRAINT "TopicVisibility_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicVisibility" ADD CONSTRAINT "TopicVisibility_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReadMessage" ADD CONSTRAINT "UserReadMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReadMessage" ADD CONSTRAINT "UserReadMessage_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReceiveMessage" ADD CONSTRAINT "UserReceiveMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReceiveMessage" ADD CONSTRAINT "UserReceiveMessage_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleRoomPermission" ADD CONSTRAINT "RoleRoomPermission_roomRoleId_fkey" FOREIGN KEY ("roomRoleId") REFERENCES "RoomRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleRoomPermission" ADD CONSTRAINT "RoleRoomPermission_roomPermissionId_fkey" FOREIGN KEY ("roomPermissionId") REFERENCES "RoomPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoomMembership" ADD CONSTRAINT "UserRoomMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoomMembership" ADD CONSTRAINT "UserRoomMembership_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoomMembership" ADD CONSTRAINT "UserRoomMembership_roomRoleId_fkey" FOREIGN KEY ("roomRoleId") REFERENCES "RoomRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
