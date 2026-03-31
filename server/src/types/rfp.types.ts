import { z } from 'zod';

export const ParsedRfpSchema = z.object({
  title: z.string(),
  client_name: z.string().nullable(),
  industry: z.string().nullable(),
  project_scope: z.string().nullable(),
  submission_deadline: z.string().nullable(),
  contract_duration: z.string().nullable(),
  estimated_value: z.number().nullable(),
  location: z.string().nullable(),
  scoring_criteria: z.array(z.object({
    name: z.string(),
    max_points: z.number().nullable(),
    weight_pct: z.number().nullable(),
    description: z.string().nullable(),
  })),
});

export type ParsedRfp = z.infer<typeof ParsedRfpSchema>;

export const ProposalOutputSchema = z.object({
  executive_summary: z.string().default(''),
  company_overview: z.string().default(''),
  experience_section: z.string().default(''),
  approach_section: z.string().default(''),
  project_timeline: z.string().default(''),
  team_structure: z.string().default(''),
  revenue_proposal: z.string().default(''),
  cost_overview: z.string().default(''),
  risk_mitigation: z.string().default(''),
  value_proposition: z.string().default(''),
  compliance_statement: z.string().default(''),
  recommended_flat_guarantee: z.number().default(0),
  recommended_profit_share: z.number().default(0),
  annual_escalation_pct: z.number().default(0),
  year_wise_projections: z.array(z.object({
    year: z.number(),
    guaranteed_amount: z.number(),
    projected_revenue: z.number(),
    profit_share_amount: z.number(),
    total_to_client: z.number(),
  })).default([]),
  revenue_model_rationale: z.string().default(''),
  predicted_score: z.number().default(0),
  scoring_breakdown: z.array(z.object({
    criterion: z.string(),
    max_points: z.number(),
    estimated_points: z.number(),
    justification: z.string(),
    confidence: z.enum(['high', 'medium', 'low']).default('medium'),
    evidence: z.array(z.string()).default([]),
    risk_factors: z.array(z.string()).default([]),
    improvement_actions: z.array(z.string()).default([]),
    competitor_comparison: z.string().default(''),
  })).default([]),
  optimization_notes: z.string().default(''),
  competitive_advantages: z.string().default(''),
  terms_and_conditions: z.string().default(''),
  cost_breakdown: z.object({
    summary: z.string().default(''),
    total_annual_cost: z.number().default(0),
    margin_percentage: z.number().default(0),
    line_items: z.array(z.object({
      category: z.string(),
      description: z.string(),
      annual_cost: z.number(),
      percentage_of_total: z.number(),
      sub_items: z.array(z.object({
        item: z.string(),
        cost: z.number(),
      })).default([]),
    })).default([]),
  }).default({ summary: '', total_annual_cost: 0, margin_percentage: 0, line_items: [] }),
});

export type ProposalOutput = z.infer<typeof ProposalOutputSchema>;
