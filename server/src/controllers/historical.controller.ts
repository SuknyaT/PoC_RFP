import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import * as historicalService from '../services/historical.service.js';
import { getParam } from '../utils/params.js';

export async function listBids(req: AuthRequest, res: Response) {
  try {
    const { industry, outcome } = req.query;
    const bids = await historicalService.listHistoricalBids({
      industry: industry as string | undefined,
      outcome: outcome as string | undefined,
    });
    res.json(bids);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list bids';
    res.status(500).json({ error: message });
  }
}

export async function createBid(req: AuthRequest, res: Response) {
  try {
    const bid = await historicalService.createHistoricalBid(req.body);
    res.status(201).json(bid);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create bid';
    res.status(500).json({ error: message });
  }
}

export async function updateBid(req: AuthRequest, res: Response) {
  try {
    const bid = await historicalService.updateHistoricalBid(getParam(req.params.id), req.body);
    res.json(bid);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update bid';
    res.status(500).json({ error: message });
  }
}

export async function deleteBid(req: AuthRequest, res: Response) {
  try {
    await historicalService.deleteHistoricalBid(getParam(req.params.id));
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Bid not found' });
  }
}

export async function findSimilarBids(req: AuthRequest, res: Response) {
  try {
    const bids = await historicalService.findSimilarBids(getParam(req.params.rfpId));
    res.json(bids);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to find similar bids';
    res.status(500).json({ error: message });
  }
}
