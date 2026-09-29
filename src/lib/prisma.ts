import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const prismaClientSingleton = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // pg defaults to waiting forever on a connect. Without a bound, a cold
    // database or a suspended Neon instance parks the request until Vercel
    // kills the function, and the client sees a 504 instead of an error.
    connectionTimeoutMillis: 10_000,
    // Keep the pool small. This is a serverless deployment with many
    // concurrent short-lived functions, each opening its own pool, so the
    // real limit is (functions x max) against the database's connection cap,
    // not this number on its own. Neon pooler handles the multiplexing.
    max: 5,
    // Release idle connections instead of holding them for the default 30s,
    // since instances are recycled constantly here.
    idleTimeoutMillis: 10_000,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
