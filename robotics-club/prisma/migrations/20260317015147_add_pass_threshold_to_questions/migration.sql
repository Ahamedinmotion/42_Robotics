-- CreateEnum
CREATE TYPE "MaterialCategory" AS ENUM ('ELECTRONICS', 'HARDWARE', 'CONSUMABLE', 'OTHER');

-- CreateEnum
CREATE TYPE "FeatureRequestCategory" AS ENUM ('PLATFORM', 'PRINTERS', 'CNC', 'EQUIPMENT', 'FACILITY');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PLATFORM_OBSERVATION';

-- AlterTable
ALTER TABLE "achievements" ADD COLUMN     "image_url" TEXT;

-- AlterTable
ALTER TABLE "club_settings" ADD COLUMN     "description" TEXT NOT NULL DEFAULT 'A platform for the 42 Robotics Club members.',
ADD COLUMN     "golden_shimmer_until" TIMESTAMP(3),
ADD COLUMN     "logo_url" TEXT,
ALTER COLUMN "club_tagline" SET DEFAULT '42 Robotics Club Platform';

-- AlterTable
ALTER TABLE "eval_questions" ADD COLUMN     "pass_threshold" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "feature_requests" ADD COLUMN     "category" "FeatureRequestCategory" NOT NULL DEFAULT 'PLATFORM';

-- AlterTable
ALTER TABLE "material_requests" ADD COLUMN     "category" "MaterialCategory" NOT NULL DEFAULT 'OTHER',
ALTER COLUMN "team_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "deliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "objectives" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "discovered_cheats" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "last_seen_update_screen" TIMESTAMP(3),
ADD COLUMN     "received_platform_notif" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "survived_system_update" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visited_hall" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visited_mirror" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visited_void" BOOLEAN NOT NULL DEFAULT false;
