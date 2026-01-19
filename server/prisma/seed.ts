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
