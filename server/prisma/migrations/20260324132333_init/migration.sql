-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'analyst',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfps" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "client_name" TEXT,
    "industry" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "project_scope" TEXT,
    "submission_deadline" TIMESTAMP(3),
    "contract_duration" TEXT,
    "estimated_value" DECIMAL(15,2),
    "location" TEXT,
    "original_filename" TEXT,
    "file_path" TEXT,
    "raw_text" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rfps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring_criteria" (
    "id" TEXT NOT NULL,
    "rfp_id" TEXT NOT NULL,
    "criterion_name" TEXT NOT NULL,
    "max_points" INTEGER,
    "weight_pct" DECIMAL(5,2),
    "description" TEXT,
    "ai_strategy" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "scoring_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industries" TEXT[],
    "strengths" TEXT,
    "weaknesses" TEXT,
    "typical_bid_style" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historical_bids" (
    "id" TEXT NOT NULL,
    "rfp_title" TEXT,
    "client_name" TEXT,
    "industry" TEXT,
    "year" INTEGER,
    "bidder_name" TEXT,
    "is_our_bid" BOOLEAN NOT NULL DEFAULT true,
    "flat_guarantee" DECIMAL(15,2),
    "profit_share_pct" DECIMAL(5,2),
    "other_terms" JSONB,
    "outcome" TEXT,
    "winning_bid_summary" TEXT,
    "score_received" DECIMAL(5,2),
    "lessons_learned" TEXT,
    "competitor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historical_bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfp_competitors" (
    "id" TEXT NOT NULL,
    "rfp_id" TEXT NOT NULL,
    "competitor_id" TEXT NOT NULL,
    "expected_strategy" TEXT,
    "threat_level" TEXT,

    CONSTRAINT "rfp_competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "rfp_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "recommended_flat_guarantee" DECIMAL(15,2),
    "recommended_profit_share" DECIMAL(5,2),
    "revenue_model_rationale" TEXT,
    "executive_summary" TEXT,
    "experience_section" TEXT,
    "approach_section" TEXT,
    "revenue_proposal" TEXT,
    "full_content" JSONB,
    "predicted_score" DECIMAL(5,2),
    "optimization_notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "rfps" ADD CONSTRAINT "rfps_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_criteria" ADD CONSTRAINT "scoring_criteria_rfp_id_fkey" FOREIGN KEY ("rfp_id") REFERENCES "rfps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_bids" ADD CONSTRAINT "historical_bids_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "competitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfp_competitors" ADD CONSTRAINT "rfp_competitors_rfp_id_fkey" FOREIGN KEY ("rfp_id") REFERENCES "rfps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfp_competitors" ADD CONSTRAINT "rfp_competitors_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "competitors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_rfp_id_fkey" FOREIGN KEY ("rfp_id") REFERENCES "rfps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
