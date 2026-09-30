-- PayMongo checkout support.
--
-- Adds the plan state on User and a Payment ledger row per attempted purchase.
-- Both are additive: existing rows default to plan = 'free' and have no
-- payments, so nothing backfills and no NOT NULL constraint is added to a
-- populated table.

ALTER TABLE "User"
  ADD COLUMN "plan" TEXT DEFAULT 'free',
  ADD COLUMN "planStatus" TEXT,
  ADD COLUMN "planExpiresAt" TIMESTAMP(3),
  ADD COLUMN "paymongoCustomerId" TEXT,
  ADD COLUMN "paymongoSubscriptionId" TEXT;

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'paymongo',
  "plan" TEXT NOT NULL,
  "interval" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'PHP',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "checkoutSessionId" TEXT,
  "paymongoPaymentId" TEXT,
  "paidAt" TIMESTAMP(3),

  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- A checkout session maps to at most one local row. This is what makes the
-- "customer double-clicked Upgrade" case collapse to a single charge instead
-- of creating an orphan row per click.
CREATE UNIQUE INDEX "Payment_checkoutSessionId_key" ON "Payment"("checkoutSessionId");

-- The webhook handler resolves an event by checkout session id, and the
-- checkout route lists a user's recent attempts by userId + createdAt.
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
