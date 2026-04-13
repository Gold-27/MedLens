import { Request, Response } from 'express';
import { OpenFDAService } from '../services/openfda';

const openfdaService = new OpenFDAService();

export interface Suggestion {
  brand_name?: string[];
  generic_name?: string[];
  drug_name: string;
}

export const getAutocomplete = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    console.log(`Autocomplete search: ${q}`);
    
    const suggestions = await openfdaService.searchSuggestions(q.trim(), 5);
    
    // Flatten suggestions for easier client consumption
    const flattened = suggestions.flatMap(suggestion => {
      const items = [];
      if (suggestion.brand_name && suggestion.brand_name.length > 0) {
        items.push(...suggestion.brand_name.map(name => ({
          name,
          type: 'brand' as const,
          drug_name: suggestion.drug_name,
        })));
      }
      if (suggestion.generic_name && suggestion.generic_name.length > 0) {
        items.push(...suggestion.generic_name.map(name => ({
          name,
          type: 'generic' as const,
          drug_name: suggestion.drug_name,
        })));
      }
      return items;
    });

    // Deduplicate by name
    const uniqueMap = new Map<string, any>();
    flattened.forEach(item => {
      if (!uniqueMap.has(item.name)) {
        uniqueMap.set(item.name, item);
      }
    });
    
    const uniqueSuggestions = Array.from(uniqueMap.values()).slice(0, 8);

    res.json({
      query: q,
      suggestions: uniqueSuggestions,
    });
  } catch (error: any) {
    console.error('Autocomplete controller error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Something went wrong. Please try again later.'
    });
  }
};