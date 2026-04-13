import axios, { AxiosInstance } from 'axios';

export interface OpenFDADrugData {
  brand_name?: string[];
  generic_name?: string[];
  indications_and_usage?: string[];
  dosage_and_administration?: string[];
  warnings?: string[];
  adverse_reactions?: string[];
  drug_interactions?: string[];
  pregnancy?: string[];
  nursing_mothers?: string[];
  pediatric_use?: string[];
  geriatric_use?: string[];
  [key: string]: any;
}

export interface NormalizedDrugData {
  drugName: string;
  brandNames?: string[];
  genericName?: string;
  indications?: string;
  dosage?: string;
  warnings?: string;
  sideEffects?: string;
  interactions?: string;
  sourceData: OpenFDADrugData;
}

export class OpenFDAService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENFDA_API_KEY || '';
    this.client = axios.create({
      baseURL: 'https://api.fda.gov',
      timeout: 10000,
      params: this.apiKey ? { api_key: this.apiKey } : {},
    });
  }

  async searchDrug(query: string): Promise<NormalizedDrugData | null> {
    try {
      const response = await this.client.get('/drug/label.json', {
        params: {
          search: `openfda.brand_name:"${query}" OR openfda.generic_name:"${query}"`,
          limit: 1,
        },
      });

      const results = response.data.results;
      if (!results || results.length === 0) {
        return null;
      }

      const drugData = results[0];
      return this.normalizeData(drugData, query);
    } catch (error: any) {
      console.error('OpenFDA API error:', error.message);
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(`OpenFDA search failed: ${error.message}`);
    }
  }

  private normalizeData(drugData: any, query: string): NormalizedDrugData {
    const openfda = drugData.openfda || {};
    const normalized: NormalizedDrugData = {
      drugName: openfda.brand_name?.[0] || openfda.generic_name?.[0] || query,
      brandNames: openfda.brand_name,
      genericName: openfda.generic_name?.[0],
      indications: this.extractField(drugData, 'indications_and_usage'),
      dosage: this.extractField(drugData, 'dosage_and_administration'),
      warnings: this.extractField(drugData, 'warnings'),
      sideEffects: this.extractField(drugData, 'adverse_reactions'),
      interactions: this.extractField(drugData, 'drug_interactions'),
      sourceData: drugData,
    };

    return normalized;
  }

  private extractField(drugData: any, fieldName: string): string | undefined {
    const field = drugData[fieldName];
    if (!field) return undefined;
    
    // Handle array of strings
    if (Array.isArray(field)) {
      return field.join(' ');
    }
    
    // Handle string
    if (typeof field === 'string') {
      return field;
    }
    
    // Handle nested object (some fields are objects)
    if (typeof field === 'object') {
      return JSON.stringify(field);
    }
    
    return undefined;
  }

  async getDrugInteractions(drugKeys: string[]): Promise<{interactions: Array<{drugKey: string, interactions: string[]}>, status: 'potential_interaction' | 'insufficient_data'}> {
    if (drugKeys.length < 2) {
      return { interactions: [], status: 'insufficient_data' };
    }

    try {
      const interactions = [];
      for (const drugKey of drugKeys) {
        // Fetch drug label
        const response = await this.client.get('/drug/label.json', {
          params: {
            search: `openfda.brand_name:"${drugKey}" OR openfda.generic_name:"${drugKey}"`,
            limit: 1,
          },
        });

        const results = response.data.results;
        if (!results || results.length === 0) {
          continue;
        }

        const drugData = results[0];
        const drugInteractions = this.extractField(drugData, 'drug_interactions');
        const interactionList = drugInteractions ? drugInteractions.split(/[.;]/).map((s: string) => s.trim()).filter(Boolean) : [];
        
        interactions.push({
          drugKey,
          interactions: interactionList,
        });
      }

      // Check if any interaction mentions any of the other drugs
      let potentialInteraction = false;
      const drugNames = drugKeys.map(key => key.toLowerCase());
      
      for (const item of interactions) {
        for (const interactionText of item.interactions) {
          const lowerText = interactionText.toLowerCase();
          // Check if any other drug name appears in the interaction text
          for (const otherDrug of drugNames) {
            if (otherDrug !== item.drugKey.toLowerCase() && lowerText.includes(otherDrug)) {
              potentialInteraction = true;
              break;
            }
          }
          if (potentialInteraction) break;
        }
        if (potentialInteraction) break;
      }

      return {
        interactions,
        status: potentialInteraction ? 'potential_interaction' : 'insufficient_data',
      };
    } catch (error: any) {
      console.error('OpenFDA interactions error:', error.message);
      return { interactions: [], status: 'insufficient_data' };
    }
  }

  async searchSuggestions(query: string, limit: number = 5): Promise<Array<{brand_name?: string[], generic_name?: string[], drug_name: string}>> {
    try {
      const response = await this.client.get('/drug/label.json', {
        params: {
          search: `openfda.brand_name:"${query}*" OR openfda.generic_name:"${query}*"`,
          limit,
        },
      });

      const results = response.data.results;
      if (!results || results.length === 0) {
        return [];
      }

      return results.map((drugData: any) => {
        const openfda = drugData.openfda || {};
        return {
          brand_name: openfda.brand_name,
          generic_name: openfda.generic_name,
          drug_name: openfda.brand_name?.[0] || openfda.generic_name?.[0] || query,
        };
      });
    } catch (error: any) {
      console.error('OpenFDA autocomplete error:', error.message);
      if (error.response?.status === 404) {
        return [];
      }
      throw new Error(`OpenFDA autocomplete failed: ${error.message}`);
    }
  }
}