import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function ensureUser(userId: string) {
  // Fast path: user already exists with this id
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error(`Could not load Clerk profile for user ${userId}`);
  }

  const email =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error(`Clerk user ${userId} has no email address on file`);
  }

  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  // Check if a record already exists with this email (different id)
  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail) {
    // Re-key the existing record to the current Clerk userId
    if (existingByEmail.id !== userId) {
      await prisma.$executeRawUnsafe(
        'UPDATE "User" SET id = $1 WHERE id = $2',
        userId,
        existingByEmail.id
      );
    }
    return prisma.user.findUnique({ where: { id: userId } });
  }

  // Brand new user — create the record
  return prisma.user.create({
    data: { id: userId, email, name },
  });
}
