-- Add the timestamp columns the Payment model declares.
--
-- The previous migration created the table but omitted createdAt/updatedAt, so
-- every insert failed with `The column "createdAt" of relation Payment does not
-- exist`. Both columns are NOT NULL with defaults, which keeps this safe on a
-- table that already has rows: existing attempts get a real timestamp instead
-- of a null violation.

ALTER TABLE "Payment"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
