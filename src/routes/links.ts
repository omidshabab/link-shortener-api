import { Router } from 'express';
import { generateShortCode } from '../utils/shortcode';
import { authenticateApiKey } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

// Create short link
router.post('/shorten', authenticateApiKey, async (req, res) => {
  try {
    const { url, customCode } = req.body;
    const apiKey = (req as any).apiKey;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Generate or use custom short code
    let shortCode = customCode;
    
    if (customCode) {
      // Validate custom code
      if (customCode.length > 5) {
        return res.status(400).json({ error: 'Custom code must be 5 characters or less' });
      }
      if (!/^[A-Za-z0-9]+$/.test(customCode)) {
        return res.status(400).json({ error: 'Custom code must be alphanumeric' });
      }

      // Check if exists
      const existing = await prisma.link.findUnique({
        where: { shortCode: customCode },
      });

      if (existing) {
        return res.status(409).json({ error: 'Custom code already in use' });
      }
    } else {
      // Generate unique short code
      let attempts = 0;
      while (attempts < 10) {
        shortCode = await generateShortCode();
        const existing = await prisma.link.findUnique({
          where: { shortCode },
        });
        if (!existing) break;
        attempts++;
      }

      if (attempts === 10) {
        return res.status(500).json({ error: 'Failed to generate unique code' });
      }
    }

    const link = await prisma.link.create({
      data: {
        shortCode: shortCode!,
        originalUrl: url,
        apiKeyId: apiKey.id,
      },
    });

    const customDomain = process.env.CUSTOM_DOMAIN || `http://localhost:${process.env.PORT || 3000}`;
    const shortUrl = `${customDomain}/${link.shortCode}`;

    return res.status(201).json({
      id: link.id,
      shortCode: link.shortCode,
      shortUrl,
      originalUrl: link.originalUrl,
      clicks: link.clicks,
      createdAt: link.createdAt,
    });
  } catch (error) {
    console.error('Error creating short link:', error);
    return res.status(500).json({ error: 'Failed to create short link' });
  }
});

// Get link stats
router.get('/stats/:shortCode', authenticateApiKey, async (req, res) => {
  try {
    const { shortCode } = req.params;

    const link = await prisma.link.findUnique({
      where: { shortCode },
      select: {
        id: true,
        shortCode: true,
        originalUrl: true,
        clicks: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const customDomain = process.env.CUSTOM_DOMAIN || `http://localhost:${process.env.PORT || 3000}`;
    const shortUrl = `${customDomain}/${link.shortCode}`;

    return res.json({ ...link, shortUrl });
  } catch (error) {
    console.error('Error fetching link stats:', error);
    return res.status(500).json({ error: 'Failed to fetch link stats' });
  }
});

// List all links for API key
router.get('/links', authenticateApiKey, async (req, res) => {
  try {
    const apiKey = (req as any).apiKey;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [links, total] = await Promise.all([
      prisma.link.findMany({
        where: { apiKeyId: apiKey.id },
        select: {
          id: true,
          shortCode: true,
          originalUrl: true,
          clicks: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.link.count({ where: { apiKeyId: apiKey.id } }),
    ]);

    const customDomain = process.env.CUSTOM_DOMAIN || `http://localhost:${process.env.PORT || 3000}`;
    const linksWithUrl = links.map(link => ({
      ...link,
      shortUrl: `${customDomain}/${link.shortCode}`,
    }));

    return res.json({
      links: linksWithUrl,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching links:', error);
    return res.status(500).json({ error: 'Failed to fetch links' });
  }
});

// Delete link
router.delete('/:shortCode', authenticateApiKey, async (req, res) => {
  try {
    const { shortCode } = req.params;
    const apiKey = (req as any).apiKey;

    const link = await prisma.link.findUnique({
      where: { shortCode },
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    if (link.apiKeyId !== apiKey.id) {
      return res.status(403).json({ error: 'Not authorized to delete this link' });
    }

    await prisma.link.delete({
      where: { shortCode },
    });

    return res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Error deleting link:', error);
    return res.status(500).json({ error: 'Failed to delete link' });
  }
});

export default router;