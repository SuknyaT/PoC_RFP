import { callClaudeJson } from './claude.service.js';

export interface SuggestedCompetitor {
  name: string;
  industries: string[];
  strengths: string;
  weaknesses: string;
  typicalBidStyle: string;
  relevance_reason: string;
}

const SYSTEM_PROMPT = `You are an industry expert with deep knowledge of companies across all sectors globally.

Given an RFP's details, suggest 8-12 real companies that would likely bid on this project. Include a mix of:
- Large multinational corporations that dominate this space
- Mid-tier regional players with strong track records
- Niche specialists known for this exact type of work

Return a JSON array wrapped in a \`\`\`json code block:
[
  {
    "name": "Full Company Name",
    "industries": ["industry1", "industry2"],
    "strengths": "2-3 sentence description of their key strengths relevant to this RFP",
    "weaknesses": "Known weaknesses or limitations",
    "typicalBidStyle": "How they typically approach bids (aggressive pricing, premium quality, etc.)",
    "relevance_reason": "Why they would bid on this specific RFP"
  }
]

Guidelines:
- Use REAL company names that actually operate in this industry
- Be specific about strengths/weaknesses based on real market reputation
- Include companies from different tiers (global leaders, regional players, specialists)
- Industries should be lowercase, descriptive tags`;

export async function suggestCompetitors(rfpDetails: {
  title: string;
  clientName: string | null;
  industry: string | null;
  projectScope: string | null;
  location: string | null;
  estimatedValue: string | null;
}): Promise<SuggestedCompetitor[]> {
  const userMessage = `## RFP Details
Title: ${rfpDetails.title}
Client: ${rfpDetails.clientName || 'Not specified'}
Industry: ${rfpDetails.industry || 'Not specified'}
Scope: ${rfpDetails.projectScope || 'Not specified'}
Location: ${rfpDetails.location || 'Not specified'}
Estimated Value: ${rfpDetails.estimatedValue || 'Not specified'}

Suggest real companies that would likely compete for this project.`;

  return callClaudeJson<SuggestedCompetitor[]>(SYSTEM_PROMPT, userMessage);
}
