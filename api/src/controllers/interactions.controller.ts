import { Request, Response } from 'express';
import { OpenFDAService } from '../services/openfda';

const openfdaService = new OpenFDAService();

export interface InteractionResponse {
  status: 'potential_interaction' | 'insufficient_data';
  message: string;
  details?: {
    interactions: Array<{
      drugKey: string;
      interactions: string[];
    }>;
  };
}

export const checkInteractions = async (req: Request, res: Response) => {
  try {
    const { drug_keys } = req.body;
    
    if (!drug_keys || !Array.isArray(drug_keys) || drug_keys.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'drug_keys array is required with at least one drug key'
      });
    }

    console.log(`Checking interactions for drugs: ${drug_keys.join(', ')}`);
    
    const result = await openfdaService.getDrugInteractions(drug_keys);
    
    // Construct safe response message
    let message: string;
    if (result.status === 'potential_interaction') {
      message = 'Potential drug interaction detected. Consult a healthcare professional before taking these medications together.';
    } else {
      message = 'We cannot confirm whether these medications interact. Consult a healthcare professional for personalized advice.';
    }

    const response: InteractionResponse = {
      status: result.status,
      message,
      details: result.interactions.length > 0 ? { interactions: result.interactions } : undefined,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Interactions controller error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Something went wrong. Please try again later.'
    });
  }
};