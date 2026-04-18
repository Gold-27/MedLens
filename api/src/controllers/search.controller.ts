import { Request, Response } from 'express';
import openFDAService from '../services/openfda.service';
import deepseekService, { AISummary } from '../services/deepseek.service';
import geminiService from '../services/gemini.service';

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

    // Stage 2: Transform with AI (with Multi-Engine Failover)
    console.log('[Search] Starting AI transformation pipeline...');
    let summary: AISummary | null = null;
    let aiProvider = 'None';

    // Attempt 1: DeepSeek
    try {
      console.log('[Search] Attempting DeepSeek...');
      summary = await deepseekService.generateSummary(fdaData, !!eli12);
      aiProvider = 'DeepSeek';
      console.log('[Search] DeepSeek summary generated successfully');
    } catch (dsError: any) {
      console.warn(`[Search] DeepSeek failed: ${dsError.message}`);
      
      // Attempt 2: Gemini Failover
      try {
        console.log('[Search] Attempting Gemini failover...');
        summary = await geminiService.generateSummary(fdaData, !!eli12);
        aiProvider = 'Gemini';
        console.log('[Search] Gemini summary generated successfully');
      } catch (gemError: any) {
        console.error(`[Search] Gemini also failed: ${gemError.message}`);
        
        // Final Fallback: Safe Mode (Manual transformation)
        console.log('[Search] All AI engines failed. Switching to Safe Mode Fallback.');
        summary = {
          what_it_does: fdaData.indications || 'We do not have enough reliable information for this section.',
          how_to_take: fdaData.dosage || 'We do not have enough reliable information for this section.',
          warnings: fdaData.warnings || 'We do not have enough reliable information for this section. Consult a professional.',
          side_effects: fdaData.side_effects || 'We do not have enough reliable information for this section.',
        };
        aiProvider = 'Fallback (Manual)';
      }
    }

    if (!summary) {
      throw new Error('Summary generation failed in all stages');
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
      ai_provider: aiProvider,
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
 
    let summary: AISummary | null = null;
    let aiProvider = 'None';

    try {
      console.log('[ELI12] Attempting DeepSeek...');
      summary = await deepseekService.generateSummary(drug_data, true);
      aiProvider = 'DeepSeek';
    } catch (dsError: any) {
      console.warn(`[ELI12] DeepSeek failed: ${dsError.message}`);
      try {
        console.log('[ELI12] Attempting Gemini failover...');
        summary = await geminiService.generateSummary(drug_data, true);
        aiProvider = 'Gemini';
      } catch (gemError: any) {
        console.error(`[ELI12] Gemini failed: ${gemError.message}`);
        summary = {
          what_it_does: drug_data.indications || 'We do not have enough reliable information for this section.',
          how_to_take: drug_data.dosage || 'We do not have enough reliable information for this section.',
          warnings: drug_data.warnings || 'We do not have enough reliable information for this section.',
          side_effects: drug_data.side_effects || 'We do not have enough reliable information for this section.',
        };
        aiProvider = 'Fallback (Manual)';
      }
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
      ai_provider: aiProvider,
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
