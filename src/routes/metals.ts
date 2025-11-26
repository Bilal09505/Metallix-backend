import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Get all active metals with current rates
router.get('/', async (req, res) => {
  try {
    const metals = await prisma.metal.findMany({
      where: { isActive: true },
      include: {
        rateHistory: {
          orderBy: { date: 'desc' },
          take: 30 // Last 30 days history
        }
      }
    });

    res.json({ success: true, data: metals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch metals' });
  }
});

// Update metal rates (Admin only)
router.put('/rates', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const { rates } = req.body; // [{ metalId, newRate }]

    const updates = rates.map((rate: any) => 
      prisma.metal.update({
        where: { id: rate.metalId },
        data: { 
          currentRate: rate.newRate 
        }
      })
    );

    await prisma.$transaction(updates);

    // Create rate history entries
    const historyEntries = rates.map((rate: any) =>
      prisma.rateHistory.create({
        data: {
          metalId: rate.metalId,
          rate: rate.newRate
        }
      })
    );

    await prisma.$transaction(historyEntries);

    res.json({ success: true, message: 'Rates updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update rates' });
  }
});

export default router;