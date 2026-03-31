import { callClaudeJson } from './claude.service.js';

interface ExtractedRequirement {
  requirement: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

const SYSTEM_PROMPT = `You are an RFP requirements analyst. Extract ALL specific requirements, obligations, eligibility criteria, and compliance items from the RFP document.

For each requirement, provide:
- requirement: The specific requirement stated clearly and concisely (one sentence)
- category: One of: "Technical", "Financial", "Compliance", "Experience", "Staffing", "Safety", "Legal", "Operational", "Reporting", "Submission"
- priority: "high" for mandatory/must-have/minimum criteria, "medium" for should-have/scoring, "low" for nice-to-have/optional

Return JSON: { "requirements": [...] }

Be thorough — extract 15-40 requirements covering all sections of the RFP. Include eligibility requirements, technical specifications, submission format requirements, financial requirements, certification requirements, etc.`;

export async function extractRequirements(rawText: string): Promise<ExtractedRequirement[]> {
  // Truncate to avoid exceeding input limits
  const truncated = rawText.length > 80000 ? rawText.substring(0, 80000) : rawText;

  const result = await callClaudeJson<{ requirements: ExtractedRequirement[] }>(
    SYSTEM_PROMPT,
    `Extract all requirements from this RFP:\n\n${truncated}`
  );

  return result.requirements || [];
}
