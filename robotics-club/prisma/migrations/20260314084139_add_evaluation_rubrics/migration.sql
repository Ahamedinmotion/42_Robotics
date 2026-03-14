-- CreateEnum
CREATE TYPE "Status" AS ENUM ('WAITLIST', 'ACTIVE', 'BLACKHOLED', 'ALUMNI');

-- CreateEnum
CREATE TYPE "Rank" AS ENUM ('E', 'D', 'C', 'B', 'A', 'S');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('FORGE', 'FIELD');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RETIRED');

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('FORMING', 'ACTIVE', 'EVALUATING', 'COMPLETED', 'BLACKHOLED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('OPEN', 'CLAIMED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "EvaluationResult" AS ENUM ('PASS', 'FAIL');

-- CreateEnum
CREATE TYPE "FeedbackRole" AS ENUM ('TEAM', 'EVALUATOR', 'PEER');

-- CreateEnum
CREATE TYPE "CheckoutStatus" AS ENUM ('OUT', 'RETURNED', 'OVERDUE', 'FLAGGED');

-- CreateEnum
CREATE TYPE "MachineType" AS ENUM ('PRINTER_FDM', 'PRINTER_RESIN', 'CNC');

-- CreateEnum
CREATE TYPE "ReqStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SCHEDULED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DamageStatus" AS ENUM ('REPORTED', 'UNDER_REVIEW', 'RESOLVED');

-- CreateEnum
CREATE TYPE "MaterialReqStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EVAL_SLOT_AVAILABLE', 'EVAL_SLOT_CLAIMED', 'EVAL_CANCELLED', 'BLACKHOLE_WARNING', 'PRINT_APPROVED', 'REPORT_DUE', 'WORKSHOP_ANNOUNCED', 'ACHIEVEMENT_UNLOCKED', 'FEEDBACK_RECEIVED', 'MATERIAL_REQUEST_UPDATE', 'DAMAGE_REPORT_UPDATE', 'GENERAL');

-- CreateEnum
CREATE TYPE "ConflictStatus" AS ENUM ('OPEN', 'REVIEWED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('GOING', 'NOT_GOING');

-- CreateEnum
CREATE TYPE "AuthMethod" AS ENUM ('FINGERPRINT', 'QR_CODE');

-- CreateEnum
CREATE TYPE "FeatureRequestStatus" AS ENUM ('OPEN', 'PLANNED', 'DONE', 'DISMISSED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('STAR_RATING', 'CHECKBOX', 'LINEAR_SCALE', 'MULTIPLE_CHOICE', 'MULTI_SELECT', 'SHORT_TEXT', 'LONG_TEXT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "forty_two_id" TEXT,
    "login" TEXT NOT NULL,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "name" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "status" "Status" NOT NULL DEFAULT 'WAITLIST',
    "current_rank" "Rank" NOT NULL DEFAULT 'E',
    "lab_access_enabled" BOOLEAN NOT NULL DEFAULT false,
    "github_handle" TEXT,
    "active_theme" "Theme" NOT NULL DEFAULT 'FORGE',
    "equipped_title" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sounds_enabled" BOOLEAN NOT NULL DEFAULT true,
    "impersonator_id" TEXT,
    "birthday" TIMESTAMP(3),
    "has_seen_intro" BOOLEAN NOT NULL DEFAULT false,
    "has_seen_waitlist_modal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_notes" (
    "id" TEXT NOT NULL,
    "target_user_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rank" "Rank" NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "team_size_min" INTEGER NOT NULL,
    "team_size_max" INTEGER NOT NULL,
    "blackhole_days" INTEGER NOT NULL,
    "skill_tags" TEXT[],
    "is_unique" BOOLEAN NOT NULL DEFAULT false,
    "subject_sheet_url" TEXT,
    "evaluation_sheet_url" TEXT,
    "created_by_id" TEXT NOT NULL,
    "has_been_completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skill_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "skill_tag" TEXT NOT NULL,
    "projects_completed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_skill_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "project_id" TEXT NOT NULL,
    "leader_id" TEXT NOT NULL,
    "status" "TeamStatus" NOT NULL DEFAULT 'FORMING',
    "activated_at" TIMESTAMP(3),
    "blackhole_deadline" TIMESTAMP(3),
    "rank" "Rank",
    "name" TEXT,
    "repo_url" TEXT,
    "is_extension_granted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_leader" BOOLEAN NOT NULL DEFAULT false,
    "abandon_confirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_windows" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_slots" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "availability_window_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "slot_start" TIMESTAMP(3) NOT NULL,
    "slot_end" TIMESTAMP(3) NOT NULL,
    "claimed_by_id" TEXT,
    "claimed_at" TIMESTAMP(3),
    "status" "SlotStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "evaluation_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "slot_id" TEXT NOT NULL,
    "evaluator_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'PENDING',
    "tier1_score" DOUBLE PRECISION,
    "tier2_score" DOUBLE PRECISION,
    "tier3_score" DOUBLE PRECISION,
    "overall_result" "EvaluationResult",
    "is_staff_eval" BOOLEAN NOT NULL DEFAULT false,
    "notification_sent_at" TIMESTAMP(3),
    "notification_delay_seconds" INTEGER,
    "claimed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "sheet_version" INTEGER NOT NULL DEFAULT 1,
    "total_score" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "written_feedback" TEXT,
    "team_response" TEXT,
    "submitted_at" TIMESTAMP(3),
    "duration_seconds" INTEGER,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_feedbacks" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluation_id" TEXT NOT NULL,
    "from_role" "FeedbackRole" NOT NULL,
    "to_evaluator_id" TEXT,
    "to_team_id" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "evaluation_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_reports" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "team_id" TEXT NOT NULL,
    "submitted_by_id" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "contribution_notes" JSONB NOT NULL,
    "photo_urls" TEXT[],
    "readme_updated" BOOLEAN NOT NULL DEFAULT false,
    "blockers_notes" TEXT,
    "pdf_url" TEXT,
    "is_milestone" BOOLEAN NOT NULL DEFAULT false,
    "milestone_title" TEXT,
    "hours_logged" DOUBLE PRECISION,
    "mood" TEXT,
    "next_week_plan" TEXT,

    CONSTRAINT "weekly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkouts" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "team_id" TEXT,
    "item_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "checked_out_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_return_at" TIMESTAMP(3) NOT NULL,
    "returned_at" TIMESTAMP(3),
    "status" "CheckoutStatus" NOT NULL DEFAULT 'OUT',

    CONSTRAINT "checkouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabrication_requests" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "team_id" TEXT,
    "machine_type" "MachineType" NOT NULL,
    "model_file_url" TEXT NOT NULL,
    "estimated_minutes" INTEGER NOT NULL,
    "estimated_material_grams" DOUBLE PRECISION NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" "ReqStatus" NOT NULL DEFAULT 'PENDING',
    "scheduled_at" TIMESTAMP(3),
    "moderator_note" TEXT,
    "reviewed_by_id" TEXT,

    CONSTRAINT "fabrication_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "damage_reports" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reported_by_id" TEXT NOT NULL,
    "team_id" TEXT,
    "item_name" TEXT NOT NULL,
    "estimated_value" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DamageStatus" NOT NULL DEFAULT 'REPORTED',
    "requires_moderation" BOOLEAN NOT NULL DEFAULT false,
    "moderator_note" TEXT,
    "resolved_by_id" TEXT,

    CONSTRAINT "damage_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_requests" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "team_id" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "estimated_cost" DOUBLE PRECISION NOT NULL,
    "justification" TEXT NOT NULL,
    "status" "MaterialReqStatus" NOT NULL DEFAULT 'PENDING',
    "moderator_note" TEXT,
    "reviewed_by_id" TEXT,

    CONSTRAINT "material_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_proposals" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "proposed_by_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "proposed_rank" "Rank" NOT NULL,
    "required_materials" TEXT NOT NULL,
    "estimated_cost" DOUBLE PRECISION NOT NULL,
    "learning_objectives" TEXT NOT NULL,
    "build_plan" TEXT NOT NULL,
    "differentiation_notes" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "moderator_note" TEXT,
    "reviewed_by_id" TEXT,
    "converted_project_id" TEXT,

    CONSTRAINT "project_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "unlocked_title_id" TEXT,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "titles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_titles" (
    "id" TEXT NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,

    CONSTRAINT "user_titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_id" TEXT NOT NULL,
    "target_id" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_push" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "action_url" TEXT,
    "deliver_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conflict_flags" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raised_by_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ConflictStatus" NOT NULL DEFAULT 'OPEN',
    "moderator_note" TEXT,
    "reviewed_by_id" TEXT,

    CONSTRAINT "conflict_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshops" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "rsvp_deadline" TIMESTAMP(3),

    CONSTRAINT "workshops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_rsvps" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workshop_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "RsvpStatus" NOT NULL DEFAULT 'GOING',

    CONSTRAINT "workshop_rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_access_logs" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "method" "AuthMethod" NOT NULL,
    "success" BOOLEAN NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,

    CONSTRAINT "lab_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni_evaluators" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "opted_in_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "alumni_evaluators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliments" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "evaluation_id" TEXT,
    "message" TEXT NOT NULL,

    CONSTRAINT "compliments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mood_board_notes" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#FFD700',
    "pinned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "mood_board_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_requests" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "FeatureRequestStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "feature_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_request_votes" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,

    CONSTRAINT "feature_request_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dynamic_roles" (
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dynamic_roles_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "club_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "club_name" TEXT NOT NULL DEFAULT 'Robotics Club',
    "club_tagline" TEXT NOT NULL DEFAULT 'A ranked engineering curriculum for the makers, builders, and breakers at 42.',
    "max_active_members" INTEGER NOT NULL DEFAULT 30,
    "lab_open_time" TEXT NOT NULL DEFAULT '09:00',
    "lab_close_time" TEXT NOT NULL DEFAULT '21:00',
    "default_blackhole_days" INTEGER NOT NULL DEFAULT 60,
    "min_team_size" INTEGER NOT NULL DEFAULT 2,
    "max_team_size" INTEGER NOT NULL DEFAULT 5,
    "eval_cooldown_hours" INTEGER NOT NULL DEFAULT 24,
    "anti_snipe_minutes" INTEGER NOT NULL DEFAULT 5,
    "allow_alumni_evals" BOOLEAN NOT NULL DEFAULT true,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "maintenance_message" TEXT NOT NULL DEFAULT 'The platform is currently under maintenance. Please check back later.',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" TEXT,

    CONSTRAINT "club_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_dismissals" (
    "id" TEXT NOT NULL,
    "announcement_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "dismissed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_dismissals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_scratchpads" (
    "team_id" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "last_edited_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_scratchpads_pkey" PRIMARY KEY ("team_id")
);

-- CreateTable
CREATE TABLE "project_post_mortems" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "what_worked" TEXT NOT NULL,
    "what_didnt" TEXT NOT NULL,
    "would_do_better" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_post_mortems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extension_requests" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "MaterialReqStatus" NOT NULL DEFAULT 'PENDING',
    "moderator_note" TEXT,
    "reviewed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extension_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_disputes" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "status" "MaterialReqStatus" NOT NULL DEFAULT 'PENDING',
    "moderator_note" TEXT,
    "reviewed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eval_sheets" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "pass_mark" INTEGER NOT NULL DEFAULT 60,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eval_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eval_sections" (
    "id" TEXT NOT NULL,
    "sheet_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL,
    "pass_mark" INTEGER,

    CONSTRAINT "eval_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eval_questions" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "QuestionType" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "is_hard_requirement" BOOLEAN NOT NULL DEFAULT false,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "options" JSONB,
    "scale_min" INTEGER,
    "scale_max" INTEGER,
    "scale_min_label" TEXT,
    "scale_max_label" TEXT,

    CONSTRAINT "eval_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eval_responses" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eval_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_forty_two_id_key" ON "users"("forty_two_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_login_key" ON "users"("login");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "admin_notes_target_user_id_idx" ON "admin_notes"("target_user_id");

-- CreateIndex
CREATE INDEX "admin_notes_author_id_idx" ON "admin_notes"("author_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE INDEX "projects_created_by_id_idx" ON "projects"("created_by_id");

-- CreateIndex
CREATE INDEX "user_skill_progress_user_id_idx" ON "user_skill_progress"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_skill_progress_user_id_skill_tag_key" ON "user_skill_progress"("user_id", "skill_tag");

-- CreateIndex
CREATE INDEX "teams_project_id_idx" ON "teams"("project_id");

-- CreateIndex
CREATE INDEX "teams_leader_id_idx" ON "teams"("leader_id");

-- CreateIndex
CREATE INDEX "team_members_team_id_idx" ON "team_members"("team_id");

-- CreateIndex
CREATE INDEX "team_members_user_id_idx" ON "team_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_team_id_user_id_key" ON "team_members"("team_id", "user_id");

-- CreateIndex
CREATE INDEX "availability_windows_team_id_idx" ON "availability_windows"("team_id");

-- CreateIndex
CREATE INDEX "evaluation_slots_availability_window_id_idx" ON "evaluation_slots"("availability_window_id");

-- CreateIndex
CREATE INDEX "evaluation_slots_team_id_idx" ON "evaluation_slots"("team_id");

-- CreateIndex
CREATE INDEX "evaluation_slots_claimed_by_id_idx" ON "evaluation_slots"("claimed_by_id");

-- CreateIndex
CREATE INDEX "evaluations_slot_id_idx" ON "evaluations"("slot_id");

-- CreateIndex
CREATE INDEX "evaluations_evaluator_id_idx" ON "evaluations"("evaluator_id");

-- CreateIndex
CREATE INDEX "evaluations_team_id_idx" ON "evaluations"("team_id");

-- CreateIndex
CREATE INDEX "evaluations_project_id_idx" ON "evaluations"("project_id");

-- CreateIndex
CREATE INDEX "evaluation_feedbacks_evaluation_id_idx" ON "evaluation_feedbacks"("evaluation_id");

-- CreateIndex
CREATE INDEX "evaluation_feedbacks_to_evaluator_id_idx" ON "evaluation_feedbacks"("to_evaluator_id");

-- CreateIndex
CREATE INDEX "evaluation_feedbacks_to_team_id_idx" ON "evaluation_feedbacks"("to_team_id");

-- CreateIndex
CREATE INDEX "weekly_reports_team_id_idx" ON "weekly_reports"("team_id");

-- CreateIndex
CREATE INDEX "weekly_reports_submitted_by_id_idx" ON "weekly_reports"("submitted_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_reports_team_id_week_number_key" ON "weekly_reports"("team_id", "week_number");

-- CreateIndex
CREATE INDEX "checkouts_user_id_idx" ON "checkouts"("user_id");

-- CreateIndex
CREATE INDEX "checkouts_team_id_idx" ON "checkouts"("team_id");

-- CreateIndex
CREATE INDEX "fabrication_requests_user_id_idx" ON "fabrication_requests"("user_id");

-- CreateIndex
CREATE INDEX "fabrication_requests_team_id_idx" ON "fabrication_requests"("team_id");

-- CreateIndex
CREATE INDEX "fabrication_requests_reviewed_by_id_idx" ON "fabrication_requests"("reviewed_by_id");

-- CreateIndex
CREATE INDEX "damage_reports_reported_by_id_idx" ON "damage_reports"("reported_by_id");

-- CreateIndex
CREATE INDEX "damage_reports_team_id_idx" ON "damage_reports"("team_id");

-- CreateIndex
CREATE INDEX "damage_reports_resolved_by_id_idx" ON "damage_reports"("resolved_by_id");

-- CreateIndex
CREATE INDEX "material_requests_team_id_idx" ON "material_requests"("team_id");

-- CreateIndex
CREATE INDEX "material_requests_requested_by_id_idx" ON "material_requests"("requested_by_id");

-- CreateIndex
CREATE INDEX "material_requests_reviewed_by_id_idx" ON "material_requests"("reviewed_by_id");

-- CreateIndex
CREATE INDEX "project_proposals_proposed_by_id_idx" ON "project_proposals"("proposed_by_id");

-- CreateIndex
CREATE INDEX "project_proposals_reviewed_by_id_idx" ON "project_proposals"("reviewed_by_id");

-- CreateIndex
CREATE INDEX "project_proposals_converted_project_id_idx" ON "project_proposals"("converted_project_id");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_key_key" ON "achievements"("key");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_unlocked_title_id_key" ON "achievements"("unlocked_title_id");

-- CreateIndex
CREATE UNIQUE INDEX "titles_name_key" ON "titles"("name");

-- CreateIndex
CREATE INDEX "user_titles_user_id_idx" ON "user_titles"("user_id");

-- CreateIndex
CREATE INDEX "user_titles_title_id_idx" ON "user_titles"("title_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_titles_user_id_title_id_key" ON "user_titles"("user_id", "title_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_actor_id_idx" ON "admin_audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_target_id_idx" ON "admin_audit_logs"("target_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_created_at_idx" ON "admin_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "user_achievements_user_id_idx" ON "user_achievements"("user_id");

-- CreateIndex
CREATE INDEX "user_achievements_achievement_id_idx" ON "user_achievements"("achievement_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "conflict_flags_raised_by_id_idx" ON "conflict_flags"("raised_by_id");

-- CreateIndex
CREATE INDEX "conflict_flags_team_id_idx" ON "conflict_flags"("team_id");

-- CreateIndex
CREATE INDEX "conflict_flags_reviewed_by_id_idx" ON "conflict_flags"("reviewed_by_id");

-- CreateIndex
CREATE INDEX "workshops_host_id_idx" ON "workshops"("host_id");

-- CreateIndex
CREATE INDEX "workshop_rsvps_workshop_id_idx" ON "workshop_rsvps"("workshop_id");

-- CreateIndex
CREATE INDEX "workshop_rsvps_user_id_idx" ON "workshop_rsvps"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_rsvps_workshop_id_user_id_key" ON "workshop_rsvps"("workshop_id", "user_id");

-- CreateIndex
CREATE INDEX "lab_access_logs_user_id_idx" ON "lab_access_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "alumni_evaluators_user_id_key" ON "alumni_evaluators"("user_id");

-- CreateIndex
CREATE INDEX "alumni_evaluators_user_id_idx" ON "alumni_evaluators"("user_id");

-- CreateIndex
CREATE INDEX "compliments_from_user_id_idx" ON "compliments"("from_user_id");

-- CreateIndex
CREATE INDEX "compliments_to_user_id_idx" ON "compliments"("to_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "compliments_from_user_id_to_user_id_evaluation_id_key" ON "compliments"("from_user_id", "to_user_id", "evaluation_id");

-- CreateIndex
CREATE INDEX "mood_board_notes_author_id_idx" ON "mood_board_notes"("author_id");

-- CreateIndex
CREATE INDEX "feature_requests_user_id_idx" ON "feature_requests"("user_id");

-- CreateIndex
CREATE INDEX "feature_request_votes_user_id_idx" ON "feature_request_votes"("user_id");

-- CreateIndex
CREATE INDEX "feature_request_votes_request_id_idx" ON "feature_request_votes"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "feature_request_votes_user_id_request_id_key" ON "feature_request_votes"("user_id", "request_id");

-- CreateIndex
CREATE INDEX "announcements_expires_at_idx" ON "announcements"("expires_at");

-- CreateIndex
CREATE INDEX "announcements_created_by_id_idx" ON "announcements"("created_by_id");

-- CreateIndex
CREATE INDEX "announcement_dismissals_announcement_id_idx" ON "announcement_dismissals"("announcement_id");

-- CreateIndex
CREATE INDEX "announcement_dismissals_user_id_idx" ON "announcement_dismissals"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_dismissals_announcement_id_user_id_key" ON "announcement_dismissals"("announcement_id", "user_id");

-- CreateIndex
CREATE INDEX "project_post_mortems_team_id_idx" ON "project_post_mortems"("team_id");

-- CreateIndex
CREATE INDEX "project_post_mortems_user_id_idx" ON "project_post_mortems"("user_id");

-- CreateIndex
CREATE INDEX "project_post_mortems_project_id_idx" ON "project_post_mortems"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_post_mortems_team_id_user_id_key" ON "project_post_mortems"("team_id", "user_id");

-- CreateIndex
CREATE INDEX "extension_requests_team_id_idx" ON "extension_requests"("team_id");

-- CreateIndex
CREATE INDEX "evaluation_disputes_team_id_idx" ON "evaluation_disputes"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "eval_sheets_project_id_key" ON "eval_sheets"("project_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_fkey" FOREIGN KEY ("role") REFERENCES "dynamic_roles"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skill_progress" ADD CONSTRAINT "user_skill_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_windows" ADD CONSTRAINT "availability_windows_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_slots" ADD CONSTRAINT "evaluation_slots_availability_window_id_fkey" FOREIGN KEY ("availability_window_id") REFERENCES "availability_windows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_slots" ADD CONSTRAINT "evaluation_slots_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_slots" ADD CONSTRAINT "evaluation_slots_claimed_by_id_fkey" FOREIGN KEY ("claimed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "evaluation_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_feedbacks" ADD CONSTRAINT "evaluation_feedbacks_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_feedbacks" ADD CONSTRAINT "evaluation_feedbacks_to_evaluator_id_fkey" FOREIGN KEY ("to_evaluator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_feedbacks" ADD CONSTRAINT "evaluation_feedbacks_to_team_id_fkey" FOREIGN KEY ("to_team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabrication_requests" ADD CONSTRAINT "fabrication_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabrication_requests" ADD CONSTRAINT "fabrication_requests_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fabrication_requests" ADD CONSTRAINT "fabrication_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damage_reports" ADD CONSTRAINT "damage_reports_reported_by_id_fkey" FOREIGN KEY ("reported_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damage_reports" ADD CONSTRAINT "damage_reports_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damage_reports" ADD CONSTRAINT "damage_reports_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_requests" ADD CONSTRAINT "material_requests_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_proposals" ADD CONSTRAINT "project_proposals_converted_project_id_fkey" FOREIGN KEY ("converted_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_proposals" ADD CONSTRAINT "project_proposals_proposed_by_id_fkey" FOREIGN KEY ("proposed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_proposals" ADD CONSTRAINT "project_proposals_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_unlocked_title_id_fkey" FOREIGN KEY ("unlocked_title_id") REFERENCES "titles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_titles" ADD CONSTRAINT "user_titles_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_titles" ADD CONSTRAINT "user_titles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflict_flags" ADD CONSTRAINT "conflict_flags_raised_by_id_fkey" FOREIGN KEY ("raised_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflict_flags" ADD CONSTRAINT "conflict_flags_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflict_flags" ADD CONSTRAINT "conflict_flags_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_rsvps" ADD CONSTRAINT "workshop_rsvps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_rsvps" ADD CONSTRAINT "workshop_rsvps_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_access_logs" ADD CONSTRAINT "lab_access_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni_evaluators" ADD CONSTRAINT "alumni_evaluators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliments" ADD CONSTRAINT "compliments_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliments" ADD CONSTRAINT "compliments_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_board_notes" ADD CONSTRAINT "mood_board_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_requests" ADD CONSTRAINT "feature_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_request_votes" ADD CONSTRAINT "feature_request_votes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "feature_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_request_votes" ADD CONSTRAINT "feature_request_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_settings" ADD CONSTRAINT "club_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_dismissals" ADD CONSTRAINT "announcement_dismissals_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_dismissals" ADD CONSTRAINT "announcement_dismissals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_scratchpads" ADD CONSTRAINT "team_scratchpads_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_scratchpads" ADD CONSTRAINT "team_scratchpads_last_edited_by_id_fkey" FOREIGN KEY ("last_edited_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_post_mortems" ADD CONSTRAINT "project_post_mortems_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_post_mortems" ADD CONSTRAINT "project_post_mortems_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_post_mortems" ADD CONSTRAINT "project_post_mortems_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_requests" ADD CONSTRAINT "extension_requests_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_requests" ADD CONSTRAINT "extension_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_disputes" ADD CONSTRAINT "evaluation_disputes_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_disputes" ADD CONSTRAINT "evaluation_disputes_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eval_sheets" ADD CONSTRAINT "eval_sheets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eval_sections" ADD CONSTRAINT "eval_sections_sheet_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "eval_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eval_questions" ADD CONSTRAINT "eval_questions_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "eval_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eval_responses" ADD CONSTRAINT "eval_responses_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eval_responses" ADD CONSTRAINT "eval_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "eval_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
