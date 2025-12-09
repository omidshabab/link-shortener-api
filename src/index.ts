import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import adminRoutes from './routes/admin';
import linksRoutes from './routes/links';
import { prisma } from './lib/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin routes (API key management)
app.use('/api/admin', adminRoutes);

// Link management routes
app.use('/api', linksRoutes);

// Redirect short links (this should be last)
app.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Validate short code format
    if (shortCode.length > 5 || !/^[A-Za-z0-9]+$/.test(shortCode)) {
      return res.status(404).json({ error: 'Invalid short code' });
    }

    const link = await prisma.link.findUnique({
      where: { shortCode },
    });

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Increment click counter
    await prisma.link.update({
      where: { shortCode },
      data: { clicks: { increment: 1 } },
    });

    // Redirect to original URL
    return res.redirect(301, link.originalUrl);
  } catch (error) {
    console.error('Error redirecting:', error);
    return res.status(500).json({ error: 'Failed to redirect' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Link Shortener API running on port ${PORT}`);
  console.log(`📝 Custom domain: ${process.env.CUSTOM_DOMAIN || 'Not set'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await prisma.$disconnect();
  process.exit(0);
});