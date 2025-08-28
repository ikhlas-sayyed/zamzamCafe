import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1. Delete all existing users
  await prisma.user.deleteMany();
  console.log("🗑️ All users deleted");

  // 2. Hash the default password
  const password = 'password123'

  // 3. Insert default users
  await prisma.user.createMany({
    data: [
      {
        username: "waiter",
        email: "waiter@example.com",
        password,
        role: Role.waiter,
        firstName: "Default",
        lastName: "Waiter",
      },
      {
        username: "chef",
        email: "chef@example.com",
        password,
        role: Role.chef,
        firstName: "Default",
        lastName: "Chef",
      },
      {
        username: "admin",
        email: "admin@example.com",
        password,
        role: Role.admin,
        firstName: "Default",
        lastName: "Admin",
      },
    ],
  });

  console.log("✅ Default users created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
