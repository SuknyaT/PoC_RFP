import { callClaudeJson } from './claude.service.js';

export interface ScoringStrategy {
  criterion_name: string;
  strategy: string;
  priority: string;
  estimated_achievable_points: number;
}

const SYSTEM_PROMPT = `You are a bid strategy consultant specializing in RFP scoring optimization.

Given scoring criteria for an RFP and historical winning bid data, recommend specific strategies to maximize points in each category.

Return a JSON array wrapped in a json code block:
[
  {
    "criterion_name": "Name of the criterion",
    "strategy": "Detailed strategy to maximize points for this criterion",
    "priority": "high | medium | low",
    "estimated_achievable_points": <number>
  }
]

Focus on actionable, specific recommendations based on the data provided. Consider how historical winners succeeded in each category.`;

export async function analyzeScoring(
  criteria: Array<{ name: string; maxPoints: number | null; description: string | null }>,
  historicalWinners: Array<{ rfpTitle: string; industry: string; scoreReceived: number | null; lessonsLearned: string | null }>,
  companyStrengths?: string
): Promise<ScoringStrategy[]> {
  const userMessage = `
## Scoring Criteria
${JSON.stringify(criteria, null, 2)}

## Historical Winning Bids
${JSON.stringify(historicalWinners, null, 2)}

${companyStrengths ? `## Our Company Strengths\n${companyStrengths}` : ''}

Analyze each criterion and provide optimization strategies.`;

  return callClaudeJson<ScoringStrategy[]>(SYSTEM_PROMPT, userMessage);
}
