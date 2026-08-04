import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const prismaClientSingleton = () => {
  // 1. Create a database connection pool using your environment variable
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  // 2. Wrap the pool in Prisma's PostgreSQL adapter
  const adapter = new PrismaPg(pool);
  
  // 3. Pass the adapter to PrismaClient
  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;