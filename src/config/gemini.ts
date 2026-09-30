/**
 * Gemini Configuration
 * 
 * GEMINI_MODEL: The active Gemini model used across the entire application.
 * Set to the latest available Gemini Flash model according to Google GenAI SDK standards.
 */
export const GEMINI_MODEL = 'gemini-3.8-flash';

// Retrieve API key from environment variable injected by AI Studio
export function getGeminiApiKey(): string {
  // Check process.env.GEMINI_API_KEY (configured in vite.config.ts define) or Vite's import.meta.env
  const key = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
              (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
              '';
  return key;
}

export function hasGeminiApiKey(): boolean {
  const key = getGeminiApiKey();
  return Boolean(key && key.trim().length > 0 && key !== 'MY_GEMINI_API_KEY');
}
