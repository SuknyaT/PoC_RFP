import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import * as companyProfileService from '../services/companyProfile.service.js';

export async function getCompanyProfile(_req: AuthRequest, res: Response) {
  try {
    const profile = await companyProfileService.getCompanyProfile();
    if (!profile) {
      return res.json(null);
    }
    res.json(profile);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get company profile';
    res.status(500).json({ error: message });
  }
}

export async function upsertCompanyProfile(req: AuthRequest, res: Response) {
  try {
    const profile = await companyProfileService.upsertCompanyProfile(req.body);
    res.json(profile);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save company profile';
    res.status(500).json({ error: message });
  }
}

export async function deleteCompanyProfile(_req: AuthRequest, res: Response) {
  try {
    await companyProfileService.deleteCompanyProfile();
    res.status(204).send();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete company profile';
    res.status(500).json({ error: message });
  }
}
