import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  // 1) Global permissions
  const permissions = [
    { code: "admin.panel.access", module: "admin", description: "Access admin panel" },
    { code: "rbac.roles.manage", module: "rbac", description: "Manage roles" },
    { code: "rbac.permissions.manage", module: "rbac", description: "Manage permissions" },
    { code: "rbac.user_roles.manage", module: "rbac", description: "Manage user roles" },
    { code: "users.read", module: "users", description: "Read / list users" },
    { code: "users.create", module: "users", description: "Create users" },
    { code: "users.manage", module: "users", description: "Manage users (activate, block, update)" },
    { code: "users.delete", module: "users", description: "Delete users" },
    { code: "users.password.reset", module: "users", description: "Reset user passwords" },
    // Room global permissions (legacy)
    { code: "room.create", module: "rooms", description: "Create rooms" },
    { code: "room.manage", module: "rooms", description: "Manage rooms (global)" },
    // New room global permissions per chat API spec
    { code: "room.update", module: "rooms", description: "Update any room metadata" },
    { code: "room.delete", module: "rooms", description: "Soft-delete any room" },
    { code: "room.members.manage", module: "rooms", description: "Add / remove / promote members in any room" },
    { code: "room.topics.manage", module: "rooms", description: "Create / update / delete topics in any room" },
    { code: "room.topic.visibility.manage", module: "rooms", description: "Set or patch topic visibility in any room" },
    { code: "room.message.bin", module: "rooms", description: "Pin / unpin messages in any room" },
    // Other modules
    { code: "org.manage", module: "org", description: "Manage org structure" },
    { code: "task.create", module: "tasks", description: "Create tasks" },
    { code: "task.participants.view", module: "tasks", description: "View task participants and review results" },
    { code: "event.create", module: "events", description: "Create events" },
    { code: "poll.create", module: "polls", description: "Create polls" },
  ];

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

  const superAdminRole = await prisma.role.upsert({
    where: { name: "super_admin" },
    update: { description: "Super administrator with all permissions" },
    create: { name: "super_admin", description: "Super administrator with all permissions" },
  });

  const userRole = await prisma.role.upsert({
    where: { name: "user" },
    update: { description: "Regular user" },
    create: { name: "user", description: "Regular user" },
  });

  // 3) Assign ALL permissions to admin and super_admin
  const allPerms = await prisma.permission.findMany({ select: { id: true } });

  for (const role of [adminRole, superAdminRole]) {
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: allPerms.map((perm) => ({
        roleId: role.id,
        permissionId: perm.id,
      })),
      skipDuplicates: true,
    });
  }

  // 4) Super admin user
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL ?? "admin@local.com").trim().toLowerCase();
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(superAdminPassword, 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: { passwordHash },
    create: {
      email: superAdminEmail,
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: superAdmin.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: superAdmin.id, roleId: superAdminRole.id },
  });

  console.log("Global RBAC seed complete:", {
    roles: [adminRole.name, superAdminRole.name, userRole.name],
    permissions: permissions.map((p) => p.code),
    superAdmin: { email: superAdminEmail, id: superAdmin.id },
  });

  // 5) Room-level permissions
  const roomPermissions = [
    // Legacy
    { code: "room.topic.create", description: "Create topics in room" },
    { code: "room.message.create", description: "Create messages in room" },
    { code: "room.message.delete", description: "Delete messages in room" },
    { code: "room.member.invite", description: "Invite users to room" },
    { code: "room.member.kick", description: "Remove users from room" },
    { code: "room.settings.manage", description: "Manage room settings" },
    // New per chat API spec
    { code: "room.update", description: "Update room metadata" },
    { code: "room.members.manage", description: "Manage room members" },
    { code: "room.topics.manage", description: "Create / update / delete topics" },
    { code: "room.topic.visibility.manage", description: "Manage topic visibility" },
    { code: "room.message.bin", description: "Pin / unpin messages" },
  ];

  for (const p of roomPermissions) {
    await prisma.roomPermission.upsert({
      where: { code: p.code },
      update: { description: p.description },
      create: p,
    });
  }

  // 6) Room roles
  const ownerRole = await prisma.roomRole.upsert({
    where: { name: "owner" },
    update: { description: "Room owner — full control" },
    create: { name: "owner", description: "Room owner — full control" },
  });

  const adminRoomRole = await prisma.roomRole.upsert({
    where: { name: "admin" },
    update: { description: "Room admin — manage members, topics, messages" },
    create: { name: "admin", description: "Room admin — manage members, topics, messages" },
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

  // 7) Room role permissions
  const allRoomPerms = await prisma.roomPermission.findMany({
    select: { id: true, code: true },
  });

  const byCode = Object.fromEntries(
    allRoomPerms.map((p) => [p.code, p.id]),
  );

  async function setRoomRolePermissions(roleId: string, permissionCodes: string[]) {
    await prisma.roleRoomPermission.deleteMany({ where: { roomRoleId: roleId } });
    await prisma.roleRoomPermission.createMany({
      data: permissionCodes.map((code) => ({
        roomRoleId: roleId,
        roomPermissionId: byCode[code],
      })),
      skipDuplicates: true,
    });
  }

  // Owner: all room permissions
  await setRoomRolePermissions(ownerRole.id, roomPermissions.map((p) => p.code));

  // Admin: all except legacy delete (admin can do everything owner can except delete room itself via room-level)
  await setRoomRolePermissions(adminRoomRole.id, roomPermissions.map((p) => p.code));

  // Moderator: limited set
  await setRoomRolePermissions(moderatorRole.id, [
    "room.topic.create",
    "room.message.create",
    "room.message.delete",
    "room.member.invite",
    "room.topics.manage",
    "room.message.bin",
  ]);

  // Member: basic messaging
  await setRoomRolePermissions(memberRole.id, [
    "room.message.create",
  ]);

  console.log("Room RBAC seed complete:", {
    roomRoles: [ownerRole.name, adminRoomRole.name, moderatorRole.name, memberRole.name],
    roomPermissions: roomPermissions.map((p) => p.code),
  });
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
