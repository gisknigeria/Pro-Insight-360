require("dotenv").config();
process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.$queryRawUnsafe("SELECT 1").then(result => {
  console.log("query result", result);
}).catch(err => {
  console.error("prisma error", err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
