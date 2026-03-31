import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Error:', err.message);

  if (err.name === 'MulterError') {
    res.status(400).json({ error: `Upload error: ${err.message}` });
    return;
  }

  if (err.name === 'ZodError') {
    res.status(400).json({ error: 'Validation error', details: err });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
}
