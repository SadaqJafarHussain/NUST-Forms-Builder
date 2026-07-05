-- AlterTable: add isOnePage field to Survey (default true = one-page MS Forms style)
ALTER TABLE "Survey" ADD COLUMN "isOnePage" BOOLEAN NOT NULL DEFAULT true;
