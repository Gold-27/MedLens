import { Request, Response } from 'express';
import openFDAService from '../services/openfda.service';
import deepseekService, { AISummary } from '../services/deepseek.service';
import geminiService from '../services/gemini.service';

// In-memory cache for medication summaries
const searchCache = new Map<string, any>();

export const searchMedication = async (req: Request, res: Response) => {
  const { query, eli12 } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Valid search query string is required' });
  }

  if (query.trim().length > 100) {
    return res.status(400).json({ error: 'Search query exceeds the maximum allowed length (100 characters)' });
  }

  try {
    console.log(`[Search] Query: ${query}, ELI12: ${eli12}`);

    const cacheKey = `v2_${query.toLowerCase().trim()}_${eli12 ? 'eli' : 'std'}`;
    if (searchCache.has(cacheKey)) {
      console.log(`[Search] Cache hit for: ${cacheKey}`);
      return res.json(searchCache.get(cacheKey));
    }

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
    let layer1: AISummary | null = null;
    let layer2: AISummary | null = null;
    let aiProvider = 'None';

    // Attempt 1: DeepSeek
    try {
      console.log('[Search] Attempting DeepSeek Layer 1...');
      layer1 = await deepseekService.generateSummary(fdaData);
      aiProvider = 'DeepSeek';
    } catch (dsError: any) {
      console.warn(`[Search] DeepSeek Layer 1 failed: ${dsError.message}`);
      
      // Attempt 2: Gemini Failover
      try {
        console.log('[Search] Attempting Gemini failover Layer 1...');
        layer1 = await geminiService.generateSummary(fdaData);
        aiProvider = 'Gemini';
      } catch (gemError: any) {
        console.error(`[Search] Gemini Layer 1 also failed: ${gemError.message}`);
        
        // Final Fallback: Safe Mode (Raw Data)
        layer1 = {
          what_it_does: fdaData.indications || 'Information not available.',
          how_to_take: fdaData.dosage || 'Information not available.',
          warnings: fdaData.warnings || 'Information not available.',
          side_effects: fdaData.side_effects || 'Information not available.',
        };
        aiProvider = 'Fallback (Raw FDA Data)';
        console.log('[Search] All AI engines failed. Using Raw FDA fallback.');
      }
    }

    if (!layer1) {
      throw new Error('Summary generation failed in all stages');
    }

    // Stage 3: Validate AI output — ensure all required keys are present
    const validatedSummary: AISummary = {
      what_it_does: layer1.what_it_does || 'We do not have enough reliable information for this section.',
      how_to_take: layer1.how_to_take || 'We do not have enough reliable information for this section.',
      warnings: layer1.warnings || 'We do not have enough reliable information for this section.',
      side_effects: layer1.side_effects || 'We do not have enough reliable information for this section.',
    };

    // Stage 4: Return structured response (including normalized data for ELI12 re-use)
    console.log('[Search] Returning success response');
    const response = {
      drug_name: fdaData.drug_name,
      source: 'OpenFDA',
      ai_provider: aiProvider,
      data: fdaData,
      summary: validatedSummary,
      eli12: {
        enabled: false,
        content: null,
      },
      disclaimer: 'MedQuire simplifies medical information for understanding. It does not replace professional medical advice.',
    };

    // Save to cache
    searchCache.set(cacheKey, response);
    
    return res.json(response);

  } catch (error: any) {
    console.error('[Search] Error caught in controller:', error);
    return res.status(500).json({
      error: 'Failed to process medication data',
      message: error.message,
    });
  }
};

export const generateELI12 = async (req: Request, res: Response) => {
    // Acceptance: Accept drug_data (raw) OR summary (current Layer 1)
    const { drug_data, current_summary } = req.body;

    if (!drug_data && !current_summary) {
      return res.status(400).json({ error: 'drug_data or current_summary is required' });
    }

    try {
      console.log(`[ELI12] Generating Layer 2 summary...`);
   
      let summary: AISummary | null = null;
      let aiProvider = 'None';

      // Attempt 1: Use current_summary if available (Faster, follows Layer 2 logic)
      try {
        if (current_summary) {
          console.log('[ELI12] Simplifying existing summary via DeepSeek...');
          summary = await deepseekService.generateELI12(current_summary);
          aiProvider = 'DeepSeek (Layer 2)';
        } else {
          // Fallback to Layer 1 -> Layer 2 chain if only drug_data provided
          console.log('[ELI12] Chaining Layer 1 -> Layer 2 via DeepSeek...');
          const layer1 = await deepseekService.generateSummary(drug_data);
          summary = await deepseekService.generateELI12(layer1);
          aiProvider = 'DeepSeek (Chain)';
        }
      } catch (dsError: any) {
        console.warn(`[ELI12] DeepSeek failed: ${dsError.message}`);
        try {
          if (current_summary) {
            summary = await geminiService.generateELI12(current_summary);
            aiProvider = 'Gemini (Layer 2)';
          } else {
            const layer1 = await geminiService.generateSummary(drug_data);
            summary = await geminiService.generateELI12(layer1);
            aiProvider = 'Gemini (Chain)';
          }
        } catch (gemError: any) {
          console.error(`[ELI12] Gemini failed: ${gemError.message}`);
          // Safe mode fallback - pass empty or raw data, not the "We do not have enough" message
          summary = current_summary || {
            what_it_does: drug_data?.indications || '',
            how_to_take: drug_data?.dosage || '',
            warnings: drug_data?.warnings || '',
            side_effects: drug_data?.side_effects || '',
          };
          aiProvider = 'Fallback';
        }
      }

    if (!summary) {
      throw new Error('Summary generation failed in all stages');
    }

    const validatedSummary: AISummary = {
      what_it_does: summary.what_it_does || 'We do not have enough reliable information for this section.',
      how_to_take: summary.how_to_take || 'We do not have enough reliable information for this section.',
      warnings: summary.warnings || 'We do not have enough reliable information for this section.',
      side_effects: summary.side_effects || 'We do not have enough reliable information for this section.',
    };

    return res.json({
      drug_name: drug_data?.drug_name || 'Medication',
      source: 'OpenFDA',
      ai_provider: aiProvider,
      data: drug_data,
      summary: validatedSummary,
      eli12: {
        enabled: true,
        content: JSON.stringify(validatedSummary),
      },
      disclaimer: 'MedQuire simplifies medical information for understanding. It does not replace professional medical advice.',
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

export const transcribeAudio = async (req: Request, res: Response) => {
  const { audio, mimeType } = req.body;

  if (!audio) {
    return res.status(400).json({ error: 'Audio data is required' });
  }

  try {
    console.log(`[Transcription] Request received, mimeType: ${mimeType || 'unknown'}, data size: ${Math.round(audio.length / 1024)}KB`);
    const startTime = Date.now();
    
    const text = await geminiService.transcribeAudio(audio, mimeType);
    
    const duration = Date.now() - startTime;
    console.log(`[Transcription] Success in ${duration}ms: "${text}"`);
    
    res.json({ text });
  } catch (error: any) {
    console.error('[Transcription] Error:', error.message);
    res.status(500).json({ error: 'Audio transcription failed' });
  }
};
