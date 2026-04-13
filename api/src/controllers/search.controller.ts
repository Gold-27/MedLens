import { Request, Response } from 'express';
import { OpenFDAService, NormalizedDrugData } from '../services/openfda';
import { DeepSeekService } from '../services/deepseek';



export interface SearchResponse {
  drug_name: string;
  source: string;
  summary: {
    what_it_does: string | null;
    how_to_take: string | null;
    warnings: string | null;
    side_effects: string | null;
  };
  eli12: {
    enabled: boolean;
    content: string | null;
  };
}

export const searchMedication = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`Searching for medication: ${query}`);
    
    // Step 1: Fetch data from OpenFDA
    const normalizedData = await new OpenFDAService().searchDrug(query.trim());
    
    if (!normalizedData) {
      return res.status(404).json({ 
        error: 'Medication not found',
        message: 'We could not find this medication in our database. Please check the spelling or try another name.'
      });
    }

    // Step 2: Generate AI summary
    let summary;
    try {
      const deepseekResponse = await deepseekService.generateSummary(normalizedData);
      summary = deepseekResponse.summary;
    } catch (aiError) {
      console.warn('AI summary generation failed, using raw data:', aiError);
      // Fallback to raw data
      summary = {
        whatItDoes: normalizedData.indications || null,
        howToTake: normalizedData.dosage || null,
        warnings: normalizedData.warnings || null,
        sideEffects: normalizedData.sideEffects || null,
      };
    }

    // Step 3: Generate ELI12 summary (optional, can be lazy-loaded)
    let eli12Content = null;
    const eli12Enabled = req.body.eli12 === true;
    
    if (eli12Enabled) {
      try {
        const eli12Summary = await deepseekService.generateELI12(normalizedData);
        eli12Content = JSON.stringify(eli12Summary);
      } catch (eli12Error) {
        console.warn('ELI12 generation failed:', eli12Error);
        // Keep eli12Content as null
      }
    }

    // Step 4: Construct response
    const response: SearchResponse = {
      drug_name: normalizedData.drugName,
      source: 'OpenFDA',
      summary: {
        what_it_does: summary.whatItDoes || null,
        how_to_take: summary.howToTake || null,
        warnings: summary.warnings || null,
        side_effects: summary.sideEffects || null,
      },
      eli12: {
        enabled: eli12Enabled,
        content: eli12Content,
      },
    };

    // Step 5: Validate at least one section has content
    const hasContent = Object.values(response.summary).some(value => value !== null);
    if (!hasContent) {
      return res.status(404).json({
        error: 'Insufficient data',
        message: 'We found this medication but do not have enough reliable information to generate a summary.'
      });
    }

    res.json(response);
  } catch (error: any) {
    console.error('Search controller error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Something went wrong. Please try again later.'
    });
  }
};

export const toggleELI12 = async (req: Request, res: Response) => {
  try {
    const { drug_data } = req.body;
    
    if (!drug_data) {
      return res.status(400).json({ error: 'Drug data is required' });
    }

    // Generate ELI12 version of the provided drug data
    const eli12Summary = await deepseekService.generateELI12(drug_data);
    
    res.json({
      eli12: {
        enabled: true,
        content: JSON.stringify(eli12Summary),
      },
    });
  } catch (error: any) {
    console.error('ELI12 toggle error:', error);
    res.status(500).json({ error: 'ELI12 generation failed' });
  }
};