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

  async generateSummary(data: NormalizedDrugData, eli12: boolean = false): Promise<AISummary> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const prompt = `
      You are MedLens, an AI assistant specialized in translating complex medical jargon into plain, everyday language.
      
      RULES:
      1. ONLY rewrite the provided medication information.
      2. If a section is missing, return "Information not provided in source data."
      3. NEVER provide medical advice or tell the user what they "should" do.
      4. NEVER guess or hallucinate information not present in the source.
      5. ${eli12 ? 'Use extremely simple language suitable for a 12-year-old (ELI12).' : 'Use clear, plain language (Health Literacy focus).'}
      
      OUTPUT FORMAT:
      You must return a JSON object with exactly these four keys:
      - what_it_does: A simple explanation of what the medication is for.
      - how_to_take: Plain-language instructions for use.
      - warnings: Clear, simplified safety warnings.
      - side_effects: A list of common side effects in everyday terms.

      Medication: ${data.drug_name}
      Indications (What it does): ${data.indications || 'N/A'}
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
      console.error('Gemini AI error:', error.response?.data || error.message);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }
}

export default new GeminiService();
