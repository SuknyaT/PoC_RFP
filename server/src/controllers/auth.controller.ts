import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { AuthRequest } from '../middleware/auth.js';

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }
    const result = await authService.register(email, password, name);
    res.status(201).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ error: message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const user = await authService.getMe(req.userId!);
    res.json(user);
  } catch {
    res.status(404).json({ error: 'User not found' });
  }
}
