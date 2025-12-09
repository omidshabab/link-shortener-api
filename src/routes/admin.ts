import { randomBytes } from 'crypto';
import { Router } from 'express';
import { authenticateMasterKey } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

// Generate new API key
router.post('/keys', authenticateMasterKey, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const apiKey = await prisma.apiKey.create({
      data: {
        // 24 random bytes → 32 base64url chars, prefixed with sk_
        key: `sk_${randomBytes(24).toString('base64url')}`,
        name,
      },
    });

    return res.status(201).json({
      id: apiKey.id,
      key: apiKey.key,
      name: apiKey.name,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt,
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return res.status(500).json({ error: 'Failed to create API key' });
  }
});

// List all API keys
router.get('/keys', authenticateMasterKey, async (req, res) => {
  try {
    const keys = await prisma.apiKey.findMany({
      select: {
        id: true,
        key: true,
        name: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { links: true },
        },
      },
    });

    return res.json({ keys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Deactivate API key
router.patch('/keys/:id/deactivate', authenticateMasterKey, async (req, res) => {
  try {
    const { id } = req.params;

    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });

    return res.json({
      id: apiKey.id,
      name: apiKey.name,
      isActive: apiKey.isActive,
    });
  } catch (error) {
    console.error('Error deactivating API key:', error);
    return res.status(500).json({ error: 'Failed to deactivate API key' });
  }
});

// Delete API key
router.delete('/keys/:id', authenticateMasterKey, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.apiKey.delete({
      where: { id },
    });

    return res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return res.status(500).json({ error: 'Failed to delete API key' });
  }
});

export default router;