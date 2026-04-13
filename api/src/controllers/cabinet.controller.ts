import { Request, Response } from 'express';
import { SupabaseService } from '../services/supabase.service';

const supabaseService = new SupabaseService();

export const saveCabinetItem = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { drug_name, drug_key, source } = req.body;
    
    if (!drug_name || !drug_key) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'drug_name and drug_key are required'
      });
    }

    const cabinetItem = await supabaseService.saveCabinetItem({
      userId: user.id,
      drugName: drug_name,
      drugKey: drug_key,
      source: source || 'OpenFDA',
    });

    res.json({
      success: true,
      item: cabinetItem,
    });
  } catch (error: any) {
    console.error('Save cabinet item error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to save medication to cabinet'
    });
  }
};

export const getCabinetItems = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const items = await supabaseService.getCabinetItems(user.id);
    
    res.json({
      items,
      count: items.length,
    });
  } catch (error: any) {
    console.error('Get cabinet items error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch cabinet items'
    });
  }
};

export const deleteCabinetItem = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const drugKey = req.params.drugKey as string;
    
    if (!drugKey) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'drugKey is required'
      });
    }

    await supabaseService.deleteCabinetItem(user.id, drugKey);
    
    res.json({
      success: true,
      message: 'Medication removed from cabinet',
    });
  } catch (error: any) {
    console.error('Delete cabinet item error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to delete medication from cabinet'
    });
  }
};