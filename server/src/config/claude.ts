import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './environment.js';

export const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    maxOutputTokens: 65536,
  },
});
