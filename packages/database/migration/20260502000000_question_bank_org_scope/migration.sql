-- Migration: Create question_bank_items table scoped to organization (not environment)
-- This creates the table for the first time with org-wide scope

CREATE TABLE IF NOT EXISTS "question_bank_items" (
  "id"              TEXT NOT NULL,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL,
  "question_data"   JSONB NOT NULL,
  "type"            TEXT NOT NULL,
  "category"        TEXT,
  "organization_id" TEXT NOT NULL,
  "created_by"      TEXT,
  "usage_count"     INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "question_bank_items_pkey" PRIMARY KEY ("id")
);

-- Foreign key to Organization (cascade delete)
ALTER TABLE "question_bank_items"
  ADD CONSTRAINT IF NOT EXISTS "question_bank_items_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "question_bank_items_organization_id_idx" ON "question_bank_items"("organization_id");
CREATE INDEX IF NOT EXISTS "question_bank_items_type_idx"            ON "question_bank_items"("type");
CREATE INDEX IF NOT EXISTS "question_bank_items_category_idx"        ON "question_bank_items"("category");
