-- Admin panel support.
--
-- Adds a private staff note on User and an append-only AdminAuditLog.
--
-- Both are additive. User.adminNote is nullable with no default, so every
-- existing row reads as "no note" and nothing backfills. AdminAuditLog is a new
-- table that nothing writes to until an admin acts.

ALTER TABLE "User"
  ADD COLUMN "adminNote" TEXT;

CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "targetUserId" TEXT,
  "action" TEXT NOT NULL,
  "fromValue" TEXT,
  "toValue" TEXT,
  "note" TEXT NOT NULL,
  "effectiveAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- The panel lists the log newest-first and filters it by account, so both
-- reads want an index that matches the query rather than a full scan.
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");
CREATE INDEX "AdminAuditLog_targetUserId_idx" ON "AdminAuditLog"("targetUserId");
CREATE INDEX "AdminAuditLog_actorId_idx" ON "AdminAuditLog"("actorId");

-- The author of an entry cannot be deleted out from under it: the trail has to
-- name someone.
ALTER TABLE "AdminAuditLog"
  ADD CONSTRAINT "AdminAuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- The account an entry is *about* is different from the account that wrote it.
-- SetNull, not Cascade: if the audited user is later deleted, the record that
-- they were once granted paid access by hand has to survive, or the only
-- evidence that the grant ever happened disappears with them.
ALTER TABLE "AdminAuditLog"
  ADD CONSTRAINT "AdminAuditLog_targetUserId_fkey"
  FOREIGN KEY ("targetUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
