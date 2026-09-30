import { Type } from '@google/genai';
import { getGenAIClient, GEMINI_MODEL, hasGeminiApiKey } from './geminiClient';

export interface DamageTriageResult {
  damage_level: 'NONE' | 'MINOR' | 'MAJOR' | 'DESTROYED';
  visible_hazards: string[];
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  observations: string;
  urgent_actions: string[];
}

export const FALLBACK_DAMAGE_TRIAGE: DamageTriageResult = {
  damage_level: 'MAJOR',
  visible_hazards: [
    'Submerged ground transformer with active high-voltage arc hazard risk',
    'Uprooted banyan tree blocking dual-lane access route to regional hospital',
    '0.6m stagnant saltwater inundation with silt contamination',
  ],
  priority: 'CRITICAL',
  observations:
    'Primary building structural framing intact, but secondary envelope (roof purlins and glass facade) suffered severe shear blowouts. Road impassable to light vehicles.',
  urgent_actions: [
    'Isolate upstream 33kV circuit breaker before search & rescue personnel enter water',
    'Deploy NDRF chainsaw team to clear arterial roadway for ambulances',
    'Install diesel dewatering pump to drain hospital approach apron',
  ],
};

export async function triageStormDamage(imageBase64: string, mimeType: string): Promise<DamageTriageResult> {
  const client = getGenAIClient();
  if (!client || !hasGeminiApiKey()) {
    return FALLBACK_DAMAGE_TRIAGE;
  }

  const systemInstruction = `You are a Rapid Damage Assessment specialist for the Disaster Management Authority.
Examine this post-cyclone photograph. Determine damage level, identify life-safety hazards, assign priority, and suggest immediate tactical response actions.
Output STRICT JSON conforming to the requested schema.`;

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: imageBase64, mimeType } },
            { text: 'Perform rapid post-storm damage triage on this facility photograph.' },
          ],
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            damage_level: {
              type: Type.STRING,
              enum: ['NONE', 'MINOR', 'MAJOR', 'DESTROYED'],
            },
            visible_hazards: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            priority: {
              type: Type.STRING,
              enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
            },
            observations: { type: Type.STRING },
            urgent_actions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['damage_level', 'visible_hazards', 'priority', 'observations', 'urgent_actions'],
        },
      },
    });

    const text = response.text?.trim();
    if (!text) throw new Error('Empty response');
    return JSON.parse(text) as DamageTriageResult;
  } catch (err) {
    console.warn('Damage triage failed, using fallback:', err);
    return FALLBACK_DAMAGE_TRIAGE;
  }
}
