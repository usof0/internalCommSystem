import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  // 1) Permissions you want initially
  const permissions = [
    { code: "rbac.roles.manage", module: "rbac", description: "Manage roles" },
    { code: "rbac.permissions.manage", module: "rbac", description: "Manage permissions" },
    { code: "rbac.user_roles.manage", module: "rbac", description: "Manage user roles" },
    { code: "users.list", module: "users", description: "List/search users" },
    { code: "users.read", module: "users", description: "Read a user by id" },
    { code: "room.create", module: "rooms", description: "Create rooms" },
    { code: "room.manage", module: "rooms", description: "Manage rooms (global)" },
    { code: "org.manage", module: "org", description: "Manage org structure" },
    { code: "task.create", module: "tasks", description: "Create tasks" },
    { code: "event.create", module: "events", description: "Create events" },
    { code: "poll.create", module: "polls", description: "Create polls" },
  ];


  // Upsert permissions
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { module: p.module, description: p.description },
      create: p,
    });
  }

  // 2) Roles
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: { description: "System administrator" },
    create: { name: "admin", description: "System administrator" },
  });

  const userRole = await prisma.role.upsert({
    where: { name: "user" },
    update: { description: "Regular user" },
    create: { name: "user", description: "Regular user" },
  });

  // 3) Assign ALL permissions to admin
  const allPerms = await prisma.permission.findMany({ select: { id: true } });
  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });

  await prisma.rolePermission.createMany({
    data: allPerms.map((perm) => ({
      roleId: adminRole.id,
      permissionId: perm.id,
    })),
    skipDuplicates: true,
  });

  console.log("Seed complete:", {
    roles: [adminRole.name, userRole.name],
    permissions: permissions.map((p) => p.code),
  });

  // 1.1) Room-level permissions
  const roomPermissions = [
    { code: "room.topic.create", description: "Create topics in room" },
    { code: "room.message.create", description: "Create messages in room" },
    { code: "room.message.delete", description: "Delete messages in room" },
    { code: "room.member.invite", description: "Invite users to room" },
    { code: "room.member.kick", description: "Remove users from room" },
    { code: "room.settings.manage", description: "Manage room settings" },
  ];

  for (const p of roomPermissions) {
    await prisma.roomPermission.upsert({
      where: { code: p.code },
      update: { description: p.description },
      create: p,
    });
  }

  // 2.1) Room roles
  const ownerRole = await prisma.roomRole.upsert({
    where: { name: "owner" },
    update: { description: "Room owner" },
    create: { name: "owner", description: "Room owner" },
  });

  const moderatorRole = await prisma.roomRole.upsert({
    where: { name: "moderator" },
    update: { description: "Room moderator" },
    create: { name: "moderator", description: "Room moderator" },
  });

  const memberRole = await prisma.roomRole.upsert({
    where: { name: "member" },
    update: { description: "Room member" },
    create: { name: "member", description: "Room member" },
  });

  // 2.2) Fetch room permissions
  const allRoomPerms = await prisma.roomPermission.findMany({
    select: { id: true, code: true },
  });

  const byCode = Object.fromEntries(
    allRoomPerms.map((p) => [p.code, p.id]),
  );

  // 2.3.1) Helper to assign permissions
  async function setRoomRolePermissions(
    roleId: string,
    permissionCodes: string[],
  ) {
    await prisma.roleRoomPermission.deleteMany({
      where: { roomRoleId: roleId },
    });

    await prisma.roleRoomPermission.createMany({
      data: permissionCodes.map((code) => ({
        roomRoleId: roleId,
        roomPermissionId: byCode[code],
      })),
      skipDuplicates: true,
    });
  }

  // 2.3.2) owner → all permissions
  await setRoomRolePermissions(
    ownerRole.id,
    roomPermissions.map((p) => p.code),
  );

  // 2.3.3) moderator → limited set
  await setRoomRolePermissions(moderatorRole.id, [
    "room.topic.create",
    "room.message.create",
    "room.message.delete",
    "room.member.invite",
  ]);

  // 2.3.4) member → basic permissions
  await setRoomRolePermissions(memberRole.id, [
    "room.message.create",
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
