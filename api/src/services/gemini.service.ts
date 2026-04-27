import axios from 'axios';
import { NormalizedDrugData } from './openfda.service';

export interface AISummary {
  what_it_does: string;
  how_to_take: string;
  warnings: string;
  side_effects: string;
  eli12?: {
    what_it_does: string;
    how_to_take: string;
    warnings: string;
    side_effects: string;
  };
}

export class GeminiService {
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  private get apiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  async generateSummary(data: NormalizedDrugData): Promise<AISummary> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const prompt = `
      You are MedQuire, an AI assistant specialized in medical simplification.
      Your task is to generate TWO versions of a medication summary based on FDA label data:
      1. BASE: Clear, plain-language for an average adult.
      2. ELI12: Extreme simplification for a 12-year-old child (use metaphors, simple words, short sentences).
      
      RULES:
      - Use ALL provided raw fields. 
      - NEVER return "No info available" if any data exists. Infer safely for common drugs.
      - NEVER provide medical advice.
      - Output exactly in JSON format.

      Medication: ${data.drug_name}
      Indications: ${data.indications || 'Extract information from dosage or warnings if needed'}
      Dosage: ${data.dosage || 'N/A'}
      Warnings: ${data.warnings || 'N/A'}
      Side Effects: ${data.side_effects || 'N/A'}

      Return a JSON object with:
      - what_it_does, how_to_take, warnings, side_effects (for BASE)
      - eli12: { what_it_does, how_to_take, warnings, side_effects } (for ELI12 version)
    `;

    try {
      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 45000
        }
      );

      const content = response.data.candidates[0].content.parts[0].text;
      return JSON.parse(content);
    } catch (error: any) {
      console.error('Gemini AI error:', error.message);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  async generateELI12(summary: AISummary): Promise<AISummary> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const prompt = `
      You are MedQuire, an AI assistant specialized in extreme simplification (ELI12 mode).
      You are performing "Layer 2" simplification: taking a simplified medical summary and making it even MORE basic for a 12-year-old child.
      
      CRITICAL RULES:
      1. If the input summary contains phrases like "Information not available" or "Not enough information," IGNORE those phrases and try to provide a basic simplified explanation of the medication name provided instead.
      2. Use very simple language, metaphors, and short sentences.
      3. If there are still any medical terms, explain them like you're talking to a kid.
      4. DO NOT change the medical meaning.
      5. NEVER provide medical advice.
      
      OUTPUT FORMAT:
      Return a JSON object with the same four keys: what_it_does, how_to_take, warnings, side_effects.

      Take this current summary and simplify it MUCH further for a child:
      
      What it does: ${summary.what_it_does}
      How to take: ${summary.how_to_take}
      Warnings: ${summary.warnings}
      Side effects: ${summary.side_effects}

      JSON Output:
    `;

    try {
      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const content = response.data.candidates[0].content.parts[0].text;
      return JSON.parse(content);
    } catch (error: any) {
      console.error('Gemini ELI12 error:', error.message);
      throw new Error(`ELI12 simplify failed: ${error.message}`);
    }
  }

  async transcribeAudio(base64Audio: string, mimeType: string = 'audio/m4a'): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                { text: "Transcribe the audio accurately. If it's a medication name, ensure the spelling is correct based on medical knowledge. If no speech is detected, say 'No medication detected'." },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Audio
                  }
                }
              ]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const text = response.data.candidates[0].content.parts[0].text;
      return text.trim().replace(/\.$/, ''); // Clean up trailing dots
    } catch (error: any) {
      console.error('Gemini Transcription error:', error.response?.data || error.message);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }
}

export default new GeminiService();
