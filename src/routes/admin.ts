import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get admin dashboard
router.get('/dashboard', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const stats = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETED' }
    });

    res.json({ success: true, data: { totalRevenue: stats._sum.amount || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
  }
});

export default router;