import { Request, Response } from 'express';
import { aiService } from '../services/aiService';

export const generateSequence = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prospect_url, tov_config, company_context, sequence_length } = req.body;

    if (!prospect_url || !company_context) {
      res.status(400).json({ success: false, error: 'prospect_url and company_context required' });
      return;
    }

    const result = await aiService.generateSequence(prospect_url, tov_config, company_context, sequence_length || 3);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal error' });
  }
};

export const status = async (req: Request, res: Response): Promise<void> => {
  const configured = aiService.isConfigured();
  res.json({
    success: true,
    data: { configured, status: configured ? 'ready' : 'not_configured' }
  });
};