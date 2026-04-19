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
      1. ONLY rewrite the provided medication information.
      2. If a section is missing, use all available context to provide a helpful summary. NEVER return "No information available" if there is any data.
      3. NEVER provide medical advice or tell the user what they "should" do.
      4. NEVER guess or hallucinate information not present in the source.
      5. Use clear, plain language that an average adult can easily understand.
      
      OUTPUT FORMAT:
      You must return a JSON object with exactly these four keys:
      - what_it_does: A simple explanation of what the medication is for.
      - how_to_take: Plain-language instructions for use.
      - warnings: Clear, simplified safety warnings.
      - side_effects: A list of common side effects in everyday terms.

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
      You are MedLens, an AI assistant. You take already simplified medical language and further simplify it for a 12-year-old (ELI12 mode).
      
      RULES:
      1. Use very simple language and metaphors.
      2. Use short sentences.
      3. Break down any remaining complex terms.
      4. DO NOT change the medical meaning, just the language level.
      5. NEVER provide medical advice.
      
      OUTPUT FORMAT:
      Return a JSON object with the same four keys: what_it_does, how_to_take, warnings, side_effects.

      Simplify this summary even further for a 12-year-old child:
      
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
