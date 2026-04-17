import { Request, Response } from 'express';
import openFDAService from '../services/openfda.service';
import deepseekService, { AISummary } from '../services/deepseek.service';

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
        advice: 'Check the spelling or try a generic name.',
      });
    }
    console.log('[Search] OpenFDA data received for:', fdaData.drug_name);

    // Stage 2: Transform with DeepSeek (with Safe Mode Fallback)
    console.log('[Search] Transforming with DeepSeek...');
    let summary: AISummary;

    try {
      summary = await deepseekService.generateSummary(fdaData, !!eli12);
      console.log('[Search] DeepSeek summary generated');
    } catch (error: any) {
      console.error('[Search] DeepSeek failed, switching to Safe Mode Fallback:', error.message);

      // Safety Fallback (Section 7, Step 6 of AGENTS.md)
      summary = {
        what_it_does: fdaData.indications || 'We do not have enough reliable information for this section.',
        how_to_take: fdaData.dosage || 'We do not have enough reliable information for this section.',
        warnings: fdaData.warnings || 'We do not have enough reliable information for this section. Consult a professional.',
        side_effects: fdaData.side_effects || 'We do not have enough reliable information for this section.',
      };
      console.log('[Search] Fallback summary created from raw FDA data');
    }

    // Stage 3: Validate AI output — ensure all required keys are present
    const validatedSummary: AISummary = {
      what_it_does: summary.what_it_does || 'We do not have enough reliable information for this section.',
      how_to_take: summary.how_to_take || 'We do not have enough reliable information for this section.',
      warnings: summary.warnings || 'We do not have enough reliable information for this section.',
      side_effects: summary.side_effects || 'We do not have enough reliable information for this section.',
    };

    // Stage 4: Return structured response (including normalized data for ELI12 re-use)
    console.log('[Search] Returning success response');
    return res.json({
      drug_name: fdaData.drug_name,
      source: 'OpenFDA',
      data: fdaData,
      summary: validatedSummary,
      eli12: {
        enabled: !!eli12,
        content: null,
      },
      disclaimer: 'MedLens simplifies medical information for understanding. It does not replace professional medical advice.',
    });

  } catch (error: any) {
    console.error('[Search] Error caught in controller:', error);
    return res.status(500).json({
      error: 'Failed to process medication data',
      message: error.message,
    });
  }
};

export const generateELI12 = async (req: Request, res: Response) => {
  const { drug_data } = req.body;

  if (!drug_data) {
    return res.status(400).json({ error: 'drug_data is required' });
  }

  try {
    console.log(`[ELI12] Generating ELI12 summary for: ${drug_data.drug_name}`);

    let summary: AISummary;

    try {
      summary = await deepseekService.generateSummary(drug_data, true);
    } catch (error: any) {
      console.error('[ELI12] DeepSeek failed, using fallback:', error.message);
      summary = {
        what_it_does: drug_data.indications || 'We do not have enough reliable information for this section.',
        how_to_take: drug_data.dosage || 'We do not have enough reliable information for this section.',
        warnings: drug_data.warnings || 'We do not have enough reliable information for this section.',
        side_effects: drug_data.side_effects || 'We do not have enough reliable information for this section.',
      };
    }

    const validatedSummary: AISummary = {
      what_it_does: summary.what_it_does || 'We do not have enough reliable information for this section.',
      how_to_take: summary.how_to_take || 'We do not have enough reliable information for this section.',
      warnings: summary.warnings || 'We do not have enough reliable information for this section.',
      side_effects: summary.side_effects || 'We do not have enough reliable information for this section.',
    };

    return res.json({
      drug_name: drug_data.drug_name,
      source: 'OpenFDA',
      data: drug_data,
      summary: validatedSummary,
      eli12: {
        enabled: true,
        content: JSON.stringify(validatedSummary),
      },
      disclaimer: 'MedLens simplifies medical information for understanding. It does not replace professional medical advice.',
    });

  } catch (error: any) {
    console.error('[ELI12] Error:', error);
    return res.status(500).json({ error: 'Failed to generate ELI12 summary', message: error.message });
  }
};

export const autocomplete = async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    return res.json([]);
  }

  try {
    const suggestions = await openFDAService.getAutocomplete(q);
    return res.json({ query: q, suggestions: suggestions.map(name => ({ name, type: 'brand', drug_name: name })) });
  } catch (error: any) {
    console.error('Autocomplete controller error:', error.message);
    return res.json({ query: q, suggestions: [] });
  }
};
