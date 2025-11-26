import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all active offers
router.get('/', async (req, res) => {
  try {
    const offers = await prisma.offer.findMany({
      where: { 
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      include: {
        metal: { select: { name: true, symbol: true, currentRate: true } }
      }
    });

    res.json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch offers' });
  }
});

export default router;