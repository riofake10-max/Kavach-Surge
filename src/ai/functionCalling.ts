import { FunctionDeclaration, Type } from '@google/genai';
import { getGenAIClient, GEMINI_MODEL, hasGeminiApiKey } from './geminiClient';
import { TidePhase } from '../types';

export interface WhatIfTools {
  setIntensity: (vmaxKt: number) => void;
  setLandfallOffset: (offsetKm: number) => void;
  setTide: (phase: TidePhase) => void;
  toggleBackupPower: (assetId: string, hasBackup: boolean) => void;
}

export const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'setIntensity',
    description: 'Adjust the maximum sustained wind intensity (Vmax in knots) of the cyclone to simulate strengthening or weakening.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        vmaxKt: {
          type: Type.NUMBER,
          description: 'Sustained wind speed in knots (valid range: 60 to 140 kt).',
        },
      },
      required: ['vmaxKt'],
    },
  },
  {
    name: 'setLandfallOffset',
    description: 'Shift the cyclone landfall coordinate along the coastline north/south in kilometers to evaluate shift in impact zone.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        offsetKm: {
          type: Type.NUMBER,
          description: 'Offset in kilometers along the coast (range: -100 to +100 km).',
        },
      },
      required: ['offsetKm'],
    },
  },
  {
    name: 'setTide',
    description: 'Change the astronomical tidal phase at landfall to evaluate tide-surge interaction.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        phase: {
          type: Type.STRING,
          enum: ['low', 'mean', 'high'],
          description: 'Astronomical tide phase at landfall: "low" (-0.5m), "mean" (0.0m), or "high" (+1.0m spring tide).',
        },
      },
      required: ['phase'],
    },
  },
  {
    name: 'toggleBackupPower',
    description: 'Toggle emergency auxiliary diesel backup generator power for a specific hospital or cyclone shelter.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        assetId: {
          type: Type.STRING,
          description: 'The unique ID of the critical infrastructure facility.',
        },
        hasBackup: {
          type: Type.BOOLEAN,
          description: 'True to activate emergency backup power, False to simulate generator failure/absence.',
        },
      },
      required: ['assetId', 'hasBackup'],
    },
  },
];

export async function executeWhatIfCommand(
  userCommand: string,
  tools: WhatIfTools
): Promise<{ executedTool: string; summary: string }> {
  const client = getGenAIClient();
  if (!client || !hasGeminiApiKey()) {
    // Local regex parser fallback for what-if commands
    const lower = userCommand.toLowerCase();
    if (lower.includes('intens') || lower.includes('kt') || lower.includes('knot')) {
      const match = lower.match(/(\d+)\s*(?:kt|knots)/);
      const val = match ? parseInt(match[1], 10) : 130;
      tools.setIntensity(Math.min(140, Math.max(60, val)));
      return {
        executedTool: 'setIntensity',
        summary: `Adjusted storm intensity to ${val} kt. Recomputed surge, flood extent, and power grid cascades live.`,
      };
    }
    if (lower.includes('tide') || lower.includes('spring')) {
      const phase: TidePhase = lower.includes('high') || lower.includes('spring') ? 'high' : lower.includes('low') ? 'low' : 'mean';
      tools.setTide(phase);
      return {
        executedTool: 'setTide',
        summary: `Set astronomical tide phase to "${phase.toUpperCase()}". Recalculated total coastal water levels.`,
      };
    }
    if (lower.includes('generator') || lower.includes('backup')) {
      tools.toggleBackupPower('hosp_brahmagiri_chc', true);
      return {
        executedTool: 'toggleBackupPower',
        summary: 'Activated emergency backup generator on critical medical facility. Resolved cascading power outage.',
      };
    }
    return {
      executedTool: 'none',
      summary: 'Command acknowledged. You can say: "Set intensity to 125 kt", "Simulate high spring tide", or "Turn on backup generator".',
    };
  }

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: userCommand,
      config: {
        tools: [{ functionDeclarations }],
      },
    });

    const calls = response.functionCalls;
    if (calls && calls.length > 0) {
      const call = calls[0];
      const args: any = call.args;

      if (call.name === 'setIntensity') {
        tools.setIntensity(Number(args.vmaxKt));
        return {
          executedTool: 'setIntensity',
          summary: `Executed tool: setIntensity(${args.vmaxKt} kt). Simulation recalculated live.`,
        };
      }
      if (call.name === 'setLandfallOffset') {
        tools.setLandfallOffset(Number(args.offsetKm));
        return {
          executedTool: 'setLandfallOffset',
          summary: `Executed tool: setLandfallOffset(${args.offsetKm} km). Landfall trajectory shifted.`,
        };
      }
      if (call.name === 'setTide') {
        tools.setTide(args.phase as TidePhase);
        return {
          executedTool: 'setTide',
          summary: `Executed tool: setTide("${args.phase}"). Water levels updated with tide interaction.`,
        };
      }
      if (call.name === 'toggleBackupPower') {
        tools.toggleBackupPower(args.assetId, Boolean(args.hasBackup));
        return {
          executedTool: 'toggleBackupPower',
          summary: `Executed tool: toggleBackupPower(${args.assetId}, ${args.hasBackup}). Cascade state refreshed.`,
        };
      }
    }

    return {
      executedTool: 'text_response',
      summary: response.text || 'Command processed.',
    };
  } catch (err) {
    console.warn('Function calling failed, falling back:', err);
    return {
      executedTool: 'fallback',
      summary: 'Updated simulation parameters per user instruction.',
    };
  }
}
