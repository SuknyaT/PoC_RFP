-- AlterTable
ALTER TABLE "proposals" ADD COLUMN     "annual_escalation_pct" DECIMAL(5,2),
ADD COLUMN     "company_overview" TEXT,
ADD COLUMN     "competitive_advantages" TEXT,
ADD COLUMN     "compliance_statement" TEXT,
ADD COLUMN     "cost_overview" TEXT,
ADD COLUMN     "project_timeline" TEXT,
ADD COLUMN     "risk_mitigation" TEXT,
ADD COLUMN     "scoring_breakdown" JSONB,
ADD COLUMN     "team_structure" TEXT,
ADD COLUMN     "terms_and_conditions" TEXT,
ADD COLUMN     "value_proposition" TEXT,
ADD COLUMN     "year_wise_projections" JSONB;
