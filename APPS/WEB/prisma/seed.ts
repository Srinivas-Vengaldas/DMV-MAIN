import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const staffPassword = await bcrypt.hash("Staff@123", 10);

  await prisma.user.upsert({
    where: { email: "admin1@smartdmv.gov" },
    update: {
      role: UserRole.ADMIN,
    },
    create: {
      email: "admin1@smartdmv.gov",
      password: adminPassword,
      firstName: "Admin",
      lastName: "One",
      phone: "2025550101",
      role: UserRole.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "staff1@smartdmv.gov" },
    update: {
      role: UserRole.STAFF,
    },
    create: {
      email: "staff1@smartdmv.gov",
      password: staffPassword,
      firstName: "Staff",
      lastName: "One",
      phone: "2025550102",
      role: UserRole.STAFF,
    },
  });

  console.log("Seeded admin and staff users.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });