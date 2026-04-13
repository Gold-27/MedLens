import axios, { AxiosInstance } from 'axios';

export interface DeepSeekSummary {
  whatItDoes: string;
  howToTake: string;
  warnings: string;
  sideEffects: string;
}

export interface DeepSeekResponse {
  summary: DeepSeekSummary;
  eli12?: DeepSeekSummary;
}

export class DeepSeekService {
  private apiKey: string;
  private client: AxiosInstance;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY || '';
    this.client = axios.create({
      baseURL: 'https://api.deepseek.com',
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async generateSummary(normalizedData: any): Promise<DeepSeekResponse> {
    const prompt = this.createPrompt(normalizedData);
    
    try {
      const response = await this.client.post('/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a medical information simplifier. Rewrite drug information into clear, plain language. NEVER add new medical facts, only rewrite what is provided. Structure your response with four sections: "What it does", "How to take it", "Warnings", "Side effects". Each section should be a single paragraph.'
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const content = response.data.choices[0].message.content;
      return this.parseResponse(content);
    } catch (error: any) {
      console.error('DeepSeek API error:', error.message);
      throw new Error(`DeepSeek summary generation failed: ${error.message}`);
    }
  }

  async generateELI12(normalizedData: any): Promise<DeepSeekSummary> {
    const prompt = this.createELI12Prompt(normalizedData);
    
    try {
      const response = await this.client.post('/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a medical information simplifier for people with low health literacy. Rewrite drug information at a 12-year-old reading level (ELI12). Use very simple language, short sentences, and avoid medical jargon. NEVER add new medical facts, only rewrite what is provided. Structure your response with four sections: "What it does", "How to take it", "Warnings", "Side effects". Each section should be a single paragraph.'
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const content = response.data.choices[0].message.content;
      const parsed = this.parseResponse(content);
      return parsed.summary;
    } catch (error: any) {
      console.error('DeepSeek ELI12 error:', error.message);
      throw new Error(`DeepSeek ELI12 generation failed: ${error.message}`);
    }
  }

  private createPrompt(normalizedData: any): string {
    return `
Please rewrite this drug information into clear, plain language for adults:

DRUG: ${normalizedData.drugName}
${normalizedData.genericName ? `Generic name: ${normalizedData.genericName}` : ''}

INDICATIONS (what it's used for): ${normalizedData.indications || 'No information provided.'}

DOSAGE INSTRUCTIONS: ${normalizedData.dosage || 'No information provided.'}

WARNINGS: ${normalizedData.warnings || 'No information provided.'}

SIDE EFFECTS: ${normalizedData.sideEffects || 'No information provided.'}

Please structure your response with exactly four sections:
1. What it does
2. How to take it
3. Warnings
4. Side effects

Each section should be a single paragraph. Do not include any other text, headers, or markdown.`;
  }

  private createELI12Prompt(normalizedData: any): string {
    return `
Please rewrite this drug information for someone with low health literacy (ELI12 - Explain Like I'm 12):

DRUG: ${normalizedData.drugName}

INDICATIONS: ${normalizedData.indications || 'No information.'}

DOSAGE: ${normalizedData.dosage || 'No information.'}

WARNINGS: ${normalizedData.warnings || 'No information.'}

SIDE EFFECTS: ${normalizedData.sideEffects || 'No information.'}

Rewrite this at a 12-year-old reading level. Use very simple words, short sentences, and explain any complex terms. Structure your response with exactly four sections:
1. What it does
2. How to take it
3. Warnings
4. Side effects

Each section should be a single paragraph. Do not include any other text.`;
  }

  private parseResponse(content: string): DeepSeekResponse {
    // Simple parsing - look for section headings
    const lines = content.split('\n');
    let currentSection = '';
    const sections: Record<string, string[]> = {};

    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      if (lowerLine.includes('what it does') || lowerLine.startsWith('1.')) {
        currentSection = 'whatItDoes';
        sections[currentSection] = [line.replace(/^[1.]\s*what it does\s*/i, '').trim()];
      } else if (lowerLine.includes('how to take it') || lowerLine.startsWith('2.')) {
        currentSection = 'howToTake';
        sections[currentSection] = [line.replace(/^[2.]\s*how to take it\s*/i, '').trim()];
      } else if (lowerLine.includes('warnings') || lowerLine.startsWith('3.')) {
        currentSection = 'warnings';
        sections[currentSection] = [line.replace(/^[3.]\s*warnings\s*/i, '').trim()];
      } else if (lowerLine.includes('side effects') || lowerLine.startsWith('4.')) {
        currentSection = 'sideEffects';
        sections[currentSection] = [line.replace(/^[4.]\s*side effects\s*/i, '').trim()];
      } else if (currentSection && line.trim()) {
        sections[currentSection].push(line.trim());
      }
    }

    // Join each section's lines
    const summary: DeepSeekSummary = {
      whatItDoes: sections.whatItDoes?.join(' ') || 'Information not available.',
      howToTake: sections.howToTake?.join(' ') || 'Information not available.',
      warnings: sections.warnings?.join(' ') || 'Information not available.',
      sideEffects: sections.sideEffects?.join(' ') || 'Information not available.',
    };

    return { summary };
  }
}