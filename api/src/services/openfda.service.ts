import axios from 'axios';

export interface NormalizedDrugData {
  drug_name: string;
  indications?: string;
  dosage?: string;
  warnings?: string;
  side_effects?: string;
}

export class OpenFDAService {
  private readonly baseUrl = 'https://api.fda.gov/drug/label.json';

  private get apiKey(): string | undefined {
    return process.env.OPENFDA_API_KEY;
  }

  async searchDrug(query: string): Promise<NormalizedDrugData | null> {
    try {
      const url = `${this.baseUrl}?search=openfda.brand_name:"${query}"+openfda.generic_name:"${query}"&limit=1${this.apiKey ? `&api_key=${this.apiKey}` : ''}`;
      
      const response = await axios.get(url);
      
      if (!response.data.results || response.data.results.length === 0) {
        return null;
      }

      const result = response.data.results[0];
      
      return {
        drug_name: result.openfda?.brand_name?.[0] || result.openfda?.generic_name?.[0] || query,
        indications: result.indications_and_usage?.[0],
        dosage: result.dosage_and_administration?.[0],
        warnings: result.warnings?.[0] || result.boxed_warning?.[0],
        side_effects: result.adverse_reactions?.[0]
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
      // OpenFDA doesn't have a direct autocomplete, but we can search for brand names
      const url = `${this.baseUrl}?search=openfda.brand_name:${query}*&limit=10${this.apiKey ? `&api_key=${this.apiKey}` : ''}&count=openfda.brand_name.exact`;
      
      const response = await axios.get(url);
      
      if (!response.data.results) {
        return [];
      }

      return response.data.results.map((r: any) => r.term).filter(Boolean);
    } catch (error: any) {
      console.error('OpenFDA Autocomplete error:', error.message);
      return [];
    }
  }
}

export default new OpenFDAService();
