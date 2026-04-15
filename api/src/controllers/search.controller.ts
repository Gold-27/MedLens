import { Request, Response } from 'express';
import openFDAService from '../services/openfda.service';
import deepSeekService from '../services/deepseek.service';

export const searchMedication = async (req: Request, res: Response) => {
  const { query, eli12 } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    console.log(`[Search] Query: ${query}, ELI12: ${eli12}`);
    
    // Stage 1: Fetch from OpenFDA
    console.log('[Search] Fetching from OpenFDA...');
    const fdaData = await openFDAService.searchDrug(query);

    if (!fdaData) {
      console.log('[Search] Medication not found in OpenFDA');
      return res.status(404).json({ 
        message: 'Medication not found',
        advice: 'Check the spelling or try a generic name.'
      });
    }
    console.log('[Search] OpenFDA data received for:', fdaData.drug_name);

    // Stage 2: Transform with DeepSeek
    console.log('[Search] Transforming with DeepSeek...');
    const summary = await deepSeekService.generateSummary(fdaData, !!eli12);
    console.log('[Search] DeepSeek summary generated');

    // Stage 3: Return structured response
    console.log('[Search] Returning success response');
    return res.json({
      drug_name: fdaData.drug_name,
      source: 'OpenFDA',
      summary,
      raw_data_available: true,
      eli12_enabled: !!eli12,
      disclaimer: 'MedLens simplifies medical information for understanding. It does not replace professional medical advice.'
    });

  } catch (error: any) {
    console.error('[Search] Error caught in controller:', error);
    return res.status(500).json({ 
      error: 'Failed to process medication data',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const autocomplete = async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    return res.json([]);
  }

  try {
    const suggestions = await openFDAService.getAutocomplete(q);
    return res.json(suggestions);
  } catch (error: any) {
    console.error('Autocomplete controller error:', error.message);
    return res.json([]);
  }
};
