import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import * as rfpService from '../services/rfp.service.js';
import { getParam } from '../utils/params.js';

export async function createRfp(req: AuthRequest, res: Response) {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'File is required' });
      return;
    }
    const rfp = await rfpService.createRfp(req.file, req.userId!);
    res.status(201).json(rfp);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create RFP';
    res.status(500).json({ error: message });
  }
}

export async function parseRfp(req: AuthRequest, res: Response) {
  try {
    const rfp = await rfpService.parseRfp(getParam(req.params.id));
    res.json(rfp);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to parse RFP';
    res.status(500).json({ error: message });
  }
}

export async function listRfps(req: AuthRequest, res: Response) {
  try {
    const { status, industry } = req.query;
    const rfps = await rfpService.listRfps({
      status: status as string | undefined,
      industry: industry as string | undefined,
    });
    res.json(rfps);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list RFPs';
    res.status(500).json({ error: message });
  }
}

export async function getRfp(req: AuthRequest, res: Response) {
  try {
    const rfp = await rfpService.getRfpById(getParam(req.params.id));
    res.json(rfp);
  } catch {
    res.status(404).json({ error: 'RFP not found' });
  }
}

export async function updateRfp(req: AuthRequest, res: Response) {
  try {
    const rfp = await rfpService.updateRfp(getParam(req.params.id), req.body);
    res.json(rfp);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update RFP';
    res.status(500).json({ error: message });
  }
}

export async function deleteRfp(req: AuthRequest, res: Response) {
  try {
    await rfpService.deleteRfp(getParam(req.params.id));
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'RFP not found' });
  }
}

export async function analyzeScoring(req: AuthRequest, res: Response) {
  try {
    const strategies = await rfpService.analyzeScoringCriteria(getParam(req.params.id));
    res.json(strategies);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to analyze scoring';
    res.status(500).json({ error: message });
  }
}
