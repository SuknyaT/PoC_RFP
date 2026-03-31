import { callClaudeJson } from './claude.service.js';
import { ParsedRfp, ParsedRfpSchema } from '../../types/rfp.types.js';

const SYSTEM_PROMPT = `You are an RFP (Request for Proposal) document analyst. Your job is to extract structured data from RFP documents.

Extract the following information from the provided RFP document text and return it as JSON:

{
  "title": "The RFP title or project name",
  "client_name": "The organization issuing the RFP",
  "industry": "The industry sector (e.g., airport, construction, logistics, healthcare, government)",
  "project_scope": "A summary of what the project entails",
  "submission_deadline": "The deadline for proposal submission in ISO 8601 format, or null if not found",
  "contract_duration": "Duration of the contract (e.g., '5 years', '36 months')",
  "estimated_value": "Estimated contract value as a number, or null if not mentioned",
  "location": "Project location",
  "scoring_criteria": [
    {
      "name": "Name of the scoring criterion",
      "max_points": "Maximum points for this criterion as a number",
      "weight_pct": "Weight as a percentage (e.g., 25.0 for 25%)",
      "description": "Description of what this criterion evaluates"
    }
  ]
}

Rules:
- Only extract information that is explicitly stated in the document
- Use null for fields not found in the document
- For scoring_criteria, extract ALL criteria mentioned with their point allocations
- If percentages and points are both given, include both
- Return valid JSON only, wrapped in a json code block`;

export async function parseRfpDocument(rawText: string): Promise<ParsedRfp> {
  const result = await callClaudeJson<ParsedRfp>(
    SYSTEM_PROMPT,
    `Please parse the following RFP document:\n\n${rawText}`
  );

  return ParsedRfpSchema.parse(result);
}
