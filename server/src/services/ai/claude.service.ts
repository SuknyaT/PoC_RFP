import { geminiModel } from '../../config/claude.js';
import { genAI } from '../../config/claude.js';

// Dedicated model for JSON responses — uses JSON mode so Gemini budgets tokens to complete the structure
const jsonModel = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    maxOutputTokens: 8192,
    responseMimeType: 'application/json',
  },
});

// Dedicated model for large JSON responses — uses multi-turn to get complete output
const largeJsonModel = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    maxOutputTokens: 8192,
  },
});

export async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const result = await geminiModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    systemInstruction: { role: 'user', parts: [{ text: systemPrompt }] },
  });

  const text = result.response.text();
  if (!text) {
    throw new Error('No response from Gemini');
  }
  return text;
}

export async function callClaudeJson<T>(systemPrompt: string, userMessage: string): Promise<T> {
  // Use JSON-mode model for structured output
  const result = await jsonModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    systemInstruction: { role: 'user', parts: [{ text: systemPrompt }] },
  });

  const text = result.response.text();
  if (!text) {
    throw new Error('No response from Gemini');
  }

  // With responseMimeType: 'application/json', response should be clean JSON
  try {
    return JSON.parse(text) as T;
  } catch {
    // Fallback: try extracting from markdown blocks
  }

  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    // Try repair
  }

  try {
    const repaired = repairTruncatedJson(jsonStr);
    return JSON.parse(repaired) as T;
  } catch {
    throw new Error(`Failed to parse Gemini response as JSON: ${text.substring(0, 300)}`);
  }
}

/**
 * Generate large JSON by splitting into chunks, running in parallel, and merging.
 * Each chunk asks for a subset of fields, staying within token limits.
 * Retries failed chunks once.
 */
export async function callClaudeJsonChunked<T>(
  buildSystemPrompt: (fields: string[]) => string,
  userMessage: string,
  fieldGroups: string[][]
): Promise<T> {
  const merged: Record<string, unknown> = {};

  async function generateChunk(fields: string[], label: string): Promise<Record<string, unknown> | null> {
    const chunkPrompt = buildSystemPrompt(fields);

    const result = await jsonModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      systemInstruction: { role: 'user', parts: [{ text: chunkPrompt }] },
    });

    const text = result.response.text();
    console.log(`[Proposal] ${label} response: ${text?.length ?? 0} chars`);
    if (!text) return null;

    // Try direct JSON parse
    try {
      const chunk = JSON.parse(text);
      console.log(`[Proposal] ${label} OK. Keys: ${Object.keys(chunk).join(', ')}`);
      return chunk;
    } catch {
      // noop
    }

    // Try markdown extraction
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
    try {
      return JSON.parse(jsonStr);
    } catch {
      // noop
    }

    // Try repair
    try {
      const repaired = repairTruncatedJson(jsonStr);
      return JSON.parse(repaired);
    } catch {
      console.error(`[Proposal] ${label} FAILED. First 300 chars: ${text.substring(0, 300)}`);
      return null;
    }
  }

  // Run all chunks in parallel
  console.log(`[Proposal] Starting ${fieldGroups.length} chunks in parallel...`);
  const results = await Promise.all(
    fieldGroups.map((fields, i) =>
      generateChunk(fields, `Chunk ${i + 1}/${fieldGroups.length} [${fields[0]}...]`)
    )
  );

  // Merge results and identify failed chunks
  const failedChunks: number[] = [];
  results.forEach((chunk, i) => {
    if (chunk) {
      Object.assign(merged, chunk);
    } else {
      failedChunks.push(i);
    }
  });

  // Retry failed chunks sequentially
  for (const i of failedChunks) {
    console.log(`[Proposal] Retrying chunk ${i + 1}...`);
    const chunk = await generateChunk(fieldGroups[i], `Retry chunk ${i + 1}`);
    if (chunk) {
      Object.assign(merged, chunk);
    }
  }

  console.log(`[Proposal] Final merged keys: ${Object.keys(merged).join(', ')}`);
  return merged as T;
}

function repairTruncatedJson(json: string): string {
  let str = json.trim();

  // Remove trailing comma
  str = str.replace(/,\s*$/, '');

  // Track JSON structure character by character
  let inString = false;
  let escape = false;
  let lastCompleteValueEnd = -1;
  let openBraces = 0;
  let openBrackets = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];

    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }

    if (ch === '"') {
      inString = !inString;
      if (!inString) {
        // Just closed a string — this could be end of a complete value
        lastCompleteValueEnd = i;
      }
      continue;
    }

    if (inString) continue;

    if (ch === '{') openBraces++;
    else if (ch === '}') { openBraces--; lastCompleteValueEnd = i; }
    else if (ch === '[') openBrackets++;
    else if (ch === ']') { openBrackets--; lastCompleteValueEnd = i; }
    else if (ch === ',' || ch === ':') lastCompleteValueEnd = i;
  }

  // If we ended inside a string, truncate to last complete value
  if (inString && lastCompleteValueEnd > 0) {
    str = str.substring(0, lastCompleteValueEnd + 1);
    inString = false;
    // Recount braces
    openBraces = 0;
    openBrackets = 0;
    escape = false;
    let recountInString = false;
    for (const ch of str) {
      if (escape) { escape = false; continue; }
      if (ch === '\\' && recountInString) { escape = true; continue; }
      if (ch === '"') { recountInString = !recountInString; continue; }
      if (recountInString) continue;
      if (ch === '{') openBraces++;
      else if (ch === '}') openBraces--;
      else if (ch === '[') openBrackets++;
      else if (ch === ']') openBrackets--;
    }
  }

  // Clean up trailing partial entries
  str = str.replace(/,\s*$/, '');
  // Remove trailing colon (incomplete key-value)
  str = str.replace(/:\s*$/, '');
  // Remove trailing key without value
  str = str.replace(/,?\s*"[^"]*"\s*$/, '');
  str = str.replace(/,\s*$/, '');

  // Close open structures
  while (openBrackets > 0) { str += ']'; openBrackets--; }
  while (openBraces > 0) { str += '}'; openBraces--; }

  return str;
}

export async function* streamClaude(systemPrompt: string, userMessage: string) {
  const result = await geminiModel.generateContentStream({
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    systemInstruction: { role: 'user', parts: [{ text: systemPrompt }] },
  });

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield text;
    }
  }
}
