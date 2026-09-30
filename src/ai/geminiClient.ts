import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODEL, getGeminiApiKey, hasGeminiApiKey } from '../config/gemini';

let genAIInstance: GoogleGenAI | null = null;

export function getGenAIClient(): GoogleGenAI | null {
  if (!hasGeminiApiKey()) {
    return null;
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({
      apiKey: getGeminiApiKey(),
    });
  }
  return genAIInstance;
}

export { GEMINI_MODEL, hasGeminiApiKey };
