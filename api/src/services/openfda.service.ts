import axios from 'axios';

export interface NormalizedDrugData {
  drug_name: string;
  indications?: string;
  dosage?: string;
  warnings?: string;
  side_effects?: string;
  drug_interactions?: string;
}

export class OpenFDAService {
  private readonly baseUrl = 'https://api.fda.gov/drug/label.json';

  private get apiKey(): string | undefined {
    return process.env.OPENFDA_API_KEY;
  }

  async searchDrug(query: string): Promise<NormalizedDrugData | null> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.baseUrl}?search=(openfda.brand_name:${encodedQuery}+OR+openfda.generic_name:${encodedQuery})&limit=1${this.apiKey ? `&api_key=${this.apiKey}` : ''}`;
      
      const response = await axios.get(url);
      
      if (!response.data.results || response.data.results.length === 0) {
        return null;
      }

      const result = response.data.results[0];
      
      return {
        drug_name: result.openfda?.brand_name?.[0] || result.openfda?.generic_name?.[0] || query,
        indications: result.indications_and_usage?.[0] || result.purpose?.[0] || result.indications?.[0] || result.description?.[0] || result.usage?.[0],
        dosage: result.dosage_and_administration?.[0] || result.how_to_use?.[0] || result.instructions_for_use?.[0] || result.dosage?.[0],
        warnings: result.warnings?.[0] || result.boxed_warning?.[0] || result.precautions?.[0] || result.do_not_use?.[0] || result.warnings_and_precautions?.[0] || result.stop_use?.[0],
        side_effects: result.adverse_reactions?.[0] || result.side_effects?.[0] || result.adverse_reactions_table?.[0],
        drug_interactions: result.drug_interactions?.[0] || result.interactions?.[0]
      };
    } catch (error: any) {
      console.error('OpenFDA API error:', error.message);
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(`OpenFDA search failed: ${error.message}`);
    }
  }

  async getAutocomplete(query: string): Promise<string[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      
      // We perform two counts to get both brand and generic suggestions
      const brandUrl = `${this.baseUrl}?search=openfda.brand_name:${encodedQuery}*&limit=10${this.apiKey ? `&api_key=${this.apiKey}` : ''}&count=openfda.brand_name.exact`;
      const genericUrl = `${this.baseUrl}?search=openfda.generic_name:${encodedQuery}*&limit=10${this.apiKey ? `&api_key=${this.apiKey}` : ''}&count=openfda.generic_name.exact`;
      
      const [brandRes, genericRes] = await Promise.all([
        axios.get(brandUrl).catch(() => ({ data: { results: [] } })),
        axios.get(genericUrl).catch(() => ({ data: { results: [] } }))
      ]);
      
      const suggestions = new Set<string>();
      
      // Add brand names
      if (brandRes.data.results) {
        brandRes.data.results.forEach((r: any) => {
          if (r.term) suggestions.add(this.capitalizeWords(r.term));
        });
      }
      
      // Add generic names
      if (genericRes.data.results) {
        genericRes.data.results.forEach((r: any) => {
          if (r.term) suggestions.add(this.capitalizeWords(r.term));
        });
      }

      return Array.from(suggestions).slice(0, 10);
    } catch (error: any) {
      console.error('OpenFDA Autocomplete error:', error.message);
      return [];
    }
  }

  private capitalizeWords(str: string): string {
    return str.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
  }
}

export default new OpenFDAService();
