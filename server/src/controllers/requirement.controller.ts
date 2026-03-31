import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import * as requirementService from '../services/requirement.service.js';
import { getParam } from '../utils/params.js';

export async function getRequirements(req: AuthRequest, res: Response) {
  try {
    const { status, category } = req.query;
    const requirements = await requirementService.getRequirements(
      getParam(req.params.id),
      { status: status as string, category: category as string }
    );
    res.json(requirements);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get requirements';
    res.status(500).json({ error: message });
  }
}

export async function extractRequirements(req: AuthRequest, res: Response) {
  try {
    const requirements = await requirementService.extractAndSaveRequirements(getParam(req.params.id));
    res.json(requirements);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to extract requirements';
    res.status(500).json({ error: message });
  }
}

export async function updateRequirement(req: AuthRequest, res: Response) {
  try {
    const requirement = await requirementService.updateRequirement(getParam(req.params.rid), req.body);
    res.json(requirement);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update requirement';
    res.status(500).json({ error: message });
  }
}
