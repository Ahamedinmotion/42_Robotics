/*
  Warnings:

  - The `active_theme` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "unlocked_themes" TEXT[] DEFAULT ARRAY['FORGE', 'FIELD']::TEXT[],
DROP COLUMN "active_theme",
ADD COLUMN     "active_theme" TEXT NOT NULL DEFAULT 'FORGE';
