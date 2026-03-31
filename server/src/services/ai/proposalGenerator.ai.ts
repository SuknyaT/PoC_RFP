import { callClaudeJsonChunked, streamClaude } from './claude.service.js';
import { ProposalOutput, ProposalOutputSchema } from '../../types/rfp.types.js';

const SYSTEM_PROMPT = `You are an expert proposal writer who creates winning, comprehensive RFP responses. Your proposals are professionally structured, data-driven, and optimized to maximize scoring points.

Generate a DETAILED and COMPREHENSIVE proposal response. Each section should be thorough with specific details, not generic filler.

Return a JSON object with the requested fields.

Guidelines:
- Be SPECIFIC with numbers, dates, and metrics - never vague
- CRITICAL: When historical bids include "VERIFIED METRICS", cite those exact numbers as proof points
- In experience sections, include at least 5 specific numerical metrics from historical data
- Reference specific past achievements as evidence
- Quantify every claim with real numbers from past projects
- Use realistic industry data and benchmarks
- Tailor every section to the specific RFP requirements
- Align financial offer with historical winning patterns
- Position competitively against known competitors
- Include measurable KPIs with specific target numbers
- Write in professional, confident tone suitable for C-level review`;

// Split fields into 6 small chunks so each comfortably fits within Gemini's output token limit
const FIELD_GROUPS = [
  // Chunk 1: Executive + Company
  [
    'executive_summary',
    'company_overview',
    'experience_section',
  ],
  // Chunk 2: Methodology
  [
    'approach_section',
    'project_timeline',
    'team_structure',
  ],
  // Chunk 3: Financials
  [
    'revenue_proposal',
    'cost_overview',
    'value_proposition',
    'compliance_statement',
  ],
  // Chunk 4: Risk + Terms
  [
    'risk_mitigation',
    'competitive_advantages',
    'terms_and_conditions',
  ],
  // Chunk 5: Financial numbers
  [
    'recommended_flat_guarantee',
    'recommended_profit_share',
    'annual_escalation_pct',
    'revenue_model_rationale',
    'optimization_notes',
  ],
  // Chunk 7: Cost breakdown (dedicated chunk for detailed cost analysis)
  [
    'cost_breakdown',
    'year_wise_projections',
  ],
  // Chunk 6: Scoring (dedicated chunk — rich data per criterion)
  [
    'predicted_score',
    'scoring_breakdown',
  ],
];

const FIELD_DESCRIPTIONS: Record<string, string> = {
  executive_summary: 'A compelling 3-4 paragraph executive summary covering: why we are the best fit, our key differentiators, high-level financial offer, and commitment to success.',
  company_overview: 'Detailed company profile: founding year, headquarters, employees, revenue, key clients, certifications, awards, and why our organization aligns with this project.',
  experience_section: 'Track record with 3-5 specific past projects including: project name, client, year, scope, budget, outcome, and measurable results with numbers.',
  approach_section: 'Methodology covering: Phase 1 (Discovery/Planning), Phase 2 (Implementation/Execution), Phase 3 (Operations/Optimization), Phase 4 (Reporting/Review). Each phase with activities, deliverables, and timelines.',
  project_timeline: 'Month-by-month implementation timeline for year 1, then quarterly. Include milestones, deliverables, and checkpoints.',
  team_structure: 'Proposed team: Project Director, Operations Manager, Technical Lead, plus 3-5 specialists. For each: title, responsibilities, experience, qualifications.',
  revenue_proposal: 'Financial proposal narrative: revenue model, competitiveness, industry benchmarks, and how it benefits both parties.',
  cost_overview: 'Cost breakdown: capital expenditure, operational expenditure, marketing, contingency. Include year-wise projections.',
  risk_mitigation: 'Risk matrix with 5-7 risks, each with: description, likelihood, impact, mitigation strategy, contingency plan.',
  value_proposition: '3-5 unique value propositions with headline, explanation, and quantifiable benefit.',
  compliance_statement: 'Compliance with all RFP requirements, eligibility criteria, regulatory requirements, certifications.',
  recommended_flat_guarantee: 'number - annual minimum guarantee amount in USD',
  recommended_profit_share: 'number - profit share percentage',
  annual_escalation_pct: 'number - annual escalation percentage',
  year_wise_projections: 'Array of {year, guaranteed_amount, projected_revenue, profit_share_amount, total_to_client} for each contract year',
  cost_breakdown: `Object with detailed cost structure justifying the MAG amount. Must include:
  {
    "summary": "1-2 sentence explanation of how costs roll up to the MAG",
    "total_annual_cost": <number - total annual operating cost in USD>,
    "margin_percentage": <number - profit margin percentage built into MAG>,
    "line_items": [
      {
        "category": "Category name (e.g., Labor & Staffing, Equipment & Technology, Materials & Supplies, Overhead & Administration, Insurance & Compliance, Marketing & Business Development, Contingency Reserve)",
        "description": "Brief description of what this covers",
        "annual_cost": <number in USD>,
        "percentage_of_total": <number - percentage of total annual cost>,
        "sub_items": [{"item": "Specific line item", "cost": <number>}, ...]
      }
    ]
  }
  Include 5-8 major cost categories. The total_annual_cost + margin should approximately equal the recommended_flat_guarantee. Use realistic industry costs based on the RFP scope, location, and duration.`,
  revenue_model_rationale: 'Why this revenue model is optimal: market analysis, projections, historical comparisons.',
  predicted_score: 'number out of 100',
  scoring_breakdown: `Array of objects for EACH scoring criterion. Each object MUST have ALL these fields:
  {
    "criterion": "Criterion name matching RFP",
    "max_points": <number>,
    "estimated_points": <number>,
    "justification": "Why we expect to score this many points",
    "confidence": "high" | "medium" | "low" - how confident we are in this score,
    "evidence": ["Specific proof point 1 with numbers", "Proof point 2 with metrics", "Proof point 3"] - 2-4 concrete evidence items from past projects or company capabilities,
    "risk_factors": ["Risk that could lower score 1", "Risk 2"] - 1-3 factors that could reduce our score,
    "improvement_actions": ["Action to maximize score 1", "Action 2"] - 1-3 specific actions to improve our score before submission,
    "competitor_comparison": "How we compare to likely competitors on this criterion"
  }`,
  optimization_notes: 'Summary of key strategies to maximize score and win probability.',
  competitive_advantages: 'How our proposal positions against competitors. Key differentiators.',
  terms_and_conditions: 'Proposed terms: payment schedule, performance guarantees, SLAs, termination clauses, insurance, dispute resolution.',
};

interface ProposalContext {
  rfp: {
    title: string;
    clientName: string | null;
    industry: string | null;
    projectScope: string | null;
    contractDuration: string | null;
    estimatedValue: string | null;
    location: string | null;
  };
  scoringCriteria: Array<{
    criterionName: string;
    maxPoints: number | null;
    weightPct: string | null;
    description: string | null;
    aiStrategy: string | null;
  }>;
  competitorAnalysis: Array<{
    competitorName: string;
    predictedStrategy: string;
    threatLevel: string;
  }>;
  historicalWinners: Array<{
    rfpTitle: string | null;
    industry: string | null;
    flatGuarantee: string | null;
    profitSharePct: string | null;
    outcome: string | null;
    lessonsLearned: string | null;
    otherTerms: Record<string, unknown> | null;
  }>;
  companyProfile: {
    companyName: string;
    tagline: string | null;
    foundedYear: number | null;
    headquarters: string | null;
    employeeCount: number | null;
    annualRevenue: string | null;
    industries: string[];
    certifications: string[];
    awards: string[];
    keyClients: string[];
    officeLocations: string[];
    safetyRecord: string | null;
    insuranceCoverage: string | null;
    keyMetrics: Record<string, unknown> | null;
    slaDefaults: Record<string, unknown> | null;
    differentiators: Record<string, unknown> | null;
  } | null;
}

function buildUserMessage(context: ProposalContext): string {
  const contractYears = parseInt(context.rfp.contractDuration || '5') || 5;

  return `
## RFP Details
Title: ${context.rfp.title}
Client: ${context.rfp.clientName || 'Not specified'}
Industry: ${context.rfp.industry || 'Not specified'}
Scope: ${context.rfp.projectScope || 'Not specified'}
Duration: ${context.rfp.contractDuration || 'Not specified'}
Estimated Value: ${context.rfp.estimatedValue || 'Not specified'}
Location: ${context.rfp.location || 'Not specified'}
Contract Years for Projections: ${contractYears}

## Scoring Criteria (IMPORTANT - optimize proposal for these)
${context.scoringCriteria.map(c =>
  `- ${c.criterionName} (${c.maxPoints ?? '?'} pts, ${c.weightPct ?? '?'}%): ${c.description || 'No description'}
   Strategy: ${c.aiStrategy || 'No strategy yet'}`
).join('\n')}

## Competitor Analysis
${context.competitorAnalysis.length > 0
  ? context.competitorAnalysis.map(c =>
    `- ${c.competitorName} [Threat: ${c.threatLevel}]: ${c.predictedStrategy}`
  ).join('\n')
  : 'No competitor data available'}

## Historical Winning Bids — USE THESE NUMBERS AS PROOF POINTS
${context.historicalWinners.length > 0
  ? context.historicalWinners.map(h => {
    let entry = `- ${h.rfpTitle} (${h.industry}): Guarantee=$${h.flatGuarantee || '?'}, Share=${h.profitSharePct || '?'}%, Outcome=${h.outcome || '?'}
   Lessons: ${h.lessonsLearned || 'None recorded'}`;
    if (h.otherTerms && Object.keys(h.otherTerms).length > 0) {
      const metrics = Object.entries(h.otherTerms)
        .map(([key, val]) => `     ${key.replace(/_/g, ' ')}: ${val}`)
        .join('\n');
      entry += `\n   VERIFIED METRICS:\n${metrics}`;
    }
    return entry;
  }).join('\n\n')
  : 'No historical data available'}

${context.companyProfile ? `
## OUR COMPANY PROFILE (Use these REAL facts — do NOT fabricate)
Company Name: ${context.companyProfile.companyName}
${context.companyProfile.tagline ? `Tagline: ${context.companyProfile.tagline}` : ''}
${context.companyProfile.foundedYear ? `Founded: ${context.companyProfile.foundedYear} (${new Date().getFullYear() - context.companyProfile.foundedYear}+ years)` : ''}
${context.companyProfile.headquarters ? `HQ: ${context.companyProfile.headquarters}` : ''}
${context.companyProfile.employeeCount ? `Employees: ${context.companyProfile.employeeCount.toLocaleString()}` : ''}
${context.companyProfile.annualRevenue ? `Revenue: ${context.companyProfile.annualRevenue}` : ''}
${context.companyProfile.industries.length > 0 ? `Industries: ${context.companyProfile.industries.join(', ')}` : ''}
${context.companyProfile.officeLocations.length > 0 ? `Offices: ${context.companyProfile.officeLocations.join(', ')}` : ''}
${context.companyProfile.keyClients.length > 0 ? `Clients: ${context.companyProfile.keyClients.join(', ')}` : ''}
${context.companyProfile.certifications.length > 0 ? `Certs: ${context.companyProfile.certifications.join(', ')}` : ''}
${context.companyProfile.awards.length > 0 ? `Awards: ${context.companyProfile.awards.join(', ')}` : ''}
${context.companyProfile.safetyRecord ? `Safety: ${context.companyProfile.safetyRecord}` : ''}
${context.companyProfile.insuranceCoverage ? `Insurance: ${context.companyProfile.insuranceCoverage}` : ''}
${context.companyProfile.keyMetrics && Object.keys(context.companyProfile.keyMetrics).length > 0
  ? `KEY METRICS:\n${Object.entries(context.companyProfile.keyMetrics).map(([k, v]) => `  ${k.replace(/_/g, ' ')}: ${v}`).join('\n')}`
  : ''}
${context.companyProfile.slaDefaults && Object.keys(context.companyProfile.slaDefaults).length > 0
  ? `SLA DEFAULTS:\n${Object.entries(context.companyProfile.slaDefaults).map(([k, v]) => `  ${k.replace(/_/g, ' ')}: ${v}`).join('\n')}`
  : ''}
${context.companyProfile.differentiators && Object.keys(context.companyProfile.differentiators).length > 0
  ? `DIFFERENTIATORS:\n${Object.entries(context.companyProfile.differentiators).map(([k, v]) => `  ${k.replace(/_/g, ' ')}: ${v}`).join('\n')}`
  : ''}
` : ''}
Generate a comprehensive, winning proposal. Include year_wise_projections for ${contractYears} years. Be specific and data-driven.`;
}

// Fields that must be strings (not objects/arrays)
const STRING_FIELDS = new Set([
  'executive_summary', 'company_overview', 'experience_section', 'approach_section',
  'project_timeline', 'team_structure', 'revenue_proposal', 'cost_overview',
  'risk_mitigation', 'value_proposition', 'compliance_statement', 'revenue_model_rationale',
  'optimization_notes', 'competitive_advantages', 'terms_and_conditions',
]);

/** Coerce any object/array values that should be strings into strings */
function coerceFieldTypes(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  for (const [key, value] of Object.entries(result)) {
    if (STRING_FIELDS.has(key) && value !== null && typeof value === 'object') {
      // Convert structured data back to a readable string
      result[key] = JSON.stringify(value, null, 2);
    }
  }
  return result;
}

function buildSystemPromptWithFieldDescriptions(fields: string[]): string {
  const fieldDescriptions = fields
    .map(f => {
      const desc = FIELD_DESCRIPTIONS[f] || f;
      const typeHint = STRING_FIELDS.has(f) ? ' (VALUE MUST BE A SINGLE STRING, not an object or array)' : '';
      return `  "${f}": ${desc}${typeHint}`;
    })
    .join('\n');

  return `${SYSTEM_PROMPT}

Return a JSON object with EXACTLY these fields:
{
${fieldDescriptions}
}

IMPORTANT: Return ONLY a valid JSON object with these fields. No markdown, no code blocks, just raw JSON.`;
}

export async function generateProposal(context: ProposalContext): Promise<ProposalOutput> {
  const userMessage = buildUserMessage(context);

  const rawResult = await callClaudeJsonChunked<Record<string, unknown>>(
    (fields) => buildSystemPromptWithFieldDescriptions(fields),
    userMessage,
    FIELD_GROUPS
  );

  // Coerce any object values that should be strings
  const coerced = coerceFieldTypes(rawResult);

  return ProposalOutputSchema.parse(coerced);
}

export { type ProposalContext };

const SNAKE_TO_CAMEL: Record<string, string> = {
  executive_summary: 'executiveSummary',
  company_overview: 'companyOverview',
  experience_section: 'experienceSection',
  approach_section: 'approachSection',
  project_timeline: 'projectTimeline',
  team_structure: 'teamStructure',
  revenue_proposal: 'revenueProposal',
  cost_overview: 'costOverview',
  risk_mitigation: 'riskMitigation',
  value_proposition: 'valueProposition',
  compliance_statement: 'complianceStatement',
  competitive_advantages: 'competitiveAdvantages',
  terms_and_conditions: 'termsAndConditions',
};

export function snakeToCamelKey(snakeKey: string): string {
  return SNAKE_TO_CAMEL[snakeKey] || snakeKey;
}

export async function regenerateSection(
  context: ProposalContext,
  sectionKey: string
): Promise<string> {
  if (!FIELD_DESCRIPTIONS[sectionKey]) {
    throw new Error(`Unknown section key: ${sectionKey}`);
  }
  const userMessage = buildUserMessage(context);
  const systemPrompt = buildSystemPromptWithFieldDescriptions([sectionKey]);

  const { callClaudeJson } = await import('./claude.service.js');
  const result = await callClaudeJson<Record<string, unknown>>(systemPrompt, userMessage);
  const coerced = coerceFieldTypes(result);
  const value = coerced[sectionKey];
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

export async function* streamProposal(context: ProposalContext) {
  const userMessage = buildUserMessage(context);
  yield* streamClaude(SYSTEM_PROMPT, userMessage);
}
