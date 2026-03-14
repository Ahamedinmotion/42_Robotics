-- AlterTable
ALTER TABLE "evaluations" ADD COLUMN     "anomaly_note" TEXT,
ADD COLUMN     "is_anomaly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_midnight_eval" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "calibration_sessions" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "project_id" TEXT NOT NULL,
    "sheet_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dummy_submission" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "calibration_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibration_responses" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "evaluator_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "responses" JSONB NOT NULL,
    "feedback" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calibration_responses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "calibration_responses" ADD CONSTRAINT "calibration_responses_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "calibration_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
