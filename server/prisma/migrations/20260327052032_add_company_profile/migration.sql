-- CreateTable
CREATE TABLE "company_profiles" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "tagline" TEXT,
    "founded_year" INTEGER,
    "headquarters" TEXT,
    "employee_count" INTEGER,
    "annual_revenue" TEXT,
    "industries" TEXT[],
    "certifications" TEXT[],
    "awards" TEXT[],
    "key_clients" TEXT[],
    "office_locations" TEXT[],
    "safety_record" TEXT,
    "insurance_coverage" TEXT,
    "key_metrics" JSONB,
    "sla_defaults" JSONB,
    "differentiators" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
);
