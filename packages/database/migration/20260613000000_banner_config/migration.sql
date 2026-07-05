-- Add banner config to Survey table
ALTER TABLE "Survey" ADD COLUMN IF NOT EXISTS "bannerConfig" JSONB;

-- Add default banner config to Organization table
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "defaultBannerConfig" JSONB;
