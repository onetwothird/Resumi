-- Align the database with the schema.
--
-- @updatedAt is managed by the Prisma client, which writes the new value on
-- every update. The DEFAULT CURRENT_TIMESTAMP added alongside createdAt is
-- therefore redundant, and leaving it in place means `prisma migrate dev` sees
-- drift and generates a migration to remove it later. Dropping it now keeps
-- the schema and the database byte-for-byte in agreement.

ALTER TABLE "Payment" ALTER COLUMN "updatedAt" DROP DEFAULT;
