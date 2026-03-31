import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import * as competitorService from '../services/competitor.service.js';
import { getParam } from '../utils/params.js';

export async function listCompetitors(_req: AuthRequest, res: Response) {
  try {
    const competitors = await competitorService.listCompetitors();
    res.json(competitors);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list competitors';
    res.status(500).json({ error: message });
  }
}

export async function getCompetitor(req: AuthRequest, res: Response) {
  try {
    const competitor = await competitorService.getCompetitor(getParam(req.params.id));
    res.json(competitor);
  } catch {
    res.status(404).json({ error: 'Competitor not found' });
  }
}

export async function createCompetitor(req: AuthRequest, res: Response) {
  try {
    const competitor = await competitorService.createCompetitor(req.body);
    res.status(201).json(competitor);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create competitor';
    res.status(500).json({ error: message });
  }
}

export async function updateCompetitor(req: AuthRequest, res: Response) {
  try {
    const competitor = await competitorService.updateCompetitor(getParam(req.params.id), req.body);
    res.json(competitor);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update competitor';
    res.status(500).json({ error: message });
  }
}

export async function deleteCompetitor(req: AuthRequest, res: Response) {
  try {
    await competitorService.deleteCompetitor(getParam(req.params.id));
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Competitor not found' });
  }
}

export async function linkCompetitors(req: AuthRequest, res: Response) {
  try {
    const { competitorIds } = req.body;
    const result = await competitorService.linkCompetitorToRfp(getParam(req.params.id), competitorIds);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to link competitors';
    res.status(500).json({ error: message });
  }
}

export async function getRfpCompetitors(req: AuthRequest, res: Response) {
  try {
    const competitors = await competitorService.getRfpCompetitors(getParam(req.params.id));
    res.json(competitors);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get RFP competitors';
    res.status(500).json({ error: message });
  }
}

export async function discoverCompetitors(req: AuthRequest, res: Response) {
  try {
    const suggestions = await competitorService.discoverCompetitors(getParam(req.params.id));
    res.json(suggestions);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to discover competitors';
    res.status(500).json({ error: message });
  }
}

export async function addSuggestedCompetitor(req: AuthRequest, res: Response) {
  try {
    const competitor = await competitorService.addSuggestedCompetitor(req.body);
    res.status(201).json(competitor);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add competitor';
    res.status(500).json({ error: message });
  }
}
