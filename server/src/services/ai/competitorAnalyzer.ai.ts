import { callClaudeJson } from './claude.service.js';

export interface CompetitorAnalysis {
  competitor_name: string;
  predicted_strategy: string;
  threat_level: string;
  our_differentiation_opportunity: string;
}

const SYSTEM_PROMPT = `You are a competitive intelligence analyst specializing in bid strategy.

Based on competitor profiles and their historical bidding patterns, predict their likely approach for the given RFP.

Return a JSON array wrapped in a json code block:
[
  {
    "competitor_name": "Name of the competitor",
    "predicted_strategy": "Detailed prediction of their likely approach",
    "threat_level": "high | medium | low",
    "our_differentiation_opportunity": "How we can differentiate from this competitor"
  }
]`;

export async function analyzeCompetitors(
  rfpDetails: { title: string; industry: string | null; projectScope: string | null },
  competitors: Array<{
    name: string;
    strengths: string | null;
    weaknesses: string | null;
    typicalBidStyle: string | null;
  }>,
  competitorBids: Array<{
    bidderName: string | null;
    rfpTitle: string | null;
    flatGuarantee: number | null;
    profitSharePct: number | null;
    outcome: string | null;
  }>
): Promise<CompetitorAnalysis[]> {
  const userMessage = `
## RFP Details
${JSON.stringify(rfpDetails, null, 2)}

## Competitor Profiles
${JSON.stringify(competitors, null, 2)}

## Competitor Historical Bids
${JSON.stringify(competitorBids, null, 2)}

Analyze each competitor and predict their strategy for this RFP.`;

  return callClaudeJson<CompetitorAnalysis[]>(SYSTEM_PROMPT, userMessage);
}
