import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }

    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
    });

    if (!key || !key.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive API key' });
    }

    // Attach API key to request for later use
    (req as any).apiKey = key;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

export const authenticateMasterKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const masterKey = req.headers['x-master-key'] as string;

  if (!masterKey || masterKey !== process.env.MASTER_API_KEY) {
    return res.status(401).json({ error: 'Invalid master key' });
  }

  next();
};