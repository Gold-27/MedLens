import axios from 'axios';
import { NormalizedDrugData } from './openfda.service';

export interface AISummary {
  what_it_does: string;
  how_to_take: string;
  warnings: string;
  side_effects: string;
}

export class GeminiService {
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  private get apiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  async generateSummary(data: NormalizedDrugData): Promise<AISummary> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const prompt = `
      You are MedLens, an AI assistant specialized in translating complex medical jargon into clear, simplified medical language (Health Literacy focus).
      
      RULES:
      1. Use ALL provided raw fields to construct a complete summary. For example, if "Indications" is sparse, look into "Warnings" or "Dosage" to explain what the drug does.
      2. If a section is missing from the explicit JSON fields but the medication is well-known (like Aspirin, Tylenol, etc.), use the provided context to infer the missing info safely.
      3. NEVER return "No information available" or "Information not provided" if there is ANY data in the raw fields. Your job is to extract and simplify, not just report missing keys.
      4. NEVER provide medical advice or tell the user what they "should" do.
      5. Use clear, plain language that an average adult can easily understand.
      
      OUTPUT FORMAT:
      You must return a JSON object with exactly these four keys: what_it_does, how_to_take, warnings, side_effects.

      Medication: ${data.drug_name}
      Indications (What it does): ${data.indications || 'Extract information from dosage or warnings if needed'}
      Dosage (How to take): ${data.dosage || 'N/A'}
      Warnings: ${data.warnings || 'N/A'}
      Side Effects: ${data.side_effects || 'N/A'}

      JSON Output:
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
          }
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
      You are MedLens, an AI assistant specialized in extreme simplification (ELI12 mode).
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
}

export default new GeminiService();
